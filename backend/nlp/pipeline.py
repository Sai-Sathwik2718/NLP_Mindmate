import re
import math
import logging
import datetime
import unicodedata
from collections import Counter
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# Try downloading NLTK dependencies with safety checks
try:
    import nltk
    nltk.download("stopwords", quiet=True)
    nltk.download("punkt", quiet=True)
    nltk.download("wordnet", quiet=True)
    nltk.download("averaged_perceptron_tagger", quiet=True)
    nltk.download("maxent_ne_chunker", quiet=True)
    nltk.download("words", quiet=True)
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    from nltk.stem import WordNetLemmatizer
    NLTK_AVAILABLE = True
except Exception as e:
    logging.warning(f"NLTK datasets not fully downloaded, using fallback text processing. Detail: {e}")
    NLTK_AVAILABLE = False

# Try importing spaCy
try:
    import spacy
    try:
        spacy_nlp = spacy.load("en_core_web_sm")
        SPACY_AVAILABLE = True
    except Exception:
        # If model is not found, attempt to disable or load blank
        SPACY_AVAILABLE = False
except ImportError:
    SPACY_AVAILABLE = False

# Try importing HuggingFace transformers for advanced sentiment/emotion
try:
    from transformers import pipeline as hf_pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    logging.warning("HuggingFace 'transformers' or 'torch' not installed. Lexicon mode active.")
    TRANSFORMERS_AVAILABLE = False

# Fallback stopword list for English
FALLBACK_STOPWORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
    "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
    "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", 
    "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
    "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
    "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", 
    "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", 
    "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", 
    "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", 
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", 
    "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
}

# Emotion Lexicon for fallback mode
EMOTION_LEXICON = {
    "happy": ["happy", "joy", "excited", "cheerful", "glad", "wonderful", "great", "smile", "love", "good", "pleased", "content", "delighted"],
    "sad": ["sad", "unhappy", "cry", "grief", "sorrow", "tear", "down", "blue", "heartbroken", "hurt", "miserable", "gloomy", "heavy"],
    "angry": ["angry", "mad", "furious", "annoyed", "irritated", "hate", "rage", "pissed", "frustrated", "resent", "offended"],
    "anxious": ["anxious", "worry", "panic", "nervous", "scared", "fear", "dread", "shaking", "uneasy", "tense", "apprehensive"],
    "depressed": ["depressed", "hopeless", "worthless", "empty", "numb", "darkness", "misery", "giving up", "despair", "exhausted", "gloomy"],
    "fear": ["afraid", "scared", "terror", "frightened", "fear", "creepy", "spooked", "panic"],
    "confused": ["confused", "lost", "uncertain", "doubt", "puzzled", "stuck", "what to do", "undecided", "mixed feelings"],
    "lonely": ["lonely", "alone", "isolated", "no friends", "ignored", "solitude", "miss someone", "nobody"],
    "excited": ["excited", "hype", "thrilled", "eager", "awesome", "fantastic", "cant wait", "amazing", "energetic"],
}

# Intent training phrases for similarity matcher
INTENT_DATASET = {
    "Greetings": [
        "hello", "hi", "hey", "good morning", "good afternoon", "good evening", "anyone there", "greetings"
    ],
    "Stress": [
        "stressed", "stress", "feeling overwhelmed", "burnout", "too much pressure", "can't handle this", "i feel suffocated", "under pressure"
    ],
    "Anxiety": [
        "anxious", "anxiety", "panic attack", "heart racing", "worrying", "scared", "fearful", "feeling tense", "freaking out"
    ],
    "Depression": [
        "depressed", "depression", "sadness", "feeling down", "hopeless", "can't get out of bed", "crying all day", "worthless"
    ],
    "Motivation": [
        "motivate me", "inspire me", "need motivation", "give up", "what is the point", "discouraged", "need encouragement", "feeling lazy"
    ],
    "Study Pressure": [
        "studies are hard", "syllabus", "failing my classes", "college workload", "gpa is low", "academic pressure", "school stress"
    ],
    "Exam Stress": [
        "exam tomorrow", "test anxiety", "study for exam", "fail test", "midterms", "finals", "revision stress"
    ],
    "Homesickness": [
        "miss my family", "homesick", "want to go home", "missing parents", "new city stress", "away from home"
    ],
    "Friendship": [
        "friend problems", "lonely at college", "making friends", "fights with friends", "no friends", "social anxiety"
    ],
    "Loneliness": [
        "lonely", "no one to talk to", "all alone", "feeling isolated", "nobody cares", "left out"
    ],
    "Relationship": [
        "breakup", "boyfriend", "girlfriend", "heartbroken", "relationship issues", "fight with partner", "love troubles"
    ],
    "Sleep Issues": [
        "insomnia", "cannot sleep", "nightmares", "staying up late", "tired", "sleepy", "poor sleep"
    ],
    "Career Confusion": [
        "what major", "career choice", "job placement stress", "worried about future", "unemployed", "career path", "interview stress"
    ],
    "Self Improvement": [
        "better myself", "healthy habits", "journaling tips", "positive routine", "improve mental health", "meditation guide"
    ],
    "Emergency": [
        "suicide", "kill myself", "want to die", "self harm", "end my life", "harm myself", "don't want to live"
    ],
    "Goodbye": [
        "bye", "goodnight", "see you later", "goodbye", "talk to you tomorrow"
    ]
}

# Crisis terms for explicit regex override
CRISIS_REGEX = re.compile(
    r"\b(suicide|kill\s*myself|want\s*to\s*die|end\s*my\s*life|self\s*harm|harm\s*myself|cut\s*myself|slit\s*wrists|commit\s*suicide|don'?t\s*want\s*to\s*live|wanna\s*die)\b",
    re.IGNORECASE
)

# TF-IDF class built from scratch in pure Python for ultra-reliable calculations when libraries have issues
class SimpleTFIDF:
    def __init__(self):
        self.vocab = {}
        self.idf = {}
        self.documents = []
        self.doc_vectors = []

    def fit_transform(self, docs: List[str]):
        self.documents = docs
        # Build vocabulary
        all_words = []
        for doc in docs:
            words = doc.lower().split()
            all_words.extend(words)
        
        unique_words = sorted(list(set(all_words)))
        self.vocab = {word: i for i, word in enumerate(unique_words)}
        
        # Calculate IDF
        N = len(docs)
        for word in self.vocab:
            df = sum(1 for doc in docs if word in doc.lower().split())
            self.idf[word] = math.log((1 + N) / (1 + df)) + 1
            
        # Transform documents
        self.doc_vectors = [self.transform(doc) for doc in docs]
        return self.doc_vectors

    def transform(self, doc: str) -> np.ndarray:
        words = doc.lower().split()
        vector = np.zeros(len(self.vocab))
        if not words:
            return vector
            
        # Calculate TF
        tf = {}
        for word in words:
            if word in self.vocab:
                tf[word] = tf.get(word, 0) + 1
                
        for word, val in tf.items():
            vector[self.vocab[word]] = (val / len(words)) * self.idf[word]
            
        # Normalize
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector

    def cosine_similarity(self, v1: np.ndarray, v2: np.ndarray) -> float:
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        return float(dot_product / (norm_v1 * norm_v2))


class NLPPipeline:
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer() if NLTK_AVAILABLE else None
        
        # In-memory session context tracking
        self.session_memory = {}
        
        # Initialize Intent Classifier
        self.tfidf = SimpleTFIDF()
        self.intent_labels = []
        self.train_intent_classifier()
        
        # Initialize HF Pipelines (Lazy loading or fallbacks)
        self.emotion_pipeline = None
        self.sentiment_pipeline = None
        self.models_loaded = False

    def train_intent_classifier(self):
        """Train a lightweight cosine similarity TF-IDF intent classifier."""
        docs = []
        for intent, phrases in INTENT_DATASET.items():
            for phrase in phrases:
                docs.append(phrase)
                self.intent_labels.append(intent)
        self.tfidf.fit_transform(docs)

    def load_hf_models(self):
        """Loads Hugging Face transformers if available and not yet loaded."""
        if not TRANSFORMERS_AVAILABLE:
            return
        try:
            logging.info("Loading HuggingFace transformer models...")
            # Load sentiment pipeline
            self.sentiment_pipeline = hf_pipeline(
                "sentiment-analysis", 
                model=settings.SENTIMENT_MODEL,
                device=-1  # CPU mode
            )
            # Load emotion pipeline
            self.emotion_pipeline = hf_pipeline(
                "text-classification", 
                model=settings.EMOTION_MODEL,
                device=-1
            )
            self.models_loaded = True
            logging.info("HuggingFace model loading completed.")
        except Exception as e:
            logging.error(f"Failed to load HuggingFace models: {e}. Falling back to lexicon mode.")
            self.models_loaded = False

    def clean_text(self, text: str) -> str:
        """Applies Unicode normalization, lowercases text, strips HTML/markdown and handles punctuation."""
        if not text:
            return ""
        # Unicode normalization
        text = unicodedata.normalize("NFKD", text)
        text = text.lower().strip()
        # Remove simple HTML tags
        text = re.sub(r"<[^>]*>", "", text)
        # Keep alphanumeric, spaces and basic punctuation
        text = re.sub(r"[^a-zA-Z0-9\s\?\!\.\,]", "", text)
        return text

    def get_pos_tags(self, text: str) -> List[Tuple[str, str]]:
        """Extracts Part-Of-Speech (POS) tags using spaCy or NLTK fallbacks."""
        if SPACY_AVAILABLE:
            try:
                doc = spacy_nlp(text)
                return [(token.text, token.pos_) for token in doc]
            except Exception:
                pass
                
        if NLTK_AVAILABLE:
            try:
                tokens = word_tokenize(text)
                return nltk.pos_tag(tokens)
            except Exception:
                pass
                
        # Basic rule fallback
        tokens = text.split()
        res = []
        for t in tokens:
            tl = t.lower()
            if tl in ["am", "is", "are", "was", "were", "feel", "worry", "think", "want", "sleep", "can"]:
                res.append((t, "VERB"))
            elif tl in ["i", "me", "my", "you", "your", "he", "she", "they", "we", "us"]:
                res.append((t, "PRON"))
            elif tl in ["happy", "sad", "anxious", "stressed", "lonely", "good", "bad", "depressed"]:
                res.append((t, "ADJ"))
            else:
                res.append((t, "NOUN"))
        return res

    def get_named_entities(self, text: str) -> List[Tuple[str, str]]:
        """Extracts Named Entities using spaCy or NLTK fallbacks."""
        if SPACY_AVAILABLE:
            try:
                doc = spacy_nlp(text)
                return [(ent.text, ent.label_) for ent in doc.ents]
            except Exception:
                pass
                
        if NLTK_AVAILABLE:
            try:
                tokens = word_tokenize(text)
                tagged = nltk.pos_tag(tokens)
                chunks = nltk.ne_chunk(tagged)
                entities = []
                for chunk in chunks:
                    if hasattr(chunk, 'label'):
                        name = " ".join([c[0] for c in chunk])
                        entities.append((name, chunk.label()))
                return entities
            except Exception:
                pass
                
        entities = []
        words = text.split()
        for w in words:
            if w and w[0].isupper() and len(w) > 1:
                entities.append((w, "ENTITY"))
        return entities

    def update_memory(self, session_id: str, message: str, analysis: Dict[str, Any]):
        """Store analysis of message in memory to track state trends."""
        if not session_id:
            return
        if session_id not in self.session_memory:
            self.session_memory[session_id] = []
            
        self.session_memory[session_id].append({
            "message": message,
            "intent": analysis.get("intent"),
            "emotion": analysis.get("emotion"),
            "sentiment": analysis.get("sentiment"),
            "timestamp": datetime.datetime.utcnow()
        })
        if len(self.session_memory[session_id]) > 5:
            self.session_memory[session_id].pop(0)

    def get_context(self, session_id: str) -> Dict[str, Any]:
        """Gets aggregated context information for the session."""
        history = self.session_memory.get(session_id, [])
        if not history:
            return {"dominant_emotion": "neutral", "recent_intents": [], "stress_escalating": False}
            
        emotions = [h["emotion"] for h in history if h.get("emotion")]
        intents = [h["intent"] for h in history if h.get("intent")]
        
        stress_indicators = ["Stress", "Anxiety", "Depression", "Emergency", "Study Pressure", "Exam Stress"]
        recent_stress = sum(1 for h in history[-3:] if h.get("intent") in stress_indicators)
        
        dom_emotion = Counter(emotions).most_common(1)[0][0] if emotions else "neutral"
        
        return {
            "dominant_emotion": dom_emotion,
            "recent_intents": list(set(intents)),
            "stress_escalating": recent_stress >= 2
        }

    def preprocess(self, text: str) -> List[str]:
        """Cleans, tokenizes, removes stopwords, and lemmatizes input text."""
        cleaned = self.clean_text(text)
        
        # Tokenization
        if NLTK_AVAILABLE:
            try:
                tokens = word_tokenize(cleaned)
            except Exception:
                tokens = cleaned.split()
        else:
            tokens = cleaned.split()
            
        # Stopword removal and lemmatization
        stop_words = stopwords.words("english") if NLTK_AVAILABLE else FALLBACK_STOPWORDS
        
        processed_tokens = []
        for t in tokens:
            if t not in stop_words and len(t) > 1:
                if NLTK_AVAILABLE and self.lemmatizer:
                    try:
                        lemma = self.lemmatizer.lemmatize(t)
                    except Exception:
                        lemma = t
                else:
                    lemma = t
                processed_tokens.append(lemma)
                
        return processed_tokens

    def detect_sentiment(self, text: str) -> Tuple[str, float]:
        """
        Calculates Positive, Negative, or Neutral sentiment.
        Uses HF Transformer model if loaded; else uses lexical valence ratio fallback.
        """
        # Try Hugging Face first
        if self.models_loaded and self.sentiment_pipeline:
            try:
                result = self.sentiment_pipeline(text)[0]
                label = result["label"].upper()  # 'POSITIVE' or 'NEGATIVE'
                score = float(result["score"])
                # Map to target labels
                if label == "POSITIVE":
                    return "Positive", score
                elif label == "NEGATIVE":
                    return "Negative", score
            except Exception as e:
                logging.warning(f"HF Sentiment inference failed: {e}. Using fallback lexicon.")

        # Lexical Fallback Sentiment
        pos_words = {"good", "great", "happy", "love", "glad", "wonderful", "amazing", "best", "nice", "fine", "helpful", "better", "motivated", "excited"}
        neg_words = {"bad", "sad", "unhappy", "depressed", "hate", "angry", "worry", "afraid", "scared", "hurt", "pain", "hopeless", "lonely", "exhausted", "hard"}
        
        tokens = self.preprocess(text)
        if not tokens:
            return "Neutral", 0.99
            
        pos_count = sum(1 for t in tokens if t in pos_words)
        neg_count = sum(1 for t in tokens if t in neg_words)
        
        diff = pos_count - neg_count
        confidence = 0.5 + min(0.49, abs(diff) / (len(tokens) + 1))
        
        if diff > 0:
            return "Positive", float(confidence)
        elif diff < 0:
            return "Negative", float(confidence)
        else:
            return "Neutral", 0.75

    def detect_emotion(self, text: str) -> Tuple[str, float]:
        """
        Categorizes text into emotions: happy, sad, angry, anxious, depressed, fear, confused, lonely, excited, neutral.
        Uses HF DistilBERT-emotion if loaded; else runs lexicon check fallback.
        """
        # Try Hugging Face model
        if self.models_loaded and self.emotion_pipeline:
            try:
                result = self.emotion_pipeline(text)[0]
                label = result["label"].lower()  # joy, sadness, anger, fear, love, surprise
                score = float(result["score"])
                
                # Map HF labels to our target UI emotion categories
                mapping = {
                    "joy": "happy",
                    "sadness": "sad",
                    "anger": "angry",
                    "fear": "fear",
                    "love": "happy",
                    "surprise": "excited"
                }
                mapped_emotion = mapping.get(label, "neutral")
                
                # Adjust labels for anxiety/depression hints
                tokens_set = set(self.preprocess(text))
                if "anxious" in tokens_set or "panic" in tokens_set or "nervous" in tokens_set:
                    return "anxious", 0.90
                if "depressed" in tokens_set or "hopeless" in tokens_set or "worthless" in tokens_set:
                    return "depressed", 0.90
                    
                return mapped_emotion, score
            except Exception as e:
                logging.warning(f"HF Emotion inference failed: {e}. Using fallback lexicon.")

        # Lexical Fallback Emotion Analysis
        tokens = self.preprocess(text)
        if not tokens:
            return "neutral", 0.99

        scores = {emotion: 0 for emotion in EMOTION_LEXICON}
        for token in tokens:
            for emotion, keywords in EMOTION_LEXICON.items():
                if token in keywords:
                    scores[emotion] += 1
                    
        max_emotion = "neutral"
        max_score = 0
        for emotion, score in scores.items():
            if score > max_score:
                max_score = score
                max_emotion = emotion
                
        if max_score == 0:
            # Check secondary tokens for subtle cues
            cleaned_lower = text.lower()
            if any(w in cleaned_lower for w in ["worried", "worry", "panic", "anxious"]):
                return "anxious", 0.70
            if any(w in cleaned_lower for w in ["depressed", "empty", "hopeless"]):
                return "depressed", 0.70
            if any(w in cleaned_lower for w in ["alone", "lonely", "no one"]):
                return "lonely", 0.70
            return "neutral", 0.85
            
        confidence = float(0.5 + min(0.49, max_score / len(tokens)))
        return max_emotion, confidence

    def classify_intent(self, text: str) -> Tuple[str, float]:
        """
        Classifies intent using TF-IDF + Cosine Similarity.
        If confidence scores are below threshold, falls back to 'Unknown'.
        """
        # Hard regex check for immediate Emergency Intent
        if CRISIS_REGEX.search(text):
            return "Emergency", 1.0
            
        query_vector = self.tfidf.transform(text)
        similarities = []
        for doc_vector in self.tfidf.doc_vectors:
            sim = self.tfidf.cosine_similarity(query_vector, doc_vector)
            similarities.append(sim)
            
        if not similarities or max(similarities) < 0.18:
            return "Unknown", 0.0
            
        max_index = np.argmax(similarities)
        best_intent = self.intent_labels[max_index]
        confidence = float(similarities[max_index])
        
        return best_intent, confidence

    def check_crisis(self, text: str) -> bool:
        """Fast check to override normal responses in case of crisis terms."""
        return bool(CRISIS_REGEX.search(text))

    def extract_keywords(self, text: str, top_n: int = 5) -> List[str]:
        """Extracts top words in the document based on tf-idf score or frequency."""
        tokens = self.preprocess(text)
        if not tokens:
            return []
        # Calculate term frequency
        freq = {}
        for token in tokens:
            freq[token] = freq.get(token, 0) + 1
        sorted_tokens = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [t[0] for t in sorted_tokens[:top_n]]

    def analyze(self, text: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Runs the entire pipeline on input text, extracting all dimensions including POS, NER, and memory context."""
        is_crisis = self.check_crisis(text)
        
        # Override intent if crisis is detected
        if is_crisis:
            intent, intent_conf = "Emergency", 1.0
            sentiment, sentiment_conf = "Negative", 0.95
            emotion, emotion_conf = "depressed", 0.90
        else:
            intent, intent_conf = self.classify_intent(text)
            sentiment, sentiment_conf = self.detect_sentiment(text)
            emotion, emotion_conf = self.detect_emotion(text)
            
        keywords = self.extract_keywords(text)
        tokens = self.preprocess(text)
        pos_tags = self.get_pos_tags(text)
        entities = self.get_named_entities(text)
        
        result = {
            "cleaned_text": self.clean_text(text),
            "tokens": tokens,
            "intent": intent,
            "intent_confidence": intent_conf,
            "sentiment": sentiment,
            "sentiment_confidence": sentiment_conf,
            "emotion": emotion,
            "emotion_confidence": emotion_conf,
            "is_crisis": is_crisis,
            "keywords": keywords,
            "pos_tags": pos_tags,
            "entities": entities,
            "context": {"dominant_emotion": "neutral", "recent_intents": [], "stress_escalating": False}
        }
        
        if session_id:
            self.update_memory(session_id, text, result)
            result["context"] = self.get_context(session_id)
            
        return result

# Instantiate global pipeline object
nlp_pipeline = NLPPipeline()

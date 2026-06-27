import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sqlalchemy.orm import Session
from backend.config.config import settings
from backend.models.models import FAQ
from backend.nlp.pipeline import SimpleTFIDF

# Check dependencies availability
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    logging.warning("SentenceTransformers not installed. TF-IDF indexing fallback active for RAG.")
    SENTENCE_TRANSFORMERS_AVAILABLE = False

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    logging.warning("FAISS not installed. Using raw numpy/TF-IDF fallbacks for RAG search.")
    FAISS_AVAILABLE = False

try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    logging.warning("ChromaDB not installed. Using raw numpy/TF-IDF fallbacks for RAG search.")
    CHROMA_AVAILABLE = False


class RAGService:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        
        # FAQ fields
        self.faq_ids: List[int] = []
        self.faq_questions: List[str] = []
        self.faq_answers: List[str] = []
        self.faq_categories: List[str] = []
        self.faq_embeddings: Optional[np.ndarray] = None
        
        # Vector Store clients
        self.faiss_index = None
        self.chroma_client = None
        self.chroma_collection = None
        
        # Fallback TF-IDF indexer
        self.fallback_tfidf: Optional[SimpleTFIDF] = None

    def load_model(self):
        """Loads SentenceTransformer model if available."""
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            return
        try:
            logging.info(f"Loading SentenceTransformer model '{settings.SENTENCE_TRANSFORMER_MODEL}'...")
            self.model = SentenceTransformer(settings.SENTENCE_TRANSFORMER_MODEL)
            self.model_loaded = True
            logging.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logging.error(f"Failed to load SentenceTransformer: {e}. Falling back to TF-IDF RAG.")
            self.model_loaded = False

    def build_index(self, db: Session):
        """
        Fetches all FAQs from the database and builds Vector / TF-IDF indexes.
        Supports FAISS, ChromaDB, and raw NumPy Vector Store.
        """
        faqs = db.query(FAQ).all()
        if not faqs:
            logging.warning("No FAQs found in database to index.")
            self.faq_ids = []
            self.faq_questions = []
            self.faq_answers = []
            self.faq_categories = []
            self.faq_embeddings = None
            self.faiss_index = None
            self.chroma_collection = None
            return

        self.faq_ids = [faq.id for faq in faqs]
        self.faq_questions = [faq.question for faq in faqs]
        self.faq_answers = [faq.answer for faq in faqs]
        self.faq_categories = [faq.category for faq in faqs]

        # Use SentenceTransformers if available
        if self.model_loaded and self.model:
            try:
                # Generate embeddings
                embeddings_list = self.model.encode(self.faq_questions, show_progress_bar=False)
                self.faq_embeddings = np.array(embeddings_list)
                
                # Check DB config type and build index
                if settings.VECTOR_DB_TYPE == "faiss" and FAISS_AVAILABLE:
                    logging.info("Building FAISS index...")
                    d = self.faq_embeddings.shape[1]
                    # IndexFlatIP uses Inner Product (Cosine similarity when vectors are normalized)
                    self.faiss_index = faiss.IndexFlatIP(d)
                    
                    # Normalize embeddings
                    norms = np.linalg.norm(self.faq_embeddings, axis=1, keepdims=True)
                    norms[norms == 0] = 1e-10
                    normalized_embs = self.faq_embeddings / norms
                    
                    self.faiss_index.add(normalized_embs)
                    logging.info(f"Successfully indexed {len(faqs)} FAQs in FAISS.")
                    return
                    
                elif settings.VECTOR_DB_TYPE == "chroma" and CHROMA_AVAILABLE:
                    logging.info("Building ChromaDB collection...")
                    self.chroma_client = chromadb.Client()
                    # Recreate collection to refresh FAQs
                    try:
                        self.chroma_client.delete_collection("mindmate_faq")
                    except Exception:
                        pass
                    
                    self.chroma_collection = self.chroma_client.create_collection(
                        name="mindmate_faq",
                        metadata={"hnsw:space": "cosine"}
                    )
                    # Add documents
                    self.chroma_collection.add(
                        ids=[str(i) for i in self.faq_ids],
                        documents=self.faq_questions,
                        metadatas=[
                            {"answer": ans, "category": cat, "faq_id": fid}
                            for ans, cat, fid in zip(self.faq_answers, self.faq_categories, self.faq_ids)
                        ]
                    )
                    logging.info(f"Successfully indexed {len(faqs)} FAQs in ChromaDB.")
                    return
                
                else:
                    logging.info(f"Using raw NumPy Vector similarity storage (selected DB: {settings.VECTOR_DB_TYPE}).")
                    return
                    
            except Exception as e:
                logging.error(f"Failed embedding FAQs: {e}. Reverting to TF-IDF index.")
                
        # TF-IDF Fallback index
        self.fallback_tfidf = SimpleTFIDF()
        self.fallback_tfidf.fit_transform(self.faq_questions)
        logging.info(f"Indexed {len(faqs)} FAQs using custom TF-IDF search.")

    def search(self, query: str, db: Session, threshold: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """
        Searches the Vector Space or TF-IDF representations using the configured database provider.
        Returns the top match with confidence score and source citation.
        """
        if not self.faq_ids:
            self.build_index(db)
            
        if not self.faq_ids:
            return None

        # 1. FAISS Search
        if settings.VECTOR_DB_TYPE == "faiss" and FAISS_AVAILABLE and self.faiss_index is not None:
            try:
                query_emb = self.model.encode(query, convert_to_numpy=True)
                norm = np.linalg.norm(query_emb)
                if norm > 0:
                    query_emb = query_emb / norm
                query_emb = np.expand_dims(query_emb, axis=0)
                
                similarities, indices = self.faiss_index.search(query_emb, 1)
                best_idx = int(indices[0][0])
                best_sim = float(similarities[0][0])
                
                target_threshold = threshold if threshold is not None else 0.45
                if best_sim >= target_threshold and best_idx < len(self.faq_ids):
                    return {
                        "faq_id": self.faq_ids[best_idx],
                        "question": self.faq_questions[best_idx],
                        "answer": self.faq_answers[best_idx],
                        "category": self.faq_categories[best_idx],
                        "confidence": best_sim,
                        "citation": f"MindMate FAQ Vector Store (FAISS - {self.faq_categories[best_idx]})",
                        "method": "semantic_search"
                    }
            except Exception as e:
                logging.error(f"FAISS search failed: {e}. Falling back to NumPy search.")

        # 2. ChromaDB Search
        if settings.VECTOR_DB_TYPE == "chroma" and CHROMA_AVAILABLE and self.chroma_collection is not None:
            try:
                results = self.chroma_collection.query(
                    query_texts=[query],
                    n_results=1
                )
                if results["ids"] and results["ids"][0]:
                    best_id_str = results["ids"][0][0]
                    # Chroma distances for 'cosine' are (1 - similarity)
                    best_distance = results["distances"][0][0] if results["distances"] else 1.0
                    best_sim = 1.0 - float(best_distance)
                    
                    target_threshold = threshold if threshold is not None else 0.45
                    if best_sim >= target_threshold:
                        # Find the index of matching ID
                        best_idx = self.faq_ids.index(int(best_id_str))
                        return {
                            "faq_id": self.faq_ids[best_idx],
                            "question": self.faq_questions[best_idx],
                            "answer": self.faq_answers[best_idx],
                            "category": self.faq_categories[best_idx],
                            "confidence": best_sim,
                            "citation": f"MindMate Vector Store (ChromaDB - {self.faq_categories[best_idx]})",
                            "method": "semantic_search"
                        }
            except Exception as e:
                logging.error(f"ChromaDB search failed: {e}. Falling back to NumPy search.")

        # 3. NumPy Raw Cosine Similarity Search
        if self.model_loaded and self.model and self.faq_embeddings is not None:
            try:
                query_emb = self.model.encode(query, convert_to_numpy=True)
                dot_product = np.dot(self.faq_embeddings, query_emb)
                norms_docs = np.linalg.norm(self.faq_embeddings, axis=1)
                norm_query = np.linalg.norm(query_emb)
                
                norms_docs[norms_docs == 0] = 1e-10
                if norm_query == 0:
                    norm_query = 1e-10
                    
                similarities = dot_product / (norms_docs * norm_query)
                best_idx = int(np.argmax(similarities))
                best_sim = float(similarities[best_idx])
                
                target_threshold = threshold if threshold is not None else 0.45
                if best_sim >= target_threshold:
                    return {
                        "faq_id": self.faq_ids[best_idx],
                        "question": self.faq_questions[best_idx],
                        "answer": self.faq_answers[best_idx],
                        "category": self.faq_categories[best_idx],
                        "confidence": best_sim,
                        "citation": f"MindMate FAQ Store (NumPy Cosine - {self.faq_categories[best_idx]})",
                        "method": "semantic_search"
                    }
            except Exception as e:
                logging.error(f"NumPy raw vector search failed: {e}. Falling back to TF-IDF.")

        # 4. TF-IDF Search
        if self.fallback_tfidf:
            try:
                query_vector = self.fallback_tfidf.transform(query)
                similarities = []
                for doc_vector in self.fallback_tfidf.doc_vectors:
                    sim = self.fallback_tfidf.cosine_similarity(query_vector, doc_vector)
                    similarities.append(sim)
                
                if similarities:
                    best_idx = int(np.argmax(similarities))
                    best_sim = float(similarities[best_idx])
                    
                    target_threshold = threshold if threshold is not None else 0.20
                    if best_sim >= target_threshold:
                        return {
                            "faq_id": self.faq_ids[best_idx],
                            "question": self.faq_questions[best_idx],
                            "answer": self.faq_answers[best_idx],
                            "category": self.faq_categories[best_idx],
                            "confidence": best_sim,
                            "citation": f"MindMate FAQ Keyword Search ({self.faq_categories[best_idx]})",
                            "method": "keyword_search"
                        }
            except Exception as e:
                logging.error(f"RAG TF-IDF search failed: {e}")

        return None


# Global RAG service instance
rag_service = RAGService()

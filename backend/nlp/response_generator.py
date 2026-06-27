import random
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.nlp.pipeline import nlp_pipeline
from backend.nlp.rag_service import rag_service

CRISIS_RESPONSE = (
    "🚨 **IMPORTANT CRISIS NOTICE:** It sounds like you are going through an extremely difficult moment, "
    "and your safety is our top priority. As an AI wellness companion, MindMate cannot replace professional therapy or crisis intervention.\n\n"
    "👉 **If you are experiencing a mental health emergency, please contact your nearest healthcare provider, trusted family member, faculty mentor, or local emergency services immediately.**\n\n"
    "🎒 **BVRIT Student Support & Faculty Mentors:**\n"
    "• **Dr. A. Satish Babu** (Faculty Coordinator, CSE Dept) — `support@bvrit.ac.in`\n"
    "• **Ms. L. Pallavi** (Student Counselor, Student Wellness Cell) — `wellness@bvrit.ac.in`\n"
    "• **Mr. K. Praveen Kumar** (Academic Mentor, T&P Cell) — `training@bvrit.ac.in` \n\n"
    "📍 **Counseling Cell Location:** Student Counseling Cell, BVRIT Campus, Narsapur, Telangana (Mon–Fri, 9:30 AM – 4:30 PM).\n"
    "👥 Please reach out to a trusted friend, family member, or faculty mentor right now. You do not have to carry this alone."
)

QUICK_REPLY_MAP = {
    "Greetings": ["I am stressed", "Let's do a breathing exercise", "What can you do?"],
    "Stress": ["How can I manage stress?", "Give me a breathing exercise", "Suggest a study break"],
    "Anxiety": ["I'm having a panic attack", "Can we meditate?", "Give me positive affirmations"],
    "Depression": ["How to cope with feeling down", "I feel lonely", "Journaling tips"],
    "Study Pressure": ["My workload is too high", "Low GPA stress", "How to manage my time?"],
    "Exam Stress": ["I have an exam tomorrow", "How to beat test anxiety?", "Suggest study habits"],
    "Homesickness": ["I miss my family", "How to make friends at college?", "Feeling lonely in college"],
    "Friendship": ["How to deal with friend fights", "I feel isolated", "How to build connections?"],
    "Loneliness": ["I feel all alone", "Let's do a journaling activity", "Recommend a wellness exercise"],
    "Relationship": ["Beat a breakup", "How to heal a broken heart", "Talk about relationship anxiety"],
    "Sleep Issues": ["I can't sleep tonight", "Give me sleep tips", "Suggest a relaxing routine"],
    "Career Confusion": ["Worried about job placements", "How to choose a major?", "Resume advice tips"],
    "Self Improvement": ["How to build healthy habits", "Tips for journaling", "Suggest a daily routine"],
    "Unknown": ["Help me manage stress", "I'm having sleep issues", "Tell me a coping mechanism"]
}

INTENT_TEMPLATES = {
    "Greetings": [
        "Hello! I'm MindMate, your campus mental health companion. How are you feeling today?",
        "Hi there! I'm here to listen, offer wellness tips, and support you. What's on your mind?",
        "Greetings! Welcome to MindMate. How can I help you manage your stress or academic life today?"
    ],
    "Stress": [
        "It sounds like you're carrying a lot of weight. Academic and personal stress can feel suffocating. Try to take one step at a time. Would you like to do a quick 4-7-8 breathing exercise, or talk about a study break?",
        "Overwhelming stress is really challenging. Let's pause for a moment. Take a deep, slow breath. What is the single biggest task stressing you right now? Let's break it down together."
    ],
    "Anxiety": [
        "I hear you, and it's completely okay to feel anxious. Your nervous system is just trying to protect you. Try naming 3 things you can see and 2 things you can touch right now. Let's do a relaxing meditation together.",
        "Anxiety can feel like a storm, but storms always pass. Let's take slow, deep breaths. I can guide you through a grounding exercise if you'd like. Remember, you are safe."
    ],
    "Depression": [
        "I'm so sorry you're feeling this way. Crying or feeling empty is your mind's way of saying it has been strong for too long. Be gentle with yourself today. Would you like to try writing down your thoughts, or list three small things you're grateful for?",
        "Dealing with feeling down takes immense strength. Even logging in today is a win. If you can, try drinking a glass of water or stepping outside for fresh air. I'm here to listen without judgment."
    ],
    "Motivation": [
        "It's completely normal to feel discouraged or low on energy. Growth isn't linear. Focus on taking just one small action today—even if it's study for 5 minutes. You've gotten through hard days before, and you can get through this too!",
        "When you feel like giving up, remember why you started. But also, remember it's okay to rest. Rest isn't quitting; it's recharging. What is one small thing we can accomplish right now?"
    ],
    "Study Pressure": [
        "The academic workload at college can be overwhelming. Don't let grades define your worth. Try using the Pomodoro technique: study for 25 minutes, then take a 5-minute walk. Want to talk about it?",
        "GPA stress is very real, but you are more than a number. Let's try to plan your study blocks, or talk about talking to a professor. You are capable of navigating this workload."
    ],
    "Exam Stress": [
        "Test anxiety can make your mind freeze. Before you study, clear your desk and do a 2-minute breathing exercise. Focus on what you *can* review, not the entire syllabus. Get plenty of sleep tonight!",
        "Finals/midterms stress is a heavy load. Remember to eat, hydrate, and take study breaks. Cramming without sleep actually reduces retention. Let's get through this together."
    ],
    "Homesickness": [
        "Missing home and family is a sign of deep love. Being in a new college environment is a massive transition. Try scheduling a video call with your family, or styling your room with familiar items. You belong here, too.",
        "Homesickness is extremely common, especially in the first few semesters. Try to join one campus club or explore the student lounge. Taking small steps to build a local community will help."
    ],
    "Friendship": [
        "Navigating friendship dynamics or feeling left out in college is hard. Clear communication helps, but also remember to protect your peace. It takes time to find your true circle. I'm here if you want to vent.",
        "Social challenges are draining. If you had a disagreement with a friend, giving it 24 hours of space before speaking can help clarify things. Focus on taking care of yourself."
    ],
    "Loneliness": [
        "Loneliness is a heavy feeling, but please know you aren't truly alone. I'm here to chat, and there are many students on campus experiencing the exact same feelings. Try putting on some comforting music or going to a coffee shop just to be around people.",
        "It is okay to feel lonely. Sometimes a small creative activity like journaling, drawing, or a short walk can help redirect your mind. Would you like a journaling prompt to write down your thoughts?"
    ],
    "Relationship": [
        "Breakups and relationship issues are incredibly painful. It's okay to feel sad, angry, or confused. Give yourself permission to feel. Healing isn't instant, but you will get through this.",
        "Heartbreak is a physical and emotional toll. Be kind to yourself. Surround yourself with friends, watch a favorite show, and avoid checking their social media. Focus entirely on your own recovery."
    ],
    "Sleep Issues": [
        "Insomnia is frustrating. Try to turn off all screens 30 minutes before bed. Focus on relaxing your muscles starting from your toes up to your forehead. Let's do a sleep-mindfulness exercise.",
        "Can't sleep? Avoid looking at the clock, as it adds pressure. Try a simple breathing pattern: breathe in for 4 seconds, hold for 4, and breathe out for 6. Focus entirely on the counts."
    ],
    "Career Confusion": [
        "Choosing a career path or worrying about placements is stressful. Careers are built in stages, not in a single interview. Try visiting the Campus Career Services for resume reviews. You have plenty of time to figure this out.",
        "Career anxiety is normal, but your first job won't be your last job. Focus on building skills, not just getting the perfect title. Let's break down your resume or talk about mock interview practice."
    ],
    "Self Improvement": [
        "I love that you're focused on growth! Journaling, meditation, and daily water reminders are amazing starting points. Try setting one small micro-habit today. What area of wellness are you interested in?",
        "To improve your mental health, start with three simple pillars: consistent sleep, mild movement (like walking), and naming your emotions. What habit would you like to build first?"
    ],
    "Goodbye": [
        "Goodbye! Remember that you are resilient and capable. Take care of yourself, and I'll be here whenever you need to chat.",
        "Bye for now! Keep breathing, stay hydrated, and have a peaceful rest of your day.",
        "Goodnight/Goodbye! I'm glad we talked. Be gentle with yourself. See you next time!"
    ],
    "Unknown": [
        "I want to make sure I understand you fully. It sounds like you're expressing some deep feelings. Can you tell me a bit more about what you're experiencing?",
        "I'm here to support you. I want to make sure I give you the best help. Can you elaborate or share what's on your mind right now?"
    ]
}

RECOMMENDATION_EXERCISES = {
    "breathing": (
        "**4-7-8 Breathing Exercise:**\n"
        "1. Inhale quietly through your nose for **4 seconds**.\n"
        "2. Hold your breath for **7 seconds**.\n"
        "3. Exhale completely through your mouth making a whoosh sound for **8 seconds**.\n"
        "Repeat this cycle 4 times to instantly activate your parasympathetic nervous system."
    ),
    "meditation": (
        "**5-Minute Mindfulness Grounding:**\n"
        "Find a comfortable seat. Close your eyes. Focus entirely on your breathing. "
        "Observe the rise and fall of your chest. When thoughts arise, label them as 'thinking' "
        "and gently bring your attention back to your breath. You are in the present moment."
    ),
    "journaling": (
        "**Emotional Release Journal Prompt:**\n"
        "Grab a piece of paper or open a note. Write continuously for 3 minutes on this prompt: "
        "'Right now, I am feeling ______ because ______ and that makes me want to ______.' "
        "Don't edit or censor. Just let it flow, then delete or shred it to physically release the emotion."
    ),
    "sleep": (
        "**Wind-Down Routine Checklist:**\n"
        "- Turn off phones/screens (no blue light) 30 minutes before bed.\n"
        "- Keep room temperature cool.\n"
        "- Do a brain-dump journal write to clear anxious thoughts.\n"
        "- Try reading a physical book or listening to soft ambient music."
    ),
    "study_break": (
        "**Somatic Study Break (5 Min):**\n"
        "Step away from your laptop. Stand up and stretch your arms towards the ceiling. "
        "Roll your neck clockwise and counter-clockwise 3 times. Shake out your hands. "
        "Look at something at least 20 feet away to relax your eye muscles, and drink a glass of water."
    )
}

EMOTION_ACKNOWLEDGEMENTS = {
    "happy": "I am so glad to hear you are feeling happy! Sharing positive moments is wonderful. ",
    "sad": "I'm sorry you're feeling sad. It's completely okay to not be okay right now. ",
    "fear": "It sounds like you are feeling scared or fearful. Let's take a slow breath. You are safe. ",
    "angry": "I hear your frustration. Anger is a natural response. Let's work through it. ",
    "stress": "It sounds like you are carrying a lot of stress. Let's try to break things down. ",
    "lonely": "Feeling lonely can be very heavy, but remember you aren't alone. I'm here. ",
    "confusion": "It's completely normal to feel confused or unsure. Let's take it one step at a time. ",
    "depressed": "I hear how heavy things feel for you right now. Please be gentle with yourself. ",
    "anxious": "Anxiety can feel very intense, but it will pass. Let's ground ourselves. ",
}

class ResponseGenerator:
    def generate_response(self, user_message: str, db: Session, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Main entry point for response routing.
        Flow:
        1. Emergency Detection: Fast crisis regex bypass -> helpline card.
        2. FAQ Dataset Match: Keyword search with high confidence.
        3. Semantic Search: Vector similarity matching.
        4. RAG Retrieval: Aggregates top-2 relevant documents with low confidence threshold.
        5. Emotion-aware Response: Empathetic acknowledgment prepended to intent templates.
        6. LLM / Fallback Response: Open conversational help response.
        """
        # Run pipeline with optional memory tracking
        nlp_res = nlp_pipeline.analyze(user_message, session_id=session_id)
        
        is_crisis = nlp_res["is_crisis"]
        intent = nlp_res["intent"]
        intent_conf = nlp_res["intent_confidence"]
        sentiment = nlp_res["sentiment"]
        sentiment_conf = nlp_res["sentiment_confidence"]
        emotion = nlp_res["emotion"]
        emotion_conf = nlp_res["emotion_confidence"]
        cleaned_text = nlp_res["cleaned_text"]

        response_content = ""
        matched_faq_id = None
        source = "fallback"
        citation = None
        quick_replies = QUICK_REPLY_MAP.get("Unknown")

        # 1. Emergency Detection
        if is_crisis:
            response_content = CRISIS_RESPONSE
            source = "crisis"
            quick_replies = ["I need help", "Campus counseling info"]
            return self._build_payload(response_content, nlp_res, matched_faq_id, source, citation, quick_replies)

        # 2. FAQ Dataset Match (high confidence keyword check)
        faq_res = rag_service.search(cleaned_text, db, threshold=0.60)
        if faq_res and faq_res["method"] == "keyword_search":
            response_content = faq_res["answer"]
            matched_faq_id = faq_res["faq_id"]
            source = "faq_dataset"
            citation = faq_res["citation"]
            quick_replies = QUICK_REPLY_MAP.get(intent, QUICK_REPLY_MAP["Unknown"])
            return self._build_payload(response_content, nlp_res, matched_faq_id, source, citation, quick_replies)

        # 3. Semantic Search Match (high confidence vector check)
        semantic_res = rag_service.search(cleaned_text, db, threshold=0.45)
        if semantic_res and semantic_res["method"] == "semantic_search":
            response_content = semantic_res["answer"]
            matched_faq_id = semantic_res["faq_id"]
            source = "semantic_search"
            citation = semantic_res["citation"]
            quick_replies = QUICK_REPLY_MAP.get(intent, QUICK_REPLY_MAP["Unknown"])
            
            # Append interactive exercises based on content if relevant
            for key, exercise in RECOMMENDATION_EXERCISES.items():
                if key in cleaned_text or key in response_content.lower():
                    response_content += f"\n\n**MindMate Recommends:**\n{exercise}"
                    break
            return self._build_payload(response_content, nlp_res, matched_faq_id, source, citation, quick_replies)

        # 4. RAG Retrieval (Aggregates top matches even if lower confidence)
        rag_res = rag_service.search(cleaned_text, db, threshold=0.20)
        if rag_res:
            response_content = (
                f"Based on MindMate's wellness guidelines on **{rag_res['category']}**:\n\n"
                f"{rag_res['answer']}\n\n"
                f"If you'd like to discuss this topic further, I am here to listen."
            )
            matched_faq_id = rag_res["faq_id"]
            source = "rag_retrieval"
            citation = rag_res["citation"]
            quick_replies = QUICK_REPLY_MAP.get(intent, QUICK_REPLY_MAP["Unknown"])
            return self._build_payload(response_content, nlp_res, matched_faq_id, source, citation, quick_replies)

        # 5. Emotion-aware Response
        if emotion in EMOTION_ACKNOWLEDGEMENTS and emotion_conf > 0.50:
            ack = EMOTION_ACKNOWLEDGEMENTS[emotion]
            # Use intent template if recognized
            if intent in INTENT_TEMPLATES and intent != "Unknown":
                template_body = random.choice(INTENT_TEMPLATES[intent])
                response_content = ack + template_body
                source = "emotion_aware_response"
            else:
                # Fallback to general supportive response wrapped in acknowledgment
                response_content = ack + "What is on your mind today? I'm here to listen and help you process what you're feeling."
                source = "emotion_aware_response"
                
            quick_replies = QUICK_REPLY_MAP.get(intent, QUICK_REPLY_MAP["Unknown"])
            
            # Add breathing exercise if stress/anxiety is acknowledged
            if emotion in ["stress", "anxious", "depressed"]:
                response_content += f"\n\n🧘 **Try this right now:**\n{RECOMMENDATION_EXERCISES['breathing']}"
                
            return self._build_payload(response_content, nlp_res, matched_faq_id, source, citation, quick_replies)

        # 6. LLM Response / General Fallback
        if intent in INTENT_TEMPLATES and intent != "Unknown":
            response_content = random.choice(INTENT_TEMPLATES[intent])
            source = "template"
            quick_replies = QUICK_REPLY_MAP.get(intent, QUICK_REPLY_MAP["Unknown"])
        else:
            response_content = random.choice(INTENT_TEMPLATES["Unknown"])
            source = "fallback"
            quick_replies = QUICK_REPLY_MAP.get("Unknown")
            
        return self._build_payload(response_content, nlp_res, matched_faq_id, source, citation, quick_replies)

    def _build_payload(self, content: str, nlp_res: Dict[str, Any], faq_id: Optional[int], 
                       source: str, citation: Optional[str], quick_replies: List[str]) -> Dict[str, Any]:
        """Formatting output dictionary structure."""
        return {
            "response_content": content,
            "intent": nlp_res["intent"],
            "intent_confidence": nlp_res["intent_confidence"],
            "sentiment": nlp_res["sentiment"],
            "sentiment_confidence": nlp_res["sentiment_confidence"],
            "emotion": nlp_res["emotion"],
            "emotion_confidence": nlp_res["emotion_confidence"],
            "matched_faq_id": faq_id,
            "is_crisis": nlp_res["is_crisis"],
            "source": source,
            "citation": citation,
            "quick_replies": quick_replies
        }

# Global Response Generator instance
response_generator = ResponseGenerator()

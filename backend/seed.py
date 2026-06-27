import datetime
from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal, engine, Base
from backend.models.models import User, FAQ, MoodLog, Chat, Message, Feedback, ActivityLog
from backend.services.auth_service import get_password_hash

# Define FAQs
FAQ_DATA = [
    # Category: Stress Management
    {
        "category": "Stress",
        "question": "How can I handle severe academic stress?",
        "answer": (
            "Dealing with heavy academic stress is a step-by-step process. First, break your syllabus or projects into "
            "bite-sized micro-tasks. Second, apply the Pomodoro Technique: work for 25 minutes, then take a 5-minute break. "
            "Third, establish boundaries—give yourself a hard stop time for studies each night, and ensure you get "
            "7-8 hours of sleep to keep your cognitive abilities sharp."
        ),
        "keywords": "academic, workload, study, stress, pomodoro, grades"
    },
    {
        "category": "Stress",
        "question": "What should I do when I feel completely overwhelmed and burnt out?",
        "answer": (
            "Burnout is a signal from your mind to pause. Stepping away is not quitting; it is rebuilding. "
            "Try a 'somatic break': stand up, stretch, take five deep breaths, and drink a full glass of cold water. "
            "Write down the top 3 tasks on your mind, choose only ONE to focus on today, and let the rest wait. "
            "Consider talking to a campus counselor to ease the load."
        ),
        "keywords": "burnout, overwhelmed, pause, somatic, stretch, breathing"
    },
    # Category: Anxiety Control
    {
        "category": "Anxiety",
        "question": "How do I cope with a sudden panic attack?",
        "answer": (
            "If you are having a panic attack, remember: you are safe, and this feeling will pass. Focus on grounding yourself "
            "using the 5-4-3-2-1 technique:\n"
            "- Name 5 things you can see around you.\n"
            "- 4 things you can physically feel (e.g., your feet on the floor).\n"
            "- 3 things you can hear.\n"
            "- 2 things you can smell.\n"
            "- 1 thing you can taste.\n"
            "Slow down your exhalations—breathe in for 4 seconds, exhale for 8 seconds. This resets your heart rate."
        ),
        "keywords": "panic, anxiety, grounding, breathing, hyperventilating"
    },
    {
        "category": "Anxiety",
        "question": "What is mindfulness grounding and how does it help with anxiety?",
        "answer": (
            "Mindfulness grounding is the practice of drawing your attention away from negative or racing future worries "
            "and bringing it back into the present moment. By focusing on sensory details or breathing patterns, you "
            "quiet the amygdala (the brain's threat center), slowing down your heartbeat and reducing stress hormones."
        ),
        "keywords": "mindfulness, grounding, focus, attention, amygdala"
    },
    # Category: Sleep Hygiene
    {
        "category": "Sleep",
        "question": "How can I fix a broken sleep cycle?",
        "answer": (
            "To repair your sleep cycle, consistency is key. Go to bed and wake up at the exact same time every day, "
            "even on weekends. Keep your bedroom cold and dark. Turn off all phones and tablets at least 30-45 minutes "
            "before sleeping to prevent blue light from suppressing melatonin. Avoid caffeine after 2:00 PM."
        ),
        "keywords": "sleep, cycle, insomnia, bed, bedtime, melatonin, caffeine"
    },
    {
        "category": "Sleep",
        "question": "What is a good evening wind-down routine?",
        "answer": (
            "An optimal wind-down routine takes 30 minutes. Stop screen use, dim your room lights, and do a quick 'brain dump' "
            "journal entry where you write down all tomorrow's tasks to clear your thoughts. Try listening to relaxing "
            "ambient music or doing light stretching. Focus on breathing in for 4 seconds and out for 6."
        ),
        "keywords": "routine, wind-down, evening, journal, relax, stretching"
    },
    # Category: Friendship & Social
    {
        "category": "Friendship",
        "question": "How do I make friends at college and beat social anxiety?",
        "answer": (
            "Making friends takes small, consistent steps. Try attending club meetings or campus events—shared interests "
            "make starting conversations much easier. If you feel social anxiety, focus on asking open questions about "
            "others (e.g., 'What class are you taking?') to shift the focus off yourself. Be patient; relationships take time."
        ),
        "keywords": "friends, social, anxiety, campus, clubs, conversation"
    },
    {
        "category": "Friendship",
        "question": "How should I handle a dispute or fight with my roommate?",
        "answer": (
            "Roommate disputes are best resolved with calm, direct communication. Avoid texting; talk in person. "
            "Use 'I' statements instead of accusing them (e.g., say 'I struggle to sleep when lights are on after 11' "
            "instead of 'You always keep the lights on'). Focus on finding a compromise, and if needed, consult a campus RA."
        ),
        "keywords": "roommate, fight, conflict, dispute, communication, compromise"
    },
    # Category: Career & Future
    {
        "category": "Career",
        "question": "How do I handle interview anxiety and worries about job placements?",
        "answer": (
            "Job placement anxiety is extremely common. Remember: an interview is a two-way conversation, not a trial. "
            "Prepare by doing mock interviews with friends or campus career counselors. On the day, visualize yourself "
            "succeeding, dress comfortably, and remember that career paths are long and full of redirection. One setback "
            "does not define your career."
        ),
        "keywords": "interview, job, placement, career, anxiety, resume, future"
    },
    {
        "category": "Career",
        "question": "How do I choose the right major or career path?",
        "answer": (
            "Choosing a path doesn't mean locking in your entire life. Look for the intersection of what you are good at, "
            "what you enjoy, and what fields have demand. Take introductory courses, talk to seniors or alumni in fields "
            "of interest, and schedule a counseling appointment with Career Services to take a skill-matching test."
        ),
        "keywords": "major, career, path, choice, major change, career services"
    }
]

def seed_database():
    db = SessionLocal()
    try:
        # Create tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Database schemas created.")

        # 1. Seed Users (1 Admin, 1 Student)
        admin_pwd = get_password_hash("admin123")
        admin_user = User(
            username="admin",
            email="admin@bvrit.ac.in",
            hashed_password=admin_pwd,
            role="admin"
        )
        
        student_pwd = get_password_hash("student123")
        student_user = User(
            username="student",
            email="student@bvrit.ac.in",
            hashed_password=student_pwd,
            role="user"
        )
        
        db.add(admin_user)
        db.add(student_user)
        db.commit()
        db.refresh(admin_user)
        db.refresh(student_user)
        print("Users seeded: admin/admin123 (admin), student/student123 (user).")

        # 2. Seed FAQs
        for item in FAQ_DATA:
            faq = FAQ(
                category=item["category"],
                question=item["question"],
                answer=item["answer"],
                keywords=item["keywords"]
            )
            db.add(faq)
        db.commit()
        print(f"Seeded {len(FAQ_DATA)} default wellness FAQs/guides.")

        # 3. Seed Mood History (Past 14 days of mood logs for student)
        now = datetime.datetime.utcnow()
        mood_notes = [
            "Started midterms week, feeling very stressed.",
            "Couldn't sleep well due to exam stress.",
            "Exam went okay but still feeling anxious.",
            "Slept for 9 hours, feeling a bit better today.",
            "Met friends, had a good conversation.",
            "Feeling lonely and homesick tonight.",
            "Talked to family, feel much more grounded.",
            "Worried about the low GPA score in math.",
            "Did a breathing exercise, it helped a bit.",
            "Weekend rest. Feeling neutral and resting.",
            "Ready for the new week. Energetic!",
            "Scored well in math quiz, excited!",
            "Mild fatigue, but stable mood.",
            "Feeling content, studying in the library."
        ]
        mood_scores = [2, 1, 2, 3, 4, 2, 4, 2, 3, 3, 4, 5, 3, 4]  # 1-5 scores
        
        for i in range(14):
            day_offset = 14 - i
            log_time = now - datetime.timedelta(days=day_offset)
            mood_log = MoodLog(
                user_id=student_user.id,
                mood_score=mood_scores[i],
                notes=mood_notes[i],
                timestamp=log_time
            )
            db.add(mood_log)
        db.commit()
        print("Logged 14 days of historical mood data for student.")

        # 4. Seed Chats and Messages (3 chat sessions with dialogue)
        # Session 1: Midterms Stress (Anxious)
        chat1 = Chat(user_id=student_user.id, title="Exam Stress Support", created_at=now - datetime.timedelta(days=6))
        db.add(chat1)
        db.commit()
        db.refresh(chat1)
        
        m1 = Message(
            chat_id=chat1.id, sender="user", content="I have a huge exam tomorrow and I feel like I'm going to fail.",
            timestamp=chat1.created_at + datetime.timedelta(minutes=1),
            intent="Exam Stress", intent_confidence=0.92,
            sentiment="Negative", sentiment_confidence=0.88,
            emotion="anxious", emotion_confidence=0.85,
            response_source="user"
        )
        m2 = Message(
            chat_id=chat1.id, sender="bot", content="I hear you, and it's completely normal to feel exam stress. Remember that your grades don't define your entire worth. Try to study in 25-minute Pomodoro blocks and do a 4-7-8 breathing exercise to relax your mind. You can do this!",
            timestamp=chat1.created_at + datetime.timedelta(minutes=2),
            intent="Exam Stress", intent_confidence=0.92,
            sentiment="Positive", sentiment_confidence=0.91,
            emotion="happy", emotion_confidence=0.80,
            response_source="template"
        )
        db.add_all([m1, m2])
        
        # Session 2: Roommate dispute (Angry / Confused)
        chat2 = Chat(user_id=student_user.id, title="Roommate Conflict", created_at=now - datetime.timedelta(days=3))
        db.add(chat2)
        db.commit()
        db.refresh(chat2)
        
        m3 = Message(
            chat_id=chat2.id, sender="user", content="I got into a huge fight with my roommate about cleaning. They never clean!",
            timestamp=chat2.created_at + datetime.timedelta(minutes=1),
            intent="Friendship", intent_confidence=0.88,
            sentiment="Negative", sentiment_confidence=0.94,
            emotion="angry", emotion_confidence=0.90,
            response_source="user"
        )
        # Retrieve FAQ match simulation
        faq_roommate = db.query(FAQ).filter(FAQ.keywords.like("%roommate%")).first()
        m4 = Message(
            chat_id=chat2.id, sender="bot", content=faq_roommate.answer if faq_roommate else "Communication is key in roommate disputes. Try talking to them using 'I' statements.",
            timestamp=chat2.created_at + datetime.timedelta(minutes=2),
            intent="Friendship", intent_confidence=0.88,
            sentiment="Positive", sentiment_confidence=0.75,
            emotion="neutral", emotion_confidence=0.90,
            matched_faq_id=faq_roommate.id if faq_roommate else None,
            response_source="semantic_search",
            citation=f"MindMate Wellness Guide ({faq_roommate.category})" if faq_roommate else None
        )
        db.add_all([m3, m4])
        
        # Submit feedback on Bot's roommate advice (5 star rating!)
        db.commit()
        fb = Feedback(
            user_id=student_user.id,
            message_id=m4.id,
            rating=5,
            comment="This was very helpful! I will try using 'I' statements."
        )
        db.add(fb)

        # 5. Add Activity Logs for analytics
        actions = ["register", "login", "mood_logged", "chat_create", "submit_feedback", "login", "mood_logged", "chat_create"]
        details = [
            "User student registered.",
            "User student logged in.",
            "Logged mood score: 2",
            "Chat session 1 created.",
            "Feedback message rated 5 stars.",
            "User student logged in.",
            "Logged mood score: 4",
            "Chat session 2 created."
        ]
        log_times = [
            now - datetime.timedelta(days=14),
            now - datetime.timedelta(days=14, hours=1),
            now - datetime.timedelta(days=14, hours=2),
            now - datetime.timedelta(days=6),
            now - datetime.timedelta(days=3),
            now - datetime.timedelta(days=2),
            now - datetime.timedelta(days=1),
            now - datetime.timedelta(days=1, hours=1)
        ]
        
        for k in range(len(actions)):
            act_log = ActivityLog(
                user_id=student_user.id,
                action=actions[k],
                details=details[k],
                timestamp=log_times[k]
            )
            db.add(act_log)
            
        # Admin login log
        admin_log = ActivityLog(
            user_id=admin_user.id,
            action="login",
            details="Admin logged in.",
            timestamp=now - datetime.timedelta(hours=2)
        )
        db.add(admin_log)
        
        db.commit()
        print("Database seeded with sample activities, messages and ratings!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

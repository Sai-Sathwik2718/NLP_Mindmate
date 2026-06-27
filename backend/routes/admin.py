import csv
import json
import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import datetime
from sqlalchemy import func, desc

from backend.database.connection import get_db
from backend.models.models import User, Chat, Message, MoodLog, FAQ, Feedback, ActivityLog
from backend.models.schemas import UserResponse, FAQCreate, FAQResponse, UserStatusUpdate
from backend.services.auth_service import get_current_admin
from backend.nlp.rag_service import rag_service

router = APIRouter(prefix="/admin", tags=["Admin & Analytics"])

# --- User Management ---

@router.get("/users", response_model=List[UserResponse])
def get_all_users(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Retrieve list of all users in the system."""
    return db.query(User).order_by(User.created_at.desc()).all()

@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(user_id: int, status_in: UserStatusUpdate, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Suspend or activate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot suspend yourself.")
        
    user.is_suspended = status_in.is_suspended
    db.commit()
    db.refresh(user)
    
    # Log admin action
    action_label = "suspended" if status_in.is_suspended else "unsuspended"
    log = ActivityLog(
        user_id=current_admin.id,
        action="admin_user_status",
        details=f"Admin {current_admin.username} {action_label} user {user.username} (ID: {user.id})."
    )
    db.add(log)
    db.commit()
    
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(user_id: int, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Delete a user account entirely, cascading deletion to chats, mood logs, etc."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete yourself.")
        
    db.delete(user)
    db.commit()
    
    # Log admin action
    log = ActivityLog(
        user_id=current_admin.id,
        action="admin_user_delete",
        details=f"Admin {current_admin.username} deleted user {user.username} (ID: {user_id})."
    )
    db.add(log)
    db.commit()
    
    return {"message": "User deleted successfully."}


# --- FAQ Dataset Management ---

@router.get("/dataset/faqs", response_model=List[FAQResponse])
def get_all_faqs(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Retrieve list of all FAQ cards in the dataset."""
    return db.query(FAQ).order_by(FAQ.category.asc()).all()

@router.post("/dataset/faqs", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
def add_faq(faq_in: FAQCreate, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Add a new FAQ/Wellness guide to the dataset and rebuild the RAG index automatically."""
    faq = FAQ(
        category=faq_in.category,
        question=faq_in.question,
        answer=faq_in.answer,
        keywords=faq_in.keywords
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    
    # Trigger RAG rebuild dynamically
    rag_service.build_index(db)
    
    # Log action
    log = ActivityLog(
        user_id=current_admin.id,
        action="admin_faq_add",
        details=f"Admin added FAQ ID {faq.id} in category '{faq.category}'."
    )
    db.add(log)
    db.commit()
    
    return faq

@router.post("/dataset/upload", status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Bulk upload FAQs from a CSV or JSON file, then rebuild the Vector Index."""
    contents = await file.read()
    filename = file.filename.lower()
    
    faqs_to_add = []
    
    if filename.endswith(".csv"):
        try:
            stream = io.StringIO(contents.decode("utf-8"))
            reader = csv.DictReader(stream)
            for row in reader:
                if not row.get("category") or not row.get("question") or not row.get("answer"):
                    continue
                faqs_to_add.append(
                    FAQ(
                        category=row["category"].strip(),
                        question=row["question"].strip(),
                        answer=row["answer"].strip(),
                        keywords=row.get("keywords", "").strip() if row.get("keywords") else None
                    )
                )
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed parsing CSV: {str(e)}")
            
    elif filename.endswith(".json"):
        try:
            data = json.loads(contents.decode("utf-8"))
            if not isinstance(data, list):
                raise HTTPException(status_code=400, detail="JSON must be an array of FAQ objects.")
            for item in data:
                if not item.get("category") or not item.get("question") or not item.get("answer"):
                    continue
                faqs_to_add.append(
                    FAQ(
                        category=item["category"].strip(),
                        question=item["question"].strip(),
                        answer=item["answer"].strip(),
                        keywords=item.get("keywords", "").strip() if item.get("keywords") else None
                    )
                )
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed parsing JSON: {str(e)}")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file format. Please upload .csv or .json")
        
    if not faqs_to_add:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid FAQs found in file.")
        
    # Bulk insert
    db.bulk_save_objects(faqs_to_add)
    db.commit()
    
    # Rebuild index
    rag_service.build_index(db)
    
    # Log admin action
    log = ActivityLog(
        user_id=current_admin.id,
        action="admin_faq_bulk_upload",
        details=f"Admin bulk uploaded {len(faqs_to_add)} FAQs via file '{file.filename}'."
    )
    db.add(log)
    db.commit()
    
    return {"message": f"Successfully uploaded {len(faqs_to_add)} FAQs and rebuilt Vector Index."}

@router.delete("/dataset/faqs/{faq_id}", status_code=status.HTTP_200_OK)
def delete_faq(faq_id: int, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Delete an FAQ and trigger RAG index rebuild."""
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")
        
    db.delete(faq)
    db.commit()
    
    # Trigger RAG rebuild dynamically
    rag_service.build_index(db)
    
    # Log action
    log = ActivityLog(
        user_id=current_admin.id,
        action="admin_faq_delete",
        details=f"Admin deleted FAQ ID {faq_id}."
    )
    db.add(log)
    db.commit()
    
    return {"message": "FAQ deleted and RAG index rebuilt."}

@router.post("/dataset/retrain", status_code=status.HTTP_200_OK)
def trigger_retraining(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Force-trigger rebuild of RAG Vector index from the current database content."""
    rag_service.build_index(db)
    
    # Log action
    log = ActivityLog(
        user_id=current_admin.id,
        action="admin_rag_retrain",
        details="Admin triggered manual rebuild of RAG Vector index."
    )
    db.add(log)
    db.commit()
    
    return {"message": "RAG embeddings index rebuilt successfully."}


# --- Analytics Dashboard Dashboard ---

@router.get("/analytics")
def get_analytics(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Computes all historical, operational, and NLP aggregated metrics.
    Feeds charts in the Admin Dashboard:
    - Total counts (Users, Chats, Messages)
    - Active users (DAU: log activity in last 24h)
    - Mood averages (Mood tracker scores)
    - Intent distribution (NLP intents counted from bot replies)
    - Emotion distribution
    - Sentiment distribution
    - Chat response source metrics (FAQ matching rates, semantic rates, fallbacks)
    - Rating feedback stats (Average rating score)
    - Recent Activity feed logs
    """
    now = datetime.datetime.utcnow()
    one_day_ago = now - datetime.timedelta(days=1)
    seven_days_ago = now - datetime.timedelta(days=7)
    thirty_days_ago = now - datetime.timedelta(days=30)
    
    # 1. Total counts
    total_users = db.query(User).count()
    total_chats = db.query(Chat).count()
    total_messages = db.query(Message).count()
    
    # 2. Daily Active Users (DAU) - users who logged in or performed actions in the last 24h
    dau = db.query(ActivityLog.user_id).filter(
        ActivityLog.timestamp >= one_day_ago
    ).distinct().count()
    
    # 3. Weekly & Monthly chats
    weekly_chats = db.query(Chat).filter(Chat.created_at >= seven_days_ago).count()
    monthly_chats = db.query(Chat).filter(Chat.created_at >= thirty_days_ago).count()
    
    # 4. Average User Mood Score
    avg_mood = db.query(func.avg(MoodLog.mood_score)).scalar()
    avg_mood = round(float(avg_mood), 2) if avg_mood else 0.0
    
    # 5. Intent Distribution (exclude Greetings and Goodbye to focus on emotional intents)
    intent_counts = db.query(
        Message.intent, func.count(Message.intent)
    ).filter(
        Message.sender == "user",
        Message.intent.isnot(None),
        Message.intent != "Greetings",
        Message.intent != "Goodbye"
    ).group_by(Message.intent).order_by(desc(func.count(Message.intent))).all()
    
    intents_dict = {intent: count for intent, count in intent_counts}
    
    # 6. Sentiment Distribution (user messages)
    sentiment_counts = db.query(
        Message.sentiment, func.count(Message.sentiment)
    ).filter(
        Message.sender == "user",
        Message.sentiment.isnot(None)
    ).group_by(Message.sentiment).all()
    
    sentiments_dict = {sent: count for sent, count in sentiment_counts}
    
    # 7. Emotion Distribution (user messages)
    emotion_counts = db.query(
        Message.emotion, func.count(Message.emotion)
    ).filter(
        Message.sender == "user",
        Message.emotion.isnot(None)
    ).group_by(Message.emotion).all()
    
    emotions_dict = {em: count for em, count in emotion_counts}
    
    # 8. Chat Response Source Distribution (FAQ, RAG, Templates, etc.)
    source_counts = db.query(
        Message.response_source, func.count(Message.response_source)
    ).filter(
        Message.sender == "bot",
        Message.response_source.isnot(None)
    ).group_by(Message.response_source).all()
    
    sources_dict = {src: count for src, count in source_counts}
    
    # 9. Feedback Satisfaction (Average ratings)
    avg_rating = db.query(func.avg(Feedback.rating)).scalar()
    avg_rating = round(float(avg_rating), 2) if avg_rating else 0.0
    feedback_count = db.query(Feedback).count()
    
    # 10. Audit activity feed logs (limit to 10)
    recent_logs = db.query(ActivityLog).join(User, isouter=True).order_by(
        ActivityLog.timestamp.desc()
    ).limit(10).all()
    
    logs_feed = [
        {
            "id": log.id,
            "username": log.user.username if log.user else "System",
            "action": log.action,
            "details": log.details,
            "time": log.timestamp.strftime("%b %d, %H:%M:%S")
        }
        for log in recent_logs
    ]
    
    # 11. Success rates / Crisis handles
    crisis_count = db.query(Message).filter(Message.is_crisis == True).count()
    
    return {
        "summary": {
            "total_users": total_users,
            "total_chats": total_chats,
            "total_messages": total_messages,
            "dau": dau,
            "weekly_chats": weekly_chats,
            "monthly_chats": monthly_chats,
            "avg_mood": avg_mood,
            "avg_rating": avg_rating,
            "feedback_count": feedback_count,
            "crisis_handled": crisis_count
        },
        "charts": {
            "intents": intents_dict,
            "sentiments": sentiments_dict,
            "emotions": emotions_dict,
            "sources": sources_dict
        },
        "activity_feed": logs_feed
    }

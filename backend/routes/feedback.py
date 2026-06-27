from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.models.models import Feedback, Message, User, ActivityLog
from backend.models.schemas import FeedbackCreate, FeedbackResponse
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(fb_in: FeedbackCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Submit rating and comments for a specific chatbot response."""
    # Verify message exists
    message = db.query(Message).filter(Message.id == fb_in.message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        
    feedback = Feedback(
        user_id=current_user.id,
        message_id=fb_in.message_id,
        rating=fb_in.rating,
        comment=fb_in.comment
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="submit_feedback",
        details=f"Feedback message {fb_in.message_id} rated {fb_in.rating} stars."
    )
    db.add(log)
    db.commit()
    
    return feedback

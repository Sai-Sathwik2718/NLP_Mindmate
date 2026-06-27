from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import datetime
from sqlalchemy import func

from backend.database.connection import get_db
from backend.models.models import MoodLog, User, ActivityLog
from backend.models.schemas import MoodLogCreate, MoodLogResponse
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/mood", tags=["Mood Tracker"])

@router.post("", response_model=MoodLogResponse, status_code=status.HTTP_201_CREATED)
def log_mood(mood_in: MoodLogCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log the user's current mood score and optional notes."""
    mood = MoodLog(
        user_id=current_user.id,
        mood_score=mood_in.mood_score,
        notes=mood_in.notes
    )
    db.add(mood)
    db.commit()
    db.refresh(mood)
    
    # Log activity
    log = ActivityLog(user_id=current_user.id, action="mood_logged", details=f"Logged mood score: {mood_in.mood_score}")
    db.add(log)
    db.commit()
    
    return mood

@router.get("/history", response_model=List[MoodLogResponse])
def get_mood_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve mood logs of the authenticated user in reverse chronological order."""
    logs = db.query(MoodLog).filter(MoodLog.user_id == current_user.id).order_by(MoodLog.timestamp.desc()).all()
    return logs

@router.get("/stats")
def get_mood_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generate aggregated mood statistics for charts.
    Returns:
    - Average mood score
    - Counts of each mood category
    - Trend analysis (daily logs for the last 7 entries)
    """
    logs = db.query(MoodLog).filter(MoodLog.user_id == current_user.id).order_by(MoodLog.timestamp.asc()).all()
    
    if not logs:
        return {
            "average_mood": 0.0,
            "counts": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "timeline": []
        }
        
    total_score = sum(l.mood_score for l in logs)
    avg_mood = float(total_score / len(logs))
    
    counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for l in logs:
        counts[l.mood_score] = counts.get(l.mood_score, 0) + 1
        
    # Get last 7 entries for timeline trend
    recent_logs = logs[-7:]
    timeline = [
        {
            "date": l.timestamp.strftime("%b %d"),
            "score": l.mood_score,
            "notes": l.notes
        }
        for l in recent_logs
    ]
    
    return {
        "average_mood": round(avg_mood, 2),
        "counts": counts,
        "timeline": timeline
    }

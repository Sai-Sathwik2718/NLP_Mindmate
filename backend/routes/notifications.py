from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.connection import get_db
from backend.models.models import Notification, User
from backend.models.schemas import NotificationResponse
from backend.services.auth_service import get_current_user, get_current_admin

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve notifications for the authenticated user, ordered by date."""
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_system_notification(
    user_id: int,
    title: str,
    content: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Post a system notification to a specific user (Admin access only)."""
    notification = Notification(
        user_id=user_id,
        title=title,
        content=content
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

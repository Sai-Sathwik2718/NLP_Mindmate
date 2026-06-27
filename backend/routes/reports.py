from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.connection import get_db
from backend.models.models import Report, User, ActivityLog
from backend.models.schemas import ReportCreate, ReportResponse
from backend.services.auth_service import get_current_user, get_current_admin

router = APIRouter(prefix="/reports", tags=["Wellness Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a wellness self-report or log a flagged incident."""
    report = Report(
        user_id=current_user.id,
        title=report_in.title,
        summary=report_in.summary,
        risk_level=report_in.risk_level
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="report_submit",
        details=f"User {current_user.username} submitted report ID {report.id} (Risk: {report.risk_level})."
    )
    db.add(log)
    db.commit()

    return report

@router.get("", response_model=List[ReportResponse])
def get_all_reports(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Retrieve all submitted wellness reports across the portal (Admin access only)."""
    return db.query(Report).order_by(Report.created_at.desc()).all()

@router.get("/user", response_model=List[ReportResponse])
def get_user_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve submitted reports for the authenticated student user."""
    return db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.created_at.desc()).all()

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    username: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    is_suspended: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)


# --- Chat Schemas ---
class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat Session"

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    sender: str
    content: str
    timestamp: datetime
    intent: Optional[str] = None
    intent_confidence: Optional[float] = None
    sentiment: Optional[str] = None
    sentiment_confidence: Optional[float] = None
    emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None
    matched_faq_id: Optional[int] = None
    is_crisis: bool
    response_source: Optional[str] = None
    citation: Optional[str] = None

    class Config:
        from_attributes = True


# --- Mood Schemas ---
class MoodLogCreate(BaseModel):
    mood_score: int = Field(..., ge=1, le=5)  # 1: Sad, 2: Anxious, 3: Neutral, 4: Motivated, 5: Excited
    notes: Optional[str] = None

class MoodLogResponse(BaseModel):
    id: int
    user_id: int
    mood_score: int
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    message_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    message_id: int
    rating: int
    comment: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# --- FAQ Dataset Schemas ---
class FAQCreate(BaseModel):
    category: str = Field(..., min_length=2, max_length=50)
    question: str = Field(..., min_length=5, max_length=255)
    answer: str = Field(..., min_length=5)
    keywords: Optional[str] = None

class FAQResponse(BaseModel):
    id: int
    category: str
    question: str
    answer: str
    keywords: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Admin Manage Schemas ---
class UserStatusUpdate(BaseModel):
    is_suspended: bool


# --- Report Schemas ---
class ReportCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    summary: str = Field(..., min_length=10)
    risk_level: Optional[str] = "low"

class ReportResponse(BaseModel):
    id: int
    user_id: int
    title: str
    summary: str
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Token Schemas ---
class RefreshTokenRequest(BaseModel):
    refresh_token: str


# --- Sentiment & Emotion Log Schemas ---
class SentimentLogResponse(BaseModel):
    id: int
    user_id: int
    sentiment_label: str
    score: float
    timestamp: datetime

    class Config:
        from_attributes = True


class EmotionLogResponse(BaseModel):
    id: int
    user_id: int
    emotion_label: str
    score: float
    timestamp: datetime

    class Config:
        from_attributes = True


class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


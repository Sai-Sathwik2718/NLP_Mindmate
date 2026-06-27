import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindMate AI"
    API_V1_STR: str = "/api/v1"
    
    # JWT Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_mindmate_ai_key_for_placements_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Database Settings
    # Supports SQLite local file by default, or MySQL if specified via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/mindmate.db" if os.getenv("VERCEL") else "sqlite:///./mindmate.db")
    
    # CORS Settings
    ALLOWED_ORIGINS: list[str] = ["*"]
    
    # AI Pipeline Models & Vector DB Settings
    VECTOR_DB_TYPE: str = os.getenv("VECTOR_DB_TYPE", "faiss")  # Options: 'faiss', 'chroma', 'numpy'
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    EMOTION_MODEL: str = "bhadresh-savani/distilbert-base-uncased-emotion"
    SENTIMENT_MODEL: str = "distilbert-base-uncased-finetuned-sst-2-english"
    
    class Config:
        case_sensitive = True

settings = Settings()

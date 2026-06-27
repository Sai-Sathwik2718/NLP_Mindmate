from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config.config import settings

# If using SQLite, allow multithreaded connection sharing
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    """
    Database session dependency. Yields database sessions to endpoints
    and ensures clean closure after requests finish.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

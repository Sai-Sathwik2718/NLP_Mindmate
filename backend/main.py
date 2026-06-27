import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config.config import settings
from backend.database.connection import engine, Base, SessionLocal
from backend.routes import auth, chat, mood, admin, feedback, reports, notifications
from backend.nlp.rag_service import rag_service
from backend.nlp.pipeline import nlp_pipeline

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("MindMate")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MindMate AI - Student & Campus Mental Health Support Portal (REST APIs)",
    version="1.0.0",
    docs_url="/docs",  # Auto Swagger Documentation
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing Middleware (Rate Limiting check & performance logger)
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Register API Routes
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(mood.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(feedback.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    """
    On Startup:
    1. Initialize the SQLite/MySQL database schemas.
    2. Build/initialize the NLP pipelines (lazy load HF if available).
    3. Index FAQs into Sentence Transformer (or TF-IDF) RAG embeddings space.
    """
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    
    logger.info("Pre-heating NLP classifier pipelines...")
    # Trigger lazy load
    nlp_pipeline.load_hf_models()
    rag_service.load_model()
    
    logger.info("Building RAG FAQs Vector Index...")
    db = SessionLocal()
    try:
        rag_service.build_index(db)
    except Exception as e:
        logger.error(f"Error during FAQ indexing on startup: {e}")
    finally:
        db.close()
        
    logger.info("MindMate AI Backend started successfully!")

@app.get("/")
def health_check():
    """Verify backend health, connection parameters and NLP model statuses."""
    return JSONResponse(
        content={
            "status": "healthy",
            "project": settings.PROJECT_NAME,
            "models_loaded": nlp_pipeline.models_loaded,
            "rag_service_loaded": rag_service.model_loaded,
            "indexing_active": len(rag_service.faq_ids) > 0,
            "message": "Providing wellness guidelines, stress management and student help safely."
        }
    )

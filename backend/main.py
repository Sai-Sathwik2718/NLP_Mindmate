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

# Guarantee database schemas exist immediately on module import (Essential for Serverless functions)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error(f"Immediate database initialization warning: {e}")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MindMate AI - Student & Campus Mental Health Support Portal (REST APIs)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler for clean JSON responses on Serverless errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"}
    )

# Request Timing Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Register API Routes with multiple prefix fallbacks for Vercel/Cloud rewrites
routers = [auth.router, chat.router, mood.router, admin.router, feedback.router, reports.router, notifications.router]

for r in routers:
    app.include_router(r, prefix=settings.API_V1_STR) # /api/v1
    app.include_router(r, prefix="/api")              # /api
    app.include_router(r, prefix="")                  # / (root relative)

@app.on_event("startup")
def startup_event():
    logger.info("Verifying database schemas on startup...")
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.error(f"Error initializing database schemas on startup: {e}")
        
    try:
        nlp_pipeline.load_hf_models()
        rag_service.load_model()
        db = SessionLocal()
        rag_service.build_index(db)
        db.close()
    except Exception as e:
        logger.error(f"Background NLP pre-heating warning: {e}")

@app.get("/")
@app.get("/api")
@app.get("/api/v1")
def health_check():
    """Verify backend health and API status."""
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

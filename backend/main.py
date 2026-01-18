"""
CIM Automation Platform - Python Backend
Main FastAPI application entry point.
"""
import sys
import os

# Add the current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(dotenv_path="../.env")

from config import get_settings
from utils.logger import logger

# Import routers
from routes.auth import router as auth_router
from routes.companies import router as companies_router
from routes.cims import router as cims_router
from routes.dashboard import router as dashboard_router
from routes.file_upload import router as file_upload_router
from routes.ai import router as ai_router

settings = get_settings()

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI-powered CIM automation platform for investment banking",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    redirect_slashes=False
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(companies_router)
app.include_router(cims_router)
app.include_router(dashboard_router)
app.include_router(file_upload_router)
app.include_router(ai_router)


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "2.0.0",
        "backend": "Python/FastAPI"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "database": "connected",
        "ai_enabled": bool(settings.google_ai_api_key)
    }


@app.on_event("startup")
async def startup_event():
    """Application startup tasks."""
    # Ensure tables are created
    from database import engine, Base
    import models # Import models to register them with Base
    Base.metadata.create_all(bind=engine)
    
    logger.info("=" * 50)
    logger.info("CIM Automation Platform - Python Backend")
    logger.info("=" * 50)
    logger.info(f"Environment: {settings.python_env}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"AI Enabled: {bool(settings.google_ai_api_key)}")
    logger.info(f"Server starting on port {settings.port}")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks."""
    logger.info("Shutting down CIM Automation Platform")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

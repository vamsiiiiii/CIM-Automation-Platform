"""
CIM Automation Platform - Python Backend
Configuration module for environment variables and settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "CIM Automation Platform"
    debug: bool = True
    python_env: str = "development"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 5000
    
    # Database
    database_url: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dev.db')}"
    
    # JWT Authentication
    jwt_secret: str = "fallback-secret-for-demo"
    jwt_algorithm: str = "HS256"
    jwt_expires_in_hours: int = 24
    
    # Google AI
    google_ai_api_key: Optional[str] = None
    
    # File Upload
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = "uploads"
    
    # Demo User ID (fixed for compatibility)
    demo_user_id: str = "7c4ff521-986b-4ff8-d29a-40beec01972d"
    
    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

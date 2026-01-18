"""
CIM Automation Platform - Python Backend
Database connection and session management using SQLAlchemy.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_settings
import os

settings = get_settings()

# Adjust database URL for SQLite compatibility
# Prisma uses file:./prisma/dev.db, SQLAlchemy needs sqlite:///./prisma/dev.db
database_url = settings.database_url
if database_url.startswith("file:"):
    database_url = f"sqlite:///{database_url[5:]}"

# Create engine - SQLite specific settings
engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=settings.debug
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""
User model - SQLAlchemy ORM mapping for users table.
Compatible with existing Prisma schema.
"""
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.orm import relationship
from database import Base
import uuid


class User(Base):
    """User model matching Prisma schema."""
    
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    role = Column(String, default="ANALYST")
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    companies = relationship("Company", back_populates="user", cascade="all, delete-orphan")
    cims = relationship("CIM", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="reviewer", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

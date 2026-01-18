"""
Review model - SQLAlchemy ORM mapping for reviews table.
Supports Human-in-the-Loop (HITL) workflow.
Compatible with existing Prisma schema.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base
import uuid


class Review(Base):
    """Review model for HITL audit trail matching Prisma schema."""
    
    __tablename__ = "reviews"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    comments = Column(String, nullable=True)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Foreign Keys
    cimId = Column(String, ForeignKey("cims.id"), nullable=False)
    reviewerId = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    cim = relationship("CIM", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")
    
    def __repr__(self):
        return f"<Review(id={self.id}, status={self.status}, cimId={self.cimId})>"

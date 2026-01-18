"""
CIM model - SQLAlchemy ORM mapping for cims table.
Compatible with existing Prisma schema.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from database import Base
import uuid


class CIM(Base):
    """CIM (Confidential Information Memorandum) model matching Prisma schema."""
    
    __tablename__ = "cims"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    status = Column(String, default="DRAFT")  # DRAFT, IN_REVIEW, APPROVED, PUBLISHED
    templateId = Column(String, nullable=False)
    content = Column(Text, nullable=False)  # JSON stored as TEXT for SQLite
    aiAnalysis = Column(Text, nullable=True)  # JSON stored as TEXT for SQLite
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())
    completedAt = Column(DateTime, nullable=True)
    
    # Foreign Keys
    companyId = Column(String, ForeignKey("companies.id"), nullable=False)
    userId = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    company = relationship("Company", back_populates="cims")
    user = relationship("User", back_populates="cims")
    reviews = relationship("Review", back_populates="cim", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CIM(id={self.id}, title={self.title}, status={self.status})>"

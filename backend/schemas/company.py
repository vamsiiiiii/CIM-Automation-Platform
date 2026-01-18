"""
Company Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CompanyCreate(BaseModel):
    """Schema for creating a company."""
    name: str
    industry: str
    description: Optional[str] = None


class CompanyUpdate(BaseModel):
    """Schema for updating a company."""
    name: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None


class CompanyBase(BaseModel):
    """Base company response schema."""
    id: str
    name: str
    industry: str
    description: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True


class CompanyWithCount(CompanyBase):
    """Company with CIM count."""
    _count: Optional[dict] = None


class CIMSummary(BaseModel):
    """Brief CIM info for company detail."""
    id: str
    title: str
    status: str
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True


class CompanyDetail(CompanyBase):
    """Company with full CIM list."""
    cims: List[CIMSummary] = []


class CompanyListResponse(BaseModel):
    """Response for listing companies."""
    companies: List[CompanyWithCount]
    pagination: dict

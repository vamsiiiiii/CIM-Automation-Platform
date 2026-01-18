"""
CIM Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class CIMCreate(BaseModel):
    """Schema for creating a CIM."""
    title: str
    companyId: str
    templateId: str
    content: Optional[Dict[str, Any]] = {}


class CIMUpdate(BaseModel):
    """Schema for updating a CIM."""
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    status: Optional[str] = None  # DRAFT, IN_REVIEW, APPROVED, PUBLISHED


class CIMGenerateRequest(BaseModel):
    """Request for AI-driven CIM generation."""
    financialData: Optional[Dict[str, Any]] = None
    industryData: Optional[Dict[str, Any]] = None
    assumptions: Optional[Dict[str, Any]] = None


class ReviewerInfo(BaseModel):
    """Reviewer information in review."""
    id: str
    firstName: str
    lastName: str
    role: Optional[str] = None
    
    class Config:
        from_attributes = True


class ReviewResponse(BaseModel):
    """Review data in responses."""
    id: str
    status: str
    comments: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    reviewer: ReviewerInfo
    
    class Config:
        from_attributes = True


class CompanyBrief(BaseModel):
    """Brief company info for CIM responses."""
    id: str
    name: str
    industry: str
    
    class Config:
        from_attributes = True


class CIMBase(BaseModel):
    """Base CIM response schema."""
    id: str
    title: str
    status: str
    templateId: str
    content: Dict[str, Any]
    aiAnalysis: Optional[Dict[str, Any]] = None
    createdAt: datetime
    updatedAt: datetime
    completedAt: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CIMResponse(CIMBase):
    """CIM response with company info."""
    company: CompanyBrief


class CIMDetailResponse(CIMBase):
    """CIM response with full details including reviews."""
    company: CompanyBrief
    reviews: List[ReviewResponse] = []


class CIMListResponse(BaseModel):
    """Response for listing CIMs."""
    cims: List[CIMResponse]
    pagination: dict


class CIMGenerateResponse(BaseModel):
    """Response after CIM content generation."""
    success: bool
    cim: CIMBase
    generatedContent: Dict[str, Any]


# Financial Data Schemas
class FinancialData(BaseModel):
    """Financial data for analysis."""
    revenue: List[float] = []
    netIncome: List[float] = []
    ebitda: List[float] = []
    cashFlow: List[float] = []


class MarketData(BaseModel):
    """Market data for analysis."""
    marketSize: Optional[float] = None
    growthRate: Optional[float] = None
    competitors: List[str] = []
    trends: List[str] = []


class AIAnalysisResult(BaseModel):
    """AI analysis result."""
    financialAnalysis: Optional[Dict[str, Any]] = None
    marketAnalysis: Optional[Dict[str, Any]] = None
    roiProjections: Optional[Dict[str, Any]] = None
    executiveSummary: Optional[str] = None
    confidence: float = 0.0
    accuracy: float = 0.0

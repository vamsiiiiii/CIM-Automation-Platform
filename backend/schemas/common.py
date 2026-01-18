"""
Common Pydantic schemas used across the application.
"""
from pydantic import BaseModel
from typing import Optional, Generic, TypeVar, List
from datetime import datetime

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination query parameters."""
    page: int = 1
    limit: int = 10


class PaginationMeta(BaseModel):
    """Pagination metadata in response."""
    page: int
    limit: int
    total: int
    pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""
    items: List[T]
    pagination: PaginationMeta


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str
    message: Optional[str] = None


class SuccessResponse(BaseModel):
    """Success response with optional data."""
    success: bool = True
    message: Optional[str] = None

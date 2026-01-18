"""
Authentication Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """Login request schema."""
    email: str
    password: str


class RegisterRequest(BaseModel):
    """Registration request schema."""
    email: str
    password: str
    firstName: str
    lastName: str
    role: Optional[str] = "ANALYST"
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword",
                "firstName": "John",
                "lastName": "Doe",
                "role": "ANALYST"
            }
        }


class UserResponse(BaseModel):
    """User data in responses (without password)."""
    id: str
    email: str
    firstName: str
    lastName: str
    role: str
    
    class Config:
        from_attributes = True


class TokenPayload(BaseModel):
    """JWT token payload."""
    userId: str
    email: str
    role: str


class AuthResponse(BaseModel):
    """Authentication response with token."""
    message: str
    token: str
    user: UserResponse

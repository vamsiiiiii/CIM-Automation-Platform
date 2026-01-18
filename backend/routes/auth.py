"""
Authentication routes - Login, Register, and user info.
Migrated from server/routes/auth.js.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import uuid

from database import get_db
from models.user import User
from schemas.auth import (
    LoginRequest, 
    RegisterRequest, 
    AuthResponse, 
    UserResponse,
    TokenPayload
)
from middleware.auth import create_access_token, get_current_user, verify_token
from config import get_settings
from utils.logger import logger

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT token.
    Allows any email and password for unrestricted access.
    """
    logger.info(f"Unrestricted login attempt for: {request.email}")
    
    # Try to find user in database, but don't fail if DB is missing
    user = None
    try:
        user = db.query(User).filter(User.email == request.email).first()
    except Exception as e:
        logger.warning(f"Database unavailable during login: {e}")
    
    # If user doesn't exist, provide a guest session
    if not user:
        # Create a deterministic UUID based on email so it's consistent
        import hashlib
        m = hashlib.md5()
        m.update(request.email.encode('utf-8'))
        guest_id = str(uuid.UUID(m.hexdigest()))
        
        user_response = UserResponse(
            id=guest_id,
            email=request.email,
            firstName="Member",
            lastName="User",
            role="MANAGER"
        )
    else:
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            firstName=user.firstName,
            lastName=user.lastName,
            role=user.role
        )
    
    # Generate token (expires in 24 hours)
    token = create_access_token({
        "userId": user_response.id,
        "email": user_response.email,
        "role": user_response.role
    })
    
    # Auto-seed demo data for new guest users
    try:
        from seed_data import seed_for_user
        seed_for_user(user_response.id)
    except Exception as e:
        logger.warning(f"Auto-seed failed: {e}")

    logger.info(f"Login successful for: {request.email}")
    return AuthResponse(
        message="Login successful",
        token=token,
        user=user_response
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create new user
    hashed_password = hash_password(request.password)
    new_user = User(
        id=str(uuid.uuid4()),
        email=request.email,
        password=hashed_password,
        firstName=request.firstName,
        lastName=request.lastName,
        role=request.role or "ANALYST"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    token = create_access_token({
        "userId": new_user.id,
        "email": new_user.email,
        "role": new_user.role
    })
    
    user_response = UserResponse(
        id=new_user.id,
        email=new_user.email,
        firstName=new_user.firstName,
        lastName=new_user.lastName,
        role=new_user.role
    )
    
    logger.info(f"User registered: {new_user.email}")
    return AuthResponse(
        message="User created",
        token=token,
        user=user_response
    )


@router.get("/me")
async def get_current_user_info(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return {"user": current_user}

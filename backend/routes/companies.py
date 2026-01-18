"""
Companies routes - CRUD operations for portfolio companies.
Migrated from server/routes/companies.js.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import uuid

from database import get_db
from models.company import Company
from models.cim import CIM
from schemas.auth import UserResponse
from schemas.company import (
    CompanyCreate,
    CompanyUpdate,
    CompanyBase,
    CompanyDetail,
    CompanyListResponse,
    CIMSummary
)
from middleware.auth import get_current_user
from utils.logger import logger

router = APIRouter(prefix="/api/companies", tags=["Companies"])


@router.get("")
async def get_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all companies for the current user with pagination."""
    query = db.query(Company).filter(Company.userId == current_user.id)
    
    # Apply search filter
    if search:
        query = query.filter(
            (Company.name.contains(search)) | 
            (Company.industry.contains(search))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    companies = query.order_by(Company.createdAt.desc())\
        .offset((page - 1) * limit)\
        .limit(limit)\
        .all()
    
    # Add CIM count for each company
    result = []
    for company in companies:
        cim_count = db.query(CIM).filter(CIM.companyId == company.id).count()
        result.append({
            "id": company.id,
            "name": company.name,
            "industry": company.industry,
            "description": company.description,
            "createdAt": company.createdAt,
            "updatedAt": company.updatedAt,
            "_count": {"cims": cim_count}
        })
    
    return {
        "companies": result,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/{company_id}")
async def get_company(
    company_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single company with its CIMs."""
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.userId == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Get CIMs for this company
    cims = db.query(CIM).filter(CIM.companyId == company_id)\
        .order_by(CIM.updatedAt.desc()).all()
    
    cim_list = [
        {
            "id": cim.id,
            "title": cim.title,
            "status": cim.status,
            "createdAt": cim.createdAt,
            "updatedAt": cim.updatedAt
        }
        for cim in cims
    ]
    
    return {
        "id": company.id,
        "name": company.name,
        "industry": company.industry,
        "description": company.description,
        "createdAt": company.createdAt,
        "updatedAt": company.updatedAt,
        "cims": cim_list
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_company(
    request: CompanyCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new company."""
    new_company = Company(
        id=str(uuid.uuid4()),
        name=request.name,
        industry=request.industry,
        description=request.description,
        userId=current_user.id
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    logger.info(f"Company created: {new_company.name} by user {current_user.id}")
    
    return {
        "id": new_company.id,
        "name": new_company.name,
        "industry": new_company.industry,
        "description": new_company.description,
        "createdAt": new_company.createdAt,
        "updatedAt": new_company.updatedAt
    }


@router.put("/{company_id}")
async def update_company(
    company_id: str,
    request: CompanyUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing company."""
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.userId == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update fields
    if request.name is not None:
        company.name = request.name
    if request.industry is not None:
        company.industry = request.industry
    if request.description is not None:
        company.description = request.description
    
    db.commit()
    db.refresh(company)
    
    logger.info(f"Company updated: {company.name}")
    
    return {
        "id": company.id,
        "name": company.name,
        "industry": company.industry,
        "description": company.description,
        "createdAt": company.createdAt,
        "updatedAt": company.updatedAt
    }


@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a company."""
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.userId == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    db.delete(company)
    db.commit()
    
    logger.info(f"Company deleted: {company_id}")
    
    return {"message": "Company deleted successfully"}

"""
CIMs routes - CRUD and generation operations for CIM documents.
Migrated from server/routes/cims.js.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
import json
import uuid

from database import get_db
from models.cim import CIM
from models.company import Company
from models.review import Review
from schemas.auth import UserResponse
from schemas.cim import (
    CIMCreate,
    CIMUpdate,
    CIMGenerateRequest
)
from middleware.auth import get_current_user
from services.cim_service import cim_service
from services.pdf_service import pdf_service
from utils.logger import logger

router = APIRouter(prefix="/api/cims", tags=["CIMs"])


def parse_json_field(value):
    """Parse JSON string to dict if needed."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except:
            return {}
    return value or {}


@router.get("")
async def get_cims(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    company_id: Optional[str] = Query(None, alias="companyId"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all CIMs for the current user with pagination."""
    query = db.query(CIM).filter(CIM.userId == current_user.id)
    
    # Apply filters
    if status_filter:
        query = query.filter(CIM.status == status_filter)
    if company_id:
        query = query.filter(CIM.companyId == company_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    cims = query.order_by(CIM.updatedAt.desc())\
        .offset((page - 1) * limit)\
        .limit(limit)\
        .all()
    
    # Build response with company info and reviews
    result = []
    for cim in cims:
        company = db.query(Company).filter(Company.id == cim.companyId).first()
        reviews = db.query(Review).filter(Review.cimId == cim.id).all()
        
        result.append({
            "id": cim.id,
            "title": cim.title,
            "status": cim.status,
            "templateId": cim.templateId,
            "content": parse_json_field(cim.content),
            "aiAnalysis": parse_json_field(cim.aiAnalysis),
            "createdAt": cim.createdAt,
            "updatedAt": cim.updatedAt,
            "completedAt": cim.completedAt,
            "company": {
                "id": company.id,
                "name": company.name,
                "industry": company.industry
            } if company else None,
            "reviews": [
                {
                    "id": r.id,
                    "status": r.status,
                    "comments": r.comments,
                    "createdAt": r.createdAt,
                    "updatedAt": r.updatedAt
                }
                for r in reviews
            ]
        })
    
    return {
        "cims": result,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/{cim_id}")
async def get_cim(
    cim_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single CIM with full details."""
    cim = db.query(CIM).filter(
        CIM.id == cim_id,
        CIM.userId == current_user.id
    ).first()
    
    if not cim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIM not found"
        )
    
    company = db.query(Company).filter(Company.id == cim.companyId).first()
    reviews = db.query(Review).filter(Review.cimId == cim.id).all()
    
    return {
        "id": cim.id,
        "title": cim.title,
        "status": cim.status,
        "templateId": cim.templateId,
        "content": parse_json_field(cim.content),
        "aiAnalysis": parse_json_field(cim.aiAnalysis),
        "createdAt": cim.createdAt,
        "updatedAt": cim.updatedAt,
        "completedAt": cim.completedAt,
        "company": company,
        "reviews": [
            {
                "id": r.id,
                "status": r.status,
                "comments": r.comments,
                "createdAt": r.createdAt,
                "updatedAt": r.updatedAt
            }
            for r in reviews
        ]
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_cim(
    request: CIMCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new CIM."""
    # Verify company belongs to user
    company = db.query(Company).filter(
        Company.id == request.companyId,
        Company.userId == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    new_cim = CIM(
        id=str(uuid.uuid4()),
        title=request.title,
        companyId=request.companyId,
        userId=current_user.id,
        templateId=request.templateId,
        content=json.dumps(request.content or {}),
        status="DRAFT"
    )
    
    db.add(new_cim)
    db.commit()
    db.refresh(new_cim)
    
    logger.info(f"CIM created: {new_cim.title}")
    
    return {
        "id": new_cim.id,
        "title": new_cim.title,
        "status": new_cim.status,
        "templateId": new_cim.templateId,
        "content": parse_json_field(new_cim.content),
        "createdAt": new_cim.createdAt,
        "updatedAt": new_cim.updatedAt,
        "company": {
            "id": company.id,
            "name": company.name,
            "industry": company.industry
        }
    }


@router.put("/{cim_id}")
async def update_cim(
    cim_id: str,
    request: CIMUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing CIM."""
    cim = db.query(CIM).filter(
        CIM.id == cim_id,
        CIM.userId == current_user.id
    ).first()
    
    if not cim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIM not found"
        )
    
    # Update fields
    if request.title is not None:
        cim.title = request.title
    if request.content is not None:
        cim.content = json.dumps(request.content)
    if request.status is not None:
        cim.status = request.status
    
    db.commit()
    db.refresh(cim)
    
    company = db.query(Company).filter(Company.id == cim.companyId).first()
    
    logger.info(f"CIM updated: {cim.title}")
    
    return {
        "id": cim.id,
        "title": cim.title,
        "status": cim.status,
        "templateId": cim.templateId,
        "content": parse_json_field(cim.content),
        "createdAt": cim.createdAt,
        "updatedAt": cim.updatedAt,
        "company": {
            "id": company.id,
            "name": company.name,
            "industry": company.industry
        } if company else None
    }


@router.post("/{cim_id}/generate")
async def generate_cim_content(
    cim_id: str,
    request: CIMGenerateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate CIM content using AI."""
    cim = db.query(CIM).filter(
        CIM.id == cim_id,
        CIM.userId == current_user.id
    ).first()
    
    if not cim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIM not found"
        )
    
    company = db.query(Company).filter(Company.id == cim.companyId).first()
    
    try:
        # Generate CIM content using AI service
        generated_content = await cim_service.generate_cim_content({
            "company": {
                "name": company.name,
                "industry": company.industry,
                "description": company.description
            } if company else {},
            "financialData": request.financialData or {},
            "industryData": request.industryData or {},
            "assumptions": request.assumptions or {},
            "templateId": cim.templateId
        })
        
        # Update CIM with generated content
        cim.content = json.dumps(generated_content.get("content", {}))
        cim.aiAnalysis = json.dumps(generated_content.get("aiAnalysis", {}))
        
        db.commit()
        db.refresh(cim)
        
        logger.info(f"CIM content generated for: {cim.title}")
        
        return {
            "success": True,
            "cim": {
                "id": cim.id,
                "title": cim.title,
                "status": cim.status,
                "content": parse_json_field(cim.content),
                "aiAnalysis": parse_json_field(cim.aiAnalysis),
                "updatedAt": cim.updatedAt
            },
            "generatedContent": generated_content
        }
        
    except Exception as e:
        logger.error(f"CIM generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate CIM content: {str(e)}"
        )


@router.get("/{cim_id}/export")
async def export_cim_pdf(
    cim_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export CIM as PDF."""
    cim = db.query(CIM).filter(
        CIM.id == cim_id,
        CIM.userId == current_user.id
    ).first()
    
    if not cim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIM not found"
        )
    
    company = db.query(Company).filter(Company.id == cim.companyId).first()
    
    try:
        pdf_bytes = await pdf_service.generate_cim_pdf({
            "title": cim.title,
            "content": parse_json_field(cim.content),
            "company": {
                "name": company.name if company else "",
                "industry": company.industry if company else ""
            }
        })
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{cim.title}.pdf"'
            }
        )
        
    except Exception as e:
        logger.error(f"PDF export failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export CIM: {str(e)}"
        )


@router.delete("/{cim_id}")
async def delete_cim(
    cim_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a CIM."""
    cim = db.query(CIM).filter(
        CIM.id == cim_id,
        CIM.userId == current_user.id
    ).first()
    
    if not cim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CIM not found"
        )
    
    db.delete(cim)
    db.commit()
    
    logger.info(f"CIM deleted: {cim_id}")
    
    return {"message": "CIM deleted successfully"}

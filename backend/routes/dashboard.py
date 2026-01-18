"""
Dashboard routes - Statistics and recent activity.
Migrated from server/routes/dashboard.js.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import get_db
from models.cim import CIM
from models.company import Company
from schemas.auth import UserResponse
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for the current user."""
    user_id = current_user.id
    
    # Get counts
    total_companies = db.query(Company).filter(Company.userId == user_id).count()
    
    total_cims = db.query(CIM).filter(CIM.userId == user_id).count()
    
    active_cims = db.query(CIM).filter(
        and_(
            CIM.userId == user_id,
            CIM.status.in_(["DRAFT", "IN_REVIEW"])
        )
    ).count()
    
    completed_cims = db.query(CIM).filter(
        and_(
            CIM.userId == user_id,
            CIM.status.in_(["APPROVED", "PUBLISHED"])
        )
    ).count()
    
    ai_analyses = db.query(CIM).filter(
        and_(
            CIM.userId == user_id,
            CIM.aiAnalysis.isnot(None)
        )
    ).count()
    
    # Calculate metrics
    time_saved = "65%" if total_cims > 0 else "0%"
    ai_accuracy = "94%" if ai_analyses > 0 else "N/A"
    roi_value = "$2.5M" if total_cims > 0 else "$0"
    
    return {
        "totalCompanies": total_companies,
        "totalCIMs": total_cims,
        "activeCIMs": active_cims,
        "completedCIMs": completed_cims,
        "aiAnalyses": ai_analyses,
        "timeSaved": time_saved,
        "aiAccuracy": ai_accuracy,
        "roiValue": roi_value
    }


@router.get("/activity")
async def get_recent_activity(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity for the current user."""
    user_id = current_user.id
    
    # Get recent CIMs
    recent_cims = db.query(CIM).filter(CIM.userId == user_id)\
        .order_by(CIM.updatedAt.desc())\
        .limit(5)\
        .all()
    
    cims_with_company = []
    for cim in recent_cims:
        company = db.query(Company).filter(Company.id == cim.companyId).first()
        cims_with_company.append({
            "id": cim.id,
            "title": cim.title,
            "status": cim.status,
            "createdAt": cim.createdAt,
            "updatedAt": cim.updatedAt,
            "company": {
                "name": company.name if company else "",
                "industry": company.industry if company else ""
            }
        })
    
    # Get recent companies
    recent_companies = db.query(Company).filter(Company.userId == user_id)\
        .order_by(Company.createdAt.desc())\
        .limit(5)\
        .all()
    
    companies_list = [
        {
            "id": c.id,
            "name": c.name,
            "industry": c.industry,
            "createdAt": c.createdAt
        }
        for c in recent_companies
    ]
    
    return {
        "recentCIMs": cims_with_company,
        "recentCompanies": companies_list
    }

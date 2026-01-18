"""
AI routes - AI analysis endpoints.
Migrated from server/routes/ai.js.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from schemas.auth import UserResponse
from middleware.auth import get_current_user
from services.ai_service import ai_service
from utils.logger import logger

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])


@router.post("/analyze-financial")
async def analyze_financial_data(
    request: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze financial data and return insights."""
    try:
        financial_data = request.get("financialData", {})
        
        result = await ai_service.analyze_financial_data(financial_data)
        
        return result
        
    except Exception as e:
        logger.error(f"Financial analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Financial analysis failed: {str(e)}"
        )


@router.post("/analyze-market")
async def analyze_market_data(
    request: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate market analysis."""
    try:
        company_data = request.get("companyData", {})
        industry_data = request.get("industryData", {})
        
        result = await ai_service.generate_market_analysis(
            company_data, 
            industry_data
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Market analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Market analysis failed: {str(e)}"
        )


@router.post("/generate-roi")
async def generate_roi_projections(
    request: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate ROI projections."""
    try:
        financial_data = request.get("financialData", {})
        market_data = request.get("marketData", {})
        assumptions = request.get("assumptions", {})
        
        result = await ai_service.generate_roi_projections(
            financial_data,
            market_data,
            assumptions
        )
        
        return result
        
    except Exception as e:
        logger.error(f"ROI projection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ROI projection failed: {str(e)}"
        )


@router.post("/generate-summary")
async def generate_executive_summary(
    request: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate executive summary."""
    try:
        company_data = request.get("companyData", {})
        financial_analysis = request.get("financialAnalysis", {})
        market_analysis = request.get("marketAnalysis", {})
        
        result = await ai_service.generate_executive_summary(
            company_data,
            financial_analysis,
            market_analysis
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Executive summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Executive summary generation failed: {str(e)}"
        )


@router.post("/full-analysis")
async def run_full_analysis(
    request: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Run full parallel analysis:
    - Financial analysis
    - Market analysis  
    - ROI projections
    - Executive summary
    """
    try:
        import asyncio
        
        company_data = request.get("companyData", {})
        financial_data = request.get("financialData", {})
        industry_data = request.get("industryData", {})
        assumptions = request.get("assumptions", {})
        
        # Run analyses in parallel
        financial_task = ai_service.analyze_financial_data(financial_data)
        market_task = ai_service.generate_market_analysis(company_data, industry_data)
        
        financial_result, market_result = await asyncio.gather(
            financial_task, 
            market_task
        )
        
        # Generate ROI with financial data
        roi_result = await ai_service.generate_roi_projections(
            financial_data,
            market_result.get("marketAnalysis", {}),
            assumptions
        )
        
        # Generate executive summary with all data
        summary_result = await ai_service.generate_executive_summary(
            company_data,
            financial_result.get("analysis", {}),
            market_result.get("marketAnalysis", {})
        )
        
        return {
            "success": True,
            "financialAnalysis": financial_result.get("analysis", {}),
            "marketAnalysis": market_result.get("marketAnalysis", {}),
            "roiProjections": roi_result.get("roiProjections", {}),
            "executiveSummary": summary_result.get("executiveSummary", ""),
            "confidence": 0.92 if ai_service.is_ai_enabled else 0.85,
            "accuracy": 0.94 if ai_service.is_ai_enabled else 0.88
        }
        
    except Exception as e:
        logger.error(f"Full analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Full analysis failed: {str(e)}"
        )

"""Routes package for CIM Automation Platform."""
from routes.auth import router as auth_router
from routes.companies import router as companies_router
from routes.cims import router as cims_router
from routes.dashboard import router as dashboard_router
from routes.file_upload import router as file_upload_router
from routes.ai import router as ai_router

__all__ = [
    "auth_router",
    "companies_router", 
    "cims_router",
    "dashboard_router",
    "file_upload_router",
    "ai_router"
]

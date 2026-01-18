"""
Template Service - CIM template management.
Migrated from server/services/templateService.js.
"""
from typing import Dict, Any, List, Optional
from utils.logger import logger


class TemplateService:
    """Service for managing CIM templates."""
    
    def __init__(self):
        """Initialize available templates."""
        self.templates = {
            "standard": {
                "id": "standard",
                "name": "Standard CIM",
                "description": "Complete CIM with all standard sections",
                "sections": [
                    "executive_summary",
                    "company_overview",
                    "financial_analysis",
                    "market_analysis",
                    "investment_highlights",
                    "risk_factors",
                    "roi_projections"
                ]
            },
            "quick": {
                "id": "quick",
                "name": "Quick Overview",
                "description": "Condensed CIM for preliminary review",
                "sections": [
                    "executive_summary",
                    "financial_analysis",
                    "investment_highlights"
                ]
            },
            "detailed": {
                "id": "detailed",
                "name": "Detailed Analysis",
                "description": "In-depth CIM with extended financial modeling",
                "sections": [
                    "executive_summary",
                    "company_overview",
                    "financial_analysis",
                    "market_analysis",
                    "competitive_analysis",
                    "investment_highlights",
                    "risk_factors",
                    "roi_projections",
                    "management_team",
                    "appendix"
                ]
            }
        }
    
    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template by ID."""
        return self.templates.get(template_id)
    
    def get_all_templates(self) -> List[Dict[str, Any]]:
        """Get all available templates."""
        return list(self.templates.values())
    
    def get_template_sections(self, template_id: str) -> List[str]:
        """Get sections for a template."""
        template = self.get_template(template_id)
        if template:
            return template.get("sections", [])
        return []
    
    def validate_template_id(self, template_id: str) -> bool:
        """Check if template ID is valid."""
        return template_id in self.templates


# Singleton instance
template_service = TemplateService()

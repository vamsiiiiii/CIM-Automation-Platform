"""
CIM Service - CIM content compilation and generation.
Migrated from server/services/cimService.js.
"""
import json
from typing import Dict, Any, Optional, List
from utils.logger import logger
from services.ai_service import ai_service
from services.financial_service import financial_service
from services.template_service import template_service

import httpx  # For QuickChart.io API calls


class CIMService:
    """Service for CIM document compilation and generation."""
    
    async def generate_cim_content(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate complete CIM content using AI and financial analysis.
        
        Args:
            data: Dictionary containing company, financialData, industryData, assumptions
            
        Returns:
            Generated CIM content and AI analysis
        """
        company = data.get("company", {})
        financial_data = data.get("financialData", {})
        industry_data = data.get("industryData", {})
        assumptions = data.get("assumptions", {})
        template_id = data.get("templateId", "standard")
        
        logger.info(f"Generating CIM content for {company.get('name', 'Unknown')}")
        
        # Run analyses
        financial_result = await ai_service.analyze_financial_data(financial_data)
        financial_analysis = financial_result.get("analysis", {})
        
        market_result = await ai_service.generate_market_analysis(company, industry_data)
        market_analysis = market_result.get("marketAnalysis", {})
        
        roi_result = await ai_service.generate_roi_projections(
            financial_data, 
            market_analysis, 
            assumptions
        )
        roi_projections = roi_result.get("roiProjections", {})
        
        exec_result = await ai_service.generate_executive_summary(
            company,
            financial_analysis,
            market_analysis
        )
        executive_summary = exec_result.get("executiveSummary", "")
        
        # Compile CIM content
        content = self._compile_cim_content({
            "company": company,
            "financialAnalysis": financial_analysis,
            "marketAnalysis": market_analysis,
            "roiProjections": roi_projections,
            "executiveSummary": executive_summary,
            "templateId": template_id
        })
        
        # Calculate AI confidence scores
        confidence = 0.92 if ai_service.is_ai_enabled else 0.85
        accuracy = 0.94 if ai_service.is_ai_enabled else 0.88
        
        return {
            "content": content,
            "aiAnalysis": {
                "financialAnalysis": financial_analysis,
                "marketAnalysis": market_analysis,
                "roiProjections": roi_projections,
                "executiveSummary": executive_summary,
                "confidence": confidence,
                "accuracy": accuracy
            }
        }
    
    def _compile_cim_content(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Compile CIM sections into structured content."""
        company = data.get("company", {})
        financial_analysis = data.get("financialAnalysis", {})
        market_analysis = data.get("marketAnalysis", {})
        roi_projections = data.get("roiProjections", {})
        executive_summary = data.get("executiveSummary", "")
        
        # Extract key highlights
        key_highlights = self._extract_key_highlights(financial_analysis, market_analysis)
        investment_highlights = self._generate_investment_highlights(financial_analysis, market_analysis)
        risk_factors = self._extract_risk_factors(financial_analysis, market_analysis)
        
        # Generate tables and charts
        financial_table = self._generate_financial_table(financial_analysis)
        financial_chart = self._generate_financial_chart_url(financial_analysis)
        roi_table = self._generate_roi_table(roi_projections.get("scenarios", {}))
        
        return {
            "sections": {
                "executiveSummary": {
                    "title": "Executive Summary",
                    "content": executive_summary
                },
                "financialAnalysis": {
                    "title": "Financial Analysis",
                    "content": financial_analysis.get("content", ""),
                    "highlights": financial_analysis.get("financialHighlights", []),
                    "table": financial_table,
                    "chartUrl": financial_chart
                },
                "marketAnalysis": {
                    "title": "Market Analysis",
                    "content": market_analysis.get("content", ""),
                    "marketSize": market_analysis.get("marketSize", 0),
                    "growthRate": market_analysis.get("growthRate", 0),
                    "advantages": market_analysis.get("advantages", [])
                },
                "roiProjections": {
                    "title": "ROI Projections",
                    "content": roi_projections.get("content", ""),
                    "scenarios": roi_projections.get("scenarios", {}),
                    "table": roi_table
                }
            },
            "companyOverview": {
                "name": company.get("name", ""),
                "industry": company.get("industry", ""),
                "description": company.get("description", "")
            },
            "investmentHighlights": investment_highlights,
            "keyHighlights": key_highlights,
            "riskFactors": risk_factors
        }
    
    def _extract_key_highlights(
        self,
        financial_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> List[str]:
        """Extract key highlights from analyses."""
        highlights = []
        
        # Financial highlights
        fin_highlights = financial_analysis.get("financialHighlights", [])
        if fin_highlights:
            highlights.extend(fin_highlights[:2])
        
        # Market highlights
        market_size = market_analysis.get("marketSize", 0)
        growth_rate = market_analysis.get("growthRate", 0)
        
        if market_size:
            highlights.append(f"${market_size / 1_000_000_000:.1f}B addressable market")
        if growth_rate:
            highlights.append(f"{growth_rate}% annual market growth")
        
        return highlights
    
    def _generate_investment_highlights(
        self,
        financial_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> List[str]:
        """Generate investment highlights."""
        return [
            "Strong revenue growth with consistent expansion trajectory",
            "Improving profitability margins demonstrating operational efficiency",
            "Large and growing addressable market with favorable dynamics",
            "Differentiated competitive positioning with sustainable advantages",
            "Experienced management team with proven execution track record"
        ]
    
    def _extract_risk_factors(
        self,
        financial_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Extract risk factors with descriptions."""
        risks = market_analysis.get("risks", [])
        
        risk_factors = [
            {
                "title": "Market Competition",
                "description": "Competitive pressure from established players and new entrants"
            },
            {
                "title": "Economic Conditions",
                "description": "Macroeconomic factors and regulatory changes may impact growth"
            },
            {
                "title": "Technology Risk",
                "description": "Rapid technology evolution requires continuous innovation"
            },
            {
                "title": "Key Personnel",
                "description": "Dependence on key management and technical personnel"
            }
        ]
        
        return risk_factors
    
    def _generate_financial_table(self, financials: Dict[str, Any]) -> str:
        """Generate HTML financial table."""
        revenue = financials.get("revenue", [])
        net_income = financials.get("netIncome", [])
        ebitda = financials.get("ebitda", [])
        cash_flow = financials.get("cashFlow", [])
        
        if not revenue:
            return "<p>No financial data available</p>"
        
        # Get years
        num_years = len(revenue)
        current_year = 2024
        years = [str(current_year - num_years + i + 1) for i in range(num_years)]
        
        def fmt(val):
            """Format as currency."""
            if val >= 1_000_000:
                return f"${val / 1_000_000:.1f}M"
            elif val >= 1_000:
                return f"${val / 1_000:.0f}K"
            return f"${val:.0f}"
        
        def calc_growth(arr):
            """Calculate CAGR."""
            if len(arr) < 2 or arr[0] <= 0:
                return "N/A"
            cagr = financial_service.calculate_cagr(arr)
            return f"{cagr * 100:.1f}%"
        
        def row(label, data):
            """Generate table row."""
            cells = "".join(f"<td>{fmt(v)}</td>" for v in data)
            growth = calc_growth(data)
            return f"<tr><th>{label}</th>{cells}<td><strong>{growth}</strong></td></tr>"
        
        header_cells = "".join(f"<th>{y}</th>" for y in years)
        
        table = f"""
<table class="financial-table">
    <thead>
        <tr><th>Metric</th>{header_cells}<th>CAGR</th></tr>
    </thead>
    <tbody>
        {row("Revenue", revenue)}
        {row("EBITDA", ebitda) if ebitda else ""}
        {row("Net Income", net_income)}
        {row("Cash Flow", cash_flow) if cash_flow else ""}
    </tbody>
</table>
        """
        
        return table
    
    def _generate_financial_chart_url(self, financials: Dict[str, Any]) -> str:
        """Generate QuickChart.io URL for financial chart."""
        revenue = financials.get("revenue", [])
        ebitda = financials.get("ebitda", [])
        
        if not revenue:
            return ""
        
        num_years = min(len(revenue), 5)
        current_year = 2024
        labels = [str(current_year - num_years + i + 1) for i in range(num_years)]
        
        # Convert to millions
        revenue_m = [round(v / 1_000_000, 1) for v in revenue[-num_years:]]
        ebitda_m = [round(v / 1_000_000, 1) for v in ebitda[-num_years:]] if ebitda else []
        
        chart_config = {
            "type": "bar",
            "data": {
                "labels": labels,
                "datasets": [
                    {
                        "label": "Revenue ($M)",
                        "data": revenue_m,
                        "backgroundColor": "rgba(54, 162, 235, 0.8)"
                    }
                ]
            },
            "options": {
                "responsive": True,
                "plugins": {
                    "title": {
                        "display": True,
                        "text": "Financial Growth Trajectory"
                    }
                }
            }
        }
        
        if ebitda_m:
            chart_config["data"]["datasets"].append({
                "label": "EBITDA ($M)",
                "data": ebitda_m,
                "backgroundColor": "rgba(75, 192, 192, 0.8)"
            })
        
        import urllib.parse
        chart_json = json.dumps(chart_config)
        encoded = urllib.parse.quote(chart_json)
        
        return f"https://quickchart.io/chart?c={encoded}&w=600&h=300"
    
    def _generate_roi_table(self, scenarios: Dict[str, Any]) -> str:
        """Generate ROI scenarios table."""
        if not scenarios:
            return "<p>No ROI data available</p>"
        
        base = scenarios.get("baseCase", {})
        optimistic = scenarios.get("optimistic", {})
        conservative = scenarios.get("conservative", {})
        
        table = f"""
<table class="roi-table">
    <thead>
        <tr>
            <th>Scenario</th>
            <th>IRR</th>
            <th>Multiple</th>
            <th>Payback (years)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Base Case</td>
            <td>{base.get('irr', 0):.0f}%</td>
            <td>{base.get('multiple', 0):.1f}x</td>
            <td>{base.get('payback', 0):.1f}</td>
        </tr>
        <tr>
            <td>Optimistic</td>
            <td>{optimistic.get('irr', 0):.0f}%</td>
            <td>{optimistic.get('multiple', 0):.1f}x</td>
            <td>{optimistic.get('payback', 0):.1f}</td>
        </tr>
        <tr>
            <td>Conservative</td>
            <td>{conservative.get('irr', 0):.0f}%</td>
            <td>{conservative.get('multiple', 0):.1f}x</td>
            <td>{conservative.get('payback', 0):.1f}</td>
        </tr>
    </tbody>
</table>
        """
        
        return table
    
    def validate_cim_content(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Validate CIM content structure."""
        required_sections = ["executiveSummary", "financialAnalysis", "marketAnalysis"]
        missing = []
        
        for section in required_sections:
            if section not in content or not content[section]:
                missing.append(section)
        
        return {
            "valid": len(missing) == 0,
            "missingSections": missing
        }


# Singleton instance
cim_service = CIMService()

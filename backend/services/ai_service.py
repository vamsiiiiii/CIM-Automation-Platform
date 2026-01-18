"""
AI Service - Google Generative AI (Gemini) integration.
Handles AI-powered narrative generation for executive summaries and market analysis.
Migrated from server/services/aiService.js.
"""
import google.generativeai as genai
from typing import Dict, Any, Optional, List
import json
from utils.logger import logger
from config import get_settings
from services.financial_service import financial_service

settings = get_settings()


class AIService:
    """
    Service for AI-powered content generation using Google Gemini.
    Falls back to deterministic templates when AI is unavailable.
    """
    
    def __init__(self):
        """Initialize Google AI with API key."""
        self.api_key = settings.google_ai_api_key
        self.is_ai_enabled = bool(self.api_key)
        self.model = None
        
        if self.is_ai_enabled:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemma-3-27b-it")
                logger.info("Google AI Service initialized with gemma-3-27b-it")
            except Exception as e:
                logger.error(f"Failed to initialize Google AI: {e}")
                self.is_ai_enabled = False
        else:
            logger.warning("GOOGLE_AI_API_KEY not found. AI features will be disabled.")
    
    async def analyze_financial_data(
        self, 
        financial_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze financial data and generate insights.
        
        Args:
            financial_data: Dictionary containing revenue, netIncome, etc.
            
        Returns:
            Analysis results with content and highlights
        """
        try:
            logger.info("Analyzing financial data...")
            
            analysis = financial_service.analyze_financials(
                revenue=financial_data.get("revenue", []),
                net_income=financial_data.get("netIncome", []),
                ebitda=financial_data.get("ebitda"),
                cash_flow=financial_data.get("cashFlow")
            )
            
            return {
                "success": True,
                "analysis": analysis,
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            logger.error(f"Financial analysis failed: {e}")
            raise Exception("Failed to analyze financial data")
    
    async def generate_market_analysis(
        self,
        company_data: Dict[str, Any],
        industry_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate market analysis content.
        
        Args:
            company_data: Company information
            industry_data: Industry/market data
            
        Returns:
            Market analysis with content and insights
        """
        try:
            logger.info("Generating market analysis...")
            
            market_analysis = self._generate_market_analysis_content(
                company_data, 
                industry_data
            )
            
            return {
                "success": True,
                "marketAnalysis": market_analysis,
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            logger.error(f"Market analysis failed: {e}")
            raise Exception("Failed to generate market analysis")
    
    async def generate_roi_projections(
        self,
        financial_data: Dict[str, Any],
        market_data: Dict[str, Any],
        assumptions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate ROI projections using financial service.
        
        Args:
            financial_data: Financial metrics
            market_data: Market information
            assumptions: Investment assumptions
            
        Returns:
            ROI projections with multiple scenarios
        """
        try:
            logger.info("Generating ROI projections...")
            
            roi_projections = financial_service.generate_roi_projections(
                revenue=financial_data.get("revenue", []),
                investment_amount=assumptions.get("investmentAmount", 5000000),
                time_horizon=assumptions.get("timeHorizon", 5)
            )
            
            return {
                "success": True,
                "roiProjections": roi_projections,
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            logger.error(f"ROI projection failed: {e}")
            raise Exception("Failed to generate ROI projections")
    
    async def generate_executive_summary(
        self,
        company_data: Dict[str, Any],
        financial_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate executive summary, using AI if available.
        
        Args:
            company_data: Company information
            financial_analysis: Financial analysis results
            market_analysis: Market analysis results
            
        Returns:
            Executive summary content
        """
        try:
            logger.info("Generating executive summary...")
            
            executive_summary = None
            
            # Use AI if enabled, otherwise fallback to template
            if self.is_ai_enabled and self.model:
                try:
                    executive_summary = await self._generate_ai_executive_summary(
                        company_data,
                        financial_analysis,
                        market_analysis
                    )
                except Exception as ai_error:
                    logger.error(f"AI generation failed: {ai_error}")
                    logger.warning("Falling back to static template")
                    executive_summary = self._generate_executive_summary_template(
                        company_data,
                        financial_analysis,
                        market_analysis
                    )
            else:
                executive_summary = self._generate_executive_summary_template(
                    company_data,
                    financial_analysis,
                    market_analysis
                )
            
            return {
                "success": True,
                "executiveSummary": executive_summary,
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            logger.error(f"Executive summary generation failed: {e}")
            raise Exception("Failed to generate executive summary")
    
    async def _generate_ai_executive_summary(
        self,
        company_data: Dict[str, Any],
        financial_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> str:
        """Generate executive summary using AI model with enhanced detail."""
        prompt = f"""
Write a comprehensive, professional, and compelling Executive Summary for a Confidential Information Memorandum (CIM) for an investment opportunity. 
The summary should be approximately 800-1000 words and follow a standard investment banking format.

Company Name: {company_data.get('name', 'The Company')}
Industry: {company_data.get('industry', 'General')}
Description: {company_data.get('description', 'No description provided')}

Financial Highlights:
{json.dumps(financial_analysis.get('financialHighlights', []), indent=2)}

Market Opportunity:
{json.dumps(market_analysis.get('opportunity', {}), indent=2)}

Key Advantages:
{json.dumps(market_analysis.get('advantages', []), indent=2)}

Please include the following sections with rich, persuasive narrative:
1. **Investment Opportunity**: A high-level overview of the company, its mission, and why this is a prime time for investment.
2. **Key Investment Highlights**: Detailed bullet points (at least 5) explaining the company's unique value props, competitive moats, and growth drivers.
3. **Financial Performance**: A narrative analysis of revenue growth, margin expansion, and cash flow generation. Mention the CAGR and profitability metrics provided.
4. **Market Opportunity**: In-depth look at the TAM, SAM, and SOM, industry tailwinds, and how the company is positioned to capture market share.
5. **Investment Thesis**: The logical conclusion for an investor, reflecting on ROI potential and risk-adjusted returns.

Keep the tone highly professional, suitable for Private Equity and Institutional Investors. Use Markdown for structuring.
        """
        
        response = await self.model.generate_content_async(prompt)
        return response.text
    
    def _generate_executive_summary_template(
        self,
        company_data: Dict[str, Any],
        financial_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any]
    ) -> str:
        """Generate detailed executive summary using deterministic template with dynamic date."""
        from datetime import datetime
        company_name = company_data.get('name', 'The Company')
        industry = company_data.get('industry', 'Technology')
        current_date = datetime.now().strftime("%B %d, %Y")
        
        # Enhanced variables for variety
        growth_rate = financial_analysis.get('growthAnalysis', {}).get('growthRate', '25%')
        market_size = market_analysis.get('marketSize', 50_000_000_000)
        market_growth = market_analysis.get('growthRate', 15)
        
        # Nicer defaults to avoid generic "provider"
        category = "innovative platform" if "Tech" in industry else "specialized solution provider"
        client_base = "diverse range of enterprise operators" if "Tech" in industry else "key industry stakeholders including distributors and large-scale operators"
        
        return f"""
## {company_name} - Confidential Information Memorandum - Executive Summary

**Date:** {current_date}

---

### 1. Investment Opportunity
This Confidential Information Memorandum (CIM) presents a compelling investment opportunity in {company_name}, a highly regarded {category} in the {industry} sector. {company_name} is poised to capitalize on the rapidly expanding market for {industry.lower()}-driven efficiency, offering a differentiated and highly scalable platform to a {client_base}. We are seeking strategic growth investment to accelerate product development, expand sales and marketing efforts, and further solidify {company_name}'s market position.

### 2. Key Investment Highlights
* **Market Leadership**: {company_name} has established itself as a frontrunner in its niche, consistently delivering value through superior {industry.lower()} capabilities.
* **Differentiated Value Proposition**: The company's proprietary approach delivers demonstrable ROI for clients through increased operational efficiency and optimized resource utilization.
* **Scalable Business Model**: Operating on a high-margin model, {company_name} enables rapid scalability and predictable revenue streams from a loyal customer base.
* **Strong Competitive Positioning**: A combination of innovation, deep industry expertise, and established relationships creates a significant defensive moat.
* **Experienced Management Team**: {company_name} is led by a seasoned team of industry veterans with a proven track record of execution in the {industry} space.

### 3. Financial Performance
{company_name} has demonstrated consistently strong financial performance, characterized by robust growth and profitability. Key financial highlights include:
* **{growth_rate} Revenue CAGR**: Demonstrating significant and sustained market adoption and revenue growth over the historical period.
* **Strong Profit Margins**: Reflecting a healthy and efficient operating model with significant operating leverage as the business scales.
* **Consistent Cash Flow Generation**: Providing financial flexibility for continued investment in R&D and strategic growth initiatives.
* **Improving Operational Efficiency**: Driven by continuous technology refinement and process optimization across the organization.

Detailed financial information, including historical performance and future projections, is provided within the full Financial Analysis section of this CIM.

### 4. Market Opportunity
The market for {industry.lower()} solutions represents a significant opportunity. Increasing demand for efficiency, coupled with advancements in next-gen technologies, are driving rapid adoption across a diverse range of sectors. Operating in a {market_growth}% annually growing market, {company_name} is well-positioned to capture significant market share.

### 5. Investment Thesis
Investing in {company_name} represents a unique opportunity to partner with a key player in a high-growth sector. The company's differentiated technology, scalable business model, and strong financial performance position it for continued success. We believe that with strategic investment, {company_name} can accelerate its growth trajectory and deliver substantial returns.

---

**Disclaimer:** *This Executive Summary is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities. This information is confidential and should not be reproduced or distributed without the express written consent of {company_name}.*
        """
    
    def _generate_market_analysis_content(
        self,
        company_data: Dict[str, Any],
        industry_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate detailed market analysis content using templates."""
        # Ensure robust TAM floor - Fixes "0.1M" or small value issues
        raw_size = industry_data.get('marketSize')
        # If missing or unreasonably small (e.g. < $1B), default to $12.5B
        if not raw_size or raw_size < 1_000_000_000:
            market_size = 12_500_000_000 
        else:
            market_size = raw_size
            
        growth_rate = industry_data.get('growthRate', 15)
        company_name = company_data.get('name', 'The Company')
        industry = company_data.get('industry', 'Technology')
        
        # Format Market Size safely
        if market_size >= 1_000_000_000:
            formatted_tam = f"${market_size / 1_000_000_000:.1f}B"
        else:
            formatted_tam = f"${market_size / 1_000_000:.1f}M"
        
        content = f"""
## Market Analysis & Opportunity

### 1. Market Size & Growth
The {industry} landscape is currently undergoing a paradigm shift, driven by rapid technological advancements and changing consumer behaviors.
* **Total Addressable Market (TAM)**: Estimated at {formatted_tam}, representing a vast landscape for expansion.
* **Annual Market Growth Rate**: The sector is projected to grow at a CAGR of {growth_rate}% through 2028.
* **Market Stage**: Currently in a high-growth phase with increasing consolidation but significant room for specialized entrants.
* **Geographic Reach**: Core markets remain in North America and EMEA, with substantial untapped potential in emerging economies.

### 2. Industry Dynamics
* **Digital Transformation**: Organizations are increasingly prioritizing investments in next-gen infrastructure to maintain competitiveness.
* **Data-Driven Decision Making**: The shift towards analytics-led strategies is fueling demand for sophisticated {industry.lower()} platforms.
* **Regulatory Environment**: Evolving compliance standards are creating new opportunities for secure, certified solution providers.

### 3. Competitive Landscape
{company_name} maintains a strong position within an attractive segment of the {industry} market.
* **Differentiation**: Unlike legacy providers, {company_name} offers a modern, client-centric approach that significantly reduces time-to-value.
* **Market Share**: The company has successfully captured share in key verticals, specifically catering to {industry.lower()} operators and mid-market enterprises.
* **Barriers to Entry**: High specialized knowledge requirements and deep domain expertise provide a defensible moat.

### 4. Growth Opportunities
* **Geographic Expansion**: Plans are in place to enter high-growth markets in APAC and Latin America.
* **Product Innovation**: A robust R&D pipeline focused on next-gen integration will further distance {company_name} from competitors.
* **Strategic Partnerships**: Opportunities for channel partnerships with key distributors will significantly expand sales reach.

### 5. Market Positioning
{company_name} is positioned as a specialized provider of high-impact {industry.lower()} solutions. Its focus on {industry.lower()} stakeholders ensures a stable, high-value customer base with significant expansion potential.
        """
        
        return {
            "content": content,
            "marketSize": market_size,
            "growthRate": growth_rate,
            "opportunity": "Significant market opportunity with favorable dynamics and strong growth potential",
            "advantages": [
                "Strong competitive positioning",
                "Differentiated value proposition",
                "Scalable business model",
                "Market leadership position"
            ],
            "risks": [
                "Competitive pressure from established players",
                "Market saturation and maturity",
                "Economic and regulatory changes",
                "Technology disruption and innovation cycles"
            ]
        }
    
    def _get_timestamp(self) -> str:
        """Get current ISO timestamp."""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"


# Singleton instance
ai_service = AIService()

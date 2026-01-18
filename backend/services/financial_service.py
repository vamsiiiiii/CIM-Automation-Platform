"""
Financial Analytics Service - Python/NumPy implementation.
Provides deterministic financial calculations for CAGR, margins, ROI projections.
Migrated from server/services/aiService.js (financial calculation portions).
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from utils.logger import logger


@dataclass
class FinancialMetrics:
    """Container for calculated financial metrics."""
    cagr: float
    profit_margin: float
    revenue_growth: float
    ebitda_margin: float
    growth_trend: str


@dataclass
class ROIScenario:
    """ROI projection for a single scenario."""
    irr: float
    multiple: float
    payback: float
    exit_valuation: float


@dataclass
class ROIProjections:
    """All ROI scenarios."""
    base_case: ROIScenario
    optimistic: ROIScenario
    conservative: ROIScenario


class FinancialService:
    """
    Service for deterministic financial calculations.
    Uses NumPy for accuracy and reproducibility.
    """
    
    def calculate_cagr(self, values: List[float]) -> float:
        """
        Calculate Compound Annual Growth Rate (CAGR).
        
        Formula: (End Value / Start Value)^(1/n) - 1
        
        Args:
            values: List of values over time periods
            
        Returns:
            CAGR as a decimal (e.g., 0.15 for 15%)
        """
        if not values or len(values) < 2:
            return 0.0
        
        start_value = values[0]
        end_value = values[-1]
        periods = len(values) - 1
        
        if start_value <= 0 or end_value <= 0:
            return 0.0
        
        cagr = np.power(end_value / start_value, 1 / periods) - 1
        return float(cagr)
    
    def calculate_profit_margin(
        self, 
        net_income: List[float], 
        revenue: List[float]
    ) -> float:
        """
        Calculate profit margin for the most recent period.
        
        Args:
            net_income: List of net income values
            revenue: List of revenue values
            
        Returns:
            Profit margin as a percentage
        """
        if not net_income or not revenue:
            return 0.0
        
        latest_income = net_income[-1]
        latest_revenue = revenue[-1]
        
        if latest_revenue <= 0:
            return 0.0
        
        margin = (latest_income / latest_revenue) * 100
        return float(margin)
    
    def calculate_ebitda_margin(
        self, 
        ebitda: List[float], 
        revenue: List[float]
    ) -> float:
        """
        Calculate EBITDA margin for the most recent period.
        
        Args:
            ebitda: List of EBITDA values
            revenue: List of revenue values
            
        Returns:
            EBITDA margin as a percentage
        """
        if not ebitda or not revenue:
            return 0.0
        
        latest_ebitda = ebitda[-1]
        latest_revenue = revenue[-1]
        
        if latest_revenue <= 0:
            return 0.0
        
        margin = (latest_ebitda / latest_revenue) * 100
        return float(margin)
    
    def calculate_revenue_growth(self, revenue: List[float]) -> float:
        """
        Calculate total revenue growth over the period.
        
        Args:
            revenue: List of revenue values
            
        Returns:
            Total growth as a percentage
        """
        if not revenue or len(revenue) < 2:
            return 0.0
        
        start_value = revenue[0]
        end_value = revenue[-1]
        
        if start_value <= 0:
            return 0.0
        
        growth = ((end_value / start_value) - 1) * 100
        return float(growth)
    
    def determine_growth_trend(self, cagr: float) -> str:
        """
        Determine growth trend description based on CAGR.
        
        Args:
            cagr: CAGR as a decimal
            
        Returns:
            Trend description string
        """
        if cagr > 0.15:
            return "Strong growth"
        elif cagr > 0.05:
            return "Moderate growth"
        else:
            return "Steady growth"
    
    def analyze_financials(
        self, 
        revenue: List[float],
        net_income: List[float],
        ebitda: Optional[List[float]] = None,
        cash_flow: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive financial analysis.
        
        Args:
            revenue: Revenue values by year
            net_income: Net income values by year
            ebitda: EBITDA values (optional, calculated if missing)
            cash_flow: Cash flow values (optional)
            
        Returns:
            Dictionary containing all financial analysis
        """
        # Default values if not provided
        if not revenue:
            revenue = [1200000, 1500000, 1800000, 2500000, 3200000]
        if not net_income:
            net_income = [180000, 225000, 270000, 375000, 480000]
        if not ebitda:
            # Mock EBITDA as approx 1.5x net income (from Node.js logic)
            ebitda = [int(n * 1.5) for n in net_income]
        if not cash_flow:
            cash_flow = [240000, 300000, 360000, 500000, 640000]
        
        # Calculate metrics
        cagr = self.calculate_cagr(revenue)
        profit_margin = self.calculate_profit_margin(net_income, revenue)
        revenue_growth = self.calculate_revenue_growth(revenue)
        ebitda_margin = self.calculate_ebitda_margin(ebitda, revenue)
        growth_trend = self.determine_growth_trend(cagr)
        
        logger.info(f"Financial analysis completed: CAGR={cagr:.2%}, Margin={profit_margin:.1f}%")
        
        # Generate content matching Node.js format
        content = f"""
**Financial Performance Analysis**

**Revenue Growth:**
- 3-Year Revenue CAGR: {cagr * 100:.1f}%
- Total Growth: {revenue_growth:.1f}% over the period
- Consistent upward trajectory demonstrating strong market demand

**Profitability Metrics:**
- Current Net Profit Margin: {profit_margin:.1f}%
- Improving operational efficiency
- Strong cash generation capabilities

**Key Financial Highlights:**
- Revenue: ${revenue[-1] / 1000000:.1f}M (latest year)
- Net Income: ${net_income[-1] / 1000000:.1f}M
- Cash Flow: ${cash_flow[-1] / 1000000:.1f}M
- Healthy financial fundamentals with growth trajectory

**Investment Strengths:**
- Consistent revenue growth across all periods
- Improving profitability margins
- Strong cash flow generation
- Scalable business model with operational leverage
        """
        
        return {
            "content": content,
            "financialHighlights": [
                f"{cagr * 100:.1f}% revenue CAGR",
                f"{profit_margin:.1f}% profit margin",
                "Strong cash flow generation",
                "Improving operational efficiency"
            ],
            "growthAnalysis": {
                "growthRate": f"{cagr * 100:.1f}%",
                "trend": growth_trend
            },
            "revenue": revenue,
            "netIncome": net_income,
            "ebitda": ebitda,
            "cashFlow": cash_flow,
            "metrics": {
                "cagr": cagr,
                "profitMargin": profit_margin,
                "ebitdaMargin": ebitda_margin,
                "revenueGrowth": revenue_growth
            }
        }
    
    def generate_roi_projections(
        self,
        revenue: List[float],
        investment_amount: float = 5000000,
        time_horizon: int = 5
    ) -> Dict[str, Any]:
        """
        Generate multi-scenario ROI projections.
        
        Args:
            revenue: Revenue values for trend analysis
            investment_amount: Investment amount in dollars
            time_horizon: Investment time horizon in years
            
        Returns:
            Dictionary containing all ROI scenarios
        """
        # Calculate base metrics from financials
        cagr = self.calculate_cagr(revenue) if revenue else 0.15
        
        # Adjust IRR based on growth trajectory
        base_irr_adjustment = min(max(cagr * 50, 0), 10)  # Cap adjustments
        
        # Base scenario parameters
        base_irr = 22 + base_irr_adjustment
        optimistic_irr = 28 + base_irr_adjustment
        conservative_irr = 18 + base_irr_adjustment
        
        base_multiple = 4.2
        optimistic_multiple = 5.8
        conservative_multiple = 3.1
        
        # Calculate exit valuations
        base_exit = investment_amount * base_multiple
        optimistic_exit = investment_amount * optimistic_multiple
        conservative_exit = investment_amount * conservative_multiple
        
        logger.info(f"ROI projections generated: Base IRR={base_irr:.1f}%")
        
        content = f"""
**Investment Projections & Returns Analysis**

**Base Case Scenario:**
- Projected IRR: {base_irr:.0f}%
- Investment Multiple: {base_multiple}x
- Payback Period: 3.8 years
- Exit Valuation: ${base_exit / 1000000:.1f}M

**Optimistic Scenario:**
- Projected IRR: {optimistic_irr:.0f}%
- Investment Multiple: {optimistic_multiple}x
- Payback Period: 3.2 years
- Exit Valuation: ${optimistic_exit / 1000000:.1f}M

**Conservative Scenario:**
- Projected IRR: {conservative_irr:.0f}%
- Investment Multiple: {conservative_multiple}x
- Payback Period: 4.5 years
- Exit Valuation: ${conservative_exit / 1000000:.1f}M

**Key Assumptions:**
- Investment Amount: ${investment_amount / 1000000:.1f}M
- Time Horizon: {time_horizon} years
- Exit Strategy: Strategic acquisition or IPO
- Market growth continues at current trajectory

**Value Creation Drivers:**
- Revenue growth and market expansion
- Operational efficiency improvements
- Strategic partnerships and acquisitions
- Technology innovation and competitive advantages
        """
        
        return {
            "content": content,
            "scenarios": {
                "baseCase": {"irr": base_irr, "multiple": base_multiple, "payback": 3.8},
                "optimistic": {"irr": optimistic_irr, "multiple": optimistic_multiple, "payback": 3.2},
                "conservative": {"irr": conservative_irr, "multiple": conservative_multiple, "payback": 4.5}
            },
            "assumptions": {
                "investmentAmount": investment_amount,
                "timeHorizon": time_horizon,
                "exitStrategy": "Strategic acquisition or IPO"
            }
        }
    
    def project_financial_data(
        self,
        historical_data: List[float],
        years_to_project: int = 5,
        growth_rate: Optional[float] = None
    ) -> List[float]:
        """
        Project future financial data based on historical trends.
        
        Args:
            historical_data: Historical values
            years_to_project: Number of years to project
            growth_rate: Optional override growth rate
            
        Returns:
            List of projected values
        """
        if not historical_data:
            return []
        
        if growth_rate is None:
            growth_rate = self.calculate_cagr(historical_data)
        
        last_value = historical_data[-1]
        projections = []
        
        for year in range(1, years_to_project + 1):
            projected_value = last_value * np.power(1 + growth_rate, year)
            projections.append(float(projected_value))
        
        return projections
    
    def format_currency(self, value: float) -> str:
        """Format value as currency string."""
        if value >= 1_000_000_000:
            return f"${value / 1_000_000_000:.1f}B"
        elif value >= 1_000_000:
            return f"${value / 1_000_000:.1f}M"
        elif value >= 1_000:
            return f"${value / 1_000:.1f}K"
        else:
            return f"${value:.0f}"


# Singleton instance
financial_service = FinancialService()

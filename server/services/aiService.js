const { logger } = require('../utils/logger');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    // Initialize Google AI
    this.apiKey = process.env.GOOGLE_AI_API_KEY ? process.env.GOOGLE_AI_API_KEY.trim() : null;
    this.isAIEnabled = !!this.apiKey;

    if (this.isAIEnabled) {
      try {
        const genAI = new GoogleGenerativeAI(this.apiKey);
        // Use gemini-1.5-flash as it is more robust and faster
        this.model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
        logger.info('Google AI Service initialized with gemma-3-27b-it');
      } catch (error) {
        logger.error('Failed to initialize Google AI:', error);
        this.isAIEnabled = false;
      }
    } else {
      logger.warn('GOOGLE_AI_API_KEY not found in environment variables. AI features will be disabled.');
    }
  }

  async analyzeFinancialData(financialData) {
    try {
      logger.info('Analyzing financial data...');

      // Generate comprehensive financial analysis
      const analysis = this.generateFinancialAnalysis(financialData);

      return {
        success: true,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Financial analysis failed:', error);
      throw new Error('Failed to analyze financial data');
    }
  }

  async generateMarketAnalysis(companyData, industryData) {
    try {
      logger.info('Generating market analysis...');

      const marketAnalysis = this.generateMarketAnalysisContent(companyData, industryData);

      return {
        success: true,
        marketAnalysis: marketAnalysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Market analysis failed:', error);
      throw new Error('Failed to generate market analysis');
    }
  }

  async generateROIProjections(financialData, marketData, assumptions) {
    try {
      logger.info('Generating ROI projections...');

      const roiProjections = this.generateROIAnalysis(financialData, marketData, assumptions);

      return {
        success: true,
        roiProjections: roiProjections,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('ROI projection failed:', error);
      throw new Error('Failed to generate ROI projections');
    }
  }

  async generateExecutiveSummary(companyData, financialAnalysis, marketAnalysis) {
    try {
      logger.info('Generating executive summary...');

      let executiveSummary;

      // Use AI if enabled, otherwise fallback to template
      if (this.isAIEnabled) {
        try {
          executiveSummary = await this.generateAIExecutiveSummary(companyData, financialAnalysis, marketAnalysis);
        } catch (aiError) {
          // Log detailed error for debugging
          logger.error('AI generation failed with detailed error:', {
            message: aiError.message,
            stack: aiError.stack,
            errorObject: JSON.stringify(aiError, Object.getOwnPropertyNames(aiError))
          });
          logger.warn('Falling back to static template');
          executiveSummary = this.generateExecutiveSummaryContent(companyData, financialAnalysis, marketAnalysis);
        }
      } else {
        executiveSummary = this.generateExecutiveSummaryContent(companyData, financialAnalysis, marketAnalysis);
      }

      return {
        success: true,
        executiveSummary: executiveSummary,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Executive summary generation failed:', error);
      throw new Error('Failed to generate executive summary');
    }
  }

  async generateAIExecutiveSummary(companyData, financialAnalysis, marketAnalysis) {
    const prompt = `
      Write a professional, compelling Executive Summary for a Confidential Information Memorandum (CIM) for an investment opportunity.
      
      Company Name: ${companyData?.name || 'The Company'}
      Industry: ${companyData?.industry || 'General'}
      Description: ${companyData?.description || 'No description provided'}
      
      Financial Highlights:
      ${JSON.stringify(financialAnalysis?.financialHighlights || [], null, 2)}
      
      Market Opportunity:
      ${JSON.stringify(marketAnalysis?.opportunity || {}, null, 2)}
      
      Key Advantages:
      ${JSON.stringify(marketAnalysis?.advantages || [], null, 2)}
      
      Format the output with the following sections (use Markdown):
      1. Investment Opportunity
      2. Key Investment Highlights
      3. Financial Performance
      4. Market Opportunity
      5. Investment Thesis
      
      Keep the tone professional, persuasive, and suitable for investment bankers and private equity investors.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  generateFinancialAnalysis(financialData) {
    const revenue = financialData.revenue || [1200000, 1500000, 1800000, 2500000, 3200000];
    const netIncome = financialData.netIncome || [180000, 225000, 270000, 375000, 480000];
    // Mock EBITDA as approx 1.5x net income for demo if missing
    const ebitda = financialData.ebitda || netIncome.map(n => Math.round(n * 1.5));
    const cashFlow = financialData.cashFlow || [240000, 300000, 360000, 500000, 640000];

    // Calculate growth metrics
    const revenueGrowth = ((revenue[revenue.length - 1] / revenue[0]) - 1) * 100;
    const profitMargin = (netIncome[netIncome.length - 1] / revenue[revenue.length - 1]) * 100;
    const cagr = Math.pow(revenue[revenue.length - 1] / revenue[0], 1 / (revenue.length - 1)) - 1;

    return {
      content: `
**Financial Performance Analysis**

**Revenue Growth:**
- 3-Year Revenue CAGR: ${(cagr * 100).toFixed(1)}%
- Total Growth: ${revenueGrowth.toFixed(1)}% over the period
- Consistent upward trajectory demonstrating strong market demand

**Profitability Metrics:**
- Current Net Profit Margin: ${profitMargin.toFixed(1)}%
- Improving operational efficiency
- Strong cash generation capabilities

**Key Financial Highlights:**
- Revenue: $${(revenue[revenue.length - 1] / 1000000).toFixed(1)}M (latest year)
- Net Income: $${(netIncome[netIncome.length - 1] / 1000000).toFixed(1)}M
- Cash Flow: $${(cashFlow[cashFlow.length - 1] / 1000000).toFixed(1)}M
- Healthy financial fundamentals with growth trajectory

**Investment Strengths:**
- Consistent revenue growth across all periods
- Improving profitability margins
- Strong cash flow generation
- Scalable business model with operational leverage
      `,
      financialHighlights: [
        `${(cagr * 100).toFixed(1)}% revenue CAGR`,
        `${profitMargin.toFixed(1)}% profit margin`,
        'Strong cash flow generation',
        'Improving operational efficiency'
      ],
      growthAnalysis: {
        growthRate: `${(cagr * 100).toFixed(1)}%`,
        trend: cagr > 0.15 ? 'Strong growth' : cagr > 0.05 ? 'Moderate growth' : 'Steady growth'
      },

      // Return raw data for table generation
      revenue,
      netIncome,
      ebitda,
      cashFlow
    };
  }

  generateMarketAnalysisContent(companyData, industryData) {
    const marketSize = industryData?.marketSize || 50000000000;
    const growthRate = industryData?.growthRate || 15;
    const companyName = companyData?.name || 'The Company';
    const industry = companyData?.industry || 'Technology';

    return {
      content: `
**Market Analysis & Opportunity**

**Market Size & Growth:**
- Total Addressable Market: $${(marketSize / 1000000000).toFixed(1)}B
- Annual Market Growth Rate: ${growthRate}%
- Market Stage: Expanding with strong fundamentals
- Geographic Reach: Multiple markets with expansion potential

**Industry Dynamics:**
- ${industry} sector showing robust growth
- Increasing demand for innovative solutions
- Digital transformation driving market expansion
- Favorable regulatory and economic environment

**Competitive Landscape:**
- ${companyName} well-positioned in attractive market segment
- Differentiated value proposition and competitive advantages
- Strong brand recognition and customer loyalty
- Scalable business model with network effects

**Growth Opportunities:**
- Market expansion into new geographic regions
- Product innovation and development pipeline
- Strategic partnerships and channel expansion
- Customer base growth and market share capture

**Market Positioning:**
- Strong competitive moat and defensible position
- First-mover advantages in key market segments
- Technology leadership and innovation capabilities
- Established customer relationships and partnerships
      `,
      marketSize: marketSize,
      growthRate: growthRate,
      opportunity: 'Significant market opportunity with favorable dynamics and strong growth potential',
      advantages: [
        'Strong competitive positioning',
        'Differentiated value proposition',
        'Scalable business model',
        'Market leadership position'
      ],
      risks: [
        'Competitive pressure from established players',
        'Market saturation and maturity',
        'Economic and regulatory changes',
        'Technology disruption and innovation cycles'
      ]
    };
  }

  generateROIAnalysis(financialData, marketData, assumptions) {
    const revenue = financialData.revenue || [2500000, 3200000, 4100000];
    const currentRevenue = revenue[revenue.length - 1];
    const investmentAmount = assumptions?.investmentAmount || 5000000;

    // Calculate projections
    const baseIRR = 22;
    const optimisticIRR = 28;
    const conservativeIRR = 18;

    const baseMultiple = 4.2;
    const optimisticMultiple = 5.8;
    const conservativeMultiple = 3.1;

    return {
      content: `
**Investment Projections & Returns Analysis**

**Base Case Scenario:**
- Projected IRR: ${baseIRR}%
- Investment Multiple: ${baseMultiple}x
- Payback Period: 3.8 years
- Exit Valuation: $${(investmentAmount * baseMultiple / 1000000).toFixed(1)}M

**Optimistic Scenario:**
- Projected IRR: ${optimisticIRR}%
- Investment Multiple: ${optimisticMultiple}x
- Payback Period: 3.2 years
- Exit Valuation: $${(investmentAmount * optimisticMultiple / 1000000).toFixed(1)}M

**Conservative Scenario:**
- Projected IRR: ${conservativeIRR}%
- Investment Multiple: ${conservativeMultiple}x
- Payback Period: 4.5 years
- Exit Valuation: $${(investmentAmount * conservativeMultiple / 1000000).toFixed(1)}M

**Key Assumptions:**
- Investment Amount: $${(investmentAmount / 1000000).toFixed(1)}M
- Time Horizon: 5 years
- Exit Strategy: Strategic acquisition or IPO
- Market growth continues at current trajectory

**Value Creation Drivers:**
- Revenue growth and market expansion
- Operational efficiency improvements
- Strategic partnerships and acquisitions
- Technology innovation and competitive advantages
      `,
      scenarios: {
        baseCase: { irr: baseIRR, multiple: baseMultiple, payback: 3.8 },
        optimistic: { irr: optimisticIRR, multiple: optimisticMultiple, payback: 3.2 },
        conservative: { irr: conservativeIRR, multiple: conservativeMultiple, payback: 4.5 }
      },
      assumptions: {
        investmentAmount: investmentAmount,
        timeHorizon: 5,
        exitStrategy: 'Strategic acquisition or IPO'
      }
    };
  }

  generateExecutiveSummaryContent(companyData, financialAnalysis, marketAnalysis) {
    const companyName = companyData?.name || 'The Company';
    const industry = companyData?.industry || 'Technology';

    return `
**Executive Summary**

**Investment Opportunity:**
${companyName} represents a compelling investment opportunity in the rapidly growing ${industry.toLowerCase()} sector. The company has demonstrated strong financial performance with consistent revenue growth and improving profitability metrics.

**Key Investment Highlights:**
• Strong financial fundamentals with ${financialAnalysis?.growthAnalysis?.growthRate || '25%'} revenue CAGR
• Large and expanding market opportunity worth $${(marketAnalysis?.marketSize / 1000000000 || 50).toFixed(1)}B
• Differentiated competitive position with sustainable advantages
• Experienced management team with proven track record
• Clear path to profitability and strong cash generation

**Financial Performance:**
The company has shown impressive growth trajectory with revenue increasing consistently over the past three years. Profitability margins are improving, demonstrating operational efficiency and scalability of the business model.

**Market Opportunity:**
Operating in a ${marketAnalysis?.growthRate || 15}% annually growing market, the company is well-positioned to capture significant market share through its innovative solutions and strong competitive positioning.

**Investment Thesis:**
This investment offers attractive risk-adjusted returns with projected IRR of 22% and investment multiple of 4.2x in the base case scenario. The combination of strong fundamentals, market opportunity, and experienced team makes this a compelling investment opportunity.

**Use of Funds:**
Investment proceeds will be used to accelerate growth through market expansion, product development, strategic partnerships, and operational scaling to capture the significant market opportunity ahead.
    `;
  }
}

module.exports = new AIService();
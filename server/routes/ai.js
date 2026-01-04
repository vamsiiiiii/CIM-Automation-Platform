const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const financialAnalysisSchema = Joi.object({
  revenue: Joi.array().items(Joi.number()).required(),
  expenses: Joi.array().items(Joi.number()).required(),
  netIncome: Joi.array().items(Joi.number()).required(),
  cashFlow: Joi.array().items(Joi.number()).required(),
  years: Joi.array().items(Joi.number()).required(),
  additionalMetrics: Joi.object().optional()
});

const marketAnalysisSchema = Joi.object({
  companyData: Joi.object({
    name: Joi.string().required(),
    industry: Joi.string().required(),
    description: Joi.string().required(),
    marketPosition: Joi.string().optional()
  }).required(),
  industryData: Joi.object({
    marketSize: Joi.number().optional(),
    growthRate: Joi.number().optional(),
    competitors: Joi.array().items(Joi.string()).optional(),
    trends: Joi.array().items(Joi.string()).optional()
  }).required()
});

// Analyze financial data
router.post('/analyze-financial', 
  authenticateToken, 
  validateRequest(financialAnalysisSchema),
  async (req, res) => {
    try {
      const analysis = await aiService.analyzeFinancialData(req.body);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ 
        error: 'Financial analysis failed', 
        message: error.message 
      });
    }
  }
);

// Generate market analysis
router.post('/market-analysis',
  authenticateToken,
  validateRequest(marketAnalysisSchema),
  async (req, res) => {
    try {
      const { companyData, industryData } = req.body;
      const analysis = await aiService.generateMarketAnalysis(companyData, industryData);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({
        error: 'Market analysis failed',
        message: error.message
      });
    }
  }
);

// Generate ROI projections
router.post('/roi-projections',
  authenticateToken,
  async (req, res) => {
    try {
      const { financialData, marketData, assumptions } = req.body;
      const projections = await aiService.generateROIProjections(
        financialData, 
        marketData, 
        assumptions
      );
      res.json(projections);
    } catch (error) {
      res.status(500).json({
        error: 'ROI projection failed',
        message: error.message
      });
    }
  }
);

// Generate executive summary
router.post('/executive-summary',
  authenticateToken,
  async (req, res) => {
    try {
      const { companyData, financialAnalysis, marketAnalysis } = req.body;
      const summary = await aiService.generateExecutiveSummary(
        companyData,
        financialAnalysis,
        marketAnalysis
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({
        error: 'Executive summary generation failed',
        message: error.message
      });
    }
  }
);

// Comprehensive CIM analysis
router.post('/comprehensive-analysis',
  authenticateToken,
  async (req, res) => {
    try {
      const { companyData, financialData, industryData, assumptions } = req.body;
      
      // Run all analyses in parallel for efficiency
      const [
        financialAnalysis,
        marketAnalysis,
        roiProjections
      ] = await Promise.all([
        aiService.analyzeFinancialData(financialData),
        aiService.generateMarketAnalysis(companyData, industryData),
        aiService.generateROIProjections(financialData, industryData, assumptions)
      ]);

      // Generate executive summary based on all analyses
      const executiveSummary = await aiService.generateExecutiveSummary(
        companyData,
        financialAnalysis.analysis,
        marketAnalysis.marketAnalysis
      );

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        analyses: {
          financial: financialAnalysis,
          market: marketAnalysis,
          roi: roiProjections,
          executiveSummary: executiveSummary
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Comprehensive analysis failed',
        message: error.message
      });
    }
  }
);

module.exports = router;
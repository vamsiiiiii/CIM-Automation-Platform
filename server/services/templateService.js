class TemplateService {
  constructor() {
    this.templates = {
      'standard-cim': {
        id: 'standard-cim',
        name: 'Standard CIM Template',
        description: 'Comprehensive CIM template for investment banking',
        sections: [
          'executiveSummary',
          'companyOverview',
          'marketAnalysis',
          'financialAnalysis',
          'investmentHighlights',
          'roiProjections',
          'riskFactors',
          'appendices'
        ]
      },
      'tech-startup': {
        id: 'tech-startup',
        name: 'Technology Startup CIM',
        description: 'Specialized template for technology companies',
        sections: [
          'executiveSummary',
          'technologyOverview',
          'marketOpportunity',
          'businessModel',
          'financialProjections',
          'competitiveAnalysis',
          'teamAndAdvisors',
          'riskFactors'
        ]
      },
      'manufacturing': {
        id: 'manufacturing',
        name: 'Manufacturing CIM Template',
        description: 'Template optimized for manufacturing companies',
        sections: [
          'executiveSummary',
          'operationsOverview',
          'marketPosition',
          'financialPerformance',
          'facilitiesAndCapacity',
          'supplyChain',
          'growthStrategy',
          'riskFactors'
        ]
      }
    };
  }

  async getTemplate(templateId) {
    const template = this.templates[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return template;
  }

  async getAllTemplates() {
    return Object.values(this.templates);
  }

  async validateTemplate(templateId) {
    return !!this.templates[templateId];
  }
}

module.exports = new TemplateService();
const aiService = require('./aiService');
const templateService = require('./templateService');
const pdfService = require('./pdfService');
const { logger } = require('../utils/logger');

class CIMService {
  async generateCIMContent(data) {
    try {
      const { company, financialData, industryData, assumptions, templateId } = data;

      logger.info(`Generating CIM content for company: ${company.name}`);

      // Get template structure
      const template = await templateService.getTemplate(templateId);

      // Generate AI analyses in parallel
      const [
        financialAnalysis,
        marketAnalysis,
        roiProjections
      ] = await Promise.all([
        aiService.analyzeFinancialData(financialData),
        aiService.generateMarketAnalysis(company, industryData),
        aiService.generateROIProjections(financialData, industryData, assumptions)
      ]);

      // Generate executive summary
      const executiveSummary = await aiService.generateExecutiveSummary(
        company,
        financialAnalysis.analysis,
        marketAnalysis.marketAnalysis
      );

      // Compile CIM content based on template
      const cimContent = await this.compileCIMContent({
        template,
        company,
        financialAnalysis: financialAnalysis.analysis,
        marketAnalysis: marketAnalysis.marketAnalysis,
        roiProjections: roiProjections.roiProjections,
        executiveSummary: executiveSummary.executiveSummary,
        rawFinancials: { ...financialData, ...financialAnalysis.analysis }
      });

      return {
        success: true,
        content: cimContent,
        aiAnalysis: {
          financial: financialAnalysis,
          market: marketAnalysis,
          roi: roiProjections,
          executiveSummary
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('CIM generation failed:', error);
      throw new Error(`Failed to generate CIM content: ${error.message}`);
    }
  }

  async compileCIMContent(data) {
    const {
      template,
      company,
      financialAnalysis,
      marketAnalysis,
      roiProjections,
      executiveSummary,
      rawFinancials
    } = data;

    // Structure CIM content according to template
    const cimContent = {
      metadata: {
        title: `${company.name} - Confidential Information Memorandum`,
        company: company.name,
        industry: company.industry,
        generatedAt: new Date().toISOString(),
        templateId: template.id
      },

      sections: {
        executiveSummary: {
          title: 'Executive Summary',
          content: (executiveSummary.content || executiveSummary)
            .replace(/^\s*\*\*Executive Summary\*\*\s*/i, '')
            .replace(/^\s*##\s*Executive Summary\s*/i, '')
            .trim(),
          order: 1
        },

        companyOverview: {
          title: 'Company Overview',
          content: {
            description: company.description,
            industry: company.industry,
            keyHighlights: this.extractKeyHighlights(financialAnalysis, marketAnalysis)
          },
          order: 2
        },

        marketAnalysis: {
          title: 'Market Analysis & Opportunity',
          content: (marketAnalysis.content || '') + ((marketAnalysis.content || '').includes('Growth Strategy') ? '' : '\n\n**Growth Strategy:**\nTo capture market share, the company will focus on:\n• Accelerating product innovation and feature development\n• expanding sales channels and strategic partnerships\n• Targeting adjacent market segments for organic growth'),
          order: 3
        },

        financialAnalysis: {
          title: 'Financial Analysis & Performance',
          content: (financialAnalysis.content || '') + this.generateFinancialChart(rawFinancials),
          order: 4
        },

        investmentHighlights: {
          title: 'Investment Highlights',
          content: this.generateInvestmentHighlights(financialAnalysis, marketAnalysis),
          order: 5
        },

        roiProjections: {
          title: 'Financial Projections & Returns',
          content: this.generateROITable(roiProjections.scenarios),
          order: 6
        },

        riskFactors: {
          title: 'Risk Factors',
          content: this.extractRiskFactors(financialAnalysis, marketAnalysis),
          order: 7
        },

        appendices: {
          title: 'Appendices',
          content: {
            financialStatements: 'Detailed financial statements and supporting documents',
            marketResearch: 'Industry reports and market research data',
            legalDocuments: 'Corporate structure and legal documentation'
          },
          order: 8
        }
      }
    };

    return cimContent;
  }

  extractKeyHighlights(financialAnalysis, marketAnalysis) {
    const highlights = [];

    // Extract from financial analysis
    if (financialAnalysis.growthRate) {
      highlights.push(`${financialAnalysis.growthRate}% revenue growth rate`);
    }

    if (financialAnalysis.profitMargin) {
      highlights.push(`${financialAnalysis.profitMargin}% profit margin`);
    }

    // Extract from market analysis
    if (marketAnalysis.marketSize) {
      highlights.push(`$${marketAnalysis.marketSize}M addressable market`);
    }

    if (marketAnalysis.marketPosition) {
      highlights.push(marketAnalysis.marketPosition);
    }

    return highlights;
  }

  generateInvestmentHighlights(financialAnalysis, marketAnalysis) {
    return {
      strongFinancials: financialAnalysis.keyMetrics || 'Strong financial performance with consistent growth',
      marketOpportunity: marketAnalysis.opportunity || 'Significant market opportunity with favorable dynamics',
      competitiveAdvantage: marketAnalysis.advantages || 'Differentiated market position with sustainable advantages',
      growthPotential: 'Multiple avenues for organic and inorganic growth',
      managementTeam: 'Experienced management team with proven track record'
    };
  }

  extractRiskFactors(financialAnalysis, marketAnalysis) {
    const risks = [];

    // Financial risks
    if (financialAnalysis.riskFactors) {
      risks.push(...financialAnalysis.riskFactors);
    }

    // Market risks
    if (marketAnalysis.risks) {
      risks.push(...marketAnalysis.risks);
    }

    // Default risks if none identified
    if (risks.length === 0) {
      risks.push(
        'Market competition and competitive pressures',
        'Economic and industry cyclicality',
        'Regulatory and compliance requirements',
        'Key personnel and management retention',
        'Technology and operational risks'
      );
    }

    return risks;
  }

  generateFinancialTable(financials) {
    if (!financials) return '';

    // Helper to format currency
    const fmt = (val) => val ? '$' + (Number(val) / 1000000).toFixed(1) + 'M' : '-';

    // Ensure we have arrays
    const toArray = (val) => Array.isArray(val) ? val : [val];

    const revenue = toArray(financials.revenue);
    const ebitda = toArray(financials.ebitda);
    const netProfit = toArray(financials.netIncome || financials.netProfit);

    // Determine number of years (max 3)
    const years = Math.max(revenue.length, ebitda.length, netProfit.length);
    const displayYears = Math.min(years, 3); // Show separate columns for up to 3 years

    // Generate headers
    let headerHtml = '<th>Metric</th>';
    for (let i = 0; i < displayYears; i++) {
      headerHtml += `<th>Year ${i + 1}</th>`;
    }
    headerHtml += '<th>CAGR</th>'; // Add CAGR column

    // Helper to get value at index safety
    const getVal = (arr, idx) => (idx < arr.length) ? arr[idx] : 0;

    // Calc simple CAGR
    const calcGrowth = (arr) => {
      if (arr.length < 2) return '-';
      const start = arr[0];
      const end = arr[arr.length - 1];
      if (!start) return '-';
      const cagr = Math.pow(end / start, 1 / (arr.length - 1)) - 1;
      return (cagr * 100).toFixed(1) + '%';
    };

    const row = (label, data) => {
      let html = `<tr><td>${label}</td>`;
      for (let i = 0; i < displayYears; i++) {
        html += `<td>${fmt(getVal(data, i))}</td>`;
      }
      html += `<td>${calcGrowth(data)}</td></tr>`;
      return html;
    };

    return `
      <strong>Financial Performance History</strong>
      <table class="financial-table">
        <thead>
          <tr>
            ${headerHtml}
          </tr>
        </thead>
        <tbody>
          ${row('Revenue', revenue)}
          ${row('EBITDA', ebitda)}
          ${row('Net Profit', netProfit)}
        </tbody>
      </table>`;
  }

  async exportToPDF(cim) {
    try {
      logger.info(`Exporting CIM to PDF: ${cim.title}`);

      const pdfBuffer = await pdfService.generateCIMPDF({
        title: cim.title,
        content: cim.content,
        company: cim.company
      });

      return pdfBuffer;
    } catch (error) {
      logger.error('PDF export failed:', error);
      throw new Error(`Failed to export CIM to PDF: ${error.message}`);
    }
  }

  async validateCIMContent(content) {
    const requiredSections = [
      'executiveSummary',
      'companyOverview',
      'marketAnalysis',
      'financialAnalysis',
      'roiProjections'
    ];

    const missingSections = requiredSections.filter(
      section => !content.sections || !content.sections[section]
    );

    if (missingSections.length > 0) {
      throw new Error(`Missing required CIM sections: ${missingSections.join(', ')}`);
    }

    return true;
  }

  generateFinancialChart(financials) {
    if (!financials) return '';

    // Ensure arrays
    const toArray = (val) => Array.isArray(val) ? val : [val];
    const revenue = toArray(financials.revenue);
    const ebitda = toArray(financials.ebitda);
    const netProfit = toArray(financials.netIncome || financials.netProfit);

    // Generate unique ID for canvas
    const chartId = 'finChart_' + Math.random().toString(36).substr(2, 9);

    // Parse data to simple array strings [1, 2, 3]
    const dataRev = JSON.stringify(revenue);
    const dataEbitda = JSON.stringify(ebitda);
    const dataProfit = JSON.stringify(netProfit);

    // Create chart script
    return `
      <div style="width: 100%; height: 400px; margin: 20px 0; page-break-inside: avoid;">
        <canvas id="${chartId}"></canvas>
      </div>
      <script>
        (function() {
          const ctx = document.getElementById('${chartId}').getContext('2d');
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Year 1', 'Year 2', 'Year 3'],
              datasets: [
                {
                  label: 'Revenue',
                  data: ${dataRev},
                  backgroundColor: 'rgba(54, 162, 235, 0.7)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                },
                {
                  label: 'EBITDA',
                  data: ${dataEbitda},
                  backgroundColor: 'rgba(75, 192, 192, 0.7)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Net Profit',
                  data: ${dataProfit},
                  backgroundColor: 'rgba(153, 102, 255, 0.7)',
                  borderColor: 'rgba(153, 102, 255, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false, // Disable animation for PDF capture
              plugins: {
                title: {
                  display: true,
                  text: 'Financial Performance History ($)',
                  font: { size: 16 }
                },
                legend: {
                  position: 'bottom'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '$' + (value / 1000000) + 'M';
                    }
                  }
                }
              }
            }
          });
          window.chartRendered = true; // Signal for Puppeteer
        })();
      </script>
    `;
  }

  generateROITable(scenarios) {
    if (!scenarios) return '';

    const { baseCase, optimistic, conservative } = scenarios;
    if (!baseCase) return '';

    return `
      <strong>Scenario Comparison (Base / Upside / Downside)</strong>
      <table class="financial-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Base Case</th>
            <th>Upside Case</th>
            <th>Downside Case</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Projected IRR</td><td>${baseCase.irr}%</td><td>${optimistic.irr}%</td><td>${conservative.irr}%</td></tr>
          <tr><td>Investment Multiple</td><td>${baseCase.multiple}x</td><td>${optimistic.multiple}x</td><td>${conservative.multiple}x</td></tr>
          <tr><td>Payback Period</td><td>${baseCase.payback} Years</td><td>${optimistic.payback} Years</td><td>${conservative.payback} Years</td></tr>
        </tbody>
      </table>`;
  }
}

module.exports = new CIMService();
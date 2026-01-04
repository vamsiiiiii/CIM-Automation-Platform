const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

class PDFService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates');
  }

  async generateCIMPDF(data) {
    let browser;
    try {
      logger.info('Starting PDF generation');

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Generate HTML content
      const htmlContent = await this.generateHTMLContent(data);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Wait for Charts to complete rendering (if any)
      // Check if chart canvas exists, then wait for Chart.js animation/render
      try {
        await page.waitForFunction(() => {
          // If no char, return true immediately. 
          if (!document.querySelector('canvas')) return true;
          // If charts exist, check if we have a flag or just wait a bit. 
          // Since we disabled animation, just ensuring the script captured the element is usually enough after networkidle0.
          // But strict safety: check if Chart.js is registered (window.Chart) or wait for a custom flag
          return window.chartRendered === true || !document.querySelector('canvas');
        }, { timeout: 5000 });
      } catch (e) {
        logger.warn('Wait for charts timed out or not needed', e.message);
      }

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            ${data.title}
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `
      });

      logger.info('PDF generation completed successfully');
      return pdfBuffer;

    } catch (error) {
      logger.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async generateHTMLContent(data) {
    try {
      // Load HTML template
      const templateHtml = await this.loadTemplate('cim-template.html');

      // Compile template
      const template = handlebars.compile(templateHtml);

      // Prepare data for template
      const financialData = data.content?.financialData || {};
      const chartSvg = this.generateSVGChart(financialData);

      const templateData = {
        ...data,
        generatedDate: new Date().toLocaleDateString(),
        sections: this.formatSectionsForTemplate(data.content?.sections || {}),
        chartSvg: chartSvg
      };

      return template(templateData);
    } catch (error) {
      logger.error('HTML content generation failed:', error);
      throw new Error(`HTML generation failed: ${error.message}`);
    }
  }

  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(this.templatePath, templateName);
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      // Return default template if file not found
      return this.getDefaultTemplate();
    }
  }

  formatSectionsForTemplate(sections) {
    const formatted = {};

    Object.keys(sections).forEach(key => {
      const section = sections[key];
      formatted[key] = {
        title: section.title,
        content: this.formatContent(section.content),
        order: section.order || 0
      };
    });

    return formatted;
  }

  formatContent(content) {
    if (!content) return '';

    if (typeof content === 'string') {
      let formatted = content;

      // Bold: **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Italic: *text*
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Convert dashes/bullets to Numbered List (<ol>) as requested ("use nos")
      // Split by newline to handle line-by-line processing
      // Convert dashes/bullets to Numbered List (<ol>) as requested ("use nos")
      // Split by newline to handle line-by-line processing
      const lines = formatted.split('\n');
      let inList = false;
      let newLines = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        // Check for list markers (- or •)
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const item = trimmed.substring(2);
          if (!inList) {
            newLines.push('<ol style="margin-top: 5px; margin-bottom: 5px;">'); // Tighter margins
            inList = true;
          }
          newLines.push(`<li>${item}</li>`);
        } else {
          if (inList) {
            newLines.push('</ol>');
            inList = false;
          }
          if (trimmed.length > 0) {
            newLines.push(`<p style="margin: 5px 0;">${trimmed}</p>`);
          }
        }
      });
      if (inList) newLines.push('</ol>');

      return newLines.join('');
    }

    if (Array.isArray(content)) {
      if (content.length === 0) return '';
      return `<ul style="margin: 5px 0;">${content.map(item => `<li>${this.formatContent(item)}</li>`).join('')}</ul>`;
    }

    if (typeof content === 'object') {
      if (content.content) return this.formatContent(content.content);

      return Object.entries(content)
        .map(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return `<div style="margin-bottom: 5px;"><strong>${label}:</strong> ${this.formatContent(value)}</div>`;
        })
        .join('');
    }

    return String(content);
  }

  generateSVGChart(financialData) {
    const years = financialData.years || [2020, 2021, 2022, 2023, 2024];
    const revenue = financialData.revenue || [];
    const ebitda = financialData.ebitda || [];

    if (revenue.length === 0) return '';

    const width = 600;
    const height = 250;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const maxVal = Math.max(...revenue, ...ebitda) * 1.1;
    const minVal = 0;

    const getX = (index) => padding + (index * (chartWidth / (years.length - 1)));
    const getY = (val) => height - padding - ((val - minVal) / (maxVal - minVal) * chartHeight);

    const revPoints = revenue.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
    const ebitdaPoints = ebitda.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

    const revPath = revenue.map((v, i) => (i === 0 ? 'M' : 'L') + ` ${getX(i)} ${getY(v)}`).join(' ');
    const ebitdaPath = ebitda.map((v, i) => (i === 0 ? 'M' : 'L') + ` ${getX(i)} ${getY(v)}`).join(' ');

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Grid Lines -->
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd" stroke-width="1" />
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ddd" stroke-width="1" />
        
        <!-- Y-Axis Labels (Top and Median) -->
        <text x="${padding - 5}" y="${padding + 5}" text-anchor="end" font-size="10" fill="#666">$${(maxVal / 1000000).toFixed(1)}M</text>
        <text x="${padding - 5}" y="${height / 2}" text-anchor="end" font-size="10" fill="#666">$${(maxVal / 2000000).toFixed(1)}M</text>
        
        <!-- X-Axis Labels -->
        ${years.map((y, i) => `<text x="${getX(i)}" y="${height - padding + 20}" text-anchor="middle" font-size="10" fill="#666">${y}</text>`).join('')}

        <!-- Revenue Area -->
        <path d="${revPath} L ${getX(years.length - 1)} ${height - padding} L ${padding} ${height - padding} Z" fill="#1976d2" fill-opacity="0.1" />
        <path d="${revPath}" fill="none" stroke="#1976d2" stroke-width="3" />
        
        <!-- EBITDA Area -->
        <path d="${ebitdaPath} L ${getX(years.length - 1)} ${height - padding} L ${padding} ${height - padding} Z" fill="#4caf50" fill-opacity="0.2" />
        <path d="${ebitdaPath}" fill="none" stroke="#4caf50" stroke-width="3" />

        <!-- Data Points -->
        ${revenue.map((v, i) => `<circle cx="${getX(i)}" cy="${getY(v)}" r="4" fill="#1976d2" />`).join('')}
        ${ebitda.map((v, i) => `<circle cx="${getX(i)}" cy="${getY(v)}" r="4" fill="#4caf50" />`).join('')}
      </svg>
    `;
  }

  getDefaultTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{title}}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4; /* Slightly tighter */
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 5px;
        }
        .document-title {
            font-size: 16px;
            color: #666;
        }
        .section {
            margin-bottom: 15px; /* Tighter section spacing */
            page-break-inside: auto; 
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1976d2;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
            margin-bottom: 8px;
            margin-top: 5px;
        }
        .section-content {
            font-size: 13px;
            line-height: 1.5;
        }
        .highlight-box {
            background-color: #f8f9fa;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .financial-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            page-break-inside: avoid;
        }
        .financial-table th,
        .financial-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
        }
        .financial-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{company.name}}</div>
        <div class="document-title">Confidential Information Memorandum</div>
        <div style="font-size: 12px; color: #666; margin-top: 10px;">
            Generated on {{generatedDate}}
        </div>
    </div>

    {{#if sections.executiveSummary}}
    <div class="section">
        <div class="section-title">{{sections.executiveSummary.title}}</div>
        <div class="section-content">
            <div class="highlight-box">
                {{{sections.executiveSummary.content}}}
            </div>
        </div>
    </div>
    {{/if}}

    {{#if sections.companyOverview}}
    <div class="section">
        <div class="section-title">{{sections.companyOverview.title}}</div>
        <div class="section-content">
            {{{sections.companyOverview.content}}}
        </div>
    </div>
    {{/if}}

    {{#if sections.marketAnalysis}}
    <div class="section">
        <div class="section-title">{{sections.marketAnalysis.title}}</div>
        <div class="section-content">
            {{{sections.marketAnalysis.content}}}
        </div>
    </div>
    {{/if}}

    {{#if sections.financialAnalysis}}
    <div class="section">
        <div class="section-title">{{sections.financialAnalysis.title}}</div>
        <div class="section-content">
            {{#if chartSvg}}
            <div style="text-align: center; margin: 20px 0; background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 15px;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333;">Company Financial Growth (5-Year Trajectory)</div>
                {{{chartSvg}}}
                <div style="margin-top: 10px; display: flex; justify-content: center; gap: 20px; font-size: 12px;">
                    <span style="display: flex; alignItems: center; gap: 5px;">
                        <span style="display: inline-block; width: 12px; height: 12px; background: #1976d2;"></span> Revenue (Historical)
                    </span>
                    <span style="display: flex; alignItems: center; gap: 5px;">
                        <span style="display: inline-block; width: 12px; height: 12px; background: #4caf50;"></span> EBITDA (Historical)
                    </span>
                </div>
            </div>
            {{/if}}
            {{{sections.financialAnalysis.content}}}
        </div>
    </div>
    {{/if}}

    {{#if sections.roiProjections}}
    <div class="section">
        <div class="section-title">{{sections.roiProjections.title}}</div>
        <div class="section-content">
            {{{sections.roiProjections.content}}}
        </div>
    </div>
    {{/if}}

    {{#if sections.riskFactors}}
    <div class="section">
        <div class="section-title">{{sections.riskFactors.title}}</div>
        <div class="section-content">
            {{{sections.riskFactors.content}}}
        </div>
    </div>
    {{/if}}

    <div class="footer">
        <p><strong>CONFIDENTIAL AND PROPRIETARY</strong></p>
        <p>This document contains confidential and proprietary information. 
           Distribution is restricted to authorized parties only.</p>
    </div>
</body>
</html>
    `;
  }
}

module.exports = new PDFService();
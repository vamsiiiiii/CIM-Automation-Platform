"""
PDF Service - PDF generation using FPDF2 (lightweight).
Replaces WeasyPrint for faster installation.
"""
import io
from typing import Dict, Any
from fpdf import FPDF
import json
from utils.logger import logger


class CIMPdf(FPDF):
    """Custom PDF class for CIM documents."""
    
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
    
    def header(self):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, 'CONFIDENTIAL', align='R')
        self.ln(5)
    
    def footer(self):
        self.set_y(-20) # More space for 2 lines
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        
        # Add Confidential Disclaimer
        self.cell(0, 5, 'CONFIDENTIAL AND PROPRIETARY', align='C', ln=True)
        self.cell(0, 5, 'This document contains confidential and proprietary information. Distribution is restricted to authorized parties only.', align='C', ln=True)
        
        self.cell(0, 5, f'Page {self.page_no()}', align='C')
    
    def sanitize_text(self, text: str) -> str:
        """Sanitize text to be safe for Latin-1 / Western encoding."""
        if not text:
            return ""
        # Replace common Unicode characters that cause Latin-1 issues
        replacements = {
            '\u2013': '-', # en dash
            '\u2014': '-', # em dash
            '\u2018': "'", # left single quote
            '\u2019': "'", # right single quote
            '\u201c': '"', # left double quote
            '\u201d': '"', # right double quote
            '\u2022': '*', # bullet
            '\u2026': '...', # ellipsis
            '\u2122': '(TM)', # trademark
            '\u00ae': '(R)', # registered
            '\u00a9': '(C)', # copyright
            '\u2013': '-',
            '\u2014': '-',
            '\u201c': '"',
            '\u201d': '"',
            '\u2018': "'",
            '\u2019': "'",
            '\u2022': '*',
            '\u2013': '-',
            '\u2014': '-',
            '\u2022': '*',
            '–': '-',
            '—': '-',
            '“': '"',
            '”': '"',
            '‘': "'",
            '’': "'",
            '•': '*',
            '…': '...',
        }
        for k, v in replacements.items():
            text = text.replace(k, v)
        
        # Fallback: remove any other non-latin-1 characters
        return text.encode('latin-1', 'replace').decode('latin-1')

    def chapter_title(self, title: str):
        title = self.sanitize_text(title)
        
        # Check if enough space remains on page (approx 60mm needed for title + some content)
        # If near bottom, force page break to avoid orphaned titles
        if self.get_y() > 220: 
             self.add_page()
             
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(25, 118, 210)  # Blue
        self.cell(0, 10, title, ln=True)
        self.set_draw_color(25, 118, 210)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)
    
    def body_text(self, text: str):
        # Handle internal newlines to separate headers from body
        # This fixes "## Header\nBody" being treated as one plain block
        lines = text.split('\n')
        
        for line in lines:
            line = self.sanitize_text(line.strip())
            if not line:
                continue
                
            # Check for Headers (## Title)
            if line.startswith('#'):
                clean_text = line.lstrip('#').strip()
                # Reduced gap and Bold for headers
                self.set_font('Helvetica', 'B', 11)
                self.set_text_color(51, 51, 51)
                
                try: width = self.epw
                except: width = self.w - self.l_margin - self.r_margin
                
                self.multi_cell(width, 6, clean_text)
                self.ln(1) # Minimized gap after header
                
            # Check for Bold lines (**Title**) - frequent in Risk Factors
            elif line.startswith('**') and '**' in line[2:]:
                # Heuristic: if it looks like a bold list item or title
                clean_text = line.replace('**', '').strip()
                self.set_font('Helvetica', 'B', 11)
                self.set_text_color(51, 51, 51)
                
                try: width = self.epw
                except: width = self.w - self.l_margin - self.r_margin
                
                self.multi_cell(width, 6, clean_text)
                self.ln(1) # Minimized gap

            # Regular Body Text
            else:
                self.set_font('Helvetica', '', 11)
                self.set_text_color(51, 51, 51)
                # Strip inline bold just in case, but keep text
                clean_text = line.replace('**', '')
                
                try: width = self.epw
                except: width = self.w - self.l_margin - self.r_margin
                
                self.multi_cell(width, 6, clean_text)
                self.ln(3) # Standard paragraph gap
    
    def bullet_point(self, text: str):
        text = self.sanitize_text(text)
        
        # If text looks like a markdown header (##) or bold header (**), render it as a header
        clean_start = text.strip()
        if clean_start.startswith('#') or clean_start.startswith('**'):
            self.body_text(text)
            return
            
        # Check for Colon-based bolding (e.g., "* Key: Value")
        # Ensure we don't accidentally split random sentences with colons later
        if ':' in text and len(text.split(':')[0]) < 60:
             parts = text.split(':', 1)
             bold_part = parts[0].strip()
             rest_part = parts[1].strip()
             
             # Check page break for the block
             if self.get_y() > 240:
                 self.add_page()
                 
             self.cell(10, 6, '*')
             
             # Render bold part + colon inline
             self.set_font('Helvetica', 'B', 11)
             self.set_text_color(51, 51, 51)
             self.write(6, bold_part + ": ")
             
             # Render rest plain inline
             self.set_font('Helvetica', '', 11)
             self.write(6, rest_part)
             self.ln(6) 
             return

        self.set_font('Helvetica', '', 11)
        self.set_text_color(51, 51, 51)
        
        # Ensure we check for page break if near bottom
        if self.get_y() > 250: 
             self.add_page()

        # Print bullet
        self.cell(10, 6, '*') 
        
        # Calculate explicit width to avoid w=0 issues
        try:
            width = self.epw - 10
        except:
            width = self.w - self.l_margin - self.r_margin - 10
            
        self.multi_cell(width, 6, text)


class PDFService:
    """Service for generating professional PDF documents."""
    
    async def generate_cim_pdf(self, data: Dict[str, Any]) -> bytes:
        """
        Generate CIM PDF document.
        
        Args:
            data: CIM data including content and company info
            
        Returns:
            PDF as bytes
        """
        try:
            logger.info(f"Generating PDF for CIM: {data.get('title', 'Unknown')}")
            
            content = data.get("content", {})
            company = data.get("company", {})
            title = data.get("title", "Confidential Information Memorandum")
            
            # Parse content if string
            if isinstance(content, str):
                try:
                    content = json.loads(content)
                except:
                    content = {}
            
            # Create PDF
            pdf = CIMPdf()
            
            # Cover page (First page always forced)
            pdf.add_page()
            pdf.set_font('Helvetica', 'B', 36)
            pdf.set_text_color(25, 118, 210)
            pdf.ln(60)
            pdf.cell(0, 20, 'CIM', align='C', ln=True)
            
            pdf.set_font('Helvetica', 'B', 24)
            pdf.set_text_color(51, 51, 51)
            pdf.ln(10)
            # Calculate explicit width for title
            try:
                width = pdf.epw
            except:
                width = pdf.w - pdf.l_margin - pdf.r_margin
            pdf.multi_cell(width, 12, title, align='C')
            
            pdf.set_font('Helvetica', '', 18)
            pdf.set_text_color(85, 85, 85)
            pdf.ln(10)
            pdf.cell(0, 10, company.get('name', ''), align='C', ln=True)
            pdf.cell(0, 10, company.get('industry', ''), align='C', ln=True)
            
            pdf.ln(30)
            pdf.set_font('Helvetica', 'B', 12)
            pdf.set_text_color(211, 47, 47)  # Red
            pdf.set_draw_color(211, 47, 47)
            pdf.rect(70, pdf.get_y(), 70, 12)
            pdf.cell(0, 12, 'CONFIDENTIAL', align='C')
            
            # Executive Summary (New page standard)
            pdf.add_page()
            pdf.chapter_title('Executive Summary')
            sections = content.get('sections', {})
            
            exec_summary = sections.get('executiveSummary', {}).get('content', '') or content.get('executiveSummary', '')
            if exec_summary:
                for para in exec_summary.split('\n\n'):
                    if para.strip():
                        pdf.body_text(para.strip())
            
            # Investment Highlights - Continuous flow (no forced add_page)
            highlights = content.get('investmentHighlights', [])
            if highlights:
                pdf.ln(5) # Gap before section
                pdf.chapter_title('Investment Highlights')
                for highlight in highlights:
                    pdf.bullet_point(highlight)
            
            # Financial Analysis
            fin_section = sections.get('financialAnalysis', {})
            if fin_section or content.get('financialAnalysis'):
                pdf.ln(5)
                pdf.chapter_title('Financial Analysis')
                
                # Try new structure first
                fin_content = fin_section.get('content', '') or content.get('financialAnalysis', {}).get('content', '')
                if fin_content:
                    for para in fin_content.split('\n\n'):
                        if para.strip():
                            pdf.body_text(para.strip())
                
                # Financial highlights
                fin_highlights = fin_section.get('highlights', []) or content.get('financialAnalysis', {}).get('highlights', [])
                if fin_highlights:
                    pdf.ln(5)
                    pdf.set_font('Helvetica', 'B', 12)
                    pdf.cell(0, 8, 'Key Metrics:', ln=True)
                    for h in fin_highlights:
                        pdf.bullet_point(h)
            
            # Market Analysis
            market_section = sections.get('marketAnalysis', {})
            if market_section or content.get('marketAnalysis'):
                pdf.ln(5)
                pdf.chapter_title('Market Analysis')
                market_content = market_section.get('content', '') or content.get('marketAnalysis', {}).get('content', '')
                if market_content:
                    for para in market_content.split('\n\n'):
                        if para.strip():
                            pdf.body_text(para.strip())
            
            # ROI Projections
            roi_section = sections.get('roiProjections', {})
            if roi_section or content.get('roiProjections'):
                pdf.ln(5)
                pdf.chapter_title('Investment Returns Analysis')
                roi_content = roi_section.get('content', '') or content.get('roiProjections', {}).get('content', '')
                scenarios = roi_section.get('scenarios', {}) or content.get('roiProjections', {}).get('scenarios', {})

                # Only print body content if it doesn't look like an AI list of scenarios 
                if roi_content and "Base Case" not in roi_content:
                     for para in roi_content.split('\n\n'):
                        if para.strip(): pdf.body_text(para.strip())
                elif not scenarios and roi_content:
                     for para in roi_content.split('\n\n'):
                        if para.strip(): pdf.body_text(para.strip())
                
                if scenarios:
                    pdf.ln(5)
                    
                    # check space for table (~4 rows * 8 = 32 + header 8 = 40 + margin)
                    if pdf.get_y() > 210:
                        pdf.add_page()
                        
                    pdf.set_font('Helvetica', 'B', 11)
                    
                    # Table header
                    pdf.set_fill_color(25, 118, 210)
                    pdf.set_text_color(255, 255, 255)
                    pdf.cell(50, 8, 'Scenario', border=1, fill=True, align='C')
                    pdf.cell(40, 8, 'IRR', border=1, fill=True, align='C')
                    pdf.cell(40, 8, 'Multiple', border=1, fill=True, align='C')
                    pdf.cell(50, 8, 'Payback (years)', border=1, fill=True, align='C')
                    pdf.ln()
                    
                    pdf.set_font('Helvetica', '', 11)
                    pdf.set_text_color(51, 51, 51)
                    
                    for name, scenario in [
                        ('Base Case', scenarios.get('baseCase', {})),
                        ('Optimistic', scenarios.get('optimistic', {})),
                        ('Conservative', scenarios.get('conservative', {}))
                    ]:
                        pdf.cell(50, 8, name, border=1, align='C')
                        pdf.cell(40, 8, f"{scenario.get('irr', 0):.0f}%", border=1, align='C')
                        pdf.cell(40, 8, f"{scenario.get('multiple', 0):.1f}x", border=1, align='C')
                        pdf.cell(50, 8, f"{scenario.get('payback', 0):.1f}", border=1, align='C')
                        pdf.ln()
            
            # Risk Factors
            risks = content.get('riskFactors', [])
            if risks:
                pdf.ln(5)
                pdf.chapter_title('Risk Factors')
                for risk in risks:
                    if isinstance(risk, dict):
                        # Calculate rough height to prevent orphans (Title ~8 + Desc ~18 + gap)
                        if pdf.get_y() > 240:
                            pdf.add_page()
                            
                        # Set Black Color for Header (fix Blue issue)
                        pdf.set_font('Helvetica', 'B', 11)
                        pdf.set_text_color(51, 51, 51) 
                        pdf.cell(0, 8, risk.get('title', ''), ln=True)
                        
                        # Body text
                        pdf.set_font('Helvetica', '', 11)
                        try: width = pdf.epw
                        except: width = pdf.w - pdf.l_margin - pdf.r_margin
                        pdf.multi_cell(width, 6, risk.get('description', ''))
                        pdf.ln(3)
                    else:
                        pdf.bullet_point(str(risk))
            
            # Output PDF bytes
            pdf_bytes = pdf.output()
            
            logger.info("PDF generated successfully")
            return bytes(pdf_bytes)
            
        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            raise Exception(f"Failed to generate PDF: {e}")


# Singleton instance
pdf_service = PDFService()

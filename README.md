# CIM Automation Platform

A high-performance, AI-powered automation engine designed to streamline the Confidential Information Memorandum (CIM) creation process for investment banking and private equity. The platform reduces manual drafting effort through automated financial analysis and AI-assisted narrative generation with mandatory human review and approval.

## 🚀 Key Features

- **AI-Driven Narratives**: Real-time generation of investment theses, executive summaries, and market positioning using **Gemma 3 27B**.
- **Company-Specific Analytics**: Dedicated dashboards for up to 10 portfolios with individual 5-year **Growth Trajectories** (Revenue vs. EBITDA).
- **Financial Normalization**: Automated calculations for CAGR, margins, and multi-scenario ROI (Base, Optimistic, Conservative).
- **Interactive CIM Editor**: A full-featured workspace for analysts to review, refine, and generate AI narratives with human oversight (HITL).
- **Professional Export**: One-click professional PDF generation with **Financial projections** and market analysis.
- **AI Audit Trail**: Transparent **Confidence & Accuracy scores** for every generated narrative to ensure data fidelity.



## 🔄 CIM Automation Workflow


```text
┌──────────────────────┐
│     INPUT DATA       │
│ (CSV/Excel Mapping)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   ANALYSIS ENGINE    │
│  (Growth & ROI Calc) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      AI AGENT        │
│    (Narrative Gen)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    SECURE STORAGE    │
│    (Encrypted DB)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     HUMAN REVIEW     │
│     (HITL Audit)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   EXPORT & DELIVER   │
│  (Professional PDF)  │
└──────────────────────┘
```

 
## 🏗️ Technical Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  FRONTEND (REACT)                                │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │  Dashboard   │      │  CIM Editor  │      │  Analytics   │      │  Auth    │  │
│  └──────────────┘      └──────────────┘      └──────────────┘      └──────────┘  │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                 HTTPS / REST API
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                                  BACKEND (PYTHON)                                │
│  ┌────────────────┐    ┌─────────────────┐    ┌──────────────┐    ┌──────────┐   │
│  │  FastAPI       │    │  AI Integration │    │  PDF Export  │    │  Auth    │   │
│  │  (REST API)    │    │  (Gemini/Gemma) │    │  (fpdf2)     │    │  (JWT)   │   │
│  └────────────────┘    └─────────────────┘    └──────────────┘    └──────────┘   │
│  ┌────────────────┐    ┌─────────────────┐                                       │
│  │  Financial     │    │  CIM Service    │                                       │
│  │  (NumPy/Pandas)│    │  (Compilation)  │                                       │
│  └────────────────┘    └─────────────────┘                                       │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                   SQLAlchemy ORM
                                         │
                         ┌───────────────▼───────────────┐
                         │      DATABASE (SQLite)        │
                         └───────────────────────────────┘
```

## 🛠️ Tech Stack

**Backend**: Python 3.10+, FastAPI, SQLAlchemy ORM, NumPy/Pandas, fpdf2 (PDF)
**Frontend**: React 18, Material-UI (MUI v5), Recharts, React Query
**AI**: Google AI Studio (@google/generative-ai) -> **Gemma 3 27B**

## 🔐 Security & Data Integrity

The platform implements open authentication for ease of use:
- **Simplified Login**: Access the platform with **any email and password**. No restrictions.
- **Session Security**: JSON Web Tokens (JWT) for secure, stateless API authentication, valid for **24 hours**.
- **Data Isolation**: Multi-tenant architecture ensuring company data is strictly isolated by User ID.

## ⚡ Quick Setup

### 2. Dependencies & Environment

```bash
# 1. Configure Environment
copy .env.example .env
# Edit .env and add your GOOGLE_AI_API_KEY

# 2. Backend Setup (Python)
python -m venv backend\venv
backend\venv\Scripts\activate
pip install -r backend\requirements.txt

# 3. Frontend Setup (React)
cd client
npm install
cd ..
```

### 3. Database Initialization

```bash
# Initialize and seed the SQLite database with sample data
# (Ensure backend virtual environment is active)
python backend\seed_data.py
```

### 4. Launch

```bash
# Start the unified platform (Backend + Frontend) with one command
.\start.bat

# OR Manual Launch
# Backend: uvicorn main:app --app-dir backend --reload
# Frontend: cd client && npm start
```

## 📁 Repository Structure
```text
├── client/              # React frontend application
├── backend/             # Python FastAPI backend
│   ├── main.py          # FastAPI entry point
│   ├── services/        # Business logic (AI, Financial, PDF)
│   ├── routes/          # API endpoints
│   ├── models/          # SQLAlchemy ORM models
│   └── schemas/         # Pydantic validation schemas
├── sample_data/         # Curated CSV datasets (2020-2024)
├── start.bat            # Unified launcher
└── .env.example         # Template for environment variables
```

## 💡 Business Logic
- **Growth Analysis**: Calculated in `backend/services/financial_service.py` using NumPy for deterministic financial formulas (CAGR, EBITDA Margins).
- **Hybrid AI Architecture**: Uses **Deterministic Logic** (NumPy/Pandas) for financial calculations and **Generative Logic** (Gemma 3) for narrative synthesis to ensure mathematical accuracy.
- **HITL Workflow**: A custom "Human-in-the-Loop" editor allows analysts to audit, edit, and approve AI-generated segments before final commitment.
- **Dashboard Metrics**: Real-time aggregation of portfolio health, AI accuracy, and time-saved benchmarks in `backend/routes/dashboard.py`.
- **Parallel AI Processing**: Utilizes `asyncio.gather()` in `backend/routes/ai.py` to run financial, market, and ROI analyses concurrently, reducing total generation time.
- **PDF Visuals**: WeasyPrint-based PDF generation with QuickChart.io integration for high-fidelity financial trend visualization.
- **Quality Audit**: AI Performance metrics based on self-audit logic to provide transparency into the model's extraction confidence.

---

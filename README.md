# CIM Automation Platform

A high-performance, AI-powered automation engine designed to streamline the Confidential Information Memorandum (CIM) creation process for investment banking and private equity. The platform reduces manual drafting effort through automated financial analysis and AI-assisted narrative generation with mandatory human review and approval.

## 🚀 Key Features

- **AI-Driven Narratives**: Real-time generation of investment theses, executive summaries, and market positioning using **Gemma 3 27B**.
- **Company-Specific Analytics**: Dedicated dashboards for up to 10 portfolios with individual 5-year **Growth Trajectories** (Revenue vs. EBITDA).
- **Financial Normalization**: Automated calculations for CAGR, margins, and multi-scenario ROI (Base, Optimistic, Conservative).
- **Interactive CIM Editor**: A full-featured workspace for analysts to review, refine, and generate AI narratives with human oversight (HITL).
- **Professional Export**: One-click professional PDF generation with **Financial projections** and market analysis.
- **AI Audit Trail**: Transparent **Confidence & Accuracy scores** for every generated narrative to ensure data fidelity.
- **Universal Demo Mode**: Instant access via `demo@example.com`


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
│                                  BACKEND (NODE.JS)                               │
│  ┌────────────────┐    ┌─────────────────┐    ┌──────────────┐    ┌──────────┐   │
│  │  CIM Service   │    │  AI Integration │    │  PDF Export  │    │  Middle  │   │
│  │  (Business)    │    │  (Gemma 3)      │    │  (Puppeteer) │    │  -ware   │   │
│  └────────────────┘    └─────────────────┘    └──────────────┘    └──────────┘   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                   PRISMA ORM
                                         │
                         ┌───────────────▼───────────────┐
                         │      DATABASE (SQLite/PG)     │
                         └───────────────────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Prisma ORM (SQLite/PostgreSQL), Puppeteer (PDF Export)
- **Frontend**: React 18, Material-UI (MUI v5), Recharts, React Query
- **LLM**: **Gemma 3 27B** (Google AI Studio)

## 🔐 Security & Data Integrity

The platform implements enterprise-grade security practices even in demo mode:
- **Password Hashing**: BCrypt (12 rounds) for all user credentials.
- **Session Security**: JSON Web Tokens (JWT) for secure, stateless API authentication.
- **Data Isolation**: Multi-tenant architecture ensuring company data is strictly isolated by User ID.
- **ORM Layer**: Prisma ORM provides a type-safe interface, abstracting the storage engine (SQLite for dev, PostgreSQL for prod).

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0+
- **Google AI Studio Key**: Required for GEMMA narrative generation.
- **Database**: SQLite (Default) or PostgreSQL.

### 2. Quick Setup
```bash
# Install all dependencies (Root, Client, Server)
npm run install:all

# Configure Environment
cp .env.example .env
# Edit .env and add your GOOGLE_AI_API_KEY
```

### 3. Database Initialization
```bash
cd server
npx prisma generate
npx prisma db seed
cd ..
```

### 4. Launch
```bash
# Start both Backend (5000) and Frontend (3000)
npm run dev
```

## 🖥️ Demo Access

For quick evaluation, use the pre-built demo environment:
- **URL**: `http://localhost:3000/login`
- **Email**: `demo@example.com`
- **Password**: `password123`

> [!TIP]
> Once logged in, visit the **Analytics** page and use the **Company Selector** to see deep-dive financial growth trajectories for different industries.

## 📁 Repository Structure
```text
├── client/          # React frontend application
├── server/          # Express backend & Prisma models
├── sample_data/     # Curated CSV datasets (2020-2024) for testing
├── .env.example     # Template for required environment variables
└── start.bat        # Windows-based launch script
```

## 💡 Business Logic
- **Growth Analysis**: Calculated in `server/services/aiService.js` using deterministic financial formulas (CAGR, EBITDA Margins).
- **Hybrid AI Architecture**: Uses **Deterministic Logic** for financial calculations and **Generative Logic** (Gemma 3) for narrative synthesis to ensure mathematical accuracy.
- **HITL Workflow**: A custom "Human-in-the-Loop" editor allows analysts to audit, edit, and approve AI-generated segments before final commitment.
- **Dashboard Metrics**: Real-time aggregation of portfolio health, AI accuracy, and time-saved benchmarks in `server/routes/dashboard.js`.
- **Parallel AI Processing**: Utilizes `Promise.all` in `server/routes/ai.js` to run financial, market, and ROI analyses concurrently, reducing total generation time.
- **PDF Visuals**: Dynamic SVG path generation in `server/services/pdfService.js` for high-fidelity financial trend visualization.
- **Quality Audit**: AI Performance metrics based on self-audit logic to provide transparency into the model's extraction confidence.

---

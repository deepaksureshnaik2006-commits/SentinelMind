# SentinelMind

> **An AI Agent That Learns From Every Incident.**

---

## Overview

**SentinelMind** is an autonomous incident response agent built for modern Site Reliability Engineering (SRE) teams. It investigates production outages, identifies root causes, recalls historical mitigation experiences using **Vectorize Hindsight episodic memory**, and recommends verified resolutions powered by **Groq high-speed LLM inference**.

Traditional observability platforms trigger alerts *after* systems fail without any memory of previous fixes. SentinelMind solves this by establishing a continuous learning loop: it retains the outcome of every incident, contrasts successful solutions against approaches that previously failed, and continuously reduces Mean Time to Resolve (MTTR).

---

## The Core Problem & Solution

* **The Problem:** Distributed applications repeatedly experience the same failure patterns (connection pool leaks, cache evictions, ingress timeouts). Resolution knowledge remains locked in scattered runbooks or the memory of individual engineers, resulting in repetitive downtime and trial-and-error fixes.
* **The Solution:** SentinelMind combines rapid telemetry analysis with long-term episodic memory. When a new incident occurs, the agent retrieves verified mitigation records, warns engineers against historically failed tactics, and commits newly validated fixes back to the memory store.

---

## Key Features

* **Real-Time Telemetry Dashboard:** Live incident triage queue, 7-day volume trends, microservice health distributions, and empirical MTTR tracking.
* **Diagnostic Log Ingestion:** Ingest raw `.log`, `.txt`, and `.json` telemetry. Normalizes timestamps, isolates stack traces, and detects anomaly clusters.
* **Conversational SRE Copilot:** Groq-accelerated AI assistant that cross-references log evidence, distinguishes verified facts from hypotheses, and recalls past solutions.
* **Episodic Memory Bank (Hindsight):** Persistent agent memory supporting semantic `recall()`, multi-incident analytical `reflect()`, and outcome-driven `retain()`.
* **Resolution Intelligence:** Generates step-by-step mitigation plans with confidence scores, risk assessments, rollback procedures, and avoided failure precedents.
* **What-If Strategy Simulator:** Decision-support engine modeling candidate remediation tactics with predicted success rates, recovery times, and collateral risks.
* **Multi-Tenant Data Isolation:** Tenant isolation enforced via Supabase Row Level Security (RLS) and isolated, user-scoped memory bank partitions.
* **Human-in-the-Loop Safeguards:** Remediation recommendations require explicit operator review and approval prior to execution.

---

## How SentinelMind Works

SentinelMind operates on a closed 5-stage learning cycle:

```
[ 1. DETECT ] =====> [ 2. INVESTIGATE ] =====> [ 3. RECALL ]
 Telemetry Ingest      Groq Root Cause           Hindsight Memory
 Anomaly Isolation     Evidence vs Hypo          Semantic Precedents
                                                      |
                                                      v
[ 5. LEARN ]   <============================= [ 4. RECOMMEND ]
 Commit Outcome (retain())                     Step-by-Step Fix Protocol
 Drive Down MTTR                               Contrast: Success vs Failed
 Memory Timeline Update                        Human Operator Approval
```

1. **Detect:** Ingests raw logs, extracts error signatures, and isolates affected services.
2. **Investigate:** Synthesizes root cause hypotheses using Groq sub-second inference.
3. **Recall:** Queries the user's isolated Hindsight memory bank for matching past symptoms.
4. **Recommend:** Formulates an actionable fix protocol, contrasting verified successes against historically failed tactics.
5. **Learn:** Upon operator resolution, commits the outcome to memory (`retain()`), improving recommendations for future incidents.

---

## Technology Stack

* **Frontend:** React 18, Vite 6, Tailwind CSS, Recharts, Lucide React, `@supabase/supabase-js`
* **Backend:** Python 3.11+, FastAPI 0.115+, Pydantic v2, Uvicorn
* **AI & Inference:** Groq Cloud API (`qwen/qwen3.8-27b`)
* **Agent Memory:** Vectorize Hindsight Client (`hindsight-client` 1.2.0)
* **Database & Auth:** Supabase PostgreSQL 15+ (Row Level Security), Supabase Auth (JWT)

---

## Project Structure

```
SentinelMind/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py            # Environment settings
│   │   ├── routes/              # REST API route modules
│   │   ├── services/            # Groq, Hindsight, LogProcessor, ResolutionEngine
│   │   ├── schemas/             # Pydantic request/response models
│   │   └── repositories/        # Multi-tenant data store
│   ├── migrations/              # Supabase SQL schema migrations (001, 002, 003)
│   ├── tests/                   # Test suite and end-to-end demo workflow
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Incidents, Logs, Assistant, Memory, Simulator
│   │   ├── components/          # Common UI widgets, Navigation, StatCards
│   │   ├── context/             # AppContext & AuthContext
│   │   └── services/            # API client & Supabase client
│   └── package.json             # Frontend dependencies
├── .env.example                 # Safe environment configuration template
└── README.md                    # Project documentation
```

---

## Quick Setup Instructions

### Prerequisites
* **Python 3.11+** installed
* **Node.js 18+** & **npm 9+** installed
* **Git** installed

---

### Step 1: Clone Repository
```bash
git clone https://github.com/deepaksureshnaik2006-commits/SentinelMind.git
cd SentinelMind
```

---

### Step 2: Environment Configuration
Copy the `.env.example` file into both `backend/` and `frontend/`:

```bash
cp .env.example backend/.env
cp .env.example frontend/.env
```

#### Environment Variables Reference

| Variable | Location | Purpose | Default / Example |
|---|---|---|---|
| `GROQ_API_KEY` | `backend/.env` | Groq Cloud API key for LLM inference | `gsk_...` |
| `GROQ_MODEL` | `backend/.env` | Model identifier | `qwen/qwen3.8-27b` |
| `HINDSIGHT_API_KEY` | `backend/.env` | Vectorize Hindsight API key *(Optional)* | `hsk_...` |
| `HINDSIGHT_BASE_URL` | `backend/.env` | Hindsight endpoint URL | `https://api.hindsight.vectorize.io` |
| `HINDSIGHT_BANK_ID` | `backend/.env` | Default memory bank identifier | `sentinelmind-incidents` |
| `SUPABASE_URL` | `backend/.env` | Supabase project URL | `https://your-id.supabase.co` |
| `SUPABASE_KEY` | `backend/.env` | Supabase service-role or anon key | `eyJhbGci...` |
| `VITE_SUPABASE_URL` | `frontend/.env` | Supabase URL for browser client | `https://your-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `frontend/.env` | Supabase public anon key | `eyJhbGci...` |
| `HOST` | `backend/.env` | Backend host | `0.0.0.0` |
| `PORT` | `backend/.env` | Backend port | `8000` |

> *Note: If cloud API keys are omitted, SentinelMind automatically uses local partitioned memory banks and built-in diagnostic reasoning.*

---

### Step 3: Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Linux / macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### Step 4: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
```

---

### Step 5: Database Setup (Optional — for Supabase Persistence)
If using Supabase, run the SQL migrations from `backend/migrations/` in order within the Supabase SQL Editor:
1. `001_initial_schema.sql` — Creates tables for incidents, logs, recommendations, and chats.
2. `002_multi_user_isolation.sql` — Enables Row Level Security (RLS) for tenant isolation.
3. `003_delete_account_rpc.sql` — Configures secure account deletion procedure.

*(If skipping Supabase, the application runs seamlessly using the built-in local multi-tenant repository.)*

---

## Running the Application

### Option A: Development Mode (Hot-Reloading)

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Option B: Single-Port Production Serving

Build the frontend once; FastAPI will serve the static files and API together on port 8000:
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Start FastAPI server
cd ../backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open **`http://localhost:8000`** in your browser.

---

## API Documentation

FastAPI provides interactive Swagger documentation automatically:
* **Interactive OpenAPI Docs:** `http://localhost:8000/docs`
* **ReDoc Specification:** `http://localhost:8000/redoc`

Core API route groups include:
* `/api/incidents` — Lifecycle tracking, triage, and resolution.
* `/api/logs` — Raw log ingestion, anomaly extraction, and automatic incident registration.
* `/api/assistant` — Interactive SRE Copilot chat with memory injection.
* `/api/memory` — Hindsight `recall()`, `reflect()`, and timeline endpoints.
* `/api/recommendations` — Mitigation protocols and human approval workflow.
* `/api/simulator` — What-If strategy outcome modeling.
* `/api/analytics` — MTTR progression and telemetry metrics.

---

## Testing & Verification

Run the automated test suite from the `backend/` directory:
```bash
cd backend
python -m pytest tests/ -v
```

Execute the automated 9-step learning loop demonstration:
```bash
python tests/run_demo_workflow.py
```
This script programmatically validates log ingestion, root-cause diagnosis, initial resolution, memory `retain()`, and subsequent memory `recall()`.

---

## License

This project is licensed under the [MIT License](LICENSE).

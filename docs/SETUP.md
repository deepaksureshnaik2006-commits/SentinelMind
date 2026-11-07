# SentinelMind Setup & Installation Guide

This guide walks you through setting up, configuring, and running **SentinelMind** locally or in production.

---

## 1. System Requirements & Prerequisites

Ensure the following runtimes and tools are installed before proceeding:

| Software | Minimum Version | Recommended Version | Verification Command |
|---|---|---|---|
| **Python** | 3.11.0 | 3.11.9+ | `python --version` |
| **Node.js** | 18.0.0 | 20.x LTS | `node --version` |
| **npm** | 9.0.0 | 10.x | `npm --version` |
| **Git** | 2.30+ | Latest | `git --version` |

### Required Accounts & API Keys (Optional for local-only evaluation)
1. **Groq Cloud Account:** [console.groq.com](https://console.groq.com) (for ultra-fast LLM inference).
2. **Vectorize Hindsight Account:** [vectorize.io](https://vectorize.io) (for episodic cloud memory banks). *Local memory bank fallback is automatically enabled if omitted.*
3. **Supabase Account:** [supabase.com](https://supabase.com) (for persistent PostgreSQL, Auth & Row Level Security). *Local repository mode is enabled if omitted.*

---

## 2. Repository Cloning & Directory Layout

Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/SentinelMind.git
cd SentinelMind
```

---

## 3. Backend Setup & Configuration

### 3.1 Create Python Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate on Windows (PowerShell):
venv\Scripts\Activate.ps1
# Or Windows (Command Prompt):
# venv\Scripts\activate.bat
# Or Linux / macOS:
# source venv/bin/activate
```

### 3.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.3 Configure Backend Environment Variables

Copy `.env.example` to `backend/.env`:

```bash
cp ../.env.example .env
```

Open `backend/.env` and provide your credentials:

```ini
# Groq LLM Inference
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b

# Vectorize Hindsight Agent Memory
HINDSIGHT_API_KEY=hsk_your_hindsight_api_key_here
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=sentinelmind-incidents

# Supabase PostgreSQL & Auth (Optional for cloud persistence)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_service_role_key

# Runtime Settings
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development
DEBUG=True
```

> **Note:** If you do not have a Groq or Hindsight key immediately, SentinelMind will automatically initialize in **Local Evaluation Mode** using rule-based diagnostic fallbacks and its local in-memory memory partition.

---

## 4. Frontend Setup & Configuration

### 4.1 Install Node.js Dependencies

Open a new terminal window:

```bash
cd frontend
npm install
```

### 4.2 Configure Frontend Environment Variables

Create `frontend/.env` (or copy from `.env.example`):

```ini
# Supabase Client Credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key

# Vectorize Hindsight Base URL
VITE_HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
```

---

## 5. Supabase Database Migration (Optional for Cloud Persistence)

If using Supabase for persistent cloud storage and Row Level Security:

1. Open your project at [database.new](https://database.new) or [supabase.com/dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** in the left sidebar.
3. Open and run the migrations in sequential order from `backend/migrations/`:
   - `001_initial_schema.sql` — Creates tables (`organizations`, `users`, `profiles`, `services`, `incidents`, `logs`, `recommendations`, `feedback`, `assistant_chats`).
   - `002_multi_user_isolation.sql` — Enables Row Level Security (RLS) on all tables and creates policies enforcing `auth.uid() = user_id`.
   - `003_delete_account_rpc.sql` — Installs the `delete_user_account` stored procedure for irreversible account and data purge.
4. Verify all tables appear under **Table Editor** with RLS badges enabled.

---

## 6. Running the Application

### Option A: Development Mode (Hot Reloading)

Run both servers concurrently in separate terminals:

**Terminal 1 — Backend API:**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API: `http://localhost:8000`
* Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`

**Terminal 2 — Frontend Client:**
```bash
cd frontend
npm run dev
```
* Frontend HUD: `http://localhost:5173`

### Option B: Single-Port Production Mode

Compile the frontend bundle directly into `frontend/dist/`. FastAPI will automatically mount and serve the built client on `http://localhost:8000/`:

```bash
# 1. Build the production frontend
cd frontend
npm run build

# 2. Start the FastAPI server
cd ../backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Navigate to `http://localhost:8000` in your web browser.

---

## 7. Running Verification & Tests

### 7.1 Backend Unit & Integration Tests

From the repository root or `backend` folder:

```bash
cd backend
python -m pytest tests/ -v
```

### 7.2 Programmatic 9-Step Autonomous Learning Loop

SentinelMind includes an automated demonstration script verifying the complete autonomous learning cycle (Log Ingestion → Detection → Memory Recall → Recommendation Generation → Resolution → Retention):

```bash
cd backend
python tests/run_demo_workflow.py
```

### 7.3 Frontend Production Build Validation

```bash
cd frontend
npm run build
```
Confirms Vite transformation, minification, and CSS compilation complete with exit code 0.

---

## 8. Common Troubleshooting

| Issue / Error | Likely Cause | Solution |
|---|---|---|
| `ModuleNotFoundError: No module named 'app'` | Running pytest from outside backend or missing PYTHONPATH | Run `cd backend && python -m pytest tests/` or set `PYTHONPATH=backend`. |
| `Address already in use: 8000` | Port 8000 is occupied by a lingering process | Stop the existing process: `netstat -ano \| findstr :8000` then `taskkill /PID <PID> /F` (Windows) or `lsof -i :8000 \| kill -9` (Linux/Mac). |
| `Vite build fails: EPERM operation not permitted` | Windows terminal lock on temporary build directory | Re-run `npm run build` after closing locking Explorer windows. |
| `Supabase 401 Unauthorized` | Invalid or expired access token | Check `VITE_SUPABASE_ANON_KEY` in `frontend/.env` and verify user is logged in. |
| `Groq connection timeout` | Network blocking outbound requests | Ensure your network allows connections to `api.groq.com`. SentinelMind will automatically fall back to local reasoning heuristics if blocked. |
| `Memory Explorer shows no memories` | Empty workspace partition | SentinelMind seeds 4 foundational incident memories on initial user access. If empty, click **Memory Sandbox -> Execute recall()** to trigger indexing. |


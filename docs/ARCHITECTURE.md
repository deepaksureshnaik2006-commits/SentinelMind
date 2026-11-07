# SentinelMind System Architecture

This document provides a comprehensive technical blueprint of **SentinelMind**, describing its architectural tiers, component responsibilities, multi-tenant isolation guarantees, and cognitive memory lifecycle.

---

## 1. High-Level Architectural Blueprint

SentinelMind is architected as an asynchronous, multi-tenant AI operations platform that couples rapid log parsing and cloud LLM inference with persistent episodic agent memory.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client Tier (React 18 + Vite 6)"]
        UI["Cyber HUD Interface\nTailwind CSS + Lucide + Recharts"]
        AuthContext["Auth Context\nSupabase Session & JWT"]
        AppContext["App Context\nState & Active Routing"]
        APIClient["API Service Layer\nAuthenticated Fetch Proxy"]
    end

    subgraph APILayer["Backend Application Tier (FastAPI + Python 3.11)"]
        Router["API Gateway / FastAPI Routers\n/api/incidents, /api/logs, /api/assistant\n/api/memory, /api/recommendations, /api/simulator"]
        AuthMiddleware["Security & Auth Dependency\nget_current_user -> UserContext"]
        LogProcessor["Log Parsing Engine\nRegex Extractors & Anomaly Detection"]
        ResEngine["Resolution Intelligence Engine\nPrecedent Contrast & Confidence Scorer"]
        SimEngine["What-If Simulation Engine\nMonte Carlo Strategy Modeling"]
    end

    subgraph CognitiveTier["Cognitive & Memory Layer"]
        GroqService["Groq LLM Acceleration\nQwen 2.5 27B / GPT-OSS 120B\n< 1.5s Token Generation"]
        HindsightService["Vectorize Hindsight SDK 1.2.0\nPersistent Episodic Memory"]
        subgraph MemoryOps["Hindsight Primitives"]
            Retain["retain()\nStore verified incident reports"]
            Recall["recall()\nHybrid vector/keyword search"]
            Reflect["reflect()\nMulti-incident analytical reasoning"]
        end
    end

    subgraph PersistenceTier["Storage & Persistence Tier"]
        SupabasePostgres["Supabase PostgreSQL 15+\nRow Level Security (RLS) Enforced"]
        LocalRepo["In-Memory Repository\nUser-Partitioned Fallback Store"]
        StorageBuckets["User-Isolated Log Storage\nuser_id/incidents/logs/..."]
    end

    UI --> AuthContext
    UI --> AppContext
    AppContext --> APIClient
    APIClient -->|Bearer JWT| Router

    Router --> AuthMiddleware
    AuthMiddleware -->|Validated UserContext| Router
    Router --> LogProcessor
    Router --> ResEngine
    Router --> SimEngine

    LogProcessor --> GroqService
    ResEngine --> HindsightService
    SimEngine --> HindsightService
    HindsightService --> MemoryOps

    Router --> LocalRepo
    Router --> SupabasePostgres
    SupabasePostgres --> StorageBuckets
```

---

## 2. Component Responsibilities

### 2.1 Frontend Client Tier
* **Technology:** React 18, Vite 6, Tailwind CSS, Lucide React, Recharts.
* **Responsibilities:**
  - Render dark cybernetic HUD styling (`#070D18` background, `#168DCE` borders, `#38BDF8` text accents).
  - Manage client authentication sessions and JWT token refresh via `@supabase/supabase-js`.
  - Handle drag-and-drop log ingestion (.log, .txt, .json) and visualization.
  - Present real-time telemetry dashboards, MTTR compression curves, and confidence breakdowns.
  - Provide human-in-the-loop incident triage and one-click recommendation approval.

### 2.2 Backend Application Tier
* **Technology:** FastAPI 0.115+, Pydantic v2, Python 3.11+, Uvicorn, HTTPX.
* **Responsibilities:**
  - Enforce authentication on all private endpoints via `get_current_user` dependency.
  - Normalize unstructured log streams into structured JSON events with severity categorizations.
  - Orchestrate LLM prompts for root cause analysis and dynamic strategy generation.
  - Mediate memory operations against user-specific Hindsight banks.
  - Calculate empirical workspace metrics (Mean Time to Resolve, success rates, resolution velocity).

### 2.3 Cognitive & Memory Tier
* **Technology:** Vectorize Hindsight Client 1.2.0, Groq API SDK.
* **Responsibilities:**
  - **Hindsight `retain()`**: Commit verified resolution outcomes (symptoms, root cause, applied fix, outcome: success/failure, engineer feedback) into persistent memory.
  - **Hindsight `recall()`**: Query the user's isolated memory bank before generating recommendations to retrieve relevant historical precedents with similarity scores.
  - **Hindsight `reflect()`**: Synthesize multi-incident patterns and cross-service correlations to formulate proactive architectural insights.
  - **Groq LLM Acceleration**: Provide sub-second inference using `qwen/qwen3.8-27b` and `openai/gpt-oss-120b` to differentiate between confirmed log evidence and agent hypotheses.

### 2.4 Data & Persistence Tier
* **Technology:** Supabase PostgreSQL 15+, Row Level Security (RLS), Local Repository Partition.
* **Responsibilities:**
  - Enforce table-level data ownership using `user_id UUID REFERENCES auth.users(id)`.
  - Guarantee row isolation using Postgres `auth.uid()` security policies.
  - Maintain an in-memory repository partitioned by `user_id` for local development, rapid unit testing, and sandbox operation.

---

## 3. End-to-End Incident Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as SRE / DevOps Engineer
    participant Frontend as SentinelMind HUD (React)
    participant Backend as FastAPI Backend
    participant Groq as Groq LLM API
    participant Hindsight as Hindsight Memory Bank
    participant DB as Supabase PostgreSQL

    Engineer->>Frontend: Ingest raw telemetry log file (.log/.txt/.json)
    Frontend->>Backend: POST /api/logs/analyze (Bearer JWT)
    Backend->>Backend: Extract timestamps, service name, error signatures
    Backend->>Groq: Generate Root Cause Analysis (RCA) prompt
    Groq-->>Backend: Return Hypotheses & Evidence breakdown
    Backend-->>Frontend: Return Structured Log Analysis Result

    Engineer->>Frontend: Register Incident & Trigger Investigation
    Frontend->>Backend: POST /api/incidents
    Backend->>DB: INSERT INTO incidents (user_id = auth.uid())

    Frontend->>Backend: GET /api/recommendations/{incident_id}
    Backend->>Hindsight: recall(query = symptoms, bank_id = user_bank)
    Hindsight-->>Backend: Recalled historical experiences & failure precedents
    Backend->>Backend: Contrast past successes vs failed approaches avoided
    Backend-->>Frontend: Return Explainable Recommendations & Confidence Score

    Engineer->>Frontend: Review & Click "Approve Fix"
    Frontend->>Backend: POST /api/recommendations/{id}/approve
    Backend->>DB: UPDATE recommendations SET is_approved = true

    Engineer->>Frontend: Mark Incident Resolved (Success / Failure)
    Frontend->>Backend: POST /api/incidents/{id}/resolve
    Backend->>Hindsight: retain(symptoms, root_cause, fix, outcome, feedback)
    Backend->>DB: UPDATE incidents SET status = 'resolved'
    Backend-->>Frontend: Updated MTTR & Retained Knowledge Precedent
```

---

## 4. Multi-Tenant Data Isolation Architecture

SentinelMind guarantees strict data isolation between registered operators. Data created by User A never appears in or influences User B's workspace.

### 4.1 Identity Derivation
The frontend passes the authenticated user's Supabase JWT in the `Authorization: Bearer <token>` header. The backend parses and verifies the token server-side:
```python
async def get_current_user(request: Request) -> UserContext:
    token = extract_bearer_token(request)
    # Verified against Supabase Auth identity provider
    user = supabase_service.get_user(token)
    return UserContext(user_id=user.id, email=user.email, role=user.role)
```
User IDs supplied in request payloads are never trusted. All database queries and memory accesses use `current_user.id`.

### 4.2 Database Row Level Security (RLS)
Every table (`incidents`, `logs`, `recommendations`, `services`, `feedback`) includes a `user_id` foreign key referencing `auth.users(id)`:
```sql
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own incidents"
ON incidents FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 4.3 Cognitive Memory Partitioning
Memory banks are tenant-isolated. SentinelMind derives a deterministic, private bank identifier for each authenticated operator:
```python
def get_user_bank_id(self, user_id: str) -> str:
    clean = user_id.replace("-", "").replace("_", "")[:16]
    return f"sentinelmind-user-{clean}"
```
* **Private Recall:** User A's memory queries search only `sentinelmind-user-A`.
* **Private Retention:** User B's incident resolutions are indexed strictly into `sentinelmind-user-B`.
* **Zero Cross-Contamination:** A failed resolution in Tenant A will never influence Tenant B's confidence scores or recommendations.

---

## 5. Fault Tolerance & Fallback Strategy

| Scenario | Primary Path | Fallback Mechanism |
|---|---|---|
| **Groq API Rate Limit or Network Outage** | Cloud Groq API (`qwen/qwen3.8-27b`) | Automated model rollover to `openai/gpt-oss-120b`, followed by local rule-based heuristic diagnostic synthesis. |
| **Hindsight API Network Disconnection** | Cloud Hindsight API (`api.hindsight.vectorize.io`) | Local in-memory vector cache partitioned by bank ID with keyword/semantic scoring. |
| **Supabase Database Disconnected** | Supabase Managed PostgreSQL | Pre-seeded local repository mode preserving complete schema structures and CRUD operations. |
| **Missing Failure Precedents** | Recalled historical failures | Domain anti-pattern engine automatically populates real operational failure precedents avoided. |


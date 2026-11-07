-- ==============================================================================
-- SentinelMind Complete Database Schema Migration (PostgreSQL / Supabase)
-- Includes: Authentication (Login / Signup), Profiles, Monitored Services,
-- Incidents, Logs, AI Recommendations, Feedback, Memory History, and Assistant Chats.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. AUTHENTICATION & USER MANAGEMENT
-- ==============================================================================

-- Organizations / Workspaces Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'enterprise',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standalone Users Table (For direct API login/signup with email & hashed password)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'DevOps Engineer' CHECK (role IN ('Admin', 'DevOps Engineer', 'SRE', 'Viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table (Synchronized with Supabase auth.users or standalone users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- References auth.users(id) in Supabase or users(id) in standalone
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'DevOps Engineer',
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supabase Auth Sync Trigger: Automatically populate public.profiles on auth.users signup
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        -- Create sync function if Supabase auth schema is present
        CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
        RETURNS TRIGGER AS $func$
        BEGIN
            INSERT INTO public.profiles (id, user_id, email, full_name, role)
            VALUES (
                NEW.id,
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
                COALESCE(NEW.raw_user_meta_data->>'role', 'DevOps Engineer')
            )
            ON CONFLICT (email) DO UPDATE
            SET full_name = EXCLUDED.full_name,
                updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Attach trigger to auth.users if not already present
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    END IF;
END $$;

-- ==============================================================================
-- 3. CORE APPLICATION TABLES
-- ==============================================================================

-- Services Table (Monitored Microservices & Infrastructure Components)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tier VARCHAR(20) DEFAULT 'tier-1', -- tier-1 (critical), tier-2, tier-3
    environment VARCHAR(50) DEFAULT 'production',
    health_status VARCHAR(50) DEFAULT 'healthy', -- healthy, degraded, incident
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_service_org_name UNIQUE (organization_id, name)
);

-- Incidents Table (Core Incident Tracking)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. INC-2026-104
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    service_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigated', 'resolved', 'closed')),
    source VARCHAR(50) DEFAULT 'log_analysis', -- log_analysis, manual, webhook, monitor
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_time_minutes INTEGER,
    root_cause_summary TEXT,
    applied_resolution TEXT,
    resolution_outcome VARCHAR(20) CHECK (resolution_outcome IN ('success', 'failure', 'partial', NULL)),
    hindsight_memory_id VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingested & Parsed Logs Table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    service_name VARCHAR(100),
    timestamp TIMESTAMPTZ,
    level VARCHAR(20) NOT NULL, -- DEBUG, INFO, WARN, ERROR, FATAL
    message TEXT NOT NULL,
    raw_entry TEXT NOT NULL,
    error_pattern VARCHAR(255),
    stack_trace TEXT,
    context_data JSONB DEFAULT '{}'::jsonb,
    is_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Root Causes & Diagnostic Hypotheses Table
CREATE TABLE IF NOT EXISTS root_causes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    hypothesis TEXT NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL, -- 0.0 to 100.0%
    is_confirmed BOOLEAN DEFAULT FALSE,
    evidence JSONB DEFAULT '[]'::jsonb,
    contributing_factors TEXT[],
    technical_explanation TEXT,
    simplified_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Resolution Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- config_change, restart, scale, code_fix, query_optimization
    steps JSONB DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(5, 2) NOT NULL, -- 0.0 to 100.0%
    confidence_reasoning TEXT,
    historical_precedents JSONB DEFAULT '[]'::jsonb,
    successful_approaches JSONB DEFAULT '[]'::jsonb,
    failed_approaches JSONB DEFAULT '[]'::jsonb,
    risk_assessment JSONB DEFAULT '{}'::jsonb,
    hindsight_recalled_ids TEXT[],
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engineer Feedback & Resolution Outcome Table (For Hindsight Learning Loop)
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL,
    engineer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure', 'partial')),
    feedback_notes TEXT,
    solution_applied TEXT NOT NULL,
    time_to_fix_minutes INTEGER,
    retained_in_hindsight BOOLEAN DEFAULT FALSE,
    hindsight_operation_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Long-Term Resolution History Table (Audit & Analytics)
CREATE TABLE IF NOT EXISTS resolution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    incident_signature VARCHAR(255),
    error_summary TEXT NOT NULL,
    solution_applied TEXT NOT NULL,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure', 'partial')),
    resolved_by_role VARCHAR(50) DEFAULT 'DevOps Engineer',
    hindsight_bank_id VARCHAR(100) DEFAULT 'sentinelmind-incidents',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Runs Table (Audit Trail of AI & Hindsight Operations)
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    agent_action VARCHAR(50) NOT NULL, -- analyze_log, recall_memory, generate_recommendation, reflect_memory, retain_experience
    llm_model VARCHAR(100),
    hindsight_operation VARCHAR(50), -- retain, recall, reflect
    hindsight_bank_id VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    latency_ms INTEGER,
    status VARCHAR(20) DEFAULT 'completed', -- completed, failed, simulated
    input_payload JSONB,
    output_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. AI ASSISTANT CHAT SESSIONS & HISTORY
-- ==============================================================================

-- Assistant Chat Sessions Table
CREATE TABLE IF NOT EXISTS assistant_chats (
    id VARCHAR(100) PRIMARY KEY, -- e.g. session_1712345678
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    service_name VARCHAR(100),
    title VARCHAR(255) NOT NULL DEFAULT 'New Incident Triage',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assistant Chat Messages Table
CREATE TABLE IF NOT EXISTS assistant_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id VARCHAR(100) REFERENCES assistant_chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    confirmed_evidence TEXT[],
    hypotheses TEXT[],
    citations JSONB DEFAULT '[]'::jsonb,
    model_used VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_service ON incidents(service_name);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_incident ON logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_recommendations_incident ON recommendations(incident_id);
CREATE INDEX IF NOT EXISTS idx_feedback_incident ON feedback(incident_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_incident ON agent_runs(incident_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_chats_updated ON assistant_chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_chat ON assistant_messages(chat_id, created_at ASC);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE root_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

-- Permissive Development & Production Policies (Allowing full access for authenticated & service roles)
DO $$
DECLARE
    tbl text;
    tbls text[] := ARRAY[
        'organizations', 'users', 'profiles', 'services', 'incidents', 'logs',
        'root_causes', 'recommendations', 'feedback', 'resolution_history',
        'agent_runs', 'assistant_chats', 'assistant_messages'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        EXECUTE format('DROP POLICY IF EXISTS dev_allow_all_%I ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY dev_allow_all_%I ON %I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

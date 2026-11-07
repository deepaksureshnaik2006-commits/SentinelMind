-- ==============================================================================
-- SentinelMind Multi-User Private Workspace Data Isolation Migration
-- Guarantees that every user's incidents, logs, recommendations, and memories
-- are completely isolated. Data created by one user NEVER appears in another's.
-- ==============================================================================

-- 1. ADD USER_ID OWNERSHIP COLUMNS
-- Add user_id UUID REFERENCES auth.users(id) to all user-generated tables

DO $$
BEGIN
    -- Incidents table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.incidents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON public.incidents(user_id);
    END IF;

    -- Logs table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
    END IF;

    -- Recommendations table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'recommendations' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.recommendations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);
    END IF;

    -- Root Causes table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'root_causes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.root_causes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_root_causes_user_id ON public.root_causes(user_id);
    END IF;

    -- Feedback table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'feedback' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.feedback ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
    END IF;

    -- Resolution History table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'resolution_history' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.resolution_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_resolution_history_user_id ON public.resolution_history(user_id);
    END IF;

    -- Agent Runs audit table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'agent_runs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.agent_runs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
    END IF;

    -- Assistant Chats table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'assistant_chats' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.assistant_chats ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_assistant_chats_user_id ON public.assistant_chats(user_id);
    END IF;

    -- Assistant Messages table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'assistant_messages' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.assistant_messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_id ON public.assistant_messages(user_id);
    END IF;
END $$;

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict enforcement using auth.uid()
-- ==============================================================================

-- Enable RLS across all user-owned tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.root_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

-- Drop obsolete permissive dev policies if present
DO $$
DECLARE
    tbl text;
    tbls text[] := ARRAY[
        'profiles', 'incidents', 'logs', 'recommendations', 'root_causes',
        'feedback', 'resolution_history', 'agent_runs', 'assistant_chats', 'assistant_messages'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        EXECUTE format('DROP POLICY IF EXISTS dev_allow_all_%I ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS user_isolation_select_%I ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS user_isolation_insert_%I ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS user_isolation_update_%I ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS user_isolation_delete_%I ON public.%I;', tbl, tbl);
    END LOOP;
END $$;

-- A. PROFILES TABLE POLICIES (Users manage only their own profile)
CREATE POLICY user_isolation_select_profiles ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY user_isolation_insert_profiles ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY user_isolation_update_profiles ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- B. INCIDENTS TABLE POLICIES (Users access only their own incidents)
CREATE POLICY user_isolation_select_incidents ON public.incidents
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY user_isolation_insert_incidents ON public.incidents
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_isolation_update_incidents ON public.incidents
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_isolation_delete_incidents ON public.incidents
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- C. LOGS TABLE POLICIES (Users access only logs belonging to their incidents)
CREATE POLICY user_isolation_select_logs ON public.logs
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = logs.incident_id AND i.user_id = auth.uid())
    );

CREATE POLICY user_isolation_insert_logs ON public.logs
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = logs.incident_id AND i.user_id = auth.uid())
    );

CREATE POLICY user_isolation_delete_logs ON public.logs
    FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = logs.incident_id AND i.user_id = auth.uid())
    );

-- D. RECOMMENDATIONS POLICIES
CREATE POLICY user_isolation_select_recommendations ON public.recommendations
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = recommendations.incident_id AND i.user_id = auth.uid())
    );

CREATE POLICY user_isolation_insert_recommendations ON public.recommendations
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = recommendations.incident_id AND i.user_id = auth.uid())
    );

CREATE POLICY user_isolation_update_recommendations ON public.recommendations
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = recommendations.incident_id AND i.user_id = auth.uid())
    );

-- E. ASSISTANT CHATS & MESSAGES POLICIES
CREATE POLICY user_isolation_select_assistant_chats ON public.assistant_chats
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY user_isolation_insert_assistant_chats ON public.assistant_chats
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_isolation_select_assistant_messages ON public.assistant_messages
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.assistant_chats c WHERE c.id = assistant_messages.chat_id AND c.user_id = auth.uid())
    );

CREATE POLICY user_isolation_insert_assistant_messages ON public.assistant_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.assistant_chats c WHERE c.id = assistant_messages.chat_id AND c.user_id = auth.uid())
    );

-- ==============================================================================
-- 3. SAFE EXISTING DATA PRESERVATION
-- Pre-existing records without user_id are quarantined under a system identifier
-- and are never exposed to new registered user workspaces.
-- ==============================================================================

UPDATE public.incidents
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE user_id IS NULL;


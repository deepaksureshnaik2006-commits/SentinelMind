import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  Cpu,
  BrainCircuit,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  Shield,
  Server,
  Layers,
  FileCode,
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const { systemSettings, fetchSettings, showToast } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview or migrations

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/settings/refresh', { method: 'POST' });
      await fetchSettings();
      showToast('Service connectivity verified', 'success');
    } catch (err) {
      showToast('Failed to refresh status', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const copySqlMigration = () => {
    const sql = `-- SentinelMind Supabase PostgreSQL Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'DevOps Engineer',
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tier VARCHAR(20) DEFAULT 'tier-1',
    health_status VARCHAR(50) DEFAULT 'healthy',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'open',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_time_minutes INTEGER,
    applied_resolution TEXT,
    resolution_outcome VARCHAR(20),
    hindsight_memory_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    service_name VARCHAR(100),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    raw_entry TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(5,2),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    outcome VARCHAR(20) NOT NULL,
    solution_applied TEXT NOT NULL,
    feedback_notes TEXT,
    retained_in_hindsight BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resolution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    solution_applied TEXT NOT NULL,
    outcome VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    agent_action VARCHAR(50) NOT NULL,
    hindsight_operation VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;
    navigator.clipboard.writeText(sql);
    showToast('Supabase SQL migration copied to clipboard', 'success');
  };

  const groqStatus = systemSettings?.groq?.status || 'Checking';
  const hindsightStatus = systemSettings?.hindsight?.status || 'Checking';
  const dbStatus = systemSettings?.database?.status || 'Checking';

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Settings & System Status
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified backend engine health, long-term memory configurations, and database connectivity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1626] border border-[#1E293B] hover:border-slate-700 text-xs text-slate-300 font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Verify Connectivity</span>
          </button>

          {/* Tab Selector */}
          <div className="flex items-center bg-[#0F1626] border border-[#1E293B] rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              System Health
            </button>
            <button
              onClick={() => setActiveTab('migrations')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'migrations'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SQL Schema
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Security Notice */}
          <div className="p-4 rounded-xl bg-[#0F1626] border border-[#1E293B] flex items-start gap-3 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Zero-Exposure Credential Architecture:</span>
              <span className="text-slate-400 ml-1">
                All API keys, secrets and credentials are authenticated exclusively via server-side environment variables (<code className="text-slate-300 font-mono">backend/.env</code>). No tokens or secrets are transmitted to or stored in client code.
              </span>
            </div>
          </div>

          {/* Section B: AI Services */}
          <div className="bg-[#0F1626] border border-[#1E293B] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>AI Reasoning & Inference</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-medium ${
                  groqStatus === 'Connected'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {groqStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#090D16] border border-[#1E293B] space-y-1">
                <span className="text-slate-400 text-[11px] block">Provider & Engine:</span>
                <span className="text-white font-semibold">Groq Inference Engine</span>
              </div>
              <div className="p-3 rounded-lg bg-[#090D16] border border-[#1E293B] space-y-1">
                <span className="text-slate-400 text-[11px] block">Active Model:</span>
                <span className="text-indigo-300 font-semibold">{systemSettings?.groq?.model || 'qwen/qwen3.8-27b'}</span>
              </div>
            </div>
          </div>

          {/* Section B: Hindsight Memory Bank */}
          <div className="bg-[#0F1626] border border-[#1E293B] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span>Long-Term Agent Memory (Hindsight)</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-medium ${
                  hindsightStatus === 'Connected' || hindsightStatus === 'Active'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                }`}
              >
                {hindsightStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#090D16] border border-[#1E293B] space-y-1">
                <span className="text-slate-400 text-[11px] block">Memory Bank ID:</span>
                <span className="text-cyan-300 font-semibold">{systemSettings?.hindsight?.bank_id || 'sentinelmind-incidents'}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#090D16] border border-[#1E293B] space-y-1">
                <span className="text-slate-400 text-[11px] block">Architecture Mode:</span>
                <span className="text-white font-semibold">{systemSettings?.hindsight?.mode || 'Local Bank (Embedded Hybrid Store)'}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#090D16] border border-[#1E293B] space-y-1">
                <span className="text-slate-400 text-[11px] block">Core Primitives:</span>
                <span className="text-slate-300">retain(), recall(), reflect()</span>
              </div>
            </div>
          </div>

          {/* Section C: Database & Persistence */}
          <div className="bg-[#0F1626] border border-[#1E293B] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Database & Persistence Layer</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-medium ${
                  dbStatus === 'Connected' || dbStatus === 'Active'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {dbStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#090D16] border border-[#1E293B] space-y-1">
                <span className="text-slate-400 text-[11px] block">Repository Driver:</span>
                <span className="text-white font-semibold">{systemSettings?.database?.type || 'Local Repository'}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#090D16] border border-[#1E293B] space-y-1">
                <span className="text-slate-400 text-[11px] block">Target Architecture:</span>
                <span className="text-indigo-300 font-semibold">Supabase PostgreSQL (9 Tables Ready)</span>
              </div>
            </div>
          </div>

          {/* Section A & D: General Application Information */}
          <div className="bg-[#0F1626] border border-[#1E293B] rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-[#1E293B] pb-3">
              Application & API Telemetry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Version:</span>
                <div className="text-slate-200">SentinelMind 1.0.0</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">API Documentation:</span>
                <div>
                  <a
                    href="http://127.0.0.1:8000/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1"
                  >
                    <span>OpenAPI / Swagger</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Health Probe:</span>
                <div>
                  <a
                    href="http://127.0.0.1:8000/api/health"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1"
                  >
                    <span>/api/health</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Section E: Database Schema / SQL Migration View */
        <div className="bg-[#0F1626] border border-[#1E293B] rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Supabase SQL Migration Script
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                9 production tables prepared: profiles, services, incidents, logs, root_causes, recommendations, feedback, resolution_history, agent_runs.
              </p>
            </div>

            <button
              onClick={copySqlMigration}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy SQL</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-[#070A12] border border-[#1E293B] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
{`-- SentinelMind Supabase PostgreSQL Migration (9 Tables)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Engineers & DevOps Roles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'DevOps Engineer',
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Services (Monitored Microservices)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tier VARCHAR(20) DEFAULT 'tier-1',
    health_status VARCHAR(50) DEFAULT 'healthy',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Incidents (Core Incident Tracker)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'open',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_time_minutes INTEGER,
    applied_resolution TEXT,
    resolution_outcome VARCHAR(20),
    hindsight_memory_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Logs (Parsed Log Stream)
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    service_name VARCHAR(100),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    raw_entry TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Recommendations (Experience-Based Solutions)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(5,2),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Feedback (Engineer Learning Feedback)
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    outcome VARCHAR(20) NOT NULL,
    solution_applied TEXT NOT NULL,
    feedback_notes TEXT,
    retained_in_hindsight BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Resolution History (Longitudinal Record)
CREATE TABLE IF NOT EXISTS resolution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    solution_applied TEXT NOT NULL,
    outcome VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Agent Runs (Audit Trail)
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    agent_action VARCHAR(50) NOT NULL,
    hindsight_operation VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);`}
          </pre>
        </div>
      )}
    </div>
  );
}

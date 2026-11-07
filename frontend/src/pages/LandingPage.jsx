import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  BrainCircuit,
  Zap,
  Activity,
  Bot,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Server,
  Layers,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  Database,
  BarChart3,
  ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  const { navigateTo } = useApp();
  const { user, profile, signOut } = useAuth();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-[#E2F3FF] font-sans selection:bg-[#168DCE]/40 selection:text-[#38BDF8] overflow-x-hidden">
      {/* 1. Global Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#070D18]/85 border-b border-[#168DCE]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-sm bg-[#0A1320] border border-[#168DCE]/60 flex items-center justify-center text-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.35)] group-hover:border-[#38BDF8] transition-all">
              <BrainCircuit className="w-5 h-5 text-[#38BDF8] animate-pulse" />
            </div>
            <div>
              <span className="font-mono font-bold tracking-wider text-base text-[#E2F3FF] flex items-center gap-1.5">
                SENTINEL<span className="text-[#38BDF8]">MIND</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#8BA8C2] block uppercase -mt-1">
                Self-Learning SRE Agent
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-mono font-medium text-[#8BA8C2]">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#38BDF8] transition-colors uppercase tracking-wider"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#38BDF8] transition-colors uppercase tracking-wider"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="hover:text-[#38BDF8] transition-colors uppercase tracking-wider"
            >
              Architecture
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-[#38BDF8] transition-colors uppercase tracking-wider"
            >
              About
            </button>
          </div>

          {/* Auth CTA Buttons */}
          <div className="flex items-center gap-3 font-mono text-xs">
            {user ? (
              <>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="px-4 py-2 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-semibold flex items-center gap-2 shadow-[0_0_14px_rgba(56,189,248,0.4)] transition-all"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>OPEN DASHBOARD</span>
                </button>
                <button
                  onClick={signOut}
                  className="px-3 py-2 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 text-[#8BA8C2] hover:text-[#E2F3FF] hover:border-rose-500/50 transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigateTo('login')}
                  className="px-4 py-2 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 text-[#E2F3FF] hover:text-[#38BDF8] hover:border-[#38BDF8]/60 transition-all font-semibold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigateTo('signup')}
                  className="px-4 py-2 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-semibold flex items-center gap-1.5 shadow-[0_0_14px_rgba(56,189,248,0.35)] transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-[#168DCE]/20">
        {/* Cyber glow background gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#168DCE]/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-[#38BDF8]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A1320] border border-[#38BDF8]/50 shadow-[0_0_12px_rgba(56,189,248,0.25)] text-xs font-mono text-[#38BDF8]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous SRE Incident Intelligence with Hindsight Memory</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight text-[#E2F3FF] max-w-4xl mx-auto leading-tight">
            An AI Agent That Learns From{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#22D3EE] to-[#168DCE]">
              Every Incident.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-[#8BA8C2] max-w-2xl mx-auto font-sans leading-relaxed">
            SentinelMind intelligently investigates production incidents, remembers previous experiences and recommends better resolutions using AI-powered reasoning and Hindsight memory.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 font-mono text-xs">
            <button
              onClick={() => navigateTo(user ? 'dashboard' : 'signup')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-bold tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.45)] transition-all"
            >
              <span>{user ? 'OPEN COGNITIVE DASHBOARD' : 'GET STARTED FREE'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 hover:border-[#38BDF8] text-[#E2F3FF] hover:text-[#38BDF8] font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span>EXPLORE FEATURES</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hero HUD Metrics Strip */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-sm bg-[#0A1320]/80 border border-[#168DCE]/30 font-mono text-left">
              <span className="text-[10px] text-[#8BA8C2] uppercase block tracking-wider">MTTR Reduction</span>
              <span className="text-2xl font-bold text-[#38BDF8]">62.5%</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">48m → 14m Compression</span>
            </div>
            <div className="p-4 rounded-sm bg-[#0A1320]/80 border border-[#168DCE]/30 font-mono text-left">
              <span className="text-[10px] text-[#8BA8C2] uppercase block tracking-wider">Repeat Prevention</span>
              <span className="text-2xl font-bold text-[#22D3EE]">98.0%</span>
              <span className="text-[10px] text-[#8BA8C2] block mt-0.5">Failure Avoidance</span>
            </div>
            <div className="p-4 rounded-sm bg-[#0A1320]/80 border border-[#168DCE]/30 font-mono text-left">
              <span className="text-[10px] text-[#8BA8C2] uppercase block tracking-wider">Telemetry Parsing</span>
              <span className="text-2xl font-bold text-[#E2F3FF]">&lt; 2.5s</span>
              <span className="text-[10px] text-[#8BA8C2] block mt-0.5">Automated Ingestion</span>
            </div>
            <div className="p-4 rounded-sm bg-[#0A1320]/80 border border-[#168DCE]/30 font-mono text-left">
              <span className="text-[10px] text-[#8BA8C2] uppercase block tracking-wider">Memory Engine</span>
              <span className="text-2xl font-bold text-[#38BDF8]">Vector v1.1</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">Hindsight Cloud Live</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Preview Interactive Mockup */}
      <section className="py-20 bg-[#070D18] border-b border-[#168DCE]/20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest font-semibold block">
              COGNITIVE SRE INTERFACE
            </span>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-[#E2F3FF]">
              Unified Incident Intelligence Workspace
            </h2>
          </div>

          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/40 rounded-sm p-4 sm:p-6 shadow-[0_0_30px_rgba(22,141,206,0.15)] font-mono">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#168DCE]/25 text-xs text-[#8BA8C2]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] text-[#38BDF8] ml-2">sentinelmind-live-telemetry.hud</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-emerald-400">● LIVE LINK ACTIVE</span>
                <span>GROQ QWEN-3.8-27B</span>
              </div>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Card 1: Active Triage */}
              <div className="p-3.5 rounded-sm bg-[#070D18] border border-rose-500/35 space-y-2">
                <div className="flex items-center justify-between text-rose-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    INC-2026-104 [CRITICAL]
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-rose-950/60 border border-rose-800 text-rose-300">
                    OPEN
                  </span>
                </div>
                <p className="text-[11px] text-[#E2F3FF]">payment-service: HikariCP Connection Pool Exhaustion</p>
                <div className="text-[10px] text-[#8BA8C2] pt-1 border-t border-rose-900/30">
                  Root Cause: Active sockets saturated at 10/10 ceiling
                </div>
              </div>

              {/* Card 2: Hindsight Memory Recall */}
              <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#38BDF8]/40 space-y-2 shadow-[0_0_12px_rgba(56,189,248,0.1)]">
                <div className="flex items-center justify-between text-[#38BDF8]">
                  <span className="font-bold flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Hindsight Memory Recall
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ✓ RESOLVED
                  </span>
                </div>
                <p className="text-[11px] text-[#E2F3FF]">Matched: billing-engine & cache-layer precedents</p>
                <div className="text-[10px] text-[#8BA8C2] pt-1 border-t border-[#168DCE]/25">
                  Advises: Scale pool max-size to 25; avoid raw pod restart
                </div>
              </div>

              {/* Card 3: Real-Time MTTR Compression */}
              <div className="p-3.5 rounded-sm bg-[#070D18] border border-emerald-500/35 space-y-2">
                <div className="flex items-center justify-between text-emerald-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    MTTR Trajectory
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">-34 mins</span>
                </div>
                <p className="text-[11px] text-[#E2F3FF]">Cycle 1: 48m ──► Cycle 4: 14m</p>
                <div className="text-[10px] text-[#8BA8C2] pt-1 border-t border-emerald-900/30">
                  Success Rate climbing: 52% ──► 96%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Section */}
      <section id="features" className="py-24 bg-[#070D18] border-b border-[#168DCE]/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest font-semibold block">
              CAPABILITIES & ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold text-[#E2F3FF]">
              Engineered for Modern High-Availability SRE
            </h2>
            <p className="text-sm text-[#8BA8C2] font-sans">
              SentinelMind unifies telemetry ingestion, vector precedent search, and large language model reasoning into an autonomous, self-improving operational feedback loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: AI Incident Analysis */}
            <div className="p-6 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 hover:border-[#38BDF8] transition-all space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
              <div className="w-10 h-10 rounded-sm bg-[#070D18] border border-[#168DCE]/50 flex items-center justify-center text-[#38BDF8]">
                <Activity className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h3 className="text-base font-mono font-bold text-[#E2F3FF]">
                AI Incident Analysis
              </h3>
              <p className="text-xs text-[#8BA8C2] font-sans leading-relaxed">
                Ingests raw server logs, stack traces, and cloud metrics via paste or drag-and-drop. Auto-detects microservices, error signatures, and classifies incident severity in milliseconds.
              </p>
            </div>

            {/* Feature 2: Hindsight-Powered Memory */}
            <div className="p-6 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 hover:border-[#38BDF8] transition-all space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
              <div className="w-10 h-10 rounded-sm bg-[#070D18] border border-[#168DCE]/50 flex items-center justify-center text-[#38BDF8]">
                <BrainCircuit className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h3 className="text-base font-mono font-bold text-[#E2F3FF]">
                Hindsight-Powered Memory
              </h3>
              <p className="text-xs text-[#8BA8C2] font-sans leading-relaxed">
                Connects to Vectorize Hindsight memory banks. Remembers both successful mitigations and failed operational trials, actively steering engineers away from repeating previous missteps.
              </p>
            </div>

            {/* Feature 3: Resolution Intelligence */}
            <div className="p-6 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 hover:border-[#38BDF8] transition-all space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
              <div className="w-10 h-10 rounded-sm bg-[#070D18] border border-[#168DCE]/50 flex items-center justify-center text-[#38BDF8]">
                <Zap className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h3 className="text-base font-mono font-bold text-[#E2F3FF]">
                Resolution Intelligence
              </h3>
              <p className="text-xs text-[#8BA8C2] font-sans leading-relaxed">
                Generates ranked, step-by-step remediation runbooks backed by confidence scores and verified precedent citations. Auto-pre-fills resolution forms for rapid on-call mitigation.
              </p>
            </div>

            {/* Feature 4: AI Incident Assistant */}
            <div className="p-6 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 hover:border-[#38BDF8] transition-all space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
              <div className="w-10 h-10 rounded-sm bg-[#070D18] border border-[#168DCE]/50 flex items-center justify-center text-[#38BDF8]">
                <Bot className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h3 className="text-base font-mono font-bold text-[#E2F3FF]">
                AI Incident Assistant
              </h3>
              <p className="text-xs text-[#8BA8C2] font-sans leading-relaxed">
                Interactive SRE Copilot powered by Groq Qwen-3.8-27B. Queries historical memories, runs diagnostic inquiries, and saves full chat exchanges to Supabase cloud storage.
              </p>
            </div>

            {/* Feature 5: Continuous Learning & Curves */}
            <div className="p-6 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 hover:border-[#38BDF8] transition-all space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
              <div className="w-10 h-10 rounded-sm bg-[#070D18] border border-[#168DCE]/50 flex items-center justify-center text-[#38BDF8]">
                <TrendingUp className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h3 className="text-base font-mono font-bold text-[#E2F3FF]">
                Continuous Learning Analytics
              </h3>
              <p className="text-xs text-[#8BA8C2] font-sans leading-relaxed">
                Visualizes empirical MTTR compression curves and success rate trajectories over time. Mathematical proof that the agent gets faster and more reliable with every resolved outage.
              </p>
            </div>

            {/* Feature 6: Causal Lineage Topology */}
            <div className="p-6 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 hover:border-[#38BDF8] transition-all space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
              <div className="w-10 h-10 rounded-sm bg-[#070D18] border border-[#168DCE]/50 flex items-center justify-center text-[#38BDF8]">
                <Layers className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h3 className="text-base font-mono font-bold text-[#E2F3FF]">
                Causal Lineage Topology
              </h3>
              <p className="text-xs text-[#8BA8C2] font-sans leading-relaxed">
                Maps microservices to triggered incidents and retained Hindsight resolutions in a 1:1 causal pipeline, giving DevOps leaders full visibility into infrastructure health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#0A1320] border-b border-[#168DCE]/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest font-semibold block">
              OPERATIONAL WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold text-[#E2F3FF]">
              How SentinelMind Mitigates Production Failures
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
            {/* Step 1 */}
            <div className="p-6 rounded-sm bg-[#070D18] border border-[#168DCE]/35 space-y-3">
              <span className="text-[10px] text-[#38BDF8] font-bold block">STEP 01</span>
              <h3 className="text-sm font-bold text-[#E2F3FF]">Ingest Telemetry</h3>
              <p className="text-[#8BA8C2] font-sans leading-relaxed">
                Paste logs or stream metrics into the workspace. The engine automatically classifies signatures, severity, and impacted services.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-sm bg-[#070D18] border border-[#168DCE]/35 space-y-3">
              <span className="text-[10px] text-[#38BDF8] font-bold block">STEP 02</span>
              <h3 className="text-sm font-bold text-[#E2F3FF]">Recall Memory</h3>
              <p className="text-[#8BA8C2] font-sans leading-relaxed">
                Hindsight searches vector experience banks for similar past incidents, identifying what succeeded and what failed previously.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-sm bg-[#070D18] border border-[#168DCE]/35 space-y-3">
              <span className="text-[10px] text-[#38BDF8] font-bold block">STEP 03</span>
              <h3 className="text-sm font-bold text-[#E2F3FF]">Execute Fix</h3>
              <p className="text-[#8BA8C2] font-sans leading-relaxed">
                Review AI-formulated recommendations pre-filled with execution commands. The engineer confirms the fix and restores SLA.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-sm bg-[#070D18] border border-[#168DCE]/35 space-y-3">
              <span className="text-[10px] text-[#38BDF8] font-bold block">STEP 04</span>
              <h3 className="text-sm font-bold text-[#E2F3FF]">Retain & Learn</h3>
              <p className="text-[#8BA8C2] font-sans leading-relaxed">
                Resolution outcomes are retained in Hindsight. The learning curve drops MTTR and the topology updates in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Section */}
      <section id="about" className="py-20 bg-[#070D18] border-b border-[#168DCE]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-widest font-semibold block">
            ABOUT SENTINELMIND
          </span>
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-[#E2F3FF]">
            Bridging Cognitive AI Memory with Modern Cloud Reliability
          </h2>
          <p className="text-sm text-[#8BA8C2] font-sans leading-relaxed">
            SentinelMind was designed to solve the acute problem of repetitive production incidents. In modern microservices architectures, engineers often spend hours troubleshooting issues that were already resolved months prior by a teammate. By coupling high-speed Groq LLM inference with persistent Vectorize Hindsight memory and Supabase cloud synchronization, SentinelMind turns every outage into permanent institutional knowledge.
          </p>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-20 bg-[#0A1320] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-mono font-bold text-[#E2F3FF]">
            Ready to Accelerate Incident Recovery?
          </h2>
          <p className="text-sm text-[#8BA8C2] font-sans max-w-xl mx-auto">
            Experience autonomous telemetry parsing, historical memory recall, and empirical MTTR compression.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigateTo(user ? 'dashboard' : 'signup')}
              className="px-8 py-3.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-mono font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(56,189,248,0.45)] transition-all inline-flex items-center gap-2"
            >
              <span>{user ? 'LAUNCH SENTINELMIND WORKSPACE' : 'CREATE FREE ACCOUNT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="py-8 bg-[#070D18] border-t border-[#168DCE]/25 text-center font-mono text-xs text-[#8BA8C2]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[#38BDF8]" />
            <span className="font-bold text-[#E2F3FF]">SENTINELMIND</span>
          </div>
          <div>
            © 2026 SentinelMind. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#38BDF8]">Status: All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


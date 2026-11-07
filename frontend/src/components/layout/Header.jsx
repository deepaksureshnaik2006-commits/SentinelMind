import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Info,
  Menu
} from 'lucide-react';

const PAGE_METADATA = {
  dashboard: { title: 'Overview Dashboard', subtitle: 'Live incident telemetry & resolution metrics' },
  incidents: { title: 'Incident Management', subtitle: 'Search, investigate and track operational service incidents' },
  logs: { title: 'Log Analysis', subtitle: 'Ingest and diagnose raw system log streams' },
  'incident-detail': { title: 'Incident Investigation', subtitle: 'Diagnostic telemetry and resolution workspace' },
  assistant: { title: 'AI Incident Assistant', subtitle: 'Autonomous troubleshooting copilot with memory recall' },
  memory: { title: 'Memory Explorer', subtitle: 'Inspection of retained experiences, resolutions & patterns' },
  recommendations: { title: 'Resolution Intelligence', subtitle: 'Experience-based decision recommendations' },
  simulator: { title: 'What-If Simulator', subtitle: 'Infrastructure change outcome modeling & risk assessment' },
  analytics: { title: 'Learning Analytics', subtitle: 'Empirical telemetry tracking MTTR reduction' },
};

export default function Header({ onMenuClick }) {
  const { activePage, navigateTo, toast } = useApp();

  const pageMeta = PAGE_METADATA[activePage] || { title: 'SentinelMind', subtitle: '' };

  return (
    <header className="h-14 bg-[#070D18]/95 backdrop-blur-md border-b border-[#168DCE]/30 px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-sm border border-[#168DCE]/30 text-[#8BA8C2] hover:text-[#38BDF8] hover:bg-[#168DCE]/10 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-mono font-bold text-[#E2F3FF] tracking-wider uppercase">
            {pageMeta.title}
          </h1>
          <span className="hidden md:inline text-xs text-[#168DCE]">•</span>
          <span className="hidden md:inline text-xs text-[#8BA8C2] font-sans whitespace-nowrap">
            {pageMeta.subtitle}
          </span>
        </div>
      </div>

      {/* Right: Quick Ingest Action */}
      <div className="flex items-center gap-3">
        {/* Upload Log Action */}
        <button
          onClick={() => navigateTo('logs')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] text-white text-xs font-mono font-semibold transition-all shadow-[0_0_12px_rgba(56,189,248,0.35)] active:brightness-125 border border-[#38BDF8] cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>UPLOAD LOG</span>
        </button>
      </div>
    </header>
  );
}

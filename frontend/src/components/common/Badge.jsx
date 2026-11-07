import React from 'react';

export function SeverityBadge({ severity }) {
  const sev = (severity || 'low').toLowerCase();
  const config = {
    critical: 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/40 shadow-[0_0_8px_rgba(251,113,133,0.22)]',
    high: 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]',
    medium: 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/40',
    low: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold uppercase tracking-wider border whitespace-nowrap ${config[sev] || config.low}`}>
      {sev}
    </span>
  );
}

export function StatusBadge({ status }) {
  const st = (status || 'open').toLowerCase();
  const config = {
    open: 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/40 shadow-[0_0_8px_rgba(251,113,133,0.2)]',
    investigating: 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/45 shadow-[0_0_8px_rgba(34,211,238,0.22)]',
    mitigated: 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40',
    resolved: 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/45 shadow-[0_0_8px_rgba(52,211,153,0.22)]',
    closed: 'bg-[#0B1422] text-[#8BA8C2] border-[#168DCE]/30',
  };

  const dotConfig = {
    open: 'bg-[#FB7185] shadow-[0_0_6px_#FB7185]',
    investigating: 'bg-[#22D3EE] shadow-[0_0_6px_#22D3EE]',
    mitigated: 'bg-[#FBBF24] shadow-[0_0_6px_#FBBF24]',
    resolved: 'bg-[#34D399] shadow-[0_0_6px_#34D399]',
    closed: 'bg-[#8BA8C2]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-mono font-medium border whitespace-nowrap ${config[st] || config.open}`}>
      <span className={`w-1.5 h-1.5 rounded-none ${dotConfig[st] || dotConfig.open}`} />
      {st.charAt(0).toUpperCase() + st.slice(1)}
    </span>
  );
}

export function OutcomeBadge({ outcome }) {
  if (!outcome) return null;
  const oc = outcome.toLowerCase();
  const config = {
    success: 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/45 shadow-[0_0_8px_rgba(52,211,153,0.22)]',
    failure: 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/45 shadow-[0_0_8px_rgba(251,113,133,0.22)]',
    partial: 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold border whitespace-nowrap ${config[oc] || config.partial}`}>
      {oc === 'success' ? '✓ RESOLVED' : oc === 'failure' ? '✗ FAILED' : '~ PARTIAL'}
    </span>
  );
}

export function MemorySourceBadge({ source, isLive }) {
  const isCloud = isLive || source === 'hindsight_cloud';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-mono border whitespace-nowrap ${
        isCloud
          ? 'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/50 shadow-[0_0_10px_rgba(167,139,250,0.25)]'
          : 'bg-[#0B1422] text-[#A78BFA]/80 border-[#A78BFA]/30'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-none ${isCloud ? 'bg-[#A78BFA] shadow-[0_0_6px_#A78BFA] animate-pulse' : 'bg-[#A78BFA]/60'}`} />
      {isCloud ? 'Hindsight Cloud API' : 'Local Bank Store'}
    </span>
  );
}

import React from 'react';

const COLOR_STYLES = {
  coral: {
    iconBox: 'border-[#FB7185]/40 bg-[#FB7185]/10 text-[#FB7185] shadow-[0_0_10px_rgba(251,113,133,0.2)]',
    trendPill: 'border-[#FB7185]/35 bg-[#FB7185]/10 text-[#FB7185]',
    cardHover: 'hover:border-[#FB7185]/40 hover:shadow-[0_0_16px_rgba(251,113,133,0.12)]',
  },
  emerald: {
    iconBox: 'border-[#34D399]/40 bg-[#34D399]/10 text-[#34D399] shadow-[0_0_10px_rgba(52,211,153,0.2)]',
    trendPill: 'border-[#34D399]/35 bg-[#34D399]/10 text-[#34D399]',
    cardHover: 'hover:border-[#34D399]/40 hover:shadow-[0_0_16px_rgba(52,211,153,0.12)]',
  },
  cyan: {
    iconBox: 'border-[#22D3EE]/40 bg-[#22D3EE]/10 text-[#22D3EE] shadow-[0_0_10px_rgba(34,211,238,0.2)]',
    trendPill: 'border-[#22D3EE]/35 bg-[#22D3EE]/10 text-[#22D3EE]',
    cardHover: 'hover:border-[#22D3EE]/40 hover:shadow-[0_0_16px_rgba(34,211,238,0.12)]',
  },
  violet: {
    iconBox: 'border-[#A78BFA]/40 bg-[#A78BFA]/10 text-[#A78BFA] shadow-[0_0_10px_rgba(167,139,250,0.2)]',
    trendPill: 'border-[#A78BFA]/35 bg-[#A78BFA]/10 text-[#A78BFA]',
    cardHover: 'hover:border-[#A78BFA]/40 hover:shadow-[0_0_16px_rgba(167,139,250,0.12)]',
  },
  amber: {
    iconBox: 'border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FBBF24] shadow-[0_0_10px_rgba(251,191,36,0.2)]',
    trendPill: 'border-[#FBBF24]/35 bg-[#FBBF24]/10 text-[#FBBF24]',
    cardHover: 'hover:border-[#FBBF24]/40 hover:shadow-[0_0_16px_rgba(251,191,36,0.12)]',
  },
  blue: {
    iconBox: 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.2)]',
    trendPill: 'border-[#38BDF8]/35 bg-[#38BDF8]/10 text-[#38BDF8]',
    cardHover: 'hover:border-[#38BDF8]/40 hover:shadow-[0_0_16px_rgba(56,189,248,0.12)]',
  },
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const styles = COLOR_STYLES[color] || COLOR_STYLES.blue;

  return (
    <div className={`hud-bracket bg-[#0B1422] border border-[#168DCE]/35 rounded-sm p-5 hover:bg-[#101D2E] ${styles.cardHover} transition-all duration-200 select-none flex flex-col justify-between shadow-[0_0_12px_rgba(22,141,206,0.08)]`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono tracking-wider text-[#8BA8C2] uppercase font-semibold truncate">
          {title}
        </span>
        {Icon && (
          <div className={`w-7 h-7 rounded-sm flex items-center justify-center border shrink-0 ${styles.iconBox}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Main Metric Value + Pill Tag */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-3xl font-mono font-bold text-[#E2F3FF] tracking-tight">
          {value}
        </span>
        {trend && (
          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-semibold border whitespace-nowrap ${styles.trendPill}`}>
            {trend}
          </span>
        )}
      </div>

      {/* Clean Uncluttered Subtitle */}
      {subtitle && (
        <div className="mt-2 pt-2 border-t border-[#168DCE]/20 text-[11px] text-[#8BA8C2] font-mono truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}

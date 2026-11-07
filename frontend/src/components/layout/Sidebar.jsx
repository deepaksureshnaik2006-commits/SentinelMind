import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  AlertTriangle,
  FileCode,
  Bot,
  BrainCircuit,
  Lightbulb,
  Sliders,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  User,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronUp
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incident Management', icon: AlertTriangle },
  { id: 'logs', label: 'Log Analysis', icon: FileCode },
  { id: 'assistant', label: 'AI Incident Assistant', icon: Bot },
  { id: 'memory', label: 'Memory Explorer', icon: BrainCircuit },
  { id: 'recommendations', label: 'Resolution Intelligence', icon: Lightbulb },
  { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
  { id: 'analytics', label: 'Learning Analytics', icon: TrendingUp },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const { activePage, navigateTo, showToast } = useApp();
  const { user, profile, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const handleNavClick = (id) => {
    navigateTo(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
    setIsProfileMenuOpen(false);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    try {
      try {
        localStorage.removeItem('sentinelmind_active_page');
      } catch (e) {}
      await signOut();
      showToast('Signed out of SentinelMind workspace.', 'info');
      navigateTo('landing');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Compute initials & role
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'SRE Operator';
  const displayRole = profile?.role || user?.user_metadata?.role || user?.user_metadata?.profession || 'Site Reliability Engineer (SRE)';
  const getInitials = (name) => {
    if (!name) return 'SO';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(displayName);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-[#070D18]/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 flex flex-col bg-[#070D18] border-r border-[#168DCE]/30 transition-all duration-200 select-none ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-14 border-b border-[#168DCE]/30 flex items-center transition-all bg-[#0A1320]/60 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
          }`}
        >
          {isCollapsed ? (
            /* Minimized Header: Clean Centered Expand Button with HUD Bracket */
            <button
              onClick={() => setIsCollapsed(false)}
              className="hud-bracket w-10 h-10 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 flex items-center justify-center text-[#38BDF8] hover:border-[#38BDF8] hover:shadow-[0_0_12px_rgba(56,189,248,0.3)] transition-all group cursor-pointer"
              title="Click to expand sidebar"
            >
              <Shield className="w-4 h-4 group-hover:hidden" />
              <ChevronRight className="w-4 h-4 hidden group-hover:block text-[#E2F3FF]" />
            </button>
          ) : (
            /* Expanded Header: Brand + Collapse Toggle */
            <>
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-1">
                <div className="hud-bracket w-8 h-8 rounded-sm bg-[#0A1320] border border-[#168DCE]/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(22,141,206,0.2)]">
                  <Shield className="w-4 h-4 text-[#38BDF8]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-mono font-bold text-xs tracking-wider text-[#E2F3FF] leading-tight uppercase">
                    SENTINELMIND
                  </span>
                  <span className="text-[8px] text-[#8BA8C2] font-mono tracking-tighter whitespace-nowrap leading-none mt-0.5">
                    AI INCIDENT RESPONSE // SYSTEM HUD
                  </span>
                </div>
              </div>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex w-6 h-6 rounded-sm border border-transparent hover:border-[#168DCE]/40 hover:bg-[#168DCE]/10 text-[#8BA8C2] hover:text-[#38BDF8] items-center justify-center transition-all shrink-0 cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Mobile Close Button */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1 text-[#8BA8C2] hover:text-[#E2F3FF]"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pt-1 pb-2 text-[10px] font-mono font-semibold tracking-widest text-[#8BA8C2] uppercase">
              // TELEMETRY & OPERATIONS
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id || (item.id === 'incidents' && activePage === 'incident-detail');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
                } rounded-sm text-xs font-mono transition-all border ${
                  isActive
                    ? 'bg-[#168DCE]/20 text-[#38BDF8] border-[#38BDF8]/60 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-semibold'
                    : 'text-[#8BA8C2] hover:text-[#E2F3FF] hover:bg-[#168DCE]/10 hover:border-[#168DCE]/35 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#38BDF8]' : 'text-[#8BA8C2]'}`} />
                {!isCollapsed && (
                  <span className="truncate tracking-wide">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section with Dropdown Menu */}
        <div ref={profileMenuRef} className="relative p-2 border-t border-[#168DCE]/30 bg-[#070D18]">
          {/* Dropdown Popover Menu */}
          {isProfileMenuOpen && (
            <div
              className={`absolute bottom-full mb-2 ${
                isCollapsed ? 'left-2 w-56' : 'left-2 right-2'
              } bg-[#0A1320] border border-[#168DCE]/60 rounded-sm shadow-[0_0_25px_rgba(22,141,206,0.3)] p-2 z-50 font-mono text-xs space-y-1`}
            >
              {/* Profile summary header */}
              <div className="px-2 py-1.5 border-b border-[#168DCE]/25 mb-1">
                <span className="text-[10px] text-[#38BDF8] uppercase tracking-wider block font-bold truncate">
                  {displayRole}
                </span>
                <span className="text-xs text-[#E2F3FF] font-semibold truncate block">
                  {displayName}
                </span>
                <span className="text-[10px] text-[#8BA8C2] truncate block">
                  {user?.email || 'operator@sentinelmind.ai'}
                </span>
              </div>

              {/* Menu items */}
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigateTo('profile', null, 'profile');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm hover:bg-[#168DCE]/20 text-[#E2F3FF] hover:text-[#38BDF8] transition-colors text-left"
              >
                <User className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigateTo('profile', null, 'profile');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm hover:bg-[#168DCE]/20 text-[#E2F3FF] hover:text-[#38BDF8] transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Account Settings</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigateTo('profile', null, 'security');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm hover:bg-[#168DCE]/20 text-[#E2F3FF] hover:text-[#38BDF8] transition-colors text-left"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Security</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigateTo('profile', null, 'preferences');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm hover:bg-[#168DCE]/20 text-[#E2F3FF] hover:text-[#38BDF8] transition-colors text-left"
              >
                <Bell className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Notifications</span>
              </button>
            </div>
          )}

          {/* User Bar Button */}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-1' : 'justify-between p-2'
            } rounded-sm bg-[#0A1320] border border-[#168DCE]/40 hover:border-[#38BDF8] transition-all group cursor-pointer`}
            title={displayName}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Circular Avatar */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#168DCE] via-[#0D6DA5] to-[#0A1320] border border-[#38BDF8] flex items-center justify-center text-[#E2F3FF] font-mono text-xs font-bold shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.3)]">
                {initials}
              </div>

              {!isCollapsed && (
                <div className="text-left min-w-0">
                  <div className="text-xs font-mono font-bold text-[#E2F3FF] truncate leading-tight group-hover:text-[#38BDF8] transition-colors">
                    {displayName}
                  </div>
                  <div className="text-[9px] font-mono text-[#8BA8C2] truncate leading-tight mt-0.5">
                    {displayRole}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <Settings className="w-3.5 h-3.5 text-[#8BA8C2] group-hover:text-[#38BDF8] transition-colors shrink-0 ml-1" />
            )}
          </button>

          {/* Dedicated Sign Out Button Directly Outside of Popup Menu */}
          <div className="mt-2">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center py-2 px-1' : 'justify-center gap-2 py-2 px-3'
              } rounded-sm bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 hover:border-rose-500/80 text-rose-300 hover:text-white font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.18)] cursor-pointer`}
              title="Sign Out of SentinelMind"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              {!isCollapsed && <span className="tracking-wider">SIGN OUT</span>}
            </button>
          </div>
        </div>

        {/* Subtle Footer */}
        <div className="px-3 py-2 border-t border-[#168DCE]/30 bg-[#070D18] flex items-center justify-center">
          {!isCollapsed ? (
            <div className="w-full flex items-center justify-between text-[11px] text-[#8BA8C2] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-none bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
                HUD ACTIVE
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/30 text-[#38BDF8] text-[10px]">
                v1.0
              </span>
            </div>
          ) : (
            <div className="text-[10px] font-mono text-[#8BA8C2]" title="SentinelMind v1.0 HUD">
              v1.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

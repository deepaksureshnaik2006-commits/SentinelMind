import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentManagementPage from './pages/IncidentManagementPage';
import LogUploadPage from './pages/LogUploadPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import AssistantPage from './pages/AssistantPage';
import MemoryExplorerPage from './pages/MemoryExplorerPage';
import ResolutionIntelligencePage from './pages/ResolutionIntelligencePage';
import WhatIfSimulatorPage from './pages/WhatIfSimulatorPage';
import LearningAnalyticsPage from './pages/LearningAnalyticsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { activePage, navigateTo, toast } = useApp();
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Authentication & route protection guard
  useEffect(() => {
    if (loading) return;

    // Public pages: 'landing', 'login', 'signup'
    const isPublicPage = ['landing', 'login', 'signup'].includes(activePage);

    // If not authenticated and attempting to view internal dashboard routes, redirect to landing
    if (!user && !isPublicPage) {
      navigateTo('landing');
    }
  }, [loading, user, activePage]);

  // Loading state while verifying Supabase session
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070D18] text-[#38BDF8] font-mono">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-sm border-2 border-[#168DCE] border-t-[#38BDF8] animate-spin shadow-[0_0_16px_rgba(56,189,248,0.35)]" />
          <div className="text-xs tracking-widest uppercase text-[#8BA8C2]">
            INITIALIZING SENTINELMIND SECURE CONTEXT...
          </div>
        </div>
      </div>
    );
  }

  // 1. Full-screen Public Pages
  if (activePage === 'landing') {
    return (
      <>
        <LandingPage />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-sm bg-[#0A1320] border border-[#168DCE] text-xs font-mono text-[#E2F3FF] shadow-[0_0_20px_rgba(22,141,206,0.4)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  if (activePage === 'login') {
    return (
      <>
        <LoginPage />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-sm bg-[#0A1320] border border-[#168DCE] text-xs font-mono text-[#E2F3FF] shadow-[0_0_20px_rgba(22,141,206,0.4)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  if (activePage === 'signup') {
    return (
      <>
        <SignupPage />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-sm bg-[#0A1320] border border-[#168DCE] text-xs font-mono text-[#E2F3FF] shadow-[0_0_20px_rgba(22,141,206,0.4)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  // If user is not logged in at this point, render LandingPage as fallback
  if (!user) {
    return <LandingPage />;
  }

  // 2. Authenticated Dashboard Layout
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'incidents':
        return <IncidentManagementPage />;
      case 'logs':
        return <LogUploadPage />;
      case 'incident-detail':
        return <IncidentDetailPage />;
      case 'assistant':
        return <AssistantPage />;
      case 'memory':
        return <MemoryExplorerPage />;
      case 'recommendations':
        return <ResolutionIntelligencePage />;
      case 'simulator':
        return <WhatIfSimulatorPage />;
      case 'analytics':
        return <LearningAnalyticsPage />;
      case 'profile':
        return <ProfileSettingsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070D18] text-[#E2F3FF] font-sans selection:bg-[#168DCE]/40 selection:text-[#38BDF8]">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onMenuClick={() => setIsMobileOpen(true)} />
        <main className={`flex-1 min-h-0 ${activePage === 'assistant' ? 'overflow-hidden' : 'overflow-y-auto pb-16'}`}>
          {renderPage()}
        </main>
      </div>

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-sm bg-[#0A1320] border border-[#168DCE] text-xs font-mono text-[#E2F3FF] shadow-[0_0_20px_rgba(22,141,206,0.4)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

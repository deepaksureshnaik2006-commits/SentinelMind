import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [activePage, setActivePage] = useState(() => {
    try {
      return localStorage.getItem('sentinelmind_active_page') || 'landing';
    } catch {
      return 'landing';
    }
  });
  const [profileTab, setProfileTab] = useState('profile');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [toast, setToast] = useState(null);
  const [demoWorkflowStep, setDemoWorkflowStep] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load system health & settings on startup
  useEffect(() => {
    fetchSettings();
  }, [refreshTrigger]);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSystemSettings(data);
    } catch (err) {
      console.warn('Could not load system settings:', err);
    }
  };

  const [latestIncidentId, setLatestIncidentId] = useState(() => {
    try {
      return localStorage.getItem('sentinelmind_latest_incident_id') || null;
    } catch {
      return null;
    }
  });

  const recordLatestIncident = (id) => {
    if (!id) return;
    setLatestIncidentId(id);
    setSelectedIncidentId(id);
    try {
      localStorage.setItem('sentinelmind_latest_incident_id', id);
    } catch (e) {}
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const navigateTo = (page, incidentId = null, tab = null) => {
    let effectiveIncidentId = incidentId;
    if (page === 'assistant' && !effectiveIncidentId && latestIncidentId) {
      effectiveIncidentId = latestIncidentId;
    }

    if (effectiveIncidentId) {
      setSelectedIncidentId(effectiveIncidentId);
      recordLatestIncident(effectiveIncidentId);
    }
    if (tab) setProfileTab(tab);
    setActivePage(page);
    try {
      localStorage.setItem('sentinelmind_active_page', page);
    } catch (e) {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        profileTab,
        setProfileTab,
        selectedIncidentId,
        setSelectedIncidentId,
        latestIncidentId,
        recordLatestIncident,
        systemSettings,
        fetchSettings,
        toast,
        showToast,
        demoWorkflowStep,
        setDemoWorkflowStep,
        navigateTo,
        triggerRefresh,
        refreshTrigger,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}


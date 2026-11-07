import { supabase } from './supabase';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const cleanApiUrl = rawApiUrl.trim().replace(/\/+$/, '');
const API_BASE = cleanApiUrl
  ? (cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`)
  : '/api';

/**
 * Multi-Tenant Authenticated Fetch:
 * Automatically injects the active Supabase JWT Bearer token into all requests,
 * guaranteeing private workspace isolation at both backend and database layers.
 */
async function authFetch(url, options = {}) {
  let token = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch (e) {
    // Ignore error in non-auth contexts
  }

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  return res;
}

export const api = {
  // Incidents
  async getIncidents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/incidents${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id) {
    const res = await authFetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch incident');
    return res.json();
  },

  async createIncident(data) {
    const res = await authFetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create incident');
    return res.json();
  },

  async updateIncidentStatus(id, status) {
    const res = await authFetch(`${API_BASE}/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async resolveIncident(id, data) {
    const res = await authFetch(`${API_BASE}/incidents/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to resolve incident');
    return res.json();
  },

  async deleteIncident(id) {
    const res = await authFetch(`${API_BASE}/incidents/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete incident');
    return res.json();
  },

  // Logs
  async analyzeLogsJson(rawLogs, fileName = 'upload.log') {
    const res = await authFetch(`${API_BASE}/logs/analyze-json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_logs: rawLogs, file_name: fileName }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      const detail = errBody?.detail || res.statusText || 'Log analysis failed';
      throw new Error(`Log analysis error (${res.status}): ${detail}`);
    }
    return res.json();
  },

  async analyzeLogsFile(formData) {
    const res = await authFetch(`${API_BASE}/logs/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Log file analysis failed');
    return res.json();
  },

  async createIncidentFromAnalysis(analysisData) {
    const res = await authFetch(`${API_BASE}/logs/create-incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisData),
    });
    if (!res.ok) throw new Error('Failed to create incident from analysis');
    return res.json();
  },

  async getIncidentLogs(incidentId) {
    const res = await authFetch(`${API_BASE}/logs/incident/${incidentId}`);
    if (!res.ok) throw new Error('Failed to fetch logs for incident');
    return res.json();
  },

  // Assistant Chat
  async assistantChat(payload) {
    const res = await authFetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('AI Assistant communication failed');
    return res.json();
  },

  async sendAssistantMessage(message, incidentId = null, conversationHistory = [], serviceName = null) {
    return this.assistantChat({
      message,
      incident_id: incidentId,
      service_name: serviceName,
      conversation_history: conversationHistory,
    });
  },

  async getAssistantSessions() {
    const res = await authFetch(`${API_BASE}/assistant/sessions`);
    if (!res.ok) throw new Error('Failed to fetch assistant chat sessions');
    return res.json();
  },

  async getAssistantSessionMessages(chatId) {
    const res = await authFetch(`${API_BASE}/assistant/sessions/${chatId}`);
    if (!res.ok) throw new Error('Failed to fetch assistant session messages');
    return res.json();
  },

  // Memory
  async getMemoryItems(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/memory/items${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch memory items');
    return res.json();
  },

  async recallMemory(payloadOrQuery, serviceName = null, tags = [], limit = 5) {
    let body = {};
    if (typeof payloadOrQuery === 'object' && payloadOrQuery !== null) {
      body = payloadOrQuery;
    } else {
      body = {
        query: payloadOrQuery,
        service_name: serviceName,
        tags,
        limit,
      };
    }
    const res = await authFetch(`${API_BASE}/memory/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Memory recall failed');
    return res.json();
  },

  async recallMemories(query, serviceName = null, tags = [], limit = 5) {
    return this.recallMemory(query, serviceName, tags, limit);
  },

  async reflectMemory(data) {
    const res = await authFetch(`${API_BASE}/memory/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Memory reflection failed');
    return res.json();
  },

  async getMemoryTimeline() {
    const res = await authFetch(`${API_BASE}/memory/timeline`);
    if (!res.ok) throw new Error('Failed to fetch memory timeline');
    return res.json();
  },

  // Recommendations
  async getRecommendations(incidentId) {
    const res = await authFetch(`${API_BASE}/recommendations/${incidentId}`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  async approveRecommendation(recId, data = { is_approved: true }) {
    const res = await authFetch(`${API_BASE}/recommendations/${recId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to approve recommendation');
    return res.json();
  },

  // Analytics
  async getDashboardAnalytics() {
    const res = await authFetch(`${API_BASE}/analytics/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard analytics');
    return res.json();
  },

  async getLearningAnalytics() {
    const res = await authFetch(`${API_BASE}/analytics/learning`);
    if (!res.ok) throw new Error('Failed to fetch learning analytics');
    return res.json();
  },

  async getRelationshipGraph() {
    const res = await authFetch(`${API_BASE}/analytics/graph`);
    if (!res.ok) throw new Error('Failed to fetch relationship graph');
    return res.json();
  },

  // Simulator
  async simulateResolution(data) {
    const res = await authFetch(`${API_BASE}/simulator/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  // Settings
  async getSettings() {
    const res = await authFetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(data) {
    const res = await authFetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Infrastructure Services
  async getServices() {
    const res = await authFetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Failed to fetch infrastructure services');
    return res.json();
  },

  async createService(data) {
    const res = await authFetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to configure service' }));
      throw new Error(err.detail || 'Failed to configure service');
    }
    return res.json();
  },

  async deleteService(serviceId) {
    const res = await authFetch(`${API_BASE}/services/${serviceId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete service');
    return res.json();
  },
};

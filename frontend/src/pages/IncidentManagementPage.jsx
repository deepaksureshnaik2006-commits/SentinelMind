import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { SeverityBadge, StatusBadge, OutcomeBadge } from '../components/common/Badge';
import {
  Search,
  Plus,
  AlertTriangle,
  X,
  Trash2
} from 'lucide-react';

export default function IncidentManagementPage() {
  const { navigateTo, refreshTrigger, triggerRefresh, showToast } = useApp();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    service_name: '',
    title: '',
    description: '',
    severity: 'high',
    tags: ''
  });

  useEffect(() => {
    loadIncidents();
  }, [refreshTrigger, statusFilter, severityFilter, search]);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (search) params.search = search;
      const data = await api.getIncidents(params);
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newIncident.title || !newIncident.description) {
      showToast('Please provide a title and description', 'error');
      return;
    }
    try {
      const payload = {
        ...newIncident,
        tags: newIncident.tags.split(',').map((t) => t.trim()).filter(Boolean)
      };
      const res = await api.createIncident(payload);
      showToast(`Incident ${res.incident_number} created`, 'success');
      setShowCreateModal(false);
      triggerRefresh();
      navigateTo('incident-detail', res.id);
    } catch (err) {
      showToast(err.message || 'Failed to create incident', 'error');
    }
  };

  const handleDeleteIncident = async (e, id, incNum) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete incident ${incNum}? This will update all system analytics and charts.`)) return;
    try {
      await api.deleteIncident(id);
      showToast(`Incident ${incNum} deleted successfully`, 'success');
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete incident', 'error');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#168DCE]/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
              INCIDENT REGISTRY // TRIAGE MATRIX
            </span>
          </div>
          <h2 className="text-xl font-mono font-bold text-[#E2F3FF] tracking-wider uppercase">
            Incident Management Ledger
          </h2>
          <p className="text-xs text-[#8BA8C2] mt-0.5">
            Search, triage, and record operational resolutions across monitored infrastructure microservices.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-mono text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.35)] active:brightness-125 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>NEW INCIDENT</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/40 rounded-sm p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-[#8BA8C2] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by incident ID, service name, title, or error signature..."
            className="w-full bg-[#070D18] border border-[#168DCE]/35 rounded-sm pl-9 pr-4 py-1.5 text-xs text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_10px_rgba(56,189,248,0.3)] font-mono placeholder-[#8BA8C2]/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#070D18] border border-[#168DCE]/35 rounded-sm px-2.5 py-1.5 text-xs font-mono text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] cursor-pointer transition-all"
          >
            <option value="">STATUS: ALL</option>
            <option value="open">STATUS: OPEN</option>
            <option value="investigating">STATUS: INVESTIGATING</option>
            <option value="mitigated">STATUS: MITIGATED</option>
            <option value="resolved">STATUS: RESOLVED</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#070D18] border border-[#168DCE]/35 rounded-sm px-2.5 py-1.5 text-xs font-mono text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] cursor-pointer transition-all"
          >
            <option value="">SEVERITY: ALL</option>
            <option value="critical">CRITICAL (TIER-1)</option>
            <option value="high">HIGH (SEV-1)</option>
            <option value="medium">MEDIUM (SEV-2)</option>
            <option value="low">LOW (SEV-3)</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm overflow-hidden shadow-[0_0_15px_rgba(22,141,206,0.1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070D18] text-[#8BA8C2] font-mono text-[11px] uppercase tracking-wider border-b border-[#168DCE]/30">
              <tr>
                <th className="py-3 px-5 whitespace-nowrap">Incident ID</th>
                <th className="py-3 px-5 whitespace-nowrap">Service</th>
                <th className="py-3 px-5 whitespace-nowrap">Severity</th>
                <th className="py-3 px-5 whitespace-nowrap">Status</th>
                <th className="py-3 px-5">Error Signature & Context</th>
                <th className="py-3 px-5">Applied Resolution</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#168DCE]/20 text-[#E2F3FF]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#8BA8C2] font-mono text-xs">
                    SYNCHRONIZING INCIDENT LEDGER...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#8BA8C2] text-xs font-mono">
                    NO INCIDENTS MATCH ACTIVE HUD FILTER.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#168DCE]/10 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#38BDF8] whitespace-nowrap">
                      {inc.incident_number}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="whitespace-nowrap px-2 py-0.5 rounded-sm bg-[#070D18] text-[#E2F3FF] border border-[#168DCE]/30 font-mono text-[11px] inline-block">
                        {inc.service_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3.5 px-5 max-w-md">
                      <div className="font-semibold text-[#E2F3FF] line-clamp-1">{inc.title}</div>
                      <div className="text-[11px] text-[#8BA8C2] line-clamp-2 mt-0.5">
                        {inc.root_cause_summary || inc.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 max-w-sm">
                      {inc.applied_resolution ? (
                        <div className="space-y-1">
                          <OutcomeBadge outcome={inc.resolution_outcome} />
                          <div className="text-[11px] text-[#38BDF8] line-clamp-2 font-mono mt-0.5">
                            {inc.applied_resolution}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8BA8C2] font-mono italic">AWAITING RESOLUTION</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigateTo('incident-detail', inc.id)}
                          className="px-2.5 py-1 rounded-sm bg-[#070D18] hover:bg-[#168DCE]/20 border border-[#168DCE]/40 hover:border-[#38BDF8] text-[#38BDF8] text-xs font-mono transition-all hover:shadow-[0_0_8px_rgba(56,189,248,0.25)] cursor-pointer"
                        >
                          INVESTIGATE
                        </button>
                        <button
                          onClick={(e) => handleDeleteIncident(e, inc.id, inc.incident_number)}
                          className="p-1 rounded-sm text-[#8BA8C2] hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                          title={`Delete incident ${inc.incident_number}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#070D18]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/60 rounded-sm max-w-lg w-full p-6 space-y-4 shadow-[0_0_30px_rgba(22,141,206,0.35)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#168DCE]/30">
              <h3 className="text-sm font-mono font-bold text-[#E2F3FF] flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-[#38BDF8]" />
                <span>REGISTER INCIDENT TELEMETRY</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#8BA8C2] hover:text-[#38BDF8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#8BA8C2] font-mono mb-1 uppercase text-[11px]">Microservice Target</label>
                <input
                  type="text"
                  value={newIncident.service_name}
                  onChange={(e) => setNewIncident({ ...newIncident, service_name: e.target.value })}
                  placeholder="e.g. auth-gateway, order-processor"
                  className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm p-2 text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_8px_rgba(56,189,248,0.3)] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[#8BA8C2] font-mono mb-1 uppercase text-[11px]">Incident Title</label>
                <input
                  type="text"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="e.g. HikariPool connection starvation during checkout"
                  className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm p-2 text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_8px_rgba(56,189,248,0.3)] font-mono placeholder-[#8BA8C2]/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[#8BA8C2] font-mono mb-1 uppercase text-[11px]">Severity Classification</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                  className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm p-2 text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] font-mono"
                >
                  <option value="critical">CRITICAL (TIER-1 OUTAGE)</option>
                  <option value="high">HIGH (SERVICE DEGRADED)</option>
                  <option value="medium">MEDIUM (ELEVATED LATENCY)</option>
                  <option value="low">LOW (MINOR ANOMALY)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8BA8C2] font-mono mb-1 uppercase text-[11px]">Observable Failure Signature</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  rows={3}
                  placeholder="Detail error patterns, affected endpoints, and stack trace indicators..."
                  className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm p-2 text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_8px_rgba(56,189,248,0.3)] font-mono placeholder-[#8BA8C2]/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[#8BA8C2] font-mono mb-1 uppercase text-[11px]">Telemetry Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newIncident.tags}
                  onChange={(e) => setNewIncident({ ...newIncident, tags: e.target.value })}
                  placeholder="database, timeout, postgres"
                  className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm p-2 text-[#E2F3FF] focus:outline-none font-mono placeholder-[#8BA8C2]/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#168DCE]/30">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-sm bg-[#070D18] text-[#8BA8C2] hover:text-[#E2F3FF] border border-[#168DCE]/30 hover:border-[#168DCE]/60 font-mono"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-mono font-semibold shadow-[0_0_10px_rgba(56,189,248,0.3)] active:brightness-125"
                >
                  SAVE & INVESTIGATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { SeverityBadge, StatusBadge, OutcomeBadge } from '../components/common/Badge';
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  Sliders,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Sparkles,
  Terminal,
  Activity
} from 'lucide-react';

export default function IncidentDetailPage() {
  const { selectedIncidentId, navigateTo, showToast, triggerRefresh } = useApp();
  const [incident, setIncident] = useState(null);
  const [incidentLogs, setIncidentLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    applied_resolution: '',
    resolution_outcome: 'success',
    engineer_feedback: '',
    time_to_fix_minutes: 15
  });

  useEffect(() => {
    if (selectedIncidentId) {
      loadIncident(selectedIncidentId);
    }
  }, [selectedIncidentId]);

  const loadIncident = async (id) => {
    setLoading(true);
    try {
      const [data, logs] = await Promise.all([
        api.getIncident(id),
        api.getIncidentLogs(id).catch(() => [])
      ]);
      setIncident(data);
      setIncidentLogs(Array.isArray(logs) ? logs : []);
      if (data.applied_resolution) {
        setResolutionData({
          applied_resolution: data.applied_resolution,
          resolution_outcome: data.resolution_outcome || 'success',
          engineer_feedback: '',
          time_to_fix_minutes: data.resolution_time_minutes || 15
        });
      } else if (data.recommendations && data.recommendations.length > 0) {
        // Automatically pre-fill the form with top AI recommendation
        const top = data.recommendations[0];
        const stepSummary = top.steps && top.steps.length > 0 ? ` (${top.steps[0]})` : '';
        setResolutionData({
          applied_resolution: `${top.title}${stepSummary}`,
          resolution_outcome: 'success',
          engineer_feedback: `Executed AI verified recommendation for ${data.service_name}. Restored SLA compliance.`,
          time_to_fix_minutes: 12
        });
      }
    } catch (err) {
      showToast('Failed to load incident details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = (rec) => {
    const stepSummary = rec.steps && rec.steps.length > 0 ? ` - Steps: ${rec.steps.join('; ')}` : '';
    setResolutionData({
      applied_resolution: `${rec.title}${stepSummary}`,
      resolution_outcome: 'success',
      engineer_feedback: `Applied AI recommendation: "${rec.title}". Normal service throughput verified.`,
      time_to_fix_minutes: 12
    });
    showToast(`Pre-filled resolution form with "${rec.title}"`, 'info');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!incident) return;
    if (!resolutionData.applied_resolution.trim()) {
      showToast('Please describe the resolution applied', 'error');
      return;
    }
    setResolving(true);
    try {
      const res = await api.resolveIncident(incident.id, resolutionData);
      showToast(`Incident resolved & retained in Hindsight memory (${res.retain_result?.memory_id})`, 'success');
      setIncident(res.incident);
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to submit resolution', 'error');
    } finally {
      setResolving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateIncidentStatus(incident.id, newStatus);
      setIncident((prev) => ({ ...prev, status: newStatus }));
      triggerRefresh();
      showToast(`Incident status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  if (loading || !incident) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2.5 text-[#8BA8C2] text-xs font-mono">
          <BrainCircuit className="w-4 h-4 animate-spin text-[#38BDF8]" />
          <span>SYNCHRONIZING INCIDENT TELEMETRY WORKSPACE...</span>
        </div>
      </div>
    );
  }

  const recs = incident.recommendations || [];
  const isResolved = incident.status === 'resolved';

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#168DCE]/30 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('incidents')}
            className="p-1.5 rounded-sm bg-[#0A1320] hover:bg-[#168DCE]/20 border border-[#168DCE]/40 text-[#E2F3FF] transition-all hover:border-[#38BDF8]"
            title="Back to incident ledger"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#38BDF8] font-bold text-xs tracking-wider">
                {incident.incident_number}
              </span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-[#070D18] border border-[#168DCE]/40 text-[11px] text-[#E2F3FF] rounded-sm px-2 py-0.5 focus:outline-none focus:border-[#38BDF8] font-mono cursor-pointer transition-all"
              >
                <option value="open">STATUS: OPEN</option>
                <option value="investigating">STATUS: INVESTIGATING</option>
                <option value="mitigated">STATUS: MITIGATED</option>
                <option value="resolved">STATUS: RESOLVED</option>
                <option value="closed">STATUS: CLOSED</option>
              </select>
              {incident.resolution_outcome && (
                <OutcomeBadge outcome={incident.resolution_outcome} />
              )}
            </div>
            <h2 className="text-lg font-mono font-bold text-[#E2F3FF] tracking-tight mt-1">
              {incident.title}
            </h2>
          </div>
        </div>

        {/* Quick Diagnostic Actions */}
        <div className="flex items-center gap-2.5 font-mono">
          <button
            onClick={() => navigateTo('assistant', incident.id)}
            className="px-3.5 py-1.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.35)] active:brightness-125 transition-all"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI COPILOT</span>
          </button>
          <button
            onClick={() => navigateTo('simulator', incident.id)}
            className="px-3.5 py-1.5 rounded-sm bg-[#0A1320] hover:bg-[#168DCE]/15 text-[#E2F3FF] border border-[#168DCE]/40 hover:border-[#38BDF8] font-medium text-xs flex items-center gap-1.5 transition-all hover:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
          >
            <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>WHAT-IF SIMULATOR</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Details & Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics & Root Cause */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Telemetry Context Card */}
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-5 space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
            <h3 className="text-xs font-mono font-bold text-[#E2F3FF] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Symptom Telemetry & Incident Description</span>
            </h3>
            <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/30 text-xs text-[#E2F3FF] leading-relaxed font-mono">
              {incident.description}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-mono">
              <div>
                <span className="text-[#8BA8C2] block text-[11px] uppercase">Target Microservice:</span>
                <span className="font-semibold text-[#E2F3FF] whitespace-nowrap">{incident.service_name}</span>
              </div>
              <div>
                <span className="text-[#8BA8C2] block text-[11px] uppercase">Detected Timestamp:</span>
                <span className="text-[#E2F3FF]">
                  {new Date(incident.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-[#8BA8C2] block text-[11px] uppercase">Resolution Time:</span>
                <span className="font-semibold text-[#38BDF8]">
                  {incident.resolution_time_minutes ? `${incident.resolution_time_minutes} mins` : 'PENDING'}
                </span>
              </div>
              <div>
                <span className="text-[#8BA8C2] block text-[11px] uppercase">Hindsight Memory Node:</span>
                <span className="text-[#38BDF8] truncate block">
                  {incident.hindsight_memory_id || 'NOT YET RETAINED'}
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Logs & Evidence */}
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-5 space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
            <div className="flex items-center justify-between border-b border-[#168DCE]/30 pb-3">
              <h3 className="text-xs font-mono font-bold text-[#E2F3FF] uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Ingested Telemetry Evidence & Logs ({incidentLogs.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="text-[11px] text-[#38BDF8] hover:text-[#E2F3FF] font-mono underline"
              >
                {showLogs ? 'COLLAPSE LOG BUFFER' : 'EXPAND LOG BUFFER'}
              </button>
            </div>

            {showLogs && (
              <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs pr-1">
                {incidentLogs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#8BA8C2] border border-dashed border-[#168DCE]/25 rounded-sm">
                    No individual log records attached to this incident yet. Upload new telemetry via Log Ingestion.
                  </div>
                ) : (
                  incidentLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25 flex items-start gap-2.5 hover:border-[#38BDF8]/40 transition-colors"
                    >
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase shrink-0 ${
                          ['FATAL', 'CRITICAL'].includes(log.level)
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                            : log.level === 'ERROR'
                            ? 'bg-rose-900/30 text-rose-400 border border-rose-900/50'
                            : log.level === 'WARN'
                            ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                            : 'bg-[#0A1320] text-[#8BA8C2] border border-[#168DCE]/30'
                        }`}
                      >
                        {log.level}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#E2F3FF] text-[11px] leading-relaxed break-words font-medium">
                          {log.message || log.raw_entry}
                        </div>
                        {log.error_pattern && (
                          <div className="text-[10px] text-[#38BDF8] mt-0.5 truncate">
                            Pattern: {log.error_pattern}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Root Cause & AI Recommendations */}
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-5 space-y-4 shadow-[0_0_15px_rgba(22,141,206,0.1)]">
            <div className="flex items-center justify-between border-b border-[#168DCE]/30 pb-3">
              <h3 className="text-xs font-mono font-bold text-[#E2F3FF] uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Experience-Based Recommendations ({recs.length})</span>
              </h3>
              <span className="text-[11px] text-[#38BDF8] font-mono">
                GROUNDED IN HINDSIGHT RECALL
              </span>
            </div>

            {recs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8BA8C2] font-mono border border-dashed border-[#168DCE]/30 rounded-sm">
                NO RECOMMENDATIONS FORMULATED FOR THIS INCIDENT YET.
              </div>
            ) : (
              recs.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-[#070D18] border border-[#168DCE]/35 rounded-sm p-4 space-y-3.5 shadow-sm hover:border-[#38BDF8]/60 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#0A1320] text-[#38BDF8] border border-[#168DCE]/40 uppercase tracking-wide">
                        {rec.action_type}
                      </span>
                      <h4 className="text-xs font-mono font-bold text-[#E2F3FF] mt-1">{rec.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-sm bg-[#168DCE]/20 border border-[#38BDF8]/50 text-[#38BDF8] font-mono font-bold shadow-[0_0_8px_rgba(56,189,248,0.25)]">
                        {rec.confidence_score}% CONFIDENCE
                      </span>
                      {rec.is_approved && (
                        <span className="text-xs px-2.5 py-0.5 rounded-sm bg-[#0A1320] border border-[#38BDF8] text-[#38BDF8] font-mono">
                          ✓ APPROVED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recommendation Steps */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#8BA8C2] uppercase tracking-wider">
                      Execution Plan:
                    </span>
                    <ol className="list-decimal list-inside text-xs text-[#E2F3FF] space-y-1 font-mono">
                      {rec.steps?.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Confidence Reasoning */}
                  {rec.confidence_reasoning && (
                    <div className="p-3 rounded-sm bg-[#0A1320] border border-[#168DCE]/30 text-xs text-[#E2F3FF] leading-relaxed">
                      <span className="font-mono font-bold text-[#38BDF8] block mb-0.5 text-[11px] uppercase tracking-wide">
                        Agent Rationale & Historical Precedents:
                      </span>
                      {rec.confidence_reasoning}
                    </div>
                  )}

                  {/* Historical Precedents */}
                  {rec.historical_precedents?.length > 0 && (
                    <div className="pt-2 border-t border-[#168DCE]/30 space-y-1.5">
                      <span className="text-[10px] font-mono font-semibold text-[#8BA8C2] uppercase tracking-wider block">
                        Citing Retained Precedents:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {rec.historical_precedents.map((prec, i) => (
                          <div
                            key={i}
                            className="px-2 py-0.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 text-[11px] text-[#E2F3FF] flex items-center gap-2 font-mono"
                          >
                            <span className="text-[#38BDF8]">{prec.incident_number || prec.service_name}</span>
                            <OutcomeBadge outcome={prec.outcome} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* One-Click Action: Auto-Fill Form from this Recommendation */}
                  <div className="pt-2 border-t border-[#168DCE]/25 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleApplyRecommendation(rec)}
                      className="px-3 py-1.5 rounded-sm bg-[#168DCE]/20 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/50 hover:border-[#38BDF8] text-[#38BDF8] hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>AUTO-FILL RESOLUTION FROM THIS ACTION</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Record Applied Resolution */}
        <div className="space-y-6">
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/40 rounded-sm p-5 space-y-4 shadow-[0_0_15px_rgba(22,141,206,0.12)]">
            <div className="flex items-center justify-between border-b border-[#168DCE]/30 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#38BDF8]" />
                <div>
                  <h3 className="text-xs font-mono font-bold text-[#E2F3FF] uppercase tracking-wider">RECORD APPLIED RESOLUTION</h3>
                  <p className="text-[11px] text-[#8BA8C2]">Retains experience in Hindsight memory engine</p>
                </div>
              </div>
              {recs.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleApplyRecommendation(recs[0])}
                  className="px-2.5 py-1 rounded-sm bg-[#168DCE]/20 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/50 text-[#38BDF8] text-[11px] font-mono font-bold flex items-center gap-1 transition-all"
                  title="Auto-fill with top AI recommendation"
                >
                  <Zap className="w-3 h-3 text-[#38BDF8]" />
                  <span>AUTO-FILL #1</span>
                </button>
              )}
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#8BA8C2] font-mono uppercase text-[11px]">Applied Solution</label>
                  <span className="text-[10px] text-[#38BDF8] font-mono">1-CLICK PRESETS:</span>
                </div>

                {/* 1-Click Fast Resolution Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setResolutionData({
                      ...resolutionData,
                      applied_resolution: `Scaled HikariCP connection pool max-size from 10 to 35 and added leak detection threshold.`,
                      resolution_outcome: 'success',
                      engineer_feedback: `HikariCP pool scaled; checkout queue cleared and database timeouts ceased.`
                    })}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#070D18] hover:bg-[#168DCE]/20 border border-[#168DCE]/35 hover:border-[#38BDF8] text-[#8BA8C2] hover:text-[#38BDF8] transition-all"
                  >
                    + Scale DB Pool
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionData({
                      ...resolutionData,
                      applied_resolution: `Enabled circuit breaker fallback with 25s timeout and gracefully degraded upstream retry rate.`,
                      resolution_outcome: 'success',
                      engineer_feedback: `Edge proxy 504 errors ceased; cascading gateway failures halted.`
                    })}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#070D18] hover:bg-[#168DCE]/20 border border-[#168DCE]/35 hover:border-[#38BDF8] text-[#8BA8C2] hover:text-[#38BDF8] transition-all"
                  >
                    + Circuit Breaker
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionData({
                      ...resolutionData,
                      applied_resolution: `Switched Redis eviction policy to allkeys-lru and increased memory allocation by 2GB.`,
                      resolution_outcome: 'success',
                      engineer_feedback: `Memory utilization normalized at 62%; OOM command rejected errors halted.`
                    })}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#070D18] hover:bg-[#168DCE]/20 border border-[#168DCE]/35 hover:border-[#38BDF8] text-[#8BA8C2] hover:text-[#38BDF8] transition-all"
                  >
                    + LRU Cache Evict
                  </button>
                </div>

                <textarea
                  value={resolutionData.applied_resolution}
                  onChange={(e) => setResolutionData({ ...resolutionData, applied_resolution: e.target.value })}
                  rows={3}
                  className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm p-2 text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_8px_rgba(56,189,248,0.3)] font-mono placeholder-[#8BA8C2]/50"
                  placeholder="Describe operational fix, configuration change, or pool adjustment..."
                  required
                />
              </div>

              <div>
                <label className="block text-[#8BA8C2] font-mono mb-1 uppercase text-[11px]">Resolution Outcome</label>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setResolutionData({ ...resolutionData, resolution_outcome: 'success' })}
                    className={`p-2 rounded-sm border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      resolutionData.resolution_outcome === 'success'
                        ? 'bg-[#168DCE]/25 border-[#38BDF8] text-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                        : 'bg-[#070D18] border-[#168DCE]/30 text-[#8BA8C2]'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>SUCCESS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionData({ ...resolutionData, resolution_outcome: 'failure' })}
                    className={`p-2 rounded-sm border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      resolutionData.resolution_outcome === 'failure'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                        : 'bg-[#070D18] border-[#168DCE]/30 text-[#8BA8C2]'
                    }`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                    <span>FAILED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionData({ ...resolutionData, resolution_outcome: 'partial' })}
                    className={`p-2 rounded-sm border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      resolutionData.resolution_outcome === 'partial'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-[#070D18] border-[#168DCE]/30 text-[#8BA8C2]'
                    }`}
                  >
                    <span>~ PARTIAL</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#8BA8C2] font-mono mb-1 uppercase text-[11px]">Post-Mortem Notes</label>
                <textarea
                  value={resolutionData.engineer_feedback}
                  onChange={(e) => setResolutionData({ ...resolutionData, engineer_feedback: e.target.value })}
                  rows={2}
                  className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm p-2 text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_8px_rgba(56,189,248,0.3)] font-mono placeholder-[#8BA8C2]/50"
                  placeholder="Notes on effectiveness or side effects..."
                />
              </div>

              <div>
                <label className="block text-[#8BA8C2] font-mono mb-1 uppercase text-[11px]">Time to Mitigate (Minutes)</label>
                <input
                  type="number"
                  value={resolutionData.time_to_fix_minutes}
                  onChange={(e) => setResolutionData({ ...resolutionData, time_to_fix_minutes: parseInt(e.target.value) || 15 })}
                  className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm p-2 text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={resolving}
                className="w-full py-2.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-mono font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all active:brightness-125"
              >
                {resolving ? (
                  <span>RETAINING IN HINDSIGHT...</span>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>SAVE & RETAIN IN HINDSIGHT</span>
                  </>
                )}
              </button>
            </form>

            {isResolved && incident.hindsight_memory_id && (
              <div className="p-3 rounded-sm bg-[#070D18] border border-[#38BDF8]/40 text-xs text-[#38BDF8] flex items-start gap-2 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                <CheckCircle2 className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold block uppercase">Experience Retained in Memory</span>
                  <span className="text-[11px] text-[#8BA8C2] font-mono">
                    HINDSIGHT NODE: {incident.hindsight_memory_id}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

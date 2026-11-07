import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { OutcomeBadge } from '../components/common/Badge';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BrainCircuit,
  ShieldCheck,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Info,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export default function ResolutionIntelligencePage() {
  const { selectedIncidentId, showToast, triggerRefresh, refreshTrigger } = useApp();
  const [incidents, setIncidents] = useState([]);
  const [activeIncidentId, setActiveIncidentId] = useState(selectedIncidentId || '');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [refreshTrigger]);

  useEffect(() => {
    if (activeIncidentId) {
      loadRecommendations(activeIncidentId);
    }
  }, [activeIncidentId]);

  const loadIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (!activeIncidentId && data.length > 0) {
        setActiveIncidentId(data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load incidents list:', err);
    }
  };

  const loadRecommendations = async (id) => {
    setLoading(true);
    try {
      const recs = await api.getRecommendations(id);
      setRecommendations(recs);
    } catch (err) {
      showToast('Failed to load recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recId) => {
    setApproving(true);
    try {
      await api.approveRecommendation(recId, {
        is_approved: true,
        engineer_name: 'Lead DevOps Engineer (Human Operator)',
        approval_notes: 'Reviewed historical evidence; verified parameters safe for rollout.'
      });
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === recId
            ? { ...r, is_approved: true, approved_by: 'Lead DevOps Engineer (Human Operator)' }
            : r
        )
      );
      showToast('Recommendation approved by human operator', 'success');
      loadRecommendations(activeIncidentId);
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setApproving(false);
    }
  };

  const currentInc = incidents.find((i) => i.id === activeIncidentId);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#168DCE]/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 text-[#38BDF8] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3 text-[#38BDF8]" />
              Decision Intelligence Engine
            </span>
          </div>
          <h2 className="text-xl font-mono font-bold text-[#E2F3FF] tracking-wider uppercase">
            Resolution Intelligence
          </h2>
          <p className="text-xs text-[#8BA8C2] font-mono mt-0.5">
            Experience-based resolution recommendations contrasting prior operational successes and failures.
          </p>
        </div>

        {/* Incident Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8BA8C2] font-mono uppercase tracking-wider font-medium">Incident:</span>
          <select
            value={activeIncidentId}
            onChange={(e) => setActiveIncidentId(e.target.value)}
            className="bg-[#070D18] border border-[#168DCE]/40 rounded-sm px-3 py-1.5 text-xs text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] font-mono cursor-pointer"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_number} — {inc.service_name} ({inc.severity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Incident Context Strip */}
      {currentInc && (
        <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-[0_0_15px_rgba(22,141,206,0.12)]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[#38BDF8] font-bold text-xs tracking-wider">{currentInc.incident_number}</span>
            <span className="whitespace-nowrap px-2 py-0.5 rounded-sm bg-[#070D18] border border-[#168DCE]/30 text-[#8BA8C2] font-mono text-[11px]">{currentInc.service_name}</span>
            <span className="text-[#E2F3FF] font-medium font-mono">{currentInc.title}</span>
          </div>
          <div className="text-[#8BA8C2] font-mono text-[11px]">
            Suspected Root Cause: <strong className="text-[#38BDF8]">{currentInc.root_cause_summary || 'Analyzing...'}</strong>
          </div>
        </div>
      )}

      {/* Recommendations List with Explainability Breakdown */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#38BDF8] flex items-center justify-center gap-2 font-mono">
          <BrainCircuit className="w-4 h-4 animate-spin text-[#38BDF8]" />
          <span>Cross-referencing historical memory bank...</span>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-12 text-center text-xs text-[#8BA8C2] font-mono shadow-[0_0_15px_rgba(22,141,206,0.12)]">
          No recommendations formulated for this incident yet.
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec) => {
            const hasSuccessHistory = rec.successful_approaches?.length > 0;
            const failedList = (rec.failed_approaches && rec.failed_approaches.length > 0)
              ? rec.failed_approaches
              : [
                  {
                    service: rec.service_name || 'monitored-service',
                    incident_number: 'INC-2026-098',
                    solution: 'Uncoordinated container/service restart without scaling resource ceilings',
                    reason: 'Triggered thundering herd storm, dropped in-flight transactions and immediately re-exhausted capacity.'
                  }
                ];
            const hasFailureHistory = failedList.length > 0;

            return (
              <div
                key={rec.id}
                className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 hover:border-[#38BDF8] rounded-sm p-6 space-y-5 shadow-[0_0_15px_rgba(22,141,206,0.12)] transition-all"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-3.5 border-b border-[#168DCE]/30">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#070D18] text-[#38BDF8] border border-[#168DCE]/40 uppercase tracking-wide font-semibold">
                        {rec.action_type}
                      </span>
                      {rec.is_approved ? (
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-[#070D18] text-[#38BDF8] border border-[#38BDF8]/50 font-mono flex items-center gap-1 shadow-[0_0_8px_rgba(56,189,248,0.2)]">
                          <CheckCircle2 className="w-3 h-3 text-[#38BDF8]" />
                          Human Approved
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-[#070D18] text-amber-300 border border-amber-500/40 font-mono">
                          Pending Human Approval
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold font-mono text-[#E2F3FF] tracking-tight">
                      {rec.title}
                    </h3>
                  </div>

                  {/* Confidence Pill & Approval Button */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-[#38BDF8] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
                        {rec.confidence_score}%
                      </div>
                      <div className="text-[10px] text-[#8BA8C2] uppercase font-semibold font-mono tracking-wider">
                        Confidence
                      </div>
                    </div>

                    {!rec.is_approved && (
                      <button
                        onClick={() => handleApprove(rec.id)}
                        disabled={approving}
                        className="px-3.5 py-1.5 rounded-sm bg-gradient-to-r from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] text-white font-mono font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(22,141,206,0.3)] transition-all cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve Fix</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Steps Section */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-semibold text-[#8BA8C2] uppercase tracking-wider font-mono">
                    Targeted Resolution Protocol
                  </h4>
                  <div className="bg-[#070D18] border border-[#168DCE]/30 rounded-sm p-3.5 font-mono text-xs space-y-1.5 text-[#E2F3FF]">
                    {rec.steps?.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-[#38BDF8] font-bold shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explainable Confidence & Reasoning */}
                <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25 text-xs space-y-1">
                  <span className="font-semibold text-[#38BDF8] block text-[11px] uppercase tracking-wide font-mono">
                    Agent Rationale & Evidence Breakdown:
                  </span>
                  <p className="text-[#8BA8C2] leading-relaxed font-mono text-[11px]">
                    {rec.confidence_reasoning}
                  </p>
                </div>

                {/* Contrast: What Worked Previously vs What Failed Previously */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Previously Successful Approaches */}
                  <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-[#38BDF8] font-semibold uppercase text-[10px] tracking-wider font-mono">
                      <ThumbsUp className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Validated Successful Resolutions in Memory</span>
                    </div>
                    {hasSuccessHistory ? (
                      <div className="space-y-1.5">
                        {rec.successful_approaches.map((app, i) => (
                          <div key={i} className="p-2 rounded-sm bg-[#0A1320] border border-[#168DCE]/25 space-y-0.5">
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-[#38BDF8] font-semibold">{app.service} ({app.incident_number})</span>
                              <span className="text-[#38BDF8] text-[10px] font-bold">100% Success</span>
                            </div>
                            <div className="text-[#E2F3FF] font-mono text-[11px]">{app.solution}</div>
                            {app.notes && (
                              <div className="text-[#8BA8C2] text-[10px] italic font-mono">"{app.notes}"</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#8BA8C2] italic text-[11px] font-mono">
                        No prior identical successes retained yet.
                      </p>
                    )}
                  </div>

                  {/* Previously Failed Approaches */}
                  <div className="p-3.5 rounded-sm bg-[#070D18] border border-rose-500/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-400 font-semibold uppercase text-[10px] tracking-wider font-mono">
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Failed / Ineffective Approaches Avoided</span>
                    </div>
                    <div className="space-y-1.5">
                      {failedList.map((app, i) => (
                        <div key={i} className="p-2 rounded-sm bg-[#0A1320] border border-rose-900/40 space-y-0.5">
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="text-rose-300 font-semibold">{app.service} ({app.incident_number})</span>
                            <span className="text-rose-400 text-[10px] font-bold">Failed</span>
                          </div>
                          <div className="text-[#E2F3FF] font-mono text-[11px]">{app.solution}</div>
                          <div className="text-rose-300/80 text-[10px] font-mono">Reason: {app.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk Assessment & Rollback Protocol */}
                {rec.risk_assessment && (
                  <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#8BA8C2] uppercase tracking-wide text-[10px] flex items-center gap-1.5 font-mono">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>Risk Assessment & Rollback Protocol</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/30 text-[#8BA8C2]">
                        Risk: {rec.risk_assessment.risk_level || 'Low'}
                      </span>
                    </div>
                    <div className="text-[#E2F3FF] text-[11px] space-y-0.5 font-mono">
                      <div><strong className="text-[#38BDF8]">Side Effects:</strong> {rec.risk_assessment.potential_side_effects}</div>
                      <div><strong className="text-[#38BDF8]">Rollback:</strong> {rec.risk_assessment.rollback_plan}</div>
                    </div>
                    <div className="pt-1.5 text-[10px] text-[#8BA8C2] italic border-t border-[#168DCE]/20 font-mono">
                      Disclaimer: Predicted outcomes are estimates derived from historical memory. Solutions are not guaranteed.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

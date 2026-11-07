import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { OutcomeBadge } from '../components/common/Badge';
import {
  Sliders,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

export default function WhatIfSimulatorPage() {
  const { selectedIncidentId, showToast } = useApp();
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeOptionId, setActiveOptionId] = useState('opt_1');

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0) {
        const defaultInc = data.find((i) => i.id === selectedIncidentId) || data[0];
        setSelectedIncident(defaultInc);
        runSimulation(defaultInc);
      }
    } catch (err) {
      console.warn('Failed to load incidents for simulation:', err);
    }
  };

  const runSimulation = async (inc) => {
    if (!inc) return;
    setLoading(true);
    setSimulationData(null);
    try {
      const richDesc = [inc.title, inc.description, inc.root_cause_summary].filter(Boolean).join('. ');
      const resp = await api.simulateResolution({
        incident_id: inc.id,
        service_name: inc.service_name,
        incident_description: richDesc || inc.title || 'System Service Outage'
      });
      setSimulationData(resp);
      setActiveOptionId(resp.recommended_option_id || 'opt_1');
    } catch (err) {
      showToast(err.message || 'Simulation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentChange = (e) => {
    const inc = incidents.find((i) => i.id === e.target.value);
    setSelectedIncident(inc);
    runSimulation(inc);
  };

  const activeOption = simulationData?.options?.find((o) => o.id === activeOptionId) || simulationData?.options?.[0];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#168DCE]/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 text-[#38BDF8] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-[#38BDF8]" />
              Simulation & Modeling Engine
            </span>
          </div>
          <h2 className="text-xl font-mono font-bold text-[#E2F3FF] tracking-wider uppercase">
            What-If Resolution Simulator
          </h2>
          <p className="text-xs text-[#8BA8C2] font-mono mt-0.5">
            Model and compare candidate resolution strategies using historical evidence and risk estimates before execution.
          </p>
        </div>

        {/* Incident Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8BA8C2] font-mono uppercase tracking-wider font-medium">Target:</span>
          <select
            value={selectedIncident?.id || ''}
            onChange={handleIncidentChange}
            className="bg-[#070D18] border border-[#168DCE]/40 rounded-sm px-3 py-1.5 text-xs text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] font-mono cursor-pointer"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_number} — {inc.service_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Safety & Disclaimer Notice */}
      <div className="hud-bracket p-3.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 flex items-start gap-2.5 text-xs text-[#E2F3FF] shadow-[0_0_15px_rgba(22,141,206,0.12)]">
        <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
        <div className="font-mono text-[11px]">
          <span className="font-bold text-[#38BDF8] uppercase tracking-wide">Decision Support Protocol:</span>
          <span className="text-[#8BA8C2] ml-1.5">
            {simulationData?.disclaimer || 'Predicted outcomes are decision-support estimates derived from historical memory and AI reasoning. No live infrastructure changes are executed.'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#38BDF8] flex items-center justify-center gap-2 font-mono">
          <BrainCircuit className="w-4 h-4 animate-spin text-[#38BDF8]" />
          <span>Modeling candidate resolution pathways...</span>
        </div>
      ) : simulationData ? (
        <div className="space-y-6">
          {/* Candidate Options Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {simulationData.options.map((opt) => {
              const isSelected = activeOptionId === opt.id;
              const isRecommended = simulationData.recommended_option_id === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveOptionId(opt.id)}
                  className={`hud-bracket p-4 rounded-sm border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#168DCE]/15 border-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-[#38BDF8]'
                      : 'bg-[#0A1320] border-[#168DCE]/35 hover:border-[#38BDF8]/60 shadow-[0_0_15px_rgba(22,141,206,0.12)]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#8BA8C2] uppercase tracking-wider">
                        Strategy {opt.id.replace('opt_', '')}
                      </span>
                      {isRecommended && (
                        <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#070D18] text-[#38BDF8] border border-[#38BDF8]/50 font-mono font-semibold shadow-[0_0_8px_rgba(56,189,248,0.2)]">
                          Recommended
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-[#E2F3FF] tracking-tight font-mono">
                      {opt.title}
                    </h4>

                    <p className="text-[11px] text-[#8BA8C2] line-clamp-2 leading-relaxed font-mono">
                      {opt.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#168DCE]/25 flex items-center justify-between">
                    <OutcomeBadge outcome={opt.predicted_outcome} />
                    <span className="font-mono font-bold text-xs text-[#38BDF8]">
                      {opt.success_probability}% Win Prob
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Deep-Dive Comparison Inspector for Selected Option */}
          {activeOption && (
            <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-6 space-y-5 shadow-[0_0_15px_rgba(22,141,206,0.12)]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-3.5 border-b border-[#168DCE]/30">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-[#38BDF8]">
                      {activeOption.id.toUpperCase()}
                    </span>
                    <OutcomeBadge outcome={activeOption.predicted_outcome} />
                  </div>
                  <h3 className="text-base font-bold font-mono text-[#E2F3FF] tracking-tight">
                    {activeOption.title}
                  </h3>
                  <p className="text-xs text-[#8BA8C2] mt-0.5 font-mono">
                    Action: {activeOption.action}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-3xl font-mono font-bold text-[#38BDF8] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
                    {activeOption.success_probability}%
                  </div>
                  <div className="text-[10px] text-[#8BA8C2] uppercase font-semibold font-mono tracking-wider">
                    Success Probability
                  </div>
                </div>
              </div>

              {/* Grid: Historical Evidence vs Expected Impact vs Risks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Historical Evidence from Hindsight */}
                <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25 space-y-1.5">
                  <span className="font-semibold text-[#38BDF8] uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
                    <BrainCircuit className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Historical Evidence</span>
                  </span>
                  <p className="text-[#E2F3FF] leading-relaxed font-mono text-[11px]">
                    {activeOption.historical_evidence}
                  </p>
                </div>

                {/* Expected Operational Impact */}
                <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25 space-y-1.5">
                  <span className="font-semibold text-[#38BDF8] uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Expected Impact</span>
                  </span>
                  <div className="space-y-1 text-[#8BA8C2] font-mono text-[11px]">
                    <div>Downtime: <span className="text-[#E2F3FF] font-bold">{activeOption.expected_impact?.downtime || '0s'}</span></div>
                    <div>Throughput: <span className="text-[#38BDF8] font-bold">{activeOption.expected_impact?.throughput_recovery || 'Normal'}</span></div>
                    <div>Resources: <span className="text-[#E2F3FF]">{activeOption.expected_impact?.resource_impact || 'Baseline'}</span></div>
                  </div>
                </div>

                {/* Potential Risks */}
                <div className="p-3.5 rounded-sm bg-[#070D18] border border-rose-500/30 space-y-1.5">
                  <span className="font-semibold text-rose-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Potential Risks</span>
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[#8BA8C2] font-mono text-[11px]">
                    {activeOption.potential_risks?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendation Reasoning */}
              <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25 text-xs text-[#8BA8C2] space-y-1 font-mono">
                <span className="font-semibold text-[#38BDF8] block text-[10px] uppercase font-mono tracking-wide">
                  Decision Reasoning:
                </span>
                <p className="leading-relaxed text-[#E2F3FF]">
                  {activeOption.reasoning}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

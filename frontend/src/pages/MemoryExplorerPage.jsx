import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { OutcomeBadge, MemorySourceBadge } from '../components/common/Badge';
import {
  BrainCircuit,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Activity,
  Layers,
  Database
} from 'lucide-react';

export default function MemoryExplorerPage() {
  const { refreshTrigger, showToast } = useApp();
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('timeline'); // timeline or tester

  // Direct memory test query state
  const [testQuery, setTestQuery] = useState('connection timeout pool exhausted');
  const [recallResults, setRecallResults] = useState(null);
  const [testingRecall, setTestingRecall] = useState(false);
  const [reflectResult, setReflectResult] = useState(null);
  const [testingReflect, setTestingReflect] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [refreshTrigger]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const [dataRes, servicesRes] = await Promise.allSettled([
        api.getMemoryTimeline(),
        api.getServices()
      ]);
      const timeline = dataRes.status === 'fulfilled' && Array.isArray(dataRes.value) ? dataRes.value : [];
      setTimelineEvents(timeline);

      const services = servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) ? servicesRes.value : [];
      const fromServices = services.map((s) => s.name || s.service_name || s.label);
      const fromTimeline = timeline.map((e) => e.service_name);
      const unique = Array.from(new Set([...fromServices, ...fromTimeline].filter(Boolean))).sort();
      setAvailableServices(unique.length > 0 ? unique : ['cache-layer', 'payment-service', 'api-gateway', 'billing-engine']);
    } catch (err) {
      console.error('Failed to load memory timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestRecall = async () => {
    if (!testQuery.trim()) return;
    setTestingRecall(true);
    setRecallResults(null);
    try {
      const resp = await api.recallMemory({ query: testQuery, limit: 5 });
      setRecallResults(resp);
      showToast(`Recalled ${resp.count} memories in ${resp.execution_time_ms}ms`, 'success');
    } catch (err) {
      showToast(err.message || 'Recall failed', 'error');
    } finally {
      setTestingRecall(false);
    }
  };

  const handleTestReflect = async () => {
    if (!testQuery.trim()) return;
    setTestingReflect(true);
    setReflectResult(null);
    try {
      const resp = await api.reflectMemory({ query: testQuery });
      setReflectResult(resp);
      showToast('Reflection completed across memory bank', 'success');
    } catch (err) {
      showToast(err.message || 'Reflection failed', 'error');
    } finally {
      setTestingReflect(false);
    }
  };

  const filteredEvents = timelineEvents.filter((ev) => {
    if (serviceFilter && ev.service_name !== serviceFilter) return false;
    if (outcomeFilter && ev.outcome !== outcomeFilter) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#168DCE]/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 text-[#38BDF8] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-3 h-3 text-[#38BDF8]" />
              Hindsight Cognitive Engine
            </span>
          </div>
          <h2 className="text-xl font-mono font-bold text-[#E2F3FF] tracking-wider uppercase">
            Memory Explorer
          </h2>
          <p className="text-xs text-[#8BA8C2] font-mono mt-0.5">
            Audit and query long-term incident experiences retained in Hindsight agent memory.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#070D18] border border-[#168DCE]/30 rounded-sm p-1">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono transition-all ${
              activeTab === 'timeline'
                ? 'hud-bracket bg-[#168DCE]/20 text-[#38BDF8] border border-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.25)] font-bold'
                : 'text-[#8BA8C2] hover:text-[#E2F3FF] hover:bg-[#168DCE]/10'
            }`}
          >
            Evolution Timeline ({timelineEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeTab === 'tester'
                ? 'hud-bracket bg-[#168DCE]/20 text-[#38BDF8] border border-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.25)] font-bold'
                : 'text-[#8BA8C2] hover:text-[#E2F3FF] hover:bg-[#168DCE]/10'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Memory Sandbox</span>
          </button>
        </div>
      </div>

      {activeTab === 'timeline' ? (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_15px_rgba(22,141,206,0.12)]">
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <span className="text-[#8BA8C2] font-semibold uppercase tracking-wider text-[11px]">Filter:</span>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-[#070D18] border border-[#168DCE]/40 rounded-sm px-2.5 py-1 text-xs text-[#E2F3FF] font-mono focus:outline-none focus:border-[#38BDF8] cursor-pointer"
              >
                <option value="">All Services</option>
                {availableServices.map((svc) => (
                  <option key={svc} value={svc}>{svc}</option>
                ))}
              </select>

              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="bg-[#070D18] border border-[#168DCE]/40 rounded-sm px-2.5 py-1 text-xs text-[#E2F3FF] font-mono focus:outline-none focus:border-[#38BDF8] cursor-pointer"
              >
                <option value="">All Outcomes</option>
                <option value="success">Successes</option>
                <option value="failure">Failures</option>
              </select>
            </div>

            <span className="text-xs text-[#38BDF8] font-mono">
              {filteredEvents.length} memory records retained
            </span>
          </div>

          {/* Chronological Evolution Timeline */}
          {filteredEvents.length === 0 ? (
            <div className="hud-bracket p-12 text-center text-xs text-[#8BA8C2] border border-[#168DCE]/35 rounded-sm bg-[#0A1320] font-mono">
              No memory experiences match filter criteria.
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:inset-0 before:left-3 sm:before:left-4 before:w-px before:bg-[#168DCE]/30">
              {filteredEvents.map((ev, idx) => {
                const isSuccess = ev.outcome === 'success';
                return (
                  <div key={ev.id || idx} className="relative group">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-none border flex items-center justify-center text-[10px] font-mono font-bold ${
                        isSuccess
                          ? 'bg-[#0A1320] border-[#38BDF8] text-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                          : 'bg-[#0A1320] border-rose-500 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                      }`}
                    >
                      {ev.step}
                    </div>

                    {/* Card Content */}
                    <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 hover:border-[#38BDF8] rounded-sm p-5 transition-all space-y-3.5 shadow-[0_0_15px_rgba(22,141,206,0.12)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#168DCE]/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[#38BDF8] font-bold text-xs tracking-wider">
                            {ev.incident_number}
                          </span>
                          <span className="whitespace-nowrap px-2 py-0.5 rounded-sm bg-[#070D18] border border-[#168DCE]/30 text-[#8BA8C2] font-mono text-[11px]">
                            {ev.service_name}
                          </span>
                          <OutcomeBadge outcome={ev.outcome} />
                          <MemorySourceBadge source={ev.source} isLive={ev.is_live_hindsight} />
                        </div>

                        <span className="text-xs text-[#8BA8C2] font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                          {new Date(ev.created_at).toLocaleDateString()} {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Symptoms & Root Cause */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-sm bg-[#070D18] border border-[#168DCE]/25 space-y-1">
                          <span className="text-[#8BA8C2] font-semibold uppercase text-[10px] tracking-wider block font-mono">
                            Incident Symptoms
                          </span>
                          <p className="text-[#E2F3FF] leading-relaxed font-mono text-[11px]">
                            {ev.symptoms}
                          </p>
                        </div>

                        <div className="p-3 rounded-sm bg-[#070D18] border border-[#168DCE]/25 space-y-1">
                          <span className="text-[#8BA8C2] font-semibold uppercase text-[10px] tracking-wider block font-mono">
                            Root Cause Diagnosis
                          </span>
                          <p className="text-[#38BDF8] leading-relaxed font-mono text-[11px]">
                            {ev.root_cause}
                          </p>
                        </div>
                      </div>

                      {/* Applied Solution */}
                      <div className="p-3 rounded-sm bg-[#070D18] border border-[#168DCE]/25 text-xs space-y-1.5 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-[#8BA8C2] uppercase tracking-wider">
                            Applied Resolution:
                          </span>
                          <span className="text-xs text-[#38BDF8] font-semibold">
                            Confidence: {Math.round(ev.confidence_score <= 1.0 ? ev.confidence_score * 100 : ev.confidence_score)}%
                          </span>
                        </div>
                        <div className="text-[#E2F3FF] text-xs">
                          {ev.applied_resolution}
                        </div>
                        {ev.feedback_notes && (
                          <div className="text-[#8BA8C2] text-[11px] pt-1 border-t border-[#168DCE]/20 italic">
                            "{ev.feedback_notes}"
                          </div>
                        )}
                      </div>

                      {/* Learning Impact */}
                      <div className="p-3 rounded-sm bg-[#070D18] border border-[#168DCE]/40 text-xs text-[#E2F3FF] flex items-start gap-2 shadow-[0_0_10px_rgba(22,141,206,0.1)]">
                        <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-[#38BDF8] block mb-0.5 uppercase tracking-wide text-[10px] font-mono">
                            Learning Impact:
                          </span>
                          <span className="text-[#8BA8C2] leading-relaxed font-mono text-[11px]">
                            {ev.learning_impact}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Hindsight Sandbox */
        <div className="space-y-6">
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-6 space-y-4 shadow-[0_0_15px_rgba(22,141,206,0.12)]">
            <h3 className="text-sm font-mono font-bold text-[#E2F3FF] flex items-center gap-2 uppercase tracking-wide">
              <Zap className="w-4 h-4 text-[#38BDF8]" />
              <span>Hindsight Memory Primitives Tester</span>
            </h3>
            <p className="text-xs text-[#8BA8C2] font-mono">
              Test <code className="text-[#38BDF8] font-mono">recall()</code> for fast hybrid search across the memory bank and <code className="text-[#38BDF8] font-mono">reflect()</code> for analytical reasoning loops.
            </p>

            <div className="space-y-3 pt-1">
              <label className="block text-xs font-mono font-medium text-[#8BA8C2] uppercase tracking-wider">Test Query</label>
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="e.g. database connection timeout pool exhausted"
                className="w-full bg-[#070D18] border border-[#168DCE]/40 rounded-sm px-3.5 py-2 text-xs text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_10px_rgba(56,189,248,0.25)] font-mono"
              />

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={handleTestRecall}
                  disabled={testingRecall}
                  className="px-4 py-2 rounded-sm bg-gradient-to-r from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(22,141,206,0.3)] transition-all cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{testingRecall ? 'Searching...' : 'Execute recall()'}</span>
                </button>

                <button
                  onClick={handleTestReflect}
                  disabled={testingReflect}
                  className="px-4 py-2 rounded-sm bg-[#070D18] hover:bg-[#168DCE]/10 text-[#E2F3FF] border border-[#168DCE]/50 hover:border-[#38BDF8] text-xs font-mono font-semibold flex items-center gap-1.5 transition-all hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] cursor-pointer"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>{testingReflect ? 'Reasoning...' : 'Execute reflect()'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {recallResults && (
            <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-5 space-y-3 shadow-[0_0_15px_rgba(22,141,206,0.12)]">
              <div className="flex items-center justify-between border-b border-[#168DCE]/30 pb-2 text-xs font-mono">
                <span className="font-bold text-[#E2F3FF] uppercase tracking-wide">
                  recall() Results ({recallResults.count} matches in {recallResults.execution_time_ms}ms)
                </span>
                <MemorySourceBadge isLive={recallResults.is_live_hindsight} />
              </div>

              <div className="space-y-2">
                {recallResults.results.map((r, i) => (
                  <div key={i} className="p-3 rounded-sm bg-[#070D18] border border-[#168DCE]/25 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#8BA8C2]">
                      <span className="text-[#38BDF8] font-semibold">[{r.service_name || 'service'}] Score: {Math.round(r.similarity_score * 100)}%</span>
                      {r.outcome && <OutcomeBadge outcome={r.outcome} />}
                    </div>
                    <div className="text-[#E2F3FF] font-mono text-[11px]">{r.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reflectResult && (
            <div className="hud-bracket bg-[#0A1320] border border-[#38BDF8]/40 rounded-sm p-5 space-y-3 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <div className="flex items-center justify-between border-b border-[#168DCE]/30 pb-2 text-xs font-mono">
                <span className="font-bold text-[#E2F3FF] uppercase tracking-wide">
                  reflect() Synthesis ({reflectResult.execution_time_ms}ms)
                </span>
                <MemorySourceBadge isLive={reflectResult.is_live_hindsight} />
              </div>

              <div className="p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/30 text-xs text-[#E2F3FF] whitespace-pre-wrap leading-relaxed font-mono">
                {reflectResult.synthesized_answer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

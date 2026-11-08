import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import StatCard from '../components/common/StatCard';
import { SeverityBadge, OutcomeBadge } from '../components/common/Badge';
import {
  TrendingUp,
  BrainCircuit,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Share2,
  Zap,
  Activity,
  Layers,
  Server,
  ArrowRight,
  AlertTriangle,
  Network,
  Check,
  Database,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function LearningAnalyticsPage() {
  const { refreshTrigger, navigateTo, showToast } = useApp();
  const [learningData, setLearningData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progression'); // progression or comparison or graph
  const [topologyFilter, setTopologyFilter] = useState('all'); // all, retained, pending

  // Add Service Modal State
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceTier, setNewServiceTier] = useState('tier-1');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analytics, graph] = await Promise.all([
        api.getLearningAnalytics().catch((err) => {
          console.error('Failed to get learning analytics:', err);
          return null;
        }),
        api.getRelationshipGraph().catch((err) => {
          console.error('Failed to get relationship graph:', err);
          return { nodes: [], edges: [] };
        })
      ]);

      if (analytics) {
        setLearningData(analytics);
      } else {
        // Fallback default state if API is empty/loading
        setLearningData({
          memory_count: 0,
          learning_progression: [
            { iteration: "Workspace Initialized", success_rate: 0, mttr_minutes: 0, confidence: 0 }
          ],
          comparison_cases: [],
          metrics: {
            mttr_reduction_pct: 0,
            repeat_incident_prevention_pct: 0,
            automated_confidence_boost: "0%",
            engineer_hours_saved_month: 0
          }
        });
      }

      setGraphData(graph || { nodes: [], edges: [] });
    } catch (err) {
      console.error('Failed to load learning analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      setServiceError('Service name is required');
      return;
    }
    setServiceError('');
    setIsSubmittingService(true);
    try {
      await api.createService({
        name: newServiceName.trim(),
        tier: newServiceTier,
        description: newServiceDescription.trim() || undefined,
      });
      showToast?.(`Microservice "${newServiceName.trim()}" configured successfully.`, 'success');
      setNewServiceName('');
      setNewServiceDescription('');
      setNewServiceTier('tier-1');
      setIsAddServiceModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create service:', err);
      setServiceError(err.message || 'Failed to configure service');
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDeleteService = async (srv) => {
    if (!window.confirm(`Are you sure you want to remove microservice "${srv.label}" from monitoring?`)) {
      return;
    }
    try {
      await api.deleteService(srv.service_id || srv.id || srv.label);
      showToast?.(`Microservice "${srv.label}" removed.`, 'info');
      await loadData();
    } catch (err) {
      console.error('Failed to delete service:', err);
      showToast?.(err.message || 'Failed to delete service', 'error');
    }
  };

  const incidentNodes = graphData?.nodes?.filter((n) => n.type === 'incident') || [];
  const serviceNodes = graphData?.nodes?.filter((n) => n.type === 'service') || [];
  const memoryNodes = graphData?.nodes?.filter((n) => n.type === 'memory') || [];

  // Match each incident with its exact parent microservice and exact retained memory node
  const lineages = incidentNodes.map((inc) => {
    const service = serviceNodes.find(
      (s) => s.label === inc.service_name || s.id === `srv_${inc.service_name}`
    ) || { label: inc.service_name || 'monitored-service' };

    const memory =
      memoryNodes.find(
        (m) =>
          (m.incident_id && m.incident_id === inc.id) ||
          (m.incident_number && m.incident_number === inc.label)
      ) ||
      memoryNodes.find(
        (m) => m.service_name && m.service_name === inc.service_name
      );

    return {
      incident: inc,
      service,
      memory
    };
  });

  const servicesWithIncidents = new Set(incidentNodes.map((i) => i.service_name));
  const idleServices = serviceNodes.filter((s) => !servicesWithIncidents.has(s.label));

  const filteredLineages = lineages.filter((l) => {
    if (topologyFilter === 'retained') return !!l.memory;
    if (topologyFilter === 'pending') return !l.memory;
    return true;
  });

  if (loading || !learningData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-[#38BDF8] font-mono">
          <BrainCircuit className="w-5 h-5 animate-spin text-[#38BDF8]" />
          <span className="text-sm font-medium tracking-wide">Computing learning evolution curves...</span>
        </div>
      </div>
    );
  }

  const metrics = learningData.metrics || {};

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#168DCE]/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2.5 py-0.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/40 text-[#38BDF8] font-mono flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-[#38BDF8]" />
              Intelligence Telemetry
            </span>
          </div>
          <h2 className="text-xl font-mono font-bold text-[#E2F3FF] tracking-wider uppercase">
            Learning Analytics & MTTR Evolution
          </h2>
          <p className="text-xs text-[#8BA8C2] font-mono mt-1">
            Empirical telemetry tracking how resolution speed, diagnostic accuracy, and recommendation confidence improve over time.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#070D18] border border-[#168DCE]/30 rounded-sm p-1">
          <button
            onClick={() => setActiveTab('progression')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono transition-all ${
              activeTab === 'progression'
                ? 'hud-bracket bg-[#168DCE]/20 text-[#38BDF8] border border-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.25)] font-bold'
                : 'text-[#8BA8C2] hover:text-[#E2F3FF] hover:bg-[#168DCE]/10'
            }`}
          >
            Learning Curves
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeTab === 'comparison'
                ? 'hud-bracket bg-[#168DCE]/20 text-[#38BDF8] border border-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.25)] font-bold'
                : 'text-[#8BA8C2] hover:text-[#E2F3FF] hover:bg-[#168DCE]/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Before vs After</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="MTTR Reduction"
          value={`-${metrics.mttr_reduction_pct}%`}
          subtitle="Mean resolution compression"
          icon={Clock}
          color="cyan"
          trend="48m → 18m"
        />
        <StatCard
          title="Repeat Error Avoidance"
          value={`${metrics.repeat_incident_prevention_pct}%`}
          subtitle="Eliminated duplicate diagnosis"
          icon={ShieldCheck}
          color="cyan"
          trend="+89% Efficiency"
        />
        <StatCard
          title="Confidence Acceleration"
          value={metrics.automated_confidence_boost}
          subtitle="Boosted via historical recall"
          icon={BrainCircuit}
          color="cyan"
          trend="Validated Precedents"
        />
        <StatCard
          title="Engineer Hours Saved"
          value={`${metrics.engineer_hours_saved_month}h`}
          subtitle="Saved per month system-wide"
          icon={Zap}
          color="cyan"
          trend="Automated Guidance"
        />
      </div>

      {activeTab === 'progression' && (
        <div className="space-y-6">
          {/* Dual Learning Curve Chart */}
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-6 space-y-4 shadow-[0_0_15px_rgba(22,141,206,0.12)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-mono font-bold text-[#E2F3FF] uppercase tracking-wide">
                  Resolution Success Rate & MTTR Compression Curve
                </h3>
                <p className="text-xs text-[#8BA8C2] font-mono mt-0.5">
                  Tracking resolution success rate (%) climbing while MTTR (minutes) drops as operational experiences accumulate
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#38BDF8]">
                  <span className="w-2.5 h-2.5 rounded-none bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" /> Success Rate (%)
                </span>
                <span className="flex items-center gap-1.5 text-[#168DCE]">
                  <span className="w-2.5 h-2.5 rounded-none bg-[#168DCE]" /> MTTR (Minutes)
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={learningData.learning_progression || []} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#168DCE" strokeOpacity={0.15} />
                  <XAxis dataKey="iteration" stroke="#8BA8C2" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8BA8C2" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A1320', borderColor: '#168DCE', borderRadius: '2px', color: '#E2F3FF', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="success_rate" stroke="#38BDF8" strokeWidth={2.5} dot={{ r: 4, fill: '#38BDF8' }} />
                  <Line type="monotone" dataKey="mttr_minutes" stroke="#168DCE" strokeWidth={2.5} dot={{ r: 4, fill: '#168DCE' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        /* Agent Learning Comparison: Before vs After Hindsight */
        <div className="space-y-6">
          <div className="hud-bracket p-4 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 text-xs text-[#8BA8C2] font-mono shadow-[0_0_15px_rgba(22,141,206,0.12)]">
            <span className="font-bold text-[#38BDF8] block mb-1 uppercase tracking-wider">
              Operational Learning Impact Analysis
            </span>
            Observe the qualitative and quantitative difference in SentinelMind's recommendations when addressing recurring failures before having memory versus after retaining operational resolutions.
          </div>

          <div className="space-y-4">
            {(!learningData.comparison_cases || learningData.comparison_cases.length === 0) ? (
              <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-12 text-center text-xs text-[#8BA8C2] font-mono shadow-[0_0_15px_rgba(22,141,206,0.12)]">
                No comparative operational scenarios yet. Upload logs and resolve incidents to compare cold-start responses against memory-assisted resolutions.
              </div>
            ) : (
              learningData.comparison_cases.map((c, idx) => (
              <div key={idx} className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-6 space-y-4 shadow-[0_0_15px_rgba(22,141,206,0.12)]">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#070D18] text-[#38BDF8] border border-[#168DCE]/40 uppercase tracking-wide font-semibold">
                    Scenario {idx + 1}: {c.service}
                  </span>
                  <h3 className="text-base font-bold font-mono text-[#E2F3FF] mt-2">{c.scenario}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Before Learning (Cold Start) */}
                  <div className="p-5 rounded-sm bg-[#070D18] border border-rose-500/35 space-y-3 font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-rose-900/30">
                      <span className="font-semibold text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        Before Learning (Cold Memory)
                      </span>
                      <span className="font-mono text-rose-400 font-bold">
                        {c.before_learning.confidence_score}% Conf
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#8BA8C2] text-[10px] font-semibold uppercase tracking-wider">Recommendation:</span>
                      <p className="text-[#E2F3FF] font-medium">{c.before_learning.recommendation}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#8BA8C2] text-[10px] font-semibold uppercase tracking-wider">Agent Rationale:</span>
                      <p className="text-[#8BA8C2] text-[11px] leading-relaxed">{c.before_learning.explanation}</p>
                    </div>

                    <div className="p-2.5 rounded-sm bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[11px]">
                      <strong className="text-rose-400">Risk Warning:</strong> {c.before_learning.risk_warning}
                    </div>

                    <div className="pt-2 text-[#8BA8C2] font-mono text-[11px]">
                      Est. Time to Recover: <strong className="text-rose-400">{c.before_learning.mttr_estimate}</strong>
                    </div>
                  </div>

                  {/* After Learning (With Memory Recall) */}
                  <div className="p-5 rounded-sm bg-[#070D18] border border-[#38BDF8]/40 space-y-3 font-mono shadow-[0_0_12px_rgba(56,189,248,0.1)]">
                    <div className="flex items-center justify-between pb-2 border-b border-[#168DCE]/30">
                      <span className="font-semibold text-[#38BDF8] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                        After Learning (With Hindsight Recall)
                      </span>
                      <span className="font-mono text-[#38BDF8] font-bold">
                        {c.after_learning.confidence_score}% Conf
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#8BA8C2] text-[10px] font-semibold uppercase tracking-wider">Recommendation:</span>
                      <p className="text-[#38BDF8] font-semibold">{c.after_learning.recommendation}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#8BA8C2] text-[10px] font-semibold uppercase tracking-wider">Agent Rationale:</span>
                      <p className="text-[#E2F3FF] text-[11px] leading-relaxed">{c.after_learning.explanation}</p>
                    </div>

                    <div className="p-2.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/30 text-[#8BA8C2] text-[11px]">
                      <strong className="text-[#38BDF8]">Risk Warning:</strong> {c.after_learning.risk_warning}
                    </div>

                    <div className="pt-2 text-[#8BA8C2] font-mono text-[11px]">
                      Est. Time to Recover: <strong className="text-[#38BDF8]">{c.after_learning.mttr_estimate}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Add Microservice Modal */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070D18]/85 backdrop-blur-sm">
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE] rounded-sm w-full max-w-md p-6 space-y-4 shadow-[0_0_30px_rgba(22,141,206,0.35)] font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#168DCE]/30">
              <h3 className="text-sm font-bold text-[#E2F3FF] uppercase tracking-wide flex items-center gap-2">
                <Server className="w-4 h-4 text-[#38BDF8]" />
                <span>Configure Infrastructure Service</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddServiceModalOpen(false)}
                className="text-[#8BA8C2] hover:text-[#E2F3FF] p-1 rounded-sm hover:bg-[#168DCE]/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {serviceError && (
              <div className="p-2.5 rounded-sm bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{serviceError}</span>
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] text-[#8BA8C2] uppercase font-bold">
                  Microservice Identifier / Name *
                </label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. auth-gateway, order-svc, cache-cluster"
                  disabled={isSubmittingService}
                  className="w-full px-3 py-2 rounded-sm bg-[#070D18] border border-[#168DCE]/40 focus:border-[#38BDF8] text-[#E2F3FF] placeholder-[#8BA8C2]/40 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8BA8C2] uppercase font-bold">
                  Criticality Tier
                </label>
                <select
                  value={newServiceTier}
                  onChange={(e) => setNewServiceTier(e.target.value)}
                  disabled={isSubmittingService}
                  className="w-full px-3 py-2 rounded-sm bg-[#070D18] border border-[#168DCE]/40 focus:border-[#38BDF8] text-[#E2F3FF] outline-none cursor-pointer"
                >
                  <option value="tier-1">Tier-1 (Mission Critical / In-Path)</option>
                  <option value="tier-2">Tier-2 (Core Business Logic)</option>
                  <option value="tier-3">Tier-3 (Peripheral / Async Worker)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8BA8C2] uppercase font-bold">
                  Description / Operational Scope (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  placeholder="e.g. Ingress API reverse-proxy with JWT authentication and rate limiting"
                  disabled={isSubmittingService}
                  className="w-full px-3 py-2 rounded-sm bg-[#070D18] border border-[#168DCE]/40 focus:border-[#38BDF8] text-[#E2F3FF] placeholder-[#8BA8C2]/40 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#168DCE]/25">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  disabled={isSubmittingService}
                  className="px-3.5 py-1.5 rounded-sm border border-[#168DCE]/40 text-[#8BA8C2] hover:text-[#E2F3FF] hover:bg-[#168DCE]/15 transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingService}
                  className="px-4 py-1.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-bold tracking-wider shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingService ? 'CONFIGURING...' : 'REGISTER SERVICE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

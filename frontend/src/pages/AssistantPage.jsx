import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { OutcomeBadge } from '../components/common/Badge';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import {
  Bot,
  User,
  Send,
  BrainCircuit,
  CheckCircle2,
  CornerDownRight,
  Cpu,
  Sparkles,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const createDefaultMessage = () => ({
  role: 'assistant',
  content:
    'SentinelMind AI Copilot online. Telemetry links established with long-term Hindsight memory bank. Ready for diagnostic inquiry, root cause analysis, and historical precedent recall.',
  confirmed_evidence: ['SentinelMind Agent Online', 'Hindsight Memory Bank Active'],
  hypotheses: ['Ready for telemetry inspection or diagnostic inquiry.'],
  citations: []
});

const createNewSession = (title = 'New Incident Triage', incidentId = null, serviceName = null) => {
  const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id,
    title,
    incidentId,
    serviceName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [createDefaultMessage()]
  };
};

export default function AssistantPage() {
  const { selectedIncidentId, setSelectedIncidentId, showToast } = useApp();
  const { user } = useAuth();

  // Multi-tenant isolation: Scope local storage strictly by the authenticated user's ID
  const userId = user?.id || 'guest';
  const userStorageKey = `sentinelmind_chat_sessions_${userId}`;
  const userActiveKey = `sentinelmind_active_session_id_${userId}`;

  // Sessions list loaded strictly for the authenticated user
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved chat sessions:', e);
    }
    const def = createNewSession();
    return [def];
  });

  // Active session ID
  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const savedId = localStorage.getItem(userActiveKey);
      if (savedId) return savedId;
    } catch (e) {}
    return null;
  });

  // Reload user-scoped sessions whenever the authenticated user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Deduplicate sessions: keep only the most recent/complete session for each incidentId
          const seen = new Set();
          const deduped = [];
          for (const s of parsed) {
            const key = s.incidentId ? `inc_${s.incidentId}` : `id_${s.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(s);
            }
          }
          setSessions(deduped);
          const savedActive = localStorage.getItem(userActiveKey);
          setActiveSessionId(
            savedActive && deduped.some((s) => s.id === savedActive)
              ? savedActive
              : deduped[0].id
          );
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load user-isolated chat sessions:', e);
    }
    const def = createNewSession();
    setSessions([def]);
    setActiveSessionId(def.id);
  }, [userStorageKey, userActiveKey]);

  // Sessions drawer open/collapse
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // Rename session state
  const [renamingSessionId, setRenamingSessionId] = useState(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  // Active chat state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const chatMessagesContainerRef = useRef(null);
  const handlingIncidentIdRef = useRef(null);

  // Sync activeSessionId with sessions
  useEffect(() => {
    if (!activeSessionId || !sessions.some((s) => s.id === activeSessionId)) {
      if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        const newS = createNewSession();
        setSessions([newS]);
        setActiveSessionId(newS.id);
      }
    }
  }, [sessions, activeSessionId]);

  // Persist sessions to user-isolated localStorage key
  useEffect(() => {
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(sessions));
      if (activeSessionId) {
        localStorage.setItem(userActiveKey, activeSessionId);
      }
    } catch (e) {
      console.warn('Failed to persist chat sessions:', e);
    }
  }, [sessions, activeSessionId, userStorageKey, userActiveKey]);

  // Active session helper
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  const messages = currentSession?.messages || [createDefaultMessage()];

  // Auto-scroll on new message within the chat messages container only
  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Handle selectedIncidentId if provided from outside (Single-Execution Guard)
  useEffect(() => {
    if (!selectedIncidentId) return;
    if (handlingIncidentIdRef.current === selectedIncidentId) return;

    const targetId = selectedIncidentId;
    handlingIncidentIdRef.current = targetId;
    setSelectedIncidentId(null);

    const existingSession = sessions.find((s) => s.incidentId === targetId);
    if (existingSession) {
      setActiveSessionId(existingSession.id);
      // If the existing session has not yet received an AI response, trigger it directly!
      const hasAnalysis = existingSession.messages.some(
        (m) => m.role === 'user' && m.content.includes('Analyze incident')
      );
      if (!hasAnalysis) {
        triggerAnalysisForSession(targetId, existingSession.id, existingSession.messages);
      }
      handlingIncidentIdRef.current = null;
      return;
    }

    loadNewIncidentSession(targetId);
  }, [selectedIncidentId, sessions]);

  const triggerAnalysisForSession = async (incidentId, sessionId, currentMessages) => {
    try {
      const inc = await api.getIncident(incidentId);
      setActiveIncident(inc);
      const prompt = `Analyze incident ${inc.incident_number} on ${inc.service_name}: "${inc.title}". What is the likely root cause and what does historical memory suggest?`;
      await executeChatQuery(prompt, sessionId, inc, currentMessages);
    } catch (err) {
      console.warn('Could not trigger incident analysis:', err);
    }
  };

  const loadNewIncidentSession = async (id) => {
    try {
      const inc = await api.getIncident(id);
      setActiveIncident(inc);
      const title = `${inc.incident_number} (${inc.service_name})`;

      const newSession = createNewSession(title, inc.id, inc.service_name);
      const targetSessionId = newSession.id;

      setSessions((prev) => {
        // Remove any previous duplicate session for this incident
        const filtered = prev.filter((s) => s.incidentId !== id);
        // Clean up empty default "New Incident Triage" if it has not been used yet
        const cleaned = filtered.filter(
          (s) =>
            !(
              s.title === 'New Incident Triage' &&
              (s.messages.length <= 1 || !s.messages.some((m) => m.role === 'user'))
            )
        );
        return [newSession, ...cleaned];
      });

      setActiveSessionId(targetSessionId);

      const prompt = `Analyze incident ${inc.incident_number} on ${inc.service_name}: "${inc.title}". What is the likely root cause and what does historical memory suggest?`;
      await executeChatQuery(prompt, targetSessionId, inc, newSession.messages);
    } catch (err) {
      console.warn('Could not load incident context:', err);
    } finally {
      handlingIncidentIdRef.current = null;
    }
  };

  const handleCreateNewChat = () => {
    const newSession = createNewSession(`Chat ${sessions.length + 1}`);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveIncident(null);
    setInput('');
  };

  const handleStartRename = (session, e) => {
    e.stopPropagation();
    setRenamingSessionId(session.id);
    setRenameTitleInput(session.title);
  };

  const handleSaveRename = (sessionId, e) => {
    if (e) e.stopPropagation();
    const cleanTitle = renameTitleInput.trim() || 'Untitled Session';
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: cleanTitle, updatedAt: new Date().toISOString() } : s))
    );
    setRenamingSessionId(null);
    setRenameTitleInput('');
  };

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (remaining.length === 0) {
      const fresh = createNewSession('New Incident Triage');
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }
    }
    showToast('Session purged', 'info');
  };

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading || !currentSession) return;

    if (!messageText) setInput('');
    await executeChatQuery(textToSend, currentSession.id, activeIncident, messages);
  };

  const executeChatQuery = async (queryText, targetSessionId, incidentContext, currentMessages) => {
    const userMsg = { role: 'user', content: queryText };
    const updatedMessagesWithUser = [...currentMessages, userMsg];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
          let updatedTitle = s.title;
          if (s.title.startsWith('Chat ') || s.title === 'New Incident Triage') {
            updatedTitle = queryText.slice(0, 32).trim() + (queryText.length > 32 ? '...' : '');
          }
          return {
            ...s,
            title: updatedTitle,
            updatedAt: new Date().toISOString(),
            messages: updatedMessagesWithUser
          };
        }
        return s;
      })
    );

    setLoading(true);

    try {
      const resp = await api.assistantChat({
        message: queryText,
        incident_id: incidentContext?.id,
        service_name: incidentContext?.service_name || 'production-service',
        session_id: targetSessionId,
        conversation_history: updatedMessagesWithUser.slice(-4)
      });

      const assistantMsg = {
        role: 'assistant',
        content: resp.reply,
        confirmed_evidence: resp.confirmed_evidence || [],
        hypotheses: resp.hypotheses || [],
        citations: resp.retrieved_memories || [],
        model_used: resp.model_used,
        is_live_hindsight: resp.is_live_hindsight,
        follow_ups: resp.follow_up_suggestions || []
      };

      const finalMessages = [...updatedMessagesWithUser, assistantMsg];

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, messages: finalMessages, updatedAt: new Date().toISOString() }
            : s
        )
      );
    } catch (err) {
      console.error('Copilot communication error:', err);
      showToast?.(err.message || 'Copilot communication failure', 'error');
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ **Diagnostic Error:** Failed to communicate with AI Assistant: ${err.message || 'Unknown network error'}.`,
        confirmed_evidence: [],
        hypotheses: [],
        citations: []
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, messages: [...updatedMessagesWithUser, errorMsg], updatedAt: new Date().toISOString() }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Explain root cause of connection timeouts simply',
    'What does Hindsight recall about past pool exhaustion fixes?',
    'Compare increasing pool capacity vs pod restarts',
    'List confirmed telemetry facts vs AI hypotheses'
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#070D18] font-sans">
      {/* Sessions History Sidebar */}
      <div
        className={`bg-[#0A1320] border-r border-[#168DCE]/35 flex flex-col transition-all duration-200 select-none ${
          isHistoryOpen ? 'w-72' : 'w-12'
        }`}
      >
        {/* History Header */}
        <div className="h-14 px-3 border-b border-[#168DCE]/30 flex items-center justify-between bg-[#070D18]">
          {isHistoryOpen ? (
            <>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E2F3FF]">
                <History className="w-4 h-4 text-[#38BDF8]" />
                <span>SESSION LOG ({sessions.length})</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={handleCreateNewChat}
                  className="p-1.5 rounded-sm bg-[#168DCE]/20 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#168DCE]/40 transition-colors"
                  title="New Session"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 rounded-sm hover:bg-[#168DCE]/15 text-[#8BA8C2] hover:text-[#E2F3FF] transition-colors"
                  title="Collapse session ledger"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="w-8 h-8 rounded-sm hover:bg-[#168DCE]/15 text-[#8BA8C2] hover:text-[#38BDF8] flex items-center justify-center transition-colors"
                title="Expand session ledger"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Collapsed State Quick Action */}
        {!isHistoryOpen && (
          <div className="p-2 flex flex-col items-center">
            <button
              onClick={handleCreateNewChat}
              className="w-8 h-8 rounded-sm bg-[#168DCE]/20 text-[#38BDF8] hover:bg-[#38BDF8]/20 border border-[#168DCE]/40 flex items-center justify-center transition-colors shadow-[0_0_8px_rgba(56,189,248,0.2)]"
              title="New Session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sessions List */}
        {isHistoryOpen && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
            {/* Prominent New Chat Button */}
            <button
              onClick={handleCreateNewChat}
              className="w-full mb-2 flex items-center gap-2 px-3 py-2 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white text-xs font-semibold transition-all shadow-[0_0_10px_rgba(56,189,248,0.25)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ INITIALIZE NEW CHAT</span>
            </button>

            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isRenaming = renamingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isRenaming) setActiveSessionId(session.id);
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-sm transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#168DCE]/20 text-[#38BDF8] border-[#38BDF8]/60 shadow-[0_0_10px_rgba(56,189,248,0.2)] font-semibold'
                      : 'text-[#8BA8C2] hover:text-[#E2F3FF] hover:bg-[#168DCE]/10 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#38BDF8]' : 'text-[#8BA8C2]'}`} />
                    {isRenaming ? (
                      <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={renameTitleInput}
                          onChange={(e) => setRenameTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(session.id, e);
                            if (e.key === 'Escape') setRenamingSessionId(null);
                          }}
                          autoFocus
                          className="w-full bg-[#070D18] border border-[#38BDF8] rounded-sm px-1.5 py-0.5 text-xs text-[#E2F3FF] focus:outline-none"
                        />
                        <button
                          onClick={(e) => handleSaveRename(session.id, e)}
                          className="p-1 text-[#38BDF8] hover:text-white"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingSessionId(null);
                          }}
                          className="p-1 text-[#8BA8C2] hover:text-[#E2F3FF]"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="truncate flex flex-col">
                        <span className="truncate">{session.title}</span>
                        <span className="text-[10px] text-[#8BA8C2]/70 font-mono">
                          {session.messages?.length || 0} MESSAGES
                        </span>
                      </div>
                    )}
                  </div>

                  {!isRenaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(session, e)}
                        className="p-1 rounded-sm hover:bg-[#168DCE]/20 text-[#8BA8C2] hover:text-[#38BDF8]"
                        title="Rename session"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1 rounded-sm hover:bg-rose-950/60 text-[#8BA8C2] hover:text-rose-400"
                        title="Purge session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#070D18]">
        {/* Workspace Subheader */}
        <div className="h-14 px-6 border-b border-[#168DCE]/30 bg-[#0A1320]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 truncate">
            <div className="hud-bracket w-8 h-8 rounded-sm bg-[#0A1320] border border-[#168DCE]/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(22,141,206,0.2)]">
              <Bot className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-mono font-bold text-[#E2F3FF] tracking-wider flex items-center gap-2 truncate uppercase">
                <span className="truncate">{currentSession?.title || 'AI Incident Copilot'}</span>
                <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-sm bg-[#168DCE]/20 border border-[#38BDF8]/50 text-[#38BDF8] font-mono shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.2)]">
                  HINDSIGHT RECALL
                </span>
              </h2>
              <p className="text-[11px] text-[#8BA8C2] font-mono truncate">
                {currentSession?.serviceName
                  ? `SERVICE CONTEXT: ${currentSession.serviceName}`
                  : 'MULTI-TURN SRE REASONING ENGINE'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={handleCreateNewChat}
              className="px-2.5 py-1.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white text-xs font-semibold transition-all shadow-[0_0_10px_rgba(56,189,248,0.25)] flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">NEW CHAT</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div ref={chatMessagesContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 text-xs font-semibold font-mono ${
                    isUser
                      ? 'bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] text-white border border-[#38BDF8]'
                      : 'bg-[#0A1320] border border-[#168DCE]/40 text-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`space-y-2.5 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`hud-bracket p-3.5 rounded-sm text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-[#168DCE] to-[#0D6DA5] text-white border border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                        : 'bg-[#0A1320] border border-[#168DCE]/40 text-[#E2F3FF] shadow-[0_0_12px_rgba(22,141,206,0.12)]'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>

                  {/* Confirmed Facts vs Hypotheses Box */}
                  {!isUser && (msg.confirmed_evidence?.length > 0 || msg.hypotheses?.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs w-full">
                      {/* Confirmed Facts */}
                      <div className="p-3 rounded-sm bg-[#070D18] border border-[#38BDF8]/40 space-y-1 shadow-[0_0_8px_rgba(56,189,248,0.15)]">
                        <div className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#38BDF8]" />
                          <span>CONFIRMED TELEMETRY FACTS</span>
                        </div>
                        <ul className="list-disc list-inside text-[#E2F3FF] text-[11px] space-y-0.5">
                          {msg.confirmed_evidence?.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* AI Hypotheses */}
                      <div className="p-3 rounded-sm bg-[#070D18] border border-[#168DCE]/40 space-y-1">
                        <div className="text-[10px] font-mono font-bold text-[#8BA8C2] uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#38BDF8]" />
                          <span>AI HYPOTHESES (TO VERIFY)</span>
                        </div>
                        <ul className="list-disc list-inside text-[#8BA8C2] text-[11px] space-y-0.5">
                          {msg.hypotheses?.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Recalled Memory Citations */}
                  {!isUser && msg.citations?.length > 0 && (
                    <div className="p-3 rounded-sm bg-[#070D18] border border-[#168DCE]/40 text-xs w-full space-y-1.5 shadow-[0_0_8px_rgba(22,141,206,0.1)]">
                      <div className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                        <BrainCircuit className="w-3 h-3" />
                        <span>RECALLED FROM HINDSIGHT MEMORY STORE</span>
                      </div>
                      <div className="space-y-1">
                        {msg.citations.map((c, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-sm bg-[#0A1320] border border-[#168DCE]/30 text-[11px] text-[#E2F3FF] flex items-center justify-between font-mono"
                          >
                            <span>
                              [{c.service_name || 'service'}] {c.text?.slice(0, 80)}...
                            </span>
                            {c.outcome && <OutcomeBadge outcome={c.outcome} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow up suggestions */}
                  {!isUser && msg.follow_ups?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {msg.follow_ups.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(suggestion)}
                          className="text-[11px] px-2 py-0.5 rounded-sm bg-[#0A1320] hover:bg-[#168DCE]/20 text-[#8BA8C2] hover:text-[#38BDF8] border border-[#168DCE]/35 transition-all flex items-center gap-1 font-mono"
                        >
                          <CornerDownRight className="w-2.5 h-2.5 text-[#38BDF8]" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-[#38BDF8] pl-10 font-mono">
              <Cpu className="w-3.5 h-3.5 animate-spin" />
              <span>CONSULTING HINDSIGHT MEMORY & FORMULATING HYPOTHESIS...</span>
            </div>
          )}
        </div>

        {/* Input Box & Quick Prompts */}
        <div className="p-4 border-t border-[#168DCE]/30 bg-[#0A1320]/80 space-y-2.5 shrink-0">
          {/* Quick prompt pills */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-4xl mx-auto">
            <span className="text-[10px] text-[#8BA8C2] font-semibold uppercase font-mono">PROMPTS:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="text-[11px] px-2 py-0.5 rounded-sm bg-[#070D18] hover:bg-[#168DCE]/20 border border-[#168DCE]/35 text-[#8BA8C2] hover:text-[#38BDF8] font-mono transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query system telemetry, root cause precedents, or Hindsight memory..."
              className="flex-1 bg-[#070D18] border border-[#168DCE]/40 rounded-sm px-3.5 py-2.5 text-xs text-[#E2F3FF] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_10px_rgba(56,189,248,0.3)] placeholder-[#8BA8C2]/50 font-mono shadow-inner transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] disabled:opacity-50 text-white font-mono font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all shrink-0 active:brightness-125"
            >
              <Send className="w-3.5 h-3.5" />
              <span>TRANSMIT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

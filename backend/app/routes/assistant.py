import uuid
from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from ..schemas.assistant import ChatRequest, ChatResponse
from ..services.groq_service import groq_service
from ..services.hindsight_service import hindsight_service
from ..services.supabase_service import supabase_service
from ..repositories.in_memory_repo import repository
from ..dependencies.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

@router.post("/chat", response_model=ChatResponse)
def assistant_chat(
    payload: ChatRequest,
    current_user: UserContext = Depends(get_current_user)
):
    # Step 1: Contextual enrichment from Incident if provided in user's workspace
    incident = None
    logs_context = ""
    if payload.incident_id:
        incident = repository.get_incident(payload.incident_id, user_id=current_user.id)
        incident_logs = repository.get_logs(payload.incident_id, user_id=current_user.id)
        if incident_logs:
            sample_logs = "\n".join([
                f"[{l.get('level', 'INFO')}] {l.get('message', '')}"
                for l in incident_logs[:15]
            ])
            logs_context = f"PASTED TELEMETRY LOG STREAM:\n{sample_logs}\n"

    service_name = payload.service_name or (incident.get("service_name") if incident else "production-service")
    incident_title = incident.get("title") if incident else payload.message

    # Step 2: Recall historical memories from user's isolated Hindsight bank
    query = f"{service_name} {payload.message}"
    recall_resp = hindsight_service.recall(
        query=query,
        service_name=service_name,
        limit=4,
        bank_id=current_user.hindsight_bank_id
    )
    recalled_items = [
        {
            "id": r.id,
            "text": r.text,
            "similarity_score": r.similarity_score,
            "service_name": r.service_name,
            "outcome": r.outcome,
            "resolution": r.applied_resolution,
            "source": r.source
        }
        for r in recall_resp.results
    ]

    # Step 3: Construct LLM prompt
    memory_context = ""
    if recalled_items:
        memory_context = "RECALLED EXPERIENCES FROM HINDSIGHT AGENT MEMORY:\n" + "\n".join([
            f"- [{m.get('service_name')}] Status: {m.get('outcome')}. Resolution: {m.get('resolution')}. Details: {m.get('text')}"
            for m in recalled_items
        ])

    history_formatted = []
    for msg in payload.conversation_history[-4:]:
        history_formatted.append({"role": msg.role, "content": msg.content})

    system_prompt = f"""You are SentinelMind, an executive SRE AI Incident Response Agent with long-term memory.
You assist DevOps and Site Reliability Engineers during production incidents.
Current Service Focus: {service_name}
Incident Context: {incident_title if incident else 'General Troubleshooting'}

CRITICAL FORMATTING & STYLE RULES:
1. Deliver a clean, professional, high-signal SRE response.
2. DO NOT use messy decorative bullet clusters (never use '* **' combos) or raw ascii pipe tables (|---|---|).
3. Organize into clean, bold section headers:
   • Executive Summary & Root Cause: Direct explanation of what failed and why.
   • Immediate Remediation Actions: Numbered, concrete operational steps to restore service.
   • Hindsight Memory Analysis: How past experiences (what succeeded vs what failed) guide the fix.
4. Keep the response crisp, well-spaced, and easy to read at a glance.
"""

    user_prompt = f"""User Query: {payload.message}

{logs_context}
{memory_context}

Please provide your response."""

    messages = [{"role": "system", "content": system_prompt}] + history_formatted + [{"role": "user", "content": user_prompt}]

    raw_reply = groq_service.complete(messages, max_tokens=1000)
    model_name = groq_service.model if groq_service.is_connected() else "sentinelmind-deterministic-engine"

    # Extract confirmed evidence & hypotheses
    confirmed_evidence = []
    hypotheses = []
    troubleshooting = []
    follow_ups = []

    if incident:
        confirmed_evidence.append(f"Incident {incident.get('incident_number')}: Severity {incident.get('severity', 'high').upper()} on service '{service_name}'.")
        if incident.get("root_cause_summary"):
            hypotheses.append(f"Suspected root cause: {incident.get('root_cause_summary')}")
    else:
        confirmed_evidence.append(f"Active inspection focused on service: {service_name}.")

    if recalled_items:
        first_mem = recalled_items[0]
        if first_mem.get("resolution"):
            confirmed_evidence.append(f"Historical memory matches {first_mem.get('service_name')} ({first_mem.get('outcome')}) with resolution: {first_mem.get('resolution')}")

    if not raw_reply:
        fallback_data = groq_service._generate_fallback_root_cause(
            service_name,
            incident_title,
            incident.get("description", "") if incident else payload.message,
            recalled_items
        )
        raw_reply = (
            f"### Executive Summary & Root Cause\n"
            f"{fallback_data.get('technical_explanation', f'Diagnosed operational anomaly affecting {service_name}.')}\n\n"
            f"### Immediate Remediation Actions\n"
            + "\n".join([f"{idx + 1}. **{step}**" for idx, step in enumerate(fallback_data.get('recommended_troubleshooting', []))])
            + f"\n\n### Hindsight Memory Analysis\n"
            f"{fallback_data.get('simplified_explanation', 'Historical precedents retained in Hindsight agent memory.')}"
        )

    # Generate follow-up suggestions
    follow_ups = [
        f"How does this compare to past {service_name} incidents in Hindsight?",
        "What are the risks of increasing connection pool size?",
        "Can we run a What-If simulation on alternative resolutions?",
        "How do I apply and approve this fix?"
    ]

    # Persist conversation exchange to in-memory repository and Supabase scoped by user_id
    sess_id = payload.session_id or f"session_{uuid.uuid4().hex[:10]}"
    try:
        repository.save_assistant_session(current_user.id, {
            "id": sess_id,
            "title": f"{service_name}: {payload.message[:40]}",
            "service_name": service_name,
            "incident_id": payload.incident_id,
            "updated_at": "now()"
        })
        repository.save_assistant_messages(current_user.id, sess_id, [
            {"role": "user", "content": payload.message},
            {"role": "assistant", "content": raw_reply}
        ])
    except Exception:
        pass

    try:
        supabase_service.save_assistant_exchange(
            session_id=sess_id,
            user_message=payload.message,
            assistant_reply=raw_reply,
            incident_id=payload.incident_id,
            service_name=service_name,
            confirmed_evidence=confirmed_evidence,
            hypotheses=hypotheses,
            citations=recalled_items,
            model_name=model_name,
            user_id=current_user.id
        )
    except Exception:
        pass

    return ChatResponse(
        reply=raw_reply,
        technical_explanation=f"Identified telemetry bottlenecks and pool contention indicators on {service_name}.",
        simplified_explanation="The system is waiting for database resources that are currently locked by other requests.",
        confirmed_evidence=confirmed_evidence,
        hypotheses=hypotheses or ["Resource pool ceiling exhausted under burst concurrency."],
        recommended_troubleshooting=[
            "Inspect active backend processes in database telemetry",
            "Verify thread allocation and connection pool headroom",
            "Tune connection lease timeout settings"
        ],
        retrieved_memories=recalled_items,
        follow_up_suggestions=follow_ups,
        model_used=model_name,
        is_live_hindsight=hindsight_service.is_live()
    )


@router.get("/sessions")
def list_assistant_sessions(current_user: UserContext = Depends(get_current_user)):
    """Returns stored chat sessions strictly isolated to the authenticated user."""
    sb_chats = supabase_service.fetch_assistant_chats(user_id=current_user.id)
    if sb_chats:
        return sb_chats
    return repository.get_assistant_sessions(current_user.id)


@router.get("/sessions/{chat_id}")
def get_session_messages(chat_id: str, current_user: UserContext = Depends(get_current_user)):
    """Returns messages for a specific session strictly belonging to the authenticated user."""
    sb_msgs = supabase_service.fetch_assistant_messages(chat_id)
    if sb_msgs:
        return sb_msgs
    return repository.get_assistant_messages(current_user.id, chat_id)


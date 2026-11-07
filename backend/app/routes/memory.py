from fastapi import APIRouter, Query, Depends
from typing import Optional, List
from ..services.hindsight_service import hindsight_service
from ..schemas.memory import RecallQuery, RecallResultResponse, ReflectQuery, ReflectResultResponse
from ..dependencies.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/memory", tags=["memory"])

@router.get("/items")
def list_memory_items(
    service: Optional[str] = Query(None),
    outcome: Optional[str] = Query(None),
    current_user: UserContext = Depends(get_current_user)
):
    memories = hindsight_service.get_all_memories(bank_id=current_user.hindsight_bank_id)
    if service:
        memories = [m for m in memories if m.service_name.lower() == service.lower()]
    if outcome:
        memories = [m for m in memories if m.outcome == outcome]
    return memories

@router.post("/recall", response_model=RecallResultResponse)
def recall_memories(
    payload: RecallQuery,
    current_user: UserContext = Depends(get_current_user)
):
    return hindsight_service.recall(
        query=payload.query,
        service_name=payload.service_name,
        tags=payload.tags,
        limit=payload.limit,
        bank_id=current_user.hindsight_bank_id
    )

@router.post("/reflect", response_model=ReflectResultResponse)
def reflect_memories(
    payload: ReflectQuery,
    current_user: UserContext = Depends(get_current_user)
):
    return hindsight_service.reflect(
        query=payload.query,
        context=payload.context,
        bank_id=current_user.hindsight_bank_id
    )

@router.get("/timeline")
def get_memory_timeline(current_user: UserContext = Depends(get_current_user)):
    memories = hindsight_service.get_all_memories(bank_id=current_user.hindsight_bank_id)
    sorted_mems = sorted(memories, key=lambda m: m.created_at)
    
    events = []
    for idx, m in enumerate(sorted_mems):
        events.append({
            "step": idx + 1,
            "id": m.id,
            "incident_number": m.incident_number or "INC-HIST",
            "service_name": m.service_name,
            "symptoms": m.symptoms,
            "root_cause": m.root_cause,
            "applied_resolution": m.applied_resolution,
            "outcome": m.outcome,
            "confidence_score": m.confidence_score,
            "source": m.source,
            "is_live_hindsight": m.is_live_hindsight,
            "created_at": m.created_at.isoformat(),
            "feedback_notes": m.feedback_notes,
            "tags": m.tags,
            "bank_id": current_user.hindsight_bank_id
        })
    return events

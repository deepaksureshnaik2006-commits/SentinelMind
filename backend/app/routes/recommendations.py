from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from ..schemas.recommendation import RecommendationApprovalRequest
from ..repositories.in_memory_repo import repository
from ..services.resolution_engine import resolution_engine
from ..dependencies.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.get("/{incident_id}")
def get_incident_recommendations(
    incident_id: str,
    refresh: bool = False,
    current_user: UserContext = Depends(get_current_user)
):
    inc = repository.get_incident(incident_id, user_id=current_user.id)
    if not inc:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found in your workspace"
        )
    
    recs = repository.get_recommendations(inc["id"], user_id=current_user.id)
    if not recs or refresh:
        # Generate fresh recommendations strictly within user's isolated memory bank
        fresh_recs = resolution_engine.generate_recommendations(
            incident_id=inc["id"],
            service_name=inc["service_name"],
            title=inc["title"],
            description=inc["description"],
            root_cause_summary=inc.get("root_cause_summary") or inc["title"],
            tags=inc.get("tags"),
            bank_id=current_user.hindsight_bank_id
        )
        repository.save_recommendations(inc["id"], fresh_recs, user_id=current_user.id)
        return fresh_recs
    return recs

@router.post("/generate")
def generate_recommendations_endpoint(
    payload: dict,
    current_user: UserContext = Depends(get_current_user)
):
    incident_id = payload.get("incident_id")
    inc = repository.get_incident(incident_id, user_id=current_user.id) if incident_id else None

    service_name = payload.get("service_name") or (inc.get("service_name") if inc else "service")
    title = payload.get("title") or (inc.get("title") if inc else "Incident")
    description = payload.get("description") or (inc.get("description") if inc else "")
    root_cause = payload.get("root_cause") or (inc.get("root_cause_summary") if inc else title)

    recs = resolution_engine.generate_recommendations(
        incident_id=inc["id"] if inc else "ad_hoc_inc",
        service_name=service_name,
        title=title,
        description=description,
        root_cause_summary=root_cause,
        tags=payload.get("tags"),
        bank_id=current_user.hindsight_bank_id
    )
    if inc:
        repository.save_recommendations(inc["id"], recs, user_id=current_user.id)
    return recs

@router.post("/{recommendation_id}/approve")
def approve_recommendation_by_id(
    recommendation_id: str,
    payload: Optional[RecommendationApprovalRequest] = None,
    current_user: UserContext = Depends(get_current_user)
):
    engineer_name = payload.engineer_name if payload and payload.engineer_name else (current_user.email or "Lead DevOps Engineer")
    notes = payload.approval_notes if payload else "Approved by operator"
    rec = repository.approve_recommendation(
        recommendation_id=recommendation_id,
        user_id=current_user.id,
        engineer_name=engineer_name,
        approval_notes=notes
    )
    return {
        "status": "approved",
        "recommendation_id": recommendation_id,
        "is_approved": True,
        "approved_by": engineer_name,
        "user_id": current_user.id,
        "recommendation": rec
    }

@router.post("/approve")
def approve_recommendation(
    payload: RecommendationApprovalRequest,
    current_user: UserContext = Depends(get_current_user)
):
    rec_id = payload.recommendation_id or "rec_default"
    engineer_name = payload.engineer_name or (current_user.email or "Lead DevOps Engineer")
    rec = repository.approve_recommendation(
        recommendation_id=rec_id,
        user_id=current_user.id,
        engineer_name=engineer_name,
        approval_notes=payload.approval_notes
    )
    return {
        "status": "approved",
        "recommendation_id": rec_id,
        "is_approved": True,
        "approved_by": engineer_name,
        "user_id": current_user.id,
        "recommendation": rec
    }

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from ..repositories.in_memory_repo import repository
from ..schemas.incident import IncidentCreate, IncidentUpdateStatus, IncidentResolve
from ..services.resolution_engine import resolution_engine
from ..dependencies.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.get("")
def list_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: UserContext = Depends(get_current_user)
):
    return repository.list_incidents(
        user_id=current_user.id,
        status=status,
        severity=severity,
        service=service,
        search=search
    )

@router.get("/{incident_id}")
def get_incident(
    incident_id: str,
    current_user: UserContext = Depends(get_current_user)
):
    inc = repository.get_incident(incident_id, user_id=current_user.id)
    if not inc:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found in your workspace"
        )
    
    # Attach recommendations if available
    recs = repository.get_recommendations(inc["id"], user_id=current_user.id)
    return {**inc, "recommendations": recs}

@router.post("")
def create_incident(
    payload: IncidentCreate,
    current_user: UserContext = Depends(get_current_user)
):
    data = payload.model_dump()
    data["user_id"] = current_user.id
    created = repository.create_incident(data, user_id=current_user.id)
    
    # Auto-generate initial recommendations for new incident in user's bank
    try:
        recs = resolution_engine.generate_recommendations(
            incident_id=created["id"],
            service_name=created["service_name"],
            title=created["title"],
            description=created["description"],
            root_cause_summary=created.get("root_cause_summary") or created["title"],
            tags=created.get("tags"),
            bank_id=current_user.hindsight_bank_id
        )
        repository.save_recommendations(created["id"], recs, user_id=current_user.id)
    except Exception:
        pass

    return created

@router.patch("/{incident_id}/status")
def update_status(
    incident_id: str,
    payload: IncidentUpdateStatus,
    current_user: UserContext = Depends(get_current_user)
):
    updated = repository.update_incident(incident_id, {"status": payload.status}, user_id=current_user.id)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found in your workspace"
        )
    return updated

@router.post("/{incident_id}/resolve")
def resolve_incident(
    incident_id: str,
    payload: IncidentResolve,
    current_user: UserContext = Depends(get_current_user)
):
    outcome = payload.outcome or payload.resolution_outcome or "success"
    notes = payload.post_mortem_notes or payload.engineer_feedback
    ttm = payload.time_to_mitigate_minutes or payload.time_to_fix_minutes or 15
    try:
        result = repository.resolve_incident(
            incident_id=incident_id,
            applied_resolution=payload.applied_resolution,
            outcome=outcome,
            post_mortem_notes=notes,
            time_to_mitigate_minutes=ttm,
            user_id=current_user.id
        )
        return {
            "status": "resolved",
            "incident_id": incident_id,
            "resolution_outcome": outcome,
            "hindsight_memory_id": result["hindsight"].get("memory_id"),
            "user_id": current_user.id
        }
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found in your workspace"
        )

@router.delete("/{incident_id}")
def delete_incident(
    incident_id: str,
    current_user: UserContext = Depends(get_current_user)
):
    deleted = repository.delete_incident(incident_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found in your workspace"
        )
    return {"status": "deleted", "id": incident_id}

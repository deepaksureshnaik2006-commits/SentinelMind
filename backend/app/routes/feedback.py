from fastapi import APIRouter, HTTPException
from ..schemas.feedback import FeedbackCreate
from ..repositories.in_memory_repo import repository

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

@router.post("")
def submit_feedback(payload: FeedbackCreate):
    try:
        result = repository.resolve_incident(
            incident_id=payload.incident_id,
            applied_resolution=payload.solution_applied,
            outcome=payload.outcome,
            feedback_notes=payload.feedback_notes,
            time_to_fix=payload.time_to_fix_minutes or 15
        )
        return {
            "status": "success",
            "message": "Feedback submitted and retained in Hindsight agent memory",
            "details": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


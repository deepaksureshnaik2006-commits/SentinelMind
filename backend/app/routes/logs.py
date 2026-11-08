from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional
from ..services.log_processor import log_processor
from ..repositories.in_memory_repo import repository
from ..services.resolution_engine import resolution_engine
from ..services.supabase_service import supabase_service
from ..schemas.log import LogAnalysisRequest, LogAnalysisResult
from ..dependencies.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/logs", tags=["logs"])

def _persist_analysis_and_logs(result: LogAnalysisResult, user: UserContext) -> LogAnalysisResult:
    service_name = result.service_detected or "application-service"

    # 1. Check if an open incident exists for this service in the user's private workspace
    open_incidents = [
        i for i in repository.list_incidents(user_id=user.id)
        if i.get("service_name") == service_name and i.get("status") == "open"
    ]
    if open_incidents:
        target_incident = open_incidents[0]
    else:
        patterns = result.error_patterns or []
        target_incident = repository.create_incident({
            "service_name": service_name,
            "title": result.suggested_title or f"{service_name}: Anomaly Detected",
            "description": result.explanation or "Ingested telemetry logs indicating service failure",
            "severity": result.detected_severity or "critical",
            "status": "open",
            "tags": [service_name, result.detected_severity] + patterns,
            "root_cause_summary": patterns[0] if patterns else (result.suggested_title or "Telemetry resource exhaustion"),
            "user_id": user.id
        }, user_id=user.id)

    inc_id = target_incident["id"]
    inc_num = target_incident.get("incident_number") or f"INC-2026-{inc_id[:6]}"

    # 2. Formulate recommendations in user's isolated memory bank
    existing_recs = repository.get_recommendations(inc_id, user_id=user.id)
    if not existing_recs:
        recs = resolution_engine.generate_recommendations(
            incident_id=inc_id,
            service_name=service_name,
            title=target_incident["title"],
            description=target_incident["description"],
            root_cause_summary=target_incident.get("root_cause_summary") or target_incident["title"],
            tags=target_incident.get("tags"),
            bank_id=user.hindsight_bank_id
        )
        repository.save_recommendations(inc_id, recs, user_id=user.id)

    # 3. Persist log entries into user workspace
    entries_dicts = [e.model_dump() if hasattr(e, "model_dump") else dict(e) for e in result.parsed_entries]
    repository.save_logs(inc_id, entries_dicts, user_id=user.id)
    repository.save_logs(inc_num, entries_dicts, user_id=user.id)

    if supabase_service.is_configured():
        try:
            supabase_service.insert_logs(inc_id, service_name, entries_dicts)
        except Exception:
            pass

    result.incident_id = inc_id
    result.incident_number = inc_num
    result.logs_persisted_count = len(entries_dicts)
    return result

@router.post("/analyze", response_model=LogAnalysisResult)
async def analyze_logs(
    file: Optional[UploadFile] = File(None),
    raw_content: Optional[str] = Form(None),
    current_user: UserContext = Depends(get_current_user)
):
    content = ""
    filename = "log_upload.log"

    if file:
        filename = file.filename or "upload.log"
        bytes_data = await file.read()
        content = bytes_data.decode("utf-8", errors="replace")
    elif raw_content:
        content = raw_content
    else:
        raise HTTPException(status_code=400, detail="Either file upload or raw_content must be provided")

    if not content.strip():
        raise HTTPException(status_code=400, detail="Log content cannot be empty")

    parsed = log_processor.parse_logs(content, filename)
    return _persist_analysis_and_logs(parsed, user=current_user)

@router.post("/analyze-json", response_model=LogAnalysisResult)
def analyze_logs_json(
    payload: LogAnalysisRequest,
    current_user: UserContext = Depends(get_current_user)
):
    if not payload.raw_logs.strip():
        raise HTTPException(status_code=400, detail="raw_logs cannot be empty")
    parsed = log_processor.parse_logs(payload.raw_logs, payload.file_name or "upload.log")
    return _persist_analysis_and_logs(parsed, user=current_user)

@router.get("/incident/{incident_id}")
def get_incident_logs(
    incident_id: str,
    current_user: UserContext = Depends(get_current_user)
):
    # Verify the user owns this incident
    inc = repository.get_incident(incident_id, user_id=current_user.id)
    if not inc:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found in your workspace"
        )
    return repository.get_logs(incident_id, user_id=current_user.id)

@router.post("/create-incident")
def create_incident_from_analysis(
    payload: dict,
    current_user: UserContext = Depends(get_current_user)
):
    service_name = payload.get("service_detected", "application-service")
    title = payload.get("suggested_title", f"{service_name} Incident")
    explanation = payload.get("explanation", "")
    severity = payload.get("detected_severity", "high")
    patterns = payload.get("error_patterns", [])

    created = repository.create_incident({
        "service_name": service_name,
        "title": title,
        "description": explanation,
        "severity": severity,
        "status": "open",
        "tags": [service_name, severity] + patterns,
        "root_cause_summary": patterns[0] if patterns else "Unspecified error pattern",
        "user_id": current_user.id
    }, user_id=current_user.id)

    # Trigger resolution recommendations strictly in user's isolated memory bank
    recs = resolution_engine.generate_recommendations(
        incident_id=created["id"],
        service_name=service_name,
        title=title,
        description=explanation,
        root_cause_summary=created["root_cause_summary"],
        tags=created["tags"],
        bank_id=current_user.hindsight_bank_id
    )
    repository.save_recommendations(created["id"], recs, user_id=current_user.id)

    if payload.get("parsed_entries") and supabase_service.is_configured():
        try:
            supabase_service.insert_logs(created["id"], service_name, payload.get("parsed_entries", []))
        except Exception:
            pass

    return {
        "incident": created,
        "recommendations": recs
    }

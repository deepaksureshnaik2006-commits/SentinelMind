import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.repositories.in_memory_repo import repository
from app.routes.incidents import resolve_incident
from app.schemas.incident import IncidentResolve
from app.dependencies.auth import UserContext

def test_resolve_endpoint():
    user = UserContext(user_id="test_user_resolve", email="test@domain.com")

    inc = repository.create_incident({
        "service_name": "auth-service",
        "title": "Token timeout",
        "description": "Auth token keys timeout",
        "severity": "critical",
        "status": "open"
    }, user_id=user.id)

    payload = IncidentResolve(
        applied_resolution="Rotated JWKS cache keys and increased proxy timeout to 15s",
        resolution_outcome="success",
        engineer_feedback="SLA restored",
        time_to_fix_minutes=10
    )

    result = resolve_incident(incident_id=inc["id"], payload=payload, current_user=user)
    assert result["status"] == "resolved", f"Expected resolved status, got {result.get('status')}"
    assert "incident" in result, "Expected 'incident' object in result"
    assert result["incident"]["status"] == "resolved", f"Expected incident status to be resolved, got {result['incident']['status']}"
    assert result.get("hindsight_memory_id") is not None, "Expected hindsight_memory_id to be populated"
    print("SUCCESS: resolve_incident route returns proper incident object and memory ID!")

    # Cleanup
    repository.purge_user_data(user.id)

if __name__ == "__main__":
    test_resolve_endpoint()

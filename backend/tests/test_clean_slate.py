import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.repositories.in_memory_repo import repository
from app.services.hindsight_service import hindsight_service

def test_clean_state():
    test_user_id = "user_clean_test_999"
    test_bank_id = f"bank_{test_user_id}"

    # 1. Fresh user should have empty incidents, empty services, empty memories
    incidents = repository.list_incidents(user_id=test_user_id)
    assert len(incidents) == 0, f"Expected 0 incidents, got {len(incidents)}"

    services = repository.list_services(user_id=test_user_id)
    assert len(services) == 0, f"Expected 0 services, got {len(services)}"

    memories = hindsight_service.get_all_memories(bank_id=test_bank_id)
    assert len(memories) == 0, f"Expected 0 memories, got {len(memories)}"

    # 2. When an incident is created for a user with service "auth-service"
    inc = repository.create_incident({
        "service_name": "auth-service",
        "title": "Token signing timeout",
        "description": "JWT RSA signing keys timed out",
        "severity": "high",
        "status": "open"
    }, user_id=test_user_id)

    # 3. Service list should now dynamically contain "auth-service" and only that!
    updated_services = repository.list_services(user_id=test_user_id)
    svc_names = [s["name"] for s in updated_services]
    assert "auth-service" in svc_names, f"Expected auth-service in {svc_names}"
    assert len(svc_names) == 1, f"Expected exactly 1 service, got {svc_names}"

    # Clean up
    repository.purge_user_data(test_user_id)
    print("SUCCESS: Clean slate verification passed!")

if __name__ == "__main__":
    test_clean_state()


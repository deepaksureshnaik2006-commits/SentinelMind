import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.repositories.in_memory_repo import repository
from app.services.supabase_service import supabase_service

def test_supabase_persistence():
    test_user = "user_e2e_persistence_test"
    
    # 1. Clean slate
    repository.purge_user_data(test_user)
    supabase_service.delete_user_records(test_user)
    
    # 2. Create incident via repository
    inc = repository.create_incident({
        "service_name": "auth-service",
        "title": "Token JWKS Verification Timeout",
        "description": "JWKS key fetch timed out on auth-service",
        "severity": "critical",
        "status": "open"
    }, user_id=test_user)
    
    inc_id = inc["id"]
    print("Created incident:", inc["incident_number"], inc_id)
    
    # Verify it exists in Supabase
    db_items = supabase_service.fetch_incidents_for_user(test_user)
    assert len(db_items) > 0, "Expected incident to be saved in Supabase"
    assert any(i["id"] == supabase_service.to_uuid(inc_id, "sentinelmind.incident") or i["incident_number"] == inc["incident_number"] for i in db_items), "Incident not found in Supabase"
    print("Verified: Saved in Supabase PostgreSQL table!")
    
    # 3. Simulate server restart / RAM cache wipe
    repository.incidents_by_user.clear()
    
    # 4. Now call list_incidents - it should re-hydrate from Supabase!
    rehydrated = repository.list_incidents(user_id=test_user)
    assert len(rehydrated) > 0, "Expected incidents to re-hydrate from Supabase"
    print(f"Verified: Successfully hydrated {len(rehydrated)} incidents from Supabase after RAM wipe!")
    
    # 5. Clean up
    repository.delete_incident(inc_id, user_id=test_user)
    supabase_service.delete_user_records(test_user)
    print("SUCCESS: Full database persistence verified!")

if __name__ == "__main__":
    test_supabase_persistence()


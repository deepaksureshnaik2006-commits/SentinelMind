import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_api_root(client):
    response = client.get("/api")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

def test_list_incidents(client):
    response = client.get("/api/incidents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3

def test_create_and_resolve_incident(client):
    create_resp = client.post("/api/incidents", json={
        "service_name": "payment-service",
        "title": "Payment gateway checkout timeout",
        "description": "47 transactions failed due to database timeout",
        "severity": "critical",
        "tags": ["payment", "database", "timeout"]
    })
    assert create_resp.status_code == 200
    inc_data = create_resp.json()
    inc_id = inc_data["id"]

    get_resp = client.get(f"/api/incidents/{inc_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == "open"

    resolve_resp = client.post(f"/api/incidents/{inc_id}/resolve", json={
        "applied_resolution": "Scaled connection pool from 10 to 25",
        "resolution_outcome": "success",
        "engineer_feedback": "Queue drained in under 1 minute; all checkouts cleared",
        "time_to_fix_minutes": 12
    })
    assert resolve_resp.status_code == 200
    res_data = resolve_resp.json()
    assert res_data["incident"]["status"] == "resolved"
    assert res_data["incident"]["resolution_outcome"] == "success"
    assert "memory_id" in res_data["retain_result"]

def test_log_analysis_api(client):
    sample_log = """2026-11-07T08:14:05.312Z [payment-service] [ERROR] PSQLException: Connection refused or timed out after 30000ms.
2026-11-07T08:14:07.460Z [payment-service] [FATAL] Transaction failed: Database connection timeout during lock acquisition."""
    
    resp = client.post("/api/logs/analyze-json", json={
        "raw_logs": sample_log,
        "file_name": "test_error.log"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["service_detected"] == "payment-service"
    assert data["detected_severity"] == "critical"

def test_simulation_distinct_options_for_services(client):
    gateway_resp = client.post("/api/simulator/simulate", json={
        "service_name": "api-gateway",
        "incident_description": "Ingress Gateway Upstream Timeout on Checkout. Upstream service latency exceeded SLA threshold, resulting in cascading 504 errors on edge proxy."
    })
    assert gateway_resp.status_code == 200
    gw_data = gateway_resp.json()
    gw_titles = [opt["title"] for opt in gw_data["options"]]
    assert any("Circuit Breaker" in t for t in gw_titles)

    billing_resp = client.post("/api/simulator/simulate", json={
        "service_name": "billing-engine",
        "incident_description": "Thread Starvation During Monthly Invoicing. Worker threads locked waiting for socket connections; service became unresponsive."
    })
    assert billing_resp.status_code == 200
    bill_data = billing_resp.json()
    bill_titles = [opt["title"] for opt in bill_data["options"]]
    assert any("Batch" in t or "Worker" in t for t in bill_titles)
    assert gw_titles != bill_titles

def test_delete_incident_and_analytics_sync(client):
    create_resp = client.post("/api/incidents", json={
        "service_name": "inventory-svc",
        "title": "Inventory stock sync lock",
        "description": "Stock lock blocked order processing",
        "severity": "medium",
        "tags": ["inventory"]
    })
    assert create_resp.status_code == 200
    inc_id = create_resp.json()["id"]

    analytics_before = client.get("/api/analytics/dashboard").json()
    services_before = {s["service"]: s["count"] for s in analytics_before["service_distribution"]}
    assert "inventory-svc" in services_before

    del_resp = client.delete(f"/api/incidents/{inc_id}")
    assert del_resp.status_code == 200

    analytics_after = client.get("/api/analytics/dashboard").json()
    services_after = {s["service"]: s["count"] for s in analytics_after["service_distribution"]}
    assert services_after.get("inventory-svc", 0) == services_before["inventory-svc"] - 1

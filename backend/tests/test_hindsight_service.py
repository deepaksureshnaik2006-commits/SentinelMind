import pytest
from app.services.hindsight_service import hindsight_service

def test_hindsight_retain_and_recall():
    # Retain a specific experience
    res = hindsight_service.retain(
        incident_id="test-inc-01",
        service_name="payment-service",
        symptoms="HikariPool connection timeout after 30000ms",
        root_cause="Connection pool max size too small (10 connections)",
        solution_applied="Increased connection pool size to 25",
        outcome="success",
        feedback_notes="Checkout queue emptied within 2 minutes.",
        tags=["payment-service", "database", "pool", "timeout"]
    )
    assert res["status"] == "retained"
    assert "memory_id" in res
    assert res["source"] in ["hindsight_cloud", "simulated_local"]

    # Recall the experience
    recalled = hindsight_service.recall(
        query="database connection timeout pool exhausted",
        service_name="payment-service"
    )
    assert recalled.count > 0
    assert any("25" in r.text or "payment-service" in r.text for r in recalled.results)

def test_hindsight_reflect():
    resp = hindsight_service.reflect(
        query="What is the recommended resolution for database connection pool exhaustion?"
    )
    assert resp.synthesized_answer != ""
    assert "Incident" in resp.synthesized_answer or "historical" in resp.synthesized_answer.lower()


"""
End-to-end demonstration workflow verification script for SentinelMind.
Simulates Steps 1 through 9 defined in the hackathon prompt.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

def run_demo_workflow():
    client = TestClient(app)
    print("=================================================================")
    print("SENTINELMIND: STARTING 9-STEP AI AGENT MEMORY DEMONSTRATION")
    print("=================================================================\n")

    # STEP 1: Upload log file containing database connection timeout
    print("▶ STEP 1: Uploading Log #1 (Payment Service DB Connection Timeout)...")
    log_content_1 = """2026-11-07T08:14:05.312Z [payment-service] [WARN] HikariPool-1 - Connection pool acquisition approaching timeout (2850ms elapsed, 10/10 active connections)
2026-11-07T08:14:07.450Z [payment-service] [ERROR] org.postgresql.util.PSQLException: Connection to 10.0.4.12:5432 refused or timed out after 30000ms.
2026-11-07T08:14:07.452Z [payment-service] [ERROR] HikariPool-1 - Connection is not available, request timed out after 30002ms (active=10, idle=0, waiting=47).
2026-11-07T08:14:07.460Z [payment-service] [FATAL] Transaction failed: Database connection timeout during lock acquisition on orders table.
2026-11-07T08:14:08.001Z [payment-service] [ERROR] HTTP 500 Internal Server Error returned to checkout gateway for 47 queued requests."""

    resp_1 = client.post("/api/logs/analyze-json", json={"raw_logs": log_content_1, "file_name": "payment_timeout.log"})
    assert resp_1.status_code == 200
    analysis_1 = resp_1.json()
    print(f"  ✓ Analysis Detected: Service='{analysis_1['service_detected']}', Severity='{analysis_1['detected_severity']}'")
    print(f"  ✓ Detected Patterns: {analysis_1['error_patterns']}")
    print(f"  ✓ Explanation: {analysis_1['explanation']}\n")

    # STEP 2: Create Incident from Analysis
    print("▶ STEP 2: Creating Incident from Analysis...")
    resp_2 = client.post("/api/logs/create-incident", json=analysis_1)
    assert resp_2.status_code == 200
    inc_1 = resp_2.json()["incident"]
    inc_1_id = inc_1["id"]
    print(f"  ✓ Created Incident: {inc_1['incident_number']} (ID: {inc_1_id})")
    print(f"  ✓ Title: {inc_1['title']}\n")

    # STEP 3: AI Assistant Identifies Root Cause
    print("▶ STEP 3: AI Assistant Diagnosis...")
    resp_3 = client.post("/api/assistant/chat", json={
        "message": "What is the root cause and recommended troubleshooting?",
        "incident_id": inc_1_id,
        "service_name": inc_1["service_name"]
    })
    assert resp_3.status_code == 200
    chat_1 = resp_3.json()
    print(f"  ✓ Model Used: {chat_1['model_used']}")
    print(f"  ✓ Confirmed Facts: {chat_1['confirmed_evidence']}")
    print(f"  ✓ Hypotheses: {chat_1['hypotheses']}\n")

    # STEP 4: Initial Recommendations (Notice cold memory: no prior similar resolutions)
    print("▶ STEP 4: Checking Initial Recommendations (Cold Memory)...")
    resp_4 = client.get(f"/api/recommendations/{inc_1_id}")
    assert resp_4.status_code == 200
    recs_1 = resp_4.json()
    assert len(recs_1) > 0
    print(f"  ✓ Initial Recommendation: {recs_1[0]['title']}")
    print(f"  ✓ Confidence: {recs_1[0]['confidence_score']}%")
    print(f"  ✓ Reasoning: {recs_1[0]['confidence_reasoning']}\n")

    # STEP 5 & 6: Engineer Applies Fix and Submits Feedback -> Retained in Hindsight
    print("▶ STEP 5 & 6: Engineer Applies Solution & Retains in Hindsight Memory...")
    solution_applied = "Scaled HikariPool max-size from 10 to 25 and tuned connection timeout to 45s"
    feedback_notes = "Queue drained in 45 seconds; zero dropped transactions during traffic burst."
    
    resp_5 = client.post(f"/api/incidents/{inc_1_id}/resolve", json={
        "applied_resolution": solution_applied,
        "resolution_outcome": "success",
        "engineer_feedback": feedback_notes,
        "time_to_fix_minutes": 14
    })
    assert resp_5.status_code == 200
    resolve_data = resp_5.json()
    memory_id = resolve_data["retain_result"]["memory_id"]
    source = resolve_data["retain_result"]["source"]
    print(f"  ✓ Incident Status: {resolve_data['incident']['status'].upper()}")
    print(f"  ✓ Retained in Hindsight: Memory ID = '{memory_id}' (Source: {source})\n")

    # STEP 7: Upload Log #2 with Similar Incident on ANOTHER service (billing-engine)
    print("▶ STEP 7: Uploading Log #2 (Billing Service Experiences Similar DB Timeout)...")
    log_content_2 = """2026-11-07T10:22:20.104Z [billing-engine] [WARN] Connection lease wait time elevated: 4200ms on primary pg_pool
2026-11-07T10:22:25.401Z [billing-engine] [ERROR] PSQLException: HikariPool-Billing - Connection pool exhausted (active=15, idle=0, waiting=62).
2026-11-07T10:22:25.405Z [billing-engine] [ERROR] Connection acquisition timed out after 30000ms. Could not checkout connection for invoice #88129.
2026-11-07T10:22:26.012Z [billing-engine] [FATAL] Critical billing failure: 62 subscription renewal transactions failed due to database connection timeout."""

    resp_7 = client.post("/api/logs/analyze-json", json={"raw_logs": log_content_2, "file_name": "billing_timeout.log"})
    assert resp_7.status_code == 200
    analysis_2 = resp_7.json()
    resp_7_inc = client.post("/api/logs/create-incident", json=analysis_2)
    inc_2 = resp_7_inc.json()["incident"]
    inc_2_id = inc_2["id"]
    print(f"  ✓ Created Incident: {inc_2['incident_number']} (Service: {inc_2['service_name']})\n")

    # STEP 8: Agent Recalls Earlier Experience and Improves Recommendation!
    print("▶ STEP 8: Agent Recalls Hindsight Experience & Improves Recommendation...")
    resp_8 = client.get(f"/api/recommendations/{inc_2_id}")
    assert resp_8.status_code == 200
    recs_2 = resp_8.json()
    assert len(recs_2) > 0
    improved_rec = recs_2[0]
    print(f"  ✓ Improved Recommendation: {improved_rec['title']}")
    print(f"  ✓ Confidence Score (Boosted from Memory): {improved_rec['confidence_score']}%")
    print(f"  ✓ Historical Precedents Cited: {len(improved_rec['historical_precedents'])}")
    print(f"  ✓ Successful Approaches Learned: {improved_rec['successful_approaches']}")
    print(f"  ✓ Explainability Reasoning:\n    \"{improved_rec['confidence_reasoning']}\"\n")

    # STEP 9: Memory Explorer Timeline Displays the Newly Retained Experience
    print("▶ STEP 9: Inspecting Memory Explorer Timeline & Knowledge Growth...")
    resp_9 = client.get("/api/memory/timeline")
    assert resp_9.status_code == 200
    timeline = resp_9.json()
    print(f"  ✓ Total Memory Evolution Steps: {len(timeline)}")
    latest_event = timeline[-1]
    print(f"  ✓ Latest Retained Event: Incident {latest_event['incident_number']} ({latest_event['service_name']})")
    print(f"  ✓ Applied Resolution: {latest_event['applied_resolution']}")
    print(f"  ✓ Outcome: {latest_event['outcome'].upper()}")
    print(f"  ✓ Learning Impact: {latest_event['learning_impact']}")

    print("\n=================================================================")
    print("DEMONSTRATION WORKFLOW COMPLETED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    run_demo_workflow()

import pytest
from app.services.log_processor import log_processor

def test_parse_standard_log():
    raw_log = """2026-11-07T08:14:05.312Z [payment-service] [WARN] HikariPool-1 - Connection pool approaching timeout
2026-11-07T08:14:07.450Z [payment-service] [ERROR] PSQLException: Connection refused or timed out after 30000ms.
2026-11-07T08:14:07.460Z [payment-service] [FATAL] Transaction failed: Database connection timeout during lock acquisition."""
    
    result = log_processor.parse_logs(raw_log, "test.log")
    assert result.service_detected == "payment-service"
    assert result.detected_severity == "critical"
    assert result.error_count >= 2
    assert "Connection or Request Timeout" in result.error_patterns or "PostgreSQL Database Connection Failure" in result.error_patterns
    assert len(result.parsed_entries) == 3

def test_parse_json_log():
    raw_json = """[
        {"timestamp": "2026-11-07T07:30:00Z", "service": "api-gateway", "level": "INFO", "message": "Routing request"},
        {"timestamp": "2026-11-07T07:30:10Z", "service": "api-gateway", "level": "ERROR", "message": "HTTP 504 Gateway Timeout: Upstream inventory-svc timed out"}
    ]"""
    result = log_processor.parse_logs(raw_json, "test.json")
    assert result.service_detected == "api-gateway"
    assert result.detected_severity == "high"
    assert result.error_count == 1
    assert "HTTP 504 Gateway Timeout" in result.error_patterns


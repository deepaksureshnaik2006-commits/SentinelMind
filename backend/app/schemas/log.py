from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

class LogEntry(BaseModel):
    id: Optional[str] = None
    timestamp: Optional[datetime] = None
    level: str = "INFO"
    service_name: Optional[str] = None
    message: str
    raw_entry: str
    error_pattern: Optional[str] = None
    is_anomaly: bool = False
    context_data: Dict[str, Any] = Field(default_factory=dict)

class LogAnalysisRequest(BaseModel):
    raw_logs: str
    file_name: Optional[str] = "upload.log"

class LogAnalysisResult(BaseModel):
    service_detected: str
    detected_severity: Literal['critical', 'high', 'medium', 'low']
    suggested_title: str
    explanation: str
    error_patterns: List[str] = Field(default_factory=list)
    anomalies_detected: List[Dict[str, Any]] = Field(default_factory=list)
    total_lines: int
    error_count: int
    warn_count: int
    info_count: int
    parsed_entries: List[LogEntry] = Field(default_factory=list)
    extracted_context: Dict[str, Any] = Field(default_factory=dict)
    incident_id: Optional[str] = None
    incident_number: Optional[str] = None
    logs_persisted_count: int = 0


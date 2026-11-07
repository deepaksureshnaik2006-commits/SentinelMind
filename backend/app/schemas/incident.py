from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

class IncidentBase(BaseModel):
    service_name: str
    title: str
    description: str
    severity: Literal['critical', 'high', 'medium', 'low'] = 'high'
    status: Literal['open', 'investigating', 'mitigated', 'resolved', 'closed'] = 'open'
    tags: List[str] = Field(default_factory=list)

class IncidentCreate(IncidentBase):
    incident_number: Optional[str] = None
    detected_at: Optional[datetime] = None
    raw_logs: Optional[str] = None

class IncidentUpdateStatus(BaseModel):
    status: Literal['open', 'investigating', 'mitigated', 'resolved', 'closed']
    notes: Optional[str] = None

class IncidentResolve(BaseModel):
    applied_resolution: str
    resolution_outcome: Optional[Literal['success', 'failure', 'partial']] = 'success'
    outcome: Optional[Literal['success', 'failure', 'partial']] = None
    engineer_feedback: Optional[str] = None
    post_mortem_notes: Optional[str] = None
    time_to_fix_minutes: Optional[int] = 15
    time_to_mitigate_minutes: Optional[int] = None

class Incident(IncidentBase):
    id: str
    incident_number: str
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_time_minutes: Optional[int] = None
    root_cause_summary: Optional[str] = None
    applied_resolution: Optional[str] = None
    resolution_outcome: Optional[Literal['success', 'failure', 'partial']] = None
    hindsight_memory_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


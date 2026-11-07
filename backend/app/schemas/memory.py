from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

class MemoryItem(BaseModel):
    id: str
    bank_id: str = "sentinelmind-incidents"
    incident_id: Optional[str] = None
    incident_number: Optional[str] = None
    service_name: str
    symptoms: str
    root_cause: str
    applied_resolution: str
    outcome: Literal['success', 'failure', 'partial']
    confidence_score: float = 0.90
    source: Literal['hindsight_cloud', 'simulated_local']
    is_live_hindsight: bool = False
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    feedback_notes: Optional[str] = None

class RetainPayload(BaseModel):
    incident_id: str
    service_name: str
    symptoms: str
    root_cause: str
    solution_applied: str
    outcome: Literal['success', 'failure', 'partial']
    feedback_notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class RecallQuery(BaseModel):
    query: str
    service_name: Optional[str] = None
    tags: Optional[List[str]] = None
    limit: int = 5

class RecallResultItem(BaseModel):
    id: str
    text: str
    similarity_score: float
    service_name: Optional[str] = None
    outcome: Optional[str] = None
    applied_resolution: Optional[str] = None
    root_cause: Optional[str] = None
    timestamp: Optional[datetime] = None
    source: str = "hindsight"

class RecallResultResponse(BaseModel):
    query: str
    count: int
    is_live_hindsight: bool
    results: List[RecallResultItem] = Field(default_factory=list)
    execution_time_ms: float

class ReflectQuery(BaseModel):
    query: str
    context: Optional[str] = None

class ReflectResultResponse(BaseModel):
    query: str
    synthesized_answer: str
    is_live_hindsight: bool
    cited_memories: List[Dict[str, Any]] = Field(default_factory=list)
    execution_time_ms: float


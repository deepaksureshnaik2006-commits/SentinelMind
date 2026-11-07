from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

class HistoricalPrecedent(BaseModel):
    incident_id: Optional[str] = None
    incident_number: Optional[str] = None
    service_name: str
    symptoms: str
    applied_resolution: str
    outcome: Literal['success', 'failure', 'partial']
    relevance_score: float = 0.85
    memory_id: Optional[str] = None

class Recommendation(BaseModel):
    id: str
    incident_id: str
    title: str
    action_type: str # config_change, restart, scale, query_optimization, code_patch
    steps: List[str] = Field(default_factory=list)
    confidence_score: float # 0.0 to 100.0%
    confidence_reasoning: str
    historical_precedents: List[HistoricalPrecedent] = Field(default_factory=list)
    successful_approaches: List[Dict[str, Any]] = Field(default_factory=list)
    failed_approaches: List[Dict[str, Any]] = Field(default_factory=list)
    risk_assessment: Dict[str, Any] = Field(default_factory=dict)
    hindsight_memory_cited: List[str] = Field(default_factory=list)
    is_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RecommendationApprovalRequest(BaseModel):
    is_approved: bool = True
    recommendation_id: Optional[str] = None
    incident_id: Optional[str] = None
    engineer_name: Optional[str] = "DevOps Lead"
    approval_notes: Optional[str] = None


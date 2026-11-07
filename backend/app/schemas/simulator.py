from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

class SimulationOption(BaseModel):
    id: str
    title: str
    action: str
    description: str
    historical_evidence: str
    predicted_outcome: Literal['success', 'failure', 'partial']
    success_probability: float # 0 to 100%
    potential_risks: List[str] = Field(default_factory=list)
    expected_impact: Dict[str, str] = Field(default_factory=dict)
    reasoning: str
    relevant_past_incidents: List[str] = Field(default_factory=list)

class SimulationRequest(BaseModel):
    incident_id: Optional[str] = None
    service_name: str
    incident_description: str
    candidate_options: Optional[List[str]] = None

class SimulationResponse(BaseModel):
    incident_context: str
    options: List[SimulationOption] = Field(default_factory=list)
    recommended_option_id: str
    confidence_score: float
    disclaimer: str = "Predicted outcomes are decision-support estimates derived from historical Hindsight memory and AI reasoning. No live infrastructure modifications are performed."


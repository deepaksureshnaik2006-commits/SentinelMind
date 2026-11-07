from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class FeedbackCreate(BaseModel):
    incident_id: str
    recommendation_id: Optional[str] = None
    outcome: Literal['success', 'failure', 'partial']
    solution_applied: str
    feedback_notes: Optional[str] = None
    time_to_fix_minutes: Optional[int] = 15

class Feedback(FeedbackCreate):
    id: str
    retained_in_hindsight: bool = False
    hindsight_operation_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


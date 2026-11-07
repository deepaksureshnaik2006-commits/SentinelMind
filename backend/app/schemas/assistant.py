from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

class ChatMessage(BaseModel):
    role: Literal['user', 'assistant', 'system']
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    confirmed_evidence: Optional[List[str]] = None
    hypotheses: Optional[List[str]] = None
    citations: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    message: str
    incident_id: Optional[str] = None
    service_name: Optional[str] = None
    session_id: Optional[str] = None
    conversation_history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str
    technical_explanation: Optional[str] = None
    simplified_explanation: Optional[str] = None
    confirmed_evidence: List[str] = Field(default_factory=list)
    hypotheses: List[str] = Field(default_factory=list)
    recommended_troubleshooting: List[str] = Field(default_factory=list)
    retrieved_memories: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up_suggestions: List[str] = Field(default_factory=list)
    model_used: str
    is_live_hindsight: bool = False


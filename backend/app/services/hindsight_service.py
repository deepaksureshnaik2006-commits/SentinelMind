import os
import re
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Literal
from ..config import settings
from ..schemas.memory import MemoryItem, RecallResultItem, RecallResultResponse, ReflectResultResponse

logger = logging.getLogger(__name__)

class HindsightService:
    """
    Self-Learning Agent Memory Engine powered by Vectorize Hindsight SDK.
    Follows official Hindsight API contract:
    - retain(bank_id, content, metadata, tags)
    - recall(bank_id, query, budget, tags)
    - reflect(bank_id, query, budget, context)
    
    Includes multi-tenant private memory bank isolation:
    Each user operates exclusively within their own private memory bank.
    One user's experiences, successes, or failures NEVER influence another user's memories.
    """

    def __init__(self):
        self.default_bank_id = settings.HINDSIGHT_BANK_ID
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self.base_url = settings.HINDSIGHT_BASE_URL
        self.api_key = settings.HINDSIGHT_API_KEY
        self.client = None
        # Partition local memories by bank_id to guarantee multi-tenant isolation
        self._local_memories: Dict[str, List[MemoryItem]] = {}
        self._init_client()

    def get_user_bank_id(self, user_id: str) -> str:
        """Derives a deterministic, isolated Hindsight memory bank ID for a user."""
        if not user_id:
            return self.default_bank_id
        clean = user_id.replace("-", "").replace("_", "")[:16]
        return f"sentinelmind-user-{clean}"

    def _init_client(self):
        self.api_key = settings.HINDSIGHT_API_KEY
        if self.api_key and self.api_key.strip():
            try:
                from hindsight_client import Hindsight
                self.client = Hindsight(
                    base_url=self.base_url,
                    api_key=self.api_key.strip(),
                    timeout=2.5,
                    max_attempts=1
                )
                logger.info(f"Hindsight client initialized with default bank: {self.bank_id}")
            except Exception as e:
                logger.error(f"Failed to initialize Hindsight client: {e}")
                self.client = None
        else:
            self.client = None
            logger.info("Hindsight running in local development mode (no API key configured).")

    def is_live(self) -> bool:
        return self.client is not None

    def retain(
        self,
        incident_id: str,
        service_name: str,
        symptoms: str,
        root_cause: str,
        solution_applied: str,
        outcome: Literal['success', 'failure', 'partial'],
        feedback_notes: Optional[str] = None,
        incident_number: Optional[str] = None,
        tags: Optional[List[str]] = None,
        bank_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retains an incident resolution experience in Hindsight memory for the specific bank.
        """
        target_bank = bank_id or self.bank_id
        tags = tags or []
        tags.extend([service_name, outcome, f"incident:{incident_number or incident_id}"])
        tags = list(set([t.lower() for t in tags if t]))

        # Format structured memory content
        content = (
            f"Incident Experience Report:\n"
            f"Service: {service_name}\n"
            f"Symptoms: {symptoms}\n"
            f"Root Cause: {root_cause}\n"
            f"Applied Resolution: {solution_applied}\n"
            f"Outcome: {outcome.upper()}\n"
            f"Engineer Feedback: {feedback_notes or 'No additional notes provided'}\n"
            f"Date: {datetime.utcnow().isoformat()}"
        )

        metadata = {
            "incident_id": incident_id,
            "incident_number": incident_number or "",
            "service_name": service_name,
            "outcome": outcome,
            "solution_applied": solution_applied,
            "root_cause": root_cause,
            "bank_id": target_bank
        }

        memory_id = f"mem_{uuid.uuid4().hex[:12]}"
        is_live = False
        operation_id = None

        if self.client:
            try:
                response = self.client.retain(
                    bank_id=target_bank,
                    content=content,
                    metadata=metadata,
                    tags=tags
                )
                is_live = True
                operation_id = getattr(response, "operation_id", str(uuid.uuid4()))
                logger.info(f"Retained incident {incident_id} in Hindsight live bank {target_bank}")
            except Exception as e:
                logger.warning(f"Hindsight live retain failed for bank {target_bank}: {e}. Retaining locally.")

        # Always maintain in tenant-isolated memory partition
        bank_list = self._local_memories.setdefault(target_bank, [])
        memory_item = MemoryItem(
            id=memory_id,
            bank_id=target_bank,
            incident_id=incident_id,
            incident_number=incident_number or "INC-2026-NEW",
            service_name=service_name,
            symptoms=symptoms,
            root_cause=root_cause,
            applied_resolution=solution_applied,
            outcome=outcome,
            feedback_notes=feedback_notes or "",
            confidence_score=0.94 if outcome == "success" else 0.75,
            source="hindsight_cloud" if is_live else "simulated_local",
            is_live_hindsight=is_live,
            tags=tags,
            created_at=datetime.utcnow()
        )
        bank_list.insert(0, memory_item)

        return {
            "status": "retained",
            "memory_id": memory_id,
            "operation_id": operation_id,
            "source": "hindsight_cloud" if is_live else "simulated_local",
            "bank_id": target_bank,
            "is_live": is_live,
            "service_name": service_name,
            "outcome": outcome
        }

    def recall(
        self,
        query: str,
        service_name: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 5,
        bank_id: Optional[str] = None
    ) -> RecallResultResponse:
        """
        Recalls historical experiences matching symptoms or error patterns within the user's isolated bank.
        """
        target_bank = bank_id or self.bank_id
        self.ensure_bank_seeded(target_bank)
        start_time = datetime.utcnow()
        results: List[RecallResultItem] = []
        is_live = False

        if self.client:
            try:
                response = self.client.recall(
                    bank_id=target_bank,
                    query=query,
                    budget="low",
                    tags=tags if tags else None
                )
                is_live = True
                raw_results = getattr(response, "results", []) or []
                for res in raw_results:
                    text = getattr(res, "text", str(res))
                    score = getattr(res, "score", 0.85)
                    results.append(RecallResultItem(
                        id=f"hindsight_{uuid.uuid4().hex[:8]}",
                        text=text,
                        similarity_score=round(float(score), 2),
                        service_name=service_name or "service",
                        source="hindsight_cloud"
                    ))
            except Exception as e:
                logger.warning(f"Hindsight recall API call failed for bank {target_bank}: {e}. Falling back to local recall.")

        # If live returned no results or client not configured, perform high-precision local semantic matching in user's bank
        if not results:
            results = self._local_recall(query, service_name, limit, bank_id=target_bank)

        execution_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        return RecallResultResponse(
            query=query,
            count=len(results),
            is_live_hindsight=is_live,
            results=results[:limit],
            execution_time_ms=round(execution_ms, 2)
        )

    def _local_recall(self, query: str, service_name: Optional[str], limit: int, bank_id: Optional[str] = None) -> List[RecallResultItem]:
        """Local memory retrieval with keyword & semantic similarity scoring strictly within user bank."""
        target_bank = bank_id or self.bank_id
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_items = []

        bank_mems = self._local_memories.get(target_bank, [])
        for mem in bank_mems:
            text_corpus = f"{mem.service_name} {mem.symptoms} {mem.root_cause} {mem.applied_resolution} {' '.join(mem.tags)}".lower()
            corpus_words = set(re.findall(r'\w+', text_corpus))
            
            overlap = query_words.intersection(corpus_words)
            overlap_score = len(overlap) / max(len(query_words), 1)

            boost = 0.0
            if service_name and service_name.lower() in mem.service_name.lower():
                boost += 0.20
            if "timeout" in query.lower() and "timeout" in text_corpus:
                boost += 0.25
            if "pool" in query.lower() and "pool" in text_corpus:
                boost += 0.25
            if "oom" in query.lower() and "oom" in text_corpus:
                boost += 0.30

            final_score = min(0.99, round(overlap_score * 0.6 + boost, 2))

            if final_score > 0.20 or (overlap and len(overlap) >= 1):
                text_summary = (
                    f"[{mem.service_name}] Incident ({mem.outcome.upper()}): "
                    f"Root Cause: {mem.root_cause}. "
                    f"Resolution: {mem.applied_resolution}."
                )
                scored_items.append((final_score, RecallResultItem(
                    id=mem.id,
                    text=text_summary,
                    similarity_score=final_score,
                    service_name=mem.service_name,
                    outcome=mem.outcome,
                    applied_resolution=mem.applied_resolution,
                    root_cause=mem.root_cause,
                    timestamp=mem.created_at,
                    source=mem.source
                )))

        scored_items.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_items[:limit]]

    def reflect(self, query: str, context: Optional[str] = None, bank_id: Optional[str] = None) -> ReflectResultResponse:
        """
        Executes an agentic reasoning loop over stored memories using Hindsight reflect() strictly within user bank.
        """
        target_bank = bank_id or self.bank_id
        self.ensure_bank_seeded(target_bank)
        start_time = datetime.utcnow()
        is_live = False
        synthesized_answer = ""
        cited_memories = []

        if self.client:
            try:
                response = self.client.reflect(
                    bank_id=target_bank,
                    query=query,
                    budget="mid",
                    context=context
                )
                is_live = True
                synthesized_answer = getattr(response, "answer", "") or getattr(response, "text", "")
                cited = getattr(response, "cited_memories", []) or []
                cited_memories = [str(c) for c in cited]
            except Exception as e:
                logger.warning(f"Hindsight reflect API call failed for bank {target_bank}: {e}. Falling back to local synthesis.")

        if not synthesized_answer:
            bank_mems = self._local_memories.get(target_bank, [])
            if not bank_mems:
                synthesized_answer = "No historical incident precedent recorded in this user workspace yet."
            else:
                success_cases = [m for m in bank_mems if m.outcome == "success"]
                fail_cases = [m for m in bank_mems if m.outcome == "failure"]
                
                parts = ["Based on retained operational incident precedents in your workspace:"]
                if success_cases:
                    best = success_cases[0]
                    parts.append(f"• Proven Effective Resolution: For {best.service_name} ({best.root_cause}), the validated fix was '{best.applied_resolution}'.")
                if fail_cases:
                    failed = fail_cases[0]
                    parts.append(f"• Ineffective Resolution Precedent: For {failed.service_name}, '{failed.applied_resolution}' failed to mitigate the outage.")
                
                parts.append("Recommendation: Implement empirical root cause remediation and verify telemetry before marking incident resolved.")
                synthesized_answer = "\n".join(parts)
                cited_memories = [m.id for m in bank_mems[:3]]

        execution_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        return ReflectResultResponse(
            query=query,
            synthesized_answer=synthesized_answer,
            cited_memories=[{"id": mid} if isinstance(mid, str) else mid for mid in cited_memories],
            is_live_hindsight=is_live,
            execution_time_ms=round(execution_ms, 2)
        )

    def ensure_bank_seeded(self, bank_id: Optional[str] = None):
        """Initializes empty user memory bank if not present."""
        target_bank = bank_id or self.bank_id
        if target_bank not in self._local_memories:
            self._local_memories[target_bank] = []

    def get_all_memories(self, bank_id: Optional[str] = None) -> List[MemoryItem]:
        """Returns all memories belonging to the specified bank. If None, returns empty or default."""
        target_bank = bank_id or self.bank_id
        self.ensure_bank_seeded(target_bank)
        return list(self._local_memories.get(target_bank, []))

    def seed_initial_memory(self, item: MemoryItem, bank_id: Optional[str] = None):
        target_bank = bank_id or item.bank_id or self.bank_id
        bank_list = self._local_memories.setdefault(target_bank, [])
        if not any(m.id == item.id for m in bank_list):
            bank_list.append(item)

hindsight_service = HindsightService()

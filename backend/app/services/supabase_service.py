import logging
import uuid
from typing import Optional, List, Dict, Any
from ..config import settings

logger = logging.getLogger("sentinelmind.supabase")

class SupabaseService:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_KEY
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.url and self.key:
            try:
                from supabase import create_client
                self.client = create_client(self.url, self.key)
                logger.info("Supabase client initialized successfully with endpoint: %s", self.url)
            except Exception as e:
                logger.warning("Supabase client optional initialization notice: %s", e)
                self.client = None

    def is_configured(self) -> bool:
        return bool(self.url and self.key)

    def is_connected(self) -> bool:
        if not self.client:
            return False
        try:
            res = self.client.table("incidents").select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.warning("Supabase health check ping failed: %s", e)
            return False

    def fetch_all_incidents(self) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            res = self.client.table("incidents").select("*").order("detected_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            logger.warning("Supabase fetch_all_incidents failed: %s", e)
            return []

    def insert_incident(self, incident_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        try:
            # Clean fields for Supabase incidents schema
            clean_item = dict(incident_data)
            # Ensure valid UUID string for id
            raw_id = clean_item.get("id")
            try:
                if raw_id:
                    uuid.UUID(str(raw_id))
                else:
                    clean_item["id"] = str(uuid.uuid4())
            except (ValueError, TypeError):
                clean_item["id"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sentinelmind.{raw_id}"))

            # Remove unsupported keys if any
            allowed_cols = {
                "id", "incident_number", "organization_id", "service_id", "service_name",
                "title", "description", "severity", "status", "source", "detected_at",
                "resolved_at", "resolution_time_minutes", "root_cause_summary",
                "applied_resolution", "resolution_outcome", "hindsight_memory_id",
                "tags", "created_at", "updated_at"
            }
            payload = {k: v for k, v in clean_item.items() if k in allowed_cols}

            res = self.client.table("incidents").upsert(payload).execute()
            if res.data:
                return res.data[0]
            return clean_item
        except Exception as e:
            logger.warning("Supabase insert_incident failed: %s", e)
            return None

    def update_incident(self, incident_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        try:
            allowed_cols = {
                "incident_number", "organization_id", "service_id", "service_name",
                "title", "description", "severity", "status", "source", "detected_at",
                "resolved_at", "resolution_time_minutes", "root_cause_summary",
                "applied_resolution", "resolution_outcome", "hindsight_memory_id",
                "tags", "updated_at"
            }
            payload = {k: v for k, v in updates.items() if k in allowed_cols}
            if not payload:
                return None

            # First try matching by id, else by incident_number
            try:
                uuid.UUID(str(incident_id))
                res = self.client.table("incidents").update(payload).eq("id", incident_id).execute()
            except ValueError:
                res = self.client.table("incidents").update(payload).eq("incident_number", incident_id).execute()

            if res.data:
                return res.data[0]
            return None
        except Exception as e:
            logger.warning("Supabase update_incident failed for %s: %s", incident_id, e)
            return None

    def delete_incident(self, incident_id: str) -> bool:
        if not self.client:
            return False
        try:
            try:
                uuid.UUID(str(incident_id))
                self.client.table("incidents").delete().eq("id", incident_id).execute()
            except ValueError:
                self.client.table("incidents").delete().eq("incident_number", incident_id).execute()
            return True
        except Exception as e:
            logger.warning("Supabase delete_incident failed for %s: %s", incident_id, e)
            return False

    def delete_user_records(self, user_id: str) -> bool:
        """Permanently deletes all database records belonging to user across tables."""
        if not self.client or not user_id:
            return False
        try:
            # 1. Delete profile
            self.client.table("profiles").delete().eq("id", user_id).execute()
        except Exception as e:
            logger.warning("Supabase delete profile failed: %s", e)
        try:
            # 2. Delete user-owned incidents
            self.client.table("incidents").delete().eq("organization_id", user_id).execute()
        except Exception as e:
            logger.warning("Supabase delete incidents failed: %s", e)
        try:
            # 3. Delete feedback
            self.client.table("feedback").delete().eq("user_id", user_id).execute()
        except Exception as e:
            logger.warning("Supabase delete feedback failed: %s", e)
        return True

    def insert_feedback(self, feedback_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        try:
            clean = dict(feedback_data)
            # Ensure UUID for id
            raw_id = clean.get("id")
            try:
                uuid.UUID(str(raw_id))
            except (ValueError, TypeError):
                clean["id"] = str(uuid.uuid4())

            # Format incident_id as UUID if needed
            inc_id = clean.get("incident_id")
            try:
                uuid.UUID(str(inc_id))
            except (ValueError, TypeError):
                clean["incident_id"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sentinelmind.{inc_id}"))

            res = self.client.table("feedback").insert(clean).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.warning("Supabase insert_feedback failed: %s", e)
            return None

    def insert_logs(self, incident_id: str, service_name: str, entries: List[Dict[str, Any]]) -> int:
        if not self.client or not entries:
            return 0
        try:
            # 1. Resolve or verify valid incident UUID in Supabase
            valid_inc_id = None
            if incident_id:
                try:
                    check_id = str(uuid.UUID(str(incident_id)))
                    res = self.client.table("incidents").select("id").eq("id", check_id).execute()
                    if res.data:
                        valid_inc_id = check_id
                except (ValueError, TypeError):
                    try:
                        res = self.client.table("incidents").select("id").eq("incident_number", str(incident_id)).execute()
                        if res.data:
                            valid_inc_id = res.data[0]["id"]
                    except Exception:
                        valid_inc_id = None

            # 2. If incident does not exist in Supabase yet, create record first so foreign key succeeds
            if not valid_inc_id:
                try:
                    new_id = str(uuid.uuid4())
                    inc_num = str(incident_id) if "INC-" in str(incident_id) else f"INC-2026-{uuid.uuid4().hex[:4].upper()}"
                    self.client.table("incidents").insert({
                        "id": new_id,
                        "incident_number": inc_num,
                        "service_name": service_name,
                        "title": f"{service_name}: Telemetry Anomaly Detected",
                        "description": "Auto-registered from ingested telemetry logs",
                        "severity": "critical",
                        "status": "open",
                        "source": "log_analysis"
                    }).execute()
                    valid_inc_id = new_id
                except Exception as e:
                    logger.warning("Auto-create incident in Supabase for log attachment failed: %s", e)

            if not valid_inc_id:
                return 0

            log_rows = []
            for e in entries[:50]: # cap at 50 to prevent huge batch spikes
                raw = e.get("raw_entry") or e.get("message") or ""
                log_rows.append({
                    "incident_id": valid_inc_id,
                    "service_name": service_name,
                    "level": e.get("level", "INFO"),
                    "message": e.get("message", "")[:500],
                    "raw_entry": raw[:1000],
                    "error_pattern": e.get("error_pattern"),
                    "is_anomaly": bool(e.get("is_anomaly", False))
                })
            res = self.client.table("logs").insert(log_rows).execute()
            logger.info("Inserted %d log entries into Supabase logs table for incident %s", len(res.data or []), incident_id)
            return len(res.data or [])
        except Exception as e:
            logger.warning("Supabase insert_logs failed: %s", e)
            return 0

    def fetch_logs_for_incident(self, incident_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            # Try by direct UUID
            try:
                check_id = str(uuid.UUID(str(incident_id)))
                res = self.client.table("logs").select("*").eq("incident_id", check_id).order("created_at", desc=False).limit(limit).execute()
                if res.data:
                    return res.data
            except (ValueError, TypeError):
                pass

            # Try by service_name or lookup incident
            res = self.client.table("logs").select("*").eq("service_name", incident_id).order("created_at", desc=False).limit(limit).execute()
            return res.data or []
        except Exception as e:
            logger.warning("Supabase fetch_logs_for_incident failed: %s", e)
            return []

    def save_assistant_exchange(
        self,
        session_id: str,
        user_message: str,
        assistant_reply: str,
        incident_id: Optional[str] = None,
        service_name: Optional[str] = None,
        confirmed_evidence: Optional[List[str]] = None,
        hypotheses: Optional[List[str]] = None,
        citations: Optional[List[Dict[str, Any]]] = None,
        model_name: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> bool:
        if not self.client:
            return False
        try:
            # 1. Upsert chat session record in assistant_chats
            chat_id = session_id or f"session_{uuid.uuid4().hex[:10]}"
            chat_title = f"{service_name or 'System'}: {user_message[:45]}"
            
            valid_inc_id = None
            if incident_id:
                try:
                    check_id = str(uuid.UUID(str(incident_id)))
                    res = self.client.table("incidents").select("id").eq("id", check_id).execute()
                    if res.data:
                        valid_inc_id = check_id
                except (ValueError, TypeError):
                    try:
                        res = self.client.table("incidents").select("id").eq("incident_number", str(incident_id)).execute()
                        if res.data:
                            valid_inc_id = res.data[0]["id"]
                    except Exception:
                        valid_inc_id = None

            chat_payload = {
                "id": chat_id,
                "incident_id": valid_inc_id,
                "service_name": service_name or "general",
                "title": chat_title[:250],
                "updated_at": "now()"
            }
            if user_id:
                chat_payload["user_id"] = user_id

            self.client.table("assistant_chats").upsert(chat_payload).execute()

            # 2. Insert user message and assistant reply into assistant_messages with identical keys (avoids PGRST102)
            messages_to_insert = [
                {
                    "chat_id": chat_id,
                    "role": "user",
                    "content": user_message,
                    "confirmed_evidence": [],
                    "hypotheses": [],
                    "citations": [],
                    "model_used": None
                },
                {
                    "chat_id": chat_id,
                    "role": "assistant",
                    "content": assistant_reply,
                    "confirmed_evidence": confirmed_evidence or [],
                    "hypotheses": hypotheses or [],
                    "citations": citations or [],
                    "model_used": model_name or "groq-qwen"
                }
            ]
            self.client.table("assistant_messages").insert(messages_to_insert).execute()
            logger.info("Persisted assistant chat exchange to Supabase for session %s (user: %s)", chat_id, user_id)
            return True
        except Exception as e:
            logger.warning("Supabase save_assistant_exchange failed: %s", e)
            return False

    def fetch_assistant_chats(self, user_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            query = self.client.table("assistant_chats").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            res = query.order("updated_at", desc=True).limit(limit).execute()
            return res.data or []
        except Exception as e:
            logger.warning("Supabase fetch_assistant_chats failed: %s", e)
            return []

    def fetch_assistant_messages(self, chat_id: str) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            res = self.client.table("assistant_messages").select("*").eq("chat_id", chat_id).order("created_at", desc=False).execute()
            return res.data or []
        except Exception as e:
            logger.warning("Supabase fetch_assistant_messages failed: %s", e)
            return []

supabase_service = SupabaseService()


import logging
import uuid
import httpx
from datetime import datetime
from typing import Optional, List, Dict, Any
from ..config import settings

logger = logging.getLogger("sentinelmind.supabase")

class SupabaseService:
    """
    Direct, robust Supabase integration powered by standard httpx PostgREST API.
    Zero external SDK dependency required (works across Anaconda, venv, and production).
    Guarantees permanent database persistence for incidents, logs, services, and chat history.
    """

    def __init__(self):
        self.url = (settings.SUPABASE_URL or "").rstrip("/")
        self.key = settings.SUPABASE_KEY or ""
        self._http: Optional[httpx.Client] = None
        if self.is_configured():
            self._http = httpx.Client(
                base_url=f"{self.url}/rest/v1",
                headers={
                    "apikey": self.key,
                    "Authorization": f"Bearer {self.key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation,resolution=merge-duplicates"
                },
                timeout=8.0
            )
            logger.info("Supabase direct PostgREST client initialized for endpoint: %s", self.url)

    def is_configured(self) -> bool:
        return bool(self.url and self.key)

    def is_connected(self) -> bool:
        if not self._http:
            return False
        try:
            r = self._http.get("/incidents?select=id&limit=1")
            return r.status_code == 200
        except Exception as e:
            logger.debug("Supabase ping failed: %s", e)
            return False

    def to_uuid(self, val: Any, prefix: str = "sentinelmind") -> str:
        """Converts any string to a valid UUID format (preserving existing UUIDs)."""
        if not val:
            return str(uuid.uuid4())
        try:
            return str(uuid.UUID(str(val)))
        except (ValueError, TypeError):
            return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{prefix}.{val}"))

    def ensure_organization(self, user_id: str, display_name: Optional[str] = None) -> str:
        """Ensures an organization row exists for the user so foreign key constraints succeed."""
        if not self._http or not user_id:
            return self.to_uuid(user_id)
        org_id = self.to_uuid(user_id, "sentinelmind.user")
        slug = f"workspace-{org_id[:8]}"
        name = display_name or f"Workspace {org_id[:6]}"
        try:
            payload = {
                "id": org_id,
                "name": name,
                "slug": slug
            }
            self._http.post("/organizations", json=payload)
        except Exception as e:
            logger.debug("ensure_organization notice: %s", e)
        return org_id

    def insert_incident(self, incident_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Persists or updates an incident in the Supabase 'incidents' table."""
        if not self._http:
            return None
        try:
            clean = dict(incident_data)
            clean_id = self.to_uuid(clean.get("id"), "sentinelmind.incident")
            user_id = clean.get("user_id") or clean.get("organization_id") or "demo-operator-user"
            org_id = self.ensure_organization(user_id)

            allowed_cols = {
                "incident_number", "service_id", "service_name",
                "title", "description", "severity", "status", "source", "detected_at",
                "resolved_at", "resolution_time_minutes", "root_cause_summary",
                "applied_resolution", "resolution_outcome", "hindsight_memory_id",
                "tags", "created_at", "updated_at"
            }
            payload = {k: v for k, v in clean.items() if k in allowed_cols}
            payload["id"] = clean_id
            payload["organization_id"] = org_id
            payload["updated_at"] = datetime.utcnow().isoformat()

            r = self._http.post("/incidents", json=payload)
            if r.status_code in [200, 201]:
                data = r.json()
                logger.info("Successfully persisted incident %s to Supabase", clean.get("incident_number", clean_id))
                return data[0] if isinstance(data, list) and len(data) > 0 else payload
            logger.warning("Supabase insert_incident returned status %s: %s", r.status_code, r.text)
            return None
        except Exception as e:
            logger.warning("Supabase insert_incident exception: %s", e)
            return None

    def update_incident(self, incident_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates an existing incident in Supabase."""
        if not self._http:
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
            payload["updated_at"] = datetime.utcnow().isoformat()

            # Try by direct UUID
            try:
                valid_uuid = str(uuid.UUID(str(incident_id)))
                r = self._http.patch(f"/incidents?id=eq.{valid_uuid}", json=payload)
            except ValueError:
                r = self._http.patch(f"/incidents?incident_number=eq.{incident_id}", json=payload)

            if r.status_code in [200, 204]:
                logger.info("Updated incident %s in Supabase", incident_id)
                data = r.json() if r.text else []
                return data[0] if isinstance(data, list) and len(data) > 0 else payload
            return None
        except Exception as e:
            logger.warning("Supabase update_incident failed for %s: %s", incident_id, e)
            return None

    def fetch_incidents_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Queries Supabase for all incidents belonging to the user's workspace."""
        if not self._http or not user_id:
            return []
        try:
            org_id = self.to_uuid(user_id, "sentinelmind.user")
            r = self._http.get(f"/incidents?organization_id=eq.{org_id}&order=detected_at.desc")
            if r.status_code == 200:
                incidents = r.json()
                logger.info("Hydrated %d past incidents from Supabase for user %s", len(incidents), user_id)
                return incidents
            return []
        except Exception as e:
            logger.warning("Supabase fetch_incidents_for_user failed: %s", e)
            return []

    def delete_incident(self, incident_id: str, user_id: Optional[str] = None) -> bool:
        """Deletes an incident from Supabase."""
        if not self._http:
            return False
        try:
            try:
                valid_uuid = str(uuid.UUID(str(incident_id)))
                endpoint = f"/incidents?id=eq.{valid_uuid}"
            except ValueError:
                endpoint = f"/incidents?incident_number=eq.{incident_id}"

            if user_id:
                org_id = self.to_uuid(user_id, "sentinelmind.user")
                endpoint += f"&organization_id=eq.{org_id}"

            r = self._http.delete(endpoint)
            return r.status_code in [200, 204]
        except Exception as e:
            logger.warning("Supabase delete_incident failed for %s: %s", incident_id, e)
            return False

    def insert_logs(self, incident_id: str, service_name: str, entries: List[Dict[str, Any]]) -> int:
        """Persists parsed telemetry logs to the 'logs' table in Supabase."""
        if not self._http or not entries:
            return 0
        try:
            clean_inc_id = self.to_uuid(incident_id, "sentinelmind.incident")
            log_rows = []
            for e in entries[:50]:
                raw = e.get("raw_entry") or e.get("message") or ""
                log_rows.append({
                    "incident_id": clean_inc_id,
                    "service_name": service_name,
                    "level": e.get("level", "INFO"),
                    "message": e.get("message", "")[:500],
                    "raw_entry": raw[:1000],
                    "error_pattern": e.get("error_pattern"),
                    "is_anomaly": bool(e.get("is_anomaly", False))
                })
            r = self._http.post("/logs", json=log_rows)
            if r.status_code in [200, 201]:
                logger.info("Inserted %d log entries into Supabase logs table for incident %s", len(log_rows), incident_id)
                return len(log_rows)
            return 0
        except Exception as e:
            logger.warning("Supabase insert_logs failed: %s", e)
            return 0

    def fetch_logs_for_incident(self, incident_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves raw log records from Supabase."""
        if not self._http or not incident_id:
            return []
        try:
            clean_inc_id = self.to_uuid(incident_id, "sentinelmind.incident")
            r = self._http.get(f"/logs?incident_id=eq.{clean_inc_id}&order=created_at.asc&limit={limit}")
            if r.status_code == 200:
                return r.json()
            return []
        except Exception as e:
            logger.warning("Supabase fetch_logs_for_incident failed: %s", e)
            return []

    def upsert_service(self, service_data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        """Persists a configured microservice to Supabase."""
        if not self._http or not user_id:
            return None
        try:
            org_id = self.ensure_organization(user_id)
            srv_id = self.to_uuid(service_data.get("id"), "sentinelmind.service")
            payload = {
                "id": srv_id,
                "organization_id": org_id,
                "name": service_data.get("name", "service"),
                "tier": service_data.get("tier", "tier-1"),
                "health": service_data.get("health", "healthy"),
                "description": service_data.get("description", ""),
                "active_incident_count": service_data.get("active_incident_count", 0)
            }
            r = self._http.post("/services", json=payload)
            if r.status_code in [200, 201]:
                return payload
            return None
        except Exception as e:
            logger.warning("Supabase upsert_service failed: %s", e)
            return None

    def fetch_services_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves configured microservices for the user from Supabase."""
        if not self._http or not user_id:
            return []
        try:
            org_id = self.to_uuid(user_id, "sentinelmind.user")
            r = self._http.get(f"/services?organization_id=eq.{org_id}&order=name.asc")
            if r.status_code == 200:
                return r.json()
            return []
        except Exception as e:
            logger.warning("Supabase fetch_services_for_user failed: %s", e)
            return []

    def delete_service(self, service_id: str, user_id: str) -> bool:
        """Deletes a service from Supabase."""
        if not self._http or not service_id:
            return False
        try:
            org_id = self.to_uuid(user_id, "sentinelmind.user")
            srv_uuid = self.to_uuid(service_id, "sentinelmind.service")
            r = self._http.delete(f"/services?id=eq.{srv_uuid}&organization_id=eq.{org_id}")
            return r.status_code in [200, 204]
        except Exception as e:
            logger.warning("Supabase delete_service failed: %s", e)
            return False

    def insert_feedback(self, feedback_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Stores recommendation approval or feedback in Supabase."""
        if not self._http:
            return None
        try:
            clean = dict(feedback_data)
            clean["id"] = self.to_uuid(clean.get("id"), "sentinelmind.feedback")
            r = self._http.post("/feedback", json=clean)
            if r.status_code in [200, 201]:
                return clean
            return None
        except Exception as e:
            logger.warning("Supabase insert_feedback failed: %s", e)
            return None

    def delete_user_records(self, user_id: str) -> bool:
        """Purges all user records from Supabase."""
        if not self._http or not user_id:
            return False
        try:
            org_id = self.to_uuid(user_id, "sentinelmind.user")
            self._http.delete(f"/incidents?organization_id=eq.{org_id}")
            self._http.delete(f"/services?organization_id=eq.{org_id}")
            self._http.delete(f"/feedback?user_id=eq.{user_id}")
            return True
        except Exception as e:
            logger.warning("Supabase delete_user_records failed: %s", e)
            return False

supabase_service = SupabaseService()

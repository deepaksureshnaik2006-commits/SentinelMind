import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ..services.hindsight_service import hindsight_service
from ..services.supabase_service import supabase_service

LOG_CACHE_OOM = """2026-11-07T06:12:10.012Z [cache-layer] [INFO] Cache warming completed for tenant_eu_west
2026-11-07T06:15:32.410Z [cache-layer] [WARN] Memory usage at 92.4% (maxmemory=4096MB, used_memory=3785MB)
2026-11-07T06:16:01.890Z [cache-layer] [ERROR] RedisCommandExecutionException: OOM command not allowed when used memory > 'maxmemory'.
2026-11-07T06:16:02.102Z [cache-layer] [ERROR] Eviction policy 'noeviction' rejected SETNX session:usr_88291
2026-11-07T06:16:05.450Z [cache-layer] [FATAL] User session validation failed across all nodes due to Redis OOM."""

LOG_PAYMENT_TIMEOUT = """2026-11-07T08:14:02.102Z [payment-service] [INFO] Handling checkout request req_9921 for user usr_4102
2026-11-07T08:14:05.312Z [payment-service] [WARN] HikariPool-1 - Connection pool acquisition approaching timeout (2850ms elapsed, 10/10 active connections)
2026-11-07T08:14:07.450Z [payment-service] [ERROR] org.postgresql.util.PSQLException: Connection to 10.0.4.12:5432 refused or timed out after 30000ms.
2026-11-07T08:14:07.452Z [payment-service] [ERROR] HikariPool-1 - Connection is not available, request timed out after 30002ms (active=10, idle=0, waiting=47).
2026-11-07T08:14:07.460Z [payment-service] [FATAL] Transaction failed: Database connection timeout during lock acquisition on orders table.
2026-11-07T08:14:08.001Z [payment-service] [ERROR] HTTP 500 Internal Server Error returned to checkout gateway for 47 queued requests.
2026-11-07T08:14:10.120Z [payment-service] [ERROR] CircuitBreaker 'PostgresOrdersDB' transitioned to OPEN state due to 98% error rate in sliding window."""

LOG_GATEWAY_504 = """[
  {"timestamp": "2026-11-07T07:30:00.120Z", "service": "api-gateway", "level": "INFO", "message": "Routing incoming ingress traffic"},
  {"timestamp": "2026-11-07T07:30:15.450Z", "service": "api-gateway", "level": "WARN", "message": "Upstream service [inventory-svc] latency 8500ms exceeded SLA"},
  {"timestamp": "2026-11-07T07:30:30.100Z", "service": "api-gateway", "level": "ERROR", "message": "HTTP 504 Gateway Timeout: Upstream [inventory-svc] dropped connection on port 8080"}
]"""

LOG_BILLING_TIMEOUT = """2026-11-07T10:22:15.890Z [billing-engine] [INFO] Processing recurring subscription renewals batch batch_nov_07
2026-11-07T10:22:20.104Z [billing-engine] [WARN] Connection lease wait time elevated: 4200ms on primary pg_pool
2026-11-07T10:22:25.401Z [billing-engine] [ERROR] PSQLException: HikariPool-Billing - Connection pool exhausted (active=15, idle=0, waiting=62).
2026-11-07T10:22:25.405Z [billing-engine] [ERROR] Connection acquisition timed out after 30000ms. Could not checkout connection for invoice #88129.
2026-11-07T10:22:26.012Z [billing-engine] [FATAL] Critical billing failure: 62 subscription renewal transactions failed due to database connection timeout.
2026-11-07T10:22:28.150Z [billing-engine] [ERROR] Worker pool worker-group-3 stalled waiting for database handle."""

class InMemoryRepository:
    """
    Multi-Tenant Isolated Repository Layer.
    Every user has a strictly partitioned private workspace.
    Data created by User A never bleeds into User B's workspace.
    """

    def __init__(self):
        # Multi-tenant partitioning by user_id
        # { user_id: { incident_id: incident_dict } }
        self.incidents_by_user: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # { user_id: { incident_id: [log_dicts] } }
        self.logs_by_user: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
        # { user_id: { incident_id: [rec_dicts] } }
        self.recommendations_by_user: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
        # { user_id: { feedback_id: feedback_dict } }
        self.feedback_by_user: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # Multi-tenant AI Assistant chats scoped strictly by user_id
        # { user_id: [session_dict] }
        self.assistant_sessions_by_user: Dict[str, List[Dict[str, Any]]] = {}
        # { user_id: { session_id: [message_dict] } }
        self.assistant_messages_by_user: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
        # Multi-tenant infrastructure microservices scoped strictly by user_id
        # { user_id: [service_dict] }
        self.services_by_user: Dict[str, List[Dict[str, Any]]] = {}

    def ensure_user_seeded(self, user_id: str):
        """Seeds the 4 default baseline operational logs, incidents, and services for the user's workspace."""
        if not user_id:
            return
        if user_id in self.incidents_by_user and len(self.incidents_by_user[user_id]) > 0:
            return

        now = datetime.utcnow()
        user_dict = self.incidents_by_user.setdefault(user_id, {})

        inc101_id = f"inc_101_{user_id[:8]}"
        inc102_id = f"inc_102_{user_id[:8]}"
        inc103_id = f"inc_103_{user_id[:8]}"
        inc104_id = f"inc_104_{user_id[:8]}"

        user_dict[inc101_id] = {
            "id": inc101_id,
            "incident_number": "INC-2026-101",
            "user_id": user_id,
            "service_name": "cache-layer",
            "title": "Redis Cache Saturation & OOM Under Peak Load",
            "description": "User session validation failed across cluster due to Redis OOM (used_memory=3785MB/4096MB) under 'noeviction' policy.",
            "severity": "high",
            "status": "resolved",
            "resolution_outcome": "success",
            "resolution_time_minutes": 12,
            "root_cause_summary": "In-memory cache saturation reaching 92.4% maxmemory ceiling with 'noeviction' policy preventing automated LRU key release.",
            "applied_resolution": "Applied allkeys-lru eviction policy and expanded cache memory quota by 2GB.",
            "feedback_notes": "RAM stabilized at 82% within 15 seconds of applying allkeys-lru policy without dropping active sessions.",
            "tags": ["cache-layer", "redis", "oom", "cache", "allkeys-lru", "eviction"],
            "detected_at": (now - timedelta(days=5)).isoformat(),
            "created_at": (now - timedelta(days=5)).isoformat(),
            "resolved_at": (now - timedelta(days=5, minutes=-12)).isoformat(),
            "applied_actions": ["redis-cli CONFIG SET maxmemory-policy allkeys-lru", "redis-cli CONFIG SET maxmemory 6gb"]
        }

        user_dict[inc102_id] = {
            "id": inc102_id,
            "incident_number": "INC-2026-102",
            "user_id": user_id,
            "service_name": "payment-service",
            "title": "HikariPool Connection Pool Exhaustion on Checkout Surge",
            "description": "Connection pool acquisition timeout after 30000ms with 47 queued checkout transactions failing with HTTP 500 error.",
            "severity": "critical",
            "status": "resolved",
            "resolution_outcome": "success",
            "resolution_time_minutes": 18,
            "root_cause_summary": "HikariPool maximum connection pool ceiling exhausted (10/10 active connections, 47 queued) during flash checkout surge.",
            "applied_resolution": "Scaled HikariPool maximumPoolSize from 10 to 25 and tuned connection lease timeout parameters.",
            "feedback_notes": "Checkout queue drained in under 2 minutes after increasing maximum pool size to 25. Zero dropped checkouts.",
            "tags": ["payment-service", "database", "pool", "timeout", "hikaripool", "postgres"],
            "detected_at": (now - timedelta(days=3)).isoformat(),
            "created_at": (now - timedelta(days=3)).isoformat(),
            "resolved_at": (now - timedelta(days=3, minutes=-18)).isoformat(),
            "applied_actions": ["Set maximumPoolSize=25", "Set connectionTimeout=15000", "kubectl rollout restart deployment/payment-service"]
        }

        user_dict[inc103_id] = {
            "id": inc103_id,
            "incident_number": "INC-2026-103",
            "user_id": user_id,
            "service_name": "api-gateway",
            "title": "Edge Ingress Gateway 504 Upstream Drop",
            "description": "Edge ingress router returned HTTP 504 Gateway Timeout: Upstream inventory-svc dropped connection on port 8080 due to 8500ms latency.",
            "severity": "medium",
            "status": "resolved",
            "resolution_outcome": "success",
            "resolution_time_minutes": 22,
            "root_cause_summary": "Upstream microservice (inventory-svc) latency exceeded ingress gateway proxy timeout under heavy concurrent query load.",
            "applied_resolution": "Scaled upstream inventory-svc pods to 4 replicas and adjusted edge gateway proxy timeout to 15s.",
            "feedback_notes": "Latency normalized under 110ms across edge ingress routes after pod replication.",
            "tags": ["api-gateway", "ingress", "504", "timeout", "inventory-svc", "kubernetes"],
            "detected_at": (now - timedelta(days=1)).isoformat(),
            "created_at": (now - timedelta(days=1)).isoformat(),
            "resolved_at": (now - timedelta(days=1, minutes=-22)).isoformat(),
            "applied_actions": ["kubectl scale deployment inventory-svc --replicas=4", "nginx -s reload"]
        }

        user_dict[inc104_id] = {
            "id": inc104_id,
            "incident_number": "INC-2026-104",
            "user_id": user_id,
            "service_name": "billing-engine",
            "title": "Recurrent Database Connection Timeout on Invoice Batch",
            "description": "Critical billing failure: 62 subscription renewal transactions failed due to database connection timeout (HikariPool-Billing active=15, waiting=62).",
            "severity": "high",
            "status": "investigating",
            "resolution_outcome": None,
            "resolution_time_minutes": None,
            "root_cause_summary": "Batch renewal job concurrently leasing all 15 database handles with unindexed invoice table queries.",
            "applied_resolution": None,
            "feedback_notes": None,
            "tags": ["billing-engine", "database", "timeout", "pool", "hikaripool", "billing"],
            "detected_at": (now - timedelta(hours=4)).isoformat(),
            "created_at": (now - timedelta(hours=4)).isoformat()
        }

        # Store logs for each incident
        self.save_logs(inc101_id, [{"timestamp": (now - timedelta(days=5)).isoformat(), "raw": LOG_CACHE_OOM}], user_id=user_id)
        self.save_logs(inc102_id, [{"timestamp": (now - timedelta(days=3)).isoformat(), "raw": LOG_PAYMENT_TIMEOUT}], user_id=user_id)
        self.save_logs(inc103_id, [{"timestamp": (now - timedelta(days=1)).isoformat(), "raw": LOG_GATEWAY_504}], user_id=user_id)
        self.save_logs(inc104_id, [{"timestamp": (now - timedelta(hours=4)).isoformat(), "raw": LOG_BILLING_TIMEOUT}], user_id=user_id)

        # Populate user's operational infrastructure microservices
        self.services_by_user[user_id] = [
            {"id": f"srv_cache_{user_id[:8]}", "user_id": user_id, "name": "cache-layer", "tier": "tier-1", "environment": "production", "description": "Redis distributed cluster and session cache", "created_at": (now - timedelta(days=30)).isoformat()},
            {"id": f"srv_payment_{user_id[:8]}", "user_id": user_id, "name": "payment-service", "tier": "tier-1", "environment": "production", "description": "Checkout and payment authorization gateway", "created_at": (now - timedelta(days=30)).isoformat()},
            {"id": f"srv_gateway_{user_id[:8]}", "user_id": user_id, "name": "api-gateway", "tier": "tier-1", "environment": "production", "description": "Edge ingress routing and SSL termination", "created_at": (now - timedelta(days=30)).isoformat()},
            {"id": f"srv_billing_{user_id[:8]}", "user_id": user_id, "name": "billing-engine", "tier": "tier-2", "environment": "production", "description": "Subscription billing ledger and invoice generator", "created_at": (now - timedelta(days=30)).isoformat()}
        ]

        # Ensure user's Hindsight memory bank is populated
        user_bank_id = hindsight_service.get_user_bank_id(user_id)
        hindsight_service.ensure_bank_seeded(user_bank_id)

    def _get_user_incidents_dict(self, user_id: Optional[str]) -> Dict[str, Dict[str, Any]]:
        if not user_id:
            return {}
        self.ensure_user_seeded(user_id)
        return self.incidents_by_user.setdefault(user_id, {})

    def list_incidents(
        self,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        service: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lists incidents strictly belonging to the authenticated user."""
        if not user_id:
            return []

        user_dict = self._get_user_incidents_dict(user_id)
        results = list(user_dict.values())

        if status:
            results = [i for i in results if i.get("status") == status]
        if severity:
            results = [i for i in results if i.get("severity") == severity]
        if service:
            results = [i for i in results if i.get("service_name", "").lower() == service.lower()]
        if search:
            q = search.lower()
            results = [
                i for i in results
                if q in i.get("title", "").lower()
                or q in i.get("description", "").lower()
                or q in i.get("service_name", "").lower()
                or q in i.get("incident_number", "").lower()
            ]

        results.sort(key=lambda x: str(x.get("detected_at") or x.get("created_at") or ""), reverse=True)
        return results

    def get_incident(self, incident_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves an incident only if it belongs to the authenticated user."""
        if not user_id:
            return None

        user_dict = self._get_user_incidents_dict(user_id)
        inc = user_dict.get(incident_id)
        if not inc:
            # Check by incident_number for convenience within user workspace
            for item in user_dict.values():
                if item.get("incident_number") == incident_id:
                    return item
        return inc

    def create_incident(self, incident_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Creates and stores an incident for the authenticated user."""
        user_id = user_id or incident_data.get("user_id") or "unassigned_user"
        user_dict = self._get_user_incidents_dict(user_id)

        inc_id = incident_data.get("id") or str(uuid.uuid4())
        user_incident_count = len(user_dict) + 101
        inc_number = incident_data.get("incident_number") or f"INC-2026-{user_incident_count}"

        now_str = datetime.utcnow().isoformat()
        new_inc = {
            "id": inc_id,
            "user_id": user_id,
            "incident_number": inc_number,
            "service_name": incident_data.get("service_name", "app-service"),
            "title": incident_data.get("title", f"{incident_data.get('service_name', 'Service')} Anomaly"),
            "description": incident_data.get("description", "Automated incident detection from telemetry stream"),
            "severity": incident_data.get("severity", "high"),
            "status": incident_data.get("status", "open"),
            "source": incident_data.get("source", "log_analysis"),
            "detected_at": incident_data.get("detected_at") or now_str,
            "created_at": now_str,
            "resolved_at": incident_data.get("resolved_at"),
            "resolution_time_minutes": incident_data.get("resolution_time_minutes"),
            "root_cause_summary": incident_data.get("root_cause_summary"),
            "applied_resolution": incident_data.get("applied_resolution"),
            "resolution_outcome": incident_data.get("resolution_outcome"),
            "hindsight_memory_id": incident_data.get("hindsight_memory_id"),
            "tags": incident_data.get("tags") or [incident_data.get("service_name", "app-service")]
        }

        user_dict[inc_id] = new_inc

        # Sync to Supabase with organization_id = user_id for multi-tenant database isolation
        if supabase_service.is_configured():
            try:
                sb_payload = dict(new_inc)
                sb_payload["organization_id"] = user_id
                supabase_service.insert_incident(sb_payload)
            except Exception:
                pass

        return new_inc

    def update_incident(self, incident_id: str, updates: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Updates an incident if owned by the user."""
        inc = self.get_incident(incident_id, user_id=user_id)
        if not inc:
            return None

        inc.update(updates)
        inc["updated_at"] = datetime.utcnow().isoformat()

        if supabase_service.is_configured():
            try:
                supabase_service.update_incident(inc["id"], updates)
            except Exception:
                pass

        return inc

    def resolve_incident(
        self,
        incident_id: str,
        applied_resolution: str,
        outcome: str = "success",
        post_mortem_notes: Optional[str] = None,
        time_to_mitigate_minutes: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Resolves an incident and retains experience in the user's private Hindsight memory bank.
        """
        inc = self.get_incident(incident_id, user_id=user_id)
        if not inc:
            raise KeyError(f"Incident {incident_id} not found in user workspace")

        now = datetime.utcnow()
        inc["status"] = "resolved"
        inc["resolved_at"] = now.isoformat()
        inc["applied_resolution"] = applied_resolution
        inc["resolution_outcome"] = outcome
        inc["resolution_time_minutes"] = time_to_mitigate_minutes or 15

        # Retain experience in user's isolated Hindsight memory bank
        user_bank_id = hindsight_service.get_user_bank_id(user_id or inc.get("user_id", ""))
        retain_res = hindsight_service.retain(
            incident_id=inc["id"],
            service_name=inc["service_name"],
            symptoms=inc["description"],
            root_cause=inc.get("root_cause_summary") or inc["title"],
            solution_applied=applied_resolution,
            outcome=outcome,
            feedback_notes=post_mortem_notes,
            incident_number=inc.get("incident_number"),
            tags=inc.get("tags"),
            bank_id=user_bank_id
        )

        mem_id = retain_res.get("memory_id")
        inc["hindsight_memory_id"] = mem_id

        if supabase_service.is_configured():
            try:
                supabase_service.update_incident(inc["id"], {
                    "status": "resolved",
                    "resolved_at": inc["resolved_at"],
                    "applied_resolution": applied_resolution,
                    "resolution_outcome": outcome,
                    "resolution_time_minutes": inc["resolution_time_minutes"],
                    "hindsight_memory_id": mem_id
                })
            except Exception:
                pass

        return {
            "incident": inc,
            "hindsight": retain_res
        }

    def delete_incident(self, incident_id: str, user_id: Optional[str] = None) -> bool:
        """Deletes an incident if owned by the user."""
        if not user_id:
            return False
        user_dict = self._get_user_incidents_dict(user_id)
        if incident_id in user_dict:
            del user_dict[incident_id]
            return True
        return False

    def purge_user_data(self, user_id: str) -> bool:
        """Permanently purges all data, logs, recommendations, feedback, AI chats, and configured services for the user."""
        if not user_id:
            return False
        self.incidents_by_user.pop(user_id, None)
        self.logs_by_user.pop(user_id, None)
        self.recommendations_by_user.pop(user_id, None)
        self.feedback_by_user.pop(user_id, None)
        self.assistant_sessions_by_user.pop(user_id, None)
        self.assistant_messages_by_user.pop(user_id, None)
        self.services_by_user.pop(user_id, None)
        return True

    def list_services(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists infrastructure services configured for the authenticated user, reflecting actual real-time health."""
        if not user_id:
            return []
        self.ensure_user_seeded(user_id)
        user_services = list(self.services_by_user.get(user_id, []))
        user_incidents = self.list_incidents(user_id=user_id)

        # Merge services referenced in user's actual incidents
        configured_names = {s["name"].lower() for s in user_services}
        for inc in user_incidents:
            s_name = inc.get("service_name")
            if s_name and s_name.lower() not in configured_names:
                configured_names.add(s_name.lower())
                user_services.append({
                    "id": f"srv_{uuid.uuid4().hex[:8]}",
                    "user_id": user_id,
                    "name": s_name,
                    "tier": "tier-1",
                    "environment": "production",
                    "description": f"Monitored microservice for {s_name}",
                    "created_at": inc.get("created_at") or datetime.utcnow().isoformat()
                })

        # Calculate actual health dynamically from active/open incidents
        results = []
        for s in user_services:
            s_name = s.get("name")
            active_incs = [
                i for i in user_incidents
                if i.get("service_name") == s_name and i.get("status") in ["open", "investigating"]
            ]
            if any(i.get("severity") == "critical" for i in active_incs):
                dyn_health = "critical"
            elif active_incs:
                dyn_health = "degraded"
            else:
                dyn_health = "healthy"

            srv_copy = dict(s)
            srv_copy["health"] = dyn_health
            srv_copy["active_incident_count"] = len(active_incs)
            results.append(srv_copy)

        return results

    def create_service(self, service_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Configures a new microservice for the authenticated user."""
        if not user_id:
            raise ValueError("Authenticated user_id required")

        user_services = self.services_by_user.setdefault(user_id, [])
        name = service_data.get("name", "").strip()
        if not name:
            raise ValueError("Service name cannot be empty")

        # Check if already exists for this user
        existing = next((s for s in user_services if s.get("name", "").lower() == name.lower()), None)
        if existing:
            existing.update(service_data)
            return existing

        srv_id = service_data.get("id") or f"srv_{uuid.uuid4().hex[:8]}"
        new_service = {
            "id": srv_id,
            "user_id": user_id,
            "name": name,
            "tier": service_data.get("tier", "tier-1"),
            "environment": service_data.get("environment", "production"),
            "description": service_data.get("description", f"Monitored {name} infrastructure component"),
            "created_at": datetime.utcnow().isoformat()
        }
        user_services.append(new_service)

        # Sync to Supabase if configured
        if supabase_service.is_configured() and supabase_service.client:
            try:
                sb_payload = dict(new_service)
                sb_payload["organization_id"] = user_id
                supabase_service.client.table("services").upsert(sb_payload).execute()
            except Exception:
                pass

        return new_service

    def delete_service(self, service_id: str, user_id: str) -> bool:
        """Deletes a configured service for the user."""
        if not user_id or user_id not in self.services_by_user:
            return False
        services = self.services_by_user[user_id]
        before_len = len(services)
        self.services_by_user[user_id] = [s for s in services if s.get("id") != service_id and s.get("name") != service_id]
        deleted = len(self.services_by_user[user_id]) < before_len
        if deleted and supabase_service.is_configured() and supabase_service.client:
            try:
                supabase_service.client.table("services").delete().eq("id", service_id).eq("organization_id", user_id).execute()
            except Exception:
                pass
        return deleted

    def save_assistant_session(self, user_id: str, session_data: Dict[str, Any]):
        """Saves or updates an AI assistant chat session strictly scoped to user_id."""
        if not user_id:
            return
        user_sessions = self.assistant_sessions_by_user.setdefault(user_id, [])
        s_id = session_data.get("id")
        existing = next((s for s in user_sessions if s.get("id") == s_id), None)
        if existing:
            existing.update(session_data)
        else:
            user_sessions.insert(0, session_data)

    def get_assistant_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Returns AI assistant chat sessions strictly belonging to user_id."""
        if not user_id:
            return []
        return self.assistant_sessions_by_user.get(user_id, [])

    def save_assistant_messages(self, user_id: str, session_id: str, messages: List[Dict[str, Any]]):
        """Appends messages to a user-owned AI assistant chat session."""
        if not user_id or not session_id:
            return
        user_msgs = self.assistant_messages_by_user.setdefault(user_id, {})
        user_msgs.setdefault(session_id, []).extend(messages)

    def get_assistant_messages(self, user_id: str, session_id: str) -> List[Dict[str, Any]]:
        """Returns messages for a chat session strictly belonging to user_id."""
        if not user_id or not session_id:
            return []
        user_msgs = self.assistant_messages_by_user.get(user_id, {})
        return user_msgs.get(session_id, [])

    def save_logs(self, incident_id: str, logs: List[Dict[str, Any]], user_id: Optional[str] = None):
        """Stores logs for an incident scoped by user."""
        u_id = user_id or "unassigned_user"
        user_logs = self.logs_by_user.setdefault(u_id, {})
        user_logs.setdefault(incident_id, []).extend(logs)

    def get_logs(self, incident_id: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves logs only if user owns the incident."""
        if not user_id:
            return []
        self.ensure_user_seeded(user_id)
        user_logs = self.logs_by_user.get(user_id, {})
        return user_logs.get(incident_id, [])

    def save_recommendations(self, incident_id: str, recommendations: List[Any], user_id: Optional[str] = None):
        """Stores recommendations scoped by user as plain dictionaries."""
        u_id = user_id or "unassigned_user"
        user_recs = self.recommendations_by_user.setdefault(u_id, {})
        converted = [
            r.dict() if hasattr(r, 'dict') else dict(r) if isinstance(r, dict) else r
            for r in recommendations
        ]
        user_recs[incident_id] = converted

    def get_recommendations(self, incident_id: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves recommendations only if user owns the incident."""
        if not user_id:
            return []
        user_recs = self.recommendations_by_user.get(user_id, {})
        return user_recs.get(incident_id, [])

    def approve_recommendation(
        self,
        recommendation_id: str,
        user_id: Optional[str] = None,
        engineer_name: str = "DevOps Lead",
        approval_notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Marks a recommendation as approved within the user's isolated workspace."""
        if not user_id:
            return None
        user_recs = self.recommendations_by_user.get(user_id, {})
        for inc_id, recs in user_recs.items():
            for rec in recs:
                rec_id = rec.id if hasattr(rec, 'id') else rec.get('id') if isinstance(rec, dict) else None
                if rec_id == recommendation_id:
                    if hasattr(rec, 'is_approved'):
                        rec.is_approved = True
                        rec.approved_by = engineer_name
                        rec.approved_at = datetime.utcnow()
                        return rec.dict() if hasattr(rec, 'dict') else dict(rec)
                    elif isinstance(rec, dict):
                        rec["is_approved"] = True
                        rec["approved_by"] = engineer_name
                        rec["approved_at"] = datetime.utcnow().isoformat()
                        if approval_notes:
                            rec["approval_notes"] = approval_notes
                        return rec
        return None

    def get_analytics(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculates dashboard analytics exclusively for the authenticated user's workspace."""
        if not user_id:
            return {
                "active_incidents": 0,
                "mttr_minutes": 0,
                "autonomous_resolution_rate": 0,
                "hindsight_memories_retained": 0,
                "total_incidents": 0,
                "resolved_incidents": 0,
                "service_distribution": []
            }

        incidents = self.list_incidents(user_id=user_id)
        user_bank_id = hindsight_service.get_user_bank_id(user_id)
        memories = hindsight_service.get_all_memories(bank_id=user_bank_id)

        total = len(incidents)
        active = sum(1 for i in incidents if i.get("status") in ["open", "investigating"])
        resolved = sum(1 for i in incidents if i.get("status") in ["resolved", "closed"])

        # Compute average MTTR for resolved incidents
        resolved_times = [
            i.get("resolution_time_minutes")
            for i in incidents
            if i.get("status") in ["resolved", "closed"] and i.get("resolution_time_minutes")
        ]
        avg_mttr = round(sum(resolved_times) / len(resolved_times), 1) if resolved_times else 0

        # Success rate
        success_count = sum(1 for i in incidents if i.get("resolution_outcome") == "success")
        res_rate = round((success_count / resolved) * 100, 1) if resolved > 0 else 0

        # Service breakdown
        counts: Dict[str, int] = {}
        for i in incidents:
            s_name = i.get("service_name") or "unknown"
            counts[s_name] = counts.get(s_name, 0) + 1

        dist = [{"service": k, "count": v} for k, v in counts.items()]
        dist.sort(key=lambda x: x["count"], reverse=True)

        return {
            "active_incidents": active,
            "mttr_minutes": avg_mttr,
            "avg_resolution_time_minutes": avg_mttr,
            "autonomous_resolution_rate": res_rate,
            "hindsight_memories_retained": len(memories),
            "total_incidents": total,
            "resolved_incidents": resolved,
            "service_distribution": dist
        }

repository = InMemoryRepository()

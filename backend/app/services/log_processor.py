import re
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from ..schemas.log import LogEntry, LogAnalysisResult

class LogProcessor:
    """Intelligent log parsing, normalization, pattern extraction, and anomaly detection."""

    SEVERITY_KEYWORDS = {
        "critical": ["fatal", "panic", "oom", "out of memory", "deadlock", "cascading", "circuit breaker open", "data corruption"],
        "high": ["psqlexception", "connection refused", "timeout", "timed out", "pool exhausted", "http 500", "504 gateway", "database error", "error"],
        "medium": ["warn", "warning", "latency high", "retry limit", "approaching timeout", "slow query"],
        "low": ["info", "debug", "trace"]
    }

    # Common log regex formats
    LOG_PATTERNS = [
        # 2026-11-07 09:14:02,104 INFO  [service-name] Message
        re.compile(r'^(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[,\.]\d+)?Z?)\s+(?P<level>[A-Z]+)\s+\[(?P<service>[^\]]+)\]\s*(?P<message>.*)$', re.IGNORECASE),
        # 2026-11-07T08:14:05.312Z [service] [LEVEL] Message
        re.compile(r'^(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s*\[(?P<service>[^\]]+)\]\s*\[(?P<level>[A-Z]+)\]\s*(?P<message>.*)$', re.IGNORECASE),
        # [2026-11-07 08:14:05] [LEVEL] (service) Message
        re.compile(r'^\[(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?)\]\s*\[(?P<level>[A-Z]+)\]\s*(?:\((?P<service>[^\)]+)\))?\s*(?P<message>.*)$', re.IGNORECASE),
        # LEVEL: service: 2026-11-07 08:14:05 - Message
        re.compile(r'^(?P<level>FATAL|ERROR|WARN|INFO|DEBUG)\s*:\s*(?P<service>[a-zA-Z0-9_-]+)\s*:\s*(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})?\s*-\s*(?P<message>.*)$', re.IGNORECASE),
    ]

    def parse_logs(self, raw_content: str, filename: str = "upload.log") -> LogAnalysisResult:
        raw_content = raw_content.strip()
        parsed_entries: List[LogEntry] = []
        
        # Check if JSON
        if (raw_content.startswith('[') and raw_content.endswith(']')) or (raw_content.startswith('{') and raw_content.endswith('}')):
            try:
                parsed_json = json.loads(raw_content)
                if isinstance(parsed_json, dict):
                    parsed_json = [parsed_json]
                for item in parsed_json:
                    entry = self._parse_json_entry(item)
                    if entry:
                        parsed_entries.append(entry)
            except Exception:
                parsed_entries = self._parse_line_by_line(raw_content, filename)
        else:
            parsed_entries = self._parse_line_by_line(raw_content, filename)

        if not parsed_entries:
            # Fallback if no specific format matched
            lines = [l.strip() for l in raw_content.splitlines() if l.strip()]
            for l in lines:
                lvl = "INFO"
                if "fatal" in l.lower(): lvl = "FATAL"
                elif "error" in l.lower(): lvl = "ERROR"
                elif "warn" in l.lower(): lvl = "WARN"
                parsed_entries.append(LogEntry(
                    id=str(uuid.uuid4()),
                    timestamp=datetime.utcnow(),
                    level=lvl,
                    service_name=self._extract_service_name_fallback(l, filename),
                    message=l,
                    raw_entry=l,
                    error_pattern=self._extract_error_pattern(l),
                    is_anomaly=(lvl in ["FATAL", "ERROR"])
                ))

        # Perform intelligent analysis
        return self._analyze_parsed_entries(parsed_entries, filename)

    def _parse_json_entry(self, item: Dict[str, Any]) -> LogEntry:
        timestamp = None
        ts_val = item.get("timestamp") or item.get("time") or item.get("@timestamp")
        if ts_val:
            try:
                timestamp = datetime.fromisoformat(str(ts_val).replace("Z", "+00:00"))
            except Exception:
                timestamp = datetime.utcnow()
        else:
            timestamp = datetime.utcnow()

        level = str(item.get("level") or item.get("severity") or "INFO").upper()
        service = str(item.get("service") or item.get("service_name") or item.get("app") or "unknown-service")
        message = str(item.get("message") or item.get("msg") or json.dumps(item))
        error_pattern = self._extract_error_pattern(message)

        return LogEntry(
            id=str(uuid.uuid4()),
            timestamp=timestamp,
            level=level,
            service_name=service,
            message=message,
            raw_entry=json.dumps(item),
            error_pattern=error_pattern,
            is_anomaly=level in ["FATAL", "ERROR", "CRITICAL"],
            context_data={k: v for k, v in item.items() if k not in ["message", "level", "timestamp", "service"]}
        )

    def _parse_line_by_line(self, content: str, filename: Optional[str] = "upload.log") -> List[LogEntry]:
        entries: List[LogEntry] = []
        lines = content.splitlines()

        for line in lines:
            trimmed = line.strip()
            if not trimmed:
                continue

            matched = False
            for pat in self.LOG_PATTERNS:
                m = pat.match(trimmed)
                if m:
                    gd = m.groupdict()
                    ts = self._parse_timestamp(gd.get("timestamp"))
                    level = (gd.get("level") or "INFO").upper()
                    service = gd.get("service") or "system-service"
                    if "," in service:
                        service = service.split(",")[0].strip()
                    if " " in service:
                        service = service.split()[0].strip()
                    msg = gd.get("message") or trimmed
                    pattern = self._extract_error_pattern(msg)
                    is_anomaly = level in ["FATAL", "ERROR", "CRITICAL"] or "timeout" in msg.lower() or "exception" in msg.lower()

                    entries.append(LogEntry(
                        id=str(uuid.uuid4()),
                        timestamp=ts,
                        level=level,
                        service_name=service.strip(),
                        message=msg.strip(),
                        raw_entry=trimmed,
                        error_pattern=pattern,
                        is_anomaly=is_anomaly,
                        context_data={}
                    ))
                    matched = True
                    break

            if not matched:
                # If stack trace or continuation
                if entries and (trimmed.startswith("at ") or trimmed.startswith("Caused by:") or trimmed.startswith("Traceback")):
                    entries[-1].message += "\n" + trimmed
                    entries[-1].raw_entry += "\n" + trimmed
                    entries[-1].is_anomaly = True
                else:
                    level = "INFO"
                    if "fatal" in trimmed.lower(): level = "FATAL"
                    elif "error" in trimmed.lower() or "exception" in trimmed.lower(): level = "ERROR"
                    elif "warn" in trimmed.lower(): level = "WARN"

                    inherited_srv = entries[-1].service_name if entries else self._extract_service_name_fallback(trimmed, filename or "upload.log")
                    entries.append(LogEntry(
                        id=str(uuid.uuid4()),
                        timestamp=datetime.utcnow(),
                        level=level,
                        service_name=inherited_srv,
                        message=trimmed,
                        raw_entry=trimmed,
                        error_pattern=self._extract_error_pattern(trimmed),
                        is_anomaly=(level in ["FATAL", "ERROR"])
                    ))

        return entries

    def _parse_timestamp(self, ts_str: Optional[str]) -> datetime:
        if not ts_str:
            return datetime.utcnow()
        try:
            cleaned = ts_str.replace(",", ".").replace("Z", "+00:00").replace("[", "").replace("]", "")
            return datetime.fromisoformat(cleaned)
        except Exception:
            return datetime.utcnow()

    def _extract_service_name_fallback(self, line: str, filename: str) -> str:
        # Check brackets [service-name]
        m = re.search(r'\[([a-zA-Z0-9_\-]+)\]', line)
        if m:
            candidate = m.group(1).lower()
            if candidate not in ["info", "warn", "error", "fatal", "debug"]:
                return candidate
        base = filename.split('.')[0].replace('_', '-').replace('incident', '').strip('-')
        return base if base else "production-service"

    def _extract_error_pattern(self, msg: str) -> Optional[str]:
        # Identify common error families (check specific patterns before generic)
        msg_lower = msg.lower()
        if "deadlock" in msg_lower:
            return "Database Lock Contention / Deadlock"
        if "gateway timeout" in msg_lower or "504" in msg_lower:
            return "HTTP 504 Gateway Timeout"
        if "pool exhausted" in msg_lower or "connection is not available" in msg_lower or "hikaripool" in msg_lower:
            return "Connection Pool Exhaustion"
        if "oom" in msg_lower or "out of memory" in msg_lower or "maxmemory" in msg_lower:
            return "Out of Memory (OOM) / Eviction Limit Exceeded"
        if "psqlexception" in msg_lower or "database connection" in msg_lower:
            return "PostgreSQL Database Connection Failure"
        if "timeout" in msg_lower or "timed out" in msg_lower:
            return "Connection or Request Timeout"
        if "circuitbreaker" in msg_lower or "circuit breaker" in msg_lower:
            return "Circuit Breaker Tripped"
        if "exception" in msg_lower:
            words = msg.split()
            for w in words:
                if "Exception" in w or "Error" in w:
                    return w.strip(":,()[]")
            return "Application Exception"
        return None

    def _analyze_parsed_entries(self, entries: List[LogEntry], filename: str) -> LogAnalysisResult:
        total = len(entries)
        errors = [e for e in entries if e.level in ["ERROR", "FATAL", "CRITICAL"]]
        warns = [e for e in entries if e.level in ["WARN", "WARNING"]]
        infos = [e for e in entries if e.level in ["INFO", "DEBUG"]]

        # Determine dominant service
        service_counts: Dict[str, int] = {}
        for e in entries:
            s = e.service_name or "unknown"
            service_counts[s] = service_counts.get(s, 0) + 1
        dominant_service = max(service_counts, key=service_counts.get) if service_counts else "system-service"

        # Patterns
        patterns = list({e.error_pattern for e in entries if e.error_pattern})

        # Anomalies
        anomalies = []
        for e in entries:
            if e.is_anomaly or e.level in ["FATAL", "ERROR"]:
                anomalies.append({
                    "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                    "level": e.level,
                    "pattern": e.error_pattern,
                    "message": e.message
                })

        # Classify severity
        full_text = " ".join([e.message.lower() for e in entries])
        has_fatal = any(e.level in ["FATAL", "CRITICAL"] for e in entries)
        severity = "low"
        if has_fatal or "oom" in full_text or "deadlock" in full_text or "cascading" in full_text:
            severity = "critical"
        elif len(errors) > 0 or "psqlexception" in full_text or "timed out" in full_text:
            severity = "high"
        elif len(warns) > 0:
            severity = "medium"

        # Generate title
        if patterns:
            suggested_title = f"{dominant_service}: {patterns[0]} Incident"
        elif errors:
            suggested_title = f"{dominant_service}: {errors[0].message[:60]}"
        else:
            suggested_title = f"{dominant_service}: Service Health Degradation"

        # Generate detailed explanation of why an incident was detected
        explanation_parts = []
        explanation_parts.append(f"Analyzed {total} log entries across service '{dominant_service}'.")
        if errors:
            explanation_parts.append(f"Detected {len(errors)} ERROR/FATAL events within log window.")
        if patterns:
            explanation_parts.append(f"Identified primary failure patterns: {', '.join(patterns)}.")
        if "pool" in full_text and "exhaust" in full_text:
            explanation_parts.append("Symptoms reveal connection pool saturation preventing transaction checkouts.")
        if "oom" in full_text or "maxmemory" in full_text:
            explanation_parts.append("Symptoms reveal memory exhaustion triggering rejection of write operations.")
        if "circuitbreaker" in full_text or "circuit breaker" in full_text:
            explanation_parts.append("Downstream circuit breaker tripped to protect downstream dependencies from cascade.")

        explanation = " ".join(explanation_parts)

        return LogAnalysisResult(
            service_detected=dominant_service,
            detected_severity=severity,
            suggested_title=suggested_title,
            explanation=explanation,
            error_patterns=patterns,
            anomalies_detected=anomalies[:15],
            total_lines=total,
            error_count=len(errors),
            warn_count=len(warns),
            info_count=len(infos),
            parsed_entries=entries[:200], # return up to 200 entries for responsive UI
            extracted_context={
                "dominant_service": dominant_service,
                "first_error_timestamp": errors[0].timestamp.isoformat() if errors and errors[0].timestamp else None,
                "error_rate_pct": round((len(errors) / total) * 100, 1) if total > 0 else 0,
                "patterns": patterns
            }
        )

log_processor = LogProcessor()

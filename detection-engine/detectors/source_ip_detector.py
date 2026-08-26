from models.event import SecurityEvent
from rules.security_rules import (
    SUSPICIOUS_SOURCE_IPS,
    SOURCE_IP_RULE,
)


def detect_source_ip_activity(
    event: SecurityEvent
) -> dict | None:
    """
    Detect security events originating from
    a known suspicious source IP.
    """

    if event.source_ip not in SUSPICIOUS_SOURCE_IPS:
        return None

    return {
        "rule": SOURCE_IP_RULE["name"],
        "severity": SOURCE_IP_RULE["severity"],
        "risk_score": SOURCE_IP_RULE["risk_score"],
        "event_id": event.event_id,
        "user": event.user,
        "source_ip": event.source_ip,
        "action": event.action,
        "resource": event.resource,
    }

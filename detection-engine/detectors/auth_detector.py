from models.event import SecurityEvent
from rules.security_rules import SUSPICIOUS_AUTH_ACTIONS, AUTH_RULE


def detect_auth_activity(event: SecurityEvent) -> dict | None:
    """
    Detect suspicious authentication activity.
    """

    if event.action not in SUSPICIOUS_AUTH_ACTIONS:
        return None

    return {
        "rule": AUTH_RULE["name"],
        "severity": AUTH_RULE["severity"],
        "risk_score": AUTH_RULE["risk_score"],
        "event_id": event.event_id,
        "user": event.user,
        "source_ip": event.source_ip,
        "action": event.action,
        "resource": event.resource,
    }
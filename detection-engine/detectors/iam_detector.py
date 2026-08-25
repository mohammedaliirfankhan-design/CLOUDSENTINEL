from models.event import SecurityEvent
from rules.security_rules import (
    SUSPICIOUS_IAM_ACTIONS,
    PRIVILEGE_ESCALATION_ACTIONS,
    IAM_RULE,
    PRIVILEGE_ESCALATION_RULE,
)


def detect_iam_activity(event: SecurityEvent) -> dict | None:
    """
    Detect potentially suspicious IAM activity
    and privilege escalation activity.
    """

    if event.action in PRIVILEGE_ESCALATION_ACTIONS:
        rule = PRIVILEGE_ESCALATION_RULE

    elif event.action in SUSPICIOUS_IAM_ACTIONS:
        rule = IAM_RULE

    else:
        return None

    return {
        "rule": rule["name"],
        "severity": rule["severity"],
        "risk_score": rule["risk_score"],
        "event_id": event.event_id,
        "user": event.user,
        "source_ip": event.source_ip,
        "action": event.action,
        "resource": event.resource,
    }
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "detection-engine"))

from models.event import SecurityEvent
from detectors.iam_detector import detect_iam_activity


def create_event(action: str) -> SecurityEvent:
    return SecurityEvent(
        event_id="test-iam-001",
        timestamp=datetime.now(timezone.utc),
        source="AWS",
        event_type="IAM",
        action=action,
        user="test-admin",
        source_ip="203.0.113.50",
        resource="user/test-admin",
    )


def test_suspicious_iam_action_is_detected():
    event = create_event("CreateAccessKey")

    result = detect_iam_activity(event)

    assert result is not None
    assert result["rule"] == "SUSPICIOUS_IAM_ACTIVITY"
    assert result["severity"] == "HIGH"
    assert result["risk_score"] == 75


def test_normal_iam_action_is_ignored():
    event = create_event("ListUsers")

    result = detect_iam_activity(event)

    assert result is None

def test_privilege_escalation_action_is_detected():
    event = create_event("AttachRolePolicy")

    result = detect_iam_activity(event)

    assert result is not None
    assert result["rule"] == "PRIVILEGE_ESCALATION"
    assert result["severity"] == "CRITICAL"
    assert result["risk_score"] == 90
import sys

sys.path.insert(0, "detection-engine")
sys.path.insert(0, ".")

from datetime import datetime, timezone

from models.event import SecurityEvent
from detectors.source_ip_detector import detect_source_ip_activity
from pipeline import process_event


def make_event(
    source_ip: str,
    action: str = "SuccessfulLogin"
) -> SecurityEvent:
    return SecurityEvent(
        event_id="test-source-ip",
        timestamp=datetime.now(timezone.utc),
        source="application",
        event_type="AUTHENTICATION",
        action=action,
        user="test-user",
        source_ip=source_ip,
        resource="Authentication",
    )


def test_suspicious_source_ip_is_detected():
    event = make_event("203.0.113.10")

    result = detect_source_ip_activity(event)

    assert result is not None
    assert result["rule"] == "SUSPICIOUS_SOURCE_IP"
    assert result["severity"] == "HIGH"
    assert result["risk_score"] == 80
    assert result["source_ip"] == "203.0.113.10"


def test_normal_source_ip_is_not_detected():
    event = make_event("192.168.1.100")

    result = detect_source_ip_activity(event)

    assert result is None


def test_second_suspicious_source_ip_is_detected():
    event = make_event("203.0.113.50")

    result = detect_source_ip_activity(event)

    assert result is not None
    assert result["rule"] == "SUSPICIOUS_SOURCE_IP"
    assert result["risk_score"] == 80


def test_privilege_escalation_has_priority_over_source_ip():
    event = make_event(
        "203.0.113.50",
        action="AttachRolePolicy"
    )

    result = process_event(event)

    assert result is not None
    assert result["rule"] == "PRIVILEGE_ESCALATION"
    assert result["severity"] == "CRITICAL"
    assert result["risk_score"] == 90
    assert result["risk_level"] == "CRITICAL"

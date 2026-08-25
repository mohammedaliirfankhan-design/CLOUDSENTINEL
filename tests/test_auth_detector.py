import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1] / "detection-engine")
)

from models.event import SecurityEvent
from detectors.auth_detector import detect_auth_activity


def create_event(action: str) -> SecurityEvent:
    return SecurityEvent(
        event_id="test-auth-001",
        timestamp=datetime.now(timezone.utc),
        source="AWS",
        event_type="AUTHENTICATION",
        action=action,
        user="test-admin",
        source_ip="203.0.113.50",
        resource=None,
    )


def test_failed_login_is_detected():
    event = create_event("FailedLogin")

    result = detect_auth_activity(event)

    assert result is not None
    assert result["rule"] == "MULTIPLE_FAILED_LOGINS"
    assert result["severity"] == "MEDIUM"
    assert result["risk_score"] == 50


def test_normal_login_is_ignored():
    event = create_event("SuccessfulLogin")

    result = detect_auth_activity(event)

    assert result is None
import sys

sys.path.insert(0, "detection-engine")
sys.path.insert(0, ".")

from models.event import SecurityEvent
from detectors.iam_detector import detect_iam_activity
from detectors.auth_detector import detect_auth_activity
from detectors.source_ip_detector import detect_source_ip_activity
from scoring.risk_scorer import calculate_risk
from database.alert_store import initialize_database, insert_alert


def process_event(event: SecurityEvent) -> dict | None:
    """
    Process a security event through detection and risk scoring.
    """

    # Step 1: Try IAM detection
    alert = detect_iam_activity(event)

    # Step 2: If IAM rule does not match, try authentication detection
    if alert is None:
        alert = detect_auth_activity(event)

    # Step 3: If authentication rule does not match,
    # try suspicious source-IP detection
    if alert is None:
        alert = detect_source_ip_activity(event)

    # No suspicious activity detected
    if alert is None:
        return None

    # Step 4: Calculate standardized risk
    risk = calculate_risk(alert)

    # Step 5: Combine detection + risk information
    return {
        **alert,
        **risk
    }


if __name__ == "__main__":
    from datetime import datetime, timezone

    event = SecurityEvent(
        event_id="auth-002",
        timestamp=datetime.now(timezone.utc),
        source="application",
        event_type="AUTHENTICATION",
        action="FailedLogin",
        user="test-admin",
        source_ip="203.0.113.10",
    )

    initialize_database()

    result = process_event(event)

    print("=== CLOUDSENTINEL PIPELINE RESULT ===")
    print(result)

    if result is not None:
        insert_alert(result)
        print("Alert stored in database successfully")

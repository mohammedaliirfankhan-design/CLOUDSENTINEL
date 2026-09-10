import sys

sys.path.insert(0, "detection-engine")

from fastapi import APIRouter

from ingestion.event_normalizer import normalize_event
from pipeline import process_event
from database.alert_store import (
    insert_alert,
    get_users,
    create_notification,
)


router = APIRouter()


@router.post("/events")
def ingest_event(data: dict):
    """
    Receive a raw security event, normalize it,
    process it through the detection engine,
    and store an alert when suspicious activity is detected.
    """

    # Step 1: Normalize incoming data
    event = normalize_event(data)

    # Step 2: Run the event through CloudSentinel detection pipeline
    result = process_event(event)

    # Step 3: No suspicious activity detected
    if result is None:
        return {
            "message": "Event processed",
            "alert_created": False
        }

    # Step 4: Store detected alert and capture its database ID
    alert_id = insert_alert(result)

    # Step 5: Create notifications for important security alerts
    risk_level = result.get("risk_level")

    if risk_level in ("HIGH", "CRITICAL"):
        users = get_users()

        notification_title = (
            "Critical security alert detected"
            if risk_level == "CRITICAL"
            else "High-severity security alert detected"
        )

        notification_message = (
            f"{result.get('rule', 'Security rule triggered')} "
            f"for user {result.get('user') or 'Unknown'}"
        )

        for user in users:
            if not user["is_active"]:
                continue

            create_notification(
                user_id=user["id"],
                notification_type="SECURITY_ALERT",
                severity=risk_level,
                title=notification_title,
                message=notification_message,
                alert_id=alert_id,
            )

    return {
        "message": "Event processed",
        "alert_created": True,
        "alert": result
    }

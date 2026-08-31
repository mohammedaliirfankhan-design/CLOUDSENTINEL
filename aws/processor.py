import sys
from datetime import datetime

sys.path.insert(0, "detection-engine")

from aws.collector import AWSCloudTrailCollector
from models.event import SecurityEvent
from pipeline import process_event

from database.alert_store import (
    insert_alert,
    get_users,
    create_notification,
    is_aws_event_processed,
    mark_aws_event_processed,
)


class AWSCloudTrailProcessor:
    """
    Collect real AWS CloudTrail events and process them
    through the existing CloudSentinel detection pipeline.

    Events are tracked using the aws_processed_events table
    to prevent duplicate processing.
    """

    def __init__(
        self,
        profile_name: str = "cloudsentinel-audit",
        region_name: str = "ap-south-1",
    ) -> None:
        self.collector = AWSCloudTrailCollector(
            profile_name=profile_name,
            region_name=region_name,
        )

    def to_security_event(
        self,
        normalized_event: dict,
    ) -> SecurityEvent:
        """Convert a normalized AWS event into SecurityEvent."""

        timestamp = normalized_event["timestamp"]

        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)

        return SecurityEvent(
            event_id=normalized_event["event_id"],
            timestamp=timestamp,
            source=normalized_event["source"],
            event_type=normalized_event["event_type"],
            action=normalized_event["action"],
            user=normalized_event.get("user"),
            source_ip=normalized_event.get("source_ip"),
            resource=normalized_event.get("resource"),
            raw_data=normalized_event.get("raw_data", {}),
        )

    def process_events(
        self,
        max_results: int = 50,
    ) -> list[dict]:
        """
        Collect AWS events, skip events that have already been
        processed, convert new events to SecurityEvent, and
        process them through CloudSentinel.
        """

        normalized_events = (
            self.collector.collect_normalized_events(
                max_results=max_results
            )
        )

        alerts = []

        for normalized_event in normalized_events:

            # Get the unique CloudTrail event ID.
            event_id = normalized_event.get("event_id")

            # Ignore malformed events that have no event ID.
            if not event_id:
                continue

            # Prevent duplicate processing.
            if is_aws_event_processed(event_id):
                continue

            # Convert normalized AWS event into CloudSentinel event.
            event = self.to_security_event(
                normalized_event
            )

            # Run the event through the existing detection engine.
            result = process_event(event)

            # Mark the CloudTrail event as processed.
            mark_aws_event_processed(event_id)

            # No suspicious activity detected.
            if result is None:
                continue

            # Store the detected alert.
            alert_id = insert_alert(result)

            # Get the risk level assigned by the detection pipeline.
            risk_level = result.get("risk_level")

            # Create notifications for high/critical alerts.
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

            # Return the created alert.
            alerts.append(
                {
                    "alert_id": alert_id,
                    "alert": result,
                }
            )

        return alerts
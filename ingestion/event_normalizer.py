from datetime import datetime, timezone
from models.event import SecurityEvent


def normalize_event(data: dict) -> SecurityEvent:
    """
    Convert a raw incoming event dictionary into
    CloudSentinel's standardized SecurityEvent model.
    """

    timestamp = data.get("timestamp")

    if timestamp:
        timestamp = datetime.fromisoformat(
            timestamp.replace("Z", "+00:00")
        )
    else:
        timestamp = datetime.now(timezone.utc)

    return SecurityEvent(
        event_id=data["event_id"],
        timestamp=timestamp,
        source=data.get("source", "unknown"),
        event_type=data["event_type"],
        action=data["action"],
        user=data.get("user"),
        source_ip=data.get("source_ip"),
        resource=data.get("resource"),
        raw_data=data
    )
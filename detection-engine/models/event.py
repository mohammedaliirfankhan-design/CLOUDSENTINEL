from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class SecurityEvent:
    """
    Standardized security event used by CLOUDSENTINEL.

    Every incoming cloud/security event will be converted
    into this structure before detection.
    """

    event_id: str
    timestamp: datetime
    source: str
    event_type: str
    action: str

    user: str | None = None
    source_ip: str | None = None
    resource: str | None = None

    raw_data: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """Normalize the event after creation."""

        if self.timestamp.tzinfo is None:
            self.timestamp = self.timestamp.replace(tzinfo=timezone.utc)

    def summary(self) -> str:
        """Return a human-readable summary of the event."""

        return (
            f"{self.event_type} | "
            f"Action: {self.action} | "
            f"User: {self.user or 'Unknown'} | "
            f"IP: {self.source_ip or 'Unknown'}"
        )
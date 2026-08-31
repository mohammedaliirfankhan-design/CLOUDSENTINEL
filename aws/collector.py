import json
import boto3
from datetime import datetime, timezone
from typing import Any


class AWSCloudTrailCollector:
    """
    Read-only AWS CloudTrail collector for CloudSentinel.

    The collector uses the dedicated CloudSentinel audit profile
    and retrieves recent CloudTrail management events.
    """

    def __init__(
        self,
        profile_name: str = "cloudsentinel-audit",
        region_name: str = "ap-south-1",
    ) -> None:
        self.profile_name = profile_name
        self.region_name = region_name

        self.session = boto3.Session(
            profile_name=self.profile_name,
            region_name=self.region_name,
        )

        self.cloudtrail = self.session.client("cloudtrail")

    def collect_events(
        self,
        max_results: int = 50,
    ) -> list[dict[str, Any]]:
        """
        Retrieve recent CloudTrail events.

        This method is strictly read-only.
        It does not modify AWS resources.
        """

        response = self.cloudtrail.lookup_events(
            MaxResults=max_results
        )

        return response.get("Events", [])

    def _parse_cloudtrail_event(
        self,
        cloudtrail_event: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Parse CloudTrail's embedded CloudTrailEvent JSON.

        lookup_events() returns some important details inside
        the CloudTrailEvent field as a JSON string.
        """

        raw_event = cloudtrail_event.get("CloudTrailEvent")

        if not raw_event:
            return {}

        if isinstance(raw_event, dict):
            return raw_event

        try:
            return json.loads(raw_event)
        except (TypeError, json.JSONDecodeError):
            return {}

    def normalize_event(
        self,
        cloudtrail_event: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Convert an AWS CloudTrail event into CloudSentinel's
        generic event format while preserving useful telemetry.
        """

        event_id = cloudtrail_event.get("EventId")

        event_name = cloudtrail_event.get(
            "EventName",
            "Unknown",
        )

        username = cloudtrail_event.get("Username")

        event_time = cloudtrail_event.get("EventTime")

        if isinstance(event_time, datetime):
            timestamp = event_time.astimezone(
                timezone.utc
            ).isoformat()
        else:
            timestamp = datetime.now(
                timezone.utc
            ).isoformat()

        parsed_event = self._parse_cloudtrail_event(
            cloudtrail_event
        )

        source_ip = parsed_event.get("sourceIPAddress")

        event_source = parsed_event.get(
            "eventSource",
            cloudtrail_event.get("EventSource"),
        )

        aws_region = parsed_event.get(
            "awsRegion",
            self.region_name,
        )

        resources = cloudtrail_event.get(
            "Resources",
            []
        )

        resource = None

        if resources:
            resource = resources[0].get(
                "ResourceName"
            )

        request_parameters = parsed_event.get(
            "requestParameters"
        )

        response_elements = parsed_event.get(
            "responseElements"
        )

        return {
            "event_id": event_id,
            "timestamp": timestamp,
            "source": "AWS_CLOUDTRAIL",
            "event_type": "AWS_API_CALL",
            "action": event_name,
            "user": username,
            "source_ip": source_ip,
            "resource": resource,

            "raw_data": cloudtrail_event,

            # Additional AWS telemetry
            "event_source": event_source,
            "aws_region": aws_region,
            "request_parameters": request_parameters,
            "response_elements": response_elements,
        }

    def collect_normalized_events(
        self,
        max_results: int = 50,
    ) -> list[dict[str, Any]]:
        """
        Retrieve CloudTrail events and convert them
        into CloudSentinel's normalized event format.
        """

        raw_events = self.collect_events(
            max_results=max_results
        )

        return [
            self.normalize_event(event)
            for event in raw_events
        ]
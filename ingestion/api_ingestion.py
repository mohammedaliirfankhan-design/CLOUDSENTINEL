import sys

sys.path.insert(0, "detection-engine")

from fastapi import APIRouter

from ingestion.event_normalizer import normalize_event
from pipeline import process_event
from database.alert_store import insert_alert


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

    # Step 4: Store detected alert
    insert_alert(result)

    return {
        "message": "Event processed",
        "alert_created": True,
        "alert": result
    }
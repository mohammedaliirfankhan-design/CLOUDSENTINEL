from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.alert_store import (
    get_alerts,
    save_investigation,
    get_investigation,
    initialize_database,
    get_soc_metrics,
    get_investigation_history
)
from ingestion.api_ingestion import router as ingestion_router

app = FastAPI(
    title="CloudSentinel API",
    description="Backend API for CloudSentinel security monitoring platform",
    version="1.0.0"
)
app.include_router(ingestion_router)
initialize_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "CloudSentinel API is running",
        "status": "online"
    }


@app.get("/alerts")
def alerts():
    rows = get_alerts()

    columns = [
        "id",
        "event_id",
        "rule",
        "severity",
        "risk_score",
        "risk_level",
        "user",
        "source_ip",
        "action",
        "resource",
        "created_at",
        "investigation_status",
        "assigned_analyst"
    ]

    return [
        dict(zip(columns, row))
        for row in rows
    ]
@app.post("/investigations")
def save_investigation_endpoint(data: dict[str, str | int]):
    raw_alert_id = data.get("alert_id")
    raw_status = data.get("status")

    if raw_alert_id is None or raw_status is None:
        return {
            "error": "alert_id and status are required"
        }

    alert_id = int(raw_alert_id)
    status = str(raw_status)
    analyst_notes = str(data.get("analyst_notes", ""))
    assigned_analyst = str(data.get("assigned_analyst", ""))

    save_investigation(
        alert_id,
        status,
        analyst_notes,
        assigned_analyst
    )

    return {
        "message": "Investigation saved successfully",
        "alert_id": alert_id,
        "status": status,
        "assigned_analyst": assigned_analyst
    }


@app.get("/investigations/{alert_id}")
def get_investigation_endpoint(alert_id: int):
    investigation = get_investigation(alert_id)

    if investigation is None:
        return {
            "message": "No investigation found",
            "alert_id": alert_id
        }
    return investigation
@app.get("/investigations/{alert_id}/history")
def get_investigation_history_endpoint(alert_id: int):
    return get_investigation_history(alert_id)
@app.get("/metrics")
def get_metrics_endpoint():
    return get_soc_metrics()
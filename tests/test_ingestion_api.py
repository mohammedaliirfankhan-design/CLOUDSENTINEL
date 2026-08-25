from fastapi.testclient import TestClient

from backend.main import app
import ingestion.api_ingestion as api_ingestion


client = TestClient(app)


def test_suspicious_event_creates_alert(monkeypatch):
    inserted_alerts = []

    def fake_insert_alert(alert):
        inserted_alerts.append(alert)

    monkeypatch.setattr(
        api_ingestion,
        "insert_alert",
        fake_insert_alert
    )

    payload = {
        "event_id": "integration-iam-001",
        "timestamp": "2026-08-25T10:00:00Z",
        "source": "AWS",
        "event_type": "IAM",
        "action": "CreateAccessKey",
        "user": "test-admin",
        "source_ip": "203.0.113.50",
        "resource": "user/test-admin"
    }

    response = client.post("/events", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Event processed"
    assert data["alert_created"] is True
    assert data["alert"]["rule"] == "SUSPICIOUS_IAM_ACTIVITY"
    assert data["alert"]["severity"] == "HIGH"
    assert data["alert"]["risk_score"] == 75

    assert len(inserted_alerts) == 1
    assert inserted_alerts[0]["event_id"] == "integration-iam-001"


def test_normal_event_does_not_create_alert(monkeypatch):
    inserted_alerts = []

    def fake_insert_alert(alert):
        inserted_alerts.append(alert)

    monkeypatch.setattr(
        api_ingestion,
        "insert_alert",
        fake_insert_alert
    )

    payload = {
        "event_id": "integration-normal-001",
        "timestamp": "2026-08-25T10:00:00Z",
        "source": "AWS",
        "event_type": "S3",
        "action": "GetObject",
        "user": "test-admin",
        "source_ip": "203.0.113.50",
        "resource": "bucket/test-bucket/file.txt"
    }

    response = client.post("/events", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Event processed"
    assert data["alert_created"] is False

    assert len(inserted_alerts) == 0
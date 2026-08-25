import sys
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1] / "detection-engine")
)

from scoring.risk_scorer import calculate_risk


def test_critical_risk():
    result = calculate_risk({
        "risk_score": 90,
        "rule": "TEST_RULE",
        "event_id": "test-001"
    })

    assert result["risk_level"] == "CRITICAL"


def test_high_risk():
    result = calculate_risk({
        "risk_score": 75,
        "rule": "TEST_RULE",
        "event_id": "test-002"
    })

    assert result["risk_level"] == "HIGH"


def test_medium_risk():
    result = calculate_risk({
        "risk_score": 50,
        "rule": "TEST_RULE",
        "event_id": "test-003"
    })

    assert result["risk_level"] == "MEDIUM"


def test_low_risk():
    result = calculate_risk({
        "risk_score": 20,
        "rule": "TEST_RULE",
        "event_id": "test-004"
    })

    assert result["risk_level"] == "LOW"
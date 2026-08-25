def calculate_risk(alert: dict) -> dict:
    """
    Convert an alert's risk score into a standardized risk level.
    """

    score = alert.get("risk_score", 0)

    if score >= 90:
        level = "CRITICAL"
    elif score >= 70:
        level = "HIGH"
    elif score >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "risk_score": score,
        "risk_level": level,
        "rule": alert.get("rule"),
        "event_id": alert.get("event_id"),
    }
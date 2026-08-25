import sqlite3


DATABASE_NAME = "cloudsentinel.db"


def get_connection():
    """Create and return a connection to the CloudSentinel database."""
    return sqlite3.connect(DATABASE_NAME)


def initialize_database():
    """Create and migrate CloudSentinel database tables."""

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            rule TEXT NOT NULL,
            severity TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            user TEXT,
            source_ip TEXT,
            action TEXT,
            resource TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investigations (
            alert_id INTEGER PRIMARY KEY,
            status TEXT NOT NULL DEFAULT 'OPEN',
            analyst_notes TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            FOREIGN KEY (alert_id) REFERENCES alerts(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investigation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            analyst_notes TEXT,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (alert_id) REFERENCES alerts(id)
        )
    """)

    # Add resolved_at to existing databases if the column is missing
    cursor.execute("PRAGMA table_info(investigations)")

    investigation_columns = [
        row[1]
        for row in cursor.fetchall()
    ]

    if "resolved_at" not in investigation_columns:

        cursor.execute("""
            ALTER TABLE investigations
            ADD COLUMN resolved_at TIMESTAMP
        """)

        # Preserve historical resolution timestamps
        cursor.execute("""
            UPDATE investigations
            SET resolved_at = updated_at
            WHERE status = 'RESOLVED'
              AND resolved_at IS NULL
        """)

    # Add assigned_analyst to existing investigations databases
    cursor.execute("PRAGMA table_info(investigations)")

    investigation_columns = [
        row[1]
        for row in cursor.fetchall()
    ]

    if "assigned_analyst" not in investigation_columns:

        cursor.execute("""
            ALTER TABLE investigations
            ADD COLUMN assigned_analyst TEXT
        """)

    # Add assigned_analyst to existing investigation history databases
    cursor.execute("PRAGMA table_info(investigation_history)")

    history_columns = [
        row[1]
        for row in cursor.fetchall()
    ]

    if "assigned_analyst" not in history_columns:

        cursor.execute("""
            ALTER TABLE investigation_history
            ADD COLUMN assigned_analyst TEXT
        """)

    connection.commit()
    connection.close()

def insert_alert(alert: dict):
    """Store a processed security alert in the database."""

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO alerts (
            event_id,
            rule,
            severity,
            risk_score,
            risk_level,
            user,
            source_ip,
            action,
            resource
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            alert.get("event_id"),
            alert.get("rule"),
            alert.get("severity"),
            alert.get("risk_score"),
            alert.get("risk_level"),
            alert.get("user"),
            alert.get("source_ip"),
            alert.get("action"),
            alert.get("resource"),
        ),
    )

    connection.commit()
    connection.close()

def get_alerts():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
    SELECT
        a.id,
        a.event_id,
        a.rule,
        a.severity,
        a.risk_score,
        a.risk_level,
        a.user,
        a.source_ip,
        a.action,
        a.resource,
        a.created_at,
        COALESCE(i.status, 'OPEN') AS investigation_status,
        i.assigned_analyst
    FROM alerts a
    LEFT JOIN investigations i
        ON a.id = i.alert_id
    ORDER BY a.created_at DESC
""")

    alerts = cursor.fetchall()

    connection.close()

    return alerts

def save_investigation(
    alert_id: int,
    status: str,
    analyst_notes: str,
    assigned_analyst: str
):
    """Save or update an analyst investigation and record its history."""

    connection = get_connection()
    cursor = connection.cursor()

    if status == "RESOLVED":
        cursor.execute("""
            INSERT INTO investigations (
                alert_id,
                status,
                analyst_notes,
                assigned_analyst,
                updated_at,
                resolved_at
            )
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(alert_id)
            DO UPDATE SET
                status = excluded.status,
                analyst_notes = excluded.analyst_notes,
                assigned_analyst = excluded.assigned_analyst,
                updated_at = CURRENT_TIMESTAMP,
                resolved_at = CURRENT_TIMESTAMP
        """, (
            alert_id,
            status,
            analyst_notes,
            assigned_analyst
        ))

    else:
        cursor.execute("""
            INSERT INTO investigations (
                alert_id,
                status,
                analyst_notes,
                assigned_analyst,
                updated_at
            )
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(alert_id)
            DO UPDATE SET
                status = excluded.status,
                analyst_notes = excluded.analyst_notes,
                assigned_analyst = excluded.assigned_analyst,
                updated_at = CURRENT_TIMESTAMP
        """, (
            alert_id,
            status,
            analyst_notes,
            assigned_analyst
        ))

    # Record every investigation status change in history,
    # including RESOLVED.
    cursor.execute("""
        INSERT INTO investigation_history (
            alert_id,
            status,
            analyst_notes,
            assigned_analyst
        )
        VALUES (?, ?, ?, ?)
    """, (
        alert_id,
        status,
        analyst_notes,
        assigned_analyst
    ))

    connection.commit()
    connection.close()


def get_investigation(alert_id: int):
    """Retrieve the investigation for an alert."""

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            alert_id,
            status,
            analyst_notes,
            updated_at,
            assigned_analyst
        FROM investigations
        WHERE alert_id = ?
    """, (alert_id,))

    investigation = cursor.fetchone()

    connection.close()

    if investigation is None:
        return None

    return {
        "alert_id": investigation[0],
        "status": investigation[1],
        "analyst_notes": investigation[2],
        "updated_at": investigation[3],
        "assigned_analyst": investigation[4]
    }
def get_investigation_history(alert_id: int):
    """Retrieve the investigation history for an alert."""

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            alert_id,
            status,
            analyst_notes,
            changed_at,
            assigned_analyst
        FROM investigation_history
        WHERE alert_id = ?
        ORDER BY changed_at DESC, id DESC
    """, (alert_id,))

    rows = cursor.fetchall()

    connection.close()

    return [
        {
            "id": row[0],
            "alert_id": row[1],
            "status": row[2],
            "analyst_notes": row[3],
            "changed_at": row[4],
            "assigned_analyst": row[5]
        }
        for row in rows
    ]

def get_soc_metrics():
    """Return high-level SOC alert and investigation metrics."""

    connection = get_connection()
    cursor = connection.cursor()

    # Overall alert counts
    cursor.execute("""
        SELECT COUNT(*)
        FROM alerts
    """)
    total_alerts = cursor.fetchone()[0]

    # Status counts
    cursor.execute("""
        SELECT
            COALESCE(i.status, 'OPEN') AS status,
            COUNT(*)
        FROM alerts a
        LEFT JOIN investigations i
            ON a.id = i.alert_id
        GROUP BY COALESCE(i.status, 'OPEN')
    """)

    status_counts = {
        "OPEN": 0,
        "INVESTIGATING": 0,
        "RESOLVED": 0
    }

    for status, count in cursor.fetchall():
        if status in status_counts:
            status_counts[status] = count

    # High-risk alerts
    cursor.execute("""
        SELECT COUNT(*)
        FROM alerts
        WHERE risk_level = 'HIGH'
    """)
    high_risk_alerts = cursor.fetchone()[0]

    # Average resolution time in minutes
    cursor.execute("""
    SELECT AVG(
        (julianday(i.resolved_at) - julianday(a.created_at)) * 24 * 60
    )
    FROM alerts a
    JOIN investigations i
        ON a.id = i.alert_id
    WHERE i.status = 'RESOLVED'
      AND i.resolved_at IS NOT NULL
    """)

    avg_resolution_time = cursor.fetchone()[0]

    connection.close()

    return {
        "total_alerts": total_alerts,
        "open_alerts": status_counts["OPEN"],
        "investigating_alerts": status_counts["INVESTIGATING"],
        "resolved_alerts": status_counts["RESOLVED"],
        "high_risk_alerts": high_risk_alerts,
        "average_resolution_time_minutes": (
            round(avg_resolution_time, 2)
            if avg_resolution_time is not None
            else 0
        )
    }

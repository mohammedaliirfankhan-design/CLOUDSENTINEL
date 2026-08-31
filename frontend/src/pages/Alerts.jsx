import { useEffect, useMemo, useState } from "react"
import { getAlerts } from "../api/cloudsentinel"

function formatAlert(row) {
    return {
        id: row.event_id,
        alertId: row.id,
        title: row.rule,
        severity:
            row.severity.charAt(0) +
            row.severity.slice(1).toLowerCase(),
        status:
            row.investigation_status === "INVESTIGATING"
                ? "Investigating"
                : row.investigation_status === "RESOLVED"
                    ? "Resolved"
                    : "Open",
        source:
            row.action || row.resource
                ? "CloudTrail"
                : "Unknown",
        user: row.user || "Unknown",
        detail: row.action || row.resource || "Security event",
        time: row.created_at,
    }
}

function Alerts({ onAlertSelect }) {
    const [alerts, setAlerts] = useState([])
    const [search, setSearch] = useState("")
    const [severity, setSeverity] = useState("All")
    const [status, setStatus] = useState("All")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let cancelled = false

        async function loadAlerts() {
            try {
                const data = await getAlerts()

                if (cancelled || !Array.isArray(data)) {
                    return
                }

                setAlerts(data.map(formatAlert))
                setError("")
            } catch (loadError) {
                console.error("Failed to load alerts:", loadError)

                if (!cancelled) {
                    setError(
                        loadError.message ||
                        "Unable to load security alerts."
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadAlerts()

        return () => {
            cancelled = true
        }
    }, [])

    const filteredAlerts = useMemo(() => {
        return alerts.filter((alert) => {
            const matchesSearch =
                search.trim() === "" ||
                `${alert.id} ${alert.title} ${alert.user} ${alert.source} ${alert.detail}`
                    .toLowerCase()
                    .includes(search.toLowerCase())

            const matchesSeverity =
                severity === "All" || alert.severity === severity

            const matchesStatus =
                status === "All" || alert.status === status

            return matchesSearch && matchesSeverity && matchesStatus
        })
    }, [alerts, search, severity, status])

    return (
        <div className="alerts-page">
            <div className="page-heading">
                <div>
                    <h2>Security Alerts</h2>
                    <p>
                        Review, prioritize, and investigate detected security
                        alerts.
                    </p>
                </div>

                <div className="live-indicator">
                    <span className="status-dot"></span>
                    Live monitoring
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <section className="alert-summary-grid">
                <div className="alert-summary-card">
                    <span>Total alerts</span>
                    <strong>{alerts.length}</strong>
                </div>

                <div className="alert-summary-card critical">
                    <span>Critical</span>
                    <strong>
                        {alerts.filter(
                            (alert) => alert.severity === "Critical"
                        ).length}
                    </strong>
                </div>

                <div className="alert-summary-card high">
                    <span>High</span>
                    <strong>
                        {alerts.filter(
                            (alert) => alert.severity === "High"
                        ).length}
                    </strong>
                </div>

                <div className="alert-summary-card open">
                    <span>Open</span>
                    <strong>
                        {alerts.filter(
                            (alert) => alert.status === "Open"
                        ).length}
                    </strong>
                </div>
            </section>

            <section className="alerts-panel">
                <div className="alerts-toolbar">
                    <div className="alert-search">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="11" cy="11" r="7"></circle>
                            <path d="m20 20-4-4"></path>
                        </svg>

                        <input
                            type="text"
                            placeholder="Search alerts..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <div className="alert-filters">
                        <select
                            value={severity}
                            onChange={(event) =>
                                setSeverity(event.target.value)
                            }
                            aria-label="Filter by severity"
                        >
                            <option value="All">All severities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>

                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(event.target.value)
                            }
                            aria-label="Filter by status"
                        >
                            <option value="All">All statuses</option>
                            <option value="Open">Open</option>
                            <option value="Investigating">
                                Investigating
                            </option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                <div className="alerts-table-wrap">
                    {loading ? (
                        <div className="empty-alerts">
                            <strong>Loading alerts...</strong>
                            <span>
                                Retrieving security alerts from CloudSentinel.
                            </span>
                        </div>
                    ) : (
                        <>
                            <table className="alerts-table">
                                <thead>
                                    <tr>
                                        <th>Alert</th>
                                        <th>Severity</th>
                                        <th>Status</th>
                                        <th>Source</th>
                                        <th>User</th>
                                        <th>Detected</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredAlerts.map((alert) => (
                                        <tr
                                            key={alert.id}
                                            onClick={() =>
                                                onAlertSelect(alert)
                                            }
                                        >
                                            <td>
                                                <div className="alert-title-cell">
                                                    <span
                                                        className={`alert-severity-dot ${alert.severity.toLowerCase()}`}
                                                    ></span>

                                                    <div>
                                                        <strong>
                                                            {alert.title}
                                                        </strong>
                                                        <span>
                                                            {alert.id} ·{" "}
                                                            {alert.detail}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`severity-badge ${alert.severity.toLowerCase()}`}
                                                >
                                                    {alert.severity}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge ${alert.status
                                                        .toLowerCase()
                                                        .replace(" ", "-")}`}
                                                >
                                                    {alert.status}
                                                </span>
                                            </td>

                                            <td>{alert.source}</td>
                                            <td className="mono-cell">
                                                {alert.user}
                                            </td>
                                            <td className="time-cell">
                                                {alert.time}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredAlerts.length === 0 && (
                                <div className="empty-alerts">
                                    <strong>No alerts found</strong>
                                    <span>
                                        Try changing your search or filter
                                        criteria.
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    )
}

export default Alerts

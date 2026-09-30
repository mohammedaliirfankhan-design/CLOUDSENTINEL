import { useEffect, useMemo, useState } from "react"
import { getAlerts } from "../api/cloudsentinel"

function formatRelativeTime(timestamp) {
    if (!timestamp) {
        return "Unknown"
    }

    const value = String(timestamp)
    const normalized = value.includes("T")
        ? value
        : value.replace(" ", "T")

    const parsed = new Date(
        normalized.endsWith("Z") ? normalized : `${normalized}Z`
    )

    if (Number.isNaN(parsed.getTime())) {
        return value
    }

    const diffSeconds = Math.max(
        0,
        Math.floor((Date.now() - parsed.getTime()) / 1000)
    )

    if (diffSeconds < 60) {
        return "Just now"
    }

    const minutes = Math.floor(diffSeconds / 60)

    if (minutes < 60) {
        return `${minutes}m ago`
    }

    const hours = Math.floor(minutes / 60)

    if (hours < 24) {
        return `${hours}h ago`
    }

    const days = Math.floor(hours / 24)

    if (days < 30) {
        return `${days}d ago`
    }

    const months = Math.floor(days / 30)

    if (months < 12) {
        return `${months}mo ago`
    }

    return `${Math.floor(months / 12)}y ago`
}

function formatAlert(row) {
    return {
        id: row.event_id,
        alertId: row.id,
        title:
            row.rule === "PRIVILEGE_ESCALATION"
                ? "Privilege Escalation"
                : row.rule === "SUSPICIOUS_IAM_ACTIVITY"
                    ? "Suspicious IAM Activity"
                    : row.rule === "MULTIPLE_FAILED_LOGINS"
                        ? "Multiple Failed Logins"
                        : row.rule,
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

function AlertSummaryCard({ label, value, tone, description }) {
    return (
        <div className={`alert-summary-card ${tone || ""}`}>
            <div className="alert-summary-header">
                <span>{label}</span>
                <span className={`alert-summary-indicator ${tone || ""}`}></span>
            </div>

            <strong>{value}</strong>

            <small>{description}</small>
        </div>
    )
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
            const searchValue = search.trim().toLowerCase()

            const matchesSearch =
                searchValue === "" ||
                `${alert.id} ${alert.title} ${alert.user} ${alert.source} ${alert.detail}`
                    .toLowerCase()
                    .includes(searchValue)

            const matchesSeverity =
                severity === "All" || alert.severity === severity

            const matchesStatus =
                status === "All" || alert.status === status

            return matchesSearch && matchesSeverity && matchesStatus
        })
    }, [alerts, search, severity, status])

    const severityCounts = useMemo(
        () => ({
            critical: alerts.filter(
                (alert) => alert.severity === "Critical"
            ).length,
            high: alerts.filter(
                (alert) => alert.severity === "High"
            ).length,
            medium: alerts.filter(
                (alert) => alert.severity === "Medium"
            ).length,
            low: alerts.filter(
                (alert) => alert.severity === "Low"
            ).length,
        }),
        [alerts]
    )

    const openCount = alerts.filter(
        (alert) => alert.status === "Open"
    ).length

    const investigatingCount = alerts.filter(
        (alert) => alert.status === "Investigating"
    ).length

    const resolvedCount = alerts.filter(
        (alert) => alert.status === "Resolved"
    ).length

    const hasFilters =
        search.trim() !== "" ||
        severity !== "All" ||
        status !== "All"

    function clearFilters() {
        setSearch("")
        setSeverity("All")
        setStatus("All")
    }

    return (
        <div className="alerts-page">
            <div className="alerts-page-header">
                <div>
                    <div className="section-eyebrow">
                        SECURITY OPERATIONS
                    </div>

                    <h2>Alert Queue</h2>

                    <p>
                        Review, prioritize, and investigate detected
                        security threats across the AWS environment.
                    </p>
                </div>

                <div className="alerts-live-status">
                    <span className="status-dot"></span>

                    <div>
                        <strong>Live monitoring</strong>
                        <span>CloudTrail security events</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <section className="alert-summary-grid">
                <AlertSummaryCard
                    label="Total alerts"
                    value={alerts.length}
                    tone="total"
                    description="Detected security alerts"
                />

                <AlertSummaryCard
                    label="Critical"
                    value={severityCounts.critical}
                    tone="critical"
                    description="Immediate attention"
                />

                <AlertSummaryCard
                    label="High"
                    value={severityCounts.high}
                    tone="high"
                    description="High-priority threats"
                />

                <AlertSummaryCard
                    label="Open"
                    value={openCount}
                    tone="open"
                    description="Awaiting investigation"
                />
            </section>

            <section className="alert-queue-panel">
                <div className="alert-queue-header">
                    <div>
                        <div className="section-eyebrow">
                            THREAT OPERATIONS
                        </div>

                        <h3>Security Alerts</h3>

                        <p>
                            {filteredAlerts.length} alert
                            {filteredAlerts.length === 1 ? "" : "s"} in
                            the current queue
                        </p>
                    </div>

                    <div className="alert-queue-meta">
                        <span>
                            <strong>{investigatingCount}</strong>
                            Investigating
                        </span>

                        <span>
                            <strong>{resolvedCount}</strong>
                            Resolved
                        </span>
                    </div>
                </div>

                <div className="alerts-toolbar">
                    <div className="alert-search">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle
                                cx="11"
                                cy="11"
                                r="7"
                            ></circle>

                            <path d="m20 20-4-4"></path>
                        </svg>

                        <input
                            type="text"
                            placeholder="Search alerts, users, actions..."
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
                            <option value="All">
                                All severities
                            </option>

                            <option value="Critical">
                                Critical
                            </option>

                            <option value="High">
                                High
                            </option>

                            <option value="Medium">
                                Medium
                            </option>

                            <option value="Low">
                                Low
                            </option>
                        </select>

                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(event.target.value)
                            }
                            aria-label="Filter by status"
                        >
                            <option value="All">
                                All statuses
                            </option>

                            <option value="Open">
                                Open
                            </option>

                            <option value="Investigating">
                                Investigating
                            </option>

                            <option value="Resolved">
                                Resolved
                            </option>
                        </select>

                        {hasFilters && (
                            <button
                                type="button"
                                className="alert-clear-filters"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="alerts-table-wrap">
                    {loading ? (
                        <div className="empty-alerts">
                            <strong>
                                Loading security alerts...
                            </strong>

                            <span>
                                Retrieving detected events from
                                CloudSentinel.
                            </span>
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="empty-alerts">
                            <strong>
                                {hasFilters
                                    ? "No matching alerts"
                                    : "No security alerts"}
                            </strong>

                            <span>
                                {hasFilters
                                    ? "Try changing your search or filter criteria."
                                    : "The alert queue is currently clear."}
                            </span>

                            {hasFilters && (
                                <button
                                    type="button"
                                    className="empty-alerts-action"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="alerts-table">
                            <thead>
                                <tr>
                                    <th>Alert</th>
                                    <th>Severity</th>
                                    <th>Status</th>
                                    <th>Source</th>
                                    <th>Identity</th>
                                    <th>Detected</th>
                                    <th></th>
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
                                                        {alert.detail}
                                                    </span>

                                                    <small>
                                                        {alert.id}
                                                    </small>
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
                                                    .replace(
                                                        " ",
                                                        "-"
                                                    )}`}
                                            >
                                                {alert.status}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="source-cell">
                                                <span className="source-dot"></span>
                                                {alert.source}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="mono-cell">
                                                {alert.user}
                                            </span>
                                        </td>

                                        <td className="time-cell">
                                            {formatRelativeTime(
                                                alert.time
                                            )}
                                        </td>

                                        <td>
                                            <span className="alert-row-arrow">
                                                →
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filteredAlerts.length > 0 && (
                    <div className="alerts-footer">
                        <span>
                            Showing{" "}
                            <strong>{filteredAlerts.length}</strong>{" "}
                            of <strong>{alerts.length}</strong>{" "}
                            alerts
                        </span>

                        <span>
                            Click an alert to open the investigation
                            workflow
                        </span>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Alerts
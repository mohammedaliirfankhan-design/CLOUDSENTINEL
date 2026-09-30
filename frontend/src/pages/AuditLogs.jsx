import { useEffect, useMemo, useState } from "react"
import { getAuditLogs } from "../api/cloudsentinel"

function formatAuditTime(timestamp) {
    if (!timestamp) {
        return "Unknown"
    }

    const date = new Date(
        timestamp.replace(" ", "T") + "Z"
    )

    if (Number.isNaN(date.getTime())) {
        return timestamp
    }

    return date.toLocaleString()
}

function formatRelativeTime(timestamp) {
    if (!timestamp) {
        return "Unknown"
    }

    const date = new Date(
        timestamp.replace(" ", "T") + "Z"
    )

    if (Number.isNaN(date.getTime())) {
        return timestamp
    }

    const diffSeconds = Math.max(
        0,
        Math.floor((Date.now() - date.getTime()) / 1000)
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

    if (days < 7) {
        return `${days}d ago`
    }

    return date.toLocaleDateString()
}

function formatAction(action) {
    return String(action || "UNKNOWN")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
            character.toUpperCase()
        )
}

function formatRole(role) {
    return formatAction(role || "UNKNOWN")
}

function getInitial(username) {
    return String(username || "?")
        .trim()
        .charAt(0)
        .toUpperCase()
}

function getRoleClass(role) {
    return String(role || "UNKNOWN")
        .toLowerCase()
        .replaceAll("_", "-")
}

function getActionClass(action) {
    return String(action || "unknown")
        .toLowerCase()
        .replaceAll("_", "-")
}

function AuditSummaryCard({
    label,
    value,
    description,
    tone = "blue",
}) {
    return (
        <div className={`audit-summary-card ${tone}`}>
            <div className="audit-summary-card-top">
                <span>{label}</span>

                <span className="audit-summary-indicator"></span>
            </div>

            <strong>{value}</strong>

            <p>{description}</p>

            <div className="audit-summary-decoration"></div>
        </div>
    )
}

function AuditLogs() {
    const [logs, setLogs] = useState([])
    const [search, setSearch] = useState("")
    const [action, setAction] = useState("ALL")
    const [role, setRole] = useState("ALL")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let cancelled = false

        async function fetchAuditLogs() {
            try {
                const data = await getAuditLogs()

                if (!cancelled) {
                    setLogs(
                        Array.isArray(data)
                            ? data
                            : []
                    )

                    setError("")
                }
            } catch (loadError) {
                console.error(
                    "Failed to load audit logs:",
                    loadError
                )

                if (!cancelled) {
                    setError(
                        loadError.message ||
                        "Unable to load audit logs."
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchAuditLogs()

        return () => {
            cancelled = true
        }
    }, [])

    const actionOptions = useMemo(() => {
        return [
            ...new Set(
                logs
                    .map((log) => log.action)
                    .filter(Boolean)
            ),
        ].sort()
    }, [logs])

    const summary = useMemo(() => {
        const adminCount = logs.filter(
            (log) =>
                String(log.role || "").toUpperCase() ===
                "SOC_ADMIN"
        ).length

        const analystCount = logs.filter(
            (log) =>
                String(log.role || "").toUpperCase() ===
                "SOC_ANALYST"
        ).length

        return {
            total: logs.length,
            admin: adminCount,
            analyst: analystCount,
        }
    }, [logs])

    const filteredLogs = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase()

        return logs.filter((log) => {
            const matchesSearch =
                normalizedSearch === "" ||
                [
                    log.username,
                    log.action,
                    log.target_type,
                    log.target_id,
                    log.details,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch)

            const matchesAction =
                action === "ALL" ||
                log.action === action

            const matchesRole =
                role === "ALL" ||
                String(log.role).toUpperCase() === role

            return (
                matchesSearch &&
                matchesAction &&
                matchesRole
            )
        })
    }, [logs, search, action, role])

    const hasFilters =
        search.trim() !== "" ||
        action !== "ALL" ||
        role !== "ALL"

    function clearFilters() {
        setSearch("")
        setAction("ALL")
        setRole("ALL")
    }

    return (
        <div className="audit-page">
            <div className="page-heading audit-page-heading">
                <div>
                    <span className="topbar-eyebrow">
                        SECURITY OPERATIONS
                    </span>

                    <h2>Audit Logs</h2>

                    <p>
                        Review authenticated activity and
                        security operations across
                        CloudSentinel.
                    </p>
                </div>

                <div className="live-indicator">
                    <span className="status-dot"></span>
                    Live audit trail
                </div>
            </div>

            <div className="audit-summary-grid">
                <AuditSummaryCard
                    label="TOTAL EVENTS"
                    value={summary.total}
                    description="Recorded audit events"
                    tone="blue"
                />

                <AuditSummaryCard
                    label="SOC ADMINS"
                    value={summary.admin}
                    description="Administrative activity"
                    tone="purple"
                />

                <AuditSummaryCard
                    label="SOC ANALYSTS"
                    value={summary.analyst}
                    description="Analyst activity"
                    tone="orange"
                />

                <AuditSummaryCard
                    label="VISIBLE"
                    value={filteredLogs.length}
                    description="Events matching filters"
                    tone="green"
                />
            </div>

            <section className="audit-panel">
                <div className="audit-panel-header">
                    <div>
                        <div className="section-eyebrow">
                            AUDIT TRAIL
                        </div>

                        <h3>Activity History</h3>

                        <p>
                            Administrative and analyst
                            actions recorded by CloudSentinel.
                        </p>
                    </div>

                    <div className="audit-panel-count">
                        <span>Showing</span>
                        <strong>
                            {filteredLogs.length}
                        </strong>
                        <span>of</span>
                        <strong>{logs.length}</strong>
                    </div>
                </div>

                <div className="audit-toolbar">
                    <div className="audit-search-wrapper">
                        <span className="audit-search-icon">
                            ⌕
                        </span>

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search users, actions, targets..."
                            aria-label="Search audit logs"
                        />

                        {search && (
                            <button
                                type="button"
                                className="audit-search-clear"
                                onClick={() =>
                                    setSearch("")
                                }
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <select
                        value={action}
                        onChange={(event) =>
                            setAction(event.target.value)
                        }
                        aria-label="Filter by action"
                    >
                        <option value="ALL">
                            All actions
                        </option>

                        {actionOptions.map(
                            (option) => (
                                <option
                                    key={option}
                                    value={option}
                                >
                                    {formatAction(option)}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={role}
                        onChange={(event) =>
                            setRole(event.target.value)
                        }
                        aria-label="Filter by role"
                    >
                        <option value="ALL">
                            All roles
                        </option>

                        <option value="SOC_ADMIN">
                            SOC Admin
                        </option>

                        <option value="SOC_ANALYST">
                            SOC Analyst
                        </option>

                        <option value="UNKNOWN">
                            Unknown
                        </option>
                    </select>

                    {hasFilters && (
                        <button
                            type="button"
                            className="audit-clear-filters"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="audit-loading-state">
                        <div className="audit-loading-dot"></div>
                        <span>
                            Loading audit activity...
                        </span>
                    </div>
                )}

                {!loading && !error && (
                    <div className="audit-table-wrapper">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>ACTOR</th>
                                    <th>ROLE</th>
                                    <th>ACTION</th>
                                    <th>TARGET</th>
                                    <th>DETAILS</th>
                                    <th>TIME</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="audit-empty-state"
                                        >
                                            <div>
                                                <strong>
                                                    No audit events found
                                                </strong>

                                                <span>
                                                    Try changing your
                                                    search or filters.
                                                </span>

                                                {hasFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            clearFilters
                                                        }
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(
                                        (log) => (
                                            <tr
                                                key={log.id}
                                                className="audit-row"
                                            >
                                                <td>
                                                    <div className="audit-actor">
                                                        <span className="audit-avatar">
                                                            {getInitial(
                                                                log.username
                                                            )}
                                                        </span>

                                                        <div>
                                                            <strong>
                                                                {log.username ||
                                                                    "Unknown user"}
                                                            </strong>

                                                            <span>
                                                                User activity
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`audit-role-badge ${getRoleClass(
                                                            log.role
                                                        )}`}
                                                    >
                                                        <span className="audit-badge-dot"></span>

                                                        {formatRole(
                                                            log.role
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`audit-action-badge ${getActionClass(
                                                            log.action
                                                        )}`}
                                                    >
                                                        {formatAction(
                                                            log.action
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="audit-target">
                                                        <strong>
                                                            {log.target_type ||
                                                                "—"}
                                                        </strong>

                                                        {log.target_id && (
                                                            <span>
                                                                #
                                                                {
                                                                    log.target_id
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <div
                                                        className="audit-details"
                                                        title={
                                                            log.details ||
                                                            ""
                                                        }
                                                    >
                                                        {log.details ||
                                                            "No additional details"}
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="audit-time">
                                                        <strong>
                                                            {formatRelativeTime(
                                                                log.created_at
                                                            )}
                                                        </strong>

                                                        <span>
                                                            {formatAuditTime(
                                                                log.created_at
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && (
                    <div className="audit-panel-footer">
                        <span>
                            Audit trail synchronized with
                            CloudSentinel access management.
                        </span>

                        <strong>
                            {filteredLogs.length} visible{" "}
                            {filteredLogs.length === 1
                                ? "event"
                                : "events"}
                        </strong>
                    </div>
                )}
            </section>
        </div>
    )
}

export default AuditLogs
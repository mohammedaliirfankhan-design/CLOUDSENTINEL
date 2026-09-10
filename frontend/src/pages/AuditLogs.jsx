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

function formatAction(action) {
    return String(action || "UNKNOWN")
        .replaceAll("_", " ")
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
        ]
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

    return (
        <div className="audit-page">
            <div className="page-heading">
                <div>
                    <span className="topbar-eyebrow">
                        SECURITY OPERATIONS
                    </span>

                    <h2>Audit Logs</h2>

                    <p>
                        Review authenticated activity and
                        security operations across CloudSentinel.
                    </p>
                </div>

                <div className="live-indicator">
                    <span className="status-dot"></span>
                    Live audit trail
                </div>
            </div>

            <section className="audit-panel">
                <div className="audit-toolbar">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search audit logs..."
                        aria-label="Search audit logs"
                    />

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
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="loading-message">
                        Loading audit logs...
                    </div>
                )}

                {!loading && !error && (
                    <div className="audit-table-wrapper">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>USER</th>
                                    <th>ROLE</th>
                                    <th>ACTION</th>
                                    <th>TARGET</th>
                                    <th>DETAILS</th>
                                    <th>CREATED</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="empty-state"
                                        >
                                            No audit logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(
                                        (log) => (
                                            <tr key={log.id}>
                                                <td>
                                                    <strong>
                                                        {log.username}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`audit-role-badge ${String(
                                                            log.role ||
                                                                "UNKNOWN"
                                                        ).toLowerCase()}`}
                                                    >
                                                        {formatAction(
                                                            log.role ||
                                                                "UNKNOWN"
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`audit-action-badge ${String(
                                                            log.action ||
                                                                "UNKNOWN"
                                                        ).toLowerCase()}`}
                                                    >
                                                        {formatAction(
                                                            log.action
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="audit-target">
                                                        {log.target_type ||
                                                            "—"}

                                                        {log.target_id && (
                                                            <>
                                                                {" "}
                                                                #{log.target_id}
                                                            </>
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    {log.details ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {formatAuditTime(
                                                        log.created_at
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}

export default AuditLogs

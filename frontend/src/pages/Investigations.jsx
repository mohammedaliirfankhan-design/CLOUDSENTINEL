import { useEffect, useMemo, useState } from "react"
import { getInvestigations } from "../api/cloudsentinel"

function formatStatus(status) {
    const value = String(status || "OPEN").toUpperCase()

    if (value === "INVESTIGATING") {
        return "Investigating"
    }

    if (value === "RESOLVED") {
        return "Resolved"
    }

    return "Open"
}

function formatUpdated(value) {
    if (!value) {
        return "Unknown"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString()
}

function formatInvestigation(row, index) {
    const priority = String(
        row.priority || row.severity || "MEDIUM"
    )

    return {
        id: `INV-${String(row.alert_id).padStart(4, "0")}`,
        alertId: row.alert_id,
        title: `${String(row.title || "Security investigation")
            .toLowerCase()
            .replace(/(^|\\s)\\S/g, (character) =>
                character.toUpperCase()
            )} investigation`,
        priority:
            priority.charAt(0).toUpperCase() +
            priority.slice(1).toLowerCase(),
        status: formatStatus(row.status),
        analyst: row.analyst || "Unassigned",
        alert: row.alert,
        source: row.source || "CloudTrail",
        updated: formatUpdated(row.updated),
        sortIndex: index,
    }
}

function Investigations({ onInvestigationSelect }) {
    const [investigationData, setInvestigationData] = useState([])
    const [search, setSearch] = useState("")
    const [priority, setPriority] = useState("All")
    const [status, setStatus] = useState("All")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
    let cancelled = false

    async function fetchInvestigations() {
        try {
            const data = await getInvestigations()

            if (cancelled || !Array.isArray(data)) {
                return
            }

            setInvestigationData(
                data.map((row, index) =>
                    formatInvestigation(row, index)
                )
            )
        } catch (loadError) {
            console.error(
                "Failed to load investigations:",
                loadError
            )

            if (!cancelled) {
                setError(
                    loadError.message ||
                    "Unable to load investigations."
                )
            }
        } finally {
            if (!cancelled) {
                setLoading(false)
            }
        }
    }

    fetchInvestigations()

    return () => {
        cancelled = true
    }
}, [])


    const filteredInvestigations = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        return investigationData.filter((investigation) => {
            const matchesSearch =
                normalizedSearch === "" ||
                `${investigation.id}
                ${investigation.title}
                ${investigation.analyst}
                ${investigation.alert}
                ${investigation.source}`
                    .toLowerCase()
                    .includes(normalizedSearch)

            const matchesPriority =
                priority === "All" ||
                investigation.priority === priority

            const matchesStatus =
                status === "All" ||
                investigation.status === status

            return (
                matchesSearch &&
                matchesPriority &&
                matchesStatus
            )
        })
    }, [investigationData, search, priority, status])

    const criticalCount = investigationData.filter(
        (investigation) =>
            investigation.priority === "Critical"
    ).length

    const highCount = investigationData.filter(
        (investigation) =>
            investigation.priority === "High"
    ).length

    const openCount = investigationData.filter(
        (investigation) =>
            investigation.status === "Open"
    ).length

    return (
        <div className="investigations-page">
            <div className="page-heading">
                <div>
                    <h2>Security Investigations</h2>

                    <p>
                        Investigate security incidents, analyze evidence, and
                        track investigation progress.
                    </p>
                </div>

                <div className="live-indicator">
                    <span className="status-dot"></span>
                    Investigation monitoring
                </div>
            </div>

            {loading && (
                <div className="investigation-loading">
                    Loading investigation data...
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <section className="investigation-summary-grid">
                <div className="investigation-summary-card">
                    <span>Total investigations</span>
                    <strong>{investigationData.length}</strong>
                </div>

                <div className="investigation-summary-card critical">
                    <span>Critical</span>
                    <strong>{criticalCount}</strong>
                </div>

                <div className="investigation-summary-card high">
                    <span>High priority</span>
                    <strong>{highCount}</strong>
                </div>

                <div className="investigation-summary-card open">
                    <span>Open</span>
                    <strong>{openCount}</strong>
                </div>
            </section>

            <section className="investigations-panel">
                <div className="investigations-toolbar">
                    <div className="investigation-search">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="7"
                            ></circle>

                            <path d="m20 20-4-4"></path>
                        </svg>

                        <input
                            type="text"
                            placeholder="Search investigations..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <div className="investigation-filters">
                        <select
                            value={priority}
                            onChange={(event) =>
                                setPriority(event.target.value)
                            }
                            aria-label="Filter by priority"
                        >
                            <option value="All">
                                All priorities
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
                    </div>
                </div>

                <div className="investigations-table-wrap">
                    <table className="investigations-table">
                        <thead>
                            <tr>
                                <th>Investigation</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Alert</th>
                                <th>Analyst</th>
                                <th>Updated</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredInvestigations.map(
                                (investigation) => (
                                    <tr
                                        key={investigation.alertId}
                                        onClick={() =>
                                            onInvestigationSelect(
                                                investigation
                                            )
                                        }
                                    >
                                        <td>
                                            <div className="investigation-title-cell">
                                                <span
                                                    className={`investigation-priority-dot ${investigation.priority.toLowerCase()}`}
                                                ></span>

                                                <div>
                                                    <strong>
                                                        {
                                                            investigation.title
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            investigation.id
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            investigation.source
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`severity-badge ${investigation.priority.toLowerCase()}`}
                                            >
                                                {
                                                    investigation.priority
                                                }
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${investigation.status
                                                    .toLowerCase()
                                                    .replace(
                                                        " ",
                                                        "-"
                                                    )}`}
                                            >
                                                {
                                                    investigation.status
                                                }
                                            </span>
                                        </td>

                                        <td className="mono-cell">
                                            {investigation.alert}
                                        </td>

                                        <td>
                                            {investigation.analyst}
                                        </td>

                                        <td className="time-cell">
                                            {
                                                investigation.updated
                                            }
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>

                    {filteredInvestigations.length === 0 &&
                        !loading && (
                            <div className="empty-investigations">
                                <strong>
                                    No investigations found
                                </strong>

                                <span>
                                    Try changing your search or filter
                                    criteria.
                                </span>
                            </div>
                        )}
                </div>
            </section>
        </div>
    )
}

export default Investigations



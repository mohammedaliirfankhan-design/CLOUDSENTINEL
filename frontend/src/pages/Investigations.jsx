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

function formatRelativeTime(value) {
    if (!value) {
        return "Unknown"
    }

    const rawValue = String(value)
    const normalized = rawValue.includes("T")
        ? rawValue
        : rawValue.replace(" ", "T")

    const parsed = new Date(
        normalized.endsWith("Z")
            ? normalized
            : `${normalized}Z`
    )

    if (Number.isNaN(parsed.getTime())) {
        return rawValue
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

function formatInvestigation(row, index) {
    const priority = String(
        row.priority || row.severity || "MEDIUM"
    )

    const normalizedPriority =
        priority.charAt(0).toUpperCase() +
        priority.slice(1).toLowerCase()

    const rawTitle = String(
        row.title || "Security investigation"
    )

    const titleMap = {
    PRIVILEGE_ESCALATION: "Privilege Escalation",
    SUSPICIOUS_IAM_ACTIVITY: "Suspicious IAM Activity",
    MULTIPLE_FAILED_LOGINS: "Multiple Failed Logins",
}

    const formattedTitle =
        titleMap[rawTitle] ||
        rawTitle
            .toLowerCase()
            .replace(
                /(^|\s)\S/g,
                (character) => character.toUpperCase()
            )

    return {
        id: `INV-${String(row.alert_id).padStart(4, "0")}`,
        alertId: row.alert_id,
        title: `${formattedTitle} investigation`,
        priority: normalizedPriority,
        status: formatStatus(row.status),
        analyst: row.analyst || "Unassigned",
        alert: row.alert,
        source: row.source || "CloudTrail",
        updated: row.updated,
        sortIndex: index,
    }
}

function InvestigationSummaryCard({
    label,
    value,
    tone,
    description,
}) {
    return (
        <div
            className={`investigation-summary-card ${
                tone || ""
            }`}
        >
            <div className="investigation-summary-header">
                <span>{label}</span>

                <span
                    className={`investigation-summary-indicator ${
                        tone || ""
                    }`}
                ></span>
            </div>

            <strong>{value}</strong>

            <small>{description}</small>
        </div>
    )
}

function Investigations({ onInvestigationSelect }) {
    const [investigationData, setInvestigationData] =
        useState([])

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

                if (
                    cancelled ||
                    !Array.isArray(data)
                ) {
                    return
                }

                setInvestigationData(
                    data.map((row, index) =>
                        formatInvestigation(row, index)
                    )
                )

                setError("")
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
        const normalizedSearch =
            search.trim().toLowerCase()

        return investigationData.filter(
            (investigation) => {
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
            }
        )
    }, [
        investigationData,
        search,
        priority,
        status,
    ])

    const priorityCounts = useMemo(
        () => ({
            critical: investigationData.filter(
                (investigation) =>
                    investigation.priority === "Critical"
            ).length,

            high: investigationData.filter(
                (investigation) =>
                    investigation.priority === "High"
            ).length,

            medium: investigationData.filter(
                (investigation) =>
                    investigation.priority === "Medium"
            ).length,

            low: investigationData.filter(
                (investigation) =>
                    investigation.priority === "Low"
            ).length,
        }),
        [investigationData]
    )

    const openCount = investigationData.filter(
        (investigation) =>
            investigation.status === "Open"
    ).length

    const investigatingCount =
        investigationData.filter(
            (investigation) =>
                investigation.status === "Investigating"
        ).length

    const resolvedCount = investigationData.filter(
        (investigation) =>
            investigation.status === "Resolved"
    ).length

    const hasFilters =
        search.trim() !== "" ||
        priority !== "All" ||
        status !== "All"

    function clearFilters() {
        setSearch("")
        setPriority("All")
        setStatus("All")
    }

    return (
        <div className="investigations-page">
            <div className="investigations-page-header">
                <div>
                    <div className="section-eyebrow">
                        THREAT OPERATIONS
                    </div>

                    <h2>Security Investigations</h2>

                    <p>
                        Investigate security incidents, analyze
                        evidence, and track investigation progress
                        across the AWS environment.
                    </p>
                </div>

                <div className="investigations-live-status">
                    <span className="status-dot"></span>

                    <div>
                        <strong>
                            Investigation monitoring
                        </strong>

                        <span>
                            Analyst investigation workflow
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <section className="investigation-summary-grid">
                <InvestigationSummaryCard
                    label="Total investigations"
                    value={investigationData.length}
                    tone="total"
                    description="Tracked security cases"
                />

                <InvestigationSummaryCard
                    label="Critical"
                    value={priorityCounts.critical}
                    tone="critical"
                    description="Critical-priority cases"
                />

                <InvestigationSummaryCard
                    label="High priority"
                    value={priorityCounts.high}
                    tone="high"
                    description="High-priority cases"
                />

                <InvestigationSummaryCard
                    label="Open"
                    value={openCount}
                    tone="open"
                    description="Awaiting investigation"
                />
            </section>

            <section className="investigations-panel">
                <div className="investigations-panel-header">
                    <div>
                        <div className="section-eyebrow">
                            CASE MANAGEMENT
                        </div>

                        <h3>Investigation Queue</h3>

                        <p>
                            {filteredInvestigations.length}{" "}
                            investigation
                            {filteredInvestigations.length ===
                            1
                                ? ""
                                : "s"}{" "}
                            in the current queue
                        </p>
                    </div>

                    <div className="investigations-queue-meta">
                        <span>
                            <strong>
                                {investigatingCount}
                            </strong>

                            Investigating
                        </span>

                        <span>
                            <strong>{resolvedCount}</strong>

                            Resolved
                        </span>
                    </div>
                </div>

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
                            placeholder="Search investigations, alerts, analysts..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="investigation-filters">
                        <select
                            value={priority}
                            onChange={(event) =>
                                setPriority(
                                    event.target.value
                                )
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
                                setStatus(
                                    event.target.value
                                )
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
                                className="investigation-clear-filters"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="investigations-table-wrap">
                    {loading ? (
                        <div className="empty-investigations">
                            <strong>
                                Loading investigations...
                            </strong>

                            <span>
                                Retrieving investigation cases
                                from CloudSentinel.
                            </span>
                        </div>
                    ) : filteredInvestigations.length ===
                      0 ? (
                        <div className="empty-investigations">
                            <strong>
                                {hasFilters
                                    ? "No matching investigations"
                                    : "No investigations found"}
                            </strong>

                            <span>
                                {hasFilters
                                    ? "Try changing your search or filter criteria."
                                    : "There are currently no investigation cases in the queue."}
                            </span>

                            {hasFilters && (
                                <button
                                    type="button"
                                    className="empty-investigations-action"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="investigations-table">
                            <thead>
                                <tr>
                                    <th>
                                        Investigation
                                    </th>

                                    <th>Priority</th>

                                    <th>Status</th>

                                    <th>Alert</th>

                                    <th>Analyst</th>

                                    <th>Updated</th>

                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredInvestigations.map(
                                    (investigation) => (
                                        <tr
                                            key={
                                                investigation.alertId
                                            }
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
                                                            }

                                                            {" · "}

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

                                            <td>
                                                <span className="investigation-alert-cell">
                                                    {
                                                        investigation.alert
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="investigation-analyst-cell">
                                                    {
                                                        investigation.analyst
                                                    }
                                                </span>
                                            </td>

                                            <td className="time-cell">
                                                {formatRelativeTime(
                                                    investigation.updated
                                                )}
                                            </td>

                                            <td>
                                                <span className="investigation-row-arrow">
                                                    →
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading &&
                    filteredInvestigations.length > 0 && (
                        <div className="investigations-footer">
                            <span>
                                Showing{" "}
                                <strong>
                                    {
                                        filteredInvestigations.length
                                    }
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {
                                        investigationData.length
                                    }
                                </strong>{" "}
                                investigations
                            </span>

                            <span>
                                Click an investigation to open
                                the case workflow
                            </span>
                        </div>
                    )}
            </section>
        </div>
    )
}

export default Investigations
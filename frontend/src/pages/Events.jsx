import { useEffect, useMemo, useState } from "react"
import { getEvents } from "../api/cloudsentinel"


function formatEventTime(timestamp) {
    if (!timestamp) {
        return "Unknown"
    }

    const raw = String(timestamp)

    let date

    if (
        raw.includes("T") &&
        (raw.endsWith("Z") ||
            raw.includes("+") ||
            /T\d{2}:\d{2}:\d{2}-\d{2}:\d{2}$/.test(raw))
    ) {
        date = new Date(raw)
    } else {
        date = new Date(
            raw.replace(" ", "T") + "Z"
        )
    }

    if (Number.isNaN(date.getTime())) {
        return raw
    }

    return date.toLocaleString()
}


function formatDetectionTitle(rule) {
    const value = String(
        rule || "Security event"
    )
        .replaceAll("_", " ")
        .toLowerCase()

    const titleMap = {
        "privilege escalation":
            "Privilege Escalation",
        "suspicious iam activity":
            "Suspicious IAM Activity",
        "multiple failed logins":
            "Multiple Failed Logins",
        "suspicious source ip":
            "Suspicious Source IP",
    }

    if (titleMap[value]) {
        return titleMap[value]
    }

    return value.replace(
        /(^|\s)\S/g,
        (character) =>
            character.toUpperCase()
    )
}


function getSeverity(event) {
    return String(
        event?.severity || "MEDIUM"
    ).toUpperCase()
}


function formatPriority(value) {
    const priority = String(
        value || "MEDIUM"
    )

    return (
        priority.charAt(0).toUpperCase() +
        priority.slice(1).toLowerCase()
    )
}


function formatInvestigationStatus(status) {
    const value = String(
        status || "OPEN"
    ).toUpperCase()

    if (value === "RESOLVED") {
        return "Resolved"
    }

    if (value === "INVESTIGATING") {
        return "Investigating"
    }

    return "Open"
}


function EventSummaryCard({
    label,
    value,
    description,
    tone = "total",
}) {
    return (
        <div
            className={`event-summary-card ${tone}`}
        >
            <div className="event-summary-header">
                <span>{label}</span>

                <span
                    className={`event-summary-indicator ${tone}`}
                    aria-hidden="true"
                />
            </div>

            <strong>{value}</strong>

            <small>{description}</small>
        </div>
    )
}


function Events({ onEventSelect }) {
    const [events, setEvents] = useState([])
    const [search, setSearch] = useState("")
    const [severity, setSeverity] =
        useState("ALL")
    const [loading, setLoading] =
        useState(true)
    const [error, setError] =
        useState("")

    useEffect(() => {
        let cancelled = false

        async function fetchEvents() {
            try {
                setLoading(true)

                const data = await getEvents()

                if (cancelled) {
                    return
                }

                setEvents(
                    Array.isArray(data)
                        ? data
                        : []
                )

                setError("")
            } catch (loadError) {
                console.error(
                    "Failed to load events:",
                    loadError
                )

                if (!cancelled) {
                    setError(
                        loadError?.message ||
                        "Unable to load security events."
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchEvents()

        return () => {
            cancelled = true
        }
    }, [])

    const eventMetrics = useMemo(() => {
        return {
            total: events.length,

            critical: events.filter(
                (event) =>
                    getSeverity(event) ===
                    "CRITICAL"
            ).length,

            high: events.filter(
                (event) =>
                    getSeverity(event) ===
                    "HIGH"
            ).length,

            medium: events.filter(
                (event) =>
                    getSeverity(event) ===
                    "MEDIUM"
            ).length,

            low: events.filter(
                (event) =>
                    getSeverity(event) ===
                    "LOW"
            ).length,
        }
    }, [events])

    const filteredEvents = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase()

        return events.filter((event) => {
            const searchableValues = [
                event?.event_id,
                event?.rule,
                event?.user,
                event?.source_ip,
                event?.action,
                event?.resource,
            ]

            const matchesSearch =
                normalizedSearch === "" ||
                searchableValues
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch)

            const matchesSeverity =
                severity === "ALL" ||
                getSeverity(event) === severity

            return (
                matchesSearch &&
                matchesSeverity
            )
        })
    }, [
        events,
        search,
        severity,
    ])

    const hasFilters =
        search.trim() !== "" ||
        severity !== "ALL"

    function clearFilters() {
        setSearch("")
        setSeverity("ALL")
    }

    function handleEventClick(event) {
        if (
            typeof onEventSelect !==
            "function"
        ) {
            return
        }

        const ruleTitle =
            formatDetectionTitle(
                event?.rule
            )

        const source =
            event?.source_ip ||
            event?.action
                ? "CloudTrail"
                : "Unknown"

        onEventSelect({
            id: `INV-${String(
                event?.id
            ).padStart(4, "0")}`,

            alertId: event?.id,

            title:
                `${ruleTitle} investigation`,

            priority:
                formatPriority(
                    event?.risk_level ||
                    event?.severity
                ),

            status:
                formatInvestigationStatus(
                    event?.investigation_status
                ),

            analyst:
                event?.assigned_analyst ||
                "Unassigned",

            alert:
                event?.event_id ||
                `ALERT-${event?.id}`,

            source,

            updated:
                formatEventTime(
                    event?.created_at
                ),

            eventId:
                event?.event_id,

            detection:
                String(
                    event?.rule ||
                    "Security event"
                ).replaceAll(
                    "_",
                    " "
                ),

            severity:
                event?.severity,

            riskScore:
                event?.risk_score,

            user:
                event?.user ||
                "Unknown",

            sourceIp:
                event?.source_ip ||
                "Unknown",

            action:
                event?.action ||
                "—",

            resource:
                event?.resource ||
                "—",
        })
    }

    return (
        <div className="events-page">

            {/* PAGE HEADER */}
            <header className="events-page-header">
                <div>
                    <div className="section-eyebrow">
                        SECURITY OPERATIONS
                    </div>

                    <h2>Events</h2>

                    <p>
                        Review security events
                        collected and normalized
                        by CloudSentinel.
                    </p>
                </div>

                <div className="events-live-status">
                    <span
                        className="status-dot"
                        aria-hidden="true"
                    />

                    <div>
                        <strong>
                            Live event stream
                        </strong>

                        <span>
                            CloudTrail security telemetry
                        </span>
                    </div>
                </div>
            </header>


            {/* ERROR */}
            {error && (
                <div
                    className="error-message"
                    role="alert"
                >
                    {error}
                </div>
            )}


            {/* EVENT METRICS */}
            <section
                className="event-summary-grid"
                aria-label="Event summary"
            >
                <EventSummaryCard
                    label="TOTAL EVENTS"
                    value={eventMetrics.total}
                    description="Collected security events"
                    tone="total"
                />

                <EventSummaryCard
                    label="CRITICAL"
                    value={eventMetrics.critical}
                    description="Critical security events"
                    tone="critical"
                />

                <EventSummaryCard
                    label="HIGH"
                    value={eventMetrics.high}
                    description="High-risk events"
                    tone="high"
                />

                <EventSummaryCard
                    label="MEDIUM"
                    value={eventMetrics.medium}
                    description="Medium-risk events"
                    tone="medium"
                />
            </section>


            {/* EVENT QUEUE */}
            <section className="events-panel">

                <div className="events-panel-header">
                    <div>
                        <div className="section-eyebrow">
                            EVENT STREAM
                        </div>

                        <h3>
                            Security Events
                        </h3>

                        <p>
                            Raw security telemetry
                            available for analyst
                            review.
                        </p>
                    </div>

                    <div className="events-queue-meta">
                        <span>
                            Showing{" "}
                            <strong>
                                {filteredEvents.length}
                            </strong>
                        </span>

                        <span>
                            Total{" "}
                            <strong>
                                {events.length}
                            </strong>
                        </span>
                    </div>
                </div>


                {/* TOOLBAR */}
                <div className="events-toolbar">

                    <div className="events-search">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="7"
                            />

                            <path
                                d="m20 20-4-4"
                            />
                        </svg>

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search events, users, resources..."
                            aria-label="Search events"
                        />
                    </div>


                    <div className="events-filters">

                        <select
                            value={severity}
                            onChange={(event) =>
                                setSeverity(
                                    event.target.value
                                )
                            }
                            aria-label="Filter by severity"
                        >
                            <option value="ALL">
                                All severities
                            </option>

                            <option value="CRITICAL">
                                Critical
                            </option>

                            <option value="HIGH">
                                High
                            </option>

                            <option value="MEDIUM">
                                Medium
                            </option>

                            <option value="LOW">
                                Low
                            </option>
                        </select>


                        {hasFilters && (
                            <button
                                type="button"
                                className="events-clear-filters"
                                onClick={
                                    clearFilters
                                }
                            >
                                Clear filters
                            </button>
                        )}

                    </div>

                </div>


                {/* EVENT TABLE */}
                <div className="events-table-wrapper">

                    {loading ? (
                        <div className="events-empty-state">
                            <strong>
                                Loading security events...
                            </strong>

                            <span>
                                Retrieving CloudSentinel
                                security telemetry.
                            </span>
                        </div>

                    ) : filteredEvents.length ===
                      0 ? (

                        <div className="events-empty-state">
                            <strong>
                                {hasFilters
                                    ? "No matching events"
                                    : "No security events"}
                            </strong>

                            <span>
                                {hasFilters
                                    ? "Try changing your search or severity filter."
                                    : "No security events are currently available."}
                            </span>

                            {hasFilters && (
                                <button
                                    type="button"
                                    className="events-empty-action"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                    ) : (

                        <table className="events-table">

                            <thead>
                                <tr>
                                    <th>
                                        EVENT
                                    </th>

                                    <th>
                                        DETECTION
                                    </th>

                                    <th>
                                        SEVERITY
                                    </th>

                                    <th>
                                        RISK
                                    </th>

                                    <th>
                                        USER
                                    </th>

                                    <th>
                                        SOURCE IP
                                    </th>

                                    <th>
                                        ACTION
                                    </th>

                                    <th>
                                        RESOURCE
                                    </th>

                                    <th>
                                        DETECTED
                                    </th>

                                    <th
                                        aria-label="Open investigation"
                                    />
                                </tr>
                            </thead>


                            <tbody>
                                {filteredEvents.map(
                                    (event) => {
                                        const eventSeverity =
                                            getSeverity(
                                                event
                                            )

                                        return (
                                            <tr
                                                key={
                                                    event.id
                                                }
                                                className="event-row-clickable"
                                                onClick={() =>
                                                    handleEventClick(
                                                        event
                                                    )
                                                }
                                            >

                                                {/* EVENT */}
                                                <td>
                                                    <div className="event-id-cell">

                                                        <span
                                                            className={`event-severity-dot ${eventSeverity.toLowerCase()}`}
                                                            aria-hidden="true"
                                                        />

                                                        <div>
                                                            <strong>
                                                                {event.event_id ||
                                                                    `EVENT-${event.id}`}
                                                            </strong>

                                                            <span>
                                                                CloudTrail event
                                                            </span>
                                                        </div>

                                                    </div>
                                                </td>


                                                {/* DETECTION */}
                                                <td>
                                                    <div className="event-detection-cell">
                                                        <strong>
                                                            {formatDetectionTitle(
                                                                event.rule
                                                            )}
                                                        </strong>

                                                        <span>
                                                            Security detection
                                                        </span>
                                                    </div>
                                                </td>


                                                {/* SEVERITY */}
                                                <td>
                                                    <span
                                                        className={`severity-badge ${eventSeverity.toLowerCase()}`}
                                                    >
                                                        {
                                                            eventSeverity
                                                        }
                                                    </span>
                                                </td>


                                                {/* RISK */}
                                                <td>
                                                    <span className="event-risk-score">
                                                        {event.risk_score ??
                                                            "—"}
                                                    </span>
                                                </td>


                                                {/* USER */}
                                                <td>
                                                    <span className="event-user-cell">
                                                        {event.user ||
                                                            "Unknown"}
                                                    </span>
                                                </td>


                                                {/* SOURCE IP */}
                                                <td>
                                                    <span className="event-ip-cell">
                                                        {event.source_ip ||
                                                            "Unknown"}
                                                    </span>
                                                </td>


                                                {/* ACTION */}
                                                <td>
                                                    <span className="event-action-cell">
                                                        {event.action ||
                                                            "—"}
                                                    </span>
                                                </td>


                                                {/* RESOURCE */}
                                                <td>
                                                    <span className="event-resource-cell">
                                                        {event.resource ||
                                                            "—"}
                                                    </span>
                                                </td>


                                                {/* DETECTED */}
                                                <td>
                                                    <span className="event-time-cell">
                                                        {formatEventTime(
                                                            event.created_at
                                                        )}
                                                    </span>
                                                </td>


                                                {/* OPEN */}
                                                <td>
                                                    <span
                                                        className="event-row-arrow"
                                                        aria-hidden="true"
                                                    >
                                                        →
                                                    </span>
                                                </td>

                                            </tr>
                                        )
                                    }
                                )}
                            </tbody>

                        </table>
                    )}

                </div>


                {/* FOOTER */}
                {!loading &&
                    filteredEvents.length >
                        0 && (
                        <div className="events-footer">
                            <span>
                                Showing{" "}
                                <strong>
                                    {
                                        filteredEvents.length
                                    }
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {events.length}
                                </strong>{" "}
                                events
                            </span>

                            <span>
                                Click an event to
                                open the investigation
                                workspace
                            </span>
                        </div>
                    )}

            </section>

        </div>
    )
}


export default Events
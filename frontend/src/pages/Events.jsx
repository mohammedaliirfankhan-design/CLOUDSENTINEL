import { useEffect, useMemo, useState } from "react"
import { getEvents } from "../api/cloudsentinel"


function formatEventTime(timestamp) {
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


function formatPriority(value) {
    const priority = String(
        value || "MEDIUM"
    )

    return (
        priority.charAt(0).toUpperCase() +
        priority.slice(1).toLowerCase()
    )
}


function Events({ onEventSelect }) {
    const [events, setEvents] = useState([])

    const [search, setSearch] = useState("")

    const [severity, setSeverity] = useState("ALL")

    const [loading, setLoading] = useState(true)

    const [error, setError] = useState("")


    useEffect(() => {
        let cancelled = false

        async function fetchEvents() {
            try {
                const data = await getEvents()

                if (!cancelled) {
                    setEvents(
                        Array.isArray(data)
                            ? data
                            : []
                    )

                    setError("")
                }
            } catch (loadError) {
                console.error(
                    "Failed to load events:",
                    loadError
                )

                if (!cancelled) {
                    setError(
                        loadError.message ||
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


    const filteredEvents = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase()

        return events.filter((event) => {

            const matchesSearch =
                normalizedSearch === "" ||
                [
                    event.event_id,
                    event.rule,
                    event.user,
                    event.source_ip,
                    event.action,
                    event.resource,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch)


            const matchesSeverity =
                severity === "ALL" ||
                String(
                    event.severity
                ).toUpperCase() === severity


            return (
                matchesSearch &&
                matchesSeverity
            )
        })
    }, [events, search, severity])


   function handleEventClick(event) {
    if (
        typeof onEventSelect !==
        "function"
    ) {
        return
    }

    const ruleTitle = String(
        event.rule ||
        "Security investigation"
    )
        .toLowerCase()
        .replace(
            /(^|\s)\S/g,
            (character) =>
                character.toUpperCase()
        )

    const source =
        event.source_ip ||
        event.action
            ? "CloudTrail"
            : "Unknown"

    onEventSelect({
        id: `INV-${String(
            event.id
        ).padStart(4, "0")}`,

        alertId: event.id,

        title: `${ruleTitle} investigation`,

        priority: formatPriority(
            event.risk_level ||
            event.severity
        ),

        status:
            formatInvestigationStatus(
                event.investigation_status
            ),

        analyst:
            event.assigned_analyst ||
            "Unassigned",

        alert:
            event.event_id ||
            `ALERT-${event.id}`,

        source,

        updated:
            formatEventTime(
                event.created_at
            ),

        eventId:
            event.event_id,

        detection:
            String(
                event.rule ||
                "Security event"
            ).replaceAll(
                "_",
                " "
            ),

        severity:
            event.severity,

        riskScore:
            event.risk_score,

        user:
            event.user ||
            "Unknown",

        sourceIp:
            event.source_ip ||
            "Unknown",

        action:
            event.action ||
            "—",

        resource:
            event.resource ||
            "—",
    })
}


    return (
        <div className="events-page">

            <div className="page-heading">

                <div>

                    <span className="topbar-eyebrow">
                        SECURITY OPERATIONS
                    </span>

                    <h2>
                        Events
                    </h2>

                    <p>
                        Review security events
                        collected by
                        CloudSentinel.
                    </p>

                </div>


                <div className="live-indicator">

                    <span className="status-dot"></span>

                    Live events

                </div>

            </div>


            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}


            {loading && (
                <div className="loading-message">
                    Loading security events...
                </div>
            )}


            {!loading && !error && (

                <section className="events-panel">

                    <div className="events-toolbar">

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search events..."
                            aria-label="Search events"
                        />


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

                    </div>


                    <div className="events-table-wrapper">

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

                                </tr>

                            </thead>


                            <tbody>

                                {filteredEvents.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="empty-state"
                                        >
                                            No events found.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredEvents.map(
                                        (event) => (

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

                                                <td>

                                                    <strong>
                                                        {
                                                            event.event_id
                                                        }
                                                    </strong>

                                                </td>


                                                <td>

                                                    {String(
                                                        event.rule ||
                                                        "Security event"
                                                    ).replaceAll(
                                                        "_",
                                                        " "
                                                    )}

                                                </td>


                                                <td>

                                                    <span
                                                        className={`severity-badge ${String(
                                                            event.severity ||
                                                            "MEDIUM"
                                                        ).toLowerCase()}`}
                                                    >
                                                        {
                                                            event.severity
                                                        }
                                                    </span>

                                                </td>


                                                <td>
                                                    {
                                                        event.risk_score
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        event.user ||
                                                        "Unknown"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        event.source_ip ||
                                                        "Unknown"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        event.action ||
                                                        "—"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        event.resource ||
                                                        "—"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        formatEventTime(
                                                            event.created_at
                                                        )
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            )}

        </div>
    )
}


export default Events
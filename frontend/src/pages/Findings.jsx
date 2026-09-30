import { useEffect, useMemo, useState } from "react"
import {
    getFindings,
    getFindingMetrics,
} from "../api/cloudsentinel"


function formatStatus(status) {
    const value = String(status || "OPEN").toUpperCase()

    if (value === "RESOLVED") {
        return "Resolved"
    }

    if (value === "IN_PROGRESS") {
        return "In Progress"
    }

    return "Open"
}


function formatSeverity(severity) {
    const value = String(
        severity || "INFO"
    ).toUpperCase()

    return (
        value.charAt(0) +
        value.slice(1).toLowerCase()
    )
}


function FindingSeverity({ severity }) {
    const normalized = String(
        severity || "INFO"
    ).toUpperCase()

    return (
        <span
            className={`finding-severity ${normalized.toLowerCase()}`}
        >
            {normalized}
        </span>
    )
}


function Findings({ onNavigate }) {
    const [findings, setFindings] = useState([])
    const [metrics, setMetrics] = useState(null)

    const [search, setSearch] = useState("")
    const [severity, setSeverity] = useState("All")
    const [status, setStatus] = useState("All")

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState("")


    async function loadFindings() {
        setLoading(true)
        setError("")

        try {
            const [
                findingsData,
                metricsData,
            ] = await Promise.all([
                getFindings(),
                getFindingMetrics(),
            ])

            setFindings(
                Array.isArray(findingsData)
                    ? findingsData
                    : []
            )

            setMetrics(
                metricsData &&
                    typeof metricsData === "object"
                    ? metricsData
                    : null
            )

        } catch (loadError) {
            console.error(
                "Failed to load CSPM findings:",
                loadError
            )

            setError(
                loadError.message ||
                "Unable to load CSPM findings."
            )

        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        loadFindings()
    }, [])


    const filteredFindings = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase()

        return findings.filter((finding) => {
            const findingStatus =
                formatStatus(finding.status)

            const findingSeverity =
                formatSeverity(finding.severity)

            const matchesSearch =
                normalizedSearch === "" ||
                `${finding.title || ""}
                ${finding.finding_id || ""}
                ${finding.resource || ""}
                ${finding.description || ""}
                ${findingSeverity}
                ${findingStatus}`
                    .toLowerCase()
                    .includes(normalizedSearch)

            const matchesSeverity =
                severity === "All" ||
                findingSeverity === severity

            const matchesStatus =
                status === "All" ||
                findingStatus === status

            return (
                matchesSearch &&
                matchesSeverity &&
                matchesStatus
            )
        })
    }, [
        findings,
        search,
        severity,
        status,
    ])


    const severityCounts = useMemo(
        () => ({
            critical: findings.filter(
                (finding) =>
                    String(
                        finding.severity || ""
                    ).toUpperCase() ===
                    "CRITICAL"
            ).length,

            high: findings.filter(
                (finding) =>
                    String(
                        finding.severity || ""
                    ).toUpperCase() ===
                    "HIGH"
            ).length,

            medium: findings.filter(
                (finding) =>
                    String(
                        finding.severity || ""
                    ).toUpperCase() ===
                    "MEDIUM"
            ).length,

            low: findings.filter(
                (finding) =>
                    String(
                        finding.severity || ""
                    ).toUpperCase() ===
                    "LOW"
            ).length,
        }),
        [findings]
    )


    const openCount = findings.filter(
        (finding) =>
            formatStatus(finding.status) === "Open"
    ).length

    const resolvedCount = findings.filter(
        (finding) =>
            formatStatus(finding.status) === "Resolved"
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
        <div className="findings-page">

            <div className="findings-page-header">

                <div>

                    <div className="section-eyebrow">
                        CLOUD SECURITY POSTURE
                    </div>

                    <h2>
                        CSPM Findings
                    </h2>

                    <p>
                        Review security posture
                        findings detected across
                        the AWS environment.
                    </p>

                </div>


                <div className="findings-live-status">

                    <span className="status-dot"></span>

                    <div>

                        <strong>
                            AWS posture monitoring
                        </strong>

                        <span>
                            Cloud security posture
                            management
                        </span>

                    </div>

                </div>

            </div>


            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}


            <section className="finding-summary-grid">

                <div className="finding-summary-card">

                    <div className="finding-summary-header">

                        <span>
                            OPEN FINDINGS
                        </span>

                        <span className="finding-summary-indicator total"></span>

                    </div>

                    <strong>
                        {metrics?.total ?? 0}
                    </strong>

                    <small>
                        Active posture findings
                    </small>

                </div>


                <div className="finding-summary-card critical">

                    <div className="finding-summary-header">

                        <span>
                            CRITICAL
                        </span>

                        <span className="finding-summary-indicator critical"></span>

                    </div>

                    <strong>
                        {metrics?.critical ??
                            severityCounts.critical}
                    </strong>

                    <small>
                        Critical posture findings
                    </small>

                </div>


                <div className="finding-summary-card high">

                    <div className="finding-summary-header">

                        <span>
                            HIGH
                        </span>

                        <span className="finding-summary-indicator high"></span>

                    </div>

                    <strong>
                        {metrics?.high ??
                            severityCounts.high}
                    </strong>

                    <small>
                        High-risk posture findings
                    </small>

                </div>


                <div className="finding-summary-card medium">

                    <div className="finding-summary-header">

                        <span>
                            MEDIUM
                        </span>

                        <span className="finding-summary-indicator medium"></span>

                    </div>

                    <strong>
                        {metrics?.medium ??
                            severityCounts.medium}
                    </strong>

                    <small>
                        Medium-risk posture findings
                    </small>

                </div>

            </section>


            <section className="findings-panel">

                <div className="findings-panel-header">

                    <div>

                        <div className="section-eyebrow">
                            CLOUD SECURITY
                        </div>

                        <h3>
                            Security Findings
                        </h3>

                        <p>
                            {filteredFindings.length} finding
                            {filteredFindings.length === 1
                                ? ""
                                : "s"}{" "}
                            in the current posture queue
                        </p>

                    </div>


                    <div className="findings-queue-meta">

                        <span>
                            <strong>
                                {openCount}
                            </strong>

                            Open
                        </span>

                        <span>
                            <strong>
                                {resolvedCount}
                            </strong>

                            Resolved
                        </span>

                    </div>

                </div>


                <div className="findings-toolbar">

                    <div className="finding-search">

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
                            placeholder="Search findings, resources..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <div className="finding-filters">

                        <select
                            value={severity}
                            onChange={(event) =>
                                setSeverity(
                                    event.target.value
                                )
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

                            <option value="In Progress">
                                In Progress
                            </option>

                            <option value="Resolved">
                                Resolved
                            </option>

                        </select>


                        {hasFilters && (
                            <button
                                type="button"
                                className="finding-clear-filters"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>
                        )}

                    </div>

                </div>


                <div className="findings-table-wrap">

                    {loading ? (

                        <div className="empty-findings">

                            <strong>
                                Loading CSPM findings...
                            </strong>

                            <span>
                                Retrieving cloud security
                                posture data from
                                CloudSentinel.
                            </span>

                        </div>

                    ) : filteredFindings.length === 0 ? (

                        <div className="empty-findings">

                            <strong>
                                {hasFilters
                                    ? "No matching findings"
                                    : "No CSPM findings"}
                            </strong>

                            <span>
                                {hasFilters
                                    ? "Try changing your search or filter criteria."
                                    : "No security posture findings are currently available."}
                            </span>


                            {hasFilters && (
                                <button
                                    type="button"
                                    className="empty-findings-action"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </button>
                            )}

                        </div>

                    ) : (

                        <table className="findings-table">

                            <thead>

                                <tr>

                                    <th>
                                        Finding
                                    </th>

                                    <th>
                                        Severity
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Resource
                                    </th>

                                    <th>
                                        Finding ID
                                    </th>

                                    <th></th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredFindings.map(
                                    (finding) => (

                                        <tr
                                            key={
                                                finding.id ||
                                                finding.finding_id ||
                                                `${finding.title}-${finding.resource}`
                                            }
                                            onClick={() =>
                                                onNavigate({
                                                    page:
                                                        "cspm-finding-details",
                                                    findingId:
                                                        finding.id,
                                                })
                                            }
                                        >

                                            <td>

                                                <div className="finding-title-cell">

                                                    <span
                                                        className={`finding-severity-dot ${String(
                                                            finding.severity ||
                                                                "INFO"
                                                        ).toLowerCase()}`}
                                                    ></span>


                                                    <div>

                                                        <strong>
                                                            {finding.title ||
                                                                "Security finding"}
                                                        </strong>

                                                        <span>
                                                            {finding.description ||
                                                                "Cloud security posture finding"}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            <td>

                                                <FindingSeverity
                                                    severity={
                                                        finding.severity
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <span
                                                    className={`finding-status ${
                                                        String(
                                                            finding.status ||
                                                                "OPEN"
                                                        ).toLowerCase()
                                                    }`}
                                                >
                                                    {String(
                                                        finding.status ||
                                                            "OPEN"
                                                    ).toUpperCase()}
                                                </span>

                                            </td>


                                            <td>

                                                <span className="finding-resource-cell">
                                                    {finding.resource ||
                                                        "AWS resource"}
                                                </span>

                                            </td>


                                            <td>

                                                <span className="finding-id-cell">
                                                    {finding.finding_id ||
                                                        finding.id ||
                                                        "—"}
                                                </span>

                                            </td>


                                            <td>

                                                <span className="finding-row-arrow">
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
                    filteredFindings.length > 0 && (

                        <div className="findings-footer">

                            <span>
                                Showing{" "}
                                <strong>
                                    {
                                        filteredFindings.length
                                    }
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {findings.length}
                                </strong>{" "}
                                findings
                            </span>


                            <span>
                                Click a finding to open
                                the posture details
                            </span>

                        </div>

                    )}

            </section>

        </div>
    )
}


export default Findings
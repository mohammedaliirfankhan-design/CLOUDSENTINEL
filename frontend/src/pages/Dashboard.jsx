import { useEffect, useState } from "react"

import {
    getAlerts,
    getMetrics,
    getFindings,
    getFindingMetrics,
    runCspmScan,
} from "../api/cloudsentinel"


function formatRelativeTime(timestamp) {
    if (!timestamp) {
        return "Recent"
    }

    const parsed = new Date(
        timestamp.replace(" ", "T") + "Z"
    )

    if (Number.isNaN(parsed.getTime())) {
        return timestamp
    }

    const seconds = Math.max(
        0,
        Math.floor(
            (Date.now() - parsed.getTime()) / 1000
        )
    )

    if (seconds < 60) {
        return "Just now"
    }

    const minutes = Math.floor(seconds / 60)

    if (minutes < 60) {
        return `${minutes}m ago`
    }

    const hours = Math.floor(minutes / 60)

    if (hours < 24) {
        return `${hours}h ago`
    }

    const days = Math.floor(hours / 24)

    return `${days}d ago`
}


function MetricCard({
    label,
    value,
    description,
    tone,
}) {
    return (
        <div
            className={`metric-card ${
                tone || ""
            }`}
        >
            <div className="metric-card-header">
                <span>{label}</span>

                <span className="metric-indicator"></span>
            </div>

            <strong className="metric-value">
                {value}
            </strong>

            <span className="metric-description">
                {description}
            </span>
        </div>
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


function FindingStatus({ status }) {
    const normalized = String(
        status || "OPEN"
    ).toUpperCase()

    return (
        <span
            className={`finding-status ${normalized.toLowerCase()}`}
        >
            {normalized}
        </span>
    )
}


function Dashboard({ onNavigate }) {
    const [metrics, setMetrics] = useState(null)

    const [alerts, setAlerts] = useState([])

    const [findings, setFindings] = useState([])

    const [findingMetrics, setFindingMetrics] =
        useState(null)

    const [error, setError] = useState("")

    const [findingError, setFindingError] =
        useState("")

    const [loading, setLoading] = useState(true)

    const [scanning, setScanning] = useState(false)


    useEffect(() => {
        let cancelled = false

        async function fetchDashboardData() {
            try {
                const [
                    metricsData,
                    alertsData,
                    findingsData,
                    findingMetricsData,
                ] = await Promise.all([
                    getMetrics(),
                    getAlerts(),
                    getFindings(),
                    getFindingMetrics(),
                ])

                if (!cancelled) {
                    setMetrics(metricsData)

                    setAlerts(
                        Array.isArray(alertsData)
                            ? alertsData
                            : []
                    )

                    setFindings(
                        Array.isArray(findingsData)
                            ? findingsData
                            : []
                    )

                    setFindingMetrics(
                        findingMetricsData &&
                            typeof findingMetricsData ===
                                "object"
                            ? findingMetricsData
                            : null
                    )

                    setError("")

                    setFindingError("")
                }
            } catch (loadError) {
                console.error(
                    "Failed to load dashboard:",
                    loadError
                )

                if (!cancelled) {
                    setError(
                        loadError.message ||
                            "Unable to load dashboard data."
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchDashboardData()

        return () => {
            cancelled = true
        }
    }, [])


    async function handleCspmScan() {
        setScanning(true)

        setFindingError("")

        try {
            const result = await runCspmScan()

            if (
                result &&
                Array.isArray(result.findings)
            ) {
                setFindings(result.findings)
            } else {
                const latestFindings =
                    await getFindings()

                setFindings(
                    Array.isArray(latestFindings)
                        ? latestFindings
                        : []
                )
            }

            const latestFindingMetrics =
                await getFindingMetrics()

            setFindingMetrics(
                latestFindingMetrics &&
                    typeof latestFindingMetrics ===
                        "object"
                    ? latestFindingMetrics
                    : null
            )
        } catch (scanError) {
            console.error(
                "CSPM scan failed:",
                scanError
            )

            setFindingError(
                scanError.message ||
                    "Unable to run CSPM scan."
            )
        } finally {
            setScanning(false)
        }
    }


    const totalAlerts =
        metrics?.total_alerts ?? 0

    const investigatingAlerts =
        metrics?.investigating_alerts ?? 0

    const resolvedAlerts =
        metrics?.resolved_alerts ?? 0


    const criticalAlerts =
        alerts.filter(
            (alert) =>
                String(
                    alert.severity
                ).toUpperCase() === "CRITICAL"
        ).length


    const highAlerts =
        alerts.filter(
            (alert) =>
                String(
                    alert.severity
                ).toUpperCase() === "HIGH"
        ).length


    const mediumAlerts =
        alerts.filter(
            (alert) =>
                String(
                    alert.severity
                ).toUpperCase() === "MEDIUM"
        ).length


    const lowAlerts =
        alerts.filter(
            (alert) =>
                String(
                    alert.severity
                ).toUpperCase() === "LOW"
        ).length


    const totalFindings =
        findingMetrics?.total ?? 0

    const criticalFindings =
        findingMetrics?.critical ?? 0

    const highFindings =
        findingMetrics?.high ?? 0

    const mediumFindings =
        findingMetrics?.medium ?? 0


    return (
        <div className="dashboard-page">

            <div className="page-heading">

                <div>

                    <h2>
                        Security Overview
                    </h2>

                    <p>
                        Monitor CloudSentinel
                        security activity and
                        investigate potential
                        threats.
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


            {loading && (
                <div className="loading-message">
                    Loading security overview...
                </div>
            )}


            <section className="metrics-grid">

                <MetricCard
                    label="TOTAL ALERTS"
                    value={totalAlerts}
                    description="All detected security alerts"
                />

                <MetricCard
                    label="CRITICAL"
                    value={criticalAlerts}
                    description="High-risk alerts requiring attention"
                    tone="critical"
                />

                <MetricCard
                    label="OPEN INVESTIGATIONS"
                    value={investigatingAlerts}
                    description="Currently being investigated"
                    tone="high"
                />

                <MetricCard
                    label="RESOLVED"
                    value={resolvedAlerts}
                    description="Successfully closed incidents"
                    tone="low"
                />

            </section>


            <section className="dashboard-grid">

                <div className="dashboard-panel">

                    <div className="panel-header">

                        <div>

                            <h3>
                                Risk Overview
                            </h3>

                            <p>
                                Current alert
                                distribution by
                                severity
                            </p>

                        </div>


                        <button
                            type="button"
                            className="panel-action"
                            onClick={() =>
                                onNavigate(
                                    "alerts"
                                )
                            }
                        >
                            View alerts
                        </button>

                    </div>


                    <div className="risk-placeholder">

                        <div className="risk-ring">

                            <strong>
                                {totalAlerts}
                            </strong>

                            <span>
                                Total alerts
                            </span>

                        </div>


                        <div className="risk-legend">

                            <div>
                                <span className="legend-dot critical"></span>

                                Critical

                                <strong>
                                    {criticalAlerts}
                                </strong>
                            </div>


                            <div>
                                <span className="legend-dot high"></span>

                                High

                                <strong>
                                    {highAlerts}
                                </strong>
                            </div>


                            <div>
                                <span className="legend-dot medium"></span>

                                Medium

                                <strong>
                                    {mediumAlerts}
                                </strong>
                            </div>


                            <div>
                                <span className="legend-dot low"></span>

                                Low

                                <strong>
                                    {lowAlerts}
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>


                <div className="dashboard-panel">

                    <div className="panel-header">

                        <div>

                            <h3>
                                Recent Activity
                            </h3>

                            <p>
                                Latest security
                                events
                            </p>

                        </div>

                    </div>


                    <div className="activity-list">

                        {alerts.length === 0 && (
                            <div className="loading-message">
                                No recent security
                                activity.
                            </div>
                        )}


                        {alerts
                            .slice(0, 3)
                            .map((alert) => (

                                <div
                                    className="activity-item"
                                    key={alert.id}
                                >

                                    <span
                                        className={`activity-icon ${
                                            String(
                                                alert.severity ||
                                                    "medium"
                                            ).toLowerCase()
                                        }`}
                                    >
                                        !
                                    </span>


                                    <div>

                                        <strong>
                                            {String(
                                                alert.rule ||
                                                    "Security alert"
                                            ).replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </strong>


                                        <span>
                                            {alert.user ||
                                                "Unknown user"}{" "}
                                            ·{" "}
                                            {alert.action ||
                                                "Security event"}
                                        </span>

                                    </div>


                                    <time>
                                        {formatRelativeTime(
                                            alert.created_at
                                        )}
                                    </time>

                                </div>

                            ))}

                    </div>

                </div>

            </section>


            {/* =====================================================
                AWS CSPM / CLOUD POSTURE
               ===================================================== */}

            <section className="dashboard-panel cspm-panel">

                <div className="panel-header">

                    <div>

                        <h3>
                            AWS Security Posture
                        </h3>

                        <p>
                            CloudSentinel CSPM
                            findings from your
                            AWS environment.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="panel-action"
                        onClick={handleCspmScan}
                        disabled={scanning}
                    >
                        {scanning
                            ? "Scanning..."
                            : "Run CSPM Scan"}
                    </button>

                </div>


                {findingError && (
                    <div className="error-message">
                        {findingError}
                    </div>
                )}


                <div className="cspm-summary">

                    <div className="cspm-stat">

                        <span>
                            TOTAL FINDINGS
                        </span>

                        <strong>
                            {totalFindings}
                        </strong>

                    </div>


                    <div className="cspm-stat critical">

                        <span>
                            CRITICAL
                        </span>

                        <strong>
                            {criticalFindings}
                        </strong>

                    </div>


                    <div className="cspm-stat high">

                        <span>
                            HIGH
                        </span>

                        <strong>
                            {highFindings}
                        </strong>

                    </div>


                    <div className="cspm-stat medium">

                        <span>
                            MEDIUM
                        </span>

                        <strong>
                            {mediumFindings}
                        </strong>

                    </div>

                </div>


                <div className="cspm-findings">

                    {findings.length === 0 ? (

                        <div className="cspm-empty">

                            <strong>
                                No CSPM findings detected
                            </strong>

                            <span>
                                Your latest AWS posture
                                scan did not identify
                                any configured security
                                findings.
                            </span>

                        </div>

                    ) : (

                        findings
                            .slice(0, 5)
                            .map((finding) => (

                                <button
                                    type="button"
                                    className="cspm-finding"
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

                                    <div>

                                        <strong>
                                            {finding.title ||
                                                "Security finding"}
                                        </strong>

                                        <span>
                                            {finding.finding_id}
                                            {" · "}
                                            {finding.resource ||
                                                "AWS resource"}
                                        </span>

                                    </div>


                                    <div className="cspm-finding-meta">

                                        <FindingStatus
                                            status={
                                                finding.status
                                            }
                                        />

                                        <FindingSeverity
                                            severity={
                                                finding.severity
                                            }
                                        />

                                    </div>

                                </button>

                            ))

                    )}

                </div>

            </section>

        </div>
    )
}


export default Dashboard
import { useEffect, useMemo, useState } from "react"

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

    const normalized =
        String(timestamp).includes("T")
            ? timestamp
            : String(timestamp).replace(" ", "T")

    const parsed = new Date(
        normalized.endsWith("Z")
            ? normalized
            : `${normalized}Z`
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


function formatRule(rule) {
    return String(
        rule || "Security alert"
    )
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        )
}


function normalizeSeverity(severity) {
    return String(
        severity || "MEDIUM"
    ).toUpperCase()
}


function SeverityBadge({ severity }) {
    const normalized =
        normalizeSeverity(severity)

    return (
        <span
            className={`dashboard-severity ${normalized.toLowerCase()}`}
        >
            {normalized}
        </span>
    )
}


function MetricCard({
    label,
    value,
    description,
    tone,
    onClick,
}) {
    const content = (
        <>
            <div className="dashboard-metric-top">
                <span className="dashboard-metric-label">
                    {label}
                </span>

                <span
                    className={`dashboard-metric-dot ${
                        tone || ""
                    }`}
                />
            </div>

            <strong className="dashboard-metric-value">
                {value}
            </strong>

            <span className="dashboard-metric-description">
                {description}
            </span>
        </>
    )

    if (onClick) {
        return (
            <button
                type="button"
                className={`dashboard-metric-card clickable ${
                    tone || ""
                }`}
                onClick={onClick}
            >
                {content}
            </button>
        )
    }

    return (
        <div
            className={`dashboard-metric-card ${
                tone || ""
            }`}
        >
            {content}
        </div>
    )
}


function FindingSeverity({ severity }) {
    const normalized =
        normalizeSeverity(severity)

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
    const [metrics, setMetrics] =
        useState(null)

    const [alerts, setAlerts] =
        useState([])

    const [findings, setFindings] =
        useState([])

    const [findingMetrics, setFindingMetrics] =
        useState(null)

    const [error, setError] =
        useState("")

    const [findingError, setFindingError] =
        useState("")

    const [loading, setLoading] =
        useState(true)

    const [scanning, setScanning] =
        useState(false)


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
                    setMetrics(
                        metricsData
                    )

                    setAlerts(
                        Array.isArray(
                            alertsData
                        )
                            ? alertsData
                            : []
                    )

                    setFindings(
                        Array.isArray(
                            findingsData
                        )
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
            const result =
                await runCspmScan()

            if (
                result &&
                Array.isArray(
                    result.findings
                )
            ) {
                setFindings(
                    result.findings
                )
            } else {
                const latestFindings =
                    await getFindings()

                setFindings(
                    Array.isArray(
                        latestFindings
                    )
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
                normalizeSeverity(
                    alert.severity
                ) === "CRITICAL"
        ).length


    const highAlerts =
        alerts.filter(
            (alert) =>
                normalizeSeverity(
                    alert.severity
                ) === "HIGH"
        ).length


    const mediumAlerts =
        alerts.filter(
            (alert) =>
                normalizeSeverity(
                    alert.severity
                ) === "MEDIUM"
        ).length


    const lowAlerts =
        alerts.filter(
            (alert) =>
                normalizeSeverity(
                    alert.severity
                ) === "LOW"
        ).length


    const totalFindings =
        findingMetrics?.total ?? 0

    const criticalFindings =
        findingMetrics?.critical ?? 0

    const highFindings =
        findingMetrics?.high ?? 0

    const mediumFindings =
        findingMetrics?.medium ?? 0


    const recentAlerts =
        useMemo(
            () =>
                [...alerts]
                    .sort(
                        (a, b) =>
                            new Date(
                                b.created_at ||
                                    0
                            ) -
                            new Date(
                                a.created_at ||
                                    0
                            )
                    )
                    .slice(0, 5),
            [alerts]
        )


    const threatTotal =
        criticalAlerts +
        highAlerts +
        mediumAlerts +
        lowAlerts


    const threatRows = [
        {
            label: "Critical",
            count: criticalAlerts,
            className: "critical",
        },
        {
            label: "High",
            count: highAlerts,
            className: "high",
        },
        {
            label: "Medium",
            count: mediumAlerts,
            className: "medium",
        },
        {
            label: "Low",
            count: lowAlerts,
            className: "low",
        },
    ]


    return (
        <div className="dashboard-page">

            <header className="dashboard-hero">

                <div className="dashboard-hero-copy">

                    <div className="dashboard-eyebrow">
                        CLOUD SECURITY OPERATIONS
                    </div>

                    <h1>
                        Security Overview
                    </h1>

                    <p>
                        Monitor cloud activity,
                        investigate threats, and
                        track AWS security posture
                        from one place.
                    </p>

                </div>


                <div className="dashboard-environment">

                    <div className="dashboard-live">
                        <span className="dashboard-live-dot" />
                        Live monitoring
                    </div>

                    <div className="dashboard-environment-name">
                        AWS Environment
                    </div>

                    <div className="dashboard-environment-region">
                        ap-south-1
                    </div>

                </div>

            </header>


            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}


            {loading && (
                <div className="dashboard-loading">
                    Loading security overview...
                </div>
            )}


            <section className="dashboard-section">

                <div className="dashboard-section-heading">

                    <div>
                        <span className="dashboard-section-kicker">
                            OPERATIONS
                        </span>

                        <h2>
                            Security Activity
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="dashboard-text-button"
                        onClick={() =>
                            onNavigate("alerts")
                        }
                    >
                        View all alerts →
                    </button>

                </div>


                <div className="dashboard-metrics">

                    <MetricCard
                        label="TOTAL ALERTS"
                        value={totalAlerts}
                        description="Detected security alerts"
                        onClick={() =>
                            onNavigate("alerts")
                        }
                    />

                    <MetricCard
                        label="CRITICAL"
                        value={criticalAlerts}
                        description="Immediate attention"
                        tone="critical"
                        onClick={() =>
                            onNavigate("alerts")
                        }
                    />

                    <MetricCard
                        label="INVESTIGATING"
                        value={investigatingAlerts}
                        description="Active investigations"
                        tone="high"
                        onClick={() =>
                            onNavigate(
                                "investigations"
                            )
                        }
                    />

                    <MetricCard
                        label="RESOLVED"
                        value={resolvedAlerts}
                        description="Closed investigations"
                        tone="low"
                        onClick={() =>
                            onNavigate(
                                "investigations"
                            )
                        }
                    />

                </div>

            </section>


            <section className="dashboard-main-grid">

                <div className="dashboard-card threat-card">

                    <div className="dashboard-card-header">

                        <div>
                            <span className="dashboard-card-kicker">
                                THREAT LANDSCAPE
                            </span>

                            <h3>
                                Threat Distribution
                            </h3>

                            <p>
                                Current alerts grouped
                                by severity.
                            </p>
                        </div>

                        <span className="dashboard-card-total">
                            {threatTotal}
                        </span>

                    </div>


                    <div className="threat-layout">

                        <div className="threat-summary">

                            <div className="threat-total">
                                <strong>
                                    {totalAlerts}
                                </strong>

                                <span>
                                    Total alerts
                                </span>
                            </div>

                            <div className="threat-summary-status">
                                {criticalAlerts > 0
                                    ? `${criticalAlerts} critical alert${
                                          criticalAlerts ===
                                          1
                                              ? ""
                                              : "s"
                                      } require attention`
                                    : "No critical alerts detected"}
                            </div>

                        </div>


                        <div className="threat-bars">

                            {threatRows.map(
                                (row) => {
                                    const percentage =
                                        threatTotal >
                                        0
                                            ? Math.round(
                                                  (row.count /
                                                      threatTotal) *
                                                      100
                                              )
                                            : 0

                                    return (
                                        <div
                                            className="threat-row"
                                            key={
                                                row.label
                                            }
                                        >

                                            <div className="threat-row-heading">

                                                <span className="threat-row-label">
                                                    <span
                                                        className={`threat-dot ${row.className}`}
                                                    />

                                                    {
                                                        row.label
                                                    }
                                                </span>

                                                <strong>
                                                    {
                                                        row.count
                                                    }
                                                </strong>

                                            </div>


                                            <div className="threat-progress">
                                                <span
                                                    className={`threat-progress-fill ${row.className}`}
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
                                                />
                                            </div>

                                        </div>
                                    )
                                }
                            )}

                        </div>

                    </div>

                </div>


                <div className="dashboard-card activity-card">

                    <div className="dashboard-card-header">

                        <div>
                            <span className="dashboard-card-kicker">
                                SECURITY FEED
                            </span>

                            <h3>
                                Recent Activity
                            </h3>

                            <p>
                                Latest detected security
                                events.
                            </p>
                        </div>

                    </div>


                    <div className="dashboard-activity-list">

                        {recentAlerts.length === 0 ? (
                            <div className="dashboard-empty">

                                <div className="dashboard-empty-icon">
                                    ✓
                                </div>

                                <strong>
                                    No recent threats
                                </strong>

                                <span>
                                    CloudSentinel has not
                                    detected any alert
                                    activity yet.
                                </span>

                            </div>
                        ) : (
                            recentAlerts.map(
                                (alert) => (
                                    <button
                                        type="button"
                                        className="dashboard-activity-item"
                                        key={
                                            alert.id
                                        }
                                        onClick={() =>
                                            onNavigate({
                                                page: "alert-details",
                                                alertId:
                                                    alert.id,
                                            })
                                        }
                                    >

                                        <span
                                            className={`dashboard-activity-indicator ${normalizeSeverity(
                                                alert.severity
                                            ).toLowerCase()}`}
                                        />

                                        <span className="dashboard-activity-content">

                                            <strong>
                                                {formatRule(
                                                    alert.rule
                                                )}
                                            </strong>

                                            <span>
                                                {alert.user ||
                                                    "Unknown user"}
                                                {" · "}
                                                {alert.action ||
                                                    "Security event"}
                                            </span>

                                        </span>

                                        <span className="dashboard-activity-meta">

                                            <SeverityBadge
                                                severity={
                                                    alert.severity
                                                }
                                            />

                                            <time>
                                                {formatRelativeTime(
                                                    alert.created_at
                                                )}
                                            </time>

                                        </span>

                                    </button>
                                )
                            )
                        )}

                    </div>

                </div>

            </section>


            <section className="dashboard-card posture-card">

                <div className="dashboard-card-header posture-header">

                    <div>
                        <span className="dashboard-card-kicker">
                            CLOUD SECURITY POSTURE
                        </span>

                        <h3>
                            AWS Security Posture
                        </h3>

                        <p>
                            Review configuration findings
                            identified by CloudSentinel CSPM.
                        </p>
                    </div>


                    <div className="posture-actions">

                        <button
                            type="button"
                            className="dashboard-secondary-button"
                            onClick={() =>
                                onNavigate(
                                    "cspm-findings"
                                )
                            }
                        >
                            View findings
                        </button>

                        <button
                            type="button"
                            className="dashboard-primary-button"
                            onClick={
                                handleCspmScan
                            }
                            disabled={scanning}
                        >
                            {scanning
                                ? "Scanning..."
                                : "Run CSPM scan"}
                        </button>

                    </div>

                </div>


                {findingError && (
                    <div className="dashboard-error dashboard-inline-error">
                        {findingError}
                    </div>
                )}


                <div className="posture-metrics">

                    <div className="posture-metric">
                        <span>
                            TOTAL FINDINGS
                        </span>

                        <strong>
                            {totalFindings}
                        </strong>
                    </div>

                    <div className="posture-metric critical">
                        <span>
                            CRITICAL
                        </span>

                        <strong>
                            {criticalFindings}
                        </strong>
                    </div>

                    <div className="posture-metric high">
                        <span>
                            HIGH
                        </span>

                        <strong>
                            {highFindings}
                        </strong>
                    </div>

                    <div className="posture-metric medium">
                        <span>
                            MEDIUM
                        </span>

                        <strong>
                            {mediumFindings}
                        </strong>
                    </div>

                </div>


                <div className="dashboard-findings">

                    {findings.length === 0 ? (
                        <div className="dashboard-empty posture-empty">

                            <div className="dashboard-empty-icon">
                                ✓
                            </div>

                            <strong>
                                No CSPM findings detected
                            </strong>

                            <span>
                                The latest posture data
                                contains no configured
                                security findings.
                            </span>

                        </div>
                    ) : (
                        findings
                            .slice(0, 5)
                            .map((finding) => (
                                <button
                                    type="button"
                                    className="dashboard-finding"
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

                                    <div className="dashboard-finding-main">

                                        <div className="dashboard-finding-title-row">

                                            <strong>
                                                {finding.title ||
                                                    "Security finding"}
                                            </strong>

                                            <FindingSeverity
                                                severity={
                                                    finding.severity
                                                }
                                            />

                                        </div>

                                        <span>
                                            {finding.finding_id}
                                            {" · "}
                                            {finding.resource ||
                                                "AWS resource"}
                                        </span>

                                    </div>


                                    <div className="dashboard-finding-meta">

                                        <FindingStatus
                                            status={
                                                finding.status
                                            }
                                        />

                                        <span className="dashboard-finding-arrow">
                                            →
                                        </span>

                                    </div>

                                </button>
                            ))
                    )}

                </div>

            </section>


            <section className="dashboard-footer-grid">

                <button
                    type="button"
                    className="dashboard-quick-card"
                    onClick={() =>
                        onNavigate("investigations")
                    }
                >
                    <span className="dashboard-quick-kicker">
                        INVESTIGATIONS
                    </span>

                    <strong>
                        {investigatingAlerts}
                    </strong>

                    <span>
                        Active investigations →
                    </span>
                </button>


                <button
                    type="button"
                    className="dashboard-quick-card"
                    onClick={() =>
                        onNavigate("events")
                    }
                >
                    <span className="dashboard-quick-kicker">
                        EVENT STREAM
                    </span>

                    <strong>
                        CloudTrail
                    </strong>

                    <span>
                        Review security events →
                    </span>
                </button>


                <button
                    type="button"
                    className="dashboard-quick-card"
                    onClick={() =>
                        onNavigate("cspm-findings")
                    }
                >
                    <span className="dashboard-quick-kicker">
                        POSTURE
                    </span>

                    <strong>
                        {totalFindings}
                    </strong>

                    <span>
                        Security findings →
                    </span>
                </button>

            </section>

        </div>
    )
}


export default Dashboard
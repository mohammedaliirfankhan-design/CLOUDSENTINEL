import { useEffect, useMemo, useState } from "react"



import {

    getAlerts,

    getMetrics,

    getFindings,

    getFindingMetrics,

    runCspmScan,

    getAnalyticsOverview,

    getAnalyticsSeverity,

    getAnalyticsRules,

    getAnalyticsUsers,

    getAnalyticsSourceIps,

    getAnalyticsTrends,

    getAnalyticsInvestigations,

    getAnalyticsCspm,

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



function formatResolutionTime(minutes) {

    if (!minutes || minutes < 0) {

        return "—"

    }



    if (minutes < 60) {

        return `${Math.round(minutes)}m`

    }



    const hours = minutes / 60



    if (hours < 24) {

        return `${hours.toFixed(1)}h`

    }



    const days = hours / 24



    return `${days.toFixed(1)}d`

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



        const [analyticsOverview, setAnalyticsOverview] =

    useState(null)



    const [analyticsSeverity, setAnalyticsSeverity] =

        useState([])



    const [analyticsRules, setAnalyticsRules] =

        useState([])



    const [analyticsUsers, setAnalyticsUsers] =

        useState([])



    const [analyticsSourceIps, setAnalyticsSourceIps] =

        useState([])



    const [analyticsTrends, setAnalyticsTrends] =

        useState([])



    const [analyticsInvestigations, setAnalyticsInvestigations] =

        useState(null)



    const [analyticsCspm, setAnalyticsCspm] =

        useState(null)



    const [analyticsError, setAnalyticsError] =

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

                    analyticsOverviewData,

                    analyticsSeverityData,

                    analyticsRulesData,

                    analyticsUsersData,

                    analyticsSourceIpsData,

                    analyticsTrendsData,

                    analyticsInvestigationsData,

                    analyticsCspmData,

                ] = await Promise.all([

                    getMetrics(),

                    getAlerts(),

                    getFindings(),

                    getFindingMetrics(),



                    getAnalyticsOverview(),

                    getAnalyticsSeverity(),

                    getAnalyticsRules(),

                    getAnalyticsUsers(10),

                    getAnalyticsSourceIps(10),

                    getAnalyticsTrends(60),

                    getAnalyticsInvestigations(),

                    getAnalyticsCspm(),

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



                    setAnalyticsOverview(

                        analyticsOverviewData &&

                            typeof analyticsOverviewData === "object"

                            ? analyticsOverviewData

                            : null

                    )



                    setAnalyticsSeverity(

                        Array.isArray(analyticsSeverityData)

                            ? analyticsSeverityData

                            : []

                    )



                    setAnalyticsRules(

                        Array.isArray(analyticsRulesData)

                            ? analyticsRulesData

                            : []

                    )



                    setAnalyticsUsers(

                        Array.isArray(analyticsUsersData)

                            ? analyticsUsersData

                            : []

                    )



                    setAnalyticsSourceIps(

                        Array.isArray(analyticsSourceIpsData)

                            ? analyticsSourceIpsData

                            : []

                    )



                    setAnalyticsTrends(

                        Array.isArray(analyticsTrendsData)

                            ? analyticsTrendsData

                            : []

                    )



                    setAnalyticsInvestigations(

                        analyticsInvestigationsData &&

                        typeof analyticsInvestigationsData === "object"

                            ? analyticsInvestigationsData

                            : null

                    )



                    setAnalyticsCspm(

                        analyticsCspmData &&

                        typeof analyticsCspmData === "object"

                            ? analyticsCspmData

                            : null

                    )



                    setAnalyticsError("")

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



    const analyticsTotalAlerts =

        analyticsOverview?.total_alerts ?? totalAlerts



    const analyticsCriticalAlerts =

        analyticsOverview?.critical_alerts ?? criticalAlerts



    const analyticsHighAlerts =

        analyticsOverview?.high_alerts ?? highAlerts



    const analyticsMediumAlerts =

        analyticsOverview?.medium_alerts ?? mediumAlerts



    const analyticsLowAlerts =

        analyticsOverview?.low_alerts ?? lowAlerts



    const analyticsAverageRisk =

        analyticsOverview?.average_risk_score ?? 0



    const analyticsUniqueUsers =

        analyticsOverview?.unique_users ?? 0



    const analyticsUniqueSourceIps =

        analyticsOverview?.unique_source_ips ?? 0



    const analyticsUniqueRules =

        analyticsOverview?.unique_rules ?? 0



    const resolutionRate =

        analyticsInvestigations?.resolution_rate_percent ?? 0



    const averageResolutionTime =

        analyticsInvestigations?.average_resolution_time_minutes ?? 0





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



<section className="dashboard-section soc-analytics-section">



    <div className="dashboard-section-heading">

        <div>

            <span className="dashboard-section-kicker">

                SOC ANALYTICS

            </span>



            <h2>

                Security Operations Analytics

            </h2>



            <p className="dashboard-section-description">

                Operational visibility across alerts,

                detection activity, investigations, and

                cloud security posture.

            </p>

        </div>

    </div>



    {analyticsError && (

        <div className="dashboard-error dashboard-inline-error">

            {analyticsError}

        </div>

    )}



    <div className="dashboard-metrics soc-analytics-metrics">



        <MetricCard

            label="TOTAL ALERTS"

            value={analyticsTotalAlerts}

            description="All detected security alerts"

        />



        <MetricCard

            label="AVERAGE RISK"

            value={analyticsAverageRisk}

            description="Average alert risk score"

            tone={

                analyticsAverageRisk >= 90

                    ? "critical"

                    : analyticsAverageRisk >= 70

                        ? "high"

                        : "medium"

            }

        />



        <MetricCard

            label="UNIQUE USERS"

            value={analyticsUniqueUsers}

            description="Users associated with alerts"

        />



        <MetricCard

            label="SOURCE IPS"

            value={analyticsUniqueSourceIps}

            description="Unique alert source addresses"

        />



    </div>





    <div className="soc-analytics-grid">

    {/* ALERT TREND */}
    <div className="dashboard-card soc-analytics-card soc-analytics-trend-card">

        <div className="dashboard-card-header">
            <div>
                <span className="dashboard-card-kicker">
                    ALERT TREND
                </span>

                <h3>
                    Alerts Over Time
                </h3>

                <p>
                    Alert activity across the last 60 days.
                </p>
            </div>

            <span className="dashboard-card-total">
                60D
            </span>
        </div>

        {analyticsTrends.length === 0 ? (

            <div className="dashboard-empty">

                <strong>
                    No alert activity in this period
                </strong>

                <span>
                    No alerts were recorded during the selected
                    60-day window.
                </span>

            </div>

        ) : (

            <div className="soc-analytics-trend">

                {analyticsTrends.map((item) => {

                    const maxCount = Math.max(
                        ...analyticsTrends.map(
                            (trend) => trend.count || 0
                        ),
                        1
                    )

                    const height =
                        ((item.count || 0) / maxCount) * 100

                    return (
                        <div
                            className="soc-analytics-trend-item"
                            key={item.date}
                            title={`${item.date}: ${item.count} alerts`}
                        >

                            <div className="soc-analytics-trend-value">
                                {item.count}
                            </div>

                            <div className="soc-analytics-trend-track">

                                <span
                                    className="soc-analytics-trend-bar"
                                    style={{
                                        height: `${Math.max(
                                            height,
                                            8
                                        )}%`,
                                    }}
                                />

                            </div>

                            <span className="soc-analytics-trend-label">
                                {new Date(
                                    `${item.date}T00:00:00`
                                ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>

                        </div>
                    )
                })}

            </div>

        )}

    </div>


    {/* ALERT SEVERITY */}
    <div className="dashboard-card soc-analytics-card">

        <div className="dashboard-card-header">

            <div>

                <span className="dashboard-card-kicker">
                    SEVERITY
                </span>

                <h3>
                    Alert Severity
                </h3>

                <p>
                    Distribution of detected alerts.
                </p>

            </div>

        </div>

        <div className="soc-analytics-list">

            {[
                {
                    label: "Critical",
                    count: analyticsCriticalAlerts,
                    className: "critical",
                },
                {
                    label: "High",
                    count: analyticsHighAlerts,
                    className: "high",
                },
                {
                    label: "Medium",
                    count: analyticsMediumAlerts,
                    className: "medium",
                },
                {
                    label: "Low",
                    count: analyticsLowAlerts,
                    className: "low",
                },
            ].map((item) => {

                const percentage =
                    analyticsTotalAlerts > 0
                        ? (item.count / analyticsTotalAlerts) * 100
                        : 0

                return (
                    <div
                        className="soc-analytics-row"
                        key={item.label}
                    >

                        <div className="soc-analytics-row-top">

                            <span>
                                {item.label}
                            </span>

                            <strong>
                                {item.count}
                            </strong>

                        </div>

                        <div className="soc-analytics-bar">

                            <span
                                className={`soc-analytics-bar-fill ${item.className}`}
                                style={{
                                    width: `${percentage}%`,
                                }}
                            />

                        </div>

                    </div>
                )
            })}

        </div>

    </div>


    {/* DETECTION RULES */}
    <div className="dashboard-card soc-analytics-card">

        <div className="dashboard-card-header">

            <div>

                <span className="dashboard-card-kicker">
                    DETECTION ENGINE
                </span>

                <h3>
                    Detection Rules
                </h3>

                <p>
                    Alerts grouped by detection rule.
                </p>

            </div>

        </div>

        <div className="soc-analytics-list">

            {analyticsRules.length === 0 ? (

                <div className="dashboard-empty">
                    <strong>
                        No detection rule data
                    </strong>

                    <span>
                        No alert rules are currently available.
                    </span>
                </div>

            ) : (

                analyticsRules.map((item) => {

                    const percentage =
                        analyticsTotalAlerts > 0
                            ? (item.count / analyticsTotalAlerts) * 100
                            : 0

                    return (
                        <div
                            className="soc-analytics-row"
                            key={item.rule}
                        >

                            <div className="soc-analytics-row-top">

                                <span>
                                    {formatRule(item.rule)}
                                </span>

                                <strong>
                                    {item.count}
                                </strong>

                            </div>

                            <div className="soc-analytics-bar">

                                <span
                                    className="soc-analytics-bar-fill"
                                    style={{
                                        width: `${percentage}%`,
                                    }}
                                />

                            </div>

                        </div>
                    )
                })

            )}

        </div>

    </div>


    {/* TOP SOURCE IPS */}
    <div className="dashboard-card soc-analytics-card">

        <div className="dashboard-card-header">

            <div>

                <span className="dashboard-card-kicker">
                    NETWORK ACTIVITY
                </span>

                <h3>
                    Source IP Activity
                </h3>

                <p>
                    Alert activity grouped by source address.
                </p>

            </div>

        </div>

        <div className="soc-analytics-list">

            {analyticsSourceIps.length === 0 ? (

                <div className="dashboard-empty">

                    <strong>
                        No source IP data
                    </strong>

                    <span>
                        No alert source addresses are available.
                    </span>

                </div>

            ) : (

                analyticsSourceIps.map((item) => {

                    const percentage =
                        analyticsTotalAlerts > 0
                            ? (item.count / analyticsTotalAlerts) * 100
                            : 0

                    return (
                        <div
                            className="soc-analytics-row"
                            key={item.source_ip}
                        >

                            <div className="soc-analytics-row-top">

                                <span>
                                    {item.source_ip || "Unknown"}
                                </span>

                                <strong>
                                    {item.count}
                                </strong>

                            </div>

                            <div className="soc-analytics-bar">

                                <span
                                    className="soc-analytics-bar-fill"
                                    style={{
                                        width: `${percentage}%`,
                                    }}
                                />

                            </div>

                        </div>
                    )
                })

            )}

        </div>

    </div>


    {/* INVESTIGATION ANALYTICS */}
    <div className="dashboard-card soc-analytics-card">

        <div className="dashboard-card-header">

            <div>

                <span className="dashboard-card-kicker">
                    INVESTIGATIONS
                </span>

                <h3>
                    Investigation Analytics
                </h3>

                <p>
                    Investigation workload and resolution performance.
                </p>

            </div>

        </div>

        <div className="soc-analytics-response-grid">

            <div className="soc-analytics-response-item">
                <span>Open</span>
                <strong>
                    {analyticsInvestigations?.open ?? 0}
                </strong>
            </div>

            <div className="soc-analytics-response-item">
                <span>Investigating</span>
                <strong>
                    {analyticsInvestigations?.investigating ?? 0}
                </strong>
            </div>

            <div className="soc-analytics-response-item">
                <span>Resolved</span>
                <strong>
                    {analyticsInvestigations?.resolved ?? 0}
                </strong>
            </div>

            <div className="soc-analytics-response-item">
                <span>Resolution Rate</span>
                <strong>
                    {Number(resolutionRate).toFixed(2)}%
                </strong>
            </div>

            <div className="soc-analytics-response-item">
                <span>Avg. Resolution</span>
                <strong>
                    {formatResolutionTime(
                        averageResolutionTime
                    )}
                </strong>
            </div>

        </div>

    </div>


    {/* CSPM ANALYTICS */}
    <div className="dashboard-card soc-analytics-card soc-analytics-cspm">

        <div className="dashboard-card-header">

            <div>

                <span className="dashboard-card-kicker">
                    CLOUD POSTURE
                </span>

                <h3>
                    CSPM Analytics
                </h3>

                <p>
                    Cloud security posture findings by severity and status.
                </p>

            </div>

        </div>

        <div className="posture-metrics">

            <div className="posture-metric">
                <span>Total</span>
                <strong>
                    {analyticsCspm?.total ?? 0}
                </strong>
            </div>

            <div className="posture-metric critical">
                <span>Critical</span>
                <strong>
                    {analyticsCspm?.critical ?? 0}
                </strong>
            </div>

            <div className="posture-metric high">
                <span>High</span>
                <strong>
                    {analyticsCspm?.high ?? 0}
                </strong>
            </div>

            <div className="posture-metric medium">
                <span>Medium</span>
                <strong>
                    {analyticsCspm?.medium ?? 0}
                </strong>
            </div>

            <div className="posture-metric low">
                <span>Low</span>
                <strong>
                    {analyticsCspm?.low ?? 0}
                </strong>
            </div>

        </div>

    </div>

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

                            OPEN FINDINGS

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
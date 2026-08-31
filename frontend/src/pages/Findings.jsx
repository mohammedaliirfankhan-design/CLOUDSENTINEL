import { useEffect, useState } from "react"
import {
    getFindings,
    getFindingMetrics,
} from "../api/cloudsentinel"


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


    return (
        <div className="dashboard-page">

            <div className="page-heading">

                <div>

                    <span className="topbar-eyebrow">
                        CLOUD SECURITY POSTURE
                    </span>

                    <h2>
                        CSPM Findings
                    </h2>

                    <p>
                        Review security posture
                        findings detected across
                        the AWS environment.
                    </p>

                </div>


                <div className="live-indicator">

                    <span className="status-dot"></span>

                    AWS posture monitoring

                </div>

            </div>


            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}


            {loading && (
                <div className="loading-message">
                    Loading CSPM findings...
                </div>
            )}


            <section className="metrics-grid">

                <div className="metric-card">

                    <div className="metric-card-header">
                        <span>
                            OPEN FINDINGS
                        </span>

                        <span className="metric-indicator"></span>
                    </div>

                    <strong className="metric-value">
                        {metrics?.total ?? 0}
                    </strong>

                    <span className="metric-description">
                        Active posture findings
                    </span>

                </div>


                <div className="metric-card critical">

                    <div className="metric-card-header">
                        <span>
                            CRITICAL
                        </span>

                        <span className="metric-indicator"></span>
                    </div>

                    <strong className="metric-value">
                        {metrics?.critical ?? 0}
                    </strong>

                    <span className="metric-description">
                        Critical open findings
                    </span>

                </div>


                <div className="metric-card high">

                    <div className="metric-card-header">
                        <span>
                            HIGH
                        </span>

                        <span className="metric-indicator"></span>
                    </div>

                    <strong className="metric-value">
                        {metrics?.high ?? 0}
                    </strong>

                    <span className="metric-description">
                        High-risk open findings
                    </span>

                </div>


                <div className="metric-card medium">

                    <div className="metric-card-header">
                        <span>
                            MEDIUM
                        </span>

                        <span className="metric-indicator"></span>
                    </div>

                    <strong className="metric-value">
                        {metrics?.medium ?? 0}
                    </strong>

                    <span className="metric-description">
                        Medium-risk open findings
                    </span>

                </div>

            </section>


            <section className="dashboard-panel">

                <div className="panel-header">

                    <div>

                        <h3>
                            Security Findings
                        </h3>

                        <p>
                            Current and historical
                            CSPM findings.
                        </p>

                    </div>

                </div>


                <div className="cspm-findings">

                    {!loading &&
                    findings.length === 0 ? (

                        <div className="cspm-empty">

                            <strong>
                                No CSPM findings
                            </strong>

                            <span>
                                No security posture
                                findings are currently
                                available.
                            </span>

                        </div>

                    ) : (

                        findings.map(
                            (finding) => (

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


                                        <FindingSeverity
                                            severity={
                                                finding.severity
                                            }
                                        />

                                    </div>

                                </button>

                            )
                        )

                    )}

                </div>

            </section>

        </div>
    )
}


export default Findings
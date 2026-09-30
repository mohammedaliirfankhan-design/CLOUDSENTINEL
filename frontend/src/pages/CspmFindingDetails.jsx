import { useState } from "react"
import { updateFindingStatus } from "../api/cloudsentinel"


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


function formatStatus(status) {
    return String(
        status || "OPEN"
    ).toUpperCase()
}


function CspmFindingDetails({
    finding,
    onBack,
}) {
    const [currentStatus, setCurrentStatus] =
        useState(
            String(
                finding?.status || "OPEN"
            ).toUpperCase()
        )

    const [updating, setUpdating] =
        useState(false)

    const [error, setError] =
        useState("")


    if (!finding) {
        return (
            <div className="cspm-finding-details-page">

                <div className="finding-not-found">

                    <span className="section-eyebrow">
                        FINDING NOT FOUND
                    </span>

                    <h2>
                        No CSPM finding selected
                    </h2>

                    <p>
                        Return to the dashboard and
                        select a security posture finding.
                    </p>

                    <button
                        type="button"
                        className="cspm-back-button"
                        onClick={onBack}
                    >
                        Back to Dashboard
                    </button>

                </div>

            </div>
        )
    }


    const severity = String(
        finding.severity || "INFO"
    ).toUpperCase()

    const status = formatStatus(
        currentStatus
    )


    async function handleStatusChange(
        nextStatus
    ) {
        setUpdating(true)
        setError("")

        try {
            const updated =
                await updateFindingStatus(
                    finding.id,
                    nextStatus
                )

            setCurrentStatus(
                String(
                    updated?.status ||
                    nextStatus
                ).toUpperCase()
            )

        } catch (statusError) {
            console.error(
                "Unable to update CSPM finding status:",
                statusError
            )

            setError(
                statusError.message ||
                "Unable to update finding status."
            )

        } finally {
            setUpdating(false)
        }
    }


    return (
        <div className="cspm-finding-details-page">

            <div className="cspm-details-topbar">

                <button
                    type="button"
                    className="cspm-back-button"
                    onClick={onBack}
                >
                    <span aria-hidden="true">
                        ←
                    </span>

                    Back to Dashboard
                </button>

            </div>


            <div className="cspm-finding-hero">

                <div className="cspm-finding-hero-copy">

                    <span className="section-eyebrow">
                        CSPM SECURITY FINDING
                    </span>

                    <h2>
                        {finding.title ||
                            "Security posture finding"}
                    </h2>

                    <p className="cspm-finding-reference">
                        <span>
                            {finding.finding_id ||
                                finding.id ||
                                "UNKNOWN"}
                        </span>

                        <span>
                            ·
                        </span>

                        <span>
                            {finding.resource ||
                                "AWS resource"}
                        </span>
                    </p>

                </div>


                <div className="cspm-finding-hero-meta">

                    <FindingSeverity
                        severity={severity}
                    />

                    <div className="cspm-finding-type">

                        <span className="status-dot"></span>

                        CSPM finding

                    </div>

                </div>

            </div>


            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}


            <section className="cspm-overview-panel">

                <div className="cspm-panel-header">

                    <div>

                        <span className="section-eyebrow">
                            FINDING OVERVIEW
                        </span>

                        <h3>
                            Security posture status
                        </h3>

                    </div>

                </div>


                <div className="cspm-overview-grid">

                    <div className="cspm-overview-item">

                        <span>
                            SEVERITY
                        </span>

                        <div>
                            <FindingSeverity
                                severity={severity}
                            />
                        </div>

                    </div>


                    <div className="cspm-overview-item">

                        <span>
                            STATUS
                        </span>

                        <div>

                            <span
                                className={`finding-status ${status.toLowerCase()}`}
                            >
                                {status}
                            </span>

                        </div>

                    </div>


                    <div className="cspm-overview-item">

                        <span>
                            RESOURCE
                        </span>

                        <strong>
                            {finding.resource ||
                                "Unknown"}
                        </strong>

                    </div>


                    <div className="cspm-overview-item">

                        <span>
                            SOURCE
                        </span>

                        <strong>
                            {finding.source ||
                                "AWS_CSPM"}
                        </strong>

                    </div>

                </div>

            </section>


            <section className="cspm-action-panel">

                <div>

                    <span className="section-eyebrow">
                        ANALYST ACTION
                    </span>

                    <h3>
                        Finding Status
                    </h3>

                    <p>
                        Update the remediation state
                        of this CSPM finding.
                    </p>

                </div>


                <div className="cspm-action-controls">

                    <span
                        className={`finding-status ${status.toLowerCase()}`}
                    >
                        {status}
                    </span>


                    {status === "OPEN" ? (

                        <button
                            type="button"
                            className="cspm-status-action"
                            disabled={updating}
                            onClick={() =>
                                handleStatusChange(
                                    "RESOLVED"
                                )
                            }
                        >
                            {updating
                                ? "Updating..."
                                : "Mark as Resolved"}
                        </button>

                    ) : (

                        <button
                            type="button"
                            className="cspm-status-action"
                            disabled={updating}
                            onClick={() =>
                                handleStatusChange(
                                    "OPEN"
                                )
                            }
                        >
                            {updating
                                ? "Updating..."
                                : "Reopen Finding"}
                        </button>

                    )}

                </div>

            </section>


            <section className="cspm-information-panel">

                <div className="cspm-panel-header">

                    <div>

                        <span className="section-eyebrow">
                            FINDING INFORMATION
                        </span>

                        <h3>
                            Security Posture Finding
                        </h3>

                    </div>

                </div>


                <div className="cspm-information-grid">

                    <div className="cspm-information-item">

                        <span>
                            FINDING ID
                        </span>

                        <strong>
                            {finding.finding_id ||
                                finding.id ||
                                "Unknown"}
                        </strong>

                    </div>


                    <div className="cspm-information-item">

                        <span>
                            RESOURCE
                        </span>

                        <strong>
                            {finding.resource ||
                                "Unknown"}
                        </strong>

                    </div>


                    <div className="cspm-information-item">

                        <span>
                            DETECTED
                        </span>

                        <strong>
                            {finding.detected_at ||
                                "Unknown"}
                        </strong>

                    </div>


                    <div className="cspm-information-item wide">

                        <span>
                            DESCRIPTION
                        </span>

                        <p>
                            {finding.description ||
                                "No description available."}
                        </p>

                    </div>


                    <div className="cspm-information-item wide">

                        <span>
                            RECOMMENDATION
                        </span>

                        <p>
                            {finding.recommendation ||
                                "No recommendation available."}
                        </p>

                    </div>

                </div>

            </section>


            <section className="cspm-evidence-panel">

                <div className="cspm-panel-header">

                    <div>

                        <span className="section-eyebrow">
                            EVIDENCE
                        </span>

                        <h3>
                            Detection Evidence
                        </h3>

                        <p>
                            Raw evidence captured by
                            the CSPM detection pipeline.
                        </p>

                    </div>

                </div>


                <div className="cspm-evidence-container">

                    <div className="cspm-evidence-label">
                        JSON
                    </div>

                    <pre className="finding-evidence">
                        {JSON.stringify(
                            finding.evidence || {},
                            null,
                            2
                        )}
                    </pre>

                </div>

            </section>

        </div>
    )
}


export default CspmFindingDetails
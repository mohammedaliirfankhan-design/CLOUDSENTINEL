import { useState } from "react"
import { updateFindingStatus } from "../api/cloudsentinel"


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
            <div className="coming-soon">

                <span>
                    FINDING NOT FOUND
                </span>

                <h2>
                    No CSPM finding selected
                </h2>

                <button
                    type="button"
                    className="cspm-status-action"
                    onClick={onBack}
                >
                    Back to Dashboard
                </button>

            </div>
        )
    }


    const severity = String(
        finding.severity || "INFO"
    ).toUpperCase()


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
        <div className="alert-details-page">

            <button
                type="button"
                className="back-button"
                onClick={onBack}
            >
                Back to Dashboard
            </button>


            <div className="page-heading">

                <div>

                    <span className="topbar-eyebrow">
                        CSPM SECURITY FINDING
                    </span>

                    <h2>
                        {finding.title}
                    </h2>

                    <p>
                        {finding.finding_id} ·{" "}
                        {finding.resource ||
                            "AWS resource"}
                    </p>

                </div>


                <div className="alert-details-actions">

                    <FindingSeverity
                        severity={severity}
                    />

                    <div className="live-indicator">
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


            <section className="detail-grid">

                <div className="detail-card">

                    <span>
                        SEVERITY
                    </span>

                    <strong>
                        {severity}
                    </strong>

                </div>


                <div className="detail-card">

                    <span>
                        STATUS
                    </span>

                    <strong>
                        {currentStatus}
                    </strong>

                </div>


                <div className="detail-card">

                    <span>
                        RESOURCE
                    </span>

                    <strong>
                        {finding.resource ||
                            "Unknown"}
                    </strong>

                </div>


                <div className="detail-card">

                    <span>
                        SOURCE
                    </span>

                    <strong>
                        {finding.source ||
                            "AWS_CSPM"}
                    </strong>

                </div>

            </section>


            <section className="detail-panel">

                <div
                    className="detail-panel-header"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "20px",
                        flexWrap: "wrap",
                    }}
                >

                    <div>

                        <span className="topbar-eyebrow">
                            ANALYST ACTION
                        </span>

                        <h3>
                            Finding Status
                        </h3>

                    </div>


                    <div
                        className="finding-status-actions"
                        style={{
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            flexShrink: 0,
                        }}
                    >

                        {currentStatus === "OPEN" ? (

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

                </div>

            </section>


            <section className="detail-panel">

                <div className="detail-panel-header">

                    <div>

                        <span className="topbar-eyebrow">
                            FINDING INFORMATION
                        </span>

                        <h3>
                            Security Posture Finding
                        </h3>

                    </div>

                </div>


                <div className="detail-list">

                    <div>
                        <span>
                            Finding ID
                        </span>

                        <strong>
                            {finding.finding_id}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Resource
                        </span>

                        <strong>
                            {finding.resource ||
                                "Unknown"}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Detected
                        </span>

                        <strong>
                            {finding.detected_at ||
                                "Unknown"}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Description
                        </span>

                        <strong>
                            {finding.description ||
                                "No description available."}
                        </strong>
                    </div>


                    <div>
                        <span>
                            Recommendation
                        </span>

                        <strong>
                            {finding.recommendation ||
                                "No recommendation available."}
                        </strong>
                    </div>

                </div>

            </section>


            <section className="detail-panel">

                <div className="detail-panel-header">

                    <div>

                        <span className="topbar-eyebrow">
                            EVIDENCE
                        </span>

                        <h3>
                            Detection Evidence
                        </h3>

                    </div>

                </div>


                <pre className="finding-evidence">
                    {JSON.stringify(
                        finding.evidence || {},
                        null,
                        2
                    )}
                </pre>

            </section>

        </div>
    )
}


function FindingSeverity({
    severity,
}) {
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


export default CspmFindingDetails
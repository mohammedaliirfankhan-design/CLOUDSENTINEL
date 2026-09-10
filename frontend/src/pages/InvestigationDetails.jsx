import { useEffect, useState } from "react"
import {
    getInvestigation,
    getInvestigationHistory,
    saveInvestigation,
} from "../api/cloudsentinel"

function getAlertId(investigation) {
    if (
        investigation &&
        typeof investigation.alertId === "number"
    ) {
        return investigation.alertId
    }

    if (
        investigation &&
        typeof investigation.alert_id === "number"
    ) {
        return investigation.alert_id
    }

    const alert = investigation?.alert

    if (typeof alert === "number") {
        return alert
    }

    const match = String(alert ?? "").match(/\d+/)

    return match ? Number(match[0]) : null
}

function normalizeStatus(status) {
    const value = String(status ?? "").toUpperCase()

    if (value === "INVESTIGATING") {
        return "Investigating"
    }

    if (value === "RESOLVED") {
        return "Resolved"
    }

    return "Open"
}

function backendStatus(status) {
    if (status === "Investigating") {
        return "INVESTIGATING"
    }

    if (status === "Resolved") {
        return "RESOLVED"
    }

    return "OPEN"
}

function formatNoteTime(value) {
    if (!value) {
        return "Unknown time"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString()
}

function InvestigationDetails({ investigation, onBack }) {
    const [status, setStatus] = useState(
        normalizeStatus(investigation?.status)
    )
    const [note, setNote] = useState("")
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const alertId = getAlertId(investigation)

    useEffect(() => {
        let cancelled = false

        async function loadInvestigationData() {
            if (!investigation || alertId === null) {
                setLoading(false)
                return
            }

            setLoading(true)
            setError("")

            try {
                const [savedInvestigation, history] = await Promise.all([
                    getInvestigation(alertId),
                    getInvestigationHistory(alertId),
                ])

                if (cancelled) {
                    return
                }

                if (savedInvestigation?.status) {
                    setStatus(normalizeStatus(savedInvestigation.status))
                } else {
                    setStatus(normalizeStatus(investigation.status))
                }

                if (Array.isArray(history)) {
                    setNotes(
                        history
                            .filter((entry) => entry.analyst_notes?.trim())
                            .map((entry) => ({
                                id: entry.id,
                                text: entry.analyst_notes,
                                time: formatNoteTime(entry.changed_at),
                                analyst:
                                    entry.assigned_analyst ||
                                    investigation.analyst,
                            }))
                    )
                } else {
                    setNotes([])
                }
            } catch (loadError) {
                if (!cancelled) {
                    console.error(
                        "Failed to load investigation:",
                        loadError
                    )
                    setError(
                        loadError.message ||
                        "Unable to load saved investigation data."
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadInvestigationData()

        return () => {
            cancelled = true
        }
    }, [alertId, investigation])

    if (!investigation) {
        return (
            <div className="coming-soon">
                <span>INVESTIGATION NOT FOUND</span>
                <h2>No investigation selected</h2>
                <button
                    type="button"
                    className="detail-action"
                    onClick={onBack}
                >
                    Back to Investigations
                </button>
            </div>
        )
    }

    const persistInvestigation = async (nextStatus, analystNotes) => {
        if (alertId === null) {
            setError("Unable to determine the related alert ID.")
            return false
        }

        setSaving(true)
        setError("")

        try {
            await saveInvestigation({
                alertId,
                status: backendStatus(nextStatus),
                analystNotes,
                assignedAnalyst: investigation.analyst,
            })

            setStatus(nextStatus)

            return true
        } catch (saveError) {
            console.error(
                "Failed to save investigation:",
                saveError
            )

            setError(
                saveError.message ||
                "Unable to save investigation."
            )

            return false
        } finally {
            setSaving(false)
        }
    }

    const handleStatusChange = async (nextStatus) => {
        if (saving || nextStatus === status) {
            return
        }

        await persistInvestigation(nextStatus, "")
    }

    const handleAddNote = async () => {
        const trimmedNote = note.trim()

        if (!trimmedNote || saving) {
            return
        }

        const saved = await persistInvestigation(
            status,
            trimmedNote
        )

        if (!saved) {
            return
        }

        setNote("")

        try {
            const history = await getInvestigationHistory(alertId)

            setNotes(
                Array.isArray(history)
                    ? history
                        .filter(
                            (entry) =>
                                entry.analyst_notes?.trim()
                        )
                        .map((entry) => ({
                            id: entry.id,
                            text: entry.analyst_notes,
                            time: formatNoteTime(
                                entry.changed_at
                            ),
                            analyst:
                                entry.assigned_analyst ||
                                investigation.analyst,
                        }))
                    : []
            )
        } catch (historyError) {
            console.error(
                "Failed to refresh investigation history:",
                historyError
            )
        }
    }

    return (
        <div className="investigation-details-page">
            <button
                type="button"
                className="back-button"
                onClick={onBack}
            >
                Back to Investigations
            </button>

            <div className="page-heading">
                <div>
                    <span className="topbar-eyebrow">
                        SECURITY INVESTIGATION
                    </span>

                    <h2>{investigation.title}</h2>

                    <p>
                        {investigation.id} · {investigation.alert}
                    </p>
                </div>

                <div className="live-indicator">
                    <span className="status-dot"></span>
                    Investigation details
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <section className="investigation-detail-grid">
                <div className="detail-card">
                    <span>PRIORITY</span>
                    <strong>{investigation.priority}</strong>
                </div>

                <div className="detail-card">
                    <span>STATUS</span>
                    <strong>
                        {loading ? "Loading..." : status}
                    </strong>
                </div>

                <div className="detail-card">
                    <span>ANALYST</span>
                    <strong>{investigation.analyst}</strong>
                </div>

                <div className="detail-card">
                    <span>SOURCE</span>
                    <strong>{investigation.source}</strong>
                </div>
            </section>

            <section className="investigation-actions">
                <div>
                    <span className="topbar-eyebrow">
                        CASE ACTIONS
                    </span>

                    <h3>Investigation Status</h3>
                </div>

                <div className="investigation-action-buttons">
                    <button
                        type="button"
                        className={
                            status === "Investigating"
                                ? "active"
                                : ""
                        }
                        disabled={saving}
                        onClick={() =>
                            handleStatusChange("Investigating")
                        }
                    >
                        Start Investigation
                    </button>

                    <button
                        type="button"
                        className={
                            status === "Resolved"
                                ? "active"
                                : ""
                        }
                        disabled={saving}
                        onClick={() =>
                            handleStatusChange("Resolved")
                        }
                    >
                        Resolve
                    </button>

                    <button
                        type="button"
                        className={
                            status === "Open"
                                ? "active"
                                : ""
                        }
                        disabled={saving}
                        onClick={() =>
                            handleStatusChange("Open")
                        }
                    >
                        Reopen
                    </button>
                </div>
            </section>

            <section className="detail-panel">
                <div className="detail-panel-header">
                    <div>
                        <span className="topbar-eyebrow">
                            INVESTIGATION INFORMATION
                        </span>

                        <h3>Investigation Case</h3>
                    </div>
                </div>

                <div className="detail-list">
                    <div>
                        <span>Investigation ID</span>
                        <strong>{investigation.id}</strong>
                    </div>

                    <div>
                        <span>Related Alert</span>
                        <strong>{investigation.alert}</strong>
                    </div>

                    <div>
                        <span>Priority</span>
                        <strong>{investigation.priority}</strong>
                    </div>

                    <div>
                        <span>Status</span>
                        <strong>{status}</strong>
                    </div>

                    <div>
                        <span>Assigned Analyst</span>
                        <strong>{investigation.analyst}</strong>
                    </div>

                    <div>
                        <span>Last Updated</span>
                        <strong>
                            {investigation.updated}
                        </strong>
                    </div>

                    <div>
                        <span>Source</span>
                        <strong>{investigation.source}</strong>
                    </div>
                </div>
            </section>

            <section className="detail-panel investigation-timeline-panel">
                <div className="detail-panel-header">
                    <div>
                        <span className="topbar-eyebrow">
                            INVESTIGATION TIMELINE
                        </span>

                        <h3>Case Activity</h3>
                    </div>
                </div>

                <div className="investigation-timeline">
                    <div className="timeline-item">
                        <span className="timeline-dot"></span>

                        <div>
                            <strong>
                                Security alert detected
                            </strong>

                            <span>
                                Related alert{" "}
                                {investigation.alert} triggered
                                the investigation.
                            </span>

                            <small>
                                {investigation.updated}
                            </small>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <span className="timeline-dot"></span>

                        <div>
                            <strong>
                                Investigation opened
                            </strong>

                            <span>
                                Case {investigation.id} was
                                created for analyst review.
                            </span>

                            <small>
                                {investigation.updated}
                            </small>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <span className="timeline-dot"></span>

                        <div>
                            <strong>Analyst assigned</strong>

                            <span>
                                {investigation.analyst} assigned
                                to this case.
                            </span>

                            <small>
                                {investigation.updated}
                            </small>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <span className="timeline-dot"></span>

                        <div>
                            <strong>Current status</strong>

                            <span>
                                Investigation is currently
                                marked as {status}.
                            </span>

                            <small>Current</small>
                        </div>
                    </div>
                </div>
            </section>

            <section className="detail-panel">
                <div className="detail-panel-header">
                    <div>
                        <span className="topbar-eyebrow">
                            EVIDENCE
                        </span>

                        <h3>Collected Evidence</h3>
                    </div>
                </div>

                <div className="evidence-grid">
                    <div className="evidence-card">
                        <span>RELATED ALERT</span>
                        <strong>
                            {investigation.alert}
                        </strong>
                    </div>

                    <div className="evidence-card">
                        <span>SOURCE</span>
                        <strong>
                            {investigation.source}
                        </strong>
                    </div>

                    <div className="evidence-card">
                        <span>ANALYST</span>
                        <strong>
                            {investigation.analyst}
                        </strong>
                    </div>

                    <div className="evidence-card">
                        <span>PRIORITY</span>
                        <strong>
                            {investigation.priority}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="detail-panel notes-panel">
                <div className="detail-panel-header">
                    <div>
                        <span className="topbar-eyebrow">
                            ANALYST NOTES
                        </span>

                        <h3>Investigation Notes</h3>
                    </div>
                </div>

                <div className="notes-form">
                    <textarea
                        placeholder="Add an investigation note..."
                        value={note}
                        disabled={saving}
                        onChange={(event) =>
                            setNote(event.target.value)
                        }
                    />

                    <button
                        type="button"
                        className="detail-action"
                        disabled={saving}
                        onClick={handleAddNote}
                    >
                        {saving ? "Saving..." : "Add Note"}
                    </button>
                </div>

                <div className="notes-list">
                    {notes.length === 0 ? (
                        <div className="empty-notes">
                            No analyst notes have been added yet.
                        </div>
                    ) : (
                        notes.map((item) => (
                            <div
                                className="note-item"
                                key={item.id}
                            >
                                <div>
                                    <strong>
                                        {item.analyst ||
                                            investigation.analyst}
                                    </strong>

                                    <span>{item.time}</span>
                                </div>

                                <p>{item.text}</p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}

export default InvestigationDetails

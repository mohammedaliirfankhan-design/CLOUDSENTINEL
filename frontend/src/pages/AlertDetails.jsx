function AlertDetails({ alert, onBack, onInvestigate }) {
    if (!alert) {
        return (
            <div className="coming-soon">
                <span>ALERT NOT FOUND</span>
                <h2>No alert selected</h2>
                <button
                    type="button"
                    className="detail-action"
                    onClick={onBack}
                >
                    Back to Alerts
                </button>
            </div>
        )
    }

    return (
        <div className="alert-details-page">
            <button
                type="button"
                className="back-button"
                onClick={onBack}
            >
                Back to Alerts
            </button>

            <div className="page-heading">
                <div>
                    <span className="topbar-eyebrow">
                        SECURITY ALERT
                    </span>

                    <h2>{alert.title}</h2>

                    <p>
                        {alert.id} · {alert.detail}
                    </p>
                </div>

                <div className="alert-details-actions">
    <div className="live-indicator">
        <span className="status-dot"></span>
        Alert details
    </div>

    <button
        type="button"
        className="detail-action"
        onClick={() => onInvestigate(alert)}
    >
        Investigate Alert
    </button>
</div>
            </div>

            <section className="detail-grid">
                <div className="detail-card">
                    <span>SEVERITY</span>
                    <strong>{alert.severity}</strong>
                </div>

                <div className="detail-card">
                    <span>STATUS</span>
                    <strong>{alert.status}</strong>
                </div>

                <div className="detail-card">
                    <span>SOURCE</span>
                    <strong>{alert.source}</strong>
                </div>

                <div className="detail-card">
                    <span>USER</span>
                    <strong>{alert.user}</strong>
                </div>
            </section>

            <section className="detail-panel">
                <div className="detail-panel-header">
                    <div>
                        <span className="topbar-eyebrow">
                            ALERT INFORMATION
                        </span>
                        <h3>Security Event</h3>
                    </div>
                </div>

                <div className="detail-list">
                    <div>
                        <span>Alert ID</span>
                        <strong>{alert.id}</strong>
                    </div>

                    <div>
                        <span>Detection</span>
                        <strong>{alert.detail}</strong>
                    </div>

                    <div>
                        <span>Detected</span>
                        <strong>{alert.time}</strong>
                    </div>

                    <div>
                        <span>Source</span>
                        <strong>{alert.source}</strong>
                    </div>

                    <div>
                        <span>Affected User</span>
                        <strong>{alert.user}</strong>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default AlertDetails

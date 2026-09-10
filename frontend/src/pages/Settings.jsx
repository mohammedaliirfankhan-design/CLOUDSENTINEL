import useAuth from "../auth/useAuth"

function formatUserTime(timestamp) {
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

function Settings() {
    const { user, loadingUser } = useAuth()

    if (loadingUser) {
        return (
            <div className="settings-page">
                <div className="loading-message">
                    Loading account settings...
                </div>
            </div>
        )
    }

    return (
        <div className="settings-page">
            <div className="page-heading">
                <div>
                    <span className="topbar-eyebrow">
                        SYSTEM
                    </span>

                    <h2>Settings</h2>

                    <p>
                        View your CloudSentinel account and system information.
                    </p>
                </div>

                <div className="live-indicator">
                    <span className="status-dot"></span>
                    Configuration
                </div>
            </div>

            <div className="settings-grid">
                <section className="settings-panel">
                    <div className="settings-panel-header">
                        <div>
                            <span className="settings-label">
                                ACCOUNT
                            </span>

                            <h3>Profile</h3>
                        </div>
                    </div>

                    <div className="settings-list">
                        <div className="settings-row">
                            <span>Username</span>
                            <strong>
                                {user?.username || "Unknown"}
                            </strong>
                        </div>

                        <div className="settings-row">
                            <span>Email</span>
                            <strong>
                                {user?.email || "Unknown"}
                            </strong>
                        </div>

                        <div className="settings-row">
                            <span>Role</span>
                            <span className="user-role-badge">
                                {user?.role === "SOC_ADMIN"
                                    ? "SOC ADMIN"
                                    : "SOC ANALYST"}
                            </span>
                        </div>

                        <div className="settings-row">
                            <span>Status</span>
                            <span
                                className={`user-status-badge ${
                                    user?.is_active
                                        ? "active"
                                        : "inactive"
                                }`}
                            >
                                {user?.is_active
                                    ? "Active"
                                    : "Inactive"}
                            </span>
                        </div>

                        <div className="settings-row">
                            <span>Created</span>
                            <strong>
                                {formatUserTime(
                                    user?.created_at
                                )}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="settings-panel">
                    <div className="settings-panel-header">
                        <div>
                            <span className="settings-label">
                                SECURITY
                            </span>

                            <h3>Access</h3>
                        </div>
                    </div>

                    <div className="settings-info-card">
                        <span className="settings-info-dot"></span>

                        <div>
                            <strong>Authenticated session</strong>

                            <p>
                                Your CloudSentinel session is protected
                                by signed JWT authentication.
                            </p>
                        </div>
                    </div>

                    <div className="settings-row">
                        <span>Access level</span>

                        <strong>
                            {user?.role === "SOC_ADMIN"
                                ? "Administrative"
                                : "Analyst"}
                        </strong>
                    </div>
                </section>

                <section className="settings-panel settings-panel-wide">
                    <div className="settings-panel-header">
                        <div>
                            <span className="settings-label">
                                SYSTEM
                            </span>

                            <h3>CloudSentinel</h3>
                        </div>
                    </div>

                    <div className="settings-list">
                        <div className="settings-row">
                            <span>Platform version</span>
                            <strong>CloudSentinel v1.0</strong>
                        </div>

                        <div className="settings-row">
                            <span>API endpoint</span>
                            <strong>127.0.0.1:8000</strong>
                        </div>

                        <div className="settings-row">
                            <span>API status</span>

                            <span className="user-status-badge active">
                                Connected
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Settings

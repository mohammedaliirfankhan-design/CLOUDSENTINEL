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

function formatRole(role) {
    if (role === "SOC_ADMIN") {
        return "SOC Admin"
    }

    return "SOC Analyst"
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

    const isAdmin = user?.role === "SOC_ADMIN"
    const isActive = Boolean(user?.is_active)

    return (
        <div className="settings-page">
            <div className="settings-page-heading">
                <div>
                    <span className="topbar-eyebrow">
                        SYSTEM
                    </span>

                    <h2>Settings</h2>

                    <p>
                        Manage your CloudSentinel account,
                        session, and platform information.
                    </p>
                </div>

                <div className="settings-status-pill">
                    <span className="status-dot"></span>
                    Configuration
                </div>
            </div>

            <div className="settings-overview-grid">
                <section className="settings-card settings-account-card">
                    <div className="settings-card-header">
                        <div>
                            <span className="settings-section-eyebrow">
                                ACCOUNT
                            </span>

                            <h3>Profile</h3>

                            <p>
                                Authenticated CloudSentinel account
                                information.
                            </p>
                        </div>

                        <div className="settings-card-indicator blue">
                            ●
                        </div>
                    </div>

                    <div className="settings-profile">
                        <div className="settings-avatar">
                            {(user?.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="settings-profile-identity">
                            <strong>
                                {user?.username || "Unknown"}
                            </strong>

                            <span>
                                {user?.email || "Unknown"}
                            </span>
                        </div>
                    </div>

                    <div className="settings-detail-grid">
                        <div className="settings-detail">
                            <span>ROLE</span>

                            <span
                                className={`user-role-badge ${
                                    isAdmin
                                        ? "soc-admin"
                                        : "soc-analyst"
                                }`}
                            >
                                {formatRole(user?.role)}
                            </span>
                        </div>

                        <div className="settings-detail">
                            <span>STATUS</span>

                            <span
                                className={`user-status-badge ${
                                    isActive
                                        ? "active"
                                        : "inactive"
                                }`}
                            >
                                {isActive
                                    ? "Active"
                                    : "Inactive"}
                            </span>
                        </div>

                        <div className="settings-detail">
                            <span>CREATED</span>

                            <strong>
                                {formatUserTime(
                                    user?.created_at
                                )}
                            </strong>
                        </div>

                        <div className="settings-detail">
                            <span>ACCESS LEVEL</span>

                            <strong>
                                {isAdmin
                                    ? "Administrative"
                                    : "Analyst"}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="settings-card settings-security-card">
                    <div className="settings-card-header">
                        <div>
                            <span className="settings-section-eyebrow">
                                SECURITY
                            </span>

                            <h3>Authentication</h3>

                            <p>
                                Current session and access
                                security state.
                            </p>
                        </div>

                        <div className="settings-card-indicator green">
                            ●
                        </div>
                    </div>

                    <div className="settings-session-status">
                        <div className="settings-session-icon">
                            ✓
                        </div>

                        <div>
                            <strong>
                                Authenticated session
                            </strong>

                            <p>
                                Your CloudSentinel session is
                                authenticated using signed JWT
                                credentials.
                            </p>
                        </div>
                    </div>

                    <div className="settings-detail-list">
                        <div className="settings-row">
                            <span>Session status</span>

                            <span className="user-status-badge active">
                                Active
                            </span>
                        </div>

                        <div className="settings-row">
                            <span>Access level</span>

                            <strong>
                                {isAdmin
                                    ? "Administrative"
                                    : "Analyst"}
                            </strong>
                        </div>

                        <div className="settings-row">
                            <span>Authentication</span>

                            <strong>
                                JWT
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="settings-card settings-platform-card">
                    <div className="settings-card-header">
                        <div>
                            <span className="settings-section-eyebrow">
                                PLATFORM
                            </span>

                            <h3>CloudSentinel</h3>

                            <p>
                                Current platform and API
                                connectivity information.
                            </p>
                        </div>

                        <div className="settings-card-indicator cyan">
                            ●
                        </div>
                    </div>

                    <div className="settings-platform-grid">
                        <div className="settings-platform-item">
                            <span>PLATFORM VERSION</span>

                            <strong>
                                CloudSentinel v1.0
                            </strong>
                        </div>

                        <div className="settings-platform-item">
                            <span>API ENDPOINT</span>

                            <strong>
                                127.0.0.1:8000
                            </strong>
                        </div>

                        <div className="settings-platform-item">
                            <span>API STATUS</span>

                            <span className="user-status-badge active">
                                Connected
                            </span>
                        </div>

                        <div className="settings-platform-item">
                            <span>ENVIRONMENT</span>

                            <strong>
                                Local
                            </strong>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Settings
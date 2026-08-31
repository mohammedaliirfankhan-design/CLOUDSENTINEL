import cloudSentinelLogo from "../../assets/cloudsentinel-logo.svg"

const icons = {
    dashboard: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    ),

cspm: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
),

    alerts: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </svg>
    ),

    investigations: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
        </svg>
    ),

    events: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 17h3V7H4zM10.5 17h3V4h-3zM17 17h3v-7h-3z" />
        </svg>
    ),

    users: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
            <path d="M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 5" />
        </svg>
    ),

    audit: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3h12v18H6z" />
            <path d="M9 7h6M9 11h6M9 15h4" />
        </svg>
    ),

    settings: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.1A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5H15v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1V14h-.1a1.7 1.7 0 0 0-1.6 1z" />
        </svg>
    ),
}

function Sidebar({ activePage, onNavigate, isOpen }) {
    const navigation = [
        {
            section: "OVERVIEW",
            items: [
                { id: "dashboard", label: "Dashboard", icon: "dashboard" },
                { id: "alerts", label: "Alerts", icon: "alerts" },
                { id: "investigations", label: "Investigations", icon: "investigations" },
 {
        id: "cspm-findings",
        label: "CSPM Findings",
        icon: "cspm",
    },
            ],
        },
        {
            section: "OPERATIONS",
            items: [
                { id: "events", label: "Events", icon: "events" },
                { id: "users", label: "Users", icon: "users" },
                { id: "audit", label: "Audit Logs", icon: "audit" },
            ],
        },
        {
            section: "SYSTEM",
            items: [
                { id: "settings", label: "Settings", icon: "settings" },
            ],
        },
    ]

    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <div className="brand">
                <div className="brand-mark">
                    <img
                        src={cloudSentinelLogo}
                        alt="CloudSentinel"
                    />
                </div>

                <div className="brand-text">
                    <strong>CloudSentinel</strong>
                    <span>SOC PLATFORM</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navigation.map((group) => (
                    <div className="nav-group" key={group.section}>
                        <div className="nav-section-label">
                            {group.section}
                        </div>

                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`nav-item ${
                                    activePage === item.id ? "active" : ""
                                }`}
                                onClick={() => onNavigate(item.id)}
                            >
                                <span className="nav-icon">
                                    {icons[item.icon]}
                                </span>

                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="system-status">
                    <span className="status-dot"></span>

                    <div>
                        <strong>System Online</strong>
                        <span>API connected</span>
                    </div>
                </div>

                <div className="version">
                    CloudSentinel v1.0
                </div>
            </div>
        </aside>
    )
}

export default Sidebar



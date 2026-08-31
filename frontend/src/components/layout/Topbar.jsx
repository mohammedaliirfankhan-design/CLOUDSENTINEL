import { useEffect, useState } from "react"
import useAuth from "../../auth/useAuth"
import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
} from "../../api/cloudsentinel"

function Topbar({ onMenuClick, onNavigate }) {
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    const { logout, user } = useAuth()

    const loadNotifications = async () => {
        try {
            const [notificationData, countData] =
                await Promise.all([
                    getNotifications(),
                    getUnreadNotificationCount(),
                ])

            setNotifications(
                Array.isArray(notificationData)
                    ? notificationData
                    : []
            )

            setUnreadCount(
                Number(countData?.count || 0)
            )
        } catch (error) {
            console.error(
                "Unable to load notifications:",
                error
            )
        }
    }

    useEffect(() => {
        const initialLoad = setTimeout(() => {
            loadNotifications()
        }, 0)

        const interval = setInterval(
            loadNotifications,
            15000
        )

        return () => {
            clearTimeout(initialLoad)
            clearInterval(interval)
        }
    }, [])

    const formatNotificationDetail = (notification) => {
        const severity = String(
            notification.severity || "INFO"
        ).toUpperCase()

        if (!notification.created_at) {
            return `${severity} notification`
        }

        return `${severity} · ${notification.created_at}`
    }

    const handleNotificationClick = async (
        notification
    ) => {
        try {
            if (!notification.is_read) {
                await markNotificationRead(
                    notification.id
                )

                setNotifications((current) =>
                    current.map((item) =>
                        item.id === notification.id
                            ? {
                                  ...item,
                                  is_read: true,
                              }
                            : item
                    )
                )

                setUnreadCount((current) =>
                    Math.max(0, current - 1)
                )
            }
        } catch (error) {
            console.error(
                "Unable to mark notification as read:",
                error
            )
        }

        setNotificationsOpen(false)

        if (notification.alert_id) {
            onNavigate({
                page: "alert-details",
                alertId: notification.alert_id,
            })
        } else {
            onNavigate("alerts")
        }
    }

    const handleNotificationToggle = () => {
        const nextState = !notificationsOpen

        setNotificationsOpen(nextState)

        if (nextState) {
            loadNotifications()
        }
    }

    const handleLogout = () => {
        setUserMenuOpen(false)
        logout()
    }

    return (
        <header className="topbar">
            <button
                type="button"
                className="mobile-menu-button"
                onClick={onMenuClick}
                aria-label="Open navigation"
            >
                ☰
            </button>

            <div className="topbar-title">
                <span className="topbar-eyebrow">
                    SECURITY OPERATIONS
                </span>

                <h1>Overview</h1>
            </div>

            <div className="topbar-actions">
                <div className="api-status">
                    <span className="status-dot"></span>
                    API Online
                </div>

                <div className="notification-wrapper">
                    <button
                        type="button"
                        className={`notification-button ${
                            notificationsOpen ? "active" : ""
                        }`}
                        aria-label="Notifications"
                        aria-expanded={notificationsOpen}
                        onClick={handleNotificationToggle}
                    >
                        <svg
                            className="notification-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path
                                d="M18 8C18 5.79086 16.2091 4 14 4H10C7.79086 4 6 5.79086 6 8V12.5C6 14.1569 5.32843 15.6686 4.24264 16.7574L3 18H21L19.7574 16.7574C18.6716 15.6686 18 14.1569 18 12.5V8Z"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            <path
                                d="M9 21H15"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                            />
                        </svg>

                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                            </span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <div className="notification-panel">
                            <div className="notification-panel-header">
                                <div>
                                    <strong>
                                        Notifications
                                    </strong>

                                    <span>
                                        Recent security activity
                                    </span>
                                </div>

                                <span className="notification-count">
                                    {unreadCount}
                                </span>
                            </div>

                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="notification-item">
                                        <span className="notification-severity medium"></span>

                                        <span className="notification-content">
                                            <strong>
                                                No notifications
                                            </strong>

                                            <span>
                                                You're all caught up.
                                            </span>
                                        </span>
                                    </div>
                                ) : (
                                    notifications
                                        .slice(0, 5)
                                        .map((notification) => (
                                            <button
                                                type="button"
                                                className="notification-item"
                                                key={notification.id}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                            >
                                                <span
                                                    className={`notification-severity ${String(
                                                        notification.severity ||
                                                            "info"
                                                    ).toLowerCase()}`}
                                                ></span>

                                                <span className="notification-content">
                                                    <strong>
                                                        {
                                                            notification.title
                                                        }
                                                    </strong>

                                                    <span>
                                                        {formatNotificationDetail(
                                                            notification
                                                        )}
                                                    </span>
                                                </span>

                                                <span className="notification-arrow">
                                                    →
                                                </span>
                                            </button>
                                        ))
                                )}
                            </div>

                            <button
                                type="button"
                                className="notification-view-all"
                                onClick={() => {
                                    setNotificationsOpen(false)
                                    onNavigate("alerts")
                                }}
                            >
                                View all alerts
                            </button>
                        </div>
                    )}
                </div>

                <div className="user-menu-wrapper">
                    <button
                        type="button"
                        className={`user-menu ${
                            userMenuOpen ? "active" : ""
                        }`}
                        aria-expanded={userMenuOpen}
                        aria-label="Open user menu"
                        onClick={() =>
                            setUserMenuOpen(!userMenuOpen)
                        }
                    >
                        <div className="user-avatar">
                            {String(
                                user?.username || "User"
                            )
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>

                        <div className="user-info">
                            <strong>
                                {user?.username || "User"}
                            </strong>

                            <span>
                                {user?.role === "SOC_ADMIN"
                                    ? "SOC Administrator"
                                    : "SOC Analyst"}
                            </span>
                        </div>

                        <span className="user-chevron">
                            {userMenuOpen ? "⌃" : "⌄"}
                        </span>
                    </button>

                    {userMenuOpen && (
                        <div className="user-dropdown">
                            <div className="user-dropdown-header">
                                <div className="user-dropdown-avatar">
                                    {String(
                                        user?.username || "User"
                                    )
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <strong>
                                        {user?.username || "User"}
                                    </strong>

                                    <span>
                                        {user?.role === "SOC_ADMIN"
                                            ? "SOC Administrator"
                                            : "SOC Analyst"}
                                    </span>
                                </div>
                            </div>

                            <div className="user-dropdown-divider"></div>

                            <button
                                type="button"
                                className="logout-button"
                                onClick={handleLogout}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M9 5H6C5.44772 5 5 5.44772 5 6V18C5 18.5523 5 19 6 19H9"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                    />

                                    <path
                                        d="M13 8L17 12L13 16"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    <path
                                        d="M17 12H9"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                    />
                                </svg>

                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Topbar


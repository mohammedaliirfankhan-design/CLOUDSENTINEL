import { useEffect, useMemo, useState } from "react"
import { getUsers } from "../api/cloudsentinel"

function formatUserTime(timestamp) {
    if (!timestamp) {
        return "Unknown"
    }

    const normalizedTimestamp =
        typeof timestamp === "string" && timestamp.includes(" ")
            ? timestamp.replace(" ", "T") + "Z"
            : timestamp

    const date = new Date(normalizedTimestamp)

    if (Number.isNaN(date.getTime())) {
        return timestamp
    }

    return date.toLocaleString()
}

function formatRole(role) {
    const normalizedRole = String(
        role || "SOC_ANALYST"
    ).toUpperCase()

    if (normalizedRole === "SOC_ADMIN") {
        return "SOC Admin"
    }

    if (normalizedRole === "SOC_ANALYST") {
        return "SOC Analyst"
    }

    return normalizedRole
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
            /(^|\s)\S/g,
            (character) => character.toUpperCase()
        )
}

function UserSummaryCard({
    label,
    value,
    description,
    tone = "blue",
}) {
    return (
        <div className={`user-summary-card ${tone}`}>
            <div className="user-summary-card-top">
                <span>{label}</span>

                <span className="user-summary-indicator"></span>
            </div>

            <strong>{value}</strong>

            <p>{description}</p>
        </div>
    )
}

function Users() {
    const [users, setUsers] = useState([])
    const [search, setSearch] = useState("")
    const [role, setRole] = useState("ALL")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let cancelled = false

        async function fetchUsers() {
            try {
                setLoading(true)

                const data = await getUsers()

                if (!cancelled) {
                    setUsers(
                        Array.isArray(data)
                            ? data
                            : []
                    )

                    setError("")
                }
            } catch (loadError) {
                console.error(
                    "Failed to load users:",
                    loadError
                )

                if (!cancelled) {
                    setError(
                        loadError.message ||
                        "Unable to load users."
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchUsers()

        return () => {
            cancelled = true
        }
    }, [])

    const userMetrics = useMemo(() => {
        const total = users.length

        const active = users.filter(
            (user) => user.is_active
        ).length

        const admins = users.filter(
            (user) =>
                String(user.role).toUpperCase() ===
                "SOC_ADMIN"
        ).length

        const analysts = users.filter(
            (user) =>
                String(user.role).toUpperCase() ===
                "SOC_ANALYST"
        ).length

        return {
            total,
            active,
            admins,
            analysts,
        }
    }, [users])

    const filteredUsers = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase()

        return users.filter((user) => {
            const matchesSearch =
                normalizedSearch === "" ||
                [
                    user.username,
                    user.email,
                    user.role,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch)

            const normalizedRole =
                String(
                    user.role || "SOC_ANALYST"
                ).toUpperCase()

            const matchesRole =
                role === "ALL" ||
                normalizedRole === role

            return matchesSearch && matchesRole
        })
    }, [users, search, role])

    const hasFilters =
        search.trim() !== "" ||
        role !== "ALL"

    function clearFilters() {
        setSearch("")
        setRole("ALL")
    }

    return (
        <div className="users-page">
            <div className="page-heading users-heading">
                <div>
                    <span className="topbar-eyebrow">
                        SECURITY OPERATIONS
                    </span>

                    <h2>Users</h2>

                    <p>
                        Manage CloudSentinel users,
                        roles, and access status.
                    </p>
                </div>

                <div className="live-indicator">
                    <span className="status-dot"></span>
                    User directory
                </div>
            </div>

            <div className="users-summary-grid">
                <UserSummaryCard
                    label="TOTAL USERS"
                    value={userMetrics.total}
                    description="Registered CloudSentinel users"
                    tone="blue"
                />

                <UserSummaryCard
                    label="ACTIVE"
                    value={userMetrics.active}
                    description="Currently active accounts"
                    tone="green"
                />

                <UserSummaryCard
                    label="SOC ADMINS"
                    value={userMetrics.admins}
                    description="Administrative accounts"
                    tone="purple"
                />

                <UserSummaryCard
                    label="SOC ANALYSTS"
                    value={userMetrics.analysts}
                    description="Analyst accounts"
                    tone="cyan"
                />
            </div>

            <section className="users-panel">
                <div className="users-panel-header">
                    <div>
                        <div className="section-kicker">
                            <span className="section-kicker-dot"></span>
                            USER DIRECTORY
                        </div>

                        <h3>Access Management</h3>

                        <p>
                            Review user identities,
                            roles, and account status.
                        </p>
                    </div>

                    <div className="users-panel-count">
                        <span>Showing</span>
                        <strong>
                            {filteredUsers.length}
                        </strong>
                        <span>of</span>
                        <strong>
                            {users.length}
                        </strong>
                    </div>
                </div>

                <div className="users-toolbar">
                    <div className="users-search">
                        <span
                            className="users-search-icon"
                            aria-hidden="true"
                        >
                            ⌕
                        </span>

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search users, emails, roles..."
                            aria-label="Search users"
                        />
                    </div>

                    <select
                        value={role}
                        onChange={(event) =>
                            setRole(
                                event.target.value
                            )
                        }
                        aria-label="Filter by role"
                    >
                        <option value="ALL">
                            All roles
                        </option>

                        <option value="SOC_ADMIN">
                            SOC Admin
                        </option>

                        <option value="SOC_ANALYST">
                            SOC Analyst
                        </option>
                    </select>

                    {hasFilters && (
                        <button
                            type="button"
                            className="users-clear-button"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {error && (
                    <div className="users-state users-error">
                        <strong>
                            Unable to load user directory
                        </strong>

                        <span>{error}</span>
                    </div>
                )}

                {loading && (
                    <div className="users-state">
                        <span className="loading-spinner"></span>

                        <span>
                            Loading user directory...
                        </span>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="users-table-wrapper">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>USER</th>
                                        <th>EMAIL</th>
                                        <th>ROLE</th>
                                        <th>STATUS</th>
                                        <th>CREATED</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="users-empty-cell"
                                            >
                                                <div className="users-empty-state">
                                                    <div className="users-empty-icon">
                                                        —
                                                    </div>

                                                    <strong>
                                                        No users found
                                                    </strong>

                                                    <span>
                                                        Try changing
                                                        your search
                                                        or role filter.
                                                    </span>

                                                    {hasFilters && (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                clearFilters
                                                            }
                                                        >
                                                            Clear filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(
                                            (user) => {
                                                const normalizedRole =
                                                    String(
                                                        user.role ||
                                                            "SOC_ANALYST"
                                                    ).toUpperCase()

                                                return (
                                                    <tr
                                                        key={
                                                            user.id
                                                        }
                                                    >
                                                        <td>
                                                            <div className="user-identity">
                                                                <div className="user-avatar">
                                                                    {String(
                                                                        user.username ||
                                                                            "U"
                                                                    )
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}
                                                                </div>

                                                                <div>
                                                                    <strong>
                                                                        {
                                                                            user.username
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        User account
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <span className="user-email">
                                                                {
                                                                    user.email
                                                                }
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`user-role-badge ${normalizedRole.toLowerCase()}`}
                                                            >
                                                                <span className="user-role-dot"></span>

                                                                {formatRole(
                                                                    normalizedRole
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`user-status-badge ${
                                                                    user.is_active
                                                                        ? "active"
                                                                        : "inactive"
                                                                }`}
                                                            >
                                                                <span className="user-status-dot"></span>

                                                                {user.is_active
                                                                    ? "Active"
                                                                    : "Inactive"}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span className="user-created">
                                                                {formatUserTime(
                                                                    user.created_at
                                                                )}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            }
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="users-panel-footer">
                            <span>
                                User directory synchronized
                                with CloudSentinel access
                                management.
                            </span>

                            <span>
                                {filteredUsers.length} visible
                                {filteredUsers.length === 1
                                    ? " user"
                                    : " users"}
                            </span>
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}

export default Users
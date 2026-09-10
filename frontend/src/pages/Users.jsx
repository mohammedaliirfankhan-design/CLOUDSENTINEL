import { useEffect, useMemo, useState } from "react"
import { getUsers } from "../api/cloudsentinel"

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
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch)

            const matchesRole =
                role === "ALL" ||
                String(user.role).toUpperCase() === role

            return matchesSearch && matchesRole
        })
    }, [users, search, role])

    return (
        <div className="users-page">
            <div className="page-heading">
                <div>
                    <span className="topbar-eyebrow">
                        SECURITY OPERATIONS
                    </span>

                    <h2>Users</h2>

                    <p>
                        Manage CloudSentinel users and access roles.
                    </p>
                </div>

                <div className="live-indicator">
                    <span className="status-dot"></span>
                    User directory
                </div>
            </div>

            <section className="users-panel">
                <div className="users-toolbar">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search users..."
                        aria-label="Search users"
                    />

                    <select
                        value={role}
                        onChange={(event) =>
                            setRole(event.target.value)
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
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="loading-message">
                        Loading users...
                    </div>
                )}

                {!loading && !error && (
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
                                            className="empty-state"
                                        >
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(
                                        (user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <strong>
                                                        {user.username}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {user.email}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`user-role-badge ${String(
                                                            user.role ||
                                                                "SOC_ANALYST"
                                                        ).toLowerCase()}`}
                                                    >
                                                        {String(
                                                            user.role ||
                                                                "SOC_ANALYST"
                                                        ).replace(
                                                            "_",
                                                            " "
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
                                                        {user.is_active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatUserTime(
                                                        user.created_at
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Users

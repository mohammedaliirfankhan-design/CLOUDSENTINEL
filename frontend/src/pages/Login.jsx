import { useState } from "react"
import useAuth from "../auth/useAuth"
import cloudSentinelLogo from "../assets/cloudsentinel-logo.svg"

function Login({ onSignup }) {
    const { login } = useAuth()

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()

        setError("")
        setLoading(true)

        try {
            await login(username, password)
        } catch (err) {
            setError(err.message || "Unable to sign in")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-shell">
                <div className="login-card">
                    <div className="login-brand">
                        <div className="login-brand-mark">
                            <img
                                src={cloudSentinelLogo}
                                alt="CloudSentinel"
                            />
                        </div>

                        <div className="login-brand-copy">
                            <strong>CloudSentinel</strong>
                            <span>SOC PLATFORM</span>
                        </div>
                    </div>

                    <div className="login-heading">
                        <span className="topbar-eyebrow">
                            SECURITY OPERATIONS
                        </span>

                        <h1>Sign in</h1>

                        <p>
                            Access the CloudSentinel security operations
                            platform.
                        </p>
                    </div>

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >
                        <label className="login-field">
                            <span>Username</span>

                            <input
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                placeholder="Enter username"
                                autoComplete="username"
                                required
                            />
                        </label>

                        <label className="login-field">
                            <span>Password</span>

                            <input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Enter password"
                                autoComplete="current-password"
                                required
                            />
                        </label>

                        {error && (
                            <div className="login-error">
                                <span className="login-error-icon">
                                    !
                                </span>

                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            <span>
                                {loading
                                    ? "Signing in..."
                                    : "Sign in"}
                            </span>

                            {!loading && (
                                <span className="login-button-arrow">
                                    →
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="login-switch">
                        <span>
                            First time using CloudSentinel?
                        </span>

                        <button
                            type="button"
                            className="login-signup-button"
                            onClick={onSignup}
                        >
                            Create account
                        </button>
                    </div>

                    <div className="login-divider">
                        <span></span>
                        <small>SECURE SOC ACCESS</small>
                        <span></span>
                    </div>

                    <div className="login-footer">
                        <span>CloudSentinel</span>
                        <span>Security Operations Platform</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
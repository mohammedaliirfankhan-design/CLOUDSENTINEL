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
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-brand-mark">
                        <img
                            src={cloudSentinelLogo}
                            alt="CloudSentinel"
                        />
                    </div>

                    <div>
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

                <form onSubmit={handleSubmit}>
                    <label>
                        Username

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

                    <label>
                        Password

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
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="login-switch">
                    <span>First time using CloudSentinel?</span>

                    <button
                        type="button"
                        className="login-signup-button"
                        onClick={onSignup}
                    >
                        Create account
                    </button>
                </div>

                <div className="login-footer">
                    CloudSentinel secure access
                </div>
            </div>
        </div>
    )
}

export default Login




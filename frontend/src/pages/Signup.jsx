import { useState } from "react"
import { signup } from "../api/cloudsentinel"
import cloudSentinelLogo from "../assets/cloudsentinel-logo.svg"

function Signup({ onBackToLogin }) {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()

        setError("")
        setSuccess("")

        if (password.length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setLoading(true)

        try {
            await signup(username, email, password)

            setSuccess(
                "Account created successfully. You can now sign in."
            )

            setUsername("")
            setEmail("")
            setPassword("")
            setConfirmPassword("")
        } catch (err) {
            setError(err.message || "Unable to create account")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card signup-card">
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

                    <h1>Create account</h1>

                    <p>
                        Register a new CloudSentinel security operations
                        account.
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
                            placeholder="Choose a username"
                            autoComplete="username"
                            minLength={3}
                            required
                        />
                    </label>

                    <label>
                        Email

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter email address"
                            autoComplete="email"
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
                            placeholder="Minimum 8 characters"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                    </label>

                    <label>
                        Confirm password

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            placeholder="Re-enter password"
                            autoComplete="new-password"
                            required
                        />
                    </label>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="login-success">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create account"}
                    </button>
                </form>

                <div className="login-switch">
                    <span>Already have an account?</span>

                    <button
                        type="button"
                        className="login-signup-button"
                        onClick={onBackToLogin}
                    >
                        Sign in
                    </button>
                </div>

                <div className="login-footer">
                    CloudSentinel secure access
                </div>
            </div>
        </div>
    )
}

export default Signup




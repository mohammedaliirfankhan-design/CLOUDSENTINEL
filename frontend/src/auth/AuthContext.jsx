import { useEffect, useMemo, useState } from "react"
import {
    clearToken,
    getCurrentUser,
    getToken,
    login as apiLogin,
    setToken,
} from "../api/cloudsentinel"
import { AuthContext } from "./authContextValue"

function AuthProvider({ children }) {
    const [token, setAuthToken] = useState(getToken())
    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(Boolean(getToken()))

    useEffect(() => {
        let cancelled = false

        async function loadUser() {
            if (!token) {
                setUser(null)
                setLoadingUser(false)
                return
            }

            setLoadingUser(true)

            try {
                const currentUser = await getCurrentUser()

                if (!cancelled) {
                    setUser(currentUser)
                }
            } catch (error) {
                console.error(
                    "Failed to load current user:",
                    error
                )

                if (!cancelled) {
                    clearToken()
                    setAuthToken(null)
                    setUser(null)
                }
            } finally {
                if (!cancelled) {
                    setLoadingUser(false)
                }
            }
        }

        loadUser()

        return () => {
            cancelled = true
        }
    }, [token])

    const login = async (username, password) => {
        const data = await apiLogin(username, password)

        setToken(data.access_token)
        setAuthToken(data.access_token)

        return data
    }

    const logout = () => {
        clearToken()
        setAuthToken(null)
        setUser(null)
    }

    const value = useMemo(
        () => ({
            token,
            user,
            loadingUser,
            isAuthenticated: Boolean(token),
            login,
            logout,
        }),
        [token, user, loadingUser]
    )

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider

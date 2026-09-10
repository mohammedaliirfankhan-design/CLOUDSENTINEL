const API_BASE_URL = "http://127.0.0.1:8000"

export function getToken() {
    return localStorage.getItem("cloudsentinel_token")
}

export function setToken(token) {
    localStorage.setItem("cloudsentinel_token", token)
}

export function clearToken() {
    localStorage.removeItem("cloudsentinel_token")
}

export function getInvestigations() {
    return apiRequest("/investigations")
}

export function getAlerts() {
    return apiRequest("/alerts")
}

export function getEvents() {
    return apiRequest("/events")
}

export function getUsers() {
    return apiRequest("/admin/users")
}

export function getAuditLogs() {
    return apiRequest("/admin/audit-logs")
}

export function getMetrics() {
    return apiRequest("/metrics")
}

export function getCurrentUser() {
    return apiRequest("/auth/me")
}

export function getNotifications(unreadOnly = false) {
    const query = unreadOnly ? "?unread_only=true" : ""
    return apiRequest(`/notifications${query}`)
}

export function getUnreadNotificationCount() {
    return apiRequest("/notifications/unread-count")
}

export function markNotificationRead(notificationId) {
    return apiRequest(`/notifications/${notificationId}/read`, {
        method: "POST",
    })
}

export function markAllNotificationsRead() {
    return apiRequest("/notifications/read-all", {
        method: "POST",
    })
}

/*
 * ---------------------------------------------------------
 * CSPM / AWS POSTURE
 * ---------------------------------------------------------
 */

/**
 * Retrieve the latest AWS security posture findings.
 */
export function getFindings() {
    return apiRequest("/findings")
}

export function getFindingMetrics() {
    return apiRequest("/findings/metrics")
}

export function getFinding(findingId) {
    return apiRequest(`/findings/${findingId}`)
}

/**
 * Run a fresh AWS CSPM scan.
 */
export function runCspmScan() {
    return apiRequest("/findings/scan", {
        method: "POST",
    })
}

export function updateFindingStatus(findingId, status) {
    return apiRequest(`/findings/${findingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
            status,
        }),
    })
}

/*
 * ---------------------------------------------------------
 * AUTHENTICATION
 * ---------------------------------------------------------
 */

export function login(username, password) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            username,
            password,
        }),
    })
}

export function signup(username, email, password) {
    return apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
            username,
            email,
            password,
        }),
    })
}

/*
 * ---------------------------------------------------------
 * INVESTIGATIONS
 * ---------------------------------------------------------
 */

export function getInvestigation(alertId) {
    return apiRequest(`/investigations/${alertId}`)
}

export function getInvestigationHistory(alertId) {
    return apiRequest(`/investigations/${alertId}/history`)
}

export function saveInvestigation({
    alertId,
    status,
    analystNotes,
    assignedAnalyst,
}) {
    return apiRequest("/investigations", {
        method: "POST",
        body: JSON.stringify({
            alert_id: alertId,
            status,
            analyst_notes: analystNotes,
            assigned_analyst: assignedAnalyst,
        }),
    })
}

/*
 * ---------------------------------------------------------
 * GENERIC API REQUEST
 * ---------------------------------------------------------
 */

async function apiRequest(path, options = {}) {
    const token = getToken()

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",

            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),

            ...(options.headers || {}),
        },
    })

    const text = await response.text()

    let data = null

    if (text) {
        try {
            data = JSON.parse(text)
        } catch {
            data = text
        }
    }

    if (!response.ok) {
        throw new Error(
            data?.detail ||
                data?.error ||
                `CloudSentinel API error (${response.status})`
        )
    }

    return data
}
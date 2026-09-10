import { useState } from "react"
import AppShell from "./components/layout/AppShell"
import Dashboard from "./pages/Dashboard"
import Findings from "./pages/Findings"
import Alerts from "./pages/Alerts"
import InvestigationDetails from "./pages/InvestigationDetails"
import Investigations from "./pages/Investigations"
import AlertDetails from "./pages/AlertDetails"
import CspmFindingDetails from "./pages/CspmFindingDetails"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AuthProvider from "./auth/AuthContext"
import useAuth from "./auth/useAuth"
import "./App.css"
import Events from "./pages/Events"
import Users from "./pages/Users"
import AuditLogs from "./pages/AuditLogs"
import Settings from "./pages/Settings"
import {
    getAlerts,
    getFinding,
} from "./api/cloudsentinel"


function CloudSentinelApp() {
    const { isAuthenticated, logout } = useAuth()

    const [showSignup, setShowSignup] = useState(false)

    const [activePage, setActivePage] =
        useState("dashboard")

    const [selectedInvestigation, setSelectedInvestigation] =
        useState(null)

    const [selectedAlert, setSelectedAlert] =
        useState(null)

    const [selectedFinding, setSelectedFinding] =
        useState(null)


    if (!isAuthenticated) {
        if (showSignup) {
            return (
                <Signup
                    onBackToLogin={() =>
                        setShowSignup(false)
                    }
                />
            )
        }

        return (
            <Login
                onSignup={() =>
                    setShowSignup(true)
                }
            />
        )
    }


    const handleNavigate = async (navigation) => {

        if (
            typeof navigation === "object" &&
            navigation?.page === "alert-details" &&
            navigation?.alertId
        ) {

            try {

                const alerts = await getAlerts()

                const backendAlert = alerts.find(
                    (item) =>
                        Number(item.id) ===
                        Number(navigation.alertId)
                )

                if (!backendAlert) {
                    setActivePage("alerts")
                    return
                }

                setSelectedAlert({
                    id: backendAlert.event_id,

                    alertId: backendAlert.id,

                    title: backendAlert.rule,

                    severity:
                        backendAlert.severity
                            .charAt(0) +
                        backendAlert.severity
                            .slice(1)
                            .toLowerCase(),

                    status:
                        backendAlert.investigation_status,

                    source:
                        backendAlert.source_ip ||
                        "Unknown",

                    user:
                        backendAlert.user ||
                        "Unknown",

                    detail:
                        backendAlert.action ||
                        backendAlert.resource ||
                        "Security event detected",
                })

                setActivePage("alert-details")

                return

            } catch (error) {

                console.error(
                    "Unable to open notification alert:",
                    error
                )

                setActivePage("alerts")

                return
            }
        }


        if (
            typeof navigation === "object" &&
            navigation?.page ===
                "cspm-finding-details" &&
            navigation?.findingId
        ) {

            try {

                const finding =
                    await getFinding(
                        navigation.findingId
                    )

                if (!finding) {
                    setActivePage("dashboard")
                    return
                }

                setSelectedFinding(finding)

                setActivePage(
                    "cspm-finding-details"
                )

                return

            } catch (error) {

                console.error(
                    "Unable to open CSPM finding:",
                    error
                )

                setActivePage("dashboard")

                return
            }
        }


        setActivePage(navigation)
    }


    const handleAlertSelect = (alert) => {

        setSelectedAlert(alert)

        setActivePage("alert-details")
    }


    const handleInvestigateAlert = (alert) => {

        setSelectedInvestigation({

            alertId: alert.alertId,

            alert: alert.id,

            title: alert.title,

            severity: alert.severity,

            priority: alert.severity,

            analyst: "Unassigned",

            source: alert.source,

            status: alert.status,

        })

        setSelectedAlert(null)

        setActivePage(
            "investigation-details"
        )
    }


    const handleInvestigationSelect =
        (investigation) => {

            setSelectedInvestigation(
                investigation
            )

            setActivePage(
                "investigation-details"
            )
        }


    const handleBackToAlerts = () => {

        setActivePage("alerts")
    }


    const handleBackToDashboard = () => {

        setSelectedFinding(null)

        setActivePage("dashboard")
    }


    const renderPage = () => {

        switch (activePage) {

            case "dashboard":

                return (
                    <Dashboard
                        onNavigate={
                            handleNavigate
                        }
                    />
                )

case "cspm-findings":

    return (
        <Findings
            onNavigate={
                handleNavigate
            }
        />
    )


            case "alerts":

                return (
                    <Alerts
                        onAlertSelect={
                            handleAlertSelect
                        }
                    />
                )


            case "investigations":

                return (
                    <Investigations
                        onInvestigationSelect={
                            handleInvestigationSelect
                        }
                    />
                )


            case "events":

                return (
                    <Events
                        onEventSelect={
                            handleInvestigationSelect
                        }
                    />
                )


            case "users":

                return <Users />


            case "settings":

                return <Settings />


            case "audit":

                return <AuditLogs />


            case "alert-details":

                return (
                    <AlertDetails
                        alert={selectedAlert}
                        onBack={
                            handleBackToAlerts
                        }
                        onInvestigate={
                            handleInvestigateAlert
                        }
                    />
                )


            case "investigation-details":

                return (
                    <InvestigationDetails
                        investigation={
                            selectedInvestigation
                        }
                        onBack={() => {
                            setSelectedInvestigation(
                                null
                            )

                            setActivePage(
                                "investigations"
                            )
                        }}
                    />
                )


            case "cspm-finding-details":

                return (
                    <CspmFindingDetails
                        finding={
                            selectedFinding
                        }
                        onBack={
                            handleBackToDashboard
                        }
                    />
                )


            default:

                return (
                    <div className="coming-soon">

                        <span>
                            UNDER CONSTRUCTION
                        </span>

                        <h2>
                            {activePage}
                        </h2>

                        <p>
                            This CloudSentinel module
                            will be migrated next.
                        </p>

                    </div>
                )
        }
    }


    return (
        <AppShell

            activePage={
                activePage ===
                "alert-details"
                    ? "alerts"
                    : activePage ===
                      "cspm-finding-details"
                    ? "dashboard"
                    : activePage
            }

            onNavigate={
                handleNavigate
            }

            onLogout={logout}

        >

            {renderPage()}

        </AppShell>
    )
}


function App() {

    return (
        <AuthProvider>

            <CloudSentinelApp />

        </AuthProvider>
    )
}


export default App
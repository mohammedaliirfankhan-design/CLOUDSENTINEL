import { useState } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

function AppShell({ children, activePage, onNavigate }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleNavigate = (page) => {
        onNavigate(page)
        setSidebarOpen(false)
    }

    return (
        <div className="app-shell">
            <Sidebar
                activePage={activePage}
                onNavigate={handleNavigate}
                isOpen={sidebarOpen}
            />

            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="app-main">
                <Topbar
                    onMenuClick={() => setSidebarOpen(true)}
                    onNavigate={handleNavigate}
                />

                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default AppShell

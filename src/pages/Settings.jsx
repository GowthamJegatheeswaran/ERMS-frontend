import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useState } from "react"
import ChangePasswordModal from "../components/ChangePasswordModal"
import { FaUserCog, FaLock } from "react-icons/fa"

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const role = (localStorage.getItem("role") || "student").toLowerCase()

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 className="page-title">Settings</h2>

          <div className="settings-card">
            <div className="settings-card-header">
              <FaUserCog size={24} />
              <h3>Profile & Account</h3>
            </div>
            <p>
              Current role: <b>{role}</b>
            </p>
            <button
              className="btn-reset"
              type="button"
              onClick={() => setShowReset(true)}
            >
              <FaLock size={16} style={{ marginRight: 6 }} />
              Reset Password
            </button>
          </div>
        </div>
      </div>

      {showReset && <ChangePasswordModal onClose={() => setShowReset(false)} />}
    </div>
  )
}
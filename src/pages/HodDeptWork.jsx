import "../styles/hodDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { HodPurchaseAPI } from "../api/api"
import { FaBox, FaClipboardList, FaListAlt, FaSearch } from "react-icons/fa" // professional icons

export default function HodDeptWork() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const list = await HodPurchaseAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch {
      // ignore errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          {/* Welcome Header */}
          <h2 className="welcome-header">Welcome, NAME!</h2>

          {/* Quick Actions */}
          <h3 className="section-title">Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => navigate("/hod-inventory")}>
              <FaBox className="icon" /> Inventory
            </button>
            <button className="action-btn" onClick={() => navigate("/hod-report")}>
              <FaClipboardList className="icon" /> Report
            </button>
            <button className="action-btn" onClick={() => navigate("/hod-dept-purchase")}>
              <FaListAlt className="icon" /> Department Equipment Request
            </button>
            <button className="action-btn" onClick={() => navigate("/hod-inspect")}>
              <FaSearch className="icon" /> Inspect Requests
            </button>
          </div>

          {/* Recent Department Requests */}
          <div className="requests-header">
            <h3>Recent Department Requests</h3>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .sort((a, b) => (b.id || 0) - (a.id || 0))
                .slice(0, 6)
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.requestedByName || "-"}</td>
                    <td>
                      <span className={`status ${String(p.status || "").toLowerCase()}`}>
                        {p.status || "-"}
                      </span>
                    </td>
                    <td>{p.createdDate || "-"}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => navigate("/hod-dept-purchase")}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
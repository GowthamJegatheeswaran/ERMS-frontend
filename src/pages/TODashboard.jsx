import "../styles/toDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ToRequestAPI, AuthAPI } from "../api/api" // AuthAPI to fetch TO user info

export default function TODashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState(null) // TO user info

  // Load requests
  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await ToRequestAPI.all()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load TO requests")
    } finally {
      setLoading(false)
    }
  }

  // Fetch requests and TO info on mount
  useEffect(() => {
    load()
    const fetchUser = async () => {
      try {
        const me = await AuthAPI.me()
        setUser(me)
      } catch (err) {
        console.error("Failed to fetch user", err)
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const assigned = useMemo(() => {
    const active = new Set([
      "APPROVED_BY_LECTURER",
      "TO_PROCESSING",
      "ISSUED_PENDING_STUDENT_ACCEPT",
      "ISSUED_CONFIRMED",
      "RETURNED_PENDING_TO_VERIFY",
    ])
    return [...rows]
      .filter((r) => active.has(String(r.status)))
      .sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
      .slice(0, 6)
  }, [rows])

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-"

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          {/* Welcome header with TO name */}
          <h2 className="welcome">Welcome, {user?.fullName || "Lab Technical Officer"}!</h2>

          {error && <div className="error-message" style={{ color: "red", marginTop: 10 }}>{error}</div>}

          <h3>Quick Actions</h3>
          <div className="actions">
            <button onClick={() => navigate("/to-approval-requests")}>Approval requests</button>
            <button onClick={() => navigate("/to-history")}>History</button>
            <button onClick={() => navigate("/to-purchase-new")}>New Purchase</button>
          </div>

          <h3>Assigned Request List</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requester</th>
                <th>Lab</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Due_Date</th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((r) => (
                <tr key={r.requestId}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{requesterText(r)}</td>
                  <td>{r.labName || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r.status || "").toLowerCase()}`}>
                      {r.status || "-"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{r.toDate || "-"}</td>
                </tr>
              ))}

              {assigned.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No assigned requests
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
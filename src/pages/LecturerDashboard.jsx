import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import SummaryCard from "../components/SummaryCard"
import { LecturerRequestAPI } from "../api/api"
import "../styles/lecturerDashboard.css"

export default function LecturerDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [queue, setQueue] = useState([])
  const [myRows, setMyRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lecturerName, setLecturerName] = useState("Lecturer")

  // Load dashboard data
  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const [q, my] = await Promise.all([LecturerRequestAPI.queue(), LecturerRequestAPI.my()])
      setQueue(Array.isArray(q) ? q : [])
      setMyRows(Array.isArray(my) ? my : [])
      // Set lecturer name from API if available
      if (my?.[0]?.lecturerName) setLecturerName(my[0].lecturerName)
    } catch (e) {
      setError(e?.message || "Failed to load lecturer dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const pending = queue.length
    const totalMine = myRows.length
    return { pending, totalMine }
  }, [queue, myRows])

  const recentMine = useMemo(() => {
    return [...myRows].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 3)
  }, [myRows])

  const itemsPreview = (r) => {
    const items = Array.isArray(r?.items) ? r.items : []
    if (items.length === 0) return { text: "-", qty: "-" }
    if (items.length === 1) return { text: items[0].equipmentName || "-", qty: items[0].quantity ?? "-" }
    const first = items[0]
    return { text: `${first.equipmentName || "-"} +${items.length - 1} more`, qty: first.quantity ?? "-" }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          {/* Welcome Heading */}
          <h2 className="welcome">Welcome, {lecturerName}</h2>

          {error && <div className="error-message" style={{ color: "red", marginTop: 10 }}>{error}</div>}

          {/* Quick Summary */}
          <h3>Quick Summary</h3>
          <div className="summary-grid">
            <SummaryCard title="Pending Applications" value={counts.pending} />
            <SummaryCard title="My Total Requests" value={counts.totalMine} />
          </div>

          {/* Quick Actions */}
          <h3>Quick Actions</h3>
          <div className="actions">
            <button onClick={() => navigate("/lecturer-new-request")}>New Requests</button>
            <button onClick={() => navigate("/lecturer-applications")}>Applications</button>
          </div>

          {/* Recent Requests */}
          <h3>My Recent Requests</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Quantity</th>
                <th>From</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentMine.map((r) => {
                const p = itemsPreview(r)
                return (
                  <tr key={r.requestId}>
                    <td>{p.text}</td>
                    <td style={{ textAlign: "center" }}>{p.qty}</td>
                    <td style={{ textAlign: "center" }}>{r.fromDate || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
                    </td>
                  </tr>
                )
              })}
              {recentMine.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No requests yet
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
import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import SummaryCard from "../components/SummaryCard"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LecturerRequestAPI, AuthAPI } from "../api/api"
import { AiOutlinePlus, AiOutlineFileText, AiOutlineClockCircle, AiOutlineCheckCircle } from "react-icons/ai"

export default function LecturerDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [queue, setQueue] = useState([])
  const [myRows, setMyRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState(null)

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const [q, my] = await Promise.all([LecturerRequestAPI.queue(), LecturerRequestAPI.my()])
      setQueue(Array.isArray(q) ? q : [])
      setMyRows(Array.isArray(my) ? my : [])
    } catch (e) {
      setError(e?.message || "Failed to load lecturer dashboard")
    } finally {
      setLoading(false)
    }
  }

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
          {/* Welcome */}
          <h2 className="welcome">Welcome, {user?.fullName || "Dr. Lecturer"}!</h2>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          {/* Summary Cards */}
          <div className="summary-grid">
            <SummaryCard 
              title="Pending Applications" 
              value={counts.pending} 
              icon={<AiOutlineClockCircle size={28} />} 
              color="#fbbf24" 
            />
            <SummaryCard 
              title="My Total Requests" 
              value={counts.totalMine} 
              icon={<AiOutlineFileText size={28} />} 
              color="#2563eb" 
            />
          </div>

          {/* Quick Actions Horizontal */}
          <div className="actions" style={{ flexDirection: "row" }}>
            <button onClick={() => navigate("/lecturer-new-request")}>
              <AiOutlinePlus size={18} /> New Request
            </button>
            <button onClick={() => navigate("/lecturer-applications")}>
              <AiOutlineFileText size={18} /> Applications
            </button>
          </div>

          {/* Recent Requests Table */}
          <h3 style={{ marginTop: 24 }}>My Recent Requests</h3>
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
                      <span className={`status ${String(r.status || "").toLowerCase()}`}>
                        {r.status || "-"}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {recentMine.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>No requests yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
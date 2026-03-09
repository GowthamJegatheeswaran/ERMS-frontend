import { AiOutlineFileText, AiOutlineClockCircle, AiOutlinePlus } from "react-icons/ai"
import "../styles/toDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ToRequestAPI, AuthAPI } from "../api/api"

export default function TODashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState(null)

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

  // Fetch user info on mount
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
  }, [])

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-"

  // Flatten requests by equipment item
  const assigned = useMemo(() => {
    const activeStatuses = new Set([
      "APPROVED_BY_LECTURER",
      "TO_PROCESSING",
      "ISSUED_PENDING_STUDENT_ACCEPT",
      "ISSUED_CONFIRMED",
      "RETURNED_PENDING_TO_VERIFY",
    ])
    const out = []
    for (const r of rows || []) {
      if (!activeStatuses.has(String(r.status))) continue
      const items = Array.isArray(r.items) ? r.items : []
      for (const it of items) {
        out.push({ ...r, _item: it })
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 className="welcome">Welcome, {user?.fullName || "Lab Technical Officer"}!</h2>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <div className="dashboard-quick-actions">
            <button onClick={() => navigate("/to-approval-requests")}>
              <AiOutlineFileText size={18} /> Approval requests
            </button>
            <button onClick={() => navigate("/to-history")}>
              <AiOutlineClockCircle size={18} /> History
            </button>
            <button onClick={() => navigate("/to-purchase-new")}>
              <AiOutlinePlus size={18} /> New Purchase
            </button>
          </div>

          <h3>Assigned Request List</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requester</th>
                <th>Lab</th>
                <th>Item</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((r) => {
                const it = r._item
                return (
                  <tr key={`${r.requestId}-${it.requestItemId}`}>
                    <td>{r.requestId}</td>
                    <td>{requesterText(r)}</td>
                    <td>{r.labName || "-"}</td>
                    <td>{it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity}</td>
                    <td>{r.fromDate || "-"}</td>
                    <td>{r.toDate || "-"}</td>
                    <td>
                      <span className={`status ${String(it.itemStatus || "").toLowerCase()}`}>
                        {it.itemStatus || "-"}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {assigned.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
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
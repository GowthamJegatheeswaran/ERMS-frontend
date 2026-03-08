import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import SummaryCard from "../components/SummaryCard"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { StudentRequestAPI } from "../api/api"
import { 
  AiOutlineClockCircle,   // Pending
  AiOutlineCheckCircle,   // Approved
  AiOutlineCloseCircle,   // Rejected
  AiOutlineFileText       // Total Requests
} from "react-icons/ai"

import { AiOutlineEye, AiOutlinePlus } from "react-icons/ai"

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await StudentRequestAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load my requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const pending = rows.filter((r) => String(r.status) === "PENDING_LECTURER_APPROVAL").length
    const rejected = rows.filter((r) => String(r.status) === "REJECTED_BY_LECTURER").length
    const approved = rows.length - pending - rejected
    return { pending, approved, rejected, total: rows.length }
  }, [rows])

  const recent = useMemo(() => {
    return [...rows].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 3)
  }, [rows])

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
          <h2 className="welcome">Student Dashboard</h2>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Quick Summary Card</h3>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="summary-grid" style={{ marginTop: 12 }}>
  <div className="summary-card pending">
    <div className="card-icon"><AiOutlineClockCircle size={28} /></div>
    <div className="card-info">
      <h4>Pending</h4>
      <p>{counts.pending}</p>
    </div>
  </div>
  <div className="summary-card approved">
    <div className="card-icon"><AiOutlineCheckCircle size={28} /></div>
    <div className="card-info">
      <h4>Approved</h4>
      <p>{counts.approved}</p>
    </div>
  </div>
  <div className="summary-card rejected">
    <div className="card-icon"><AiOutlineCloseCircle size={28} /></div>
    <div className="card-info">
      <h4>Rejected</h4>
      <p>{counts.rejected}</p>
    </div>
  </div>
  <div className="summary-card total">
    <div className="card-icon"><AiOutlineFileText size={28} /></div>
    <div className="card-info">
      <h4>Total Requests</h4>
      <p>{counts.total}</p>
    </div>
  </div>
</div>

          <h3>Quick Actions</h3>
          

<div className="actions">
  <button onClick={() => navigate("/view-requests")}>
    <AiOutlineEye style={{ marginRight: 6 }} /> View Requests
  </button>
  <button onClick={() => navigate("/new-request")}>
    <AiOutlinePlus style={{ marginRight: 6 }} /> New Requests
  </button>
</div>

          <h3>Recent Requests</h3>
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
    {recent.map((r) => {
      const p = itemsPreview(r)
      const statusClass = String(r.status || "").toLowerCase()
      return (
        <tr key={r.requestId}>
          <td>{p.text}</td>
          <td style={{ textAlign: "center" }}>{p.qty}</td>
          <td style={{ textAlign: "center" }}>{r.fromDate || "-"}</td>
          <td style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {statusClass === "pending_lecturer_approval" && <AiOutlineClockCircle color="#fbbf24" />}
            {statusClass === "approved" && <AiOutlineCheckCircle color="#16a34a" />}
            {statusClass === "rejected_by_lecturer" && <AiOutlineCloseCircle color="#dc2626" />}
            <span>{r.status || "-"}</span>
          </td>
        </tr>
      )
    })}
    {recent.length === 0 && !loading && (
      <tr>
        <td colSpan="4" style={{ textAlign: "center" }}>No requests submitted yet</td>
      </tr>
    )}
  </tbody>
</table>
        </div>

      </div>
    </div>
  )
}
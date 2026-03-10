import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import SummaryCard from "../components/SummaryCard"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { StudentRequestAPI } from "../api/api"

// Instructor/Staff uses the SAME request workflow as Student.
export default function InstructorDashboard() {
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
      setError(e?.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const hasItemStatus = (r, status) => {
      const items = Array.isArray(r?.items) ? r.items : []
      return items.some((it) => String(it?.itemStatus || "") === status)
    }

    const pending = rows.filter((r) => hasItemStatus(r, "PENDING_LECTURER_APPROVAL") || String(r.status) === "PENDING_LECTURER_APPROVAL").length
    const rejected = rows.filter((r) => hasItemStatus(r, "REJECTED_BY_LECTURER") || String(r.status) === "REJECTED_BY_LECTURER").length
    const approved = rows.filter((r) => !hasItemStatus(r, "PENDING_LECTURER_APPROVAL") && !hasItemStatus(r, "REJECTED_BY_LECTURER") && String(r.status) !== "PENDING_LECTURER_APPROVAL" && String(r.status) !== "REJECTED_BY_LECTURER").length

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
          <h2 className="welcome">Instructor Dashboard</h2>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ margin: 0 }}>Quick Summary Card</h3>
  <button
    type="button"
    onClick={load}
    disabled={loading}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "4px 10px",
      fontSize: "12px",
      backgroundColor: "#2f64d6",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer"
    }}
  >
    🔄 {loading ? "Loading..." : "Refresh"}
  </button>

</div>

          {error && (
            <div className="error-message" style={{ color: "red", marginTop: 10 }}>
              {error}
            </div>
          )}

          <div className="summary-grid" style={{ marginTop: 12 }}>
            <SummaryCard title="Pending" value={counts.pending} />
            <SummaryCard title="Approved" value={counts.approved} />
            <SummaryCard title="Rejected" value={counts.rejected} />
            <SummaryCard title="Total Requests" value={counts.total} />
          </div>

          <h3>Quick Actions</h3>
          <div className="actions">
            <button onClick={() => navigate("/instructor-view-requests")}>View Requests</button>
            <button onClick={() => navigate("/instructor-new-request")}>New Requests</button>
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

              {recent.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No requests submitted yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />© Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

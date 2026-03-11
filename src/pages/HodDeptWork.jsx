import "../styles/dashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
// BUG FIX: was calling HodPurchaseAPI.my() — correct is HodDepartmentAPI.requests()
import { HodDepartmentAPI, AuthAPI } from "../api/api"

const STATUS_OPTIONS = ["All", "PENDING_LECTURER_APPROVAL", "APPROVED_BY_LECTURER", "REJECTED_BY_LECTURER", "TO_PROCESSING", "ISSUED_PENDING_STUDENT_ACCEPT", "ISSUED_CONFIRMED", "RETURNED_PENDING_TO_VERIFY", "RETURNED_VERIFIED", "DAMAGED_REPORTED"]

export default function HodDeptWork() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [user, setUser] = useState(null)

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      // BUG FIX: correct API call
      const [list, me] = await Promise.all([HodDepartmentAPI.requests(), AuthAPI.me()])
      setRows(Array.isArray(list) ? list : [])
      setUser(me)
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter(r => statusFilter === "All" || r.status === statusFilter)
      .filter(r => {
        if (!q) return true
        return `${r.requesterFullName || ""} ${r.labName || ""} ${r.purpose || ""}`.toLowerCase().includes(q)
      })
      .sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows, query, statusFilter])

  const counts = useMemo(() => ({
    pending: rows.filter(r => r.status === "PENDING_LECTURER_APPROVAL").length,
    active: rows.filter(r => ["TO_PROCESSING", "ISSUED_PENDING_STUDENT_ACCEPT", "ISSUED_CONFIRMED"].includes(r.status)).length,
    total: rows.length,
  }), [rows])

  const itemsPreview = (r) => {
    const items = Array.isArray(r?.items) ? r.items : []
    if (!items.length) return "–"
    if (items.length === 1) return items[0].equipmentName || "–"
    return `${items[0].equipmentName || "–"} +${items.length - 1} more`
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <h2 className="welcome">Department Work</h2>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
            All requests in department: <strong>{user?.department || "–"}</strong>
          </div>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Summary counts */}
          <div className="summary-grid" style={{ marginBottom: 20 }}>
            <div className="summary-card pending">
              <div className="card-icon">⏳</div>
              <div className="card-info"><h4>Pending Approval</h4><p>{counts.pending}</p></div>
            </div>
            <div className="summary-card approved">
              <div className="card-icon">✅</div>
              <div className="card-info"><h4>Active</h4><p>{counts.active}</p></div>
            </div>
            <div className="summary-card total">
              <div className="card-icon">📋</div>
              <div className="card-info"><h4>Total</h4><p>{counts.total}</p></div>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search requester, lab, purpose…"
              className="form-input"
              style={{ flex: 1, minWidth: 200 }}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select" style={{ width: 260 }}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === "All" ? "All Statuses" : s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {loading && <div className="loading-state">Loading…</div>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">No requests found</div>
          )}

          {filtered.map(r => (
            <div key={r.requestId} className="history-card">
              <div className="history-grid">
                <div>
                  <div className="history-label">Request ID</div>
                  <div className="history-value">#{r.requestId}</div>
                  <div className="history-label" style={{ marginTop: 8 }}>Requester</div>
                  <div className="history-value">{r.requesterFullName || "–"} {r.requesterRegNo ? `(${r.requesterRegNo})` : ""}</div>
                  <div className="history-label" style={{ marginTop: 8 }}>Role</div>
                  <div className="history-value">{r.requesterRole || "–"}</div>
                </div>
                <div>
                  <div className="history-label">Equipment</div>
                  <div className="history-value">{itemsPreview(r)}</div>
                  <div className="history-label" style={{ marginTop: 8 }}>Lab</div>
                  <div className="history-value">{r.labName || "–"}</div>
                  <div className="history-label" style={{ marginTop: 8 }}>Status</div>
                  <span className={`status-pill ${(r.status || "").toLowerCase()}`}>
                    {r.status?.replace(/_/g, " ") || "–"}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                {r.fromDate || "–"} → {r.toDate || "–"} &nbsp;·&nbsp; Lecturer: {r.lecturerFullName || "–"}
              </div>
            </div>
          ))}

        </div>
        <footer className="dashboard-footer">
          Faculty of Engineering · University of Jaffna &nbsp;|&nbsp; © 2026 ERMS
        </footer>
      </div>
    </div>
  )
}
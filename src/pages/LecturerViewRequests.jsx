import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import "../styles/dashboard.css"
import { LecturerRequestAPI, StudentRequestAPI } from "../api/api"

// BUG FIX: All status strings now match actual backend enum values
const STATUS_OPTIONS = [
  "All",
  "PENDING_LECTURER_APPROVAL",
  "APPROVED_BY_LECTURER",
  "REJECTED_BY_LECTURER",
  "WAITING_TO_ISSUE",
  "ISSUED_PENDING_REQUESTER_ACCEPT",
  "ISSUED_CONFIRMED",
  "RETURN_REQUESTED",
  "RETURN_VERIFIED",
  "DAMAGED_REPORTED",
]

function itemText(it) {
  if (!it) return "–"
  return `${it.equipmentName || `Equipment #${it.equipmentId}`}: ${it.quantity}`
}

export default function LecturerViewRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await LecturerRequestAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const flat = []
    for (const r of rows) {
      for (const it of (Array.isArray(r?.items) ? r.items : [])) {
        flat.push({ ...r, _item: it, _itemStatus: String(it?.itemStatus || "") })
      }
    }
    return flat
      .filter(r => statusFilter === "All" || r._itemStatus === statusFilter)
      .filter(r => {
        if (!q) return true
        return `${r.labName || ""} ${r.purpose || ""} ${itemText(r._item)}`.toLowerCase().includes(q)
      })
      .sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows, query, statusFilter])

  const handleAcceptIssue = async (requestItemId) => {
    try {
      await StudentRequestAPI.acceptIssueItem(requestItemId)
      await load()
    } catch (e) { setError(e?.message || "Failed") }
  }

  const handleReturn = async (requestItemId) => {
    try {
      await StudentRequestAPI.submitReturnItem(requestItemId)
      await load()
    } catch (e) { setError(e?.message || "Failed") }
  }

  const renderAction = (r) => {
    const it = r._item
    const st = r._itemStatus
    const isReturnable = String(it?.itemType || "") === "RETURNABLE"
    if (st === "ISSUED_PENDING_REQUESTER_ACCEPT") {
      return (
        <button className="btn-submit small" onClick={() => handleAcceptIssue(it.requestItemId)}>
          Confirm Receipt
        </button>
      )
    }
    if (st === "ISSUED_CONFIRMED" && isReturnable) {
      return (
        <button className="btn-cancel small" onClick={() => handleReturn(it.requestItemId)}>
          Submit Return
        </button>
      )
    }
    return null
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <h2 className="welcome">My Requests</h2>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search lab, purpose, equipment…"
              className="form-input"
              style={{ flex: 1, minWidth: 200 }}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: 240 }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {loading && <div className="loading-state">Loading…</div>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">No requests found</div>
          )}

          {filtered.map((r) => (
            <div key={`${r.requestId}-${r._item?.requestItemId}`} className="history-card">
              <div className="history-grid">
                <div>
                  <div className="history-label">Request ID</div>
                  <div className="history-value">#{r.requestId}</div>
                  <div className="history-label" style={{ marginTop: 8 }}>Lab</div>
                  <div className="history-value">{r.labName || "–"}</div>
                  <div className="history-label" style={{ marginTop: 8 }}>Purpose</div>
                  <div className="history-value">{r.purpose || "–"}</div>
                </div>
                <div>
                  <div className="history-label">Equipment</div>
                  <div className="history-value">{itemText(r._item)}</div>
                  <div className="history-label" style={{ marginTop: 8 }}>Dates</div>
                  <div className="history-value">{r.fromDate || "–"} → {r.toDate || "–"}</div>
                  <div className="history-label" style={{ marginTop: 8 }}>Status</div>
                  <div>
                    {/* BUG FIX: uses status-pill CSS classes that match real enum strings */}
                    <span className={`status-pill ${r._itemStatus.toLowerCase()}`}>
                      {r._itemStatus.replace(/_/g, " ") || "–"}
                    </span>
                  </div>
                </div>
              </div>
              {renderAction(r) && (
                <div className="history-actions">{renderAction(r)}</div>
              )}
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
import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import "../styles/studentDashboard.css"
import { LecturerRequestAPI, StudentRequestAPI } from "../api/api"

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
      setError(e?.message || "Failed to load lecturer requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const itemText = (it) => {
    if (!it) return "-"
    return `${it.equipmentName || `Equipment #${it.equipmentId}`}: ${it.quantity}`
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const flat = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        flat.push({ ...r, _item: it, _itemStatus: String(it?.itemStatus || "") })
      }
    }
    return flat
      .filter((r) => (statusFilter === "All" ? true : String(r._itemStatus) === statusFilter))
      .filter((r) => {
        if (!q) return true
        const text = `${r.labName || ""} ${r.purpose || ""} ${itemText(r._item)}`.toLowerCase()
        return text.includes(q)
      })
      .sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows, query, statusFilter])

  const actAcceptIssue = async (requestItemId) => {
    setError("")
    try {
      await StudentRequestAPI.acceptIssueItem(requestItemId)
      await load()
    } catch (e) {
      setError(e?.message || "Accept issue failed")
    }
  }

  const actReturn = async (requestItemId) => {
    setError("")
    try {
      await StudentRequestAPI.submitReturnItem(requestItemId)
      await load()
    } catch (e) {
      setError(e?.message || "Return request failed")
    }
  }

  const renderAction = (r) => {
    const it = r?._item
    const st = String(r?._itemStatus || "")
    const isReturnable = String(it?.itemType || "") === "RETURNABLE"

    if (st === "ISSUED_PENDING_REQUESTER_ACCEPT") {
      return (
        <button className="btn-submit" type="button" onClick={() => actAcceptIssue(it?.requestItemId)}>
          Accept Issue
        </button>
      )
    }
    if (st === "ISSUED_CONFIRMED" && isReturnable) {
      return (
        <button className="btn-cancel" type="button" onClick={() => actReturn(it?.requestItemId)}>
          Return
        </button>
      )
    }
    return <span style={{ color: "#777" }}>—</span>
  }

  const statusOptions = useMemo(() => {
    const set = new Set()
    for (const r of rows || []) {
      for (const it of Array.isArray(r?.items) ? r.items : []) {
        const s = String(it?.itemStatus || "")
        if (s) set.add(s)
      }
    }
    return ["All", ...Array.from(set)]
  }, [rows])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 style={{ marginBottom: "15px" }}>My Requests</h2>

          {error && (
            <div className="error-message" style={{ color: "red", marginBottom: 10 }}>
              {error}
            </div>
          )}

          {/* SEARCH + FILTER BAR */}
          <div className="request-toolbar">
            <input
              className="request-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lab, purpose, equipment..."
            />

            <select className="request-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Lab</th>
                <th>Purpose</th>
                <th>From</th>
                <th>To</th>
                <th>Item</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.requestId}-${r?._item?.requestItemId || "x"}`}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{r.labName || "-"}</td>
                  <td>{r.purpose || "-"}</td>
                  <td style={{ textAlign: "center" }}>{r.fromDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>{r.toDate || "-"}</td>
                  <td>{itemText(r._item)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`status ${String(r._itemStatus || "").toLowerCase()}`}
                      style={{
                        backgroundColor:
                          r._itemStatus === "ISSUED_CONFIRMED"
                            ? "#16A34A"
                            : r._itemStatus === "ISSUED_PENDING_REQUESTER_ACCEPT"
                            ? "#FBBF24"
                            : r._itemStatus === "RETURNED"
                            ? "#2563EB"
                            : r._itemStatus === "RETURNREQUESTED"
                            ? "#F97316"
                            : r._itemStatus === "REJECTED_BY_LECTURER"
                            ? "#DC2626"
                            : "#6B7280",
                        color: r._itemStatus === "ISSUED_PENDING_REQUESTER_ACCEPT" ? "#111" : "white",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: 13,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {r._itemStatus || "-"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{renderAction(r)}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    {loading ? "Loading..." : "No requests"}
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
import "../styles/dashboard.css"
import "../styles/toTheme.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { ToRequestAPI } from "../api/api"
import { FaSearch } from "react-icons/fa"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const PIE_COLORS = ["#d97706","#2563eb","#16a34a","#7c3aed","#ea580c","#0891b2","#64748b","#dc2626"]

function itemStatusPill(s) {
  s = String(s || "").toUpperCase()
  if (s === "PENDING_LECTURER_APPROVAL")       return { label: "Pending Approval",  cls: "to-sp-pending-lec" }
  if (s === "APPROVED_BY_LECTURER")            return { label: "Ready to Issue",    cls: "to-sp-approved" }
  if (s === "REJECTED_BY_LECTURER")            return { label: "Rejected",          cls: "to-sp-rejected" }
  if (s === "WAITING_TO_ISSUE")                return { label: "Waiting",           cls: "to-sp-waiting" }
  if (s === "ISSUED_PENDING_REQUESTER_ACCEPT") return { label: "Issued – Pending",  cls: "to-sp-issued-pend" }
  if (s === "ISSUED_CONFIRMED")                return { label: "Issued ✓",          cls: "to-sp-issued" }
  if (s === "RETURN_REQUESTED")                return { label: "Return Requested",  cls: "to-sp-return-req" }
  if (s === "RETURN_VERIFIED")                 return { label: "Returned",          cls: "to-sp-returned" }
  if (s === "DAMAGED_REPORTED")                return { label: "Damaged",           cls: "to-sp-damaged" }
  return { label: s.replace(/_/g, " "), cls: "to-sp-slate" }
}

const ALL_ITEM_STATUSES = [
  "APPROVED_BY_LECTURER","WAITING_TO_ISSUE","ISSUED_PENDING_REQUESTER_ACCEPT",
  "ISSUED_CONFIRMED","RETURN_REQUESTED","RETURN_VERIFIED","DAMAGED_REPORTED",
  "PENDING_LECTURER_APPROVAL","REJECTED_BY_LECTURER",
]

export default function TOViewRequests() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [rows,         setRows]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState("")
  const [search,       setSearch]       = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    ToRequestAPI.all()
      .then(list => setRows(Array.isArray(list) ? list : []))
      .catch(e => setError(e?.message || "Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  /* Flatten to one row per item */
  const flatItems = useMemo(() => {
    const out = []
    for (const r of rows) {
      for (const it of (Array.isArray(r.items) ? r.items : [])) {
        out.push({ ...r, _item: it })
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  /* Counts */
  const counts = useMemo(() => ({
    total:  rows.length,
    items:  flatItems.length,
    active: flatItems.filter(r => ["APPROVED_BY_LECTURER","WAITING_TO_ISSUE",
      "ISSUED_PENDING_REQUESTER_ACCEPT","ISSUED_CONFIRMED"].includes(r._item.itemStatus)).length,
    done:   flatItems.filter(r => ["RETURN_VERIFIED","DAMAGED_REPORTED"].includes(r._item.itemStatus)).length,
  }), [rows, flatItems])

  /* Pie: status distribution */
  const pieData = useMemo(() => {
    const map = {}
    for (const r of flatItems) {
      const { label } = itemStatusPill(r._item.itemStatus)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [flatItems])

  /* Filtered rows */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return flatItems
      .filter(r => statusFilter === "ALL" || r._item.itemStatus === statusFilter)
      .filter(r => {
        if (!q) return true
        return (
          String(r.requesterFullName || "").toLowerCase().includes(q) ||
          String(r.requesterRegNo   || "").toLowerCase().includes(q) ||
          String(r._item?.equipmentName || "").toLowerCase().includes(q) ||
          String(r.labName || "").toLowerCase().includes(q) ||
          String(r.requestId || "").includes(q)
        )
      })
  }, [flatItems, statusFilter, search])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <div className="to-page-header">
            <div>
              <div className="to-page-title">All Requests</div>
              <div className="to-page-subtitle">All equipment requests across your assigned labs</div>
            </div>
          </div>

          {error && <div className="to-alert to-alert-error">{error}</div>}

          {/* Stat Cards */}
          <div className="to-stat-grid">
            <div className="to-stat-card blue">
              <div className="to-stat-label">Total Requests</div>
              <div className="to-stat-value">{loading ? "–" : counts.total}</div>
            </div>
            <div className="to-stat-card amber">
              <div className="to-stat-label">Total Items</div>
              <div className="to-stat-value">{loading ? "–" : counts.items}</div>
            </div>
            <div className="to-stat-card green">
              <div className="to-stat-label">Active Items</div>
              <div className="to-stat-value">{loading ? "–" : counts.active}</div>
            </div>
            <div className="to-stat-card slate">
              <div className="to-stat-label">Completed</div>
              <div className="to-stat-value">{loading ? "–" : counts.done}</div>
            </div>
          </div>

          {/* Pie */}
          {!loading && pieData.length > 0 && (
            <div className="to-chart-card" style={{ marginBottom: 20 }}>
              <div className="to-chart-title">Item Status Distribution</div>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                    dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Filters */}
          <div className="to-filter-bar">
            <div className="to-filter-wrap">
              <FaSearch size={12} />
              <input className="to-filter-input"
                placeholder="Search requester, reg no, equipment, lab, ID…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="to-filter-select" value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {ALL_ITEM_STATUSES.map(s => {
                const { label } = itemStatusPill(s)
                return <option key={s} value={s}>{label}</option>
              })}
            </select>
          </div>

          {loading && <div className="to-empty"><div className="to-empty-icon">⏳</div><div className="to-empty-text">Loading…</div></div>}
          {!loading && filtered.length === 0 && (
            <div className="to-empty">
              <div className="to-empty-icon">📭</div>
              <div className="to-empty-text">
                {search || statusFilter !== "ALL" ? "No items match your filter" : "No requests found"}
              </div>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="to-table-wrap">
              <table className="to-table">
                <thead>
                  <tr>
                    <th>#ID</th><th>Requester</th><th>Role</th><th>Lab</th>
                    <th>Equipment</th><th className="tc">Qty</th>
                    <th>Purpose</th><th>From</th><th>To</th><th>Item Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const it = r._item
                    const { label, cls } = itemStatusPill(it.itemStatus)
                    return (
                      <tr key={`${r.requestId}-${it.requestItemId}`}>
                        <td className="to-id">#{r.requestId}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.requesterFullName || "–"}</div>
                          {r.requesterRegNo && <div className="to-muted">{r.requesterRegNo}</div>}
                        </td>
                        <td className="to-muted">{r.requesterRole || "–"}</td>
                        <td>{r.labName || "–"}</td>
                        <td style={{ fontWeight: 600 }}>
                          {it.equipmentName || "–"}
                          {it.itemType && (
                            <span className={`to-type-chip ${String(it.itemType).toLowerCase()}`}
                              style={{ marginLeft: 6 }}>
                              {it.itemType}
                            </span>
                          )}
                        </td>
                        <td className="tc">{it.quantity}</td>
                        <td>
                          {r.purpose && (
                            <span className={`to-purpose ${String(r.purpose).toLowerCase()}`}>
                              {r.purpose}
                            </span>
                          )}
                        </td>
                        <td className="to-muted">{r.fromDate || "–"}</td>
                        <td className="to-muted">{r.toDate   || "–"}</td>
                        <td><span className={`to-sp ${cls}`}>{label}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

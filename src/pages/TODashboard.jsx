import "../styles/dashboard.css"
import "../styles/toTheme.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ToRequestAPI, ToPurchaseAPI, AuthAPI } from "../api/api"
import {
  AiOutlineInbox, AiOutlineEye, AiOutlinePlus,
  AiOutlineShoppingCart, AiOutlineHistory, AiOutlineClockCircle
} from "react-icons/ai"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts"

/* ── RequestItemStatus → pill helper ── */
function itemStatusPill(s) {
  s = String(s || "").toUpperCase()
  if (s === "PENDING_LECTURER_APPROVAL")       return { label: "Pending Approval",  cls: "to-sp-pending-lec" }
  if (s === "APPROVED_BY_LECTURER")            return { label: "Ready to Issue",    cls: "to-sp-approved" }
  if (s === "REJECTED_BY_LECTURER")            return { label: "Rejected",          cls: "to-sp-rejected" }
  if (s === "WAITING_TO_ISSUE")                return { label: "Waiting",           cls: "to-sp-waiting" }
  if (s === "ISSUED_PENDING_REQUESTER_ACCEPT") return { label: "Issued – Confirm",  cls: "to-sp-issued-pend" }
  if (s === "ISSUED_CONFIRMED")                return { label: "Issued ✓",          cls: "to-sp-issued" }
  if (s === "RETURN_REQUESTED")                return { label: "Return Requested",  cls: "to-sp-return-req" }
  if (s === "RETURN_VERIFIED")                 return { label: "Returned",          cls: "to-sp-returned" }
  if (s === "DAMAGED_REPORTED")                return { label: "Damaged",           cls: "to-sp-damaged" }
  return { label: s.replace(/_/g, " "), cls: "to-sp-slate" }
}

/* Items TO needs to act on or is currently tracking */
const ACTIVE_ITEM_STATUSES = new Set([
  "APPROVED_BY_LECTURER", "WAITING_TO_ISSUE",
  "ISSUED_PENDING_REQUESTER_ACCEPT", "ISSUED_CONFIRMED", "RETURN_REQUESTED"
])

const PIE_COLORS = ["#d97706", "#2563eb", "#16a34a", "#7c3aed", "#ea580c", "#0891b2", "#dc2626"]

export default function TODashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows,        setRows]        = useState([])
  const [purchases,   setPurchases]   = useState([])
  const [user,        setUser]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState("")

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [list, pList, me] = await Promise.all([
          ToRequestAPI.all(),
          ToPurchaseAPI.my().catch(() => []),
          AuthAPI.me(),
        ])
        if (!alive) return
        setRows(Array.isArray(list) ? list : [])
        setPurchases(Array.isArray(pList) ? pList : [])
        setUser(me)
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load dashboard data")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  /* Flatten items the TO is currently tracking */
  const activeItems = useMemo(() => {
    const out = []
    for (const r of rows) {
      for (const it of (Array.isArray(r.items) ? r.items : [])) {
        if (ACTIVE_ITEM_STATUSES.has(it.itemStatus)) {
          out.push({ ...r, _item: it })
        }
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  /* Dashboard counts */
  const counts = useMemo(() => {
    let readyToIssue = 0, waiting = 0, pendingReturn = 0, issuedConfirmed = 0
    for (const r of rows) {
      for (const it of (Array.isArray(r.items) ? r.items : [])) {
        if (it.itemStatus === "APPROVED_BY_LECTURER")            readyToIssue++
        if (it.itemStatus === "WAITING_TO_ISSUE")                waiting++
        if (it.itemStatus === "RETURN_REQUESTED")                pendingReturn++
        if (it.itemStatus === "ISSUED_CONFIRMED")                issuedConfirmed++
      }
    }
    return { readyToIssue, waiting, pendingReturn, issuedConfirmed, purchases: purchases.length }
  }, [rows, purchases])

  /* Pie: item status breakdown */
  const pieData = useMemo(() => {
    const map = {}
    for (const { _item } of activeItems) {
      const { label } = itemStatusPill(_item.itemStatus)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [activeItems])

  /* Bar: requests per lab */
  const labBar = useMemo(() => {
    const map = {}
    for (const r of rows) {
      const lab = r.labName || "Unknown"
      map[lab] = (map[lab] || 0) + 1
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a).slice(0, 6)
      .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, count }))
  }, [rows])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          {/* Page Header */}
          <div className="to-page-header">
            <div>
              <div className="to-page-title">
                Welcome back, {user?.fullName || "Technical Officer"}
              </div>
              <div className="to-page-subtitle">
                {user?.department ? `${user.department} · ` : ""}Faculty of Engineering, University of Jaffna
              </div>
            </div>
          </div>

          {error && <div className="to-alert to-alert-error">{error}</div>}

          {/* Stat Cards */}
          <div className="to-stat-grid">
            <div className="to-stat-card amber">
              <div className="to-stat-label">Ready to Issue</div>
              <div className="to-stat-value">{loading ? "–" : counts.readyToIssue}</div>
              <div className="to-stat-sub">Items approved by lecturer</div>
            </div>
            <div className="to-stat-card purple">
              <div className="to-stat-label">Waiting</div>
              <div className="to-stat-value">{loading ? "–" : counts.waiting}</div>
              <div className="to-stat-sub">Stock unavailable</div>
            </div>
            <div className="to-stat-card orange">
              <div className="to-stat-label">Pending Return</div>
              <div className="to-stat-value">{loading ? "–" : counts.pendingReturn}</div>
              <div className="to-stat-sub">Verify returns</div>
            </div>
            <div className="to-stat-card teal">
              <div className="to-stat-label">Issued & Active</div>
              <div className="to-stat-value">{loading ? "–" : counts.issuedConfirmed}</div>
              <div className="to-stat-sub">With requesters</div>
            </div>
            <div className="to-stat-card blue">
              <div className="to-stat-label">My Purchases</div>
              <div className="to-stat-value">{loading ? "–" : counts.purchases}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="to-section-hd">
            <span className="to-section-title">Quick Actions</span>
          </div>
          <div className="to-qa-grid">
            <div className="to-qa-card to-qa-amber" onClick={() => navigate("/to-approval-requests")}>
              <div className="to-qa-icon"><AiOutlineInbox /></div>
              <div className="to-qa-label">
                Approval Queue{counts.readyToIssue > 0 ? ` (${counts.readyToIssue})` : ""}
              </div>
            </div>
            <div className="to-qa-card to-qa-blue" onClick={() => navigate("/to-view-requests")}>
              <div className="to-qa-icon"><AiOutlineEye /></div>
              <div className="to-qa-label">View All Requests</div>
            </div>
            <div className="to-qa-card to-qa-green" onClick={() => navigate("/to-purchase-new")}>
              <div className="to-qa-icon"><AiOutlinePlus /></div>
              <div className="to-qa-label">New Purchase</div>
            </div>
            <div className="to-qa-card to-qa-teal" onClick={() => navigate("/to-purchase")}>
              <div className="to-qa-icon"><AiOutlineShoppingCart /></div>
              <div className="to-qa-label">My Purchases</div>
            </div>
            <div className="to-qa-card to-qa-purple" onClick={() => navigate("/to-history")}>
              <div className="to-qa-icon"><AiOutlineHistory /></div>
              <div className="to-qa-label">History</div>
            </div>
          </div>

          {/* Charts */}
          {!loading && (pieData.length > 0 || labBar.length > 0) && (
            <div className="to-chart-grid-2">
              {pieData.length > 0 && (
                <div className="to-chart-card">
                  <div className="to-chart-title">Active Items — Status Breakdown</div>
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
              {labBar.length > 0 && (
                <div className="to-chart-card">
                  <div className="to-chart-title">Requests by Lab</div>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={labBar} layout="vertical"
                      margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Active Items Preview Table */}
          <div className="to-section-hd">
            <span className="to-section-title">
              Active Items
              {activeItems.length > 0 && (
                <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px",
                  borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {activeItems.length}
                </span>
              )}
            </span>
            {activeItems.length > 6 && (
              <button className="to-btn to-btn-ghost to-btn-sm"
                onClick={() => navigate("/to-approval-requests")}>
                View all →
              </button>
            )}
          </div>
          <div className="to-table-wrap">
            <table className="to-table">
              <thead>
                <tr>
                  <th>#ID</th><th>Requester</th><th>Lab</th>
                  <th>Equipment</th><th>From</th><th>Item Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: 32, color: "var(--to-text-muted)" }}>Loading…</td></tr>
                )}
                {!loading && activeItems.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: 32, color: "var(--to-text-muted)" }}>No active items</td></tr>
                )}
                {!loading && activeItems.slice(0, 8).map(r => {
                  const it = r._item
                  const { label, cls } = itemStatusPill(it.itemStatus)
                  return (
                    <tr key={`${r.requestId}-${it.requestItemId}`}>
                      <td className="to-id">#{r.requestId}</td>
                      <td style={{ fontWeight: 600 }}>
                        {r.requesterFullName || "–"}
                        {r.requesterRegNo && <div className="to-muted">{r.requesterRegNo}</div>}
                      </td>
                      <td>{r.labName || "–"}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{it.equipmentName || "–"}</span>
                        <span className="to-muted"> ×{it.quantity}</span>
                      </td>
                      <td className="to-muted">{r.fromDate || "–"}</td>
                      <td><span className={`to-sp ${cls}`}>{label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}

import "../styles/dashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ToRequestAPI, ToPurchaseAPI, AuthAPI } from "../api/api"
import {
  AiOutlineFileText, AiOutlineClockCircle,
  AiOutlinePlus, AiOutlineCheckCircle,
  AiOutlineHourglass, AiOutlineAudit
} from "react-icons/ai"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#06b6d4"]

const ACTIVE_STATUSES = new Set([
  "APPROVED_BY_LECTURER", "TO_PROCESSING",
  "ISSUED_PENDING_STUDENT_ACCEPT", "ISSUED_CONFIRMED", "RETURNED_PENDING_TO_VERIFY",
])

function itemStatusLabel(s) {
  if (!s) return "Other"
  const sl = s.toLowerCase()
  if (sl.includes("waiting")) return "Waiting"
  if (sl.includes("issued_pending")) return "Pending Accept"
  if (sl.includes("issued_confirmed")) return "Confirmed"
  if (sl.includes("return_requested")) return "Return Req."
  if (sl.includes("return_verified")) return "Returned"
  if (sl.includes("approved")) return "Approved"
  if (sl.includes("rejected")) return "Rejected"
  return "Other"
}

export default function TODashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [purchases, setPurchases] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [list, pList, me] = await Promise.all([
          ToRequestAPI.all(),
          ToPurchaseAPI.my().catch(() => []),
          AuthAPI.me(),
        ])
        setRows(Array.isArray(list) ? list : [])
        setPurchases(Array.isArray(pList) ? pList : [])
        setUser(me)
      } catch (e) {
        setError(e?.message || "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Flat active items
  const assigned = useMemo(() => {
    const out = []
    for (const r of rows) {
      if (!ACTIVE_STATUSES.has(String(r.status))) continue
      for (const it of (r.items || [])) out.push({ ...r, _item: it })
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const counts = useMemo(() => ({
    active: assigned.length,
    pendingIssue: rows.filter(r => r.status === "APPROVED_BY_LECTURER" || r.status === "TO_PROCESSING").length,
    pendingReturn: rows.filter(r => r.status === "RETURNED_PENDING_TO_VERIFY").length,
    purchases: purchases.length,
  }), [assigned, rows, purchases])

  // Pie: item status breakdown
  const pieData = useMemo(() => {
    const map = {}
    for (const { _item } of assigned) {
      const label = itemStatusLabel(_item?.itemStatus)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [assigned])

  // Bar: requests per lab
  const labBarData = useMemo(() => {
    const map = {}
    for (const r of rows) {
      const lab = r.labName || "Unknown"
      map[lab] = (map[lab] || 0) + 1
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, count }))
  }, [rows])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <h2 className="welcome">Welcome, {user?.fullName || "Technical Officer"}!</h2>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card total">
              <div className="card-icon"><AiOutlineAudit size={22} /></div>
              <div className="card-info"><h4>Active Items</h4><p>{counts.active}</p></div>
            </div>
            <div className="summary-card pending">
              <div className="card-icon"><AiOutlineHourglass size={22} /></div>
              <div className="card-info"><h4>Pending Issue</h4><p>{counts.pendingIssue}</p></div>
            </div>
            <div className="summary-card processing">
              <div className="card-icon"><AiOutlineClockCircle size={22} /></div>
              <div className="card-info"><h4>Pending Return</h4><p>{counts.pendingReturn}</p></div>
            </div>
            <div className="summary-card issued">
              <div className="card-icon"><AiOutlineFileText size={22} /></div>
              <div className="card-info"><h4>My Purchases</h4><p>{counts.purchases}</p></div>
            </div>
          </div>

          {/* Charts */}
          {(pieData.length > 0 || labBarData.length > 0) && (
            <div className="charts-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {pieData.length > 0 && (
                <div className="chart-card">
                  <div className="chart-card-title">
                    <span className="chart-icon">🥧</span> Active Item Status
                  </div>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {labBarData.length > 0 && (
                <div className="chart-card">
                  <div className="chart-card-title">
                    <span className="chart-icon">🏛</span> Requests by Lab
                  </div>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={labBarData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={85} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="section-label">Quick Actions</div>
          <div className="dashboard-quick-actions">
            <button onClick={() => navigate("/to-approval-requests")}>
              <AiOutlineFileText size={16} /> Approval Requests
            </button>
            <button onClick={() => navigate("/to-purchase-new")}>
              <AiOutlinePlus size={16} /> New Purchase
            </button>
            <button onClick={() => navigate("/to-history")}>
              <AiOutlineClockCircle size={16} /> History
            </button>
          </div>

          {/* Active Items Table */}
          <div className="section-card">
            <div className="section-card-title">Active Equipment Items</div>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Requester</th>
                  <th>Lab</th>
                  <th>Equipment</th>
                  <th>From</th>
                  <th>Item Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="6" className="loading-state">Loading…</td></tr>}
                {!loading && assigned.length === 0 && <tr><td colSpan="6" className="empty-state">No active items</td></tr>}
                {assigned.slice(0, 8).map((r) => {
                  const it = r._item
                  return (
                    <tr key={`${r.requestId}-${it?.requestItemId}`}>
                      <td style={{ color: "#94a3b8" }}>#{r.requestId}</td>
                      <td>{r.requesterFullName || r.requesterRegNo || "–"}</td>
                      <td>{r.labName || "–"}</td>
                      <td>{it?.equipmentName || "–"} × {it?.quantity || "–"}</td>
                      <td>{r.fromDate || "–"}</td>
                      <td>
                        <span className={`status-pill ${(it?.itemStatus || "").toLowerCase()}`}>
                          {it?.itemStatus?.replace(/_/g, " ") || "–"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {assigned.length > 8 && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button className="btn-outline" onClick={() => navigate("/to-approval-requests")}>
                  View all {assigned.length} items
                </button>
              </div>
            )}
          </div>

        </div>
        <footer className="dashboard-footer">
          Faculty of Engineering · University of Jaffna &nbsp;|&nbsp; © 2026 ERMS
        </footer>
      </div>
    </div>
  )
}
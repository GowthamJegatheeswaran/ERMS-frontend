import "../styles/dashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LecturerRequestAPI, HodDepartmentAPI, HodPurchaseAPI, AuthAPI } from "../api/api"
import {
  AiOutlinePlus, AiOutlineFileText,
  AiOutlineHourglass, AiOutlineTeam,
  AiOutlineShoppingCart, AiOutlineCheckCircle
} from "react-icons/ai"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from "recharts"

const PIE_COLORS = ["#f59e0b", "#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#06b6d4"]

function statusLabel(s) {
  if (!s) return "Other"
  const sl = s.toLowerCase()
  if (sl === "pending_lecturer_approval") return "Pending"
  if (sl === "rejected_by_lecturer") return "Rejected"
  if (sl.includes("issued")) return "Issued"
  if (sl.includes("return")) return "Returned"
  if (sl.includes("to_processing") || sl.includes("approved")) return "Approved"
  return "Other"
}

export default function HodMyWork() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [myRows, setMyRows] = useState([])
  const [queue, setQueue] = useState([])
  const [deptRows, setDeptRows] = useState([])
  const [purchases, setPurchases] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [q, my, dept, p, me] = await Promise.all([
          LecturerRequestAPI.queue(),
          LecturerRequestAPI.my(),
          HodDepartmentAPI.requests().catch(() => []),
          HodPurchaseAPI.pending().catch(() => []),
          AuthAPI.me(),
        ])
        setQueue(Array.isArray(q) ? q : [])
        setMyRows(Array.isArray(my) ? my : [])
        setDeptRows(Array.isArray(dept) ? dept : [])
        setPurchases(Array.isArray(p) ? p : [])
        setUser(me)
      } catch (e) {
        setError(e?.message || "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const counts = useMemo(() => ({
    pendingApprovals: queue.length,
    myRequests: myRows.length,
    deptRequests: deptRows.length,
    pendingPurchases: purchases.length,
  }), [queue, myRows, deptRows, purchases])

  // Pie: department request status breakdown
  const deptPieData = useMemo(() => {
    const map = {}
    for (const r of deptRows) {
      const label = statusLabel(r.status)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [deptRows])

  // Bar: top requested equipment in department
  const topEquip = useMemo(() => {
    const map = {}
    for (const r of deptRows) {
      for (const it of (r.items || [])) {
        const name = it.equipmentName || "Unknown"
        map[name] = (map[name] || 0) + (it.quantity || 1)
      }
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, count }))
  }, [deptRows])

  // Line: monthly request trend
  const trendData = useMemo(() => {
    const map = {}
    for (const r of deptRows) {
      const d = r.fromDate ? new Date(r.fromDate) : null
      if (!d) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      map[key] = (map[key] || 0) + 1
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, count]) => ({ month: month.slice(5), count }))
  }, [deptRows])

  const recentMine = useMemo(() =>
    [...myRows].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 5)
  , [myRows])

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

          <h2 className="welcome">Welcome, {user?.fullName || "HOD"}!</h2>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
            Department: <strong>{user?.department || "–"}</strong>
          </div>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card pending">
              <div className="card-icon"><AiOutlineHourglass size={22} /></div>
              <div className="card-info"><h4>Pending Approvals</h4><p>{counts.pendingApprovals}</p></div>
            </div>
            <div className="summary-card total">
              <div className="card-icon"><AiOutlineTeam size={22} /></div>
              <div className="card-info"><h4>Dept Requests</h4><p>{counts.deptRequests}</p></div>
            </div>
            <div className="summary-card approved">
              <div className="card-icon"><AiOutlineFileText size={22} /></div>
              <div className="card-info"><h4>My Requests</h4><p>{counts.myRequests}</p></div>
            </div>
            <div className="summary-card processing">
              <div className="card-icon"><AiOutlineShoppingCart size={22} /></div>
              <div className="card-info"><h4>Pending Purchases</h4><p>{counts.pendingPurchases}</p></div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="charts-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {deptPieData.length > 0 && (
              <div className="chart-card">
                <div className="chart-card-title">
                  <span className="chart-icon">🥧</span> Dept Request Status Breakdown
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={deptPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                      {deptPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {topEquip.length > 0 && (
              <div className="chart-card">
                <div className="chart-card-title">
                  <span className="chart-icon">🏆</span> Top Requested Equipment
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={topEquip} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={95} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Qty" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Charts Row 2 — Request Trend */}
          {trendData.length > 1 && (
            <div className="chart-card" style={{ marginBottom: 20 }}>
              <div className="chart-card-title">
                <span className="chart-icon">📈</span> Department Request Trend (Monthly)
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 4 }} name="Requests" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Actions */}
          <div className="section-label">Quick Actions</div>
          <div className="dashboard-quick-actions">
            <button onClick={() => navigate("/lecturer-new-request")}>
              <AiOutlinePlus size={16} /> New Request
            </button>
            <button onClick={() => navigate("/lecturer-applications")}>
              <AiOutlineFileText size={16} /> Applications ({counts.pendingApprovals})
            </button>
            <button onClick={() => navigate("/hod-dept-work")}>
              <AiOutlineTeam size={16} /> Department Work
            </button>
            <button onClick={() => navigate("/hod-labs")}>
              Lab Management
            </button>
          </div>

          {/* My Recent Requests */}
          <div className="section-card">
            <div className="section-card-title">My Recent Requests</div>
            <table className="requests-table">
              <thead>
                <tr><th>Equipment</th><th>From</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="3" className="loading-state">Loading…</td></tr>}
                {!loading && recentMine.length === 0 && <tr><td colSpan="3" className="empty-state">No requests yet</td></tr>}
                {recentMine.map(r => (
                  <tr key={r.requestId}>
                    <td>{itemsPreview(r)}</td>
                    <td>{r.fromDate || "–"}</td>
                    <td>
                      <span className={`status-pill ${(r.status || "").toLowerCase()}`}>
                        {r.status?.replace(/_/g, " ") || "–"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
        <footer className="dashboard-footer">
          Faculty of Engineering · University of Jaffna &nbsp;|&nbsp; © 2026 ERMS
        </footer>
      </div>
    </div>
  )
}
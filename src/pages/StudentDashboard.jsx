import "../styles/dashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { StudentRequestAPI, AuthAPI } from "../api/api"
import {
  AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineCloseCircle,
  AiOutlineFileText, AiOutlinePlus
} from "react-icons/ai"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts"

const STATUS_COLORS = {
  "Pending":   "#f59e0b",
  "Approved":  "#22c55e",
  "Rejected":  "#ef4444",
  "Issued":    "#3b82f6",
  "Returned":  "#a855f7",
}

function statusLabel(s) {
  if (!s) return "Other"
  const sl = s.toLowerCase()
  if (sl === "pending_lecturer_approval") return "Pending"
  if (sl === "rejected_by_lecturer") return "Rejected"
  if (sl.includes("issued")) return "Issued"
  if (sl.includes("return")) return "Returned"
  return "Approved"
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [list, me] = await Promise.all([StudentRequestAPI.my(), AuthAPI.me()])
        setRows(Array.isArray(list) ? list : [])
        setUser(me)
      } catch (e) {
        setError(e?.message || "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const counts = useMemo(() => {
    const pending  = rows.filter(r => r.status === "PENDING_LECTURER_APPROVAL").length
    const rejected = rows.filter(r => r.status === "REJECTED_BY_LECTURER").length
    const issued   = rows.filter(r => r.status?.includes("ISSUED")).length
    const approved = rows.length - pending - rejected - issued
    return { pending, approved: approved < 0 ? 0 : approved, rejected, issued, total: rows.length }
  }, [rows])

  const pieData = useMemo(() => {
    const map = {}
    for (const r of rows) {
      const label = statusLabel(r.status)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [rows])

  // Monthly bar — count requests by month
  const barData = useMemo(() => {
    const monthMap = {}
    for (const r of rows) {
      const d = r.fromDate ? new Date(r.fromDate) : null
      if (!d) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthMap[key] = (monthMap[key] || 0) + 1
    }
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month: month.slice(5), count }))
  }, [rows])

  const recent = useMemo(() =>
    [...rows].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 5)
  , [rows])

  const itemsPreview = (r) => {
    const items = Array.isArray(r?.items) ? r.items : []
    if (!items.length) return "-"
    if (items.length === 1) return items[0].equipmentName || "-"
    return `${items[0].equipmentName || "-"} +${items.length - 1} more`
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <h2 className="welcome">Welcome, {user?.fullName || "Student"}!</h2>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card pending">
              <div className="card-icon"><AiOutlineClockCircle size={22} /></div>
              <div className="card-info"><h4>Pending</h4><p>{counts.pending}</p></div>
            </div>
            <div className="summary-card approved">
              <div className="card-icon"><AiOutlineCheckCircle size={22} /></div>
              <div className="card-info"><h4>Approved</h4><p>{counts.approved}</p></div>
            </div>
            <div className="summary-card rejected">
              <div className="card-icon"><AiOutlineCloseCircle size={22} /></div>
              <div className="card-info"><h4>Rejected</h4><p>{counts.rejected}</p></div>
            </div>
            <div className="summary-card total">
              <div className="card-icon"><AiOutlineFileText size={22} /></div>
              <div className="card-info"><h4>Total</h4><p>{counts.total}</p></div>
            </div>
          </div>

          {/* Charts */}
          {rows.length > 0 && (
            <div className="charts-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="chart-card">
                <div className="chart-card-title">
                  <span className="chart-icon">🥧</span> Request Status Breakdown
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-card-title">
                  <span className="chart-icon">📅</span> Monthly Request Activity
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="section-label">Quick Actions</div>
          <div className="dashboard-quick-actions">
            <button onClick={() => navigate("/new-request")}>
              <AiOutlinePlus size={16} /> New Request
            </button>
            <button onClick={() => navigate("/view-requests")}>
              <AiOutlineFileText size={16} /> View Requests
            </button>
          </div>

          {/* Recent Requests */}
          <div className="section-card">
            <div className="section-card-title">Recent Requests</div>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>From Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="3" className="loading-state">Loading…</td></tr>
                )}
                {!loading && recent.length === 0 && (
                  <tr><td colSpan="3" className="empty-state">No requests yet</td></tr>
                )}
                {recent.map((r) => (
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
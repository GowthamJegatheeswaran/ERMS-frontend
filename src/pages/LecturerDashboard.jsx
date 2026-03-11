import "../styles/dashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LecturerRequestAPI, AuthAPI } from "../api/api"
import {
  AiOutlinePlus, AiOutlineFileText,
  AiOutlineClockCircle, AiOutlineCheckCircle,
  AiOutlineCloseCircle, AiOutlineHourglass  // BUG FIX: was missing AiOutlineCloseCircle
} from "react-icons/ai"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts"

const PIE_COLORS = ["#f59e0b", "#22c55e", "#ef4444", "#3b82f6", "#a855f7"]

function statusLabel(s) {
  if (!s) return "Other"
  const sl = s.toLowerCase()
  if (sl === "pending_lecturer_approval") return "Pending"
  if (sl === "rejected_by_lecturer") return "Rejected"
  if (sl.includes("issued")) return "Issued"
  if (sl.includes("return")) return "Returned"
  return "Approved"
}

export default function LecturerDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [queue, setQueue] = useState([])
  const [myRows, setMyRows] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [q, my, me] = await Promise.all([
          LecturerRequestAPI.queue(),
          LecturerRequestAPI.my(),
          AuthAPI.me(),
        ])
        setQueue(Array.isArray(q) ? q : [])
        setMyRows(Array.isArray(my) ? my : [])
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
    totalMine: myRows.length,
    pendingMine: myRows.filter(r => r.status === "PENDING_LECTURER_APPROVAL").length,
    approvedMine: myRows.filter(r => ["APPROVED_BY_LECTURER", "TO_PROCESSING", "ISSUED_CONFIRMED"].includes(r.status)).length,
  }), [queue, myRows])

  // Pie: my requests by status
  const myPieData = useMemo(() => {
    const map = {}
    for (const r of myRows) {
      const label = statusLabel(r.status)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [myRows])

  // Bar: top equipment requested in queue
  const topEquipData = useMemo(() => {
    const map = {}
    for (const r of queue) {
      for (const item of (r.items || [])) {
        const name = item.equipmentName || "Unknown"
        map[name] = (map[name] || 0) + (item.quantity || 1)
      }
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, count }))
  }, [queue])

  const recentMine = useMemo(() =>
    [...myRows].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 5)
  , [myRows])

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

          <h2 className="welcome">Welcome, {user?.fullName || "Lecturer"}!</h2>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card pending">
              <div className="card-icon"><AiOutlineHourglass size={22} /></div>
              <div className="card-info"><h4>Pending Approvals</h4><p>{counts.pendingApprovals}</p></div>
            </div>
            <div className="summary-card total">
              <div className="card-icon"><AiOutlineFileText size={22} /></div>
              <div className="card-info"><h4>My Requests</h4><p>{counts.totalMine}</p></div>
            </div>
            <div className="summary-card approved">
              <div className="card-icon"><AiOutlineCheckCircle size={22} /></div>
              <div className="card-info"><h4>My Approved</h4><p>{counts.approvedMine}</p></div>
            </div>
            <div className="summary-card rejected">
              <div className="card-icon"><AiOutlineCloseCircle size={22} /></div>
              <div className="card-info"><h4>My Pending</h4><p>{counts.pendingMine}</p></div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid" style={{ gridTemplateColumns: myPieData.length > 0 && topEquipData.length > 0 ? "1fr 1fr" : "1fr" }}>
            {myPieData.length > 0 && (
              <div className="chart-card">
                <div className="chart-card-title">
                  <span className="chart-icon">🥧</span> My Request Status
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={myPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                      {myPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {topEquipData.length > 0 && (
              <div className="chart-card">
                <div className="chart-card-title">
                  <span className="chart-icon">📦</span> Top Requested Equipment (Queue)
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={topEquipData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Qty" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="section-label">Quick Actions</div>
          <div className="dashboard-quick-actions">
            <button onClick={() => navigate("/lecturer-new-request")}>
              <AiOutlinePlus size={16} /> New Request
            </button>
            <button onClick={() => navigate("/lecturer-applications")}>
              <AiOutlineFileText size={16} /> Pending Approvals ({counts.pendingApprovals})
            </button>
          </div>

          {/* Recent my requests */}
          <div className="section-card">
            <div className="section-card-title">My Recent Requests</div>
            <table className="requests-table">
              <thead>
                <tr><th>Equipment</th><th>From Date</th><th>Status</th></tr>
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

          {/* Pending queue preview */}
          {queue.length > 0 && (
            <div className="section-card">
              <div className="section-card-title">
                Pending Student Applications &nbsp;
                <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 10, fontSize: 12 }}>
                  {queue.length} awaiting
                </span>
              </div>
              <table className="requests-table">
                <thead>
                  <tr><th>Requester</th><th>Equipment</th><th>Lab</th><th>From</th></tr>
                </thead>
                <tbody>
                  {queue.slice(0, 5).map(r => (
                    <tr key={r.requestId}>
                      <td>{r.requesterFullName || "–"}</td>
                      <td>{itemsPreview(r)}</td>
                      <td>{r.labName || "–"}</td>
                      <td>{r.fromDate || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {queue.length > 5 && (
                <div style={{ textAlign: "center", marginTop: 10 }}>
                  <button className="btn-outline" onClick={() => navigate("/lecturer-applications")}>
                    View all {queue.length} applications
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
        <footer className="dashboard-footer">
          Faculty of Engineering · University of Jaffna &nbsp;|&nbsp; © 2026 ERMS
        </footer>
      </div>
    </div>
  )
}
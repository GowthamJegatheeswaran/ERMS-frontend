import "../styles/dashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AdminAPI, AdminPurchaseAPI } from "../api/api"
import {
  AiOutlineTeam, AiOutlineUser, AiOutlineFileText,
  AiOutlineShoppingCart, AiOutlineCheckCircle, AiOutlineCloseCircle
} from "react-icons/ai"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

const DEPT_COLORS = ["#3b82f6", "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState("")
  const [allPurchases, setAllPurchases] = useState({}) // { dept: [...] }
  const [userCounts, setUserCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const depts = await AdminAPI.departments()
        const deptList = Array.isArray(depts) ? depts : []
        setDepartments(deptList)
        if (deptList.length) setSelectedDept(deptList[0].name || deptList[0])

        // Load purchases + user counts for each department
        const purchaseMap = {}
        const userMap = {}
        await Promise.all(
          deptList.map(async (d) => {
            const name = d.name || d
            try {
              const purchases = await AdminPurchaseAPI.historyByDept(name)
              purchaseMap[name] = Array.isArray(purchases) ? purchases : []
            } catch { purchaseMap[name] = [] }
            try {
              const users = await AdminAPI.departmentUsers(name)
              userMap[name] = Array.isArray(users) ? users.length : 0
            } catch { userMap[name] = 0 }
          })
        )
        setAllPurchases(purchaseMap)
        setUserCounts(userMap)
      } catch (e) {
        setError(e?.message || "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Counts for selected department (uses real backend enum strings)
  const deptCounts = useMemo(() => {
    const pList = allPurchases[selectedDept] || []
    // BUG FIX: was using mock status strings ("PendingAdmin") — now uses real enums
    const pending  = pList.filter(p => p.status === "SUBMITTED_TO_HOD" || p.status === "APPROVED_BY_HOD").length
    const approved = pList.filter(p => p.status === "ISSUED_BY_ADMIN" || p.status === "RECEIVED_BY_HOD").length
    const rejected = pList.filter(p => p.status === "REJECTED_BY_HOD" || p.status === "REJECTED_BY_ADMIN").length
    return { pending, approved, rejected, total: pList.length }
  }, [allPurchases, selectedDept])

  // Bar chart: purchase count per department
  const deptBarData = useMemo(() =>
    departments.map((d) => {
      const name = d.name || d
      const pList = allPurchases[name] || []
      return {
        name: name.length > 8 ? name.slice(0, 8) + "…" : name,
        fullName: name,
        purchases: pList.length,
        users: userCounts[name] || 0,
      }
    })
  , [departments, allPurchases, userCounts])

  // Pie: purchase status breakdown for selected dept
  const purchasePieData = useMemo(() => {
    const pList = allPurchases[selectedDept] || []
    const map = {}
    for (const p of pList) {
      const s = p.status || "Unknown"
      map[s] = (map[s] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
  }, [allPurchases, selectedDept])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <h2 className="welcome">Admin Dashboard</h2>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card total">
              <div className="card-icon"><AiOutlineTeam size={22} /></div>
              <div className="card-info"><h4>Departments</h4><p>{departments.length}</p></div>
            </div>
            <div className="summary-card pending">
              <div className="card-icon"><AiOutlineShoppingCart size={22} /></div>
              <div className="card-info"><h4>Pending Purchases</h4><p>{deptCounts.pending}</p></div>
            </div>
            <div className="summary-card approved">
              <div className="card-icon"><AiOutlineCheckCircle size={22} /></div>
              <div className="card-info"><h4>Approved</h4><p>{deptCounts.approved}</p></div>
            </div>
            <div className="summary-card rejected">
              <div className="card-icon"><AiOutlineCloseCircle size={22} /></div>
              <div className="card-info"><h4>Rejected</h4><p>{deptCounts.rejected}</p></div>
            </div>
          </div>

          {/* Department Selector */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {departments.map((d) => {
              const name = d.name || d
              return (
                <button
                  key={name}
                  onClick={() => setSelectedDept(name)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1.5px solid",
                    borderColor: selectedDept === name ? "#2563eb" : "#e2e8f0",
                    background: selectedDept === name ? "#2563eb" : "#fff",
                    color: selectedDept === name ? "#fff" : "#475569",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {name}
                </button>
              )
            })}
          </div>

          {/* Charts */}
          <div className="charts-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {deptBarData.length > 0 && (
              <div className="chart-card">
                <div className="chart-card-title">
                  <span className="chart-icon">📊</span> Department Comparison
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name) => [val, name === "purchases" ? "Purchases" : "Users"]}
                      labelFormatter={(l, payload) => payload?.[0]?.payload?.fullName || l}
                    />
                    <Legend />
                    <Bar dataKey="purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Purchases" />
                    <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {purchasePieData.length > 0 && (
              <div className="chart-card">
                <div className="chart-card-title">
                  <span className="chart-icon">🥧</span> {selectedDept} — Purchase Status
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={purchasePieData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                      {purchasePieData.map((_, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="section-label">Quick Actions</div>
          <div className="dashboard-quick-actions">
            <button onClick={() => navigate("/admin-users")}>
              <AiOutlineUser size={16} /> User Management
            </button>
            <button onClick={() => navigate("/admin-department")}>
              <AiOutlineTeam size={16} /> Departments
            </button>
            <button onClick={() => navigate("/admin-report")}>
              <AiOutlineFileText size={16} /> Reports
            </button>
            <button onClick={() => navigate("/admin-view-requests")}>
              <AiOutlineFileText size={16} /> View All Requests
            </button>
          </div>

          {/* Departments Table */}
          <div className="section-card">
            <div className="section-card-title">Department Overview</div>
            <table className="requests-table">
              <thead>
                <tr><th>Department</th><th>Users</th><th>Total Purchases</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="3" className="loading-state">Loading…</td></tr>}
                {departments.map((d) => {
                  const name = d.name || d
                  return (
                    <tr key={name} style={{ cursor: "pointer" }} onClick={() => setSelectedDept(name)}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td>{userCounts[name] ?? "–"}</td>
                      <td>{(allPurchases[name] || []).length}</td>
                    </tr>
                  )
                })}
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
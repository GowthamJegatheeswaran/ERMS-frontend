import "../styles/dashboard.css"
import "../styles/toTheme.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ToPurchaseAPI } from "../api/api"
import { AiOutlinePlus } from "react-icons/ai"
import { FaSearch } from "react-icons/fa"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

/* PurchaseStatus → pill (matches PurchaseStatus enum exactly) */
function purchaseStatusPill(s) {
  s = String(s || "").toUpperCase()
  if (s === "SUBMITTED_TO_HOD")  return { label: "Submitted to HOD",  cls: "to-sp-submitted" }
  if (s === "REJECTED_BY_HOD")   return { label: "Rejected by HOD",   cls: "to-sp-hod-rejected" }
  if (s === "APPROVED_BY_HOD")   return { label: "Approved by HOD",   cls: "to-sp-hod-approved" }
  if (s === "REJECTED_BY_ADMIN") return { label: "Rejected by Admin", cls: "to-sp-adm-rejected" }
  if (s === "ISSUED_BY_ADMIN")   return { label: "Issued by Admin",   cls: "to-sp-issued-admin" }
  if (s === "APPROVED_BY_ADMIN") return { label: "Approved by Admin", cls: "to-sp-issued-admin" }
  if (s === "RECEIVED_BY_HOD")   return { label: "Received",          cls: "to-sp-received" }
  if (s === "RECEIVED_BY_TO")    return { label: "Received",          cls: "to-sp-received" }
  return { label: s.replace(/_/g, " "), cls: "to-sp-slate" }
}

const PIE_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#dc2626","#d97706"]

export default function TOPurchase() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState("")
  const [search,      setSearch]      = useState("")

  useEffect(() => {
    ToPurchaseAPI.my()
      .then(list => setRows(Array.isArray(list) ? list : []))
      .catch(e => setError(e?.message || "Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => (b.id || 0) - (a.id || 0))
  , [rows])

  /* Counts */
  const counts = useMemo(() => ({
    total:     sorted.length,
    pending:   sorted.filter(p => p.status === "SUBMITTED_TO_HOD").length,
    approved:  sorted.filter(p => ["APPROVED_BY_HOD","ISSUED_BY_ADMIN","APPROVED_BY_ADMIN"].includes(p.status)).length,
    received:  sorted.filter(p => ["RECEIVED_BY_HOD","RECEIVED_BY_TO"].includes(p.status)).length,
    rejected:  sorted.filter(p => ["REJECTED_BY_HOD","REJECTED_BY_ADMIN"].includes(p.status)).length,
  }), [sorted])

  /* Pie */
  const pieData = useMemo(() => {
    const map = {}
    for (const p of sorted) {
      const { label } = purchaseStatusPill(p.status)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [sorted])

  /* Filter */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(p =>
      String(p.id || "").includes(q) ||
      String(p.status || "").toLowerCase().includes(q) ||
      (Array.isArray(p.items) && p.items.some(it =>
        String(it.equipmentName || "").toLowerCase().includes(q)
      ))
    )
  }, [sorted, search])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <div className="to-page-header">
            <div>
              <div className="to-page-title">My Purchase Requests</div>
              <div className="to-page-subtitle">Track equipment purchase requests you've submitted to the HOD</div>
            </div>
            <button className="to-btn to-btn-primary" onClick={() => navigate("/to-purchase-new")}>
              <AiOutlinePlus /> New Purchase
            </button>
          </div>

          {error && <div className="to-alert to-alert-error">{error}</div>}

          {/* Stat Cards */}
          <div className="to-stat-grid">
            <div className="to-stat-card blue">
              <div className="to-stat-label">Total</div>
              <div className="to-stat-value">{loading ? "–" : counts.total}</div>
            </div>
            <div className="to-stat-card amber">
              <div className="to-stat-label">Pending HOD</div>
              <div className="to-stat-value">{loading ? "–" : counts.pending}</div>
            </div>
            <div className="to-stat-card teal">
              <div className="to-stat-label">In Progress</div>
              <div className="to-stat-value">{loading ? "–" : counts.approved}</div>
            </div>
            <div className="to-stat-card green">
              <div className="to-stat-label">Received</div>
              <div className="to-stat-value">{loading ? "–" : counts.received}</div>
            </div>
            <div className="to-stat-card red">
              <div className="to-stat-label">Rejected</div>
              <div className="to-stat-value">{loading ? "–" : counts.rejected}</div>
            </div>
          </div>

          {/* Pie */}
          {!loading && pieData.length > 0 && (
            <div className="to-chart-card" style={{ marginBottom: 20 }}>
              <div className="to-chart-title">Purchase Status Breakdown</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={76}
                    dataKey="value" paddingAngle={4}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Search */}
          <div className="to-filter-bar">
            <div className="to-filter-wrap">
              <FaSearch size={12} />
              <input className="to-filter-input"
                placeholder="Search by ID, equipment name, status…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading && <div className="to-empty"><div className="to-empty-icon">⏳</div><div className="to-empty-text">Loading…</div></div>}
          {!loading && filtered.length === 0 && (
            <div className="to-empty">
              <div className="to-empty-icon">🛒</div>
              <div className="to-empty-text">
                {search ? "No matching purchase requests" : "No purchase requests yet"}
              </div>
              {!search && (
                <button className="to-btn to-btn-primary" style={{ marginTop: 16 }}
                  onClick={() => navigate("/to-purchase-new")}>
                  <AiOutlinePlus /> Submit a Purchase Request
                </button>
              )}
            </div>
          )}

          {/* Purchase cards */}
          {/* PurchaseRequestSummaryDTO fields: id, status, reason, createdDate, issuedDate,
              receivedDate, requestedByName, items[]{equipmentName, quantity} */}
          {!loading && filtered.map(p => {
            const items = Array.isArray(p.items) ? p.items : []
            const { label, cls } = purchaseStatusPill(p.status)
            return (
              <div key={p.id} className="to-purchase-card">
                <div className="to-purchase-card-top">
                  <div className="to-card-title">
                    <span className="to-id">Purchase #{p.id}</span>
                    <span className={`to-sp ${cls}`}>{label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--to-text-muted)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {p.createdDate  && <span>Submitted: <strong>{p.createdDate}</strong></span>}
                    {p.issuedDate   && <span>Issued: <strong>{p.issuedDate}</strong></span>}
                    {p.receivedDate && <span>Received: <strong>{p.receivedDate}</strong></span>}
                  </div>
                </div>

                <div className="to-purchase-card-body">
                  {/* Flow indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
                    flexWrap: "wrap", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600 }}>
                    {[
                      { key: "SUBMITTED_TO_HOD",  short: "TO →" },
                      { key: "APPROVED_BY_HOD",   short: "HOD →" },
                      { key: "ISSUED_BY_ADMIN",   short: "Admin →" },
                      { key: "RECEIVED_BY_HOD",   short: "Received" },
                    ].map((step, i) => {
                      const reached = ["SUBMITTED_TO_HOD","APPROVED_BY_HOD","ISSUED_BY_ADMIN",
                        "APPROVED_BY_ADMIN","RECEIVED_BY_HOD","RECEIVED_BY_TO"]
                        .indexOf(String(p.status || "").toUpperCase()) >= i
                      return (
                        <span key={step.key} style={{
                          padding: "2px 8px", borderRadius: 6,
                          background: reached ? "var(--to-blue-pale)" : "var(--to-slate-100)",
                          color: reached ? "var(--to-blue)" : "var(--to-slate-500)",
                        }}>
                          {step.short}
                        </span>
                      )
                    })}
                  </div>

                  {/* Items list */}
                  {items.length > 0 && (
                    <div className="to-item-list">
                      <div className="to-item-list-hd">
                        Items Requested — {items.length}
                      </div>
                      {items.map((it, idx) => (
                        <div key={idx} className="to-item-row">
                          <div>
                            <div className="to-item-name">{it.equipmentName || `Item ${idx + 1}`}</div>
                          </div>
                          <span style={{ fontWeight: 700, color: "var(--to-blue)",
                            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>
                            ×{it.quantity ?? it.quantityRequested ?? "–"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {p.reason && (
                    <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--to-text-muted)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Note: {p.reason}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

        </div>
      </div>
    </div>
  )
}

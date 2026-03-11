import "../styles/dashboard.css"
import "../styles/toTheme.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { ToPurchaseAPI, ToRequestAPI } from "../api/api"
import { FaSearch } from "react-icons/fa"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts"

const PIE_COLORS = ["#64748b", "#dc2626", "#16a34a", "#d97706", "#2563eb"]

/* ── Purchase status → pill ── */
function purchaseStatusPill(s) {
  s = String(s || "").toUpperCase()
  if (s === "SUBMITTED_TO_HOD")  return { label: "Submitted to HOD", cls: "to-sp-submitted" }
  if (s === "REJECTED_BY_HOD")   return { label: "Rejected by HOD",  cls: "to-sp-hod-rejected" }
  if (s === "APPROVED_BY_HOD")   return { label: "Approved by HOD",  cls: "to-sp-hod-approved" }
  if (s === "REJECTED_BY_ADMIN") return { label: "Rejected by Admin",cls: "to-sp-adm-rejected" }
  if (s === "ISSUED_BY_ADMIN")   return { label: "Issued by Admin",  cls: "to-sp-issued-admin" }
  if (s === "APPROVED_BY_ADMIN") return { label: "Approved by Admin",cls: "to-sp-issued-admin" }
  if (s === "RECEIVED_BY_HOD")   return { label: "Received",         cls: "to-sp-received" }
  if (s === "RECEIVED_BY_TO")    return { label: "Received",         cls: "to-sp-received" }
  return { label: s.replace(/_/g, " "), cls: "to-sp-slate" }
}

/* ── Item status → pill (for completed items in history) ── */
function itemStatusPill(s) {
  s = String(s || "").toUpperCase()
  if (s === "RETURN_VERIFIED") return { label: "Returned",  cls: "to-sp-returned" }
  if (s === "DAMAGED_REPORTED")return { label: "Damaged",   cls: "to-sp-damaged" }
  return { label: s.replace(/_/g, " "), cls: "to-sp-slate" }
}

const TABS = [
  { key: "returns",   label: "Equipment Returns" },
  { key: "purchases", label: "Purchase History" },
]

export default function TOHistory() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [tab,          setTab]          = useState("returns")
  const [requestRows,  setRequestRows]  = useState([])
  const [purchaseRows, setPurchaseRows] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState("")
  const [search,       setSearch]       = useState("")

  useEffect(() => {
    Promise.all([
      ToRequestAPI.all().catch(() => []),
      ToPurchaseAPI.my().catch(() => []),
    ]).then(([reqs, purch]) => {
      setRequestRows(Array.isArray(reqs)  ? reqs  : [])
      setPurchaseRows(Array.isArray(purch) ? purch : [])
    }).catch(e => setError(e?.message || "Failed to load"))
    .finally(() => setLoading(false))
  }, [])

  /* ── Completed equipment items (RETURN_VERIFIED or DAMAGED_REPORTED) ── */
  const completedItems = useMemo(() => {
    const valid = new Set(["RETURN_VERIFIED", "DAMAGED_REPORTED"])
    const out = []
    for (const r of requestRows) {
      for (const it of (Array.isArray(r.items) ? r.items : [])) {
        if (valid.has(it.itemStatus)) out.push({ ...r, _item: it })
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [requestRows])

  /* ── Sorted purchases ── */
  const sortedPurchases = useMemo(() =>
    [...purchaseRows].sort((a, b) => (b.id || 0) - (a.id || 0))
  , [purchaseRows])

  /* ── Charts for returns tab ── */
  const returnsPie = useMemo(() => {
    const map = {}
    for (const r of completedItems) {
      const { label } = itemStatusPill(r._item.itemStatus)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [completedItems])

  const roleBar = useMemo(() => {
    const map = {}
    for (const r of completedItems) {
      const role = r.requesterRole || "Unknown"
      map[role] = (map[role] || 0) + 1
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }, [completedItems])

  /* ── Charts for purchases tab ── */
  const purchasePie = useMemo(() => {
    const map = {}
    for (const p of sortedPurchases) {
      const { label } = purchaseStatusPill(p.status)
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [sortedPurchases])

  /* ── Filter ── */
  const filteredReturns = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return completedItems
    return completedItems.filter(r =>
      String(r.requesterFullName || "").toLowerCase().includes(q) ||
      String(r.requesterRegNo   || "").toLowerCase().includes(q) ||
      String(r._item?.equipmentName || "").toLowerCase().includes(q) ||
      String(r.labName || "").toLowerCase().includes(q) ||
      String(r.requestId || "").includes(q)
    )
  }, [completedItems, search])

  const filteredPurchases = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sortedPurchases
    return sortedPurchases.filter(p =>
      String(p.id || "").includes(q) ||
      String(p.status || "").toLowerCase().includes(q) ||
      (Array.isArray(p.items) && p.items.some(it =>
        String(it.equipmentName || "").toLowerCase().includes(q)
      ))
    )
  }, [sortedPurchases, search])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <div className="to-page-header">
            <div>
              <div className="to-page-title">History</div>
              <div className="to-page-subtitle">Completed equipment returns and purchase requests</div>
            </div>
          </div>

          {error && <div className="to-alert to-alert-error">{error}</div>}

          {/* Summary stats */}
          <div className="to-stat-grid">
            <div className="to-stat-card slate">
              <div className="to-stat-label">Total Returns</div>
              <div className="to-stat-value">{loading ? "–" : completedItems.length}</div>
            </div>
            <div className="to-stat-card red">
              <div className="to-stat-label">Damaged Items</div>
              <div className="to-stat-value">{loading ? "–" : completedItems.filter(r => r._item.itemStatus === "DAMAGED_REPORTED").length}</div>
            </div>
            <div className="to-stat-card blue">
              <div className="to-stat-label">Purchase Requests</div>
              <div className="to-stat-value">{loading ? "–" : purchaseRows.length}</div>
            </div>
            <div className="to-stat-card green">
              <div className="to-stat-label">Purchases Received</div>
              <div className="to-stat-value">{loading ? "–" : purchaseRows.filter(p =>
                ["RECEIVED_BY_HOD","RECEIVED_BY_TO"].includes(String(p.status || "").toUpperCase())
              ).length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="to-tab-bar">
            {TABS.map(t => (
              <button key={t.key}
                className={`to-tab${tab === t.key ? " active" : ""}`}
                onClick={() => { setTab(t.key); setSearch("") }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="to-filter-bar">
            <div className="to-filter-wrap">
              <FaSearch size={12} />
              <input className="to-filter-input"
                placeholder={tab === "returns" ? "Search requester, equipment, lab…" : "Search purchase ID, equipment…"}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading && <div className="to-empty"><div className="to-empty-icon">⏳</div><div className="to-empty-text">Loading…</div></div>}

          {/* ── RETURNS TAB ── */}
          {!loading && tab === "returns" && (
            <>
              {(returnsPie.length > 0 || roleBar.length > 0) && (
                <div className="to-chart-grid-2" style={{ marginBottom: 20 }}>
                  {returnsPie.length > 0 && (
                    <div className="to-chart-card">
                      <div className="to-chart-title">Return Outcomes</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={returnsPie} cx="50%" cy="50%" innerRadius={50} outerRadius={76}
                            dataKey="value" paddingAngle={4}>
                            {returnsPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {roleBar.length > 0 && (
                    <div className="to-chart-card">
                      <div className="to-chart-title">Returns by Requester Role</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={roleBar} margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} name="Items" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {filteredReturns.length === 0
                ? <div className="to-empty"><div className="to-empty-icon">📋</div><div className="to-empty-text">{search ? "No matching records" : "No completed returns yet"}</div></div>
                : (
                  <div className="to-table-wrap">
                    <table className="to-table">
                      <thead>
                        <tr>
                          <th>#ID</th><th>Requester</th><th>Role</th><th>Lab</th>
                          <th>Equipment</th><th className="tc">Qty</th>
                          <th>From</th><th>To</th><th>Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReturns.map(r => {
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
                              <td style={{ fontWeight: 600 }}>{it.equipmentName || "–"}</td>
                              <td className="tc">{it.quantity}</td>
                              <td className="to-muted">{r.fromDate || "–"}</td>
                              <td className="to-muted">{r.toDate   || "–"}</td>
                              <td><span className={`to-sp ${cls}`}>{label}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </>
          )}

          {/* ── PURCHASES TAB ── */}
          {!loading && tab === "purchases" && (
            <>
              {purchasePie.length > 0 && (
                <div className="to-chart-card" style={{ marginBottom: 20 }}>
                  <div className="to-chart-title">Purchase Status Distribution</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={purchasePie} cx="50%" cy="50%" innerRadius={50} outerRadius={76}
                        dataKey="value" paddingAngle={4}>
                        {purchasePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {filteredPurchases.length === 0
                ? <div className="to-empty"><div className="to-empty-icon">🛒</div><div className="to-empty-text">{search ? "No matching purchases" : "No purchase requests yet"}</div></div>
                : filteredPurchases.map(p => {
                    const items = Array.isArray(p.items) ? p.items : []
                    const { label, cls } = purchaseStatusPill(p.status)
                    return (
                      <div key={p.id} className="to-purchase-card">
                        <div className="to-purchase-card-top">
                          <div className="to-card-title">
                            <span className="to-id">Purchase #{p.id}</span>
                            <span className={`to-sp ${cls}`}>{label}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--to-text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {p.createdDate && `Submitted: ${p.createdDate}`}
                            {p.issuedDate   && ` · Issued: ${p.issuedDate}`}
                            {p.receivedDate && ` · Received: ${p.receivedDate}`}
                          </div>
                        </div>
                        <div className="to-purchase-card-body">
                          {/* Items */}
                          <div style={{ marginBottom: items.length > 0 ? 10 : 0 }}>
                            {items.map((it, idx) => (
                              <div key={idx} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "8px 12px", borderRadius: 8,
                                background: "var(--to-slate-50)",
                                border: "1px solid var(--to-slate-200)",
                                marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif"
                              }}>
                                <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--to-text)" }}>
                                  {it.equipmentName || `Item ${idx + 1}`}
                                </span>
                                <span className="to-muted">×{it.quantity ?? it.quantityRequested ?? "–"}</span>
                              </div>
                            ))}
                          </div>
                          {p.reason && (
                            <div style={{ fontSize: 12, color: "var(--to-text-muted)",
                              fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              Note: {p.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
              }
            </>
          )}

        </div>
      </div>
    </div>
  )
}

import "../styles/dashboard.css"
import "../styles/toTheme.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { ToRequestAPI } from "../api/api"
import { AiOutlineCheck, AiOutlineClockCircle, AiOutlineWarning } from "react-icons/ai"
import { FaSearch } from "react-icons/fa"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

/* ── Status helpers ── */
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

/*
 * Logic rules from backend RequestItemStatus:
 *   canIssue  → APPROVED_BY_LECTURER  or  WAITING_TO_ISSUE
 *   canWait   → APPROVED_BY_LECTURER  only  (if already waiting, issue or re-wait from waiting)
 *   canVerify → RETURN_REQUESTED  only
 */
function getActions(status) {
  const s = String(status || "").toUpperCase()
  return {
    canIssue:  s === "APPROVED_BY_LECTURER" || s === "WAITING_TO_ISSUE",
    canWait:   s === "APPROVED_BY_LECTURER",
    canVerify: s === "RETURN_REQUESTED",
  }
}

const FILTER_OPTIONS = [
  { value: "ALL",                             label: "All" },
  { value: "APPROVED_BY_LECTURER",            label: "Ready to Issue" },
  { value: "WAITING_TO_ISSUE",                label: "Waiting" },
  { value: "RETURN_REQUESTED",                label: "Return Requested" },
  { value: "ISSUED_PENDING_REQUESTER_ACCEPT", label: "Issued – Pending" },
  { value: "ISSUED_CONFIRMED",                label: "Issued ✓" },
]

export default function TOApprovalRequests() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [rows,         setRows]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState("")
  const [notice,       setNotice]       = useState("")
  const [search,       setSearch]       = useState("")
  const [filter,       setFilter]       = useState("ALL")
  const [actioning,    setActioning]    = useState(null)
  /* Per-item inline wait panels: { [requestItemId]: { open, reason } } */
  const [waitPanels,   setWaitPanels]   = useState({})

  const load = async () => {
    setError("")
    try {
      const list = await ToRequestAPI.all()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) { setError(e?.message || "Failed to load") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const flash = (msg, type = "success") => {
    if (type === "success") { setNotice(msg); setTimeout(() => setNotice(""), 5000) }
    else                    { setError(msg);  setTimeout(() => setError(""), 6000) }
  }

  /* ── Flatten rows × items ── */
  const flatItems = useMemo(() => {
    const out = []
    for (const r of rows) {
      for (const it of (Array.isArray(r.items) ? r.items : [])) {
        out.push({ ...r, _item: it })
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  /* Stats for header cards */
  const stats = useMemo(() => ({
    ready:   flatItems.filter(r => r._item.itemStatus === "APPROVED_BY_LECTURER").length,
    waiting: flatItems.filter(r => r._item.itemStatus === "WAITING_TO_ISSUE").length,
    returns: flatItems.filter(r => r._item.itemStatus === "RETURN_REQUESTED").length,
  }), [flatItems])

  /* Bar: equipment pending issue */
  const pendingBar = useMemo(() => {
    const map = {}
    for (const r of flatItems) {
      if (!["APPROVED_BY_LECTURER", "WAITING_TO_ISSUE"].includes(r._item.itemStatus)) continue
      const n = r._item.equipmentName || `Equip#${r._item.equipmentId}`
      map[n] = (map[n] || 0) + (r._item.quantity || 1)
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a).slice(0, 6)
      .map(([name, qty]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, qty }))
  }, [flatItems])

  /* Apply filters */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return flatItems
      .filter(r => filter === "ALL" || r._item.itemStatus === filter)
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
  }, [flatItems, filter, search])

  /* ── Action handlers ── */
  const actIssue = async (requestItemId) => {
    setActioning(requestItemId)
    try {
      await ToRequestAPI.issueItem(requestItemId)
      flash("Item issued successfully")
      await load()
    } catch (e) { flash(e?.message || "Issue failed", "error") }
    finally { setActioning(null) }
  }

  const openWait  = (id) => setWaitPanels(p => ({ ...p, [id]: { open: true, reason: "" } }))
  const closeWait = (id) => setWaitPanels(p => { const c = { ...p }; delete c[id]; return c })
  const setReason = (id, val) => setWaitPanels(p => ({ ...p, [id]: { ...p[id], reason: val } }))

  const actWait = async (requestItemId) => {
    const reason = waitPanels[requestItemId]?.reason?.trim() || ""
    setActioning(requestItemId)
    try {
      await ToRequestAPI.waitItem(requestItemId, reason)
      flash("Item marked as waiting")
      closeWait(requestItemId)
      await load()
    } catch (e) { flash(e?.message || "Failed", "error") }
    finally { setActioning(null) }
  }

  const actVerify = async (requestItemId, damaged) => {
    setActioning(requestItemId)
    try {
      await ToRequestAPI.verifyReturnItem(requestItemId, damaged)
      flash(damaged ? "Item marked as damaged" : "Return verified")
      await load()
    } catch (e) { flash(e?.message || "Failed", "error") }
    finally { setActioning(null) }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <div className="to-page-header">
            <div>
              <div className="to-page-title">Approval Queue</div>
              <div className="to-page-subtitle">Issue equipment, mark items as waiting, and verify returns</div>
            </div>
          </div>

          {error  && <div className="to-alert to-alert-error">{error}</div>}
          {notice && <div className="to-alert to-alert-success">{notice}</div>}

          {/* Stats */}
          <div className="to-stat-grid">
            <div className="to-stat-card amber">
              <div className="to-stat-label">Ready to Issue</div>
              <div className="to-stat-value">{stats.ready}</div>
              <div className="to-stat-sub">Approved by lecturer</div>
            </div>
            <div className="to-stat-card purple">
              <div className="to-stat-label">Waiting</div>
              <div className="to-stat-value">{stats.waiting}</div>
              <div className="to-stat-sub">Stock unavailable</div>
            </div>
            <div className="to-stat-card orange">
              <div className="to-stat-label">Pending Return Verify</div>
              <div className="to-stat-value">{stats.returns}</div>
            </div>
          </div>

          {/* Pending issue bar */}
          {pendingBar.length > 0 && (
            <div className="to-chart-card" style={{ marginBottom: 20 }}>
              <div className="to-chart-title">Equipment Pending Issue</div>
              <ResponsiveContainer width="100%" height={Math.max(120, pendingBar.length * 36)}>
                <BarChart data={pendingBar} layout="vertical"
                  margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#d97706" radius={[0, 4, 4, 0]} name="Total Qty" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Filter bar */}
          <div className="to-filter-bar">
            <div className="to-filter-wrap">
              <FaSearch size={12} />
              <input className="to-filter-input"
                placeholder="Search requester, reg no, equipment, lab, ID…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="to-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading && <div className="to-empty"><div className="to-empty-icon">⏳</div><div className="to-empty-text">Loading…</div></div>}
          {!loading && filtered.length === 0 && (
            <div className="to-empty">
              <div className="to-empty-icon">✅</div>
              <div className="to-empty-text">
                {search || filter !== "ALL" ? "No items match your filter" : "No items requiring action"}
              </div>
            </div>
          )}

          {!loading && filtered.map(r => {
            const it  = r._item
            const iid = it.requestItemId
            const { label, cls } = itemStatusPill(it.itemStatus)
            const { canIssue, canWait, canVerify } = getActions(it.itemStatus)
            const busy      = actioning === iid
            const waitPanel = waitPanels[iid]

            return (
              <div key={`${r.requestId}-${iid}`} className="to-card">
                <div className="to-card-top">
                  <div className="to-card-title">
                    <span className="to-id">#{r.requestId}</span>
                    <span className={`to-sp ${cls}`}>{label}</span>
                    {r.purpose && (
                      <span className={`to-purpose ${String(r.purpose).toLowerCase()}`}>
                        {r.purpose}
                      </span>
                    )}
                    {r.requesterRole && (
                      <span className="to-sp to-sp-slate">{r.requesterRole}</span>
                    )}
                  </div>
                  <div className="to-card-actions">
                    {canIssue && (
                      <button className="to-btn to-btn-success to-btn-sm"
                        disabled={busy || !!waitPanel?.open}
                        onClick={() => actIssue(iid)}>
                        <AiOutlineCheck /> Issue
                      </button>
                    )}
                    {canWait && (
                      <button className="to-btn to-btn-amber to-btn-sm"
                        disabled={busy}
                        onClick={() => waitPanel?.open ? closeWait(iid) : openWait(iid)}>
                        <AiOutlineClockCircle /> {waitPanel?.open ? "Cancel" : "Mark Wait"}
                      </button>
                    )}
                    {canVerify && (
                      <>
                        <button className="to-btn to-btn-success to-btn-sm"
                          disabled={busy}
                          onClick={() => actVerify(iid, false)}>
                          <AiOutlineCheck /> Verify Return
                        </button>
                        <button className="to-btn to-btn-danger to-btn-sm"
                          disabled={busy}
                          onClick={() => actVerify(iid, true)}>
                          <AiOutlineWarning /> Mark Damaged
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="to-card-body">
                  {/* Meta info */}
                  <div className="to-meta-grid">
                    <div>
                      <div className="to-mi-label">Requester</div>
                      <div className="to-mi-value">{r.requesterFullName || "–"}</div>
                    </div>
                    <div>
                      <div className="to-mi-label">Reg No</div>
                      <div className="to-mi-value muted">{r.requesterRegNo || "–"}</div>
                    </div>
                    <div>
                      <div className="to-mi-label">Lab</div>
                      <div className="to-mi-value">{r.labName || "–"}</div>
                    </div>
                    <div>
                      <div className="to-mi-label">Lecturer</div>
                      <div className="to-mi-value muted">{r.lecturerFullName || "–"}</div>
                    </div>
                    <div>
                      <div className="to-mi-label">From</div>
                      <div className="to-mi-value">{r.fromDate || "–"}</div>
                    </div>
                    <div>
                      <div className="to-mi-label">To</div>
                      <div className="to-mi-value">{r.toDate || "–"}</div>
                    </div>
                  </div>

                  {/* Equipment item row */}
                  <div className="to-equip-row">
                    <div style={{ flex: 1 }}>
                      <div className="to-equip-name">
                        {it.equipmentName || `Equipment #${it.equipmentId}`}
                      </div>
                      <div className="to-equip-meta">
                        <span>Requested: <strong>{it.quantity}</strong></span>
                        {it.issuedQty != null && it.issuedQty > 0 && (
                          <span>Issued: <strong>{it.issuedQty}</strong></span>
                        )}
                        {it.itemType && (
                          <span className={`to-type-chip ${String(it.itemType).toLowerCase()}`}>
                            {it.itemType}
                          </span>
                        )}
                        {it.category && <span className="to-muted">{it.category}</span>}
                      </div>
                      {it.toWaitReason && (
                        <div className="to-wait-reason">⚠ Wait reason: {it.toWaitReason}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {it.returned && <span className="to-sp to-sp-returned">Returned</span>}
                      {it.damaged  && <span className="to-sp to-sp-damaged">Damaged</span>}
                    </div>
                  </div>

                  {/* Inline wait reason panel */}
                  {waitPanel?.open && (
                    <div className="to-wait-panel">
                      <input className="to-wait-input"
                        placeholder="Reason for waiting (optional — e.g. out of stock)"
                        value={waitPanel.reason}
                        onChange={e => setReason(iid, e.target.value)} />
                      <button className="to-btn to-btn-amber to-btn-sm"
                        disabled={busy}
                        onClick={() => actWait(iid)}>
                        {busy ? "…" : "Confirm Wait"}
                      </button>
                      <button className="to-btn to-btn-ghost to-btn-sm"
                        onClick={() => closeWait(iid)}>
                        Cancel
                      </button>
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

import "../styles/hodTheme.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { HodLabAPI, AuthAPI, AdminAPI } from "../api/api"
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai"
import { MdOutlineScience } from "react-icons/md"
import { FaUserCog } from "react-icons/fa"

/*
  ── Why TOs may show as 0 ───────────────────────────────────────────────────
  Admin-created TO accounts have email_verified = 0 in the DB.
  The existing /api/admin/departments/{dept}/users endpoint filters them out.

  Multi-strategy fetch (tried in order, merged by user id):
  1. GET /api/hod/department-tos  ← new dedicated endpoint (no email_verified filter)
     Requires adding to backend — see api.js HodLabAPI.deptTOs comment.
  2. GET /api/admin/departments/{dept}/users → dto.tos[]
     Works only for TOs where email_verified = 1.
  3. Extract TOs already embedded in /api/hod/labs response
     Always shows currently-assigned TOs even if everything else fails.

  Permanent fix: add the backend endpoint (#1), OR run the SQL:
    UPDATE users SET email_verified = 1 WHERE role = 'TO' AND department = '<dept>';
  ────────────────────────────────────────────────────────────────────────────
*/
async function fetchTOUsers(department, labList) {
  const mergedMap = new Map() // id → user object

  // Strategy 3 (baseline): TOs already embedded in labs data
  for (const lab of (Array.isArray(labList) ? labList : [])) {
    const to = lab.technicalOfficer
    if (to?.id) {
      mergedMap.set(to.id, {
        id:       to.id,
        fullName: to.fullName || lab.technicalOfficerName || `TO #${to.id}`,
        email:    to.email || "",
        role:     "TO",
      })
    }
  }

  // Strategy 2: AdminAPI (only gets email_verified=1 TOs)
  try {
    const dto = await AdminAPI.departmentUsers(department)
    for (const u of (Array.isArray(dto?.tos) ? dto.tos : [])) {
      if (u?.id) mergedMap.set(u.id, u)
    }
  } catch { /* ignore */ }

  // Strategy 1 (best): dedicated HOD endpoint — no email_verified filter
  try {
    const list = await HodLabAPI.deptTOs()
    if (Array.isArray(list)) {
      for (const u of list) {
        if (u?.id) mergedMap.set(u.id, u)
      }
    }
  } catch { /* endpoint not yet deployed — strategies 2/3 cover it */ }

  return [...mergedMap.values()]
}

export default function HodLabManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [labs, setLabs]         = useState([])
  const [toUsers, setToUsers]   = useState([])
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState({})
  const [messages, setMessages] = useState({})
  const [error, setError]       = useState("")

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const me      = await AuthAPI.me()
        const labList = await HodLabAPI.labs()
        const labs    = Array.isArray(labList) ? labList : []
        const tos     = await fetchTOUsers(me.department, labs)
        if (!alive) return
        setUser(me)
        setLabs(labs)
        setToUsers(tos)
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const setMsg = (labId, text, ok) => {
    setMessages(p => ({ ...p, [labId]: { text, ok } }))
    setTimeout(() => setMessages(p => { const n = { ...p }; delete n[labId]; return n }), 4000)
  }

  const handleAssign = async (labId, toUserId) => {
    setSaving(p => ({ ...p, [labId]: true }))
    try {
      if (!toUserId) {
        await HodLabAPI.clearTo(labId)
        setLabs(p => p.map(l => l.id === labId ? { ...l, technicalOfficerId: null, technicalOfficer: null } : l))
        setMsg(labId, "Technical Officer removed", true)
      } else {
        await HodLabAPI.assignTo(labId, Number(toUserId))
        const assigned = toUsers.find(u => String(u.id) === String(toUserId))
        setLabs(p => p.map(l =>
          l.id === labId
            ? { ...l, technicalOfficerId: Number(toUserId), technicalOfficer: assigned || { id: Number(toUserId) } }
            : l
        ))
        setMsg(labId, `Assigned: ${assigned?.fullName || "TO"} successfully`, true)
      }
    } catch (e) {
      setMsg(labId, e?.message || "Failed to update", false)
    } finally {
      setSaving(p => ({ ...p, [labId]: false }))
    }
  }

  const assignedCount = useMemo(() =>
    labs.filter(l => !!(l.technicalOfficerId ?? l.technicalOfficer?.id ?? null)).length
  , [labs])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <div className="hod-page-header">
            <div>
              <div className="hod-page-title">Lab Management</div>
              <div className="hod-page-subtitle">
                Assign Technical Officers to labs &nbsp;·&nbsp; Dept: {user?.department || "–"}
              </div>
            </div>
          </div>

          {error && <div className="hod-alert hod-alert-error">{error}</div>}

          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card blue">
              <div className="stat-label">Total Labs</div>
              <div className="stat-value">{labs.length}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Assigned</div>
              <div className="stat-value">{assignedCount}</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-label">Unassigned</div>
              <div className="stat-value">{labs.length - assignedCount}</div>
            </div>
            <div className="stat-card slate">
              <div className="stat-label">Available TOs</div>
              <div className="stat-value">{toUsers.length}</div>
              <div className="stat-sub" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                A TO can manage multiple labs
              </div>
            </div>
          </div>

          {/* Warning when no TOs visible — explains the email_verified root cause */}
          {toUsers.length === 0 && !loading && (
            <div className="hod-alert hod-alert-amber">
              <strong>No TOs visible for department {user?.department}.</strong>
              {" "}This happens because admin-created TO accounts have{" "}
              <code>email_verified = 0</code> in the database, and the current
              user-list API filters them out.
              <br /><br />
              <strong>Fix options (backend required):</strong>
              <br />
              <strong>Option 1 — Quick SQL fix</strong> (run once in MySQL Workbench):
              <pre style={{
                background: "#1e1e2e", color: "#cdd6f4", padding: "8px 12px",
                borderRadius: 6, fontSize: 12, margin: "8px 0", overflowX: "auto"
              }}>
{`UPDATE railway.users
SET email_verified = 1
WHERE role = 'TO' AND department = '${user?.department || "<dept>"}';`}
              </pre>
              <strong>Option 2 — Add backend endpoint</strong> so TOs are always visible
              regardless of email_verified. See the comment in <code>api.js</code> inside{" "}
              <code>HodLabAPI.deptTOs</code> for the Spring Boot code to add.
            </div>
          )}

          {loading ? (
            <div className="empty-block">
              <div className="empty-icon">⏳</div>
              <div className="empty-text">Loading labs…</div>
            </div>
          ) : labs.length === 0 ? (
            <div className="empty-block">
              <div className="empty-icon">🏛</div>
              <div className="empty-text">No labs found for your department.</div>
            </div>
          ) : (
            labs.map(lab => {
              const msg        = messages[lab.id]
              const isSaving   = !!saving[lab.id]
              const currentId  = lab.technicalOfficerId ?? lab.technicalOfficer?.id ?? null
              const currentName =
                lab.technicalOfficerName ||
                lab.technicalOfficer?.fullName ||
                (currentId ? toUsers.find(u => u.id === currentId)?.fullName : null) ||
                null

              return (
                <div key={lab.id} className="lab-mgmt-card">
                  <div className="lab-mgmt-header">
                    <div>
                      <div className="lab-mgmt-name">
                        <MdOutlineScience size={18} />
                        {lab.name}
                      </div>
                      <div className="lab-mgmt-current">
                        Current TO:{" "}
                        {currentName
                          ? <strong>{currentName}</strong>
                          : <span style={{ color: "var(--text-muted)" }}>Not assigned</span>
                        }
                      </div>
                    </div>
                    <span className={currentId ? "sp sp-green" : "sp sp-amber"}>
                      {currentId ? "✓ Assigned" : "Unassigned"}
                    </span>
                  </div>

                  <div className="lab-mgmt-body">
                    <FaUserCog size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <select
                      className="lab-mgmt-select"
                      value={currentId || ""}
                      onChange={e => handleAssign(lab.id, e.target.value || null)}
                      disabled={isSaving || toUsers.length === 0}
                    >
                      <option value="">— Remove / No TO —</option>
                      {toUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName || u.email}{u.email ? ` (${u.email})` : ""}
                        </option>
                      ))}
                    </select>

                    {isSaving && <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Saving…</span>}

                    {msg && (
                      <span className={msg.ok ? "lab-mgmt-msg-ok" : "lab-mgmt-msg-err"}>
                        {msg.ok ? <AiOutlineCheckCircle /> : <AiOutlineCloseCircle />}
                        {msg.text}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}

          <div className="hod-alert hod-alert-info" style={{ marginTop: 20 }}>
            <strong>Note:</strong> Only TOs in your department are shown.
            A single TO can be assigned to multiple labs.
            Changes take effect immediately.
          </div>

        </div>
      </div>
    </div>
  )
}
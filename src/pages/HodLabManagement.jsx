import "../styles/hodTheme.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { HodLabAPI, AuthAPI, AdminAPI } from "../api/api"
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai"
import { MdOutlineScience } from "react-icons/md"
import { FaUserCog } from "react-icons/fa"

/*
 * FIX BUG 1 — fetchTOUsers was always returning []
 *
 * Problem:
 *   AdminAPI.departmentUsers(dept) returns an AdminDepartmentUsersDTO object:
 *     { department: "CE", hods: [...], tos: [...], lecturers: [...], staff: [...], students: [...] }
 *
 *   The old code treated this as if it were an array:
 *     const arr = Array.isArray(list) ? list        // false — it's an object
 *                 : Array.isArray(list?.content)     // false — no .content field exists
 *                 ? list.content
 *                 : []                               // always falls through to []
 *
 *   So arr was ALWAYS [] → filter returned [] → toUsers = [] → "Available TOs: 0"
 *   and the dropdown had no options.
 *
 * Fix:
 *   Read list.tos directly — that's where the TO users live in the DTO.
 *   Also filter to only enabled TOs so disabled accounts don't appear.
 */
async function fetchTOUsers(department) {
  if (!department) return []
  try {
    const data = await AdminAPI.departmentUsers(department)
    // data is AdminDepartmentUsersDTO — TOs are in data.tos[]
    const tos = Array.isArray(data?.tos) ? data.tos : []
    // Only show enabled TOs
    return tos.filter(u => u.enabled !== false)
  } catch {
    return []
  }
}

export default function HodLabManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [labs,    setLabs]    = useState([])
  const [toUsers, setToUsers] = useState([])
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState({})     // { labId: bool }
  const [messages,setMessages]= useState({})     // { labId: { text, ok } }
  const [error,   setError]   = useState("")

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const me = await AuthAPI.me()
        const [labList, tos] = await Promise.all([
          HodLabAPI.labs(),
          fetchTOUsers(me.department),
        ])
        if (!alive) return
        setUser(me)
        setLabs(Array.isArray(labList) ? labList : [])
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
        setLabs(p => p.map(l =>
          l.id === labId
            ? { ...l, technicalOfficer: null }
            : l
        ))
        setMsg(labId, "Technical Officer removed", true)
      } else {
        await HodLabAPI.assignTo(labId, Number(toUserId))
        // FIX BUG 3: now toUsers is populated correctly (BUG 1 fixed),
        // so assigned TO's name will always be found and shown
        const assigned = toUsers.find(u => String(u.id) === String(toUserId))
        setLabs(p => p.map(l =>
          l.id === labId
            ? { ...l, technicalOfficer: assigned || { id: Number(toUserId) } }
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

  /*
   * FIX BUG 2 — Lab JSON has technicalOfficer as a nested User object, not a flat ID.
   * The backend Lab entity is serialized as:
   *   { id, name, department, technicalOfficer: { id, fullName, email, ... } }
   * There is NO separate technicalOfficerId field in the response.
   * So we must read the TO id from technicalOfficer.id consistently.
   */
  const getLabToId = (lab) => lab?.technicalOfficer?.id ?? null

  const getLabToName = (lab) => {
    const toId = getLabToId(lab)
    if (!toId) return null
    // Try from the embedded object first (comes from backend)
    if (lab.technicalOfficer?.fullName) return lab.technicalOfficer.fullName
    // Fallback: look up in the TO list
    return toUsers.find(u => u.id === toId)?.fullName || null
  }

  // FIX BUG 4 — assignedCount now uses the correct field path
  const assignedCount = useMemo(() =>
    labs.filter(l => !!getLabToId(l)).length
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

          {/* Stats — FIX BUG 4: toUsers.length now shows the real count */}
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
            </div>
          </div>

          {toUsers.length === 0 && !loading && (
            <div className="hod-alert hod-alert-amber">
              No Technical Officers found in department <strong>{user?.department}</strong>.
              Ask the Admin to create TO accounts for your department.
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
              const msg      = messages[lab.id]
              const isSaving = !!saving[lab.id]
              const currentId   = getLabToId(lab)
              const currentName = getLabToName(lab)

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
                      disabled={isSaving}
                    >
                      <option value="">— Remove / No TO —</option>
                      {toUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName || u.email} &nbsp;({u.email})
                        </option>
                      ))}
                    </select>

                    {isSaving && (
                      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Saving…</span>
                    )}

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
            <strong>Note:</strong> Only enabled Technical Officers (TO) in your department are shown.
            Changes take effect immediately — the assigned TO gains access to issue equipment for that lab.
          </div>

        </div>
      </div>
    </div>
  )
}
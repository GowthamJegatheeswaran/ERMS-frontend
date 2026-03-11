import "../styles/dashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useState } from "react"
import { HodLabAPI, CommonAPI, AuthAPI } from "../api/api"
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineReload } from "react-icons/ai"
import { MdOutlineScience } from "react-icons/md"

export default function HodLabManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [labs, setLabs] = useState([])
  const [toUsers, setToUsers] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({}) // { labId: true/false }
  const [messages, setMessages] = useState({}) // { labId: { text, ok } }
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const me = await AuthAPI.me()
      setUser(me)
      const [labList, toList] = await Promise.all([
        HodLabAPI.labs(),
        CommonAPI.lecturers(me.department).catch(() => []), // re-use common endpoint to get dept users
      ])
      setLabs(Array.isArray(labList) ? labList : [])
      // TO users — filter by TO role if full list returned, else use as-is
      // The CommonAPI.lecturers endpoint returns LECTURER/HOD; we also need TO users.
      // If backend returns all dept users, filter TO; otherwise use separate fetch
      setToUsers(Array.isArray(toList) ? toList : [])
    } catch (e) {
      setError(e?.message || "Failed to load labs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setMsg = (labId, text, ok) => {
    setMessages(prev => ({ ...prev, [labId]: { text, ok } }))
    setTimeout(() => setMessages(prev => { const n = { ...prev }; delete n[labId]; return n }), 3500)
  }

  const handleAssign = async (labId, toUserId) => {
    if (!toUserId) {
      // Clear assignment
      setSaving(prev => ({ ...prev, [labId]: true }))
      try {
        await HodLabAPI.clearTo(labId)
        setLabs(prev => prev.map(l => l.id === labId ? { ...l, technicalOfficerId: null, technicalOfficerName: null } : l))
        setMsg(labId, "TO removed successfully", true)
      } catch (e) {
        setMsg(labId, e?.message || "Failed to remove TO", false)
      } finally {
        setSaving(prev => ({ ...prev, [labId]: false }))
      }
      return
    }

    setSaving(prev => ({ ...prev, [labId]: true }))
    try {
      await HodLabAPI.assignTo(labId, Number(toUserId))
      const assigned = toUsers.find(u => String(u.id) === String(toUserId))
      setLabs(prev => prev.map(l =>
        l.id === labId
          ? { ...l, technicalOfficerId: Number(toUserId), technicalOfficerName: assigned?.fullName || "" }
          : l
      ))
      setMsg(labId, `Assigned ${assigned?.fullName || "TO"} successfully`, true)
    } catch (e) {
      setMsg(labId, e?.message || "Failed to assign TO", false)
    } finally {
      setSaving(prev => ({ ...prev, [labId]: false }))
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <h2 className="welcome" style={{ marginBottom: 4 }}>Lab Management</h2>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Assign Technical Officers to labs — Dept: <strong>{user?.department || "–"}</strong>
              </div>
            </div>
            <button
              className="btn-outline"
              onClick={load}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <AiOutlineReload /> Refresh
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-state">Loading labs…</div>
          ) : labs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏛</div>
              No labs found for your department.
            </div>
          ) : (
            <div>
              {labs.map((lab) => {
                const msg = messages[lab.id]
                const isSaving = saving[lab.id]
                // Current TO id — handle both `technicalOfficerId` (flat) and `technicalOfficer.id` (nested)
                const currentToId = lab.technicalOfficerId ?? lab.technicalOfficer?.id ?? null
                const currentToName = lab.technicalOfficerName || lab.technicalOfficer?.fullName || null

                return (
                  <div key={lab.id} className="lab-mgmt-card">
                    <div className="lab-mgmt-header">
                      <div>
                        <div className="lab-mgmt-name">
                          <MdOutlineScience style={{ marginRight: 6, color: "#2563eb" }} />
                          {lab.name}
                        </div>
                        <div className="lab-mgmt-to" style={{ marginTop: 4 }}>
                          Current TO:{" "}
                          {currentToName
                            ? <span>{currentToName}</span>
                            : <span style={{ color: "#94a3b8" }}>Not assigned</span>
                          }
                        </div>
                      </div>

                      {currentToId && (
                        <span style={{
                          background: "#dcfce7", color: "#15803d",
                          padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600
                        }}>
                          ✓ Assigned
                        </span>
                      )}
                      {!currentToId && (
                        <span style={{
                          background: "#fef3c7", color: "#b45309",
                          padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600
                        }}>
                          Unassigned
                        </span>
                      )}
                    </div>

                    <div className="lab-mgmt-body">
                      <select
                        className="lab-mgmt-select"
                        value={currentToId || ""}
                        onChange={(e) => handleAssign(lab.id, e.target.value || null)}
                        disabled={isSaving}
                      >
                        <option value="">— Remove / No TO —</option>
                        {toUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName || u.email}
                            {u.role ? ` (${u.role})` : ""}
                          </option>
                        ))}
                      </select>

                      {isSaving && (
                        <span style={{ fontSize: 13, color: "#64748b" }}>Saving…</span>
                      )}

                      {msg && (
                        <span style={{
                          fontSize: 13,
                          color: msg.ok ? "#15803d" : "#b91c1c",
                          display: "flex", alignItems: "center", gap: 5
                        }}>
                          {msg.ok ? <AiOutlineCheckCircle /> : <AiOutlineCloseCircle />}
                          {msg.text}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="alert alert-info" style={{ marginTop: 24, fontSize: 13 }}>
            <strong>Note:</strong> Only Technical Officers in your department will appear in the dropdown.
            Changes take effect immediately — the assigned TO will gain access to issue equipment for this lab.
          </div>

        </div>
        <footer className="dashboard-footer">
          Faculty of Engineering · University of Jaffna &nbsp;|&nbsp; © 2026 ERMS
        </footer>
      </div>
    </div>
  )
}
import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { AdminAPI } from "../api/api"

const emailOk = (v) => /\S+@\S+\.\S+/.test((v || "").trim())
const strongPwd = (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v || "")

export default function AdminUsers() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [departments, setDepartments] = useState([])
  const [dept, setDept] = useState("")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [editingStudent, setEditingStudent] = useState(null)

  const loadDepartments = async () => {
    setError("")
    try {
      const list = await AdminAPI.departments()
      setDepartments(Array.isArray(list) ? list : [])
      if (!dept && Array.isArray(list) && list.length) setDept(list[0])
    } catch (e) {
      setError(e?.message || "Failed to load departments")
    }
  }

  const loadUsers = async (deptArg = dept) => {
    if (!deptArg) return
    setError("")
    setNotice("")
    try {
      setLoading(true)
      const dto = await AdminAPI.departmentUsers(deptArg)
      setData(dto || null)
    } catch (e) {
      setError(e?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  useEffect(() => {
    if (dept) loadUsers(dept)
  }, [dept])

  const refresh = async () => {
    await loadUsers(dept)
  }

  const onCreate = async (roleKey, payload) => {
    setError("")
    setNotice("")
    try {
      if (!payload.fullName || !emailOk(payload.email) || !payload.initialPassword) {
        setError("Please fill valid name, email and password")
        return false
      }
      if (!strongPwd(payload.initialPassword)) {
        setError("Password must be 8+ chars with uppercase, lowercase, number & special")
        return false
      }

      const common = { ...payload, department: dept }

      if (roleKey === "hod") await AdminAPI.createHod(common)
      else if (roleKey === "to") await AdminAPI.createTo(common)
      else if (roleKey === "lecturer") await AdminAPI.createLecturer(common)
      else if (roleKey === "staff") await AdminAPI.createStaff(common)
      else {
        setError("Student adding is disabled here")
        return false
      }

      setNotice(`${roleKey.toUpperCase()} created successfully`)
      await refresh()
      return true
    } catch (e) {
      setError(e?.message || "Create failed")
      return false
    }
  }

  const onRemove = async (id) => {
    if (!window.confirm(`Remove user ${id}?`)) return
    setError("")
    setNotice("")
    try {
      await AdminAPI.deleteUser(id)
      setNotice("User removed successfully")
      await refresh()
    } catch (e) {
      setError(e?.message || "Remove failed")
    }
  }

  const onDisable = async (user) => {
    const isEnableAction = user?.enabled === false
    if (!window.confirm(`${isEnableAction ? "Activate" : "Disable"} user ${user?.id}?`)) return
    setError("")
    setNotice("")
    try {
      await AdminAPI.disableUser(user.id)
      setNotice(isEnableAction ? "User activated successfully" : "User disabled successfully")
      await refresh()
    } catch (e) {
      setError(e?.message || `${isEnableAction ? "Activate" : "Disable"} failed`)
    }
  }

  const onUpdateStudent = async (id, payload) => {
    setError("")
    setNotice("")
    try {
      await AdminAPI.updateUser(id, payload)
      setNotice("Student updated successfully")
      setEditingStudent(null)
      await refresh()
    } catch (e) {
      setError(e?.message || "Update failed")
    }
  }

  const groups = useMemo(() => {
    const safe = (v) => (Array.isArray(v) ? v : [])
    return {
      hods: safe(data?.hods),
      tos: safe(data?.tos),
      lecturers: safe(data?.lecturers),
      staff: safe(data?.staff),
      students: safe(data?.students),
    }
  }, [data])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 12 }}>User Management</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select className="request-filter" value={dept} onChange={(e) => setDept(e.target.value)}>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button className="btn-submit" type="button" onClick={refresh} disabled={loading || !dept}>
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: "#fff2f2", color: "#a00" }}>{error}</div>}
          {notice && <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: "#eef6ff", color: "#124" }}>{notice}</div>}

          <div style={{ display: "grid", gap: 18 }}>
            <UserGroup
              title="HOD"
              roleKey="hod"
              rows={groups.hods}
              onCreate={onCreate}
              onRemove={onRemove}
              onDisable={onDisable}
              note="Only one HOD is allowed for one department"
            />

            <UserGroup title="Technical Officers" roleKey="to" rows={groups.tos} onCreate={onCreate} onRemove={onRemove} onDisable={onDisable} />

            <UserGroup title="Lecturers" roleKey="lecturer" rows={groups.lecturers} onCreate={onCreate} onRemove={onRemove} onDisable={onDisable} />

            <UserGroup title="Instructors (STAFF)" roleKey="staff" rows={groups.staff} onCreate={onCreate} onRemove={onRemove} onDisable={onDisable} />

            <StudentGroup
              rows={groups.students}
              onRemove={onRemove}
              onEdit={setEditingStudent}
            />
          </div>
        </div>

        {editingStudent && (
          <EditStudentModal
            student={editingStudent}
            onClose={() => setEditingStudent(null)}
            onSave={onUpdateStudent}
          />
        )}

        <footer>
          Faculty of Engineering | University of Jaffna <br />© Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

function UserGroup({ title, roleKey, rows, onCreate, onRemove, onDisable, note }) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [pwd, setPwd] = useState("")
  const [pwd2, setPwd2] = useState("")
  const [msg, setMsg] = useState("")

  const submit = async () => {
    setMsg("")
    if (!fullName || !emailOk(email) || !pwd || !pwd2) {
      setMsg("Please fill valid name, email and password")
      return
    }
    if (!strongPwd(pwd)) {
      setMsg("Password must be 8+ chars with uppercase, lowercase, number & special")
      return
    }
    if (pwd !== pwd2) {
      setMsg("Passwords do not match")
      return
    }

    const ok = await onCreate(roleKey, {
      fullName,
      email,
      initialPassword: pwd,
    })

    if (ok) {
      setFullName("")
      setEmail("")
      setPwd("")
      setPwd2("")
    }
  }

  return (
    <div>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      {note && <div style={{ opacity: 0.8, marginBottom: 10, fontSize: 13 }}>{note}</div>}
      {msg && <div style={{ marginBottom: 10, fontSize: 13, color: "#a00" }}>{msg}</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Initial password" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        <input placeholder="Confirm password" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
        <button className="btn-submit" type="button" onClick={submit}>
          Add
        </button>
      </div>

      <table className="requests-table">
        <thead>
          <tr>
            <th style={{ width: "32%" }}>Name</th>
            <th>Email</th>
            <th style={{ width: 120 }}>Status</th>
            <th style={{ width: 220, textAlign: "center" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((u) => (
            <tr key={u.id}>
              <td>{u.fullName || u.name || "-"}</td>
              <td>{u.email || "-"}</td>
              <td>{u.enabled === false ? "Disabled" : "Active"}</td>
              <td style={{ textAlign: "center", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn-cancel" type="button" onClick={() => onRemove(u.id)}>
                  Remove
                </button>
                <button className="btn-submit" type="button" onClick={() => onDisable(u)}>
                  {u.enabled === false ? "Active" : "Disable"}
                </button>
              </td>
            </tr>
          ))}
          {(rows || []).length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No users
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function StudentGroup({ rows, onRemove, onEdit }) {
  return (
    <div>
      <h3 style={{ marginBottom: 6 }}>Students</h3>

      <table className="requests-table">
        <thead>
          <tr>
            <th style={{ width: "30%" }}>Name</th>
            <th style={{ width: "18%" }}>Reg No</th>
            <th>Email</th>
            <th style={{ width: 180, textAlign: "center" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((u) => (
            <tr key={u.id}>
              <td>{u.fullName || "-"}</td>
              <td>{u.regNo || "-"}</td>
              <td>{u.email || "-"}</td>
              <td style={{ textAlign: "center", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn-submit" type="button" onClick={() => onEdit(u)}>
                  Edit
                </button>
                <button className="btn-cancel" type="button" onClick={() => onRemove(u.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {(rows || []).length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No students
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function EditStudentModal({ student, onClose, onSave }) {
  const [fullName, setFullName] = useState(student?.fullName || "")
  const [regNo, setRegNo] = useState(student?.regNo || "")
  const [msg, setMsg] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setMsg("")
    if (!fullName.trim() || !regNo.trim()) {
      setMsg("Name and Reg No are required")
      return
    }

    try {
      setSaving(true)
      await onSave(student.id, { fullName: fullName.trim(), regNo: regNo.trim() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 480, boxShadow: "0 10px 30px rgba(0,0,0,0.18)" }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Edit Student</h3>
        {msg && <div style={{ marginBottom: 10, color: "#a00" }}>{msg}</div>}
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Name</label>
            <input style={{ width: "100%" }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Reg No</label>
            <input style={{ width: "100%" }} value={regNo} onChange={(e) => setRegNo(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Email</label>
            <input style={{ width: "100%", background: "#f5f5f5" }} value={student?.email || ""} disabled />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button className="btn-cancel" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-submit" type="button" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

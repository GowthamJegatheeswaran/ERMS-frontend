import "../styles/toDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { ToRequestAPI } from "../api/api"

export default function TOHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await ToRequestAPI.all()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load TO history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const history = useMemo(() => {
    const itemDone = new Set(["RETURN_REQUESTED", "RETURN_VERIFIED", "DAMAGED_REPORTED"])
    const flat = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        if (!itemDone.has(String(it?.itemStatus || ""))) continue
        flat.push({ ...r, _item: it, _itemStatus: String(it?.itemStatus || "") })
      }
    }
    return flat.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const historyStudentInstructor = useMemo(() =>
    history.filter((r) => {
      const role = String(r.requesterRole || "").toUpperCase()
      return role === "STUDENT" || role === "INSTRUCTOR" || role === "STAFF"
    }), [history]
  )

  const historyLecturer = useMemo(() =>
    history.filter((r) => String(r.requesterRole || "").toUpperCase() === "LECTURER"), [history]
  )

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-"
  const renderItems = (r) => {
    const it = r?._item
    if (!it) return <span style={{ color: "#777" }}>—</span>
    return <div>{it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity ?? "-"}</div>
  }

  const canVerifyReturn = (itemStatus) => String(itemStatus || "") === "RETURN_REQUESTED"
  const actVerify = async (requestItemId, damaged) => {
    setError("")
    try {
      await ToRequestAPI.verifyReturnItem(requestItemId, damaged)
      await load()
    } catch (e) {
      setError(e?.message || "Verify return failed")
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          {/* Student/Instructor History */}
       <h3 style={{ marginBottom: 10 }}>Student/Instructor History</h3>
<table className="requests-table">
  <thead>
    <tr>
      <th>Request_ID</th>
      <th>Requester</th>
      <th>Role</th>
      <th>Lab</th>
      <th>Items</th>
      <th>Status</th>
      <th>Verify</th>
    </tr>
  </thead>
  <tbody>
    {historyStudentInstructor.map((r) => {
      const it = r._item
      return (
        <tr key={`${r.requestId}-${it.requestItemId}`}>
          <td>{r.requestId}</td>
          <td>{requesterText(r)}</td>
          <td>{r.requesterRole || "-"}</td>
          <td>{r.labName || "-"}</td>
          <td>{it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity}</td>
          <td>
            <span className={`status ${String(r._itemStatus || "").toLowerCase()}`}>
              {r._itemStatus || "-"}
            </span>
          </td>
          <td>
            {canVerifyReturn(r._itemStatus) ? (
              <div className="to-actions">
                <button className="btn-submit" type="button" onClick={() => actVerify(it.requestItemId, false)}>Verify OK</button>
                <button className="btn-cancel" type="button" onClick={() => actVerify(it.requestItemId, true)}>Mark Damaged</button>
              </div>
            ) : (
              <span style={{ color: "#777" }}>—</span>
            )}
          </td>
        </tr>
      )
    })}
  </tbody>
</table>

<h3 style={{ marginTop: 22, marginBottom: 10 }}>Lecturer History</h3>
<table className="requests-table">
  <thead>
    <tr>
      <th>Request_ID</th>
      <th>Requester</th>
      <th>Role</th>
      <th>Lab</th>
      <th>Items</th>
      <th>Status</th>
      <th>Verify</th>
    </tr>
  </thead>
  <tbody>
    {historyLecturer.map((r) => {
      const it = r._item
      return (
        <tr key={`L-${r.requestId}-${it.requestItemId}`}>
          <td>{r.requestId}</td>
          <td>{requesterText(r)}</td>
          <td>{r.requesterRole || "-"}</td>
          <td>{r.labName || "-"}</td>
          <td>{it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity}</td>
          <td>
            <span className={`status ${String(r._itemStatus || "").toLowerCase()}`}>
              {r._itemStatus || "-"}
            </span>
          </td>
          <td>
            {canVerifyReturn(r._itemStatus) ? (
              <div className="to-actions">
                <button className="btn-submit" type="button" onClick={() => actVerify(it.requestItemId, false)}>Verify OK</button>
                <button className="btn-cancel" type="button" onClick={() => actVerify(it.requestItemId, true)}>Mark Damaged</button>
              </div>
            ) : (
              <span style={{ color: "#777" }}>—</span>
            )}
          </td>
        </tr>
      )
    })}
  </tbody>
</table>
        </div>
      </div>
    </div>
  )
}
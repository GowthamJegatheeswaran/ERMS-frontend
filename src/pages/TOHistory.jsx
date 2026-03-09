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

  // Load all history
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
  }, [])

  // Flatten history: one row per equipment item
  const flatHistory = useMemo(() => {
    const doneStatuses = new Set(["RETURN_REQUESTED", "RETURN_VERIFIED", "DAMAGED_REPORTED"])
    const out = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        if (!doneStatuses.has(String(it?.itemStatus || ""))) continue
        out.push({ ...r, _item: it })
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  // Split by roles
  const historyStudentInstructor = useMemo(
    () => flatHistory.filter(r => ["STUDENT", "INSTRUCTOR", "STAFF"].includes((r.requesterRole || "").toUpperCase())),
    [flatHistory]
  )

  const historyLecturer = useMemo(
    () => flatHistory.filter(r => (r.requesterRole || "").toUpperCase() === "LECTURER"),
    [flatHistory]
  )

  const requesterText = r => r.requesterRegNo || r.requesterFullName || "-"
  const canVerify = status => status === "RETURN_REQUESTED"

  const actVerify = async (requestItemId, damaged) => {
    setError("")
    try {
      await ToRequestAPI.verifyReturnItem(requestItemId, damaged)
      await load()
    } catch (e) {
      setError(e?.message || "Verify return failed")
    }
  }

  // Render a flat table
  const renderTable = (data, emptyMsg) => (
    <table className="requests-table">
      <thead>
        <tr>
          <th>Request_ID</th>
          <th>Requester</th>
          <th>Role</th>
          <th>Lab</th>
          <th>Item</th>
          <th>From</th>
          <th>To</th>
          <th>Status</th>
          <th>Verify</th>
        </tr>
      </thead>
      <tbody>
        {data.map(r => (
          <tr key={`${r.requestId}-${r._item.requestItemId}`}>
            <td style={{ textAlign: "center" }}>{r.requestId}</td>
            <td>{requesterText(r)}</td>
            <td style={{ textAlign: "center" }}>{r.requesterRole || "-"}</td>
            <td>{r.labName || "-"}</td>
            <td>{r._item.equipmentName || `Equipment #${r._item.equipmentId}`} × {r._item.quantity}</td>
            <td style={{ textAlign: "center" }}>{r.fromDate || "-"}</td>
            <td style={{ textAlign: "center" }}>{r.toDate || "-"}</td>
            <td>
              <span className={`status ${String(r._item.itemStatus || "").toLowerCase()}`}>
                {r._item.itemStatus || "-"}
              </span>
            </td>
            <td style={{ textAlign: "center" }}>
              {canVerify(r._item.itemStatus) ? (
                <div className="to-actions" style={{ justifyContent: "center" }}>
                  <button className="btn-submit" onClick={() => actVerify(r._item.requestItemId, false)}>Verify OK</button>
                  <button className="btn-cancel" onClick={() => actVerify(r._item.requestItemId, true)}>Mark Damaged</button>
                </div>
              ) : (
                <span style={{ color: "#777" }}>—</span>
              )}
            </td>
          </tr>
        ))}
        {data.length === 0 && !loading && (
          <tr>
            <td colSpan="9" style={{ textAlign: "center", color: "#777" }}>{emptyMsg}</td>
          </tr>
        )}
      </tbody>
    </table>
  )

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <h3 style={{ marginTop: 12, marginBottom: 10 }}>Student/Instructor History</h3>
          {renderTable(historyStudentInstructor, "No returned records")}

          <h3 style={{ marginTop: 22, marginBottom: 10 }}>Lecturer History</h3>
          {renderTable(historyLecturer, "No lecturer records")}
        </div>
      </div>
    </div>
  )
}
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

  // Load history
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

  useEffect(() => { load() }, [])

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

  // Split by role
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

  // Render card layout for history
  const renderCards = (data) => {
    if (!data || data.length === 0) return <div className="no-records">No records</div>

    return (
      <div className="history-cards">
        {data.map(r => (
          <div key={`${r.requestId}-${r._item.requestItemId}`} className="history-card">
            <div className="card-row">
              <strong>Request ID:</strong> {r.requestId}
              <strong>Requester:</strong> {requesterText(r)}
              <strong>Role:</strong> {r.requesterRole || "-"}
            </div>
            <div className="card-row">
              <strong>Lab:</strong> {r.labName || "-"}
              <strong>Item:</strong> {r._item.equipmentName || `Equipment #${r._item.equipmentId}`} × {r._item.quantity}
            </div>
            <div className="card-row">
              <strong>From:</strong> {r.fromDate || "-"}
              <strong>To:</strong> {r.toDate || "-"}
              <strong>Status:</strong>
              <span className={`status ${String(r._item.itemStatus || "").toLowerCase()}`}>
                {r._item.itemStatus || "-"}
              </span>
            </div>
            {canVerify(r._item.itemStatus) && (
              <div className="card-row actions">
                <button className="btn-submit" onClick={() => actVerify(r._item.requestItemId, false)}>Verify OK</button>
                <button className="btn-cancel" onClick={() => actVerify(r._item.requestItemId, true)}>Mark Damaged</button>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <h3 style={{ marginTop: 12, marginBottom: 10 }}>Student/Instructor History</h3>
          {renderCards(historyStudentInstructor)}

          <h3 style={{ marginTop: 22, marginBottom: 10 }}>Lecturer History</h3>
          {renderCards(historyLecturer)}
        </div>
      </div>
    </div>
  )
}
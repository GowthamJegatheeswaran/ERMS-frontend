import { useEffect, useMemo, useState } from "react"
import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { StudentRequestAPI } from "../api/api"

export default function History() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const role = (localStorage.getItem("role") || "student").toLowerCase()
  const title = role === "instructor" || role === "staff" ? "Instructor" : "Student"

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await StudentRequestAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter only returned/done items
  const history = useMemo(() => {
    const doneStatuses = new Set(["REJECTED_BY_LECTURER",
      "RETURN_VERIFIED",
      "DAMAGED_REPORTED",])
    const flat = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        if (doneStatuses.has(it?.itemStatus)) {
          flat.push({ ...r, _item: it, _itemStatus: it.itemStatus })
        }
      }
    }
    return flat.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const renderItems = (r) => {
    const it = r?._item
    if (!it) return <span style={{ color: "#777" }}>—</span>
    return (
      <div>
        {it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity ?? "-"}
      </div>
    )
  }

  // Map API status to CSS class for color
  const getStatusClass = (status) => {
    const map = {
      REJECTED_BY_LECTURER: "rejected_by_lecturer",
      APPROVED: "approved",
      RETURN_REQUESTED: "returnrequested",
      RETURN_VERIFIED: "returned",
      DAMAGED_REPORTED: "rejected",
      PENDING: "pending",
      REJECTED: "rejected",
    }
    return map[status?.trim()] || "status-default"
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table view-requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Lab</th>
                <th>Lecturer</th>
                <th>Items</th>
                <th style={{ textAlign: "center" }}>From</th>
                <th style={{ textAlign: "center" }}>To</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>

            <tbody>
              {history.map((r) => (
                <tr key={`${r.requestId}-${r?._item?.requestItemId || "x"}`}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{r.labName || "-"}</td>
                  <td>{r.lecturerName || "-"}</td>
                  <td>{renderItems(r)}</td>
                  <td style={{ textAlign: "center" }}>{r.fromDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>{r.toDate || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${getStatusClass(r._itemStatus)}`}>
                      {r._itemStatus || "-"}
                    </span>
                  </td>
                </tr>
              ))}

              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No returned requests yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
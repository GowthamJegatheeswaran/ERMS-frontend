import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { StudentRequestAPI } from "../api/api"

export default function InstructorHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

  const itemsHistory = useMemo(() => {
    const historyStatuses = new Set([
      "REJECTED_BY_LECTURER",
      "RETURN_REQUESTED",
      "RETURN_VERIFIED",
      "DAMAGED_REPORTED",
    ])
    const flat = []

    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        const st = String(it?.itemStatus || "")
        if (!historyStatuses.has(st)) continue
        flat.push({ ...r, _item: it, _itemStatus: st })
      }
    }

    return flat.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const statusText = (st) => {
    const s = String(st || "")
    if (s === "REJECTED_BY_LECTURER") return "Rejected"
    if (s === "RETURN_REQUESTED") return "Waiting TO verify"
    if (s === "RETURN_VERIFIED") return "Return verified"
    if (s === "DAMAGED_REPORTED") return "Damage reported"
    return s || "-"
  }

  const renderEquipment = (r) => {
    const it = r?._item
    if (!it) return <span style={{ color: "#777" }}>—</span>

    return (
      <div>
        <div>
          {it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity ?? "-"}
        </div>
        <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{statusText(r._itemStatus)}</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginBottom: 15 }}>History</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ color: "red", marginBottom: 10 }}>
              {error}
            </div>
          )}

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Equipment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {itemsHistory.map((r) => (
                <tr key={`${r.requestId}-${r?._item?.requestItemId || "x"}`}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{renderEquipment(r)}</td>
                  <td style={{ textAlign: "center" }}>{statusText(r._itemStatus)}</td>
                  <td style={{ textAlign: "center" }}>{r.toDate || r.fromDate || "-"}</td>
                </tr>
              ))}

              {itemsHistory.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No rejected or returned requests yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />© Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

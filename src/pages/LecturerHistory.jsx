import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { LecturerRequestAPI } from "../api/api"

export default function LecturerHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await LecturerRequestAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load lecturer history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const history = useMemo(() => {
    const done = new Set(["RETURN_VERIFIED", "DAMAGED_REPORTED"])
    const flat = []
    for (const r of rows || []) {
      for (const it of Array.isArray(r?.items) ? r.items : []) {
        const st = String(it?.itemStatus || "")
        if (!done.has(st)) continue
        flat.push({ ...r, _item: it, _itemStatus: st })
      }
    }
    return flat.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const renderItem = (r) => {
    const it = r?._item
    if (!it) return <span style={{ color: "#777" }}>—</span>
    return (
      <div>
        {it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity ?? "-"}
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
            <h2 style={{ marginBottom: 12 }}>My History</h2>
            <button className="btn-submit" type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Lab</th>
                <th>Purpose</th>
                <th>Items</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={`${r.requestId}-${r?._item?.requestItemId || "x"}`}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{r.labName || "-"}</td>
                  <td>{r.purpose || "-"}</td>
                  <td>{renderItem(r)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r._itemStatus || "").toLowerCase()}`}>{r._itemStatus || "-"}</span>
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    {loading ? "Loading..." : "No history"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />
          © Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}

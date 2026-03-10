import "../styles/toDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useState } from "react"
import { ToPurchaseAPI } from "../api/api"

export default function TOPurchase() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await ToPurchaseAPI.my()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const fmt = (d) => (d ? String(d) : "-")

  const statusColorMap = {
    pending: "#f59e0b",
    approved: "#16a34a",
    issued: "#2563eb",
    accepted: "#1e40af",
    returnrequested: "#f97316",
    returned: "#6b7280",
    rejected: "#dc2626",
    default: "#6b7280",
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginBottom: 12 }}>My Purchase Requests</h2>
            <button className="btn-primary" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          {rows.length === 0 && !loading && (
            <div className="no-items">No purchase requests yet</div>
          )}

          {rows
            .sort((a, b) => (b.id || 0) - (a.id || 0))
            .map((p) => (
              <div key={p.id} className="history-card">
                <div className="history-grid">
                  <div className="history-left">
                    <div><strong>Purchase ID:</strong> {p.id}</div>
                    <div><strong>Requested Date:</strong> {fmt(p.createdDate)}</div>
                    <div><strong>Received Date:</strong> {fmt(p.receivedDate)}</div>
                  </div>

                  <div className="history-right">
                    <div>
                      <strong>Items:</strong>
                      <ul style={{ paddingLeft: "16px", margin: "4px 0" }}>
                        {(p.items || []).map((it, idx) => (
                          <li key={`${p.id}-${idx}`}>
                            {it.equipmentName} × {(it.quantityRequested ?? it.quantity)}
                          </li>
                        ))}
                        {(!p.items || p.items.length === 0) && <li>-</li>}
                      </ul>
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <span
                        className="status"
                        style={{
                          backgroundColor: statusColorMap[String(p.status || "").toLowerCase()] || statusColorMap.default,
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {p.status || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
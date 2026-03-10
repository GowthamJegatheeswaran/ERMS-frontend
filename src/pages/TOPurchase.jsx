import "../styles/toDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { ToPurchaseAPI } from "../api/api"

export default function TOPurchase() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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

  // Flatten rows to individual items
  const sorted = useMemo(() => {
    const out = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        out.push({ ...r, _item: it })
      }
    }
    return out.sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [rows])

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
          </div>

          {error && <div className="error-message">{error}</div>}

          {sorted.length === 0 && !loading && (
            <div className="no-items">No purchase requests yet</div>
          )}

          {sorted.map((p) => {
            const item = p._item
            const bgColor = statusColorMap[String(p.status || "").toLowerCase()] || statusColorMap.default

            return (
              <div key={`${p.id}-${item.equipmentId}`} className="history-card">
                <div className="history-grid">
                  <div className="history-left">
                    <div><strong>Purchase ID:</strong> {p.id}</div>
                    <div><strong>Requested Date:</strong> {fmt(p.createdDate)}</div>
                    <div><strong>Received Date:</strong> {fmt(p.receivedDate)}</div>
                  </div>
                  <div className="history-right">
                    <div><strong>Item:</strong> {item.equipmentName} × {(item.quantityRequested ?? item.quantity)}</div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <span className="status" style={{ backgroundColor: bgColor, color: "#fff" }}>
                        {p.status || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
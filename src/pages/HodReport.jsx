import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { HodDepartmentAPI } from "../api/api"

// HOD Report (Report_01): department overview + lab buttons
export default function HodReport() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [requests, setRequests] = useState([])

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await HodDepartmentAPI.requests()
      setRequests(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const { overview, labs } = useMemo(() => {
    const toDate = (s) => {
      const d = new Date(s)
      return isNaN(d.getTime()) ? null : d
    }

    const now = new Date()
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const lastMonthReq = requests.filter((r) => {
      const d = toDate(r.fromDate)
      return d && d >= last30 && d <= now
    })

    const lower = (x) => String(x || "").toLowerCase()
    const pending = lastMonthReq.filter((r) => lower(r.status).includes("pending")).length
    const accepted = lastMonthReq.filter((r) => lower(r.status).includes("approved") || lower(r.status).includes("issued") || lower(r.status).includes("to_processing")).length

    let returned = 0
    let nonReturned = 0
    for (const r of lastMonthReq) {
      for (const it of r.items || []) {
        if (it.returned) returned += 1
        else nonReturned += 1
      }
    }

    const labMap = new Map()
    for (const r of requests) {
      if (!labMap.has(r.labId)) labMap.set(r.labId, { labId: r.labId, labName: r.labName })
    }

    return {
      overview: {
        total: lastMonthReq.length,
        pending,
        accepted,
        returned,
        nonReturned,
      },
      labs: Array.from(labMap.values()).sort((a, b) => String(a.labName).localeCompare(String(b.labName))),
    }
  }, [requests])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2>Report</h2>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                fontSize: "12px",
                backgroundColor: "#2f64d6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              🔄 {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <table className="requests-table" style={{ marginBottom: 18 }}>
            <thead>
              <tr>
                <th>Total Requests From Last Month</th>
                <th style={{ textAlign: "center" }}>Pending requests</th>
                <th style={{ textAlign: "center" }}>Accepted requests</th>
                <th style={{ textAlign: "center" }}>Returned</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "center" }}>{overview.total}</td>
                <td style={{ textAlign: "center" }}>{overview.pending}</td>
                <td style={{ textAlign: "center" }}>{overview.accepted}</td>
                <td style={{ textAlign: "center" }}>{overview.returned}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", marginBottom: 18 }}>
            <div style={{ width: 260, height: 180, borderRadius: 10, background: "#f3f4f6", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Requests</div>
              <div style={{ fontSize: 13, color: "#555" }}>Accepted: {overview.accepted}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Pending: {overview.pending}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Rejected: {Math.max(0, overview.total - overview.accepted - overview.pending)}</div>
            </div>

            <div style={{ width: 260, height: 180, borderRadius: 10, background: "#f3f4f6", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Returns</div>
              <div style={{ fontSize: 13, color: "#555" }}>Returned: {overview.returned}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Non-Returned: {overview.nonReturned}</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16 }}>
            {labs.map((l) => (
              <div key={l.labId} style={{ minWidth: 220, border: "1px solid #dbe3f0", borderRadius: 10, padding: 14, background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, textAlign: "center" }}>{l.labName}</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => navigate(`/hod-report-lab/${l.labId}`)} style={{ minWidth: 90 }}>
                    Open
                  </button>
                </div>
              </div>
            ))}
            {labs.length === 0 && <div style={{ color: "#555" }}>No labs</div>}
          </div>
        </div>

        <footer>
          Faculty of Engineering | University of Jaffna <br />
          © Copyright 2026. All Rights Reserved - ERS
        </footer>
      </div>
    </div>
  )
}
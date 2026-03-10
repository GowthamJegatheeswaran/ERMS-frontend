import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { CommonAPI, HodDepartmentAPI, HodPurchaseAPI } from "../api/api"
import { buildLabReportData, generateHodLabReportPdf } from "../utils/hodReportPdf"

// HOD Report (Report_02): lab detail view
export default function HodReportLab() {
  const { labId } = useParams()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [requests, setRequests] = useState([])
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [labEquipmentNames, setLabEquipmentNames] = useState([])

  const load = async () => {
    setError("")
    try {
      setLoading(true)

      const [reqList, purchaseList, eqList] = await Promise.all([
        HodDepartmentAPI.requests(),
        HodPurchaseAPI.my(),
        CommonAPI.equipmentByLab(labId),
      ])

      setRequests(Array.isArray(reqList) ? reqList : [])
      setPurchaseRequests(Array.isArray(purchaseList) ? purchaseList : [])
      setLabEquipmentNames(Array.isArray(eqList) ? eqList.map((e) => e?.name).filter(Boolean) : [])
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId])

  const { labName, studentRows, purchaseRows, summary } = useMemo(
    () => buildLabReportData(requests, purchaseRequests, labId, labEquipmentNames),
    [requests, purchaseRequests, labId, labEquipmentNames]
  )

  const handleGeneratePdf = () => {
    try {
      generateHodLabReportPdf({ labName, studentRows, purchaseRows, summary })
    } catch (e) {
      setError(e?.message || "Failed to generate PDF")
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ marginBottom: 12 }}>{labName}</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn-cancel" type="button" onClick={() => navigate("/hod-report")}>Back</button>
              <button className="btn-submit" type="button" onClick={handleGeneratePdf}>Generate PDF</button>
              <button className="btn-submit" type="button" onClick={load} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <h3 style={{ marginTop: 6 }}>Student Details</h3>
          <table className="requests-table" style={{ marginBottom: 18 }}>
            <thead>
              <tr>
                <th>Requester Name</th>
                <th>Reg_No</th>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Returned/Non-Returned</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((r) => (
                <tr key={r.key}>
                  <td>{r.requesterName}</td>
                  <td style={{ textAlign: "center" }}>{r.regNo}</td>
                  <td>{r.equipment}</td>
                  <td style={{ textAlign: "center" }}>{String(r.quantity).padStart(2, "0")}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {r.returned === "Returned" ? <span className="status returned">Returned</span> : "Non-Returned"}
                  </td>
                </tr>
              ))}
              {studentRows.length === 0 && !loading && (
                <tr><td colSpan="6" style={{ textAlign: "center" }}>No records</td></tr>
              )}
            </tbody>
          </table>

          <h3 style={{ marginTop: 6 }}>Purchase List</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Requested_Date</th>
                <th style={{ textAlign: "center" }}>Received_Date</th>
              </tr>
            </thead>
            <tbody>
              {purchaseRows.map((p, idx) => (
                <tr key={`${p.equipment}-${idx}`}>
                  <td>{p.equipment}</td>
                  <td style={{ textAlign: "center" }}>{String(p.quantity).padStart(2, "0")}</td>
                  <td style={{ textAlign: "center" }}>{p.requestedDate}</td>
                  <td style={{ textAlign: "center" }}>{p.receivedDate}</td>
                </tr>
              ))}
              {purchaseRows.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center" }}>No purchase records</td></tr>
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
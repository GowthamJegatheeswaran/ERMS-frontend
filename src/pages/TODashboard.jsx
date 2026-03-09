import "../styles/toDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { ToRequestAPI } from "../api/api"
import { AiOutlineCheck, AiOutlineClockCircle, AiOutlineClose } from "react-icons/ai"

export default function TOApprovalRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Load requests
  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const list = await ToRequestAPI.all()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Flatten rows: one per equipment item
  const sorted = useMemo(() => {
    const out = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        out.push({ ...r, _item: it })
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const fmt = (d) => (d ? String(d) : "-")
  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-"

  const canIssue = (itemStatus) =>
    ["APPROVED_BY_LECTURER", "WAITING_TO_ISSUE"].includes(String(itemStatus || ""))
  const canVerifyReturn = (itemStatus) => String(itemStatus || "") === "RETURN_REQUESTED"

  const actIssue = async (requestItemId) => {
    setError("")
    try {
      await ToRequestAPI.issueItem(requestItemId)
      await load()
    } catch (e) {
      setError(e?.message || "Issue failed")
    }
  }

  const actWait = async (requestItemId) => {
    const reason = window.prompt("Enter reason to wait (optional):", "")
    if (reason === null) return
    setError("")
    try {
      await ToRequestAPI.waitItem(requestItemId, reason)
      await load()
    } catch (e) {
      setError(e?.message || "Wait action failed")
    }
  }

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

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requester</th>
                <th>Lab</th>
                <th>Item</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const it = r._item
                const statusClass = it?.itemStatus ? String(it.itemStatus).toLowerCase() : "status-default"
                return (
                  <tr key={`${r.requestId}-${it.requestItemId}`}>
                    <td>{r.requestId}</td>
                    <td>{requesterText(r)}</td>
                    <td>{r.labName || "-"}</td>
                    <td>{it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity}</td>
                    <td>{fmt(r.fromDate)}</td>
                    <td>{fmt(r.toDate)}</td>
                    <td>
                      <span className={`status ${statusClass}`}>
                        {it.itemStatus || "-"}
                      </span>
                    </td>
                    <td>
                      {canIssue(it.itemStatus) && (
                        <div className="to-actions">
                          <button onClick={() => actIssue(it.requestItemId)}><AiOutlineCheck /> Issue</button>
                          <button onClick={() => actWait(it.requestItemId)}><AiOutlineClockCircle /> Wait</button>
                        </div>
                      )}
                      {canVerifyReturn(it.itemStatus) && (
                        <div className="to-actions">
                          <button onClick={() => actVerify(it.requestItemId, false)}><AiOutlineCheck /> Verify OK</button>
                          <button onClick={() => actVerify(it.requestItemId, true)}><AiOutlineClose /> Mark Damaged</button>
                        </div>
                      )}
                      {!canIssue(it.itemStatus) && !canVerifyReturn(it.itemStatus) && (
                        <span style={{ color: "#777" }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>No requests</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
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

  const sorted = useMemo(() => {
    const out = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        const st = String(it?.itemStatus || "")
        out.push({ ...r, _item: it })
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const fmt = (d) => (d ? String(d) : "-")
  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-"

  const canIssue = (itemStatus) => {
    const s = String(itemStatus || "")
    return s === "APPROVED_BY_LECTURER" || s === "WAITING_TO_ISSUE"
  }
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

  const renderItems = (r) => {
    const it = r?._item
    if (!it) return "-"

    return (
      <div className="item-row">
        <div>{it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity}</div>

        {(canIssue(it.itemStatus) || canVerifyReturn(it.itemStatus)) && (
          <div className="to-actions">
            {canIssue(it.itemStatus) && (
              <>
                <button onClick={() => actIssue(it.requestItemId)}>
                  <AiOutlineCheck /> Issue
                </button>
                <button onClick={() => actWait(it.requestItemId)}>
                  <AiOutlineClockCircle /> Wait
                </button>
              </>
            )}
            {canVerifyReturn(it.itemStatus) && (
              <>
                <button onClick={() => actVerify(it.requestItemId, false)}>
                  <AiOutlineCheck /> Verify OK
                </button>
                <button onClick={() => actVerify(it.requestItemId, true)}>
                  <AiOutlineClose /> Mark Damaged
                </button>
              </>
            )}
          </div>
        )}
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

          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requester</th>
                <th>Lab</th>
                <th>Items</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sorted.map((r) => {
                const statusClass = r?._item?.itemStatus
                  ? String(r._item.itemStatus).toLowerCase()
                  : "status-default"
                return (
                  <tr key={`${r.requestId}-${r?._item?.requestItemId}`}>
                    <td>{r.requestId}</td>
                    <td>{requesterText(r)}</td>
                    <td>{r.labName || "-"}</td>
                    <td>{renderItems(r)}</td>
                    <td>{fmt(r.fromDate)}</td>
                    <td>{fmt(r.toDate)}</td>
                    <td>
                      <span className={`status ${statusClass}`}>
                        {r?._item?.itemStatus || "-"}
                      </span>
                    </td>
                    <td>{/* Actions are now inside renderItems */}</td>
                  </tr>
                )
              })}

              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No requests
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
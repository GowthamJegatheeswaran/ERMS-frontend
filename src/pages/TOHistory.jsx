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

  useEffect(() => {
    load()
  }, [])

  const history = useMemo(() => {
    const itemDone = new Set(["RETURN_REQUESTED", "RETURN_VERIFIED", "DAMAGED_REPORTED"])
    const flat = []
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : []
      for (const it of items) {
        if (!itemDone.has(String(it?.itemStatus || ""))) continue
        flat.push({ ...r, _item: it, _itemStatus: String(it?.itemStatus || "") })
      }
    }
    return flat.sort((a, b) => (b.requestId || 0) - (a.requestId || 0))
  }, [rows])

  const historyStudentInstructor = useMemo(() =>
    history.filter((r) => {
      const role = String(r.requesterRole || "").toUpperCase()
      return role === "STUDENT" || role === "INSTRUCTOR" || role === "STAFF"
    }), [history]
  )

  const historyLecturer = useMemo(() =>
    history.filter((r) => String(r.requesterRole || "").toUpperCase() === "LECTURER"), [history]
  )

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-"
  const renderItems = (r) => {
    const it = r?._item
    if (!it) return <span style={{ color: "#777" }}>—</span>
    return <div>{it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity ?? "-"}</div>
  }

  const canVerifyReturn = (itemStatus) => String(itemStatus || "") === "RETURN_REQUESTED"
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
          <h2 className="welcome">TO History</h2>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          <h3 style={{ marginTop: 12, marginBottom: 10 }}>Student/Instructor History</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requester</th>
                <th>Role</th>
                <th>Lab</th>
                <th>Items</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Verify</th>
              </tr>
            </thead>
            <tbody>
              {historyStudentInstructor.map((r) => (
                <tr key={`${r.requestId}-${r?._item?.requestItemId || "x"}`}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{requesterText(r)}</td>
                  <td style={{ textAlign: "center" }}>{r.requesterRole || "-"}</td>
                  <td>{r.labName || "-"}</td>
                  <td>{renderItems(r)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r._itemStatus || "").toLowerCase()}`}>
                      {r._itemStatus || "-"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {canVerifyReturn(r._itemStatus) ? (
                      <div className="to-actions" style={{ justifyContent: "center" }}>
                        <button className="btn-submit" type="button" onClick={() => actVerify(r?._item?.requestItemId, false)}>Verify OK</button>
                        <button className="btn-cancel" type="button" onClick={() => actVerify(r?._item?.requestItemId, true)}>Mark Damaged</button>
                      </div>
                    ) : <span style={{ color: "#777" }}>—</span>}
                  </td>
                </tr>
              ))}
              {historyStudentInstructor.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>No returned records</td>
                </tr>
              )}
            </tbody>
          </table>

          <h3 style={{ marginTop: 22, marginBottom: 10 }}>Lecturer History</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request_ID</th>
                <th>Requester</th>
                <th>Role</th>
                <th>Lab</th>
                <th>Items</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Verify</th>
              </tr>
            </thead>
            <tbody>
              {historyLecturer.map((r) => (
                <tr key={`L-${r.requestId}-${r?._item?.requestItemId || "x"}`}>
                  <td style={{ textAlign: "center" }}>{r.requestId}</td>
                  <td>{requesterText(r)}</td>
                  <td style={{ textAlign: "center" }}>{r.requesterRole || "-"}</td>
                  <td>{r.labName || "-"}</td>
                  <td>{renderItems(r)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status ${String(r._itemStatus || "").toLowerCase()}`}>
                      {r._itemStatus || "-"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {canVerifyReturn(r._itemStatus) ? (
                      <div className="to-actions" style={{ justifyContent: "center" }}>
                        <button className="btn-submit" type="button" onClick={() => actVerify(r?._item?.requestItemId, false)}>Verify OK</button>
                        <button className="btn-cancel" type="button" onClick={() => actVerify(r?._item?.requestItemId, true)}>Mark Damaged</button>
                      </div>
                    ) : <span style={{ color: "#777" }}>—</span>}
                  </td>
                </tr>
              ))}
              {historyLecturer.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>No lecturer records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
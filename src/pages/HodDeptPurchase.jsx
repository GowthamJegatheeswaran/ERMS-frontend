import "../styles/hodDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { HodPurchaseAPI } from "../api/api"
import { AiOutlineCheck, AiOutlineClose, AiOutlineInbox } from "react-icons/ai"

export default function HodDeptPurchase() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [issuedRows, setIssuedRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setError("")
    try {
      setLoading(true)
      const [pending, all] = await Promise.all([HodPurchaseAPI.pending(), HodPurchaseAPI.my()])
      setRows(Array.isArray(pending) ? pending : [])
      const issued = (Array.isArray(all) ? all : []).filter((x) => String(x.status) === "ISSUED_BY_ADMIN")
      setIssuedRows(issued)
    } catch (e) {
      setError(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const decide = async (id, approve) => {
    setError("")
    try {
      setLoading(true)
      await HodPurchaseAPI.decision({ id, approve, comment: "" })
      await load()
    } catch (e) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  const receive = async (id) => {
    setError("")
    try {
      setLoading(true)
      await HodPurchaseAPI.receive(id)
      await load()
    } catch (e) {
      setError(e?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  const sorted = useMemo(() => [...rows].sort((a, b) => (b.id || 0) - (a.id || 0)), [rows])
  const sortedIssued = useMemo(() => [...issuedRows].sort((a, b) => (b.id || 0) - (a.id || 0)), [issuedRows])

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">

          {/* Page Header */}
          <div className="dept-purchase-header">
            <div>
              <h2 className="welcome" style={{ marginBottom: 4 }}>Department Equipment Requests</h2>
              <p className="dept-purchase-flow">
                TO Request &rarr; <strong>HOD Approve</strong> &rarr; Admin Issue &rarr; <strong>HOD Confirm Received</strong>
              </p>
            </div>
            <div className="dept-purchase-counts">
              <div className="dept-count-badge pending-count">
                <span>{sorted.length}</span>
                <label>Pending</label>
              </div>
              <div className="dept-count-badge issued-count">
                <span>{sortedIssued.length}</span>
                <label>To Receive</label>
              </div>
            </div>
          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 12 }}>{error}</div>}

          {/* ── SECTION 1: Pending Approval ── */}
          <h3 className="dept-section-title">Pending Approval</h3>

          {loading && <div className="dept-loading">Loading...</div>}

          {!loading && sorted.length === 0 && (
            <div className="dept-empty">No pending requests</div>
          )}

          {!loading && sorted.map((p) => (
            <div key={p.id} className="dept-card">
              <div className="dept-card-grid">
                <div className="dept-card-left">
                  <div><strong>Request ID:</strong> #{p.id}</div>
                  <div><strong>Requested By:</strong> {p.toName || "-"}</div>
                  <div><strong>Date:</strong> {p.createdDate || "-"}</div>
                </div>
                <div className="dept-card-right">
                  <div className="dept-card-items-label">Items</div>
                  {(p.items || []).length === 0 ? (
                    <div className="dept-card-no-items">No items</div>
                  ) : (
                    (p.items || []).map((it, idx) => (
                      <div key={idx} className="dept-card-item">
                        <span className="dept-item-dot" />
                        {it.equipmentName} &times; {it.quantityRequested}
                      </div>
                    ))
                  )}
                </div>
                <div className="dept-card-status-col">
                  <span className={`status ${String(p.status || "").toLowerCase()}`}>
                    {p.status || "-"}
                  </span>
                </div>
              </div>
              <div className="dept-card-actions">
                <button
                  className="dept-btn-approve"
                  type="button"
                  onClick={() => decide(p.id, true)}
                  disabled={loading}
                >
                  <AiOutlineCheck size={15} /> Approve
                </button>
                <button
                  className="dept-btn-reject"
                  type="button"
                  onClick={() => decide(p.id, false)}
                  disabled={loading}
                >
                  <AiOutlineClose size={15} /> Reject
                </button>
              </div>
            </div>
          ))}

          {/* ── SECTION 2: Issued — Confirm Received ── */}
          <h3 className="dept-section-title" style={{ marginTop: 36 }}>Issued — Confirm Received</h3>
          <p className="dept-purchase-flow" style={{ marginBottom: 16 }}>
            Admin has issued these purchases. Confirm receipt to update inventory.
          </p>

          {!loading && sortedIssued.length === 0 && (
            <div className="dept-empty">No issued purchases awaiting confirmation</div>
          )}

          {!loading && sortedIssued.map((p) => (
            <div key={`issued-${p.id}`} className="dept-card issued">
              <div className="dept-card-grid">
                <div className="dept-card-left">
                  <div><strong>Purchase ID:</strong> #{p.id}</div>
                  <div><strong>Requested By:</strong> {p.requestedByName || "-"}</div>
                  <div><strong>Requested:</strong> {p.createdDate || "-"}</div>
                  <div><strong>Issued Date:</strong> {p.issuedDate || "-"}</div>
                </div>
                <div className="dept-card-right">
                  <div className="dept-card-items-label">Items</div>
                  {(p.items || []).length === 0 ? (
                    <div className="dept-card-no-items">No items</div>
                  ) : (
                    (p.items || []).map((it, idx) => (
                      <div key={idx} className="dept-card-item">
                        <span className="dept-item-dot" />
                        {it.equipmentName} &times; {it.quantityRequested ?? it.quantity}
                      </div>
                    ))
                  )}
                </div>
                <div className="dept-card-status-col">
                  <span className="status issued_by_admin">ISSUED_BY_ADMIN</span>
                </div>
              </div>
              <div className="dept-card-actions">
                <button
                  className="dept-btn-confirm"
                  type="button"
                  onClick={() => receive(p.id)}
                  disabled={loading}
                >
                  <AiOutlineInbox size={15} /> Confirm Received
                </button>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}
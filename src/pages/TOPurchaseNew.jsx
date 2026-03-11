import "../styles/dashboard.css"
import "../styles/toTheme.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthAPI, CommonAPI, ToPurchaseAPI } from "../api/api"
import { AiOutlinePlus, AiOutlineDelete, AiOutlineArrowLeft } from "react-icons/ai"

/*
 * LabDTO returned by CommonAPI.labs():
 *   { id, name, department, technicalOfficerId }   ← note: technicalOfficerId, NOT technicalOfficer.id
 *
 * EquipmentPublicDTO returned by CommonAPI.equipmentByLab():
 *   { id, name, category, itemType, totalQty, availableQty, active, labId }
 *
 * NewPurchaseRequestDTO submitted to ToPurchaseAPI.submit():
 *   { reason: string, items: [{ equipmentId, quantityRequested, remark }] }
 */

export default function TOPurchaseNew() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [me,          setMe]          = useState(null)

  /* Labs assigned to this TO */
  const [labs,        setLabs]        = useState([])
  const [labsLoading, setLabsLoading] = useState(false)
  const [labId,       setLabId]       = useState("")

  /* Equipment in the selected lab */
  const [equips,      setEquips]      = useState([])
  const [equipLoading,setEquipLoading]= useState(false)
  const [equipId,     setEquipId]     = useState("")
  const [qty,         setQty]         = useState("1")

  /* Request fields */
  const [reason,      setReason]      = useState("")
  const [items,       setItems]       = useState([])

  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState("")
  const [success,     setSuccess]     = useState(false)

  /* Load current user then filter labs by technicalOfficerId */
  useEffect(() => {
    setLabsLoading(true)
    ;(async () => {
      try {
        const meData = await AuthAPI.me()
        setMe(meData)
        const allLabs = await CommonAPI.labs(meData.department)
        /* LabDTO.technicalOfficerId — compare as string to be safe */
        const myLabs = (Array.isArray(allLabs) ? allLabs : [])
          .filter(l => String(l.technicalOfficerId) === String(meData.id))
        setLabs(myLabs)
        if (myLabs.length > 0) setLabId(String(myLabs[0].id))
      } catch (e) {
        setError(e?.message || "Failed to load labs")
      } finally {
        setLabsLoading(false)
      }
    })()
  }, [])

  /* Load equipment when lab changes */
  useEffect(() => {
    if (!labId) { setEquips([]); setEquipId(""); return }
    setEquipLoading(true)
    CommonAPI.equipmentByLab(labId)
      .then(list => {
        const active = (Array.isArray(list) ? list : []).filter(e => e.active !== false)
        setEquips(active)
        setEquipId(active.length > 0 ? String(active[0].id) : "")
      })
      .catch(e => setError(e?.message || "Failed to load equipment"))
      .finally(() => setEquipLoading(false))
  }, [labId])

  const selectedEquip = useMemo(
    () => equips.find(e => String(e.id) === String(equipId)),
    [equips, equipId]
  )

  /* Add item to request list */
  const handleAddItem = () => {
    setError("")
    if (!equipId) return setError("Please select equipment")
    const q = Number(qty)
    if (!q || !Number.isInteger(q) || q < 1) return setError("Quantity must be a positive whole number")

    setItems(prev => {
      const existing = prev.find(it => String(it.equipmentId) === String(equipId))
      if (existing) {
        return prev.map(it =>
          String(it.equipmentId) === String(equipId)
            ? { ...it, quantityRequested: it.quantityRequested + q }
            : it
        )
      }
      return [...prev, {
        equipmentId:       Number(equipId),
        equipmentName:     selectedEquip?.name || `Equipment #${equipId}`,
        quantityRequested: q,
        remark:            "",
      }]
    })
    setQty("1")
  }

  const removeItem = (equipmentId) =>
    setItems(prev => prev.filter(it => String(it.equipmentId) !== String(equipmentId)))

  /* Submit */
  const handleSubmit = async () => {
    if (items.length === 0) return setError("Add at least one equipment item")
    setError("")
    setSubmitting(true)
    try {
      await ToPurchaseAPI.submit({
        reason: reason.trim(),
        items:  items.map(it => ({
          equipmentId:       it.equipmentId,
          quantityRequested: it.quantityRequested,
          remark:            it.remark || "",
        })),
      })
      setSuccess(true)
    } catch (e) {
      setError(e?.message || "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  /* Success screen */
  if (success) {
    return (
      <div className="dashboard-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="content">
            <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--to-text)",
                fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 10 }}>
                Purchase Request Submitted!
              </div>
              <div style={{ fontSize: 13.5, color: "var(--to-text-muted)", marginBottom: 24,
                fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Your request has been sent to the HOD for approval. You will be notified when it progresses.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="to-btn to-btn-primary" onClick={() => navigate("/to-purchase")}>
                  View My Purchases
                </button>
                <button className="to-btn to-btn-ghost" onClick={() => {
                  setSuccess(false); setItems([]); setReason(""); setQty("1")
                }}>
                  New Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">

          <div className="to-page-header">
            <div>
              <div className="to-page-title">New Purchase Request</div>
              <div className="to-page-subtitle">
                Request equipment purchases — submitted to HOD for approval
              </div>
            </div>
            <button className="to-btn to-btn-ghost" onClick={() => navigate(-1)}>
              <AiOutlineArrowLeft /> Back
            </button>
          </div>

          {error && <div className="to-alert to-alert-error">{error}</div>}

          {labs.length === 0 && !labsLoading && (
            <div className="to-alert to-alert-amber">
              No labs are assigned to you yet. Contact your HOD to get a lab assigned.
            </div>
          )}

          {labs.length > 0 && (
            <>
              {/* Step 1 — Select & Add Items */}
              <div className="to-form-card">
                <div className="to-form-card-hd">Step 1 — Add Equipment Items</div>
                <div className="to-form-card-body">
                  <div className="to-form-grid-2">
                    <div className="to-form-group">
                      <label className="to-label">Lab *</label>
                      <select className="to-select" value={labId}
                        onChange={e => setLabId(e.target.value)}
                        disabled={labsLoading || submitting}>
                        {labs.map(l => (
                          <option key={l.id} value={String(l.id)}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="to-form-group">
                      <label className="to-label">Equipment *</label>
                      <select className="to-select" value={equipId}
                        onChange={e => setEquipId(e.target.value)}
                        disabled={equipLoading || !labId || submitting}>
                        {equipLoading
                          ? <option>Loading…</option>
                          : equips.length === 0
                            ? <option value="">No equipment found</option>
                            : equips.map(eq => (
                                <option key={eq.id} value={String(eq.id)}>
                                  {eq.name}
                                  {eq.availableQty != null ? ` (Available: ${eq.availableQty})` : ""}
                                </option>
                              ))
                        }
                      </select>
                    </div>

                    <div className="to-form-group">
                      <label className="to-label">Quantity *</label>
                      <input className="to-input" type="number" min="1" value={qty}
                        onChange={e => setQty(e.target.value)}
                        disabled={submitting}
                        placeholder="e.g. 5" />
                    </div>

                    <div className="to-form-group" style={{ justifyContent: "flex-end" }}>
                      <label className="to-label" style={{ visibility: "hidden" }}>Add</label>
                      <button className="to-btn to-btn-primary"
                        onClick={handleAddItem}
                        disabled={submitting || !equipId || equipLoading}
                        type="button">
                        <AiOutlinePlus /> Add Item
                      </button>
                    </div>
                  </div>

                  {/* Selected item preview */}
                  {selectedEquip && (
                    <div style={{ marginTop: 4, padding: "8px 12px", borderRadius: 8,
                      background: "var(--to-blue-pale)", border: "1px solid var(--to-blue-bd)",
                      fontSize: 12, color: "var(--to-blue)", fontFamily: "'Plus Jakarta Sans', sans-serif",
                      display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span><strong>{selectedEquip.name}</strong></span>
                      {selectedEquip.category && <span>Category: {selectedEquip.category}</span>}
                      {selectedEquip.itemType  && <span>Type: {selectedEquip.itemType}</span>}
                      {selectedEquip.availableQty != null && (
                        <span>Available: <strong>{selectedEquip.availableQty}</strong></span>
                      )}
                    </div>
                  )}

                  {/* Items list */}
                  <div className="to-item-list" style={{ marginTop: 16 }}>
                    <div className="to-item-list-hd">
                      Items to Request — {items.length}
                    </div>
                    {items.length === 0
                      ? <div className="to-item-empty">No items added yet</div>
                      : items.map(it => (
                          <div key={it.equipmentId} className="to-item-row">
                            <div>
                              <div className="to-item-name">{it.equipmentName}</div>
                              <div className="to-item-meta">Qty: {it.quantityRequested}</div>
                            </div>
                            <button className="to-btn to-btn-danger to-btn-sm to-btn-icon"
                              onClick={() => removeItem(it.equipmentId)}
                              disabled={submitting} type="button">
                              <AiOutlineDelete />
                            </button>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>

              {/* Step 2 — Reason / Notes */}
              <div className="to-form-card">
                <div className="to-form-card-hd">Step 2 — Reason / Notes</div>
                <div className="to-form-card-body">
                  <div className="to-form-group">
                    <label className="to-label">Reason for Purchase</label>
                    <textarea className="to-textarea" rows={3} value={reason}
                      onChange={e => setReason(e.target.value)}
                      disabled={submitting}
                      placeholder="Briefly describe why this equipment is needed (optional)…" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="to-btn to-btn-ghost" onClick={() => navigate(-1)} type="button"
                  disabled={submitting}>
                  Cancel
                </button>
                <button className="to-btn to-btn-primary" onClick={handleSubmit}
                  disabled={submitting || items.length === 0} type="button">
                  {submitting ? "Submitting…" : "Submit to HOD"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

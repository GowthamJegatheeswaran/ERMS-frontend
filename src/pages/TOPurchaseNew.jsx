import "..styles/TOPurchaseNew.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useEffect, useMemo, useState } from "react";
import { AuthAPI, CommonAPI, ToPurchaseAPI } from "../api/api";

export default function TOPurchaseNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState("");
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [equipmentId, setEquipmentId] = useState("");
  const [qty, setQty] = useState("1");
  const [items, setItems] = useState([]);

  // Load labs assigned to TO
  const loadLabs = async () => {
    setError("");
    try {
      const me = await AuthAPI.me();
      const deptLabs = (await CommonAPI.labs(me.department)) || [];
      const myLabs = deptLabs.filter((l) => String(l.technicalOfficerId) === String(me.id));
      setLabs(myLabs);
      if (myLabs.length) setLabId(String(myLabs[0].id));
    } catch (e) {
      setError(e?.message || "Failed to load labs");
    }
  };

  // Load equipment for selected lab
  const loadEquipment = async (selectedLabId) => {
    if (!selectedLabId) return;
    try {
      const list = (await CommonAPI.equipmentByLab(selectedLabId)) || [];
      const active = list.filter((e) => e.active !== false);
      setEquipmentOptions(active);
      if (active.length) setEquipmentId(String(active[0].id));
    } catch (e) {
      setError(e?.message || "Failed to load equipment");
    }
  };

  useEffect(() => { loadLabs(); }, []);
  useEffect(() => { if (labId) loadEquipment(labId); }, [labId]);

  const selectedEquipment = useMemo(() => equipmentOptions.find((e) => String(e.id) === String(equipmentId)), [equipmentOptions, equipmentId]);

  const addItem = () => {
    setSuccess(""); setError("");
    const q = Number(qty);
    if (!equipmentId) return setError("Select equipment");
    if (!q || q <= 0) return setError("Quantity must be > 0");

    setItems((prev) => {
      const existing = prev.find((it) => String(it.equipmentId) === String(equipmentId));
      if (existing) return prev.map((it) => String(it.equipmentId) === String(equipmentId) ? { ...it, quantity: it.quantity + q } : it);
      return [...prev, { equipmentId: Number(equipmentId), equipment: selectedEquipment?.name || "-", quantity: q }];
    });
  };

  const removeItem = (eid) => setItems((prev) => prev.filter((it) => String(it.equipmentId) !== String(eid)));

  const submit = async () => {
    setSuccess(""); setError("");
    if (!items.length) return setError("Add at least one item");

    try {
      setLoading(true);
      await ToPurchaseAPI.submit({
        reason: "",
        items: items.map((it) => ({ equipmentId: it.equipmentId, quantityRequested: it.quantity, remark: "" }))
      });
      setItems([]);
      setSuccess("Purchase request sent to HOD");
    } catch (e) {
      setError(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          <h2 className="page-title">New Purchase Form</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-card">
            <div className="form-row">
              <label>Lab</label>
              <select value={labId} onChange={(e) => setLabId(e.target.value)} disabled={loading}>
                {labs.map((l) => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Equipment</label>
              <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} disabled={loading}>
                {equipmentOptions.map((e) => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Quantity</label>
              <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="1" />
            </div>

            <div className="form-row">
              <button className="btn-submit" onClick={addItem} disabled={loading || !equipmentId}>Add</button>
            </div>
          </div>

          <h3 className="section-title">Items</h3>
          <div className="items-card">
            {items.length === 0 ? <div className="no-items">No items</div> : items.map(it => (
              <div key={it.equipmentId} className="item-row">
                <div>{it.equipment}</div>
                <div>{it.quantity}</div>
                <div>
                  <button className="btn-cancel" onClick={() => removeItem(it.equipmentId)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="submit-row">
            <button className="btn-submit" onClick={submit} disabled={loading || !items.length}>{loading ? "Submitting..." : "Submit"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
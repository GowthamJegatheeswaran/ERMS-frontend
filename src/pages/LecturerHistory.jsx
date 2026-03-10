import "../styles/toDashboard.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useEffect, useMemo, useState } from "react";
import { LecturerRequestAPI } from "../api/api";

export default function LecturerHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requestRows, setRequestRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      setLoading(true);
      const list = await LecturerRequestAPI.my();
      setRequestRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || "Failed to load lecturer history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-";

  const statusColorMap = {
    RETURN_VERIFIED: "#6B7280",
    DAMAGED_REPORTED: "#DC2626",
    default: "#2563EB",
  };

  // Flatten each request to individual items (cards)
  const flatRequests = useMemo(() => {
    const validStatuses = new Set(["RETURN_VERIFIED", "DAMAGED_REPORTED"]);
    const out = [];
    for (const r of requestRows || []) {
      const items = Array.isArray(r.items) ? r.items : [];
      for (const it of items) {
        if (!validStatuses.has(it.itemStatus)) continue;
        out.push({ ...r, _item: it, _itemStatus: it.itemStatus });
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0));
  }, [requestRows]);

  const renderRequestCard = (r) => {
    const it = r._item;
    const bgColor = statusColorMap[it.itemStatus] || statusColorMap.default;

    return (
      <div key={`${r.requestId}-${it.requestItemId}`} className="history-card">
        <div className="history-grid">
          <div className="history-left">
            <div><strong>Request ID:</strong> {r.requestId}</div>
            <div><strong>Requester:</strong> {requesterText(r)}</div>
            <div><strong>Lab:</strong> {r.labName || "-"}</div>
            <div><strong>Purpose:</strong> {r.purpose || "-"}</div>
          </div>
          <div className="history-right">
            <div><strong>Item:</strong> {it.equipmentName || `Equipment #${it.equipmentId}`} × {it.quantity}</div>
            <div>
              <strong>Status:</strong>{" "}
              <span className="status" style={{ backgroundColor: bgColor, color: "#fff" }}>
                {it.itemStatus || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          {error && <div className="error-message">{error}</div>}

          <h3>My History</h3>
          {flatRequests.length === 0 ? "No records" : flatRequests.map(renderRequestCard)}
        </div>
      </div>
    </div>
  );
}
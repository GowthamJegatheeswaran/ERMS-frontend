import "../styles/toDashboard.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useEffect, useMemo, useState } from "react";
import { ToRequestAPI } from "../api/api";
import { AiOutlineCheck, AiOutlineClockCircle, AiOutlineClose } from "react-icons/ai";

export default function TOViewRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const list = await ToRequestAPI.all();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || "Failed to load requests");
    }
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    const out = [];
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : [];
      for (const it of items) {
        out.push({ ...r, _item: it });
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0));
  }, [rows]);

  const requesterText = r => r.requesterRegNo || r.requesterFullName || "-";

  const statusColorMap = {
    APPROVED_BY_LECTURER: "#16a34a",
    TO_PROCESSING: "#f59e0b",
    ISSUED_PENDING_STUDENT_ACCEPT: "#2563eb",
    ISSUED_CONFIRMED: "#1e40af",
    RETURNED_PENDING_TO_VERIFY: "#f97316",
    RETURNED: "#6b7280",
    REJECTED: "#dc2626",
    default: "#6b7280"
  };

  const renderCard = r => {
    const item = r._item;
    const bgColor = statusColorMap[item.itemStatus] || statusColorMap.default;

    return (
      <div key={`${r.requestId}-${item.requestItemId}`} className="history-card">
        <div className="history-grid">
          <div className="history-left">
            <div><strong>Request ID:</strong> {r.requestId}</div>
            <div><strong>Requester:</strong> {requesterText(r)}</div>
            <div><strong>Lab:</strong> {r.labName || "-"}</div>
          </div>
          <div className="history-right">
            <div><strong>Item:</strong> {item.equipmentName || `Equipment #${item.equipmentId}`} × {item.quantity}</div>
            <div><strong>From:</strong> {r.fromDate || "-"}</div>
            <div><strong>To:</strong> {r.toDate || "-"}</div>
            <div>
              <strong>Status:</strong>{" "}
              <span className="status" style={{ backgroundColor: bgColor, color: "#fff" }}>
                {item.itemStatus || "-"}
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
          <h3>My Purchase Requests</h3>
          {sorted.length === 0 ? <div>No requests found</div> : sorted.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
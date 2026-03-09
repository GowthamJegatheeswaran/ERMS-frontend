import "../styles/toDashboard.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useEffect, useMemo, useState } from "react";
import { ToRequestAPI } from "../api/api";

export default function TOHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      setLoading(true);
      const list = await ToRequestAPI.all();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || "Failed to load TO history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flatHistory = useMemo(() => {
    const doneStatuses = new Set(["RETURN_REQUESTED", "RETURN_VERIFIED", "DAMAGED_REPORTED"]);
    const out = [];
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : [];
      for (const it of items) {
        if (!doneStatuses.has(String(it?.itemStatus || ""))) continue;
        out.push({ ...r, _item: it });
      }
    }
    return out.sort((a, b) => (b.requestId || 0) - (a.requestId || 0));
  }, [rows]);

  const historyStudentInstructor = useMemo(
    () => flatHistory.filter(r => ["STUDENT", "INSTRUCTOR", "STAFF"].includes((r.requesterRole || "").toUpperCase())),
    [flatHistory]
  );

  const historyLecturer = useMemo(
    () => flatHistory.filter(r => (r.requesterRole || "").toUpperCase() === "LECTURER"),
    [flatHistory]
  );

  const requesterText = r => r.requesterRegNo || r.requesterFullName || "-";
  const canVerify = status => status === "RETURN_REQUESTED";

  const actVerify = async (requestItemId, damaged) => {
    setError("");
    try {
      await ToRequestAPI.verifyReturnItem(requestItemId, damaged);
      await load();
    } catch (e) {
      setError(e?.message || "Verify return failed");
    }
  };

  // Map status to background color
  const statusColorMap = {
    RETURN_REQUESTED: "#f97316",
    RETURN_VERIFIED: "#6b7280",
    DAMAGED_REPORTED: "#dc2626",
  };

  // Professional card renderer
// Professional card renderer
const renderCard = r => {
  const item = r._item;
  const bgColor = statusColorMap[item.itemStatus] || "#2563eb";

  return (
    <div key={`${r.requestId}-${item.requestItemId}`} className="history-card">
      <div className="history-grid">
        {/* LEFT COLUMN */}
        <div className="history-left">
          <div><strong>Request ID:</strong> {r.requestId}</div>
          <div><strong>Requester:</strong> {requesterText(r)}</div>
          <div><strong>From:</strong> {r.fromDate || "-"}</div>
          <div><strong>To:</strong> {r.toDate || "-"}</div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="history-right">
          <div><strong>Role:</strong> {r.requesterRole || "-"}</div>
          <div><strong>Lab:</strong> {r.labName || "-"}</div>
          <div><strong>Item:</strong> {item.equipmentName || `Equipment #${item.equipmentId}`} × {item.quantity}</div>
          <div>
            <strong>Status:</strong>{" "}
            <span
              className="status"
              style={{
                backgroundColor: bgColor,
                color: item.itemStatus === "RETURN_REQUESTED" ? "#111" : "white",
              }}
            >
              {item.itemStatus || "-"}
            </span>
          </div>
        </div>
      </div>

      {canVerify(item.itemStatus) && (
        <div className="history-actions">
          <button className="btn-submit small" onClick={() => actVerify(item.requestItemId, false)}>Verify OK</button>
          <button className="btn-cancel small" onClick={() => actVerify(item.requestItemId, true)}>Mark Damaged</button>
        </div>
      )}
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

          <h3>Student/Instructor History</h3>
          {historyStudentInstructor.length === 0 ? "No returned records" : historyStudentInstructor.map(renderCard)}

          <h3>Lecturer History</h3>
          {historyLecturer.length === 0 ? "No lecturer records" : historyLecturer.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
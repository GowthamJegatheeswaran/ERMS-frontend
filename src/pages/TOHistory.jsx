import "../styles/toDashboard.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useEffect, useMemo, useState } from "react";
import { ToPurchaseAPI, ToRequestAPI } from "../api/api";

export default function TOHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      setLoading(true);
      const [requestList, purchaseList] = await Promise.all([
        ToRequestAPI.all(),
        ToPurchaseAPI.my(),
      ]);
      setRows(Array.isArray(requestList) ? requestList : []);
      setPurchaseRows(Array.isArray(purchaseList) ? purchaseList : []);
    } catch (e) {
      setError(e?.message || "Failed to load TO history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Flatten history but exclude RETURN_REQUESTED
  const flatHistory = useMemo(() => {
    const doneStatuses = new Set(["RETURN_VERIFIED", "DAMAGED_REPORTED"]);
    const out = [];
    for (const r of rows || []) {
      const items = Array.isArray(r?.items) ? r.items : [];
      for (const it of items) {
        if (!doneStatuses.has(String(it?.itemStatus || ""))) continue;
        out.push({ ...r, _item: it, _itemStatus: it.itemStatus });
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

  const sortedPurchases = useMemo(() => [...purchaseRows].sort((a, b) => (b.id || 0) - (a.id || 0)), [purchaseRows]);

  const requesterText = r => r.requesterRegNo || r.requesterFullName || "-";

  const statusColorMap = {
    RETURN_VERIFIED: "#6b7280",
    DAMAGED_REPORTED: "#dc2626",
    default: "#2563eb",
  };

  const renderHistoryCard = r => {
    const item = r._item;
    const bgColor = statusColorMap[item.itemStatus] || statusColorMap.default;
    return (
      <div key={`${r.requestId}-${item.requestItemId}`} className="history-card">
        <div className="history-grid">
          <div className="history-left">
            <div><strong>Request ID:</strong> {r.requestId}</div>
            <div><strong>Requester:</strong> {requesterText(r)}</div>
            <div><strong>From:</strong> {r.fromDate || "-"}</div>
            <div><strong>To:</strong> {r.toDate || "-"}</div>
          </div>
          <div className="history-right">
            <div><strong>Role:</strong> {r.requesterRole || "-"}</div>
            <div><strong>Lab:</strong> {r.labName || "-"}</div>
            <div><strong>Item:</strong> {item.equipmentName || `Equipment #${item.equipmentId}`} × {item.quantity}</div>
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

  const renderPurchaseCard = p => (
    <div key={p.id} className="history-card">
      <div className="history-grid">
        <div className="history-left">
          <div><strong>Purchase ID:</strong> {p.id}</div>
          <div><strong>Requested Date:</strong> {p.createdDate || "-"}</div>
          <div><strong>Received Date:</strong> {p.receivedDate || "-"}</div>
        </div>
        <div className="history-right">
          {p.items?.map((it, idx) => (
            <div key={`${p.id}-${idx}`}>
              <strong>Item:</strong> {it.equipmentName} × {(it.quantityRequested ?? it.quantity)}
            </div>
          ))}
          <div>
            <strong>Status:</strong>{" "}
            <span className="status" style={{ backgroundColor: "#1d4ed8", color: "#fff" }}>
              {p.status || "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          {error && <div className="error-message">{error}</div>}

          <h3>Purchase List</h3>
          {sortedPurchases.length === 0 ? "No purchase records" : sortedPurchases.map(renderPurchaseCard)}

          <h3 style={{ marginTop: 20 }}>Student/Instructor History</h3>
          {historyStudentInstructor.length === 0 ? "No returned records" : historyStudentInstructor.map(renderHistoryCard)}

          <h3 style={{ marginTop: 20 }}>Lecturer History</h3>
          {historyLecturer.length === 0 ? "No lecturer records" : historyLecturer.map(renderHistoryCard)}
        </div>
      </div>
    </div>
  );
}
import "../styles/toDashboard.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useEffect, useMemo, useState } from "react";
import { ToPurchaseAPI, ToRequestAPI } from "../api/api";

export default function TOHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [requestRows, setRequestRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      setLoading(true);
      const [purchaseList, requestList] = await Promise.all([
        ToPurchaseAPI.my(),
        ToRequestAPI.all(),
      ]);
      setPurchaseRows(Array.isArray(purchaseList) ? purchaseList : []);
      setRequestRows(Array.isArray(requestList) ? requestList : []);
    } catch (e) {
      setError(e?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (d) => (d ? String(d) : "-");

  // Flatten request rows to individual items, exclude RETURN_REQUESTED
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

  const historyStudentInstructor = useMemo(
    () => flatRequests.filter(r => ["STUDENT", "INSTRUCTOR", "STAFF"].includes((r.requesterRole || "").toUpperCase())),
    [flatRequests]
  );

  const historyLecturer = useMemo(
    () => flatRequests.filter(r => (r.requesterRole || "").toUpperCase() === "LECTURER"),
    [flatRequests]
  );

  const requesterText = (r) => r.requesterRegNo || r.requesterFullName || "-";

  const statusColorMap = {
    SUBMITTED_TO_HOD: "#2563eb",
    APPROVED: "#16a34a",
    REJECTED: "#dc2626",
    ISSUED: "#1e40af",
    ACCEPTED: "#6b7280",
    RETURN_VERIFIED: "#6b7280",
    DAMAGED_REPORTED: "#dc2626",
    default: "#6b7280",
  };

  const renderPurchaseCard = (p) => {
    const items = Array.isArray(p.items) ? p.items : [];
    const bgColor = statusColorMap[p.status] || statusColorMap.default;

    return (
      <div key={p.id} className="history-card">
        <div className="history-grid">
          <div className="history-left">
            <div><strong>Purchase ID:</strong> {p.id}</div>
            <div><strong>Requested Date:</strong> {fmt(p.createdDate)}</div>
            <div><strong>Received Date:</strong> {fmt(p.receivedDate)}</div>
          </div>
          <div className="history-right">
            {items.map((it, idx) => (
              <div key={`${p.id}-${idx}`}>
                <strong>Item:</strong> {it.equipmentName} × {(it.quantityRequested ?? it.quantity)}
              </div>
            ))}
            <div>
              <strong>Status:</strong>{" "}
              <span className="status" style={{ backgroundColor: bgColor, color: "#fff" }}>
                {p.status || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRequestCard = (r) => {
    const it = r._item;
    const bgColor = statusColorMap[it.itemStatus] || statusColorMap.default;

    return (
      <div key={`${r.requestId}-${it.requestItemId}`} className="history-card">
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

          <h3>Purchase List</h3>
          {purchaseRows.length === 0 ? "No purchase records" : purchaseRows.map(renderPurchaseCard)}

          <h3>Student/Instructor History</h3>
          {historyStudentInstructor.length === 0 ? "No returned records" : historyStudentInstructor.map(renderRequestCard)}

          <h3>Lecturer History</h3>
          {historyLecturer.length === 0 ? "No lecturer records" : historyLecturer.map(renderRequestCard)}
        </div>
      </div>
    </div>
  );
}
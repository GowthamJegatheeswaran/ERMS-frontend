import "../styles/toDashboard.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useEffect, useMemo, useState } from "react";
import { ToRequestAPI } from "../api/api";
import { AiOutlineCheck, AiOutlineClockCircle, AiOutlineClose } from "react-icons/ai";

export default function TOApprovalRequests() {
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

  const canIssue = status => ["APPROVED_BY_LECTURER", "WAITING_TO_ISSUE"].includes(String(status || ""));
  const canVerifyReturn = status => String(status || "") === "RETURN_REQUESTED";

  const actIssue = async id => { try { await ToRequestAPI.issueItem(id); await load(); } catch {} };
  const actWait = async id => { try { const reason = window.prompt("Reason?") || ""; await ToRequestAPI.waitItem(id, reason); await load(); } catch {} };
  const actVerify = async (id, damaged) => { try { await ToRequestAPI.verifyReturnItem(id, damaged); await load(); } catch {} };

  const statusColorMap = {
    PENDING_LECTURER_APPROVAL: "#f59e0b",
    APPROVED_BY_LECTURER: "#16a34a",
    REJECTED_BY_LECTURER: "#dc2626",
    RETURN_REQUESTED: "#f97316",
    RETURNED_PENDING_TO_VERIFY: "#6b7280",
    RETURN_VERIFIED: "#6b7280",
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
              <span className="status" style={{ backgroundColor: bgColor, color: item.itemStatus === "RETURN_REQUESTED" ? "#111" : "#fff" }}>
                {item.itemStatus || "-"}
              </span>
            </div>
          </div>
        </div>

        {(canIssue(item.itemStatus) || canVerifyReturn(item.itemStatus)) && (
          <div className="history-actions">
            {canIssue(item.itemStatus) && (
              <>
                <button className="btn-submit small" onClick={() => actIssue(item.requestItemId)}>
                  <AiOutlineCheck /> Issue
                </button>
                <button className="btn-cancel small" onClick={() => actWait(item.requestItemId)}>
                  <AiOutlineClockCircle /> Wait
                </button>
              </>
            )}
            {canVerifyReturn(item.itemStatus) && (
              <>
                <button className="btn-submit small" onClick={() => actVerify(item.requestItemId, false)}>
                  <AiOutlineCheck /> Verify OK
                </button>
                <button className="btn-cancel small" onClick={() => actVerify(item.requestItemId, true)}>
                  <AiOutlineClose /> Mark Damaged
                </button>
              </>
            )}
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
          <h3>Approval Request List</h3>
          {sorted.length === 0 ? <div>No requests found</div> : sorted.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
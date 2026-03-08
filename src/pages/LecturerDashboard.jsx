import "../styles/studentDashboard.css"; // reuse student CSS
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SummaryCard from "../components/SummaryCard";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LecturerRequestAPI, AuthAPI } from "../api/api";
import { AiOutlinePlus, AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineFileText } from "react-icons/ai";

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [queue, setQueue] = useState([]);
  const [myRows, setMyRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load lecturer requests
  const load = async () => {
    setError("");
    try {
      setLoading(true);
      const [q, my] = await Promise.all([
        LecturerRequestAPI.queue(),
        LecturerRequestAPI.my()
      ]);
      setQueue(Array.isArray(q) ? q : []);
      setMyRows(Array.isArray(my) ? my : []);
    } catch (e) {
      setError(e?.message || "Failed to load lecturer dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const fetchUser = async () => {
      try {
        const me = await AuthAPI.me(); // fetch lecturer name
        setUser(me);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const counts = useMemo(() => {
    const pending = queue.length;
    const totalMine = myRows.length;
    return { pending, totalMine };
  }, [queue, myRows]);

  const recentMine = useMemo(() => {
    return [...myRows].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)).slice(0, 3);
  }, [myRows]);

  const itemsPreview = (r) => {
    const items = Array.isArray(r?.items) ? r.items : [];
    if (items.length === 0) return { text: "-", qty: "-" };
    if (items.length === 1) return { text: items[0].equipmentName || "-", qty: items[0].quantity ?? "-" };
    const first = items[0];
    return { text: `${first.equipmentName || "-"} +${items.length - 1} more`, qty: first.quantity ?? "-" };
  };

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="content">
          {/* Welcome message */}
          <h2 className="welcome">
            Welcome, {user?.fullName || "Lecturer"}!
          </h2>

          {error && <div className="error-message" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

          {/* Summary Cards */}
          <h3>Quick Summary</h3>
          <div className="summary-grid" style={{ marginTop: 12 }}>
            <SummaryCard 
              title="Pending Applications" 
              value={counts.pending} 
              icon={<AiOutlineClockCircle size={28} />} 
              color="pending" 
            />
            <SummaryCard 
              title="My Total Requests" 
              value={counts.totalMine} 
              icon={<AiOutlineFileText size={28} />} 
              color="total" 
            />
          </div>

          {/* Quick Actions vertical */}
          <h3>Quick Actions</h3>
          <div className="actions" style={{ flexDirection: "column", gap: "12px" }}>
            <button className="btn-new-request" onClick={() => navigate("/lecturer-new-request")}>
              <AiOutlinePlus size={18} /> New Requests
            </button>
            <button className="btn-new-request" onClick={() => navigate("/lecturer-applications")}>
              <AiOutlineFileText size={18} /> Applications
            </button>
          </div>

          {/* Recent Requests Table */}
          <h3>My Recent Requests</h3>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Quantity</th>
                <th>From</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentMine.map((r) => {
                const p = itemsPreview(r);
                const statusClass = String(r.status || "").toLowerCase();
                return (
                  <tr key={r.requestId}>
                    <td>{p.text}</td>
                    <td style={{ textAlign: "center" }}>{p.qty}</td>
                    <td style={{ textAlign: "center" }}>{r.fromDate || "-"}</td>
                    <td style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      {statusClass === "pending_lecturer_approval" && <AiOutlineClockCircle color="#fbbf24" />}
                      {statusClass === "approved" && <AiOutlineCheckCircle color="#16a34a" />}
                      {statusClass === "rejected_by_lecturer" && <AiOutlineCloseCircle color="#dc2626" />}
                      <span>{r.status || "-"}</span>
                    </td>
                  </tr>
                );
              })}
              {recentMine.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>No requests yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
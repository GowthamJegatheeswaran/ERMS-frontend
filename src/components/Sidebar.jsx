import { useLocation, useNavigate } from "react-router-dom"
import { AiOutlineDashboard, AiOutlineFileText, AiOutlineUser, AiOutlineHistory, AiOutlineSetting } from "react-icons/ai"

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = (localStorage.getItem("role") || "student").toLowerCase()

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    navigate("/login")
  }

  const go = (path) => {
    navigate(path)
    if (onClose) onClose()
  }

  const isActive = (path) => location.pathname === path

  const menu = (() => {
    switch (role) {
      case "admin":
        return [
          { label: "Dashboard", path: "/admin-dashboard", icon: <AiOutlineDashboard /> },
          { label: "Department", path: "/admin-department", icon: <AiOutlineFileText /> },
          { label: "View Requests", path: "/admin-view-requests", icon: <AiOutlineFileText /> },
          { label: "User Management", path: "/admin-users", icon: <AiOutlineUser /> },
          { label: "Report", path: "/admin-report", icon: <AiOutlineFileText /> },
          { label: "History", path: "/admin-history", icon: <AiOutlineHistory /> },
          { label: "Help/Support", path: "/help", icon: <AiOutlineSetting /> },
        ]
      case "lecturer":
        return [
          { label: "Dashboard", path: "/lecturer-dashboard", icon: <AiOutlineDashboard /> },
          { label: "View Requests", path: "/lecturer-view-requests", icon: <AiOutlineFileText /> },
          { label: "History", path: "/history", icon: <AiOutlineHistory /> },
          { label: "Help/Support", path: "/help", icon: <AiOutlineSetting /> },
        ]
      case "to":
        return [
          { label: "Dashboard", path: "/to-dashboard", icon: <AiOutlineDashboard /> },
          { label: "View Requests", path: "/to-view-requests", icon: <AiOutlineFileText /> },
          { label: "Help/Support", path: "/help", icon: <AiOutlineSetting /> },
        ]
      case "hod":
        return [
          { label: "Dashboard", path: "/hod-dashboard", icon: <AiOutlineDashboard /> },
          { label: "View Requests", path: "/hod-view-requests", icon: <AiOutlineFileText /> },
          { label: "Help/Support", path: "/help", icon: <AiOutlineSetting /> },
        ]
      default: // student
        return [
          { label: "Dashboard", path: "/student-dashboard", icon: <AiOutlineDashboard /> },
          { label: "View Requests", path: "/view-requests", icon: <AiOutlineFileText /> },
          { label: "History", path: "/history", icon: <AiOutlineHistory /> },
          { label: "Help/Support", path: "/help", icon: <AiOutlineSetting /> },
        ]
    }
  })()

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <ul className="sidebar-menu">
          {menu.map((m) => (
            <li key={m.label} onClick={() => go(m.path)} className={isActive(m.path) ? "active" : ""}>
              <span className="menu-icon">{m.icon}</span>
              <span className="menu-label">{m.label}</span>
            </li>
          ))}
          <li onClick={() => go("/settings")}>
            <span className="menu-icon"><AiOutlineSetting /></span>
            Settings
          </li>
          <li className="logout" onClick={handleLogout}>
            <span className="menu-icon"><AiOutlineUser /></span>
            Logout
          </li>
        </ul>
      </div>
    </>
  )
}
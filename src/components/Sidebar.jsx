import { useLocation, useNavigate } from "react-router-dom"
import {
  AiOutlineDashboard,
  AiOutlineFileText,
  AiOutlineUser,
  AiOutlineHistory,
  AiOutlineSetting,
  AiOutlineAppstore,
  AiOutlineFolderOpen,
  AiOutlineShoppingCart,
  AiOutlineTeam
} from "react-icons/ai"

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
    if (role === "admin") {
      return [
        { label: "Dashboard", path: "/admin-dashboard", icon: <AiOutlineDashboard /> },
        { label: "Department", path: "/admin-department", icon: <AiOutlineTeam /> },
        { label: "View Requests", path: "/admin-view-requests", icon: <AiOutlineFileText /> },
        { label: "User Management", path: "/admin-users", icon: <AiOutlineUser /> },
        { label: "Report", path: "/admin-report", icon: <AiOutlineFolderOpen /> },
        { label: "History", path: "/admin-history", icon: <AiOutlineHistory /> },
        { label: "Help/Support", path: "/help", icon: <AiOutlineAppstore /> },
      ]
    }

    if (role === "hod") {
      return [
        { label: "Dashboard", path: "/hod-my-work", icon: <AiOutlineDashboard /> },
        { label: "Department Work", path: "/hod-dept-work", icon: <AiOutlineTeam /> },
        { label: "Inventory", path: "/hod-inventory", icon: <AiOutlineFolderOpen /> },
        { label: "Report", path: "/hod-report", icon: <AiOutlineFileText /> },
        { label: "Dept Purchase", path: "/hod-dept-purchase", icon: <AiOutlineShoppingCart /> },
        { label: "Inspect Requests", path: "/hod-inspect", icon: <AiOutlineFileText /> },
        { label: "History", path: "/hod-history", icon: <AiOutlineHistory /> },
        { label: "Help/Support", path: "/help", icon: <AiOutlineAppstore /> },
      ]
    }

    if (role === "lecturer") {
      return [
        { label: "Dashboard", path: "/lecturer-dashboard", icon: <AiOutlineDashboard /> },
        { label: "Applications", path: "/lecturer-applications", icon: <AiOutlineFileText /> },
        { label: "New Requests", path: "/lecturer-new-request", icon: <AiOutlineShoppingCart /> },
        { label: "View Requests", path: "/lecturer-view-requests", icon: <AiOutlineFileText /> },
        { label: "History", path: "/lecturer-history", icon: <AiOutlineHistory /> },
        { label: "Help/Support", path: "/help", icon: <AiOutlineAppstore /> },
      ]
    }

    if (role === "to") {
      return [
        { label: "Dashboard", path: "/to-dashboard", icon: <AiOutlineDashboard /> },
        { label: "Approval requests", path: "/to-approval-requests", icon: <AiOutlineFileText /> },
        { label: "Purchase List", path: "/to-purchase", icon: <AiOutlineShoppingCart /> },
        { label: "History", path: "/to-history", icon: <AiOutlineHistory /> },
        { label: "Help/Support", path: "/help", icon: <AiOutlineAppstore /> },
      ]
    }

    // if (role === "instructor" || role === "staff") {
    //   return [
    //     { label: "Dashboard", path: "/instructor-dashboard", icon: <AiOutlineDashboard /> },
    //     { label: "New Requests", path: "/instructor-new-request", icon: <AiOutlineShoppingCart /> },
    //     { label: "View Requests", path: "/instructor-view-requests", icon: <AiOutlineFileText /> },
    //     { label: "Help/Support", path: "/help", icon: <AiOutlineAppstore /> },
    //     { label: "History", path: "/instructor-history", icon: <AiOutlineHistory /> },
    //   ]
    // }

    // default student
    return [
      { label: "Dashboard", path: "/student-dashboard", icon: <AiOutlineDashboard /> },
      { label: "View Requests", path: "/view-requests", icon: <AiOutlineFileText /> },
      { label: "Help/Support", path: "/help", icon: <AiOutlineAppstore /> },
      { label: "History", path: "/history", icon: <AiOutlineHistory /> },
    ]
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
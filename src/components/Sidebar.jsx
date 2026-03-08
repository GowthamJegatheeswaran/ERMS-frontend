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
        { label: "Department", path: "/admin-department", icon: <AiOutlineFileText /> },
        { label: "View Requests", path: "/admin-view-requests", icon: <AiOutlineFileText /> },
        { label: "User Management", path: "/admin-users", icon: <AiOutlineUser /> },
        { label: "Report", path: "/admin-report", icon: <AiOutlineFileText /> },
        { label: "History", path: "/admin-history", icon: <AiOutlineHistory /> },
        { label: "Help/Support", path: "/help", icon: <AiOutlineSetting /> },
      ]
    }

    // default student
    return [
      { label: "Dashboard", path: "/student-dashboard", icon: <AiOutlineDashboard /> },
      { label: "View Requests", path: "/view-requests", icon: <AiOutlineFileText /> },
      { label: "Help/Support", path: "/help", icon: <AiOutlineSetting /> },
      { label: "History", path: "/history", icon: <AiOutlineHistory /> },
    ]
  })()

  return (
    <>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose} />

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Removed sidebar-header */}
        <ul className="sidebar-menu">
          {menu.map((m) => (
            <li
              key={m.label}
              onClick={() => go(m.path)}
              className={isActive(m.path) ? "active" : ""}
            >
              <span className="menu-icon">{m.icon}</span>
              <span className="menu-label">{m.label}</span>
            </li>
          ))}

          <li className="bottom" onClick={() => go("/settings")}>
            <span className="menu-icon"><AiOutlineSetting /></span>
            Settings
          </li>
          <li onClick={handleLogout}>
            <span className="menu-icon"><AiOutlineUser /></span>
            Logout
          </li>
        </ul>
      </div>
    </>
  )
}
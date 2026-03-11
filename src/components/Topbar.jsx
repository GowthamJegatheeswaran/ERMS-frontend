import NotificationBell from "./NotificationBell"
import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { AuthAPI } from "../api/api"

/* ── Topbar styles injected inline for portability ── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

.topbar {
  height: 62px;
  background: rgba(5,14,36,0.97);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255,255,255,.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 900;
  gap: 16px;
  font-family: 'Outfit', system-ui, sans-serif;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

/* mobile hamburger slot */
.topbar-menu-btn {
  display: none;
  background: none;
  border: none;
  color: rgba(226,232,240,.7);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background .15s, color .15s;
  margin-right: 2px;
}
.topbar-menu-btn:hover { background: rgba(255,255,255,.08); color: #fff; }

.topbar-logo {
  width: 34px; height: 34px;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(201,168,76,.3));
  flex-shrink: 0;
}

.topbar-brand {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.topbar-brand-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: .2px;
  line-height: 1;
}

.topbar-brand-sub {
  font-size: 10.5px;
  color: rgba(148,163,184,.6);
  font-weight: 500;
  letter-spacing: .3px;
  line-height: 1;
}

/* divider */
.topbar-divider {
  width: 1px;
  height: 28px;
  background: rgba(255,255,255,.08);
  flex-shrink: 0;
}

/* breadcrumb / page title area */
.topbar-page {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: rgba(148,163,184,.8);
}
.topbar-page-sep { color: rgba(148,163,184,.35); font-size: 11px; }
.topbar-page-current {
  color: rgba(226,232,240,.85);
  font-weight: 600;
  font-size: 12.5px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* user chip */
.topbar-user-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 12px 5px 5px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 999px;
  transition: background .15s, border-color .15s;
  cursor: default;
}
.topbar-user-chip:hover {
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.12);
}

.topbar-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  letter-spacing: .3px;
}

.topbar-user-info { display: flex; flex-direction: column; gap: 1px; }
.topbar-user-name { font-size: 12px; font-weight: 600; color: #e2e8f0; line-height: 1; }
.topbar-user-role {
  font-size: 10px;
  color: rgba(148,163,184,.7);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .4px;
  line-height: 1;
}

/* role badge colour */
.topbar-role-pill {
  display: none;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .3px;
  text-transform: uppercase;
}

@media (min-width: 900px) { .topbar-role-pill { display: inline-block; } }

.topbar-menu-btn { display: none; }
@media (max-width: 768px) {
  .topbar { padding: 0 14px 0 10px; }
  .topbar-menu-btn { display: flex; align-items: center; }
  .topbar-brand-sub { display: none; }
  .topbar-page { display: none; }
  .topbar-divider { display: none; }
  .topbar-user-name { display: none; }
  .topbar-user-role { display: none; }
  .topbar-user-chip { padding: 4px; gap: 0; }
}
`

const ROLE_LABELS = {
  hod:       { label: "HOD",       color: "#4ade80", bg: "rgba(22,163,74,.15)"  },
  lecturer:  { label: "Lecturer",  color: "#93c5fd", bg: "rgba(59,130,246,.15)" },
  to:        { label: "TO",        color: "#67e8f9", bg: "rgba(6,182,212,.15)"  },
  admin:     { label: "Admin",     color: "#c4b5fd", bg: "rgba(139,92,246,.15)" },
  student:   { label: "Student",   color: "#fda4af", bg: "rgba(244,63,94,.15)"  },
  staff:     { label: "Staff",     color: "#fcd34d", bg: "rgba(234,179,8,.15)"  },
  instructor:{ label: "Instructor",color: "#fcd34d", bg: "rgba(234,179,8,.15)"  },
}

function initials(name) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0,2).toUpperCase()
}

export default function Topbar({ onMenuClick }) {
  const [user, setUser] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    AuthAPI.me()
      .then(me => setUser(me))
      .catch(() => {})
  }, [])

  // derive a human page name from the current path
  const pageName = (() => {
    const p = location?.pathname || ""
    if (p.includes("dashboard"))    return "Dashboard"
    if (p.includes("request"))      return "Requests"
    if (p.includes("application"))  return "Applications"
    if (p.includes("lab"))          return "Labs"
    if (p.includes("purchase"))     return "Purchases"
    if (p.includes("report"))       return "Reports"
    if (p.includes("history"))      return "History"
    if (p.includes("inventory"))    return "Inventory"
    if (p.includes("inspect"))      return "Inspect"
    if (p.includes("settings"))     return "Settings"
    if (p.includes("help"))         return "Help"
    if (p.includes("admin"))        return "Admin"
    return null
  })()

  const role = (user?.role || localStorage.getItem("role") || "").toLowerCase()
  const roleInfo = ROLE_LABELS[role] || { label: role.toUpperCase(), color: "#94a3b8", bg: "rgba(148,163,184,.1)" }

  return (
    <>
      <style>{css}</style>
      <div className="topbar">
        <div className="topbar-left">
          {/* mobile hamburger */}
          {onMenuClick && (
            <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
              ☰
            </button>
          )}

          <img src="/images/logo.png" alt="UoJ" className="topbar-logo" />

          <div className="topbar-brand">
            <span className="topbar-brand-name">ERMS</span>
            <span className="topbar-brand-sub">Univ. of Jaffna · Faculty of Engineering</span>
          </div>

          {pageName && (
            <>
              <div className="topbar-divider" />
              <div className="topbar-page">
                <span>System</span>
                <span className="topbar-page-sep">›</span>
                <span className="topbar-page-current">{pageName}</span>
              </div>
            </>
          )}
        </div>

        <div className="topbar-right">
          {/* role badge */}
          {roleInfo.label && (
            <span
              className="topbar-role-pill"
              style={{ color: roleInfo.color, background: roleInfo.bg, border: `1px solid ${roleInfo.color}22` }}
            >
              {roleInfo.label}
            </span>
          )}

          <NotificationBell />

          {user && (
            <div className="topbar-user-chip">
              <div className="topbar-avatar">{initials(user.fullName)}</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user.fullName}</span>
                <span className="topbar-user-role">{roleInfo.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
import NotificationBell from "./NotificationBell"
import logo from "../assets/logo.png" // your app icon/logo

export default function Topbar({ title = "Dashboard" }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <img src={logo} alt="Logo" className="topbar-logo" />
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-right">
        <NotificationBell />
      </div>
    </div>
  )
}
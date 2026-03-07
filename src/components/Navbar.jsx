import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import logo from "../assets/logo.png";

export default function Navbar({ onFeedback }) {
  const [open, setOpen] = useState(false);

  const handleFeedback = () => {
    setOpen(false);
    onFeedback();
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo-img" />
        <span className="logo-text">Equipment Request Management System</span>
      </div>

      {/* Navigation Links */}
      <ul className={`nav-links ${open ? "active" : ""}`}>
        <li><a href="#home" onClick={() => setOpen(false)}>Home</a></li>
        <li><a href="#features" onClick={() => setOpen(false)}>Features</a></li>
        <li><a href="#contact" onClick={() => setOpen(false)}>Contact</a></li>
        <li><a href="#about" onClick={() => setOpen(false)}>About</a></li>
        <li><button className="nav-btn" onClick={handleFeedback}>Feedback</button></li>
      </ul>

      {/* Login Button */}
      <Link to="/login" className="nav-btn login-btn">Login</Link>

      {/* Mobile Menu Toggle */}
      <div className="menu-toggle" onClick={() => setOpen(!open)}>
        ☰
      </div>
    </nav>
  );
}
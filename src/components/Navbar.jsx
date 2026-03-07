import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";

export default function Navbar({ onFeedback }) {
  const [open, setOpen] = useState(false);

  const handleFeedback = () => {
    setOpen(false); // close mobile menu
    onFeedback();   // open feedback modal
  };

  return (
    <nav className="navbar" role="navigation">
      {/* Logo */}
      <div className="logo-container">
        <img
          src="/images/logo.png"
          alt="Equipment Request System Logo"
          className="logo-img"
        />
        <span className="logo-text">Equipment Request Management System</span>
      </div>

      {/* Navigation Links */}
      <div className="nav-container">
  <ul className={`nav-links ${open ? "active" : ""}`} aria-expanded={open}>
    <li><a href="#home" onClick={() => setOpen(false)}>Home</a></li>
    <li><a href="#features" onClick={() => setOpen(false)}>Features</a></li>
    <li><a href="#contact" onClick={() => setOpen(false)}>Contact</a></li>
    <li><a href="#about" onClick={() => setOpen(false)}>About</a></li>
    <li><button className="nav-btn" onClick={handleFeedback}>Feedback</button></li>
  </ul>

  <Link to="/login" className="login-btn">
    Login
  </Link>
</div>

      {/* Mobile Menu Toggle */}
      <div className="menu-toggle" onClick={() => setOpen(!open)}>
        ☰
      </div>
    </nav>
  );
}
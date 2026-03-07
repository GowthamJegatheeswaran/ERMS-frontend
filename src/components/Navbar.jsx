import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import logo from "../images/logo.png";

export default function Navbar({ onFeedback }) {
  const [open, setOpen] = useState(false);

  const handleFeedback = () => {
    setOpen(false); // close mobile menu
    onFeedback();   // open feedback modal
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="logo-container">
        <img src={logo} alt="Equipment Request System Logo" className="logo-img" />
        <span className="logo-text">Equipment Request Management System</span>
      </div>

      {/* Navigation Links */}
      <ul className={`nav-links ${open ? "active" : ""}`}>
        <li>
          <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        </li>
        <li>
          <Link to="/#features" onClick={() => setOpen(false)}>Features</Link>
        </li>
        <li>
          <Link to="/#contact" onClick={() => setOpen(false)}>Contact</Link>
        </li>
        <li>
          <Link to="/#about" onClick={() => setOpen(false)}>About</Link>
        </li>
        <li>
          <button className="nav-btn" onClick={handleFeedback}>Feedback</button>
        </li>
      </ul>

      {/* Login Button */}
      <Link to="/login" className="nav-btn login-btn" aria-label="Login Page">Login</Link>

      {/* Mobile Menu Toggle */}
      <div
        className="menu-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
      >
        ☰
      </div>
    </nav>
  );
}
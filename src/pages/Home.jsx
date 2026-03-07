import "../styles/home.css"
import Navbar from "../components/Navbar"
import FeedbackModal from "../components/FeedbackModal"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaLock, FaClipboardList, FaBolt, FaUniversity } from "react-icons/fa"
import { FaEnvelope } from "react-icons/fa"


export default function Home() {
  const [showFeedback, setShowFeedback] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <Navbar onFeedback={() => setShowFeedback(true)} />

      <section className="hero">
  <div className="hero-overlay"></div>
  <div className="hero-content container fade-in">
    <h1>Welcome to our <br />Equipment Request System</h1>
    <p className="hero-subtitle">Request, track, and manage laboratory equipment easily.</p>
    <button className="cta-btn" onClick={() => navigate("/login")} aria-label="Get Started">
      Get Started
    </button>
    <p className="hero-tagline">Simplifying laboratory management for students & faculty</p>
  </div>
</section>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      <section className="features">
  <h2>System Features</h2>
  <div className="feature-box">
    <article className="card">
      <FaLock className="icon" />
      <p>Secure Login</p>
    </article>
    <article className="card">
      <FaClipboardList className="icon" />
      <p>Easy Requests</p>
    </article>
    <article className="card">
      <FaBolt className="icon" />
      <p>Fast Access</p>
    </article>
    <article className="card">
      <FaUniversity className="icon" />
      <p>University Approved</p>
    </article>
  </div>
</section>

     <section id="contact" className="contact">
  <h2>Contact Us</h2>
  <address>
    Faculty of Engineering, University of Jaffna<br />
    <FaEnvelope className="icon" /> 
    <a href="mailto:2022e063@eng.jfn.ac.lk">2022e063@eng.jfn.ac.lk</a>
  </address>
</section>

      <footer className="footer">
  <p>© 2026 ERS</p>
  <p>Faculty of Engineering, University of Jaffna</p>
</footer>
    </>
  )
}

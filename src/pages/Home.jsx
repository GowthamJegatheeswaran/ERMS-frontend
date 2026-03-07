import "../styles/home.css";
import Navbar from "../components/Navbar";
import FeedbackModal from "../components/FeedbackModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaClipboardList, FaBolt, FaUniversity, FaEnvelope } from "react-icons/fa";
import HeroImg from "../images/image.png";

export default function Home() {
  const [showFeedback, setShowFeedback] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Navbar onFeedback={() => setShowFeedback(true)} />

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content fade-in">
          <div className="hero-text">
            <h1>EQUIPMENT REQUEST MANAGEMENT SYSTEM</h1>
            <div className="hero-text-block">
              <p className="hero-subtitle">
                Request, track, and manage laboratory equipment easily.
              </p>
              <p className="hero-tagline">
                Simplifying laboratory management for students & faculty
              </p>
            </div>
            <div className="hero-button-container">
              <button className="cta-btn" onClick={() => navigate("/login")}>
                Get Started
              </button>
            </div>
          </div>

          <div className="hero-image">
            <img src={HeroImg} alt="Equipment Request System Illustration" />
          </div>
        </div>
      </section>

      {/* Feedback Modal */}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      {/* Features Section */}
      <section className="features" id="features">
        <h2>System Features</h2>
        <p className="features-description">
          Our Equipment Request System provides streamlined tools to request, track, 
          and manage laboratory equipment efficiently.
        </p>
        <div className="feature-box">
          <article className="card">
            <FaLock className="icon" />
            <p className="feature-title">Secure Login</p>
            <p className="feature-desc">
              Login safely with your university credentials to protect your data.
            </p>
          </article>
          <article className="card">
            <FaClipboardList className="icon" />
            <p className="feature-title">Easy Requests</p>
            <p className="feature-desc">
              Submit equipment requests in a few simple steps, saving time.
            </p>
          </article>
          <article className="card">
            <FaBolt className="icon" />
            <p className="feature-title">Fast Access</p>
            <p className="feature-desc">
              Track and access your requests quickly from anywhere.
            </p>
          </article>
          <article className="card">
            <FaUniversity className="icon" />
            <p className="feature-title">University Approved</p>
            <p className="feature-desc">
              All requests are reviewed and approved by your department seamlessly.
            </p>
          </article>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <h2>Contact Us</h2>
        <address>
          Faculty of Engineering, University of Jaffna<br />
          <FaEnvelope className="icon" /> 
          <a href="mailto:2022e063@eng.jfn.ac.lk">2022e063@eng.jfn.ac.lk</a>
        </address>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 ERS</p>
        <p>Faculty of Engineering, University of Jaffna</p>
      </footer>
    </>
  );
}
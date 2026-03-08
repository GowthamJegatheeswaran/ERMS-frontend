import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useState } from "react"
import { FaQuestionCircle, FaEnvelope, FaBook } from "react-icons/fa"

export default function Help() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const faqs = [
    { q: "How do I request equipment?", a: "Go to 'New Requests', fill the form, and submit your request." },
    { q: "How can I return an item?", a: "Click 'Return' button on your issued request in 'View Requests'." },
    { q: "Who can approve my request?", a: "Your lecturer and the Lab Technical Officer (LTO) approves requests." },
  ]

  const supportEmail = "ERMS@eng.jfn.ac.lk"

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <h2 className="page-title">Help & Support</h2>

          <div className="help-grid">
            {/* FAQ Section */}
            <div className="help-card">
              <div className="help-card-header">
                <FaQuestionCircle size={24} />
                <h3>Frequently Asked Questions</h3>
              </div>
              <ul className="help-list">
                {faqs.map((faq, idx) => (
                  <li key={idx}>
                    <strong>{faq.q}</strong>
                    <p>{faq.a}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Support */}
            <div className="help-card">
              <div className="help-card-header">
                <FaEnvelope size={24} />
                <h3>Contact Support</h3>
              </div>
              <p>If you need further assistance, contact our support team:</p>
              <p><strong>Email:</strong> <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
            </div>

            {/* Guides / Documentation */}
            <div className="help-card">
              <div className="help-card-header">
                <FaBook size={24} />
                <h3>Guides & Documentation</h3>
              </div>
              <ul className="help-list">
                <li><a href="/docs/request-guide.pdf" target="_blank">Equipment Request Guide</a></li>
                <li><a href="/docs/return-guide.pdf" target="_blank">Returning Items Guide</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
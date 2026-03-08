import "../styles/studentDashboard.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import { useState } from "react"

export default function Help() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const faqs = [
    { q: "How do I request equipment?", a: "Go to 'View Requests', fill the form, and submit your request." },
    { q: "How can I return an item?", a: "Click 'Return' button on your issued request in 'View Requests'." },
    { q: "Who can approve my request?", a: "Your lecturer or the Lab Technical Officer (LTO) approves requests." },
  ]

  const supportEmail = "support@university.edu"

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content">
          <h2>Help / Support</h2>

          <div className="support-cards">
            {/* FAQ Section */}
            <div className="support-card">
              <h3>Frequently Asked Questions</h3>
              <ul>
                {faqs.map((faq, idx) => (
                  <li key={idx} className="faq-item">
                    <strong>{faq.q}</strong>
                    <p>{faq.a}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Support */}
            <div className="support-card">
              <h3>Contact Support</h3>
              <p>If you need further assistance, contact our support team:</p>
              <p><strong>Email:</strong> <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
            </div>

            {/* Guides / Documentation */}
            <div className="support-card">
              <h3>Guides & Documentation</h3>
              <ul>
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
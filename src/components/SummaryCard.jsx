import React from "react"

export default function SummaryCard({ title, value, icon, color }) {
  return (
    <div className="summary-card" style={{ backgroundColor: color || "#2563eb" }}>
      {icon && <div className="card-icon">{icon}</div>}
      <div className="card-info">
        <h4>{title}</h4>
        <p>{value}</p>
      </div>
    </div>
  )
}
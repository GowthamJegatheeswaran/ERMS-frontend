export function buildLabReportData(requests, purchaseRequests, labId, labEquipmentNames = []) {
  const lid = String(labId)
  const inLab = (Array.isArray(requests) ? requests : []).filter((r) => String(r.labId) === lid)
  const labName = inLab[0]?.labName || `Lab ${labId}`

  const studentRows = []
  for (const r of inLab) {
    // Show only students in this report
    if (!r?.requesterRegNo) continue

    const items = Array.isArray(r.items) ? r.items : []
    if (items.length === 0) {
      studentRows.push({
        key: `${r.requestId}-0`,
        requesterName: r.requesterName || "-",
        regNo: r.requesterRegNo || "-",
        equipment: "-",
        quantity: 0,
        status: r.status || "-",
        returned: "Non-Returned",
      })
      continue
    }

    items.forEach((it, idx) => {
      studentRows.push({
        key: `${r.requestId}-${idx}`,
        requesterName: r.requesterName || "-",
        regNo: r.requesterRegNo || "-",
        equipment: it?.equipmentName || "-",
        quantity: it?.quantity || 0,
        status: it?.status || r.status || "-",
        returned: it?.returned ? "Returned" : "Non-Returned",
      })
    })
  }

  const equipmentSet = new Set((Array.isArray(labEquipmentNames) ? labEquipmentNames : []).map((x) => String(x).trim().toLowerCase()))

  const purchaseRows = []
  for (const p of Array.isArray(purchaseRequests) ? purchaseRequests : []) {
    for (const it of p.items || []) {
      const eqName = String(it?.equipmentName || "").trim()
      if (!eqName) continue

      // Match purchase items only for this selected lab
      if (equipmentSet.size > 0 && !equipmentSet.has(eqName.toLowerCase())) continue

      purchaseRows.push({
        equipment: eqName,
        quantity: it?.quantityRequested ?? it?.quantity ?? 0,
        requestedDate: p?.createdDate || "-",
        receivedDate: p?.receivedDate || "-",
        status: p?.status || "-",
      })
    }
  }

  purchaseRows.sort((a, b) => String(b.requestedDate).localeCompare(String(a.requestedDate)))

  const summary = {
    totalRequests: studentRows.length,
    returnedCount: studentRows.filter((r) => r.returned === "Returned").length,
    nonReturnedCount: studentRows.filter((r) => r.returned !== "Returned").length,
  }

  return { labName, studentRows, purchaseRows, summary }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderRows(rows) {
  if (!rows.length) {
    return `<tr><td colspan="6" style="text-align:center;">No records</td></tr>`
  }
  return rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.requesterName)}</td>
      <td>${escapeHtml(row.regNo)}</td>
      <td>${escapeHtml(row.equipment)}</td>
      <td style="text-align:center;">${escapeHtml(String(row.quantity).padStart(2, "0"))}</td>
      <td style="text-align:center;">${escapeHtml(row.status)}</td>
      <td style="text-align:center;">${escapeHtml(row.returned)}</td>
    </tr>
  `).join("")
}

function renderPurchaseRows(rows) {
  if (!rows.length) {
    return `<tr><td colspan="4" style="text-align:center;">No purchase records</td></tr>`
  }
  return rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.equipment)}</td>
      <td style="text-align:center;">${escapeHtml(String(row.quantity).padStart(2, "0"))}</td>
      <td style="text-align:center;">${escapeHtml(row.requestedDate)}</td>
      <td style="text-align:center;">${escapeHtml(row.receivedDate)}</td>
    </tr>
  `).join("")
}

export function generateHodLabReportPdf({ labName, studentRows = [], purchaseRows = [], summary = {} }) {
  const generatedAt = new Date()
  const title = `${labName} Report`
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
      h1, h2, h3 { margin: 0 0 10px; }
      .meta { margin-bottom: 18px; font-size: 13px; color: #444; }
      .summary { display: flex; gap: 12px; margin: 14px 0 22px; flex-wrap: wrap; }
      .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 14px; min-width: 150px; }
      .card b { display: block; font-size: 20px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 22px; }
      th, td { border: 1px solid #444; padding: 8px 10px; font-size: 13px; }
      th { background: #f3f4f6; }
      .footer { margin-top: 24px; font-size: 12px; color: #555; text-align: center; }
      @media print { button { display:none; } body { margin: 10mm; } }
    </style>
  </head>
  <body>
    <h1>HOD Lab Report</h1>
    <div class="meta">
      <div><strong>Lab:</strong> ${escapeHtml(labName)}</div>
      <div><strong>Generated:</strong> ${escapeHtml(generatedAt.toLocaleString())}</div>
    </div>

    <div class="summary">
      <div class="card">Total Student Requests<b>${escapeHtml(summary.totalRequests ?? studentRows.length)}</b></div>
      <div class="card">Returned<b>${escapeHtml(summary.returnedCount ?? 0)}</b></div>
      <div class="card">Non-Returned<b>${escapeHtml(summary.nonReturnedCount ?? 0)}</b></div>
    </div>

    <h3>Student Details</h3>
    <table>
      <thead>
        <tr>
          <th>Requester Name</th>
          <th>Reg No</th>
          <th>Equipment</th>
          <th>Quantity</th>
          <th>Status</th>
          <th>Returned / Non-Returned</th>
        </tr>
      </thead>
      <tbody>${renderRows(studentRows)}</tbody>
    </table>

    <h3>Purchase List</h3>
    <table>
      <thead>
        <tr>
          <th>Equipment</th>
          <th>Quantity</th>
          <th>Requested Date</th>
          <th>Received Date</th>
        </tr>
      </thead>
      <tbody>${renderPurchaseRows(purchaseRows)}</tbody>
    </table>

    <div class="footer">
      Faculty of Engineering | University of Jaffna<br/>
      ERS HOD Report
    </div>

    <script>
      window.onload = function() {
        window.print();
      };
    </script>
  </body>
  </html>`

  const reportWindow = window.open("", "_blank", "width=1000,height=800")
  if (!reportWindow) {
    throw new Error("Popup blocked. Please allow popups and try again.")
  }
  reportWindow.document.open()
  reportWindow.document.write(html)
  reportWindow.document.close()
}
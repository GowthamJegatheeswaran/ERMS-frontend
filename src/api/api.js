// Simple fetch wrapper for Spring Boot backend (JWT auth)
//
// Dev:
//  - Vite proxy in vite.config.js forwards /api -> http://localhost:8080
//  - So keep base URL as "" and call paths like "/api/auth/login"
// Prod:
//  - Set VITE_API_BASE_URL="https://your-domain.com" (no trailing slash)

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")

export function getAuthToken() {
  return localStorage.getItem("token") || ""
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  const token = getAuthToken()

  const headers = new Headers(options.headers || {})
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(url, {
    ...options,
    headers,
  })

  const contentType = res.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "")

  if (!res.ok) {
    const message =
      (typeof data === "string" && data) ||
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

// -------- Auth --------
export const AuthAPI = {
  login: (email, password) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signupStudent: ({ fullName, email, regNo, department, password }) =>
    apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ fullName, email, regNo, department, password }),
    }),

  forgotPassword: (email) =>
    apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: ({ token, newPassword }) =>
    apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  me: () => apiFetch("/api/auth/me"),
}

// -------- Notifications --------
export const NotificationAPI = {
  my: () => apiFetch("/api/notifications/my"),
  markRead: (id) => apiFetch(`/api/notifications/${id}/read`, { method: "POST" }),
}

// -------- Common lookups --------
export const CommonAPI = {
  lecturers: (department) =>
    apiFetch(`/api/common/lecturers?department=${encodeURIComponent(department || "")}`),

  labs: async (department) => {
    try {
      const qs = department ? `?department=${encodeURIComponent(department)}` : ""
      return await apiFetch(`/api/common/labs${qs}`)
    } catch (e) {
      if (e?.status === 404) return null
      throw e
    }
  },

  equipmentByLab: async (labId) => {
    try {
      return await apiFetch(`/api/common/equipment?labId=${encodeURIComponent(labId)}`)
    } catch (e) {
      if (e?.status === 404) return null
      throw e
    }
  },
}

// -------- Requests (Student/Staff) --------
export const StudentRequestAPI = {
  create: (payload) =>
    apiFetch("/api/student/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  my: () => apiFetch("/api/student/requests"),
  acceptIssue: (id) => apiFetch(`/api/student/requests/${id}/accept-issue`, { method: "POST" }),
  acceptIssueItem: (requestItemId) => apiFetch(`/api/student/request-items/${requestItemId}/accept-issue`, { method: "POST" }),
  submitReturn: (id) => apiFetch(`/api/student/requests/${id}/return`, { method: "POST" }),
  submitReturnItem: (requestItemId) => apiFetch(`/api/student/request-items/${requestItemId}/return`, { method: "POST" }),
}

// -------- Lecturer --------
export const LecturerRequestAPI = {
  queue: () => apiFetch("/api/lecturer/approval-queue"),
  approve: (id) => apiFetch(`/api/lecturer/requests/${id}/approve`, { method: "POST" }),
  approveItem: (requestItemId) => apiFetch(`/api/lecturer/request-items/${requestItemId}/approve`, { method: "POST" }),
  reject: (id, reason) =>
    apiFetch(
      `/api/lecturer/requests/${id}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
      { method: "POST" }
    ),
  rejectItem: (requestItemId, reason) =>
    apiFetch(
      `/api/lecturer/request-items/${requestItemId}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
      { method: "POST" }
    ),
  my: () => apiFetch("/api/lecturer/my-requests"),
}

// -------- Technical Officer --------
export const ToRequestAPI = {
  all: () => apiFetch("/api/to/requests"),
  approvedByLab: (labId) => apiFetch(`/api/to/approved-requests?labId=${encodeURIComponent(labId)}`),
  issue: (id) => apiFetch(`/api/to/requests/${id}/issue`, { method: "POST" }),
  issueItem: (requestItemId) => apiFetch(`/api/to/request-items/${requestItemId}/issue`, { method: "POST" }),
  waitItem: (requestItemId, reason = "") =>
    apiFetch(`/api/to/request-items/${requestItemId}/wait?reason=${encodeURIComponent(reason)}`, { method: "POST" }),
  verifyReturn: (id, damaged = false) =>
    apiFetch(`/api/to/requests/${id}/verify-return?damaged=${damaged ? "true" : "false"}`,
      { method: "POST" }),
  verifyReturnItem: (requestItemId, damaged = false) =>
    apiFetch(`/api/to/request-items/${requestItemId}/verify-return?damaged=${damaged ? "true" : "false"}`,
      { method: "POST" }),
}

// -------- Admin --------
export const AdminAPI = {
  departments: () => apiFetch("/api/admin/departments"),
  departmentUsers: (dept) => apiFetch(`/api/admin/departments/${encodeURIComponent(dept)}/users`),

  createHod: (payload) =>
    apiFetch("/api/admin/users/hod", { method: "POST", body: JSON.stringify(payload) }),
  createLecturer: (payload) =>
    apiFetch("/api/admin/users/lecturer", { method: "POST", body: JSON.stringify(payload) }),
  createStaff: (payload) =>
    apiFetch("/api/admin/users/staff", { method: "POST", body: JSON.stringify(payload) }),
  createTo: (payload) => apiFetch("/api/admin/users/to", { method: "POST", body: JSON.stringify(payload) }),
  createStudent: (payload) =>
    apiFetch("/api/admin/users/student", { method: "POST", body: JSON.stringify(payload) }),

  updateUser: (id, payload) =>
    apiFetch(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUser: (id) => apiFetch(`/api/admin/users/${id}`, { method: "DELETE" }),
  disableUser: (id) => apiFetch(`/api/admin/users/${id}/disable`, { method: "POST" }),
}


// -------- HOD Department data --------
// Flattened department requests list (used by HOD Report/Inspect/History)
export const HodDepartmentAPI = {
  requests: () => apiFetch("/api/hod/department/requests"),
}

// -------- Purchases (TO -> HOD -> Admin issue -> HOD receive) --------
export const ToPurchaseAPI = {
  submit: (payload) =>
    apiFetch("/api/to/purchase-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  my: () => apiFetch("/api/to/purchase-requests/my"),
}

export const HodPurchaseAPI = {
  pending: () => apiFetch("/api/hod/purchase-requests"),
  decision: ({ id, approve, comment }) =>
    apiFetch(`/api/hod/purchase-requests/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ approve: !!approve, comment: comment || "" }),
    }),
  my: () => apiFetch("/api/hod/purchase-requests/my"),
  receive: (id) => apiFetch(`/api/hod/purchase-requests/${id}/receive`, { method: "POST" }),
}

export const AdminPurchaseAPI = {
  pendingByDept: (dept) => apiFetch(`/api/admin/departments/${encodeURIComponent(dept)}/purchase-requests`),
  reportByDept: (dept) => apiFetch(`/api/admin/departments/${encodeURIComponent(dept)}/purchase-report`),
  historyByDept: (dept) => apiFetch(`/api/admin/departments/${encodeURIComponent(dept)}/purchase-history`),
  approve: ({ dept, id, issuedDate, comment }) => {
    if (!issuedDate) throw new Error("issuedDate is required")
    const qs = new URLSearchParams()
    qs.set("issuedDate", issuedDate)
    if (comment) qs.set("comment", comment)
    return apiFetch(`/api/admin/departments/${encodeURIComponent(dept)}/purchase-requests/${id}/approve?${qs.toString()}`, { method: "POST" })
  },
  reject: ({ dept, id, reason }) =>
    apiFetch(
      `/api/admin/departments/${encodeURIComponent(dept)}/purchase-requests/${id}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
      { method: "POST" }
    ),
}
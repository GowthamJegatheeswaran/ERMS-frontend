import "../styles/login.css"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { AuthAPI } from "../api/api"
import ForgotModal from "../components/ForgotModal"

const DEPARTMENTS = [
  { value: "CE",  label: "Computer Engineering" },
  { value: "EEE", label: "Electrical & Electronic Engineering" },
  { value: "ME",  label: "Mechanical Engineering" },
  { value: "CE2", label: "Civil Engineering" },
]

// Role → dashboard path
const ROLE_PATHS = {
  staff:    "/student-dashboard",
  student:  "/student-dashboard",
  lecturer: "/lecturer-dashboard",
  to:       "/to-dashboard",
  hod:      "/hod-dashboard",
  admin:    "/admin-dashboard",
}

export default function LoginSignup() {
  const navigate = useNavigate()
  const [showForgot, setShowForgot] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  // ── Login state ───────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  // Special state for "email not verified"
  const [unverifiedEmail, setUnverifiedEmail] = useState(null)
  const [resendMsg, setResendMsg] = useState("")

  // ── Signup state ──────────────────────────────────────────
  const [fullName, setFullName] = useState("")
  const [regNo, setRegNo] = useState("")
  const [department, setDepartment] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [signupError, setSignupError] = useState("")
  const [signupLoading, setSignupLoading] = useState(false)
  // After successful signup → show "check email" screen
  const [signupDone, setSignupDone] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")

  const strongPattern = useMemo(() => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/, [])
  const isWeakPassword = password.length > 0 && !strongPattern.test(password)
  const isConfirmMismatch = confirm.length > 0 && password !== confirm

  // ── LOGIN ─────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError("")
    setUnverifiedEmail(null)
    setResendMsg("")
    if (!loginEmail || !loginPassword) { setLoginError("Please fill all fields"); return }

    try {
      setLoginLoading(true)
      const data = await AuthAPI.login(loginEmail, loginPassword)

      // data should be { token, role, email, message }
      if (!data?.token) { setLoginError("Invalid login response"); return }

      localStorage.setItem("token", data.token)
      localStorage.setItem("role", (data.role || "student").toLowerCase())

      navigate(ROLE_PATHS[(data.role || "").toLowerCase()] || "/login")
    } catch (err) {
      // Handle EMAIL_NOT_VERIFIED specifically
      if (err?.data?.error === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(err.data.email || loginEmail)
      } else {
        setLoginError(err?.message || "Invalid email or password")
      }
    } finally {
      setLoginLoading(false)
    }
  }

  const handleResend = async () => {
    setResendMsg("")
    try {
      await AuthAPI.resendVerification(unverifiedEmail)
      setResendMsg("Verification email resent! Check your inbox.")
    } catch (err) {
      setResendMsg(err?.message || "Failed to resend. Try again later.")
    }
  }

  // ── SIGNUP ────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault()
    setSignupError("")

    if (!fullName || !regNo || !department || !email || !password || !confirm) {
      setSignupError("Please fill all fields"); return
    }
    if (isWeakPassword) { setSignupError("Please use a stronger password"); return }
    if (isConfirmMismatch) { setSignupError("Passwords do not match"); return }

    try {
      setSignupLoading(true)
      // BUG FIX: was `name` — now correctly `fullName`
      await AuthAPI.signupStudent({ fullName, email, regNo, department, password })
      setSignupEmail(email)
      setSignupDone(true)
    } catch (err) {
      setSignupError(err?.message || "Signup failed. Please try again.")
    } finally {
      setSignupLoading(false)
    }
  }

  // ── CHECK EMAIL screen (after signup) ─────────────────────
  if (signupDone) {
    return (
      <div className="login-bg">
        <div className="verify-card" style={{ background: "#fff", borderRadius: 18, padding: "44px 40px", width: "100%", maxWidth: 460, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ fontSize: 58, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
            Check Your Email
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
            We sent a verification link to<br />
            <strong style={{ color: "#2563eb" }}>{signupEmail}</strong>
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>
            Click the link in the email to activate your account. The link expires in 24 hours.
          </p>
          <button
            onClick={() => { setSignupDone(false); setShowSignup(false) }}
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Back to Login
          </button>
          <p style={{ marginTop: 16, fontSize: 12, color: "#94a3b8" }}>
            Didn't receive it?{" "}
            <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
              onClick={async () => {
                try { await AuthAPI.resendVerification(signupEmail) }
                catch {}
              }}>
              Resend
            </span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-bg">
      <div className="sliding-container">
        {/* LEFT PANEL */}
        <div className="login-left">
          {showSignup ? (
            <>
              <h1>Create Account</h1>
              <p>Join the system to request and manage laboratory equipment</p>
            </>
          ) : (
            <>
              <h1>Welcome Back!</h1>
              <p>Faculty of Engineering — University of Jaffna</p>
            </>
          )}
        </div>

        {/* RIGHT FORM */}
        <div className="form-container">
          {!showSignup ? (
            <form className="login-box" onSubmit={handleLogin}>
              <h2>Sign In</h2>

              {/* Email not verified banner */}
              {unverifiedEmail && (
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
                  <strong style={{ color: "#92400e" }}>⚠ Email not verified</strong>
                  <p style={{ color: "#92400e", marginTop: 4 }}>
                    Please verify <strong>{unverifiedEmail}</strong> before logging in.
                  </p>
                  <span
                    onClick={handleResend}
                    style={{ color: "#d97706", fontWeight: 600, cursor: "pointer", fontSize: 12, textDecoration: "underline" }}
                  >
                    Resend verification email
                  </span>
                  {resendMsg && <p style={{ marginTop: 6, fontSize: 12, color: "#15803d" }}>{resendMsg}</p>}
                </div>
              )}

              {loginError && <p className="error">{loginError}</p>}

              <label>Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <label>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <div className="options">
                <span className="link" onClick={() => setShowForgot(true)}>Forgot Password?</span>
              </div>

              <button type="submit" className="login-btn" disabled={loginLoading}>
                {loginLoading ? "Signing in…" : "Sign In"}
              </button>

              <p>
                New here?{" "}
                <span className="link" onClick={() => setShowSignup(true)}>Create Account</span>
              </p>
            </form>
          ) : (
            <form className="signup-box" onSubmit={handleSignup}>
              <h2>Create Account</h2>
              {signupError && <p className="error">{signupError}</p>}

              <label>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />

              <label>Registration Number</label>
              <input placeholder="2022/E/063" value={regNo} onChange={(e) => setRegNo(e.target.value)} required />

              <label>Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>

              <label>University Email</label>
              <input
                type="email"
                pattern="20[0-9]{2}e[0-9]{3}@eng\.jfn\.ac\.lk"
                placeholder="2022e063@eng.jfn.ac.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Min 8 chars — Aa1@..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {isWeakPassword && (
                <small className="error-text">8+ chars with uppercase, lowercase, number &amp; symbol</small>
              )}

              <label>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {isConfirmMismatch && <small className="error-text">Passwords do not match</small>}

              <button type="submit" disabled={signupLoading}>
                {signupLoading ? "Creating account…" : "Create Account"}
              </button>

              <p>
                Already have an account?{" "}
                <span className="link" onClick={() => setShowSignup(false)}>Sign In</span>
              </p>
            </form>
          )}
        </div>
      </div>

      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}
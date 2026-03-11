import "../styles/login.css"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { AuthAPI } from "../api/api"
import ForgotModal from "../components/ForgotModal"

export default function LoginSignup() {
  const navigate = useNavigate()
  const [showForgot, setShowForgot] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  // ── Login state ──
  const [loginEmail,    setLoginEmail]    = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError,    setLoginError]    = useState("")
  const [loginLoading,  setLoginLoading]  = useState(false)

  // ── Signup state ──
  const [fullName,       setFullName]       = useState("")
  const [regNo,          setRegNo]          = useState("")
  const [department,     setDepartment]     = useState("")
  const [email,          setEmail]          = useState("")
  const [password,       setPassword]       = useState("")
  const [confirm,        setConfirm]        = useState("")
  const [signupError,    setSignupError]    = useState("")
  const [signupSuccess,  setSignupSuccess]  = useState("")
  const [signupLoading,  setSignupLoading]  = useState(false)

  const strongPattern = useMemo(() => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/, [])
  const isWeakPassword    = password.length > 0 && !strongPattern.test(password)
  const isConfirmMismatch = confirm.length > 0 && password !== confirm

  // ── Login handler ──
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError("")
    if (!loginEmail || !loginPassword) { setLoginError("Please fill all fields"); return }
    try {
      setLoginLoading(true)
      const data = await AuthAPI.login(loginEmail, loginPassword)
      if (!data?.token || !data?.role) { setLoginError("Invalid response from server"); return }
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role.toLowerCase())
      const redirectMap = {
        student: "/student-dashboard", staff: "/instructor-dashboard",
        instructor: "/instructor-dashboard", lecturer: "/lecturer-dashboard",
        to: "/to-dashboard", hod: "/hod-my-work", admin: "/admin-dashboard",
      }
      navigate(redirectMap[data.role.toLowerCase()] || "/login")
    } catch (err) {
      setLoginError(err?.message || "Invalid email or password")
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Signup handler ──
  const handleSignup = async (e) => {
    e.preventDefault()
    setSignupError(""); setSignupSuccess("")
    if (!fullName || !regNo || !department || !email || !password || !confirm) {
      setSignupError("Please fill all fields"); return
    }
    if (isWeakPassword) {
      setSignupError("Password must be 8+ characters with uppercase, lowercase, number and special character")
      return
    }
    if (isConfirmMismatch) { setSignupError("Passwords do not match"); return }
    try {
      setSignupLoading(true)
      await AuthAPI.signupStudent({ fullName, email, regNo, department, password })
      setFullName(""); setRegNo(""); setDepartment("")
      setEmail(""); setPassword(""); setConfirm("")
      setSignupSuccess("Account created! You can now sign in.")
    } catch (err) {
      setSignupError(err?.message || "Signup failed. Please check your details.")
    } finally {
      setSignupLoading(false)
    }
  }

  return (
    <div className="login-bg">
      {/* Animated orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="sliding-container">

        {/* ── Left panel ── */}
        <div className="login-left">
          <div className="login-left-top">
            {showSignup ? (
              <>
                <h1>Join the System</h1>
                <p>Register to request and manage laboratory equipment at the Faculty of Engineering.</p>
              </>
            ) : (
              <>
                <h1>Welcome Back</h1>
                <p>Sign in to access the Equipment Request Management System.</p>
              </>
            )}

            <div className="login-features">
              {[
                "Submit equipment requests online",
                "Track request status in real-time",
                "Manage returns and issuances",
                "Department-wide inventory view",
              ].map((f, i) => (
                <div key={i} className="login-feature-item">
                  <div className="login-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="login-brand">
            <img src="/images/logo.png" alt="UoJ Logo" className="login-logo" />
            <span>University of Jaffna<br />Faculty of Engineering</span>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="login-right">

          {/* Tabs */}
          <div className="login-tabs">
            <button
              className={`login-tab${!showSignup ? " active" : ""}`}
              onClick={() => { setShowSignup(false); setLoginError("") }}
            >
              Sign In
            </button>
            <button
              className={`login-tab${showSignup ? " active" : ""}`}
              onClick={() => { setShowSignup(true); setSignupError(""); setSignupSuccess("") }}
            >
              Register
            </button>
          </div>

          {/* ── Login form ── */}
          {!showSignup && (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-form-title">Sign in to your account</div>
              <div className="login-form-sub">Enter your credentials to continue</div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={loginLoading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loginLoading}
                />
              </div>

              {loginError && <div className="form-error">{loginError}</div>}

              <button type="submit" className="btn-login" disabled={loginLoading}>
                {loginLoading ? "Signing in…" : "Sign In"}
              </button>

              <p className="forgot-link" onClick={() => setShowForgot(true)}>
                Forgot your password?
              </p>
            </form>
          )}

          {/* ── Signup form ── */}
          {showSignup && (
            <form className="login-form" onSubmit={handleSignup}>
              <div className="login-form-title">Create your account</div>
              <div className="login-form-sub">Student registration — use your university email</div>

              {signupSuccess && <div className="form-success">{signupSuccess}</div>}

              {/* Name + RegNo side by side */}
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    disabled={signupLoading}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Registration No.</label>
                  <input
                    type="text"
                    value={regNo}
                    onChange={e => setRegNo(e.target.value)}
                    placeholder="2022/E/063"
                    disabled={signupLoading}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 15 }}>
                <span className="field-hint">Reg. format: 2022/E/063</span>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} disabled={signupLoading}>
                  <option value="">— Select Department —</option>
                  <option value="CE">Computer Engineering</option>
                  <option value="EEE">Electrical &amp; Electronic Engineering</option>
                </select>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="2022e063@eng.jfn.ac.lk"
                  disabled={signupLoading}
                />
                <span className="field-hint">Must match your registration number</span>
              </div>

              {/* Password + Confirm side by side */}
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    disabled={signupLoading}
                  />
                  {isWeakPassword && <span className="field-error">Weak password</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    disabled={signupLoading}
                  />
                  {isConfirmMismatch && <span className="field-error">Does not match</span>}
                </div>
              </div>
              <div style={{ marginBottom: 15 }}>
                <span className="field-hint">8+ chars · uppercase · number · special char (@$!%*?&amp;)</span>
              </div>

              {signupError && <div className="form-error">{signupError}</div>}

              <button
                type="submit"
                className="btn-login"
                disabled={signupLoading || isWeakPassword || isConfirmMismatch}
              >
                {signupLoading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>

      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}
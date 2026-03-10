import "../styles/login.css"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useRequests } from "../context/RequestContext"
import ForgotModal from "../components/ForgotModal"

export default function LoginSignup() {
  const navigate = useNavigate()
  const { authenticate, registerStudent } = useRequests()
  const [showForgot, setShowForgot] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  // ---------- LOGIN STATE ----------
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")

  // ---------- SIGNUP STATE ----------
  const [fullName, setFullName] = useState("")
  const [regNo, setRegNo] = useState("")
  const [department, setDepartment] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [signupError, setSignupError] = useState("")
  const [signupSuccess, setSignupSuccess] = useState("")

  const strongPattern = useMemo(
    () => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/,
    []
  )

  const isWeakPassword = password.length > 0 && !strongPattern.test(password)
  const isConfirmMismatch = confirm.length > 0 && password !== confirm

  // ---------- LOGIN HANDLER ----------
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError("")

    if (!loginEmail || !loginPassword) {
      setLoginError("Please fill all fields")
      return
    }

    try {
      const user = await authenticate(loginEmail, loginPassword)
      if (!user || !user.role) {
        setLoginError("Invalid login credentials")
        return
      }

      // Save role in localStorage
      localStorage.setItem("role", user.role.toLowerCase())

      // Redirect based on role
      const redirectPaths = {
        staff:"/student-dashboard",
        student: "/student-dashboard",
        lecturer: "/lecturer-dashboard",
        to: "/to-dashboard",
        hod: "/hod-dashboard",
        admin: "/admin-dashboard",
      }

      navigate(redirectPaths[user.role.toLowerCase()] || "/login")
    } catch (err) {
      setLoginError(err?.message || "Invalid email or password")
    }
  }

  // ---------- SIGNUP HANDLER ----------
  const handleSignup = async (e) => {
    e.preventDefault()
    setSignupError("")
    setSignupSuccess("")

    if (!fullName || !regNo || !department || !email || !password || !confirm) {
      setSignupError("Please fill all fields")
      return
    }
    if (isWeakPassword) {
      setSignupError("Please use a strong password")
      return
    }
    if (isConfirmMismatch) {
      setSignupError("Passwords do not match")
      return
    }

    try {
      await registerStudent({ name: fullName, regNo, department, email, password })

      // Clear form
      setFullName("")
      setRegNo("")
      setDepartment("")
      setEmail("")
      setPassword("")
      setConfirm("")

      setSignupError("")
      setSignupSuccess("Signup successful! You can now log in.")
      setTimeout(() => setSignupSuccess(""), 3000)
    } catch (err) {
      setSignupError(err?.message || "Signup failed")
    }
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
              <p>Enter your personal details to login</p>
            </>
          )}
        </div>

        {/* RIGHT FORM */}
        <div className="form-container">
          {!showSignup ? (
            <form className="login-box" onSubmit={handleLogin}>
              <h2>Login</h2>
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
  <span className="link" onClick={() => setShowForgot(true)}>
    Forgot Password?
  </span>
</div>

              <button type="submit" className="login-btn">Sign In</button>

              <p>
                New here?{" "}
                <span className="link" onClick={() => setShowSignup(true)}>Sign Up</span>
              </p>
            </form>
          ) : (
            <form className="signup-box" onSubmit={handleSignup}>
              <h2>Create Account</h2>
              {signupError && <p className="error">{signupError}</p>}
              {signupSuccess && <p className="success">{signupSuccess}</p>}

              <label>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />

              <label>Registration Number</label>
              <input placeholder="2022/E/XXX" value={regNo} onChange={(e) => setRegNo(e.target.value)} required />

              <label>Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                <option value="">-- Select Department --</option>
                <option value="CE">Computer Engineering</option>
                <option value="EEE">Electrical & Electronic Engineering</option>
              </select>

              <label>Email</label>
              <input
                type="email"
                pattern="20[0-9]{2}e[0-9]{3}@eng\.jfn\.ac\.lk"
                placeholder="20XXeXXX@eng.jfn.ac.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Password</label>
              <input type="password" placeholder="Min 8 chars, Aa1@" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {isWeakPassword && <small className="error-text">Must be 8+ characters with uppercase, lowercase, number & symbol</small>}

              <label>Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              {isConfirmMismatch && <small className="error-text">Passwords do not match</small>}

              <button type="submit">Sign Up</button>

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
import "../styles/login.css";
import ForgotModal from "../components/ForgotModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests } from "../context/RequestContext";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // for signup
  const [regNo, setRegNo] = useState(""); // for signup
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const navigate = useNavigate();
  const { authenticate } = useRequests();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill all fields");

    try {
      const user = await authenticate(email, password);
      setError("");
      navigate(user.redirect);
    } catch (err) {
      setError(err?.message || "Invalid email or password");
    }
  };

  return (
    <div className="login-bg">
      <div className="login-container sliding-container">
        {/* LEFT TEXT */}
        <div className={`login-left ${isSignup ? "slide-left" : ""}`}>
          <h1>{isSignup ? "Join Equipment Request System" : "Welcome to Equipment Request System"}</h1>
          <p>
            {isSignup
              ? "Create your account to start submitting and tracking equipment requests."
              : "Efficiently request, track, and manage laboratory equipment for students & faculty."}
          </p>
        </div>

        {/* RIGHT FORM */}
        <div className={`form-container ${isSignup ? "slide-right" : ""}`}>
          {!isSignup ? (
            <form className="login-box" onSubmit={handleLogin}>
              <h2>Login</h2>
              <p>Access your account</p>
              {error && <p className="error">{error}</p>}

              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <div className="options">
                <label className="remember">
                  <input type="checkbox" /> Remember me
                </label>
                <span className="link" onClick={() => setShowForgot(true)}>Forgot Password?</span>
              </div>

              <button type="submit" className="login-btn">Login</button>

              <p>
                <span className="text">New here?</span>{" "}
                <span className="link" onClick={() => setIsSignup(true)}>Register</span>
              </p>
            </form>
          ) : (
            <form className="login-box">
              <h2>Create Account</h2>
              <p>Student registration</p>

              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />

              <label>Registration Number</label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="2022/E/XXX"
                required
              />

              <label>Email</label>
              <input type="email" placeholder="Enter your email" required />

              <label>Password</label>
              <input type="password" placeholder="Enter your password" required />

              <label>Confirm Password</label>
              <input type="password" placeholder="Confirm your password" required />

              <button className="login-btn">Register</button>

              <p>
                <span className="text">Already have an account?</span>{" "}
                <span className="link" onClick={() => setIsSignup(false)}>Login</span>
              </p>
            </form>
          )}
        </div>
      </div>

      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
import "../styles/login.css";
import ForgotModal from "../components/ForgotModal";
import SignupOverlay from "../components/SignupOverlay";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests } from "../context/RequestContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignup, setShowSignup] = useState(false);
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
      {/* Transparent blurred background */}
      <div className="login-back-box"></div>

      <div className="login-container">
        {/* LEFT SIDE TEXT */}
        <div className="login-left">
          <h1>Welcome to Equipment Request System</h1>
          <p>
            Efficiently request, track, and manage laboratory equipment
            for students & faculty. Streamline lab management with ease.
          </p>
        </div>

        {/* RIGHT SIDE FORM */}
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
            <span className="link" onClick={() => setShowForgot(true)}>
              Forgot Password?
            </span>
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>

          <p>
            <span className="text">Student?</span>{" "}
            <span className="link" onClick={() => navigate("/signup")}>
              Register
            </span>
          </p>
        </form>
      </div>

      {showSignup && <SignupOverlay onClose={() => setShowSignup(false)} />}
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
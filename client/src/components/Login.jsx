import React, { useState, useEffect } from "react";
import {
  LuUser,
  LuLock,
  LuEye,
  LuEyeOff,
  LuArrowRight,
  LuBookOpen,
  LuUsers,
  LuStar,
} from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logoImg from "../assets/mastery_zone_logo_transparent.png";
import illustrationImg from "../assets/login_illustration.png";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_URL || "";
const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : "/auth";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const token = await user.getIdToken();

      const response = await fetch(`${AUTH_BASE}/firebase-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { message: text || `Server error (${response.status})` };
      }

      if (!response.ok) {
        alert(data.message || `Firebase Login failed on server (Status ${response.status})`);
        return;
      }

      localStorage.setItem("token", data.token);
      toast.success("Login successful!");
      navigate("/home");
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Failed to login with Google: " + (error.message || "Unknown error"));
    }
  };

  useEffect(() => {
    const errors = {};
    if (touched.identifier) {
      if (!identifier.trim()) {
        errors.identifier = "Username or Email is required";
      }
    }
    if (touched.password) {
      if (!password) {
        errors.password = "Password is required";
      }
    }
    setValidationErrors(errors);
  }, [identifier, password, touched]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    setTouched({ identifier: true, password: true });

    if (!identifier.trim() || !password) {
      setValidationErrors({
        identifier: !identifier.trim() ? "Username or Email is required" : "",
        password: !password ? "Password is required" : "",
      });
      return;
    }

    try {
      const response = await fetch(`${AUTH_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail: identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      toast.success("Login successful!");
      navigate("/home");
    } catch (err) {
      console.error("Login submit error:", err);
      alert("Failed to connect to server");
    }
  };

  const handleGuestLogin = async () => {
    try {
      const response = await fetch(`${AUTH_BASE}/guest-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Guest Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      toast.success("Guest login successful!");
      navigate("/home");
    } catch (err) {
      console.error("Guest login error:", err);
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="mz-login-page">
      {/* Background Curved Accents */}
      <svg
        className="mz-bg-wave-tl"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tlGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="tlGrad2" x1="0%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -50 -50 L 320 -50 C 260 120 180 220 -50 320 Z"
          fill="url(#tlGrad1)"
          filter="blur(25px)"
        />
        <path
          d="M -80 0 C 140 30 240 180 80 380 C 10 320 -60 220 -80 150 Z"
          fill="url(#tlGrad2)"
          filter="blur(20px)"
          opacity="0.6"
        />
      </svg>

      <svg
        className="mz-bg-wave-br"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="brGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 520 520 L 150 520 C 200 360 280 240 520 150 Z"
          fill="url(#brGrad1)"
          filter="blur(25px)"
        />
        <path
          d="M 520 420 C 350 400 240 280 360 80 C 440 160 480 280 520 340 Z"
          fill="url(#brGrad2)"
          filter="blur(20px)"
          opacity="0.7"
        />
      </svg>

      {/* Top Right Header Note */}
      <div className="mz-top-header">
        <span>Better Learning</span>
        <span className="mz-divider">|</span>
        <span>Brighter Future</span>
      </div>

      {/* Main Two-Column Container */}
      <div className="mz-main-container">
        {/* Left Column: Login Card */}
        <div className="mz-card">
          <div className="mz-logo-wrapper">
            <img
              src={logoImg}
              alt="Mastery Zone - Learn Grow Achieve"
              className="mz-logo-img"
            />
          </div>

          <h2 className="mz-card-title">Welcome Back!</h2>
          <p className="mz-card-subtitle">
            Log in to continue your learning journey and reach your goals.
          </p>

          <form onSubmit={handleLoginSubmit} className="mz-form">
            <div
              className={`mz-input-field ${
                validationErrors.identifier ? "error" : ""
              }`}
            >
              <LuUser className="mz-input-icon" />
              <input
                type="text"
                placeholder="Username or E-Mail"
                autoComplete="off"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setTouched({ ...touched, identifier: true });
                }}
              />
            </div>
            {validationErrors.identifier && (
              <div className="mz-error-text">{validationErrors.identifier}</div>
            )}

            <div
              className={`mz-input-field ${
                validationErrors.password ? "error" : ""
              }`}
            >
              <LuLock className="mz-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setTouched({ ...touched, password: true });
                }}
              />
              <button
                type="button"
                className="mz-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {validationErrors.password && (
              <div className="mz-error-text">{validationErrors.password}</div>
            )}

            <div className="mz-options-row">
              <label className="mz-remember-label">
                <input
                  type="checkbox"
                  className="mz-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a href="/forgot-password" className="mz-forgot-link">
                Forgot password?
              </a>
            </div>

            <button className="mz-btn-login" type="submit">
              Log In <LuArrowRight size={18} />
            </button>
          </form>

          <div className="mz-divider-row">
            <div className="mz-divider-line"></div>
            <span className="mz-divider-text">OR</span>
            <div className="mz-divider-line"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mz-btn-google"
            type="button"
          >
            <FcGoogle size={20} /> Sign in with Google
          </button>

          <p className="mz-signup-prompt">
            Don't have an account?{" "}
            <a href="/signup" className="mz-signup-link">
              Sign up
            </a>
          </p>

          <button
            onClick={handleGuestLogin}
            className="mz-btn-guest"
            type="button"
          >
            <LuUser size={18} />
            <span>
              Login as Guest{" "}
              <span className="mz-guest-highlight">(Interviewee)</span>
            </span>
          </button>
        </div>

        {/* Right Column: Hero Content & Illustration */}
        <div className="mz-right-hero">
          <h1 className="mz-hero-heading">
            <span className="mz-hero-goals">Your Goals.</span>
            <span className="mz-hero-mission">Our Mission.</span>
          </h1>

          <p className="mz-hero-subtitle">
            Master new skills, track your progress,
            {"\n"}
            and build the future you want — all in one place.
          </p>

          <div className="mz-illustration-container">
            <img
              src={illustrationImg}
              alt="Mastery Zone Learning Illustration"
              className="mz-illustration-img"
            />
          </div>

          <div className="mz-features-grid">
            <div className="mz-feature-item">
              <div className="mz-feature-icon-box purple">
                <LuBookOpen size={22} />
              </div>
              <span className="mz-feature-label">
                Learn{"\n"}at your pace
              </span>
            </div>

            <div className="mz-feature-item">
              <div className="mz-feature-icon-box cyan">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                  <path d="M17 4h4v4" />
                  <path d="M21 4L13 12" />
                </svg>
              </div>
              <span className="mz-feature-label">
                Track{"\n"}your progress
              </span>
            </div>

            <div className="mz-feature-item">
              <div className="mz-feature-icon-box blue">
                <LuUsers size={22} />
              </div>
              <span className="mz-feature-label">
                Join a growing{"\n"}community
              </span>
            </div>

            <div className="mz-feature-item">
              <div className="mz-feature-icon-box pink">
                <LuStar size={22} />
              </div>
              <span className="mz-feature-label">
                Build a{"\n"}brighter future
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

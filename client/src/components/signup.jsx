import React, { useState, useEffect } from "react";
import {
  LuUser,
  LuMail,
  LuSmartphone,
  LuLock,
  LuEye,
  LuEyeOff,
  LuArrowRight,
  LuBookOpen,
  LuStar,
} from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase/firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import logoIcon from "../assets/logo_icon_transparent.png";
import stickerImg from "../assets/signup_sticker.png";
import "./Signup.css";

const API_BASE = import.meta.env.VITE_API_URL || "";
const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : "/auth";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setTouched({ ...touched, [name]: true });
  };

  useEffect(() => {
    const errors = {};

    if (touched.firstName) {
      if (!formData.firstName.trim()) {
        errors.firstName = "First name is required";
      } else if (formData.firstName.length < 2) {
        errors.firstName = "Must be at least 2 characters";
      }
    }

    if (touched.lastName) {
      if (!formData.lastName.trim()) {
        errors.lastName = "Last name is required";
      } else if (formData.lastName.length < 2) {
        errors.lastName = "Must be at least 2 characters";
      }
    }

    if (touched.email) {
      if (!formData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Invalid email format";
      }
    }

    if (touched.password) {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    }

    if (touched.confirmPassword) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = "Confirm password is required";
      } else if (formData.confirmPassword !== formData.password) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setValidationErrors(errors);
  }, [formData, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword ||
      formData.confirmPassword !== formData.password
    ) {
      setServerError("Please fix the validation errors before submitting.");
      return;
    }

    try {
      const response = await fetch(`${AUTH_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || "Registration failed");
        return;
      }

      setServerError("");
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setServerError("Failed to connect to server");
    }
  };

  const handleGoogleSignUp = async () => {
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
        alert(data.message || `Google registration failed on server (Status ${response.status})`);
        return;
      }

      localStorage.setItem("token", data.token);
      toast.success("Account created successfully with Google!");
      navigate("/home");
    } catch (error) {
      console.error("Google Signup Error:", error);
      alert("Failed to sign up with Google: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="mz-signup-page">
      {/* Background Curved Accents */}
      <svg
        className="mz-signup-wave-bl"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="blGrad1" x1="0%" y1="50%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#172554" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="blGrad2" x1="0%" y1="50%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b21a8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M 0 250 C 130 330 260 410 500 500 L 0 500 Z"
          fill="url(#blGrad1)"
        />
        <path
          d="M 0 370 C 120 380 230 425 410 500 L 0 500 Z"
          fill="url(#blGrad2)"
        />
      </svg>

      {/* Top Navigation Bar */}
      <nav className="mz-signup-nav">
        <Link to="/" className="mz-nav-logo-link">
          <img
            src={logoIcon}
            alt="Mastery Zone"
            className="mz-nav-logo-icon"
          />
          <div className="mz-nav-logo-text-group">
            <span className="mz-nav-brand-title">
              Mastery <span className="mz-brand-accent">Zone</span>
            </span>
            <span className="mz-nav-brand-tagline">Learn · Grow · Achieve</span>
          </div>
        </Link>

        <div className="mz-nav-right">
          <span className="mz-nav-text">Already have an account?</span>
          <Link to="/login" className="mz-nav-login-btn">
            Login <LuArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* Main Two-Column Container */}
      <div className="mz-signup-container">
        {/* Left Column: Brand Hero & Features */}
        <div className="mz-signup-left">
          <h1 className="mz-signup-hero-title">
            <span className="mz-hero-white">Start Your</span>
            <span className="mz-hero-gradient">Learning Journey</span>
            <span className="mz-hero-white">Today</span>
          </h1>

          <p className="mz-signup-hero-sub">
            Create your account and unlock personalized learning, track your
            progress, and build a brighter future.
          </p>

          <div className="mz-feature-list">
            <div className="mz-feature-row">
              <div className="mz-feature-badge">
                <LuBookOpen />
              </div>
              <div className="mz-feature-text">
                <span className="mz-feat-title">Learn</span>
                <span className="mz-feat-desc">
                  Access quality courses anytime
                </span>
              </div>
            </div>

            <div className="mz-feature-row">
              <div className="mz-feature-badge">
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
              <div className="mz-feature-text">
                <span className="mz-feat-title">Track</span>
                <span className="mz-feat-desc">Monitor your progress</span>
              </div>
            </div>

            <div className="mz-feature-row">
              <div className="mz-feature-badge">
                <LuStar fill="currentColor" />
              </div>
              <div className="mz-feature-text">
                <span className="mz-feat-title">Achieve</span>
                <span className="mz-feat-desc">
                  Build the skills for tomorrow
                </span>
              </div>
            </div>
          </div>

          <div className="mz-signup-sticker-container">
            <img
              src={stickerImg}
              alt="Better Skills Brighter Future"
              className="mz-signup-sticker"
            />
          </div>
        </div>

        {/* Right Column: Registration Card */}
        <div className="mz-signup-card">
          <h2 className="mz-signup-card-title">
            Create a new <span className="mz-title-purple">account</span>
          </h2>
          <p className="mz-signup-card-sub">
            Join Mastery Zone and start building your dream career.
          </p>

          {serverError && (
            <div
              style={{
                color: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12.5px",
                marginBottom: "14px",
                textAlign: "center",
              }}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mz-signup-form">
            {/* First Name */}
            <div
              className={`mz-signup-input-field ${
                validationErrors.firstName ? "error" : ""
              }`}
            >
              <LuUser className="mz-signup-input-icon" />
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                autoComplete="off"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            {validationErrors.firstName && (
              <div className="mz-signup-error-text">
                {validationErrors.firstName}
              </div>
            )}

            {/* Last Name */}
            <div
              className={`mz-signup-input-field ${
                validationErrors.lastName ? "error" : ""
              }`}
            >
              <LuUser className="mz-signup-input-icon" />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                autoComplete="off"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            {validationErrors.lastName && (
              <div className="mz-signup-error-text">
                {validationErrors.lastName}
              </div>
            )}

            {/* E-Mail */}
            <div
              className={`mz-signup-input-field ${
                validationErrors.email ? "error" : ""
              }`}
            >
              <LuMail className="mz-signup-input-icon" />
              <input
                type="email"
                name="email"
                placeholder="E-Mail"
                autoComplete="off"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {validationErrors.email && (
              <div className="mz-signup-error-text">
                {validationErrors.email}
              </div>
            )}

            {/* Mobile number (optional) */}
            <div className="mz-signup-input-field">
              <LuSmartphone className="mz-signup-input-icon" />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Mobile number (optional)"
                autoComplete="off"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div
              className={`mz-signup-input-field ${
                validationErrors.password ? "error" : ""
              }`}
            >
              <LuLock className="mz-signup-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="mz-signup-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {validationErrors.password && (
              <div className="mz-signup-error-text">
                {validationErrors.password}
              </div>
            )}

            {/* Re-enter password */}
            <div
              className={`mz-signup-input-field ${
                validationErrors.confirmPassword ? "error" : ""
              }`}
            >
              <LuLock className="mz-signup-input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="mz-signup-eye-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <div className="mz-signup-error-text">
                {validationErrors.confirmPassword}
              </div>
            )}

            {/* Remember me */}
            <label className="mz-signup-remember-row">
              <input
                type="checkbox"
                className="mz-signup-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            {/* SIGN UP Button */}
            <button className="mz-signup-btn" type="submit">
              SIGN UP <LuArrowRight size={18} />
            </button>
          </form>

          {/* OR Divider */}
          <div className="mz-signup-divider">
            <div className="mz-divider-line"></div>
            <span className="mz-divider-text">OR</span>
            <div className="mz-divider-line"></div>
          </div>

          {/* Google Sign up */}
          <button
            onClick={handleGoogleSignUp}
            className="mz-signup-btn-google"
            type="button"
          >
            <FcGoogle size={20} /> Sign up with Google
          </button>

          {/* Footer Link */}
          <div className="mz-signup-footer-link">
            Already have an account?{" "}
            <Link to="/login">
              Login <LuArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

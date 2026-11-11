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
import { signInWithPopup, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, provider } from "../firebase/firebaseConfig";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";

import logoIcon from "../assets/logo_icon_transparent.png";
import illustrationImg from "../assets/login_illustration.png";
import "./Signup.css";
import ThemeToggle from "./ThemeToggle.jsx";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from?.pathname || "/home";

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

    setIsSubmitting(true);
    let firebaseUid = null;
    let firebaseToken = null;

    // ── 1. CREATE USER IN FIREBASE (EMAIL & PASSWORD) ──
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      firebaseUid = userCredential.user.uid;
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      await updateProfile(userCredential.user, { displayName: fullName });
      firebaseToken = await userCredential.user.getIdToken();
    } catch (fbErr) {
      console.warn("Firebase create user attempt:", fbErr.code, fbErr.message);
      if (fbErr.code === "auth/email-already-in-use") {
        setServerError("This email address is already registered in Firebase. Please log in.");
        toast.error("Email is already registered. Please log in.");
        setIsSubmitting(false);
        return;
      } else if (fbErr.code === "auth/weak-password") {
        setServerError("Password must be at least 6 characters long.");
        toast.error("Password must be at least 6 characters long.");
        setIsSubmitting(false);
        return;
      }
    }

    // ── 2. REGISTER IN BACKEND DATABASE & INITIALIZE TELEMETRY ──
    try {
      const response = await fetch(`${AUTH_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : {}),
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          uid: firebaseUid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || "Registration failed");
        return;
      }

      setServerError("");
      toast.success("Account created successfully via Firebase! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setServerError("Failed to connect to server");
    } finally {
      setIsSubmitting(false);
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
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          uid: user.uid,
          photoURL: user.photoURL,
          token,
        }),
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { message: text || `Server error (${response.status})` };
      }

      if (!response.ok) {
        toast.error(data.message || `Google registration failed on server (Status ${response.status})`);
        return;
      }

      // Purge any prior session residual data completely to ensure strict individual isolation
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem("mz_session_active", "true");
      sessionStorage.setItem("token", data.token);

      localStorage.setItem("token", data.token);
      if (data.user) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("mz_user", JSON.stringify(data.user));
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("mz_user", JSON.stringify(data.user));
        localStorage.setItem("userName", data.user.fullName || data.user.username || data.user.email);
        localStorage.setItem("userEmail", data.user.email);
      }
      toast.success("Account created successfully with Google!");
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      console.error("Google Signup Error:", error);
      toast.error("Failed to sign up with Google: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="mz-signup-page">
      {/* Decorative Wave: Top Left Organic Gradient Curve */}
      <svg
        className="mz-signup-wave-tl"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="suTlGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.85" />
            <stop offset="42%" stopColor="#60a5fa" stopOpacity="0.75" />
            <stop offset="85%" stopColor="#93c5fd" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="suTlGrad2" x1="15%" y1="0%" x2="90%" y2="85%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <filter id="suTlWaveBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        <path
          d="M -60 -60 L 400 -60 C 330 160 230 310 -60 410 Z"
          fill="url(#suTlGrad1)"
          filter="url(#suTlWaveBlur)"
        />
        <path
          d="M -80 -20 C 160 40 310 210 110 500 C 30 410 -50 280 -80 180 Z"
          fill="url(#suTlGrad2)"
          opacity="0.75"
          filter="url(#suTlWaveBlur)"
        />
      </svg>

      {/* Decorative Wave: Bottom Left Soft Sky Blue Curve */}
      <svg
        className="mz-signup-wave-bl"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="suBlGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#bfdbfe" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
          </linearGradient>
          <filter id="suBlWaveBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <path
          d="M -40 540 L -40 240 C 130 280 230 400 290 540 Z"
          fill="url(#suBlGrad)"
          filter="url(#suBlWaveBlur)"
        />
      </svg>

      {/* Decorative Wave: Bottom Right Soft Lavender Accent */}
      <svg
        className="mz-signup-wave-br"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="suBrGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.38" />
            <stop offset="40%" stopColor="#818cf8" stopOpacity="0.32" />
            <stop offset="80%" stopColor="#60a5fa" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0" />
          </linearGradient>
          <filter id="suBrWaveBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="24" />
          </filter>
        </defs>
        <path
          d="M 640 640 L 220 640 C 310 460 430 350 640 260 Z"
          fill="url(#suBrGrad)"
          filter="url(#suBrWaveBlur)"
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
            <span className="mz-nav-brand-title">Mastery Zone</span>
            <span className="mz-nav-brand-tagline">Learn · Grow · Succeed</span>
          </div>
        </Link>

        <div className="mz-nav-right">
          <ThemeToggle />
          <span className="mz-nav-text">Already have an account?</span>
          <Link to="/login" className="mz-nav-login-btn">
            Login <LuArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* Main 3-Section Container: Left Hero, Center Registration Card, Right Illustration */}
      <main className="mz-signup-container">
        {/* Left Column: Brand Hero & 3 Feature Highlights */}
        <section className="mz-signup-left">
          <div className="su-hero-anim-1">
            <h1 className="mz-signup-hero-title">
              <span className="mz-hero-dark">Start Your</span>
              <span className="mz-hero-gradient">Learning Journey</span>
              <span className="mz-hero-dark">Today</span>
            </h1>

            <p className="mz-signup-hero-sub">
              Create your account and unlock personalized learning, track your
              progress, and build a brighter future.
            </p>
          </div>

          <div className="mz-feature-list su-hero-anim-2">
            <div className="mz-feature-row su-feat-item-1">
              <div className="mz-feature-badge blue">
                <LuBookOpen size={20} />
              </div>
              <div className="mz-feature-text">
                <span className="mz-feat-title">Learn</span>
                <span className="mz-feat-desc">Access quality courses anytime.</span>
              </div>
            </div>

            <div className="mz-feature-row su-feat-item-2">
              <div className="mz-feature-badge purple">
                <svg
                  width="20"
                  height="20"
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
                <span className="mz-feat-desc">Monitor your progress.</span>
              </div>
            </div>

            <div className="mz-feature-row su-feat-item-3">
              <div className="mz-feature-badge green">
                <LuStar size={20} />
              </div>
              <div className="mz-feature-text">
                <span className="mz-feat-title">Achieve</span>
                <span className="mz-feat-desc">Build the skills for tomorrow.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Center-Right Column: Registration Card */}
        <section className="mz-signup-card-section">
          <div className="mz-signup-card">
            <div className="su-card-anim-header">
              <h2 className="mz-signup-card-title">
                Create a new <span className="mz-title-purple">account</span>
              </h2>
              <p className="mz-signup-card-sub">
                Join Mastery Zone and start building your dream career.
              </p>
            </div>

            {serverError && (
              <div className="mz-signup-server-error">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mz-signup-form" noValidate>
              {/* First Name */}
              <div
                className={`mz-signup-input-field su-form-anim-1 ${
                  validationErrors.firstName ? "error" : ""
                }`}
              >
                <LuUser className="mz-signup-input-icon" />
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  autoComplete="given-name"
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
                className={`mz-signup-input-field su-form-anim-2 ${
                  validationErrors.lastName ? "error" : ""
                }`}
              >
                <LuUser className="mz-signup-input-icon" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  autoComplete="family-name"
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
                className={`mz-signup-input-field su-form-anim-3 ${
                  validationErrors.email ? "error" : ""
                }`}
              >
                <LuMail className="mz-signup-input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="E-Mail"
                  autoComplete="email"
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
              <div className="mz-signup-input-field su-form-anim-4">
                <LuSmartphone className="mz-signup-input-icon" />
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Mobile number (optional)"
                  autoComplete="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div
                className={`mz-signup-input-field su-form-anim-5 ${
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
                  {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
              {validationErrors.password && (
                <div className="mz-signup-error-text">
                  {validationErrors.password}
                </div>
              )}

              {/* Re-enter password */}
              <div
                className={`mz-signup-input-field su-form-anim-6 ${
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
                  {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <div className="mz-signup-error-text">
                  {validationErrors.confirmPassword}
                </div>
              )}

              {/* Remember me */}
              <label className="mz-signup-remember-row su-form-anim-7">
                <input
                  type="checkbox"
                  className="mz-signup-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              {/* SIGN UP Button */}
              <button
                className="mz-signup-btn su-form-anim-8"
                type="submit"
                disabled={isSubmitting}
              >
                <span>SIGN UP</span>
                <LuArrowRight size={18} className="mz-signup-btn-arrow" />
              </button>
            </form>

            {/* OR Divider */}
            <div className="mz-signup-divider su-form-anim-9">
              <div className="mz-divider-line"></div>
              <span className="mz-divider-text">OR</span>
              <div className="mz-divider-line"></div>
            </div>

            {/* Google Sign up */}
            <button
              onClick={handleGoogleSignUp}
              className="mz-signup-btn-google su-form-anim-10"
              type="button"
            >
              <FcGoogle size={20} className="mz-google-icon" />
              <span>Sign up with Google</span>
            </button>

            {/* Footer Link */}
            <div className="mz-signup-footer-link su-form-anim-11">
              <span>Already have an account?</span>
              <Link to="/login" className="mz-signup-login-link">
                Login <LuArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Far Right: Learning Illustration */}
        <section className="mz-signup-illustration-section su-illus-anim" aria-hidden="true">
          <div className="mz-signup-illustration-wrap">
            <img
              src={illustrationImg}
              alt="Mastery Zone Learning Illustration"
              className="mz-signup-illustration-img"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Signup;

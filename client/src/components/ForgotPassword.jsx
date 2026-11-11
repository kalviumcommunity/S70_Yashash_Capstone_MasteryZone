import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LuMail, LuArrowLeft, LuArrowRight, LuHeadphones } from "react-icons/lu";
import { toast } from "react-toastify";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

import logoIcon from "../assets/logo_icon_transparent.png";
import mailIcon from "../assets/forgot_password_mail_icon.png";
import illustrationImg from "../assets/forgot_password_illustration.png";
import "./ForgotPassword.css";
import ThemeToggle from "./ThemeToggle.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";
const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : "/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const isEmailValid = (val) => {
    return val && val.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const hasError = touched && !isEmailValid(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (!email.trim()) {
      setStatus({ type: "error", message: "Please enter your email address." });
      return;
    }

    if (!isEmailValid(email)) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    let sent = false;

    // Dispatch official Mastery Zone branded password reset email with exact client origin
    try {
      const response = await fetch(`${AUTH_BASE}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail: email.trim(),
          clientOrigin: window.location.origin,
        }),
      });

      const resData = await response.json();

      if (response.ok) {
        sent = true;
      } else {
        const errorMsg = resData.message || "No registered account found with that email address.";
        setStatus({
          type: "error",
          message: errorMsg,
        });
        toast.error(errorMsg);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend reset fetch warning:", err);
    }

    if (sent) {
      setStatus({
        type: "success",
        message: "Password reset link has been dispatched to your email!",
      });
      toast.success("Reset link sent! Check your inbox.");
      setEmail("");
      setTouched(false);
    } else {
      const errMsg = "Unable to find an account with that email address. Please check and try again.";
      setStatus({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    }

    setLoading(false);
  };

  return (
    <div className="mz-forgot-page">
      {/* Ambient Glow Orbs for Soft Page Background */}
      <div className="mz-forgot-glow mz-forgot-glow-tl" aria-hidden="true" />
      <div className="mz-forgot-glow mz-forgot-glow-br" aria-hidden="true" />

      {/* Top Navigation Bar */}
      <header className="mz-forgot-nav">
        <Link to="/" className="mz-forgot-logo-link" aria-label="Mastery Zone Home">
          <img
            src={logoIcon}
            alt="Mastery Zone"
            className="mz-forgot-logo-icon"
          />
          <div className="mz-forgot-logo-text-group">
            <span className="mz-forgot-brand-title">Mastery Zone</span>
            <span className="mz-forgot-brand-tagline">Learn · Grow · Succeed</span>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
          <Link to="/login" className="mz-forgot-nav-back-btn">
            <LuArrowLeft size={16} className="mz-back-arrow" />
            <span>Back to Login</span>
          </Link>
        </div>
      </header>

      {/* Main Two-Column Centered Layout */}
      <main className="mz-forgot-container">
        {/* Left Column: Form Card */}
        <section className="mz-forgot-card-section" aria-label="Password Reset Form">
          <div className="mz-forgot-card">
            {/* 3D Mail Badge */}
            <div className="mz-forgot-badge-wrap fp-anim-1">
              <img
                src={mailIcon}
                alt="Reset Password"
                className="mz-forgot-mail-badge"
              />
            </div>

            {/* Title & Subtitle */}
            <h1 className="mz-forgot-title fp-anim-2">
              Forgot <span className="mz-title-blue">Password?</span>
            </h1>

            <p className="mz-forgot-sub fp-anim-3">
              No worries! Enter your email address and we'll send you a reset link.
            </p>

            {/* Status Feedback Message */}
            {status.message && (
              <div className={`mz-forgot-status-msg ${status.type}`}>
                {status.message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mz-forgot-form" noValidate>
              <div
                className={`mz-forgot-input-wrap fp-anim-4 ${
                  hasError ? "mz-input-error" : ""
                }`}
              >
                <LuMail className="mz-forgot-input-icon" aria-hidden="true" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched) setTouched(true);
                  }}
                  onBlur={() => setTouched(true)}
                  className="mz-forgot-input"
                  autoComplete="email"
                  aria-label="Email address"
                  required
                />
              </div>

              {hasError && (
                <span className="mz-input-error-text">
                  Please enter a valid email address
                </span>
              )}

              {/* Primary Reset Button */}
              <button
                type="submit"
                className="mz-forgot-submit-btn fp-anim-5"
                disabled={loading}
              >
                <span>{loading ? "Sending Reset Link..." : "Send Reset Link"}</span>
                <LuArrowRight size={17} className="mz-submit-arrow" />
              </button>

              {/* OR Divider */}
              <div className="mz-forgot-divider fp-anim-6">
                <span>OR</span>
              </div>

              {/* Secondary Back to Login Button */}
              <Link to="/login" className="mz-forgot-login-btn fp-anim-7">
                Back to Login
              </Link>

              {/* Support Contact Footer */}
              <div className="mz-forgot-support fp-anim-8">
                <LuHeadphones className="mz-forgot-support-icon" aria-hidden="true" />
                <span>
                  Need help?{" "}
                  <a
                    href="mailto:yashashyashash1@gmail.com"
                    className="mz-forgot-support-link"
                    title="yashashyashash1@gmail.com"
                  >
                    Contact our support team
                    <span className="mz-support-tooltip" role="tooltip">
                      yashashyashash1@gmail.com
                    </span>
                  </a>
                </span>
              </div>
            </form>
          </div>
        </section>

        {/* Right Column: 3D Illustration */}
        <section
          className="mz-forgot-illustration-section fp-illus-anim"
          aria-hidden="true"
        >
          <div className="mz-forgot-illustration-wrap">
            <img
              src={illustrationImg}
              alt="Mastery Zone Password Recovery Illustration"
              className="mz-forgot-illustration"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForgotPassword;

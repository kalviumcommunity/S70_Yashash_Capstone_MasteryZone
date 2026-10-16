import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LuMail, LuArrowLeft, LuArrowRight, LuHeadphones } from "react-icons/lu";
import { toast } from "react-toastify";

import logoIcon from "../assets/logo_icon_transparent.png";
import mailIcon from "../assets/forgot_password_mail_icon.png";
import illustrationImg from "../assets/forgot_password_illustration.png";
import stickerImg from "../assets/forgot_password_sticker.png";
import "./ForgotPassword.css";

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

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${AUTH_BASE}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({
          type: "error",
          message: data.message || "Unable to send reset link. Please check your email.",
        });
        toast.error(data.message || "Failed to send reset link");
        return;
      }

      setStatus({
        type: "success",
        message: data.message || "Password reset link sent to your email!",
      });
      toast.success("Reset link sent! Check your inbox.");
      setEmail("");
      setTouched(false);
    } catch (err) {
      console.error("Forgot password error:", err);
      setStatus({
        type: "error",
        message: "Failed to connect to the server. Please try again.",
      });
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mz-forgot-page">
      {/* Background Vector Wave */}
      <svg
        className="mz-forgot-wave-bl"
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

      {/* Background Dots Accent */}
      <div className="mz-forgot-dots" aria-hidden="true"></div>

      {/* Top Navigation Bar */}
      <nav className="mz-forgot-nav">
        <Link to="/" className="mz-forgot-logo-link">
          <img
            src={logoIcon}
            alt="Mastery Zone"
            className="mz-forgot-logo-icon"
          />
          <div className="mz-forgot-logo-text-group">
            <span className="mz-forgot-brand-title">
              Mastery <span className="mz-brand-accent">Zone</span>
            </span>
            <span className="mz-forgot-brand-tagline">Learn · Grow · Achieve</span>
          </div>
        </Link>

        <Link to="/login" className="mz-forgot-back-btn">
          <LuArrowLeft size={16} />
          <span className="mz-back-text-full">Back to Login</span>
          <span className="mz-back-text-short">Login</span>
        </Link>
      </nav>

      {/* Main Two-Column Layout */}
      <div className="mz-forgot-container">
        {/* Left Column: Form Card */}
        <div className="mz-forgot-card">
          <div className="mz-forgot-icon-wrap">
            <img
              src={mailIcon}
              alt="Reset Password Mail Icon"
              className="mz-forgot-mail-img"
            />
          </div>

          <h1 className="mz-forgot-title">
            Forgot <span className="mz-title-purple">Password?</span>
          </h1>

          <p className="mz-forgot-sub">
            No worries! Enter your email address and we'll send you a reset link.
          </p>

          {status.message && (
            <div className={`mz-forgot-status-msg ${status.type}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mz-forgot-form" noValidate>
            <div className={`mz-forgot-input-wrap ${hasError ? "mz-input-error" : ""}`}>
              <LuMail className="mz-forgot-input-icon" />
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
                required
              />
            </div>

            {hasError && (
              <span className="mz-input-error-text">
                Please enter a valid email address
              </span>
            )}

            <button
              type="submit"
              className="mz-forgot-submit-btn"
              disabled={loading}
            >
              <span>{loading ? "SENDING LINK..." : "SEND RESET LINK"}</span>
              <LuArrowRight size={17} />
            </button>

            <div className="mz-forgot-divider">
              <span>OR</span>
            </div>

            <Link to="/login" className="mz-forgot-login-btn">
              Back to Login
            </Link>

            <div className="mz-forgot-support">
              <LuHeadphones className="mz-forgot-support-icon" />
              <span>
                Need help?{" "}
                <a href="mailto:support@masteryzone.com">
                  Contact our support team
                </a>
              </span>
            </div>
          </form>
        </div>

        {/* Right Column: Illustration & Sticker */}
        <div className="mz-forgot-right">
          <div className="mz-forgot-illustration-wrap">
            <img
              src={illustrationImg}
              alt="Password recovery security illustration"
              className="mz-forgot-illustration"
            />
          </div>

          <div className="mz-forgot-sticker-wrap">
            <img
              src={stickerImg}
              alt="Reset today, Keep learning tomorrow"
              className="mz-forgot-sticker"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

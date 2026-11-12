import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LuLock,
  LuKeyRound,
  LuShieldCheck,
  LuShieldAlert,
  LuEye,
  LuEyeOff,
  LuArrowRight,
  LuCircleCheck,
  LuArrowLeft,
  LuSparkles,
  LuCheck,
  LuKey,
} from "react-icons/lu";
import logoImg from "../assets/mastery_zone_logo_transparent.png";
import ThemeToggle from "./ThemeToggle.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";
const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : "/auth";

export default function ResetPassword() {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Support token from URL path (:token) or query string (?token=...)
  const initialToken = paramToken || searchParams.get("token") || "";
  const [token, setToken] = useState(initialToken);
  const [emailOrToken, setEmailOrToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(4);
  const [errorMessage, setErrorMessage] = useState("");

  // Keep token synced if URL changes
  useEffect(() => {
    const qToken = paramToken || searchParams.get("token");
    if (qToken) {
      setToken(qToken);
    }
  }, [paramToken, searchParams]);

  // Countdown timer when password update succeeds
  useEffect(() => {
    let timer;
    if (isSuccess && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSuccess && redirectCountdown === 0) {
      navigate("/login");
    }
    return () => clearTimeout(timer);
  }, [isSuccess, redirectCountdown, navigate]);

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "#e2e8f0" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score <= 4) return { score: 2, label: "Medium", color: "#f59e0b" };
    return { score: 3, label: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword.length >= 6 && newPassword === confirmPassword;
  const passwordsMismatched = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const activeToken = token.trim() || emailOrToken.trim();
    if (!activeToken) {
      setErrorMessage("Please provide your registered account email or paste the reset token from your email.");
      toast.error("Email or reset token is required.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Reset password must be at least 6 characters long.");
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Relative path /auth/reset-password works seamlessly across all devices (laptop, desktop, phone)
      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          token: activeToken,
          email: activeToken.includes("@") ? activeToken : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || "Failed to reset password. The link may have expired.";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Password has been reset successfully! A confirmation email has been dispatched.");
    } catch (err) {
      console.error("Password reset error:", err);
      const networkMsg = "Unable to connect to the authentication server. Please check your connection.";
      setErrorMessage(networkMsg);
      toast.error(networkMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.08) 0%, transparent 40%), radial-gradient(circle at 85% 85%, rgba(59, 130, 246, 0.08) 0%, transparent 40%), var(--mz-bg-primary)",
        color: "var(--mz-text-primary)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* ── Top Full-Screen Brand Navigation Bar ── */}
      <header
        style={{
          width: "100%",
          padding: "18px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          borderBottom: "1px solid var(--mz-border)",
          background: "var(--mz-topbar-bg)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
          }}
        >
          <img
            src={logoImg}
            alt="Mastery Zone"
            style={{
              height: 38,
              width: "auto",
              objectFit: "contain",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--mz-text-primary)",
                letterSpacing: "-0.4px",
                lineHeight: 1.1,
              }}
            >
              Mastery Zone
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--mz-indigo-text)",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
              }}
            >
              Learn • Grow • Succeed
            </span>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.88rem",
              fontWeight: 700,
              color: "var(--mz-indigo-text)",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid var(--mz-indigo-border)",
              background: "var(--mz-indigo-bg)",
              transition: "all 0.2s ease",
            }}
          >
            <LuArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </header>

      {/* ── Main Full-Screen Content Area ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "36px 20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "var(--mz-surface)",
            borderRadius: 24,
            padding: "40px 36px",
            boxSizing: "border-box",
            border: "1px solid var(--mz-border)",
            boxShadow: "var(--mz-shadow-lg)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle top accent gradient line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background:
                "linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)",
            }}
          />

          {isSuccess ? (
            /* ── SUCCESS STATE VIEW ── */
            <div
              style={{
                textAlign: "center",
                padding: "20px 0 10px",
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  background: "var(--mz-emerald-bg)",
                  border: "1px solid var(--mz-emerald-border)",
                  color: "var(--mz-emerald-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 10px 24px rgba(5, 150, 105, 0.15)",
                }}
              >
                <LuCircleCheck size={42} />
              </div>

              <h2
                style={{
                  fontSize: "1.55rem",
                  fontWeight: 800,
                  color: "var(--mz-text-primary)",
                  margin: "0 0 10px",
                  letterSpacing: "-0.4px",
                }}
              >
                Password Updated!
              </h2>

              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--mz-text-body)",
                  lineHeight: 1.6,
                  margin: "0 0 24px",
                }}
              >
                Your Mastery Zone account password has been successfully reset.
                An official security confirmation email has been dispatched to
                your registered email address.
              </p>

              <div
                style={{
                  background: "var(--mz-green-bg)",
                  border: "1px solid var(--mz-green-border)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  marginBottom: 28,
                  fontSize: "0.88rem",
                  color: "var(--mz-green-text)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <LuCheck size={18} /> Redirecting to login in{" "}
                <strong>{redirectCountdown} seconds</strong>...
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: 14,
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                Proceed to Login <LuArrowRight size={18} />
              </button>
            </div>
          ) : (
            /* ── FORM VIEW: RESET PASSWORD & CONFIRM PASSWORD ── */
            <div>
              {/* Header Icon + Title */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: "var(--mz-indigo-bg)",
                    border: "1px solid var(--mz-indigo-border)",
                    color: "var(--mz-indigo-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    boxShadow: "0 8px 20px rgba(79, 70, 229, 0.12)",
                  }}
                >
                  <LuKeyRound size={32} />
                </div>
                <h1
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color: "var(--mz-text-primary)",
                    margin: "0 0 8px",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Reset Your Password
                </h1>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--mz-text-muted)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Create a new, strong password to regain access to your Mastery Zone account.
                </p>
              </div>

              {errorMessage && (
                <div
                  style={{
                    background: "var(--mz-red-bg)",
                    border: "1px solid var(--mz-red-border)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    color: "var(--mz-red-text)",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <LuShieldAlert size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Optional Email or Token Input (Visible if token is not already in URL path/query) */}
                {!initialToken && (
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "var(--mz-text-secondary)",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                      }}
                    >
                      Account Email or Reset Token
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "var(--mz-input-bg-subtle)",
                        border: "1.5px solid var(--mz-input-border)",
                        borderRadius: 14,
                        padding: "4px 14px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <LuKey size={18} color="var(--mz-text-muted)" style={{ flexShrink: 0, marginRight: 10 }} />
                      <input
                        type="text"
                        placeholder="Enter registered email or paste reset token"
                        value={emailOrToken}
                        onChange={(e) => setEmailOrToken(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 0",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: "0.92rem",
                          color: "var(--mz-input-text)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* ── 1. Search Box: Reset Password ── */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--mz-text-secondary)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    <span>Reset Password</span>
                    {strength.label && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: strength.color,
                          textTransform: "none",
                        }}
                      >
                        {strength.label}
                      </span>
                    )}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "var(--mz-input-bg-subtle)",
                      border: "1.5px solid var(--mz-input-border)",
                      borderRadius: 14,
                      padding: "4px 14px",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <LuLock
                      size={18}
                      color="var(--mz-indigo-text)"
                      style={{ flexShrink: 0, marginRight: 10 }}
                    />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter new password (min. 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "0.95rem",
                        color: "var(--mz-input-text)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "4px 6px",
                        cursor: "pointer",
                        color: "var(--mz-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 6,
                      }}
                      title={showNewPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Meter Bar */}
                  {newPassword.length > 0 && (
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: "var(--mz-border)",
                        marginTop: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width:
                            strength.score === 1
                              ? "33%"
                              : strength.score === 2
                              ? "66%"
                              : "100%",
                          background: strength.color,
                          transition: "all 0.3s ease",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* ── 2. Search Box: Re-enter Reset Password ── */}
                <div style={{ marginBottom: 28 }}>
                  <label
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--mz-text-secondary)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    <span>Re-enter Reset Password</span>
                    {passwordsMatch && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#10b981",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          textTransform: "none",
                        }}
                      >
                        <LuCheck size={12} /> Passwords match
                      </span>
                    )}
                    {passwordsMismatched && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#ef4444",
                          textTransform: "none",
                        }}
                      >
                        Passwords do not match
                      </span>
                    )}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "var(--mz-input-bg-subtle)",
                      border: `1.5px solid ${
                        passwordsMatch
                          ? "#10b981"
                          : passwordsMismatched
                          ? "#ef4444"
                          : "var(--mz-input-border)"
                      }`,
                      borderRadius: 14,
                      padding: "4px 14px",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <LuShieldCheck
                      size={18}
                      color={passwordsMatch ? "#10b981" : "var(--mz-indigo-text)"}
                      style={{ flexShrink: 0, marginRight: 10 }}
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "0.95rem",
                        color: "var(--mz-input-text)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "4px 6px",
                        cursor: "pointer",
                        color: "var(--mz-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 6,
                      }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: 14,
                    background: isSubmitting
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "#ffffff",
                    fontSize: "1rem",
                    fontWeight: 700,
                    letterSpacing: "0.3px",
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: isSubmitting
                      ? "none"
                      : "0 8px 24px rgba(79, 70, 229, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isSubmitting ? (
                    <span>UPDATING PASSWORD...</span>
                  ) : (
                    <>
                      <span>UPDATE PASSWORD</span>
                      <LuArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div
                style={{
                  marginTop: 24,
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: "var(--mz-text-muted)",
                }}
              >
                Remember your password?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "var(--mz-indigo-text)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Sign in here
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          width: "100%",
          padding: "16px 24px",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "var(--mz-text-subtle)",
          boxSizing: "border-box",
        }}
      >
        © {new Date().getFullYear()} Mastery Zone. All rights reserved.
      </footer>
    </div>
  );
}

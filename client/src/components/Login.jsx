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
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, provider } from "../firebase/firebaseConfig";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import logoIcon from "../assets/logo_icon_transparent.png";
import illustrationImg from "../assets/login_illustration.png";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_URL || "";
const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : "/auth";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from?.pathname || "/home";

  // Enforce zero credential retention: reset fields on mount
  useEffect(() => {
    setIdentifier("");
    setPassword("");
    setTouched({});
    setValidationErrors({});
  }, []);

  useEffect(() => {
    const errors = {};

    if (touched.identifier && !identifier.trim()) {
      errors.identifier = "Username or Email is required";
    }

    if (touched.password && !password) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
  }, [identifier, password, touched]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setValidationErrors({
        identifier: !trimmedIdentifier ? "Username or Email is required" : "",
        password: !password ? "Password is required" : "",
      });
      return;
    }

    setIsSubmitting(true);

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier);

    // ── 1. FIREBASE EMAIL & PASSWORD LOGIN ──
    if (isEmail) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedIdentifier, password);
        const fbUser = userCredential.user;
        const idToken = await fbUser.getIdToken();

        const response = await fetch(`${AUTH_BASE}/firebase-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email.split("@")[0],
            uid: fbUser.uid,
            token: idToken,
          }),
        });

        const data = await response.json();

        if (response.ok) {
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
          toast.success("Login successful via Firebase!");
          navigate(redirectTarget, { replace: true });
          setIsSubmitting(false);
          return;
        }
      } catch (fbErr) {
        console.warn("Firebase email login attempt:", fbErr.code, fbErr.message);
        // If wrong credentials on Firebase, check backend before giving error
      }
    }

    // ── 2. BACKEND DATABASE AUTHENTICATION (Fallback & Username Support) ──
    try {
      const response = await fetch(`${AUTH_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernameOrEmail: trimmedIdentifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid email/username or password");
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
      toast.success("Login successful!");
      if (data.user?.role === "SUPER_ADMIN" || data.user?.email?.toLowerCase().trim() === "yashashyash1@gmail.com") {
        navigate("/admin/overview", { replace: true });
      } else {
        navigate(redirectTarget, { replace: true });
      }
    } catch (error) {
      console.error("Login submit error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);

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

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText || `Server error (${response.status})` };
      }

      if (!response.ok) {
        toast.error(
          data.message || `Firebase login failed (${response.status})`
        );
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
      toast.success("Login successful!");
      if (data.user?.role === "SUPER_ADMIN" || data.user?.email?.toLowerCase().trim() === "yashashyash1@gmail.com") {
        navigate("/admin/overview", { replace: true });
      } else {
        navigate(redirectTarget, { replace: true });
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      if (error?.code === "auth/popup-closed-by-user") {
        toast.info("Google sign-in popup was closed");
      } else if (error?.code === "auth/popup-blocked") {
        toast.error("Sign-in popup was blocked by browser. Please allow popups for this site.");
      } else if (error?.code === "auth/cancelled-popup-request") {
        // Popup request cancelled
      } else if (error?.code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized in Firebase Console.");
      } else {
        toast.error(
          error?.message
            ? `Google login failed: ${error.message}`
            : "Google login failed"
        );
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestSubmitting(true);

    try {
      const response = await fetch(`${AUTH_BASE}/guest-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Guest login failed");
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
      toast.success("Guest login successful!");
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      console.error("Guest login error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setIsGuestSubmitting(false);
    }
  };

  return (
    <div className="mz-login-page">
      <div className="mz-background-glow mz-background-glow-one" aria-hidden="true" />
      <div className="mz-background-glow mz-background-glow-two" aria-hidden="true" />

      <header className="mz-top-navbar li-nav-anim">
        <Link to="/" className="mz-nav-brand" aria-label="Mastery Zone home">
          <img
            src={logoIcon}
            alt=""
            className="mz-nav-brand-logo"
          />
          <span className="mz-nav-brand-text">
            <span className="mz-nav-title">Mastery Zone</span>
            <span className="mz-nav-tagline">Learn · Grow · Succeed</span>
          </span>
        </Link>
      </header>

      <main className="mz-main-container">
        <section className="mz-left-column" aria-label="Login form">
          <div className="mz-card">
            <div className="mz-card-logo-wrap li-anim-1">
              <img src={logoIcon} alt="Mastery Zone logo" className="mz-card-logo" />
            </div>

            <h1 className="mz-card-title li-anim-2">
              Welcome <span className="mz-title-highlight">Back!</span>
            </h1>
            <p className="mz-card-subtitle li-anim-3">
              Log in to continue your learning journey and reach your goals.
            </p>

            <form onSubmit={handleLoginSubmit} className="mz-form" noValidate autoComplete="off">
              <div
                className={`mz-input-field li-anim-4 ${
                  validationErrors.identifier ? "mz-field-error" : ""
                }`}
              >
                <LuUser className="mz-input-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Username or E-Mail"
                  autoComplete="off"
                  aria-label="Username or email"
                  aria-invalid={Boolean(validationErrors.identifier)}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setTouched((previous) => ({ ...previous, identifier: true }));
                  }}
                />
              </div>
              {validationErrors.identifier && (
                <p className="mz-error-text">{validationErrors.identifier}</p>
              )}

              <div
                className={`mz-input-field li-anim-5 ${
                  validationErrors.password ? "mz-field-error" : ""
                }`}
              >
                <LuLock className="mz-input-icon" aria-hidden="true" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="new-password"
                  aria-label="Password"
                  aria-invalid={Boolean(validationErrors.password)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setTouched((previous) => ({ ...previous, password: true }));
                  }}
                />
                <button
                  type="button"
                  className="mz-eye-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mz-error-text">{validationErrors.password}</p>
              )}

              <div className="mz-options-row li-anim-6" style={{ justifyContent: "flex-end" }}>
                <Link to="/forgot-password" className="mz-forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                className="mz-btn-login li-anim-7"
                type="submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? "Logging in..." : "Log In"}</span>
                {!isSubmitting && <LuArrowRight size={18} className="mz-btn-arrow" />}
              </button>
            </form>

            <div className="mz-divider-row li-anim-8" aria-hidden="true">
              <span className="mz-divider-line" />
              <span className="mz-divider-text">OR</span>
              <span className="mz-divider-line" />
            </div>

            <button
              onClick={handleGoogleLogin}
              className="mz-btn-google li-anim-9"
              type="button"
              disabled={isGoogleSubmitting}
            >
              <FcGoogle size={20} className="mz-google-icon" />
              <span>{isGoogleSubmitting ? "Connecting..." : "Sign in with Google"}</span>
            </button>

            <p className="mz-signup-prompt li-anim-10">
              Don't have an account?{" "}
              <Link to="/signup" className="mz-signup-link">
                Sign up
              </Link>
            </p>

            <button
              onClick={handleGuestLogin}
              className="mz-btn-guest li-anim-11"
              type="button"
              disabled={isGuestSubmitting}
            >
              <span className="mz-guest-left">
                <LuUser size={18} className="mz-guest-user-icon" />
                <span className="mz-guest-text">
                  {isGuestSubmitting ? "Opening guest session..." : "Login as Guest "}
                  {!isGuestSubmitting && (
                    <span className="mz-guest-highlight">(Interviewee)</span>
                  )}
                </span>
              </span>
              {!isGuestSubmitting && <LuArrowRight size={16} className="mz-guest-arrow" />}
            </button>
          </div>
        </section>

        <section className="mz-right-hero" aria-label="About Mastery Zone">
          <div className="mz-hero-text-wrap li-hero-anim">
            <h2 className="mz-hero-heading">
              <span className="mz-hero-goals">Your Goals.</span>
              <span className="mz-hero-mission">Our Mission.</span>
            </h2>
            <p className="mz-hero-subtitle">
              Master new skills, track your progress, and build the future you want — all in one place.
            </p>
          </div>

          <div className="mz-illustration-wrap li-illus-anim">
            <img
              src={illustrationImg}
              alt="A learner studying with a laptop"
              className="mz-illustration-img"
            />
          </div>

          <div className="mz-login-features-grid">
            <div className="mz-login-feature-card li-feat-1">
              <div className="mz-login-feature-icon-box purple">
                <LuBookOpen size={20} />
              </div>
              <div className="mz-login-feature-text">
                <span className="mz-login-feature-title">Learn</span>
                <span className="mz-login-feature-desc">at your pace</span>
              </div>
            </div>

            <div className="mz-login-feature-card li-feat-2">
              <div className="mz-login-feature-icon-box cyan">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                  <path d="M17 4h4v4" />
                  <path d="M21 4L13 12" />
                </svg>
              </div>
              <div className="mz-login-feature-text">
                <span className="mz-login-feature-title">Track</span>
                <span className="mz-login-feature-desc">your progress</span>
              </div>
            </div>

            <div className="mz-login-feature-card li-feat-3">
              <div className="mz-login-feature-icon-box blue">
                <LuUsers size={20} />
              </div>
              <div className="mz-login-feature-text">
                <span className="mz-login-feature-title">Connect</span>
                <span className="mz-login-feature-desc">with learners</span>
              </div>
            </div>

            <div className="mz-login-feature-card li-feat-4">
              <div className="mz-login-feature-icon-box amber">
                <LuStar size={20} />
              </div>
              <div className="mz-login-feature-text">
                <span className="mz-login-feature-title">Grow</span>
                <span className="mz-login-feature-desc">every day</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;

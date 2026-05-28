import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const token = await user.getIdToken();

      const response = await fetch(`${API_BASE}/auth/firebase-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Firebase Login failed on server");
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
      const response = await fetch(`${API_BASE}/auth/login`, {
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
      alert("Failed to connect to server");
    }
  };

  const handleGuestLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/guest-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
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
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <img
          src="https://c4.wallpaperflare.com/wallpaper/699/818/498/digital-art-artwork-sun-3d-wallpaper-preview.jpg"
          alt="Banner"
          className="login-image"
        />

        <h2 className="title">Login</h2>

        <form onSubmit={handleLoginSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="input-group">
            <div className="input-field1" style={{ position: "relative" }}>
              <FaUser className="icon" />
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
              {validationErrors.identifier && (
                <span style={{ position: "absolute", bottom: "-13px", left: "20px", color: "#d90429", fontSize: "11px", fontWeight: "bold" }}>
                  {validationErrors.identifier}
                </span>
              )}
            </div>

            <div className="input-field1" style={{ position: "relative" }}>
              <FaLock className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setTouched({ ...touched, password: true });
                }}
                style={{ width: "65%" }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer", marginRight: "15px", display: "flex", alignItems: "center", color: "#555" }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              {validationErrors.password && (
                <span style={{ position: "absolute", bottom: "-13px", left: "20px", color: "#d90429", fontSize: "11px", fontWeight: "bold" }}>
                  {validationErrors.password}
                </span>
              )}
            </div>
          </div>

          <div className="options">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          <button className="login-button" type="submit">Login</button>

          <p className="signup-text" style={{ color: "black" }}>
            Don't have account ? <a href="/signup">Sign in</a>
          </p>
        </form>

        <button onClick={handleGoogleLogin} className="google-button">
          <FcGoogle size={20} /> Sign in with Google
        </button>

        <button onClick={handleGuestLogin} className="google-button" style={{ marginTop: '10px', backgroundColor: '#FFD700', color: 'black', border: 'none', fontWeight: 'bold' }}>
          Login as Guest (Interviewer)
        </button>

      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaPhone } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "";
const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : "/auth";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [otpMode, setOtpMode] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpErrors, setOtpErrors] = useState({});
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
      alert("Failed to connect to server");
    }
  };

  const handleOtpRequest = async (e) => {
    e.preventDefault();

    if (!otpPhone.trim()) {
      setOtpErrors({ otpPhone: 'Phone number is required' });
      return;
    }

    if (!/^(?:\+91|91|0)?[6-9]\d{9}$/.test(otpPhone.trim())) {
      setOtpErrors({ otpPhone: 'Invalid Indian mobile number' });
      return;
    }

    setOtpErrors({});

    try {
      const response = await fetch(`${AUTH_BASE}/mobile-otp-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: otpPhone })
      });

      let data;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        alert(data.message || `Server returned ${response.status}`);
        return;
      }

      setOtpSent(true);
      let message = data.message || 'OTP sent successfully.';
      if (data.devOtp) {
        message += ` Your test OTP is ${data.devOtp}.`;
      }
      setOtpMessage(message);
      toast.success('OTP sent to your phone');
    } catch (err) {
      console.error('OTP request error', err);
      alert(err.message || 'Failed to connect to server');
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();

    if (!otpPhone.trim() || !otpCode.trim()) {
      setOtpErrors({
        otpPhone: !otpPhone.trim() ? 'Phone number is required' : '',
        otpCode: !otpCode.trim() ? 'OTP is required' : ''
      });
      return;
    }

    try {
      const response = await fetch(`${AUTH_BASE}/mobile-otp-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: otpPhone, otp: otpCode })
      });

      let data;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        alert(data.message || `Server returned ${response.status}`);
        return;
      }

      localStorage.setItem('token', data.token);
      toast.success('OTP login successful!');
      navigate('/home');
    } catch (err) {
      console.error('OTP verification error', err);
      alert(err.message || 'Failed to connect to server');
    }
  };

  const handleGuestLogin = async () => {
    try {
      const response = await fetch(`${AUTH_BASE}/guest-login`, {
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

        <div className="mobile-otp-panel">
          <div className="mobile-otp-heading">
            <span>Login with Mobile OTP</span>
            <button
              type="button"
              className="mobile-otp-toggle"
              onClick={() => {
                setOtpMode(!otpMode);
                setOtpSent(false);
                setOtpMessage('');
                setOtpErrors({});
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6a0572',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {otpMode ? 'Hide OTP' : 'Use OTP'}
            </button>
          </div>

          {otpMode && (
            <form onSubmit={otpSent ? handleOtpVerify : handleOtpRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              <div className="input-field1" style={{ position: 'relative' }}>
                <FaPhone className="icon" />
                <input
                  type="tel"
                  placeholder="Mobile number"
                  autoComplete="tel"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  inputMode="tel"
                />
                {otpErrors.otpPhone && (
                  <span style={{ position: 'absolute', bottom: '-13px', left: '20px', color: '#d90429', fontSize: '11px', fontWeight: 'bold' }}>
                    {otpErrors.otpPhone}
                  </span>
                )}
              </div>

              {otpSent && (
                <div className="input-field1" style={{ position: 'relative' }}>
                  <FaLock className="icon" />
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                  />
                  {otpErrors.otpCode && (
                    <span style={{ position: 'absolute', bottom: '-13px', left: '20px', color: '#d90429', fontSize: '11px', fontWeight: 'bold' }}>
                      {otpErrors.otpCode}
                    </span>
                  )}
                </div>
              )}

              {otpMessage && <p style={{ color: '#2d6a4f', margin: 0 }}>{otpMessage}</p>}

              <button type="submit" className="otp-button">
                {otpSent ? 'Verify OTP' : 'Send OTP'}
              </button>
            </form>
          )}
        </div>

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

import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import "./forgot.css";

const ForgotPassword = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    const errors = {};
    if (touched.usernameOrEmail) {
      if (!usernameOrEmail.trim()) {
        errors.usernameOrEmail = "Username or Email is required";
      }
    }
    setValidationErrors(errors);
  }, [usernameOrEmail, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ usernameOrEmail: true });

    if (!usernameOrEmail.trim()) {
      setValidationErrors({ usernameOrEmail: "Username or Email is required" });
      return;
    }

    try {
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to send reset link");
        return;
      }

      setMessage(data.message);
      setUsernameOrEmail("");
      setTouched({});
    } catch (err) {
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="forgot-container">
      <div className="login-box">
        <div className="image">
          <div className="resetpassward">
            Forgot Password
          </div>
          <div className="text" style={{ fontSize: '14px', marginTop: '10px' }}>
            Enter your email or username to receive a password reset link.
          </div>
        </div>

        {message && (
          <div style={{ color: "green", marginTop: "15px", textAlign: "center", fontWeight: "bold" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
          <div className="input-group">
            <div className="input-field1" style={{ position: "relative" }}>
              <FaUser className="icon" />
              <input
                type="text"
                autoComplete="off"
                placeholder="Username or E-Mail"
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
                  setTouched({ ...touched, usernameOrEmail: true });
                }}
              />
              {validationErrors.usernameOrEmail && (
                <span style={{ position: "absolute", bottom: "-13px", left: "20px", color: "#d90429", fontSize: "11px", fontWeight: "bold" }}>
                  {validationErrors.usernameOrEmail}
                </span>
              )}
            </div>
          </div>

          <button className="login-button" type="submit">SEND RESET LINK</button>

          <p className="signup-text">
            <a href="/login">Back to Login</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

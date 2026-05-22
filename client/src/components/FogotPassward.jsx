import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "./forgot.css"; // Import the CSS file
import image from '../assets/forgot-pass-lock-1.webp';

const ResetPassword = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const errors = {};
    if (touched.usernameOrEmail) {
      if (!usernameOrEmail.trim()) {
        errors.usernameOrEmail = "Username or Email is required";
      }
    }
    if (touched.newPassword) {
      if (!newPassword) {
        errors.newPassword = "New password is required";
      } else if (newPassword.length < 6) {
        errors.newPassword = "Must be at least 6 characters";
      }
    }
    if (touched.confirmPassword) {
      if (!confirmPassword) {
        errors.confirmPassword = "Confirm password is required";
      } else if (confirmPassword !== newPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }
    setValidationErrors(errors);
  }, [usernameOrEmail, newPassword, confirmPassword, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ usernameOrEmail: true, newPassword: true, confirmPassword: true });

    const errors = {};
    if (!usernameOrEmail.trim()) errors.usernameOrEmail = "Username or Email is required";
    if (!newPassword) errors.newPassword = "New password is required";
    else if (newPassword.length < 6) errors.newPassword = "Must be at least 6 characters";
    if (!confirmPassword) errors.confirmPassword = "Confirm password is required";
    else if (confirmPassword !== newPassword) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to reset password");
        return;
      }

      alert("Password reset successfully!");
      window.location.href = "/login";
    } catch (err) {
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="forgot-container">
      <div className="login-box">
        <div className="image">
          <div className="resetpassward">
            Reset Passward
          </div>
          <div className="text">
            Your new passward must be different <br/> from previously used passward
          </div>
        </div>

        <h2 className="title" style={{ marginTop: "20px" }}>Enter new password</h2>

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="input-group">
            <div className="input-field1" style={{ position: "relative" }}>
              <FaUser className="icon" />
              <input
                type="text"
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

            <div className="input-field1" style={{ position: "relative" }}>
              <FaLock className="icon" />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New-Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setTouched({ ...touched, newPassword: true });
                }}
                style={{ width: "65%" }}
              />
              <span
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ cursor: "pointer", marginRight: "15px", display: "flex", alignItems: "center", color: "#555" }}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              {validationErrors.newPassword && (
                <span style={{ position: "absolute", bottom: "-13px", left: "20px", color: "#d90429", fontSize: "11px", fontWeight: "bold" }}>
                  {validationErrors.newPassword}
                </span>
              )}
            </div>

            <div className="input-field1" style={{ position: "relative" }}>
              <FaLock className="icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setTouched({ ...touched, confirmPassword: true });
                }}
                style={{ width: "65%" }}
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ cursor: "pointer", marginRight: "15px", display: "flex", alignItems: "center", color: "#555" }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              {validationErrors.confirmPassword && (
                <span style={{ position: "absolute", bottom: "-13px", left: "20px", color: "#d90429", fontSize: "11px", fontWeight: "bold" }}>
                  {validationErrors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          <button className="login-button" type="submit">CONTINUE</button>

          <p className="signup-text">
            <a href="/login">Back to Login</a>
          </p>
        </form>

      </div>
    </div>
  );
};

export default ResetPassword;

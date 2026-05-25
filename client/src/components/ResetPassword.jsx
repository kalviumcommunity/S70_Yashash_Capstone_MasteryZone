import React, { useState, useEffect } from "react";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import "./forgot.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const errors = {};
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
  }, [newPassword, confirmPassword, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ newPassword: true, confirmPassword: true });

    const errors = {};
    if (!newPassword) errors.newPassword = "New password is required";
    else if (newPassword.length < 6) errors.newPassword = "Must be at least 6 characters";
    if (!confirmPassword) errors.confirmPassword = "Confirm password is required";
    else if (confirmPassword !== newPassword) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const response = await fetch(`/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to reset password");
        return;
      }

      alert("Password has been successfully reset! You can now log in.");
      navigate("/login");
    } catch (err) {
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="forgot-container">
      <div className="login-box">
        <div className="image">
          <div className="resetpassward">
            Reset Password
          </div>
          <div className="text" style={{ fontSize: '14px', marginTop: '10px' }}>
            Your new password must be different from previously used passwords.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
          <div className="input-group">
            <div className="input-field1" style={{ position: "relative" }}>
              <FaLock className="icon" />
              <input
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="New Password"
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
                autoComplete="new-password"
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

          <button className="login-button" type="submit">UPDATE PASSWORD</button>

          <p className="signup-text">
            <a href="/login">Back to Login</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

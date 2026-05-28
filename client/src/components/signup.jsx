import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../App.css"; // Import the CSS file

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

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
        errors.password = "Must be at least 6 characters";
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

    // Clear sticky general submit error once all validation errors are solved
    if (Object.keys(errors).length === 0) {
      setError("");
    }
  }, [formData, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();  

    const allTouched = {
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    const { firstName, lastName, email, password, confirmPassword } = formData;

    const errors = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    else if (firstName.length < 2) errors.firstName = "Must be at least 2 characters";

    if (!lastName.trim()) errors.lastName = "Last name is required";
    else if (lastName.length < 2) errors.lastName = "Must be at least 2 characters";

    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Invalid email format";

    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Must be at least 6 characters";

    if (!confirmPassword) errors.confirmPassword = "Confirm password is required";
    else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Please fix the validation errors before submitting.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setError("");
      navigate("/login");
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="Creat-a-new-account"> <h2 className="signup-heading">Create a new account</h2>  </div>

        <div className="error-div">
        {error && <p className="error-text">{error}</p>}
        </div>

        <form onSubmit={handleSubmit}>
          {/* First Name */}
          <div className="input-group" style={{ position: "relative" }}>
            <input
              type="text"
              className="inputs"
              name="firstName"
              placeholder="First Name"
              autoComplete="off"
              value={formData.firstName}
              onChange={handleChange}
            />
            {validationErrors.firstName && (
              <span style={{ position: "absolute", bottom: "-20px", left: "10%", color: "#ff4d4d", fontSize: "11px", fontWeight: "bold" }}>
                {validationErrors.firstName}
              </span>
            )}
          </div>

          {/* Last Name */}
          <div className="input-group" style={{ position: "relative" }}>
            <input
              type="text"
              className="inputs"
              name="lastName"
              placeholder="Last Name"
              autoComplete="off"
              value={formData.lastName}
              onChange={handleChange}
            />
            {validationErrors.lastName && (
              <span style={{ position: "absolute", bottom: "-20px", left: "10%", color: "#ff4d4d", fontSize: "11px", fontWeight: "bold" }}>
                {validationErrors.lastName}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="input-group" style={{ position: "relative" }}>
            <input
              type="email"
              className="inputs"
              name="email"
              placeholder="E-Mail"
              autoComplete="off"
              value={formData.email}
              onChange={handleChange}
            />
            {validationErrors.email && (
              <span style={{ position: "absolute", bottom: "-20px", left: "10%", color: "#ff4d4d", fontSize: "11px", fontWeight: "bold" }}>
                {validationErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="input-group" style={{ position: "relative" }}>
            <div style={{ position: "relative", width: "80%", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="inputs"
                name="password"
                placeholder="Password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  cursor: "pointer",
                  color: "#555",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {validationErrors.password && (
              <span style={{ position: "absolute", bottom: "-20px", left: "10%", color: "#ff4d4d", fontSize: "11px", fontWeight: "bold" }}>
                {validationErrors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="input-group" style={{ position: "relative" }}>
            <div style={{ position: "relative", width: "80%", display: "flex", alignItems: "center" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="inputs"
                name="confirmPassword"
                placeholder="Re-enter passward"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  cursor: "pointer",
                  color: "#555",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {validationErrors.confirmPassword && (
              <span style={{ position: "absolute", bottom: "-20px", left: "10%", color: "#ff4d4d", fontSize: "11px", fontWeight: "bold" }}>
                {validationErrors.confirmPassword}
              </span>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="checkbox">
            <label>
              <input className="checkbox1" type="checkbox" /> Remember me
            </label>
          </div>

          {/* Sign Up Button */}
          <button className="signup-button" type="submit">
            SIGN UP
          </button>

          {/* Back Button */}
          <div className="back">
            <a href="/login"><u>BACK</u></a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

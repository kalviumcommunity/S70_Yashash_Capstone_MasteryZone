import React, { useState } from "react";
import "../App.css"; // Import the CSS file

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  // here the error wiil be empty string.When it get error the "setError" method updates the error string

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // when the user enters the data "setFormData" method update to key value pairs like [firstName:"Alice"]
  };

  const handleSubmit = (e) => {
    e.preventDefault();  
    // e.preventDefault(); prevents the page from reloading.

    // Destructuring formData to extract values
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    console.log("User Signed Up:", formData);
    setError(""); // Clear error after successful submission
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
          <div className="input-group">
            <input
              type="text"
              className="inputs"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          {/* Last Name */}
          <div className="input-group">
            <input
              type="text"
              className="inputs"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <input
              type="email"
              className="inputs"
              name="email"
              placeholder="E-Mail"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <input
              type="password"
              className="inputs"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <input
              type="password"
              className="inputs"
              name="confirmPassword"
              placeholder="Re-enter passward"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
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
            <a href="#"><u>BACK</u></a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

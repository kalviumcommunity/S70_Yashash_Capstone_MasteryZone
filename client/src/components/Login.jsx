import React from "react";
import { FaUser, FaLock } from "react-icons/fa"
import "../App.css"; // Import the CSS file

const Login = () => {
  return (
    <div className="container">
      <div className="login-box">
        
          <img 
            src="https://c4.wallpaperflare.com/wallpaper/699/818/498/digital-art-artwork-sun-3d-wallpaper-preview.jpg"
            alt="Banner"
            className="login-image"
          />
       
        <h2 className="title">Login</h2>

        <div className="input-group">
          <div className="input-field1">
            <FaUser className="icon" />
            <input  type="text" placeholder="Username" />
          </div>

          <div className="input-field1">
            <FaLock className="icon" />
            <input type="password" placeholder="Password" />
          </div>
        </div>

        <div className="options">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <a href="#" className="forgot-password">Forgot Password?</a>
        </div>

        <button className="login-button">Login</button>

        <p className="signup-text">
          Don't have an account? <a href="/signup">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

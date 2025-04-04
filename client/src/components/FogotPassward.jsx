import React from "react";
import { FaUser, FaLock } from "react-icons/fa"
import "./forgot.css"; // Import the CSS file
import image from '../assets/forgot-pass-lock-1.webp'
const Login = () => {
  return (
    <div className="container">
      <div className="login-box">
        <div className="image">
          <div className="resetpassward">
         Reset Passward
         </div>
         <div className="text">
          Your new passward must be different <br/> from previously used passward
          </div>
        </div>

       
        <h2 className="title" >Enter new password</h2>

        <div className="input-group">
          <div className="input-field1">
            <FaLock className="icon" />
            <input  type="text" placeholder="New-Password" />
          </div>

          <div className="input-field1">
            <FaLock className="icon" />
            <input type="password" placeholder="Confirm Password" />
          </div>
        </div>

        <button className="login-button">CONTINUE</button>

      </div>
    </div>
  );
};

export default Login;

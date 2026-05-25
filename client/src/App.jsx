import React from "react";
import Signup from "./components/signup.jsx";
import Login from "./components/Login.jsx";
import ForgotPassword from "./components/FogotPassward.jsx"; 
import ResetPassword from "./components/ResetPassword.jsx"; 
import Home from "./components/Home.jsx";
import Fitness from "./components/Fitness.jsx";
import Coding from "./components/Coding.jsx";
import Driving from "./components/Driving.jsx";
import Language from "./components/Language.jsx";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'

function App() {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/signup" element={<Signup/>} /> 
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/coding" element={<Coding />} />
        <Route path="/driving" element={<Driving />} />
        <Route path="/language" element={<Language />} />

      </Routes>
    </Router>

  )
}

export default App;

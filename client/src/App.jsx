import React from "react";
import Signup from "./components/signup.jsx";
import Login from "./components/Login.jsx";
import ResetPassword from "./components/FogotPassward.jsx"; 
import Home from "./components/Home.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'

function App() {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/signup" element={<Signup/>} /> 
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>

  )
}

export default App;

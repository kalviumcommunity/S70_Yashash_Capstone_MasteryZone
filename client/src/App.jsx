import React from "react";
import Signup from "./components/signup.jsx";
import Login from "./components/Login.jsx";
import ResetPassword from "./components/FogotPassward.jsx"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'

function App() {
  return(
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} /> {/* Default route to Login */}
        <Route path="/signup" element={<Signup/>} /> {/* Default route to Login */}
        <Route path="/forgot-password" element={<ResetPassword />} />
      </Routes>
    </Router>

  )
}

export default App;

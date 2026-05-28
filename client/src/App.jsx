import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css'

// Lazy load all major components
const Signup = lazy(() => import("./components/signup.jsx"));
const Login = lazy(() => import("./components/Login.jsx"));
const ForgotPassword = lazy(() => import("./components/FogotPassward.jsx")); 
const ResetPassword = lazy(() => import("./components/ResetPassword.jsx")); 
const Home = lazy(() => import("./components/Home.jsx"));
const Fitness = lazy(() => import("./components/Fitness.jsx"));
const Coding = lazy(() => import("./components/Coding.jsx"));
const Driving = lazy(() => import("./components/Driving.jsx"));
const Language = lazy(() => import("./components/Language.jsx"));

// Custom Loading Fallback
const LoadingFallback = () => (
  <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0c020d", color: "#00A859", fontFamily: "'Inter', sans-serif" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="loading-spinner" style={{ width: "50px", height: "50px", border: "5px solid rgba(0, 168, 89, 0.2)", borderTop: "5px solid #00A859", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <h2 style={{ marginTop: "20px", letterSpacing: "2px" }}>LOADING...</h2>
    </div>
  </div>
);

function App() {
  return(
    <>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
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
        </Suspense>
      </Router>
      <ToastContainer position="top-right" theme="dark" autoClose={2000} />
    </>
  )
}

export default App;

import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css'
import { GlobalLoader, FitnessLoader, CodingLoader, DrivingLoader, LanguageLoader } from "./components/Loaders.jsx";

// Lazy load all major components
const Signup = lazy(() => import("./components/signup.jsx"));
const Login = lazy(() => import("./components/Login.jsx"));
const ForgotPassword = lazy(() => import("./components/FogotPassward.jsx")); 
const ResetPassword = lazy(() => import("./components/ResetPassword.jsx")); 
const Home = lazy(() => import("./components/Home.jsx"));
const Profile = lazy(() => import("./components/Profile.jsx"));
const Fitness = lazy(() => import("./components/Fitness.jsx"));
const Coding = lazy(() => import("./components/Coding.jsx"));
const Driving = lazy(() => import("./components/Driving.jsx"));
const Language = lazy(() => import("./components/Language.jsx"));

function App() {
  return(
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Suspense fallback={<GlobalLoader />}><Login /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={<GlobalLoader />}><Login /></Suspense>} /> 
          <Route path="/signup" element={<Suspense fallback={<GlobalLoader />}><Signup/></Suspense>} /> 
          <Route path="/forgot-password" element={<Suspense fallback={<GlobalLoader />}><ForgotPassword /></Suspense>} />
          <Route path="/reset-password/:token" element={<Suspense fallback={<GlobalLoader />}><ResetPassword /></Suspense>} />
          <Route path="/home" element={<Suspense fallback={<GlobalLoader />}><Home /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<GlobalLoader />}><Profile /></Suspense>} />
          <Route path="/fitness" element={<Suspense fallback={<FitnessLoader />}><Fitness /></Suspense>} />
          <Route path="/coding" element={<Suspense fallback={<CodingLoader />}><Coding /></Suspense>} />
          <Route path="/driving" element={<Suspense fallback={<DrivingLoader />}><Driving /></Suspense>} />
          <Route path="/language" element={<Suspense fallback={<LanguageLoader />}><Language /></Suspense>} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" theme="dark" autoClose={2000} />
    </>
  )
}

export default App;

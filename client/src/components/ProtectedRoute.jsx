import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { GlobalLoader } from "./Loaders.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState("loading"); // "loading" | "authenticated" | "unauthenticated"
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      // If browser was reopened after closing or session is not active, require fresh login
      if (!sessionStorage.getItem("mz_session_active")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("mz_user");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("Step2Dev_token");
        localStorage.removeItem("mz_persistent_guest");
        if (isMounted) setAuthState("unauthenticated");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setAuthState("unauthenticated");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          setAuthState("authenticated");
        } else {
          localStorage.removeItem("token");
          setAuthState("unauthenticated");
        }
      } catch (err) {
        // If server is unreachable in development, treat existing token as valid
        if (isMounted) setAuthState("authenticated");
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (authState === "loading") {
    return <GlobalLoader />;
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

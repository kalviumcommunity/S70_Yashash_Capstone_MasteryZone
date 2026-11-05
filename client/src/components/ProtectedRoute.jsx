import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { GlobalLoader } from "./Loaders.jsx";
import { verifyActiveSession } from "../utils/sessionAuth.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState("loading"); // "loading" | "authenticated" | "unauthenticated"
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      // 1. Enforce active browser session check.
      // If the user closed the webpage and re-enters, no active session exists:
      // verifyActiveSession() clears stale stored tokens and returns false.
      const hasActiveSession = await verifyActiveSession();
      if (!hasActiveSession) {
        if (isMounted) setAuthState("unauthenticated");
        return;
      }

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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
          const data = await response.json().catch(() => null);
          if (data && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("mz_user", JSON.stringify(data.user));
          }
          setAuthState("authenticated");
        } else if (response.status === 401 || response.status === 403) {
          // Token is genuinely invalid or expired — purge session completely for strict isolation
          localStorage.clear();
          sessionStorage.clear();
          setAuthState("unauthenticated");
        } else {
          // Non-auth server status (e.g. 500), keep valid session
          setAuthState("authenticated");
        }
      } catch (err) {
        // If server is temporarily unreachable in development/offline, maintain valid session
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

import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { GlobalLoader } from "./Loaders.jsx";
import { verifyActiveSession, clearMasteryZoneStorage } from "../utils/sessionAuth.js";

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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(`${API_BASE}/auth/me`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        clearTimeout(timeoutId);

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json().catch(() => null);
          if (data && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("mz_user", JSON.stringify(data.user));
          }
          setAuthState("authenticated");
        } else if (response.status === 401 || response.status === 403) {
          // Token is invalid or expired — purge Mastery Zone session storage for strict isolation
          clearMasteryZoneStorage();
          setAuthState("unauthenticated");
        } else {
          // Server error (e.g. 500/502/503 during deployment restart):
          // If valid user exists locally, allow graceful entry rather than deadlocking
          const cachedUser = localStorage.getItem("user");
          if (cachedUser) {
            setAuthState("authenticated");
          } else {
            setAuthState("unauthenticated");
          }
        }
      } catch (err) {
        // Network timeout / Render cold start:
        console.warn("Protected route verification notice:", err.message);
        if (!isMounted) return;
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          setAuthState("authenticated");
        } else {
          setAuthState("unauthenticated");
        }
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

import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { GlobalLoader } from "./Loaders.jsx";
import { deduplicatedFetch } from "../utils/apiClient.js";
import {
  verifyActiveSession,
  clearMasteryZoneStorage,
  isJwtExpired,
  isSessionInactive,
  updateLastActivityTime,
} from "../utils/sessionAuth.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const user = sessionStorage.getItem("user") || localStorage.getItem("user");

      if (token && user && !isJwtExpired(token) && !isSessionInactive()) {
        return "authenticated";
      }
    } catch {}
    return "loading";
  });
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const cachedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

      // 1. Initial fast checks
      if (!token || isJwtExpired(token) || isSessionInactive()) {
        if (isMounted) {
          clearMasteryZoneStorage();
          setAuthState("unauthenticated");
        }
        return;
      }

      // Fast-path: if valid token and cached user exist, authenticate immediately
      if (cachedUser && isMounted) {
        setAuthState("authenticated");
      }

      // 2. Enforce active session verification
      const hasActiveSession = await verifyActiveSession();
      if (!hasActiveSession) {
        if (isMounted) {
          clearMasteryZoneStorage();
          setAuthState("unauthenticated");
        }
        return;
      }

      updateLastActivityTime();

      // 3. Revalidate with backend /auth/me in background
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await deduplicatedFetch(`${API_BASE}/auth/me`, {
          signal: controller.signal,
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cacheTtlMs: 3000,
        });
        clearTimeout(timeoutId);

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json().catch(() => null);
          if (data && data.user) {
            sessionStorage.setItem("user", JSON.stringify(data.user));
            sessionStorage.setItem("mz_user", JSON.stringify(data.user));
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("mz_user", JSON.stringify(data.user));
            setAuthState("authenticated");
          }
        } else if (response.status === 401 || response.status === 403) {
          // Token explicitly rejected by backend: purge session and redirect to login
          clearMasteryZoneStorage();
          setAuthState("unauthenticated");
        } else {
          // Server error (e.g. 500/502/503 during restart/cold-start):
          // If valid token and cached user exist, maintain authentication rather than deadlocking
          if (cachedUser) {
            setAuthState("authenticated");
          } else {
            clearMasteryZoneStorage();
            setAuthState("unauthenticated");
          }
        }
      } catch (err) {
        // Network timeout / offline / Render cold-start:
        console.warn("Protected route server verification notice:", err.message);
        if (!isMounted) return;
        if (cachedUser) {
          setAuthState("authenticated");
        } else {
          clearMasteryZoneStorage();
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

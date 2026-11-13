import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { GlobalLoader } from "../Loaders.jsx";
import { verifyActiveSession } from "../../utils/sessionAuth.js";
import { deduplicatedFetch } from "../../utils/apiClient.js";

const API_BASE = import.meta.env.VITE_API_URL || "";
const MAIN_ADMIN_EMAIL = "yashashyashash1@gmail.com";
const LEGACY_ADMIN_EMAIL = "yashashyash1@gmail.com";

const AdminRoute = ({ children }) => {
  const [authState, setAuthState] = useState("loading"); // "loading" | "authorized" | "unauthorized"
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      const hasActiveSession = await verifyActiveSession();
      if (!hasActiveSession) {
        if (isMounted) setAuthState("unauthorized");
        return;
      }

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        if (isMounted) setAuthState("unauthorized");
        return;
      }

      // Check immediate user cache first to prevent flash redirects on slow cold-starts
      const cachedUserStr = sessionStorage.getItem("user") || localStorage.getItem("user");
      let cachedUser = null;
      try {
        if (cachedUserStr) cachedUser = JSON.parse(cachedUserStr);
      } catch {}

      const cachedEmail = cachedUser?.email?.toLowerCase().trim();
      const isCachedAdmin =
        cachedEmail === MAIN_ADMIN_EMAIL ||
        cachedEmail === LEGACY_ADMIN_EMAIL ||
        cachedUser?.isMainAdmin === true ||
        cachedUser?.role === "SUPER_ADMIN" ||
        cachedUser?.role === "admin";

      if (isCachedAdmin && isMounted) {
        setAuthState("authorized");
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          const data = await response.json();
          const user = data?.user;

          const email = user?.email?.toLowerCase().trim();
          const isMain = email === MAIN_ADMIN_EMAIL || email === LEGACY_ADMIN_EMAIL || user?.isMainAdmin === true;
          const isSecondary = user?.role === "admin" || user?.role === "SUPER_ADMIN";

          if (user && (isMain || isSecondary)) {
            sessionStorage.setItem("user", JSON.stringify(user));
            sessionStorage.setItem("mz_user", JSON.stringify(user));
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("mz_user", JSON.stringify(user));
            setAuthState("authorized");
          } else {
            console.warn("⚠️ Non-admin account attempted to enter Admin Portal:", user?.email);
            setAuthState("unauthorized");
          }
        } else if (!isCachedAdmin) {
          // Fail-closed: reject invalid responses
          setAuthState("unauthorized");
        }
      } catch (err) {
        console.error("Admin route verification error:", err);
        // Fail-closed error handling: only maintain session if authenticated admin credential was verified
        if (isMounted && !isCachedAdmin) setAuthState("unauthorized");
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (authState === "loading") {
    return <GlobalLoader />;
  }

  if (authState === "unauthorized") {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  return children;
};

export default AdminRoute;

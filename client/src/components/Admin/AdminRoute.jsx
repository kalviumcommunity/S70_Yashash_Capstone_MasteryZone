import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { GlobalLoader } from "../Loaders.jsx";
import { verifyActiveSession } from "../../utils/sessionAuth.js";

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

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          const user = data?.user;

          const email = user?.email?.toLowerCase().trim();
          const isMain = email === MAIN_ADMIN_EMAIL || email === LEGACY_ADMIN_EMAIL || user?.isMainAdmin === true;
          const isSecondary = user?.role === "admin" || user?.role === "SUPER_ADMIN";

          if (user && (isMain || isSecondary)) {
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("mz_user", JSON.stringify(user));
            setAuthState("authorized");
          } else {
            console.warn("⚠️ Non-admin account attempted to enter Admin Portal:", user?.email);
            setAuthState("unauthorized");
          }
        } else {
          setAuthState("unauthorized");
        }
      } catch (err) {
        console.error("Admin route verification error:", err);
        // Fail-closed: Never trust cached local storage when server verification fails
        if (isMounted) setAuthState("unauthorized");
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

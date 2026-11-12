import { useEffect, useRef } from "react";
import {
  isSessionInactive,
  handleInactivityLogout,
  updateLastActivityTime,
  INACTIVITY_TIMEOUT_MS,
} from "../utils/sessionAuth.js";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "click"];

/**
 * useSessionInactivityMonitor
 * Continuously tracks user activity and automatically logs out the user
 * if they have been inactive for more than 12 hours.
 */
export function useSessionInactivityMonitor() {
  const lastThrottleRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Routine check to verify inactivity
    const checkActivity = () => {
      const hasSession =
        sessionStorage.getItem("mz_session_active") === "true" ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!hasSession) return;

      if (isSessionInactive()) {
        handleInactivityLogout();
      }
    };

    // User interaction handler: throttled to avoid overhead
    const handleUserInteraction = () => {
      const hasSession =
        sessionStorage.getItem("mz_session_active") === "true" ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!hasSession) return;

      // If already inactive (> 12h), immediately kick to logout instead of refreshing
      if (isSessionInactive()) {
        handleInactivityLogout();
        return;
      }

      const now = Date.now();
      // Throttle updating storage to once every 10 seconds
      if (now - lastThrottleRef.current > 10000) {
        lastThrottleRef.current = now;
        updateLastActivityTime();
      }
    };

    // Throttled mouse movement listener (max once per 30 seconds)
    let lastMouseThrottle = 0;
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseThrottle > 30000) {
        lastMouseThrottle = now;
        handleUserInteraction();
      }
    };

    // Attach interaction listeners
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Handle tab visibility and window focus (e.g. computer woke up from sleep after 12h)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // Periodic heartbeat check every 15 seconds
    const intervalId = setInterval(checkActivity, 15000);

    // Initial check on mount
    checkActivity();

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleUserInteraction);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      clearInterval(intervalId);
    };
  }, []);
}

export function SessionInactivityManager() {
  useSessionInactivityMonitor();
  return null;
}

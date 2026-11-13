// Cross-tab and session-bound authentication manager
// Ensures that closing the app and re-entering requires fresh authentication (zero stored login details),
// while active sessions (multi-tab workspaces and page reloads) remain seamless within the 12-hour activity window.

import { auth } from "../firebase/firebaseConfig.js";
import { signOut } from "firebase/auth";

const CHANNEL_NAME = "mz_auth_sync_channel";
let authChannel = null;

// Inactivity threshold: 12 hours (in milliseconds)
export const INACTIVITY_TIMEOUT_MS = 12 * 60 * 60 * 1000;

// Mastery Zone owned keys to isolate storage cleanup from unrelated website keys
export const MASTERY_ZONE_STORAGE_KEYS = [
  "token",
  "user",
  "mz_user",
  "userName",
  "userEmail",
  "guestToken",
  "guestUser",
  "mz_session_active",
  "mz_last_activity",
  "mz_session_start",
  "mz_active_meeting",
  "mz_recent_search",
  "mz_code_draft",
  "mz_workspace_state",
  "adminToken",
  "adminUser",
  "activeMeetingSession",
];

const PRESERVED_THEME_KEYS = new Set([
  "mz_theme",
  "mz_theme_preference",
  "mz_editor_theme",
  "mz_inactivity_notice",
]);

export const clearMasteryZoneStorage = () => {
  try {
    for (const key of MASTERY_ZONE_STORAGE_KEYS) {
      if (!PRESERVED_THEME_KEYS.has(key)) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
    }
    // Safely remove any prefixed keys without touching third-party storage or theme preferences
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && !PRESERVED_THEME_KEYS.has(k) && (k.startsWith("mz_") || k.startsWith("masteryzone_"))) {
        localStorage.removeItem(k);
      }
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && !PRESERVED_THEME_KEYS.has(k) && (k.startsWith("mz_") || k.startsWith("masteryzone_"))) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {}

  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mz_auth_sync"));
    }
  } catch {}
};

try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    authChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  authChannel = null;
}

export const getLastActivityTime = () => {
  try {
    const sTime = sessionStorage.getItem("mz_last_activity");
    const lTime = localStorage.getItem("mz_last_activity");
    const t = Math.max(Number(sTime) || 0, Number(lTime) || 0);
    return t > 0 ? t : null;
  } catch {
    return null;
  }
};

export const updateLastActivityTime = () => {
  try {
    const now = Date.now();
    sessionStorage.setItem("mz_last_activity", String(now));
    localStorage.setItem("mz_last_activity", String(now));
    if (authChannel) {
      authChannel.postMessage({ type: "MZ_ACTIVITY_PING", timestamp: now });
    }
  } catch {}
};

export function getCsrfToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)mz_csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const getJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};

export const getJwtIssuedAt = (token) => {
  const payload = getJwtPayload(token);
  return payload?.iat ? payload.iat * 1000 : null;
};

export const isJwtExpired = (token) => {
  const payload = getJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

/**
 * Returns true if the user's active session has been idle for more than 12 hours.
 */
export const isSessionInactive = () => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (!token) return false;

  const lastActive = getLastActivityTime();
  if (!lastActive) {
    const iatTime = getJwtIssuedAt(token);
    if (iatTime && Date.now() - iatTime > INACTIVITY_TIMEOUT_MS) {
      return true;
    }
    return false;
  }

  return Date.now() - lastActive > INACTIVITY_TIMEOUT_MS;
};

export const handleInactivityLogout = () => {
  performGlobalLogout("Your session has expired due to 12 hours of inactivity. Please log in again.");
};

// Listen for cross-tab messages
if (authChannel) {
  authChannel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === "MZ_CHECK_SESSION") {
      // Another tab in the same browser session just opened and is asking if an active session exists
      const isSessionActive = sessionStorage.getItem("mz_session_active") === "true";
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const user = sessionStorage.getItem("user") || localStorage.getItem("user");
      const lastActivity = getLastActivityTime();

      if (isSessionActive && token && !isJwtExpired(token) && !isSessionInactive()) {
        authChannel.postMessage({
          type: "MZ_SESSION_CONFIRMED",
          requestId: data.requestId,
          token,
          user,
          lastActivity,
        });
      }
    } else if (data.type === "MZ_LOGOUT") {
      if (data.reason && data.reason.includes("inactivity")) {
        try {
          sessionStorage.setItem("mz_inactivity_notice", data.reason);
        } catch {}
      }
      clearMasteryZoneStorage();
      if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/" && window.location.pathname !== "/landing") {
        window.location.replace("/login");
      }
    } else if (data.type === "MZ_ACTIVITY_PING") {
      if (data.timestamp) {
        try {
          sessionStorage.setItem("mz_last_activity", String(data.timestamp));
        } catch {}
      }
    }
  };
}

/**
 * Queries peer tabs in the current browser session via BroadcastChannel.
 * Resolves to true if an active peer tab responds with valid credentials.
 */
const queryPeerSession = (timeoutMs = 100) => {
  return new Promise((resolve) => {
    if (!authChannel) {
      resolve(false);
      return;
    }

    const requestId = "mz_req_" + Math.random().toString(36).substring(2);
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        authChannel.removeEventListener("message", onMessage);
        resolve(false);
      }
    }, timeoutMs);

    const onMessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "MZ_SESSION_CONFIRMED" && data.requestId === requestId) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          authChannel.removeEventListener("message", onMessage);

          if (data.token && !isJwtExpired(data.token)) {
            try {
              sessionStorage.setItem("mz_session_active", "true");
              sessionStorage.setItem("token", data.token);
              localStorage.setItem("token", data.token);
              if (data.user) {
                sessionStorage.setItem("user", data.user);
                sessionStorage.setItem("mz_user", data.user);
                localStorage.setItem("user", data.user);
                localStorage.setItem("mz_user", data.user);
              }
              if (data.lastActivity) {
                sessionStorage.setItem("mz_last_activity", String(data.lastActivity));
                localStorage.setItem("mz_last_activity", String(data.lastActivity));
              }
            } catch {}
            resolve(true);
          } else {
            resolve(false);
          }
        }
      }
    };

    authChannel.addEventListener("message", onMessage);

    try {
      authChannel.postMessage({
        type: "MZ_CHECK_SESSION",
        requestId,
      });
    } catch {
      clearTimeout(timer);
      authChannel.removeEventListener("message", onMessage);
      resolve(false);
    }
  });
};

/**
 * Verifies if there is an active session in the current tab or currently running browser context.
 * Strict rules:
 * 1. If inactive for > 12 hours -> automatic logout with notice.
 * 2. If tab has mz_session_active === 'true' (persists on reload) and valid token -> active.
 * 3. If tab has no mz_session_active, query other running tabs via BroadcastChannel:
 *    - If peer tab confirms active session -> sync and active.
 *    - If NO peer tab confirms (app was reopened after closing) -> purge storage, return false (logged out).
 */
export const verifyActiveSession = async (timeoutMs = 100) => {
  if (typeof window === "undefined") return false;

  // 1. Enforce 12-hour inactivity policy
  if (isSessionInactive()) {
    handleInactivityLogout();
    return false;
  }

  // 2. Current tab already marked with active session (persists across page reloads in this tab)
  if (sessionStorage.getItem("mz_session_active") === "true") {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token && !isJwtExpired(token)) {
      return true;
    }
    clearMasteryZoneStorage();
    return false;
  }

  // 3. Tab was just opened: check if any peer tab in the browser is active
  const hasPeerSession = await queryPeerSession(timeoutMs);
  if (hasPeerSession) {
    if (isSessionInactive()) {
      handleInactivityLogout();
      return false;
    }
    return true;
  }

  // 4. App was closed and reopened: ZERO saved login details, automatically logged out!
  clearMasteryZoneStorage();
  try {
    signOut(auth).catch(() => {});
  } catch {}
  return false;
};

/**
 * Global logout helper: clears storage, signs out Firebase, notifies other open tabs, and redirects to /login
 */
export const performGlobalLogout = (inactivityReason = null) => {
  try {
    if (authChannel) {
      authChannel.postMessage({
        type: "MZ_LOGOUT",
        reason: inactivityReason || "manual",
      });
    }
  } catch {}

  try {
    signOut(auth).catch(() => {});
  } catch {}

  try {
    const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || "";
    fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  } catch {}

  clearMasteryZoneStorage();

  if (inactivityReason) {
    try {
      sessionStorage.setItem("mz_inactivity_notice", inactivityReason);
    } catch {}
  }

  if (typeof window !== "undefined") {
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }
};

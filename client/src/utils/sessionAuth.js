// Cross-tab and session-bound authentication manager
// Ensures that closing the webpage and re-entering requires fresh authentication,
// while active sessions (including multi-tab workspaces and page reloads) remain seamless.

const CHANNEL_NAME = "mz_auth_sync_channel";
let authChannel = null;

// Mastery Zone owned keys to isolate storage cleanup from unrelated website keys
export const MASTERY_ZONE_STORAGE_KEYS = [
  "token",
  "user",
  "mz_user",
  "guestToken",
  "guestUser",
  "mz_session_active",
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
};

try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    authChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  authChannel = null;
}

// Listen for cross-tab messages
if (authChannel) {
  authChannel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === "MZ_CHECK_SESSION") {
      // Another tab in the same browser session just opened and is asking if an active session exists
      const isSessionActive = sessionStorage.getItem("mz_session_active") === "true";
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const user = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (isSessionActive && token) {
        authChannel.postMessage({
          type: "MZ_SESSION_CONFIRMED",
          token,
          user,
        });
      }
    } else if (data.type === "MZ_LOGOUT") {
      // A tab initiated logout — purge storage and navigate to /login
      clearMasteryZoneStorage();
      if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/" && window.location.pathname !== "/landing") {
        window.location.replace("/login");
      }
    }
  };
}

export const isJwtExpired = (token) => {
  if (!token || typeof token !== "string") return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
};

/**
 * Verifies if there is an active session in the current tab or currently running browser context.
 * If this tab has mz_session_active === 'true' or a valid non-expired JWT, it returns true immediately.
 */
export const verifyActiveSession = async (timeoutMs = 80) => {
  if (typeof window === "undefined") return false;

  // 1. Current tab already marked with active session (persists across reloads)
  if (sessionStorage.getItem("mz_session_active") === "true") {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token && !isJwtExpired(token)) return true;
  }

  // 2. If no token exists at all in storage
  const localToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!localToken) {
    clearMasteryZoneStorage();
    return false;
  }

  // 3. Valid non-expired JWT token exists in storage: keep session active across re-opens & devices
  if (!isJwtExpired(localToken)) {
    try {
      sessionStorage.setItem("mz_session_active", "true");
    } catch {}
    return true;
  }

  // 4. Token exists but is expired
  clearMasteryZoneStorage();
  return false;
};

/**
 * Global logout helper: clears storage, notifies other open tabs, and redirects to /login
 */
export const performGlobalLogout = () => {
  try {
    if (authChannel) {
      authChannel.postMessage({ type: "MZ_LOGOUT" });
    }
  } catch {}
  clearMasteryZoneStorage();
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
};

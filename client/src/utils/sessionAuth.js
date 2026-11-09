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
  "mz_theme",
  "mz_code_draft",
  "mz_workspace_state",
  "adminToken",
  "adminUser",
  "activeMeetingSession",
];

export const clearMasteryZoneStorage = () => {
  try {
    for (const key of MASTERY_ZONE_STORAGE_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    // Safely remove any prefixed keys without touching third-party storage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("mz_") || k.startsWith("masteryzone_"))) {
        localStorage.removeItem(k);
      }
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith("mz_") || k.startsWith("masteryzone_"))) {
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

/**
 * Verifies if there is an active session in the current tab or currently running browser context.
 * If this tab has mz_session_active === 'true', it returns true immediately (for page reloads and route changes).
 * If not, it queries other open tabs via BroadcastChannel.
 * If no open tab confirms an active session within timeoutMs, the user has re-entered the webpage after closing it:
 * Stored credentials and tokens are wiped, and it returns false (triggering /login).
 */
export const verifyActiveSession = async (timeoutMs = 80) => {
  if (typeof window === "undefined") return false;

  // 1. Current tab already marked with active session (persists across reloads)
  if (sessionStorage.getItem("mz_session_active") === "true") {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) return true;
  }

  // 2. If no token exists at all in storage
  const localToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!localToken) {
    clearMasteryZoneStorage();
    return false;
  }

  // 3. Token exists in localStorage, but current tab's sessionStorage does not have mz_session_active.
  // Query other open tabs to see if a session is currently active in another tab of this browser.
  if (authChannel) {
    const isOtherTabActive = await new Promise((resolve) => {
      let resolved = false;

      const messageListener = (event) => {
        if (event.data?.type === "MZ_SESSION_CONFIRMED" && event.data.token) {
          resolved = true;
          try {
            sessionStorage.setItem("mz_session_active", "true");
            if (event.data.token) {
              sessionStorage.setItem("token", event.data.token);
              localStorage.setItem("token", event.data.token);
            }
            if (event.data.user) {
              sessionStorage.setItem("user", typeof event.data.user === "string" ? event.data.user : JSON.stringify(event.data.user));
              localStorage.setItem("user", typeof event.data.user === "string" ? event.data.user : JSON.stringify(event.data.user));
            }
          } catch {}
          if (authChannel) {
            authChannel.removeEventListener("message", messageListener);
          }
          resolve(true);
        }
      };

      authChannel.addEventListener("message", messageListener);
      authChannel.postMessage({ type: "MZ_CHECK_SESSION" });

      setTimeout(() => {
        if (!resolved) {
          if (authChannel) {
            authChannel.removeEventListener("message", messageListener);
          }
          resolve(false);
        }
      }, timeoutMs);
    });

    if (isOtherTabActive) {
      return true;
    }
  }

  // 4. No active session confirmed — user re-entered the webpage after closing!
  // Purge all stored tokens and user details so they are not remembered.
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

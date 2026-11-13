import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { getSharedSocket, releaseSharedSocket } from "../utils/socketClient";
import {
  LuAward,
  LuBell,
  LuBookOpen,
  LuChevronRight,
  LuCircleAlert,
  LuCodeXml,
  LuShieldCheck,
  LuSparkles,
  LuTrendingUp,
  LuUser,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { deduplicatedFetch } from "../utils/apiClient";
import "../components/notificationBell.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

const NotificationContext = createContext(null);

function extractUserIdFromAuth() {
  try {
    const token = localStorage.getItem("token");
    if (token && token.split(".").length === 3) {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      const uid = payload.userId || payload.id || payload._id;
      if (uid) return String(uid);
    }
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const uid = parsed?._id || parsed?.id || parsed?.userId;
      if (uid) return String(uid);
    }
  } catch {
    // Ignore malformed token/storage
  }
  return "";
}

function playSoftNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.close().catch(() => {});
      return;
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.09);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 320);
  } catch {
    // Browser autoplay policies may block sound prior to interaction
  }
}

export function getNotificationIconMeta(type = "system", severity = "info") {
  const normalizedType = String(type || "system").toLowerCase();
  const normalizedSev = ["success", "warning", "alert", "info"].includes(severity)
    ? severity
    : "info";

  let Icon = LuBell;
  if (normalizedType === "assessment") Icon = LuShieldCheck;
  else if (normalizedType === "challenge") Icon = LuCodeXml;
  else if (normalizedType === "curriculum") Icon = LuBookOpen;
  else if (normalizedType === "progress") Icon = LuTrendingUp;
  else if (normalizedType === "certification") Icon = LuAward;
  else if (normalizedType === "collaboration") Icon = LuUsers;
  else if (normalizedType === "membership") Icon = LuSparkles;
  else if (normalizedType === "account") Icon = LuUser;
  else if (normalizedSev === "warning" || normalizedSev === "alert") Icon = LuCircleAlert;

  return {
    Icon,
    severityClass: `sev-${normalizedSev}`,
    label: normalizedType,
  };
}

export function NotificationProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [authToken, setAuthToken] = useState(() => localStorage.getItem("token") || "");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [bellPulseKey, setBellPulseKey] = useState(0);
  const [liveToast, setLiveToast] = useState(null);

  const socketRef = useRef(null);
  const toastTimerRef = useRef(null);
  const isExamRouteRef = useRef(false);

  // Keep track of whether user is inside a live proctored exam (/assessment/:sessionId)
  useEffect(() => {
    isExamRouteRef.current =
      location.pathname.startsWith("/assessment/") &&
      !location.pathname.startsWith("/assessment-report/");
  }, [location.pathname]);

  // Sync auth token across route changes, storage updates, and custom auth events
  useEffect(() => {
    const syncToken = () => {
      const current = localStorage.getItem("token") || "";
      setAuthToken((prev) => (prev !== current ? current : prev));
    };

    syncToken();
    window.addEventListener("storage", syncToken);
    window.addEventListener("mz_auth_sync", syncToken);
    window.addEventListener("focus", syncToken);

    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("mz_auth_sync", syncToken);
      window.removeEventListener("focus", syncToken);
    };
  }, [location.pathname]);

  const dismissLiveToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setLiveToast(null);
  }, []);

  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const res = await deduplicatedFetch(`${API_BASE}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cacheTtlMs: 3000,
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data)
        ? data
        : [];
      setNotifications(list);
      const count =
        typeof data.unreadCount === "number"
          ? data.unreadCount
          : list.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch {
      // Network hiccup; socket reconnect will retry
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manage real-time Socket.IO connection bound to authenticated user
  useEffect(() => {
    if (!authToken) {
      if (socketRef.current) {
        releaseSharedSocket(socketRef.current, 0);
        socketRef.current = null;
      }
      setIsSocketConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      dismissLiveToast();
      return;
    }

    refreshNotifications();

    const isCloudHosted = typeof window !== "undefined" && (
      window.location.hostname.includes("vercel.app") ||
      window.location.hostname.includes("netlify.app")
    );
    const socketTarget = import.meta.env.VITE_API_URL || (isCloudHosted ? "https://mastery-zone.onrender.com" : window.location.origin);
    const socket = getSharedSocket(socketTarget, {
      auth: { token: authToken },
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setIsSocketConnected(true);
      const userId = extractUserIdFromAuth();
      socket.emit("register_user_session", {
        token: authToken,
        userId,
      });
      refreshNotifications();
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleNewNotification = (payload) => {
      const incoming = payload?.notification || payload;
      if (!incoming || !incoming._id) return;

      setNotifications((prev) => {
        const exists = prev.some((item) => String(item._id) === String(incoming._id));
        const next = exists
          ? prev.map((item) =>
              String(item._id) === String(incoming._id) ? incoming : item
            )
          : [incoming, ...prev].slice(0, 60);

        if (typeof payload?.unreadCount === "number") {
          setUnreadCount(payload.unreadCount);
        } else {
          setUnreadCount(next.filter((item) => !item.isRead).length);
        }
        return next;
      });

      setBellPulseKey((prev) => prev + 1);
      playSoftNotificationChime();

      // Right-bottom live floating toast removed as requested so candidates only see
      // the standard notification in the Bell dropdown and clean single top-right toasts.
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setLiveToast(null);

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification.permission === "granted" &&
        document.hidden
      ) {
        try {
          new window.Notification(incoming.title || "Mastery Zone", {
            body: incoming.message || "",
          });
        } catch {
          // Ignore browser desktop notification errors
        }
      }
    };

    const handleNotificationsUpdated = (payload = {}) => {
      const { action, id, readOnly, unreadCount: serverUnread } = payload;

      setNotifications((prev) => {
        let updated = prev;
        if (action === "mark_read" && id) {
          updated = prev.map((n) =>
            String(n._id) === String(id) ? { ...n, isRead: true } : n
          );
        } else if (action === "mark_all_read") {
          updated = prev.map((n) => ({ ...n, isRead: true }));
        } else if (action === "delete" && id) {
          updated = prev.filter((n) => String(n._id) !== String(id));
        } else if (action === "clear") {
          updated = readOnly ? prev.filter((n) => !n.isRead) : [];
        }

        if (typeof serverUnread === "number") {
          setUnreadCount(serverUnread);
        } else {
          setUnreadCount(updated.filter((n) => !n.isRead).length);
        }
        return updated;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_notification", handleNewNotification);
    socket.on("notifications_updated", handleNotificationsUpdated);

    socket.on("RECORDING_SAVED", (recording) => {
      window.dispatchEvent(new CustomEvent("mz_recording_saved", { detail: recording }));
    });
    socket.on("RECORDING_UPDATED", (recording) => {
      window.dispatchEvent(new CustomEvent("mz_recording_updated", { detail: recording }));
    });
    socket.on("RECORDING_DELETED", (payload) => {
      window.dispatchEvent(new CustomEvent("mz_recording_deleted", { detail: payload }));
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_notification", handleNewNotification);
      socket.off("notifications_updated", handleNotificationsUpdated);
      socket.off("RECORDING_SAVED");
      socket.off("RECORDING_UPDATED");
      socket.off("RECORDING_DELETED");
      releaseSharedSocket(socket);
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [authToken, refreshNotifications, dismissLiveToast]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setNotifications((prev) => {
      const next = prev.map((n) =>
        String(n._id) === String(notificationId) ? { ...n, isRead: true } : n
      );
      setUnreadCount(next.filter((n) => !n.isRead).length);
      return next;
    });

    try {
      const res = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch {
      // Optimistic state kept
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Optimistic state kept
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    if (!notificationId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setNotifications((prev) => {
      const next = prev.filter((n) => String(n._id) !== String(notificationId));
      setUnreadCount(next.filter((n) => !n.isRead).length);
      return next;
    });

    try {
      const res = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch {
      // Optimistic state kept
    }
  }, []);

  const clearReadNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setNotifications((prev) => {
      const next = prev.filter((n) => !n.isRead);
      setUnreadCount(next.length);
      return next;
    });

    try {
      await fetch(`${API_BASE}/api/notifications/clear?readOnly=true`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Optimistic state kept
    }
  }, []);

  const handleLiveToastClick = useCallback(() => {
    if (!liveToast) return;
    const targetUrl = liveToast.actionUrl;
    const id = liveToast._id;
    dismissLiveToast();
    if (id && !liveToast.isRead) {
      markAsRead(id);
    }
    if (targetUrl) {
      navigate(targetUrl);
    }
  }, [liveToast, dismissLiveToast, markAsRead, navigate]);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isSocketConnected,
      bellPulseKey,
      liveToast,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearReadNotifications,
      refreshNotifications,
      dismissLiveToast,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      isSocketConnected,
      bellPulseKey,
      liveToast,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearReadNotifications,
      refreshNotifications,
      dismissLiveToast,
    ]
  );

  // Live bottom-right toast portal removed per requirements so only single clean notifications appear
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside a NotificationProvider");
  }
  return ctx;
}

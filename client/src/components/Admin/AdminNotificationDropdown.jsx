import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuBell,
  LuUserCheck,
  LuCode,
  LuAward,
  LuShieldAlert,
  LuCheck,
  LuTrash2,
  LuExternalLink,
  LuClock,
} from "react-icons/lu";
import { getSharedSocket, releaseSharedSocket } from "../../utils/socketClient";
import { deduplicatedFetch } from "../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

const getNotificationIcon = (type, severity) => {
  switch (type) {
    case "registration":
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--mz-blue-bg)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuUserCheck style={{ width: 16, height: 16 }} />
        </div>
      );
    case "coding":
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--mz-purple-bg)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuCode style={{ width: 16, height: 16 }} />
        </div>
      );
    case "certification":
    case "assessment":
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--mz-amber-bg)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuAward style={{ width: 16, height: 16 }} />
        </div>
      );
    case "proctoring":
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--mz-red-bg)", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuShieldAlert style={{ width: 16, height: 16 }} />
        </div>
      );
    default:
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--mz-surface-muted)", color: "var(--mz-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuBell style={{ width: 16, height: 16 }} />
        </div>
      );
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const AdminNotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await deduplicatedFetch(`${API_BASE}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        cacheTtlMs: 3000,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotifications(json.notifications || []);
          setUnreadCount(json.unreadCount || 0);
        }
      }
    } catch (err) {
      console.warn("Error fetching admin notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Connect to Socket.IO for real-time admin notifications
    let socket = null;
    let handleConnect = null;
    const handleAdminNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    try {
      const socketTarget = API_BASE || window.location.origin;
      socket = getSharedSocket(socketTarget);

      handleConnect = () => {
        const token = localStorage.getItem("token");
        if (socket && token) {
          socket.emit("join_admin_monitoring", { token });
        }
        fetchNotifications();
      };

      socket.on("connect", handleConnect);

      if (socket.connected) {
        const token = localStorage.getItem("token");
        if (token) {
          socket.emit("join_admin_monitoring", { token });
        }
      }

      socket.on("admin_notification_received", handleAdminNotif);
      socket.on("admin_notifications_updated", fetchNotifications);
    } catch (e) {
      console.warn("Admin notification socket connection error:", e);
    }

    // Close on outside click
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      if (socket) {
        if (handleConnect) socket.off("connect", handleConnect);
        socket.off("admin_notification_received", handleAdminNotif);
        releaseSharedSocket(socket);
      }
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/api/admin/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/api/admin/notifications/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClickItem = async (notif) => {
    try {
      if (!notif.isRead) {
        const token = localStorage.getItem("token");
        fetch(`${API_BASE}/api/admin/notifications/${notif._id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setIsOpen(false);
      if (notif.actionUrl) {
        navigate(notif.actionUrl);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`mz-admin-bell-btn ${isOpen ? "active" : ""}`}
        title="Admin Notifications"
        aria-label="Admin Notifications"
      >
        <LuBell style={{ width: 18, height: 18 }} />
        {unreadCount > 0 && (
          <span className="mz-admin-bell-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mz-admin-notif-dropdown">
          {/* Header */}
          <div className="mz-admin-notif-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h4 className="mz-admin-notif-title">
                Notifications
              </h4>
              {unreadCount > 0 ? (
                <span className="mz-admin-notif-badge-new">
                  {unreadCount} New
                </span>
              ) : (
                <span className="mz-admin-notif-badge-caughtup">
                  All caught up
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="mz-admin-notif-btn"
                  title="Mark all notifications as read"
                >
                  <LuCheck size={12} />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="mz-admin-notif-btn mz-notif-btn-clear"
                  title="Clear all notifications"
                >
                  <LuTrash2 size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="mz-admin-notif-list">
            {notifications.length === 0 ? (
              <div className="mz-admin-notif-empty">
                <div className="mz-admin-notif-empty-icon">
                  <LuBell size={24} />
                </div>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "var(--mz-text-primary)" }}>
                  No Notifications
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: "var(--mz-text-muted)", lineHeight: 1.4 }}>
                  Real-time events (registrations, exams, submissions, security alerts) will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleClickItem(n)}
                  className={`mz-admin-notif-item ${n.isRead ? "read" : "unread"}`}
                >
                  {getNotificationIcon(n.type, n.severity)}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span className="mz-admin-notif-item-title">
                        {n.title}
                      </span>
                      <span className="mz-admin-notif-item-time">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p className="mz-admin-notif-item-desc">
                      {n.message}
                    </p>
                  </div>

                  {!n.isRead && (
                    <span className="mz-admin-notif-unread-dot" title="Unread notification" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationDropdown;

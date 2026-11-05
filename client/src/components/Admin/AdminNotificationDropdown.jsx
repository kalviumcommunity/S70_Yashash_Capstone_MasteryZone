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
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "";

const getNotificationIcon = (type, severity) => {
  switch (type) {
    case "registration":
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuUserCheck style={{ width: 16, height: 16 }} />
        </div>
      );
    case "coding":
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuCode style={{ width: 16, height: 16 }} />
        </div>
      );
    case "certification":
    case "assessment":
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuAward style={{ width: 16, height: 16 }} />
        </div>
      );
    case "proctoring":
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LuShieldAlert style={{ width: 16, height: 16 }} />
        </div>
      );
    default:
      return (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
      const res = await fetch(`${API_BASE}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
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
    try {
      const socketTarget = API_BASE || window.location.origin;
      socket = io(socketTarget, {
        auth: { token: localStorage.getItem("token") },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        socket.emit("join_admin_monitoring");
        fetchNotifications();
      });

      socket.on("admin_notification_received", (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
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
      if (socket) socket.disconnect();
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
        onClick={() => setIsOpen((prev) => !prev)}
        className="mz-admin-bell-btn"
        title="Admin Notifications"
      >
        <LuBell style={{ width: 18, height: 18 }} />
        {unreadCount > 0 && (
          <span className="mz-admin-bell-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 10,
            width: 380,
            maxWidth: "90vw",
            background: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                Admin Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="mz-admin-badge-purple" style={{ fontSize: 10, padding: "2px 6px" }}>
                  {unreadCount} New
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#6366f1",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Mark all as read"
                >
                  Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: 11,
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                <LuBell style={{ width: 28, height: 28, margin: "0 auto 8px", opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No Notifications</p>
                <p style={{ margin: "4px 0 0", fontSize: 11.5 }}>
                  Real-time events (registrations, exams, submissions, security alerts) will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleClickItem(n)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f1f5f9",
                    background: n.isRead ? "#ffffff" : "#fbfaff",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = n.isRead ? "#ffffff" : "#fbfaff")
                  }
                >
                  {getNotificationIcon(n.type, n.severity)}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span style={{ fontWeight: n.isRead ? 600 : 700, fontSize: 12.5, color: "#0f172a" }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: 10.5, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#64748b", lineHeight: 1.35, wordBreak: "break-word" }}>
                      {n.message}
                    </p>
                  </div>

                  {!n.isRead && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#6366f1",
                        marginTop: 4,
                        flexShrink: 0,
                      }}
                    />
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

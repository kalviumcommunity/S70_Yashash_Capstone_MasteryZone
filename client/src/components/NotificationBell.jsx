import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  LuBell,
  LuBellRing,
  LuCheck,
  LuCheckCheck,
  LuChevronRight,
  LuRefreshCw,
  LuTrash2,
} from "react-icons/lu";
import {
  getNotificationIconMeta,
  useNotifications,
} from "../context/NotificationContext.jsx";
import "./notificationBell.css";

function formatRelativeTimestamp(dateInput, nowMs) {
  if (!dateInput) return "Just now";
  const ts = new Date(dateInput).getTime();
  if (Number.isNaN(ts)) return "Just now";
  const diffSec = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (diffSec < 15) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationBell({ variant = "default", className = "" }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isSocketConnected,
    bellPulseKey,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    refreshNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isRinging, setIsRinging] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 64, left: 16 });
  const [nowMs, setNowMs] = useState(() => Date.now());

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Animate bell swing whenever a real-time notification arrives
  useEffect(() => {
    if (bellPulseKey <= 0) return;
    setIsRinging(true);
    const timer = setTimeout(() => setIsRinging(false), 950);
    return () => clearTimeout(timer);
  }, [bellPulseKey]);

  // Keep relative timestamps fresh while popover is open
  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 20000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const updatePopoverPosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const popoverWidth = Math.min(396, window.innerWidth - 24);
    const desiredLeft = rect.right - popoverWidth;
    const clampedLeft = Math.max(
      12,
      Math.min(desiredLeft, window.innerWidth - popoverWidth - 12)
    );
    const top = Math.min(rect.bottom + 10, window.innerHeight - 120);
    setPopoverPos({ top, left: clampedLeft });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();

    const handleOutsideClick = (event) => {
      const target = event.target;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePopoverPosition]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }
    return notifications;
  }, [notifications, activeFilter]);

  const hasReadNotifications = useMemo(
    () => notifications.some((item) => item.isRead),
    [notifications]
  );

  const handleToggle = () => {
    if (!isOpen) {
      updatePopoverPosition();
    }
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (item) => {
    if (!item) return;
    if (!item.isRead && item._id) {
      markAsRead(item._id);
    }
    if (item.actionUrl) {
      setIsOpen(false);
      navigate(item.actionUrl);
    }
  };

  const isZone = variant === "zone";
  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div
      className={`mz-nb-wrapper ${isZone ? "mz-nb-zone" : ""} ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        className={[
          "mz-nb-trigger",
          isZone ? "mz-nb-trigger-zone" : "",
          isOpen ? "is-open" : "",
          unreadCount > 0 ? "has-unread" : "",
          isRinging ? "is-ringing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={handleToggle}
        title={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "Notifications (Live)"
        }
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        data-testid="mz-notification-bell"
      >
        <span className="mz-nb-icon-wrap">
          {isRinging ? <LuBellRing size={18} /> : <LuBell size={18} />}
        </span>

        {unreadCount > 0 ? (
          <span className="mz-nb-badge" data-testid="mz-notification-badge">
            {badgeText}
          </span>
        ) : (
          isSocketConnected && <span className="mz-nb-live-pip" />
        )}
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            className="mz-nb-popover"
            role="dialog"
            aria-label="Mastery Zone Notifications"
            data-testid="mz-notification-popover"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
            }}
          >
            {/* Header */}
            <div className="mz-nb-header">
              <div className="mz-nb-header-left">
                <h3 className="mz-nb-title">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="mz-nb-count-chip">{unreadCount} new</span>
                )}
                <span
                  className={`mz-nb-live-pill ${
                    isSocketConnected ? "" : "offline"
                  }`.trim()}
                  title={
                    isSocketConnected
                      ? "Connected to real-time notification stream"
                      : "Reconnecting to real-time stream"
                  }
                >
                  <span className="mz-nb-live-dot" />
                  <span>{isSocketConnected ? "Live" : "Syncing"}</span>
                </span>
              </div>

              <div className="mz-nb-header-actions">
                <button
                  type="button"
                  className="mz-nb-text-btn"
                  disabled={unreadCount === 0}
                  onClick={markAllAsRead}
                  title="Mark all notifications as read"
                >
                  <LuCheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
                <button
                  type="button"
                  className="mz-nb-icon-action"
                  onClick={refreshNotifications}
                  title="Sync notifications"
                  aria-label="Sync notifications"
                >
                  <LuRefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mz-nb-tabs-bar">
              <div className="mz-nb-tabs">
                <button
                  type="button"
                  className={`mz-nb-tab ${activeFilter === "all" ? "active" : ""}`}
                  onClick={() => setActiveFilter("all")}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  className={`mz-nb-tab ${
                    activeFilter === "unread" ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter("unread")}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {hasReadNotifications && (
                <button
                  type="button"
                  className="mz-nb-clear-btn"
                  onClick={clearReadNotifications}
                  title="Clear read notifications"
                >
                  Clear read
                </button>
              )}
            </div>

            {/* Notification Items */}
            <div className="mz-nb-list">
              {filteredNotifications.length === 0 ? (
                <div className="mz-nb-empty">
                  <div className="mz-nb-empty-icon">
                    <LuBell size={20} />
                  </div>
                  <p className="mz-nb-empty-title">
                    {activeFilter === "unread"
                      ? "You're all caught up!"
                      : "No notifications yet"}
                  </p>
                  <p className="mz-nb-empty-sub">
                    {activeFilter === "unread"
                      ? "New assessment grades, challenge completions, and collaboration alerts will appear here instantly."
                      : "Complete assessments, solve coding challenges, or log study sessions to receive live updates."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const { Icon, severityClass, label } = getNotificationIconMeta(
                    item.type,
                    item.severity
                  );
                  return (
                    <div
                      key={item._id}
                      className={`mz-nb-item ${item.isRead ? "read" : "unread"}`}
                      onClick={() => handleItemClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleItemClick(item);
                        }
                      }}
                    >
                      <div className={`mz-nb-item-icon ${severityClass}`}>
                        <Icon size={17} />
                      </div>

                      <div className="mz-nb-item-body">
                        <div className="mz-nb-item-top">
                          <span className="mz-nb-item-title">
                            {item.title || "Mastery Zone Update"}
                          </span>
                          <span className="mz-nb-item-time">
                            {formatRelativeTimestamp(item.createdAt, nowMs)}
                          </span>
                        </div>

                        <p className="mz-nb-item-msg">{item.message}</p>

                        <div className="mz-nb-item-footer">
                          {item.actionUrl ? (
                            <span className="mz-nb-action-chip">
                              <span>{item.actionLabel || "View details"}</span>
                              <LuChevronRight size={12} />
                            </span>
                          ) : (
                            <span className="mz-nb-type-tag">{label}</span>
                          )}
                        </div>
                      </div>

                      <div className="mz-nb-item-controls">
                        {!item.isRead && (
                          <button
                            type="button"
                            className="mz-nb-mini-btn"
                            title="Mark as read"
                            aria-label="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(item._id);
                            }}
                          >
                            <LuCheck size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="mz-nb-mini-btn delete"
                          title="Delete notification"
                          aria-label="Delete notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item._id);
                          }}
                        >
                          <LuTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import { performGlobalLogout } from "../utils/sessionAuth";
import {
  LuUser,
  LuTrendingUp,
  LuAward,
  LuShieldCheck,
  LuSettings,
  LuLogOut,
} from "react-icons/lu";
import "./UserProfileDropdown.css";

export default function UserProfileDropdown({
  isOpen,
  onClose,
  user = null,
  certCount = null,
  onCertificatesClick = null,
  onOpenSettings = null,
  onLogout = null,
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Resolve user info from props or persistent storage
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const resolvedUser = user || storedUser;
  const fullName =
    resolvedUser?.fullName ||
    resolvedUser?.name ||
    resolvedUser?.username ||
    localStorage.getItem("userName") ||
    "Learner";

  const email =
    resolvedUser?.email ||
    localStorage.getItem("userEmail") ||
    "learner@masteryzone.com";

  const avatarUrl =
    resolvedUser?.avatarUrl ||
    resolvedUser?.avatar ||
    resolvedUser?.photoURL ||
    null;

  const isGuest = String(fullName).toLowerCase().includes("guest");
  const isAdmin =
    resolvedUser?.role === "SUPER_ADMIN" ||
    resolvedUser?.role === "admin" ||
    email === "yashashyash1@gmail.com";

  const roleLabel = isGuest
    ? "Guest"
    : isAdmin
    ? (resolvedUser?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin")
    : "Learner";

  // Resolve certificate count
  const resolvedCertCount =
    certCount !== null && certCount !== undefined
      ? certCount
      : (() => {
          try {
            const list = JSON.parse(localStorage.getItem("mz_certificates") || "[]");
            return Array.isArray(list) ? list.length : 0;
          } catch {
            return 0;
          }
        })();

  const handleClose = () => {
    if (typeof onClose === "function") onClose();
  };

  return (
    <div
      className="mz-c-user-dropdown"
      role="menu"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. User Profile Header Card */}
      <div className="mz-c-dropdown-header-card">
        <div className="mz-c-dropdown-avatar-wrap">
          <div className="mz-c-dropdown-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="User" />
            ) : (
              (fullName || "U").charAt(0).toUpperCase()
            )}
          </div>
          <span className="mz-c-dropdown-status-dot" title="Active session" />
        </div>
        <div className="mz-c-dropdown-header-info">
          <div className="mz-c-dropdown-name-row">
            <strong className="mz-c-dropdown-name" title={fullName}>
              {fullName}
            </strong>
            <span className="mz-c-role-badge">{roleLabel}</span>
          </div>
          <span className="mz-c-dropdown-sub" title={email}>
            {email}
          </span>
        </div>
      </div>

      <div className="mz-c-dropdown-divider" />

      {/* 2. Profile Settings */}
      <div
        className="mz-c-dropdown-item"
        onClick={() => {
          handleClose();
          navigate("/profile");
        }}
      >
        <span className="mz-c-dropdown-item-icon">
          <LuUser size={16} />
        </span>
        <div className="mz-c-dropdown-item-content">
          <span className="mz-c-dropdown-item-title">Profile Settings</span>
          <span className="mz-c-dropdown-item-desc">Account details & preferences</span>
        </div>
      </div>

      {/* 3. My Learning Progress */}
      <div
        className="mz-c-dropdown-item"
        onClick={() => {
          handleClose();
          navigate("/progress");
        }}
      >
        <span className="mz-c-dropdown-item-icon">
          <LuTrendingUp size={16} />
        </span>
        <div className="mz-c-dropdown-item-content">
          <span className="mz-c-dropdown-item-title">My Learning Progress</span>
          <span className="mz-c-dropdown-item-desc">XP, streaks & completion stats</span>
        </div>
      </div>

      {/* 4. My Earned Certificates */}
      <div
        className="mz-c-dropdown-item"
        onClick={() => {
          handleClose();
          if (typeof onCertificatesClick === "function") {
            onCertificatesClick();
          } else {
            navigate("/certificates");
          }
        }}
      >
        <span className="mz-c-dropdown-item-icon">
          <LuAward size={16} />
        </span>
        <div className="mz-c-dropdown-item-content">
          <div className="mz-c-dropdown-item-title-row">
            <span className="mz-c-dropdown-item-title">My Earned Certificates</span>
            <span className="mz-c-cert-count-pill">{resolvedCertCount}</span>
          </div>
          <span className="mz-c-dropdown-item-desc">Accredited credentials</span>
        </div>
      </div>

      {/* 5. Super Admin Portal (if admin) */}
      {isAdmin && (
        <div
          className="mz-c-dropdown-item"
          onClick={() => {
            handleClose();
            navigate("/admin/overview");
          }}
        >
          <span
            className="mz-c-dropdown-item-icon"
            style={{ background: "var(--mz-indigo-bg, #eef2ff)", color: "var(--mz-indigo-text, #6366f1)" }}
          >
            <LuShieldCheck size={16} />
          </span>
          <div className="mz-c-dropdown-item-content">
            <span className="mz-c-dropdown-item-title" style={{ color: "var(--mz-indigo-text, #4f46e5)" }}>
              Super Admin Portal
            </span>
            <span className="mz-c-dropdown-item-desc">System moderation & control</span>
          </div>
        </div>
      )}

      {/* 6. App Settings */}
      <div
        className="mz-c-dropdown-item"
        onClick={() => {
          handleClose();
          if (typeof onOpenSettings === "function") {
            onOpenSettings();
          } else {
            window.dispatchEvent(new CustomEvent("mz:open-settings"));
            navigate("/settings");
          }
        }}
      >
        <span className="mz-c-dropdown-item-icon">
          <LuSettings size={16} />
        </span>
        <div className="mz-c-dropdown-item-content">
          <span className="mz-c-dropdown-item-title">App Settings</span>
          <span className="mz-c-dropdown-item-desc">Preferences & security</span>
        </div>
      </div>

      <div className="mz-c-dropdown-divider" />

      {/* 7. Sign Out */}
      <div
        className="mz-c-dropdown-item mz-c-item-danger"
        onClick={() => {
          handleClose();
          if (typeof onLogout === "function") {
            onLogout();
          } else {
            performGlobalLogout();
          }
        }}
      >
        <span className="mz-c-dropdown-item-icon">
          <LuLogOut size={16} />
        </span>
        <div className="mz-c-dropdown-item-content">
          <span className="mz-c-dropdown-item-title">Sign Out</span>
          <span className="mz-c-dropdown-item-desc">End current active session</span>
        </div>
      </div>
    </div>
  );
}

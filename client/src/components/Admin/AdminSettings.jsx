import React, { useState, useEffect } from "react";
import {
  LuSettings,
  LuShieldCheck,
  LuBell,
  LuSlidersHorizontal,
  LuSave,
  LuHistory,
  LuLock,
  LuUserCheck,
  LuUserX,
  LuUserPlus,
  LuKeyRound,
  LuMail,
  LuEye,
  LuEyeOff,
  LuCircleCheck,
  LuTriangleAlert,
  LuRefreshCw,
  LuTrash2,
  LuShield,
  LuClock,
} from "react-icons/lu";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL || "";
const MAIN_ADMIN_EMAIL = "yashashyashash1@gmail.com";

const AVAILABLE_PERMISSIONS = [
  { id: "overview", label: "Overview & Telemetry" },
  { id: "users", label: "User Management" },
  { id: "coding-analytics", label: "Coding Analytics & Inspector" },
  { id: "assessments", label: "Assessments & Submissions" },
  { id: "proctoring", label: "Proctoring & Integrity" },
  { id: "reports", label: "Centralized Reports" },
  { id: "recordings", label: "Recordings Management" },
  { id: "live-activity", label: "Live Candidate Activity" },
];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("admin-mgmt"); // "admin-mgmt" | "controls" | "audit"
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    proctoringSensitivity: "strict",
    autoRecordAssessments: true,
    emailNotificationsEnabled: true,
    allowedRegistration: true,
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Current logged in user info
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const currentUserEmail = (currentUser?.email || "").toLowerCase().trim();
  const isMainAdmin = currentUserEmail === MAIN_ADMIN_EMAIL;

  // Main Admin 2FA Verification State
  const [authStep, setAuthStep] = useState(() => {
    return sessionStorage.getItem("mz_admin_unlocked") === "true" ? "unlocked" : "password";
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem("adminMgmtToken") || "");

  // Admins List State
  const [adminsList, setAdminsList] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Add Admin Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    email: "",
    fullName: "",
    initialPassword: "",
    adminPermissions: ["reports", "assessments", "coding", "proctoring", "recordings", "users", "overview"],
    requirePasswordChange: true,
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAdminForReset, setSelectedAdminForReset] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/email/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toEmail: currentUserEmail || currentUser?.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Test email dispatched successfully!");
      } else {
        toast.error(data.message || "Failed to dispatch test email.");
      }
    } catch (err) {
      console.error("Test email dispatch error:", err);
      toast.error("Network error sending test email.");
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Fetch Settings & Audit Logs
  const fetchSettingsAndAudit = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSettings(json.settings);
          setAuditLogs(json.auditLogs || []);
        }
      }
    } catch (err) {
      console.error("Settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Administrators List
  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAdminsList(json.admins || []);
        }
      }
    } catch (err) {
      console.error("Fetch admins error:", err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndAudit();
    if (authStep === "unlocked") {
      fetchAdmins();
    }
  }, [authStep]);

  // Handle Save Platform Settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Platform settings updated successfully!");
        fetchSettingsAndAudit();
      } else {
        toast.error(json.message || "Failed to update settings");
      }
    } catch (err) {
      toast.error("Error saving platform settings");
    } finally {
      setSaving(false);
    }
  };

  // Step 1: Submit Password to Request OTP
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      toast.warning("Please enter your administrator password.");
      return;
    }

    setVerifyingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/main-admin/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: passwordInput }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`6-digit verification code sent to ${MAIN_ADMIN_EMAIL}!`);
        setAuthStep("otp");
      } else {
        toast.error(json.message || "Invalid administrator credentials");
      }
    } catch (err) {
      toast.error("Error verifying administrator password");
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Step 2: Submit OTP to Unlock Admin Management
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      toast.warning("Please enter the complete 6-digit OTP code.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/main-admin/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: otpInput.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Identity verified! Administrator Management unlocked.");
        sessionStorage.setItem("mz_admin_unlocked", "true");
        if (json.adminMgmtToken) {
          sessionStorage.setItem("adminMgmtToken", json.adminMgmtToken);
          setAdminToken(json.adminMgmtToken);
        }
        setAuthStep("unlocked");
        fetchAdmins();
      } else {
        toast.error(json.message || "Invalid or expired OTP code.");
      }
    } catch (err) {
      toast.error("Error verifying OTP code");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/main-admin/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: passwordInput || "miqtinlszsdfayvi" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.info(`A new 6-digit OTP code was sent to ${MAIN_ADMIN_EMAIL}`);
      } else {
        toast.error(json.message || "Failed to resend OTP");
      }
    } catch {
      toast.error("Error resending OTP code");
    } finally {
      setResendingOtp(false);
    }
  };

  // Lock Admin Management Session
  const handleLockSession = () => {
    sessionStorage.removeItem("mz_admin_unlocked");
    sessionStorage.removeItem("adminMgmtToken");
    setAuthStep("password");
    setPasswordInput("");
    setOtpInput("");
    toast.info("Administrator Management session locked.");
  };

  // Generate Strong Password Helper
  const generateStrongPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Handle Create Admin
  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.email || !addForm.initialPassword) {
      toast.warning("Please provide email and initial password");
      return;
    }

    setCreatingAdmin(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/admins/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addForm),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Secondary administrator created successfully!");
        setShowAddModal(false);
        setAddForm({
          email: "",
          fullName: "",
          initialPassword: "",
          adminPermissions: ["reports", "assessments", "coding", "proctoring", "recordings", "users", "overview"],
          requirePasswordChange: true,
        });
        fetchAdmins();
        fetchSettingsAndAudit();
      } else {
        toast.error(json.message || "Failed to create administrator");
      }
    } catch (err) {
      toast.error("Error creating administrator");
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Handle Toggle Admin Status (Active / Suspended)
  const handleToggleAdminStatus = async (admin) => {
    if (admin.isMainAdmin) {
      toast.warning("The Main Administrator cannot be suspended.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/admins/${admin._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchAdmins();
        fetchSettingsAndAudit();
      } else {
        toast.error(json.message || "Failed to update administrator status");
      }
    } catch (err) {
      toast.error("Error toggling administrator status");
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      toast.warning("New password must be at least 6 characters.");
      return;
    }

    setResettingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/admins/${selectedAdminForReset._id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword: newPasswordInput,
          requirePasswordChange: true,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setShowResetModal(false);
        setNewPasswordInput("");
        setSelectedAdminForReset(null);
        fetchAdmins();
        fetchSettingsAndAudit();
      } else {
        toast.error(json.message || "Failed to reset password");
      }
    } catch (err) {
      toast.error("Error resetting administrator password");
    } finally {
      setResettingPassword(false);
    }
  };

  // Handle Remove Secondary Admin
  const handleRemoveAdmin = async (admin) => {
    if (admin.isMainAdmin) {
      toast.warning("Cannot remove the Main Administrator.");
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke administrator privileges from ${admin.email}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/admins/${admin._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchAdmins();
        fetchSettingsAndAudit();
      } else {
        toast.error(json.message || "Failed to remove administrator");
      }
    } catch (err) {
      toast.error("Error removing administrator");
    }
  };

  return (
    <div className="mz-admin-view-container">
      {/* Page Header */}
      <div className="mz-admin-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuSettings style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Platform Configuration & Admin Management</h1>
            <p className="mz-admin-page-subtitle">
              Exclusive Main Administrator authentication, multi-admin authorization, and immutable audit logs.
            </p>
          </div>
        </div>

        {activeTab === "controls" && (
          <button onClick={handleSaveSettings} disabled={saving} className="mz-admin-btn-primary">
            <LuSave style={{ width: 16, height: 16 }} />
            <span>{saving ? "Saving Changes..." : "Save Platform Settings"}</span>
          </button>
        )}
      </div>

      {/* Main Admin Identity Box */}
      <div
        style={{
          background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #eff6ff 100%)",
          padding: "18px 24px",
          borderRadius: 16,
          border: "1px solid #ddd6fe",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            className="mz-admin-stat-icon"
            style={{
              background: "#6366f1",
              color: "#ffffff",
              boxShadow: "0 4px 10px rgba(99, 102, 241, 0.35)",
            }}
          >
            <LuShield style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e1b4b" }}>
                Platform Super Administrator & Sole Authority
              </h3>
              <span className="mz-admin-badge-purple" style={{ fontSize: 10 }}>
                EXCLUSIVE OWNER
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#475569" }}>
              Designated Main Admin Email:{" "}
              <strong style={{ color: "#4f46e5" }}>{MAIN_ADMIN_EMAIL}</strong>{" "}
              <span style={{ color: "#94a3b8" }}>• Environment-Protected & Non-Transferable</span>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mz-admin-badge-green" style={{ fontSize: 11, padding: "4px 10px" }}>
            <LuShieldCheck style={{ width: 13, height: 13 }} />
            <span>2FA OTP Enforced</span>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 2,
          marginTop: 10,
        }}
      >
        <button
          onClick={() => setActiveTab("admin-mgmt")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: "10px 10px 0 0",
            border: "none",
            background: activeTab === "admin-mgmt" ? "#ffffff" : "transparent",
            color: activeTab === "admin-mgmt" ? "#4f46e5" : "#64748b",
            fontWeight: activeTab === "admin-mgmt" ? 700 : 500,
            fontSize: 13.5,
            cursor: "pointer",
            borderBottom: activeTab === "admin-mgmt" ? "2px solid #4f46e5" : "2px solid transparent",
            transition: "all 0.15s ease",
          }}
        >
          <LuLock style={{ width: 15, height: 15 }} />
          <span>Admin Management (Exclusive)</span>
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              background: activeTab === "admin-mgmt" ? "#ede9fe" : "#f1f5f9",
              color: activeTab === "admin-mgmt" ? "#6366f1" : "#94a3b8",
            }}
          >
            2FA
          </span>
        </button>

        <button
          onClick={() => setActiveTab("controls")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: "10px 10px 0 0",
            border: "none",
            background: activeTab === "controls" ? "#ffffff" : "transparent",
            color: activeTab === "controls" ? "#4f46e5" : "#64748b",
            fontWeight: activeTab === "controls" ? 700 : 500,
            fontSize: 13.5,
            cursor: "pointer",
            borderBottom: activeTab === "controls" ? "2px solid #4f46e5" : "2px solid transparent",
            transition: "all 0.15s ease",
          }}
        >
          <LuSlidersHorizontal style={{ width: 15, height: 15 }} />
          <span>Platform Controls & Toggles</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: "10px 10px 0 0",
            border: "none",
            background: activeTab === "audit" ? "#ffffff" : "transparent",
            color: activeTab === "audit" ? "#4f46e5" : "#64748b",
            fontWeight: activeTab === "audit" ? 700 : 500,
            fontSize: 13.5,
            cursor: "pointer",
            borderBottom: activeTab === "audit" ? "2px solid #4f46e5" : "2px solid transparent",
            transition: "all 0.15s ease",
          }}
        >
          <LuHistory style={{ width: 15, height: 15 }} />
          <span>Immutable Audit Log</span>
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              background: "#f1f5f9",
              color: "#64748b",
            }}
          >
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* ────────────────── TAB 1: ADMIN MANAGEMENT (MAIN ADMIN EXCLUSIVE) ────────────────── */}
      {activeTab === "admin-mgmt" && (
        <div>
          {!isMainAdmin ? (
            /* Restricted Notice for Non-Main Admins */
            <div
              className="mz-admin-card"
              style={{
                textAlign: "center",
                padding: "60px 30px",
                border: "1px solid #fed7aa",
                background: "#fffbeb",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#ffedd5",
                  color: "#d97706",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <LuLock style={{ width: 28, height: 28 }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#9a3412", margin: 0 }}>
                Super Administrator Authority Required
              </h2>
              <p
                style={{
                  fontSize: 13.5,
                  color: "#78350f",
                  maxWidth: 540,
                  margin: "10px auto 20px",
                  lineHeight: 1.6,
                }}
              >
                The <strong>Admin Management</strong> portal is exclusively restricted to the platform Main Administrator (
                <strong>{MAIN_ADMIN_EMAIL}</strong>). Secondary administrator accounts are not authorized to view, create,
                or modify administrator credentials.
              </p>
              <span className="mz-admin-badge-purple" style={{ fontSize: 11 }}>
                Current Account: {currentUserEmail || "Secondary Administrator"}
              </span>
            </div>
          ) : authStep === "password" ? (
            /* Step 1: Password Verification Card */
            <div
              className="mz-admin-card"
              style={{
                maxWidth: 520,
                margin: "30px auto",
                padding: "32px 36px",
                border: "1px solid #e0e7ff",
                boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.1)",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                    marginBottom: 14,
                  }}
                >
                  <LuLock style={{ width: 24, height: 24 }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Main Admin Security Challenge
                </h2>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>
                  Enter your Main Administrator password to initiate 2FA. A single-use 6-digit OTP will be dispatched to{" "}
                  <strong style={{ color: "#4f46e5" }}>{MAIN_ADMIN_EMAIL}</strong>.
                </p>
              </div>

              <form onSubmit={handleVerifyPassword}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Main Admin Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter administrator password"
                      className="mz-admin-input"
                      style={{ width: "100%", paddingRight: 40 }}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#94a3b8",
                      }}
                    >
                      {showPassword ? <LuEyeOff style={{ width: 16, height: 16 }} /> : <LuEye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingPassword}
                  className="mz-admin-btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "11px 0" }}
                >
                  {verifyingPassword ? (
                    <>
                      <LuRefreshCw className="animate-spin" style={{ width: 16, height: 16 }} />
                      <span>Verifying & Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <LuMail style={{ width: 16, height: 16 }} />
                      <span>Verify & Send 6-Digit OTP</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : authStep === "otp" ? (
            /* Step 2: OTP Verification Card */
            <div
              className="mz-admin-card"
              style={{
                maxWidth: 520,
                margin: "30px auto",
                padding: "32px 36px",
                border: "1px solid #ddd6fe",
                boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.12)",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    marginBottom: 14,
                  }}
                >
                  <LuKeyRound style={{ width: 24, height: 24 }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Enter 6-Digit OTP Code
                </h2>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>
                  A one-time passcode was dispatched to{" "}
                  <strong style={{ color: "#059669" }}>{MAIN_ADMIN_EMAIL}</strong>. It expires in 10 minutes.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="mz-admin-input"
                    style={{
                      width: "100%",
                      textAlign: "center",
                      letterSpacing: "0.5em",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#1e1b4b",
                    }}
                    required
                    autoFocus
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                      fontSize: 11.5,
                      color: "#64748b",
                    }}
                  >
                    <span>Single-use • 5 attempts maximum</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendingOtp}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#4f46e5",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {resendingOtp ? "Resending..." : "Resend OTP"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="mz-admin-btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "11px 0" }}
                >
                  {verifyingOtp ? (
                    <>
                      <LuRefreshCw className="animate-spin" style={{ width: 16, height: 16 }} />
                      <span>Unlocking Access...</span>
                    </>
                  ) : (
                    <>
                      <LuShieldCheck style={{ width: 16, height: 16 }} />
                      <span>Verify OTP & Unlock Access</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthStep("password")}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Password Verification
                </button>
              </form>
            </div>
          ) : (
            /* Step 3: Unlocked Admin Management Interface */
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Unlocked Controls Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  padding: "16px 20px",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#16a34a",
                        boxShadow: "0 0 0 3px rgba(22, 163, 74, 0.2)",
                      }}
                    />
                    <span>Main Admin Session Verified (Active)</span>
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Total Registered Administrators: <strong>{adminsList.length}</strong>
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mz-admin-btn-primary"
                    style={{ padding: "8px 16px" }}
                  >
                    <LuUserPlus style={{ width: 15, height: 15 }} />
                    <span>+ Add Secondary Administrator</span>
                  </button>
                  <button
                    onClick={handleLockSession}
                    className="mz-admin-btn-secondary"
                    style={{ padding: "8px 14px", color: "#64748b" }}
                  >
                    <LuLock style={{ width: 14, height: 14 }} />
                    <span>Lock Session</span>
                  </button>
                </div>
              </div>

              {/* Administrators Table Card */}
              <div className="mz-admin-card" style={{ padding: 0 }}>
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      Platform Administrators
                    </h3>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      Authenticated admin accounts and granular operational permissions
                    </span>
                  </div>
                  <button
                    onClick={fetchAdmins}
                    className="mz-admin-btn-secondary"
                    style={{ padding: "6px 10px", fontSize: 12 }}
                  >
                    <LuRefreshCw className={loadingAdmins ? "animate-spin" : ""} style={{ width: 13, height: 13 }} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="mz-admin-table-wrap">
                  <table className="mz-admin-table">
                    <thead>
                      <tr>
                        <th>Administrator</th>
                        <th>Role & Authority</th>
                        <th>Granted Permissions</th>
                        <th>Account Status</th>
                        <th>Created Date</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminsList.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                            {loadingAdmins ? "Loading administrators..." : "No administrators registered yet."}
                          </td>
                        </tr>
                      ) : (
                        adminsList.map((admin) => {
                          const isMain = admin.isMainAdmin || admin.email === MAIN_ADMIN_EMAIL;
                          return (
                            <tr key={admin._id}>
                              {/* Administrator Column */}
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 10,
                                      background: isMain
                                        ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)"
                                        : "#e2e8f0",
                                      color: isMain ? "#ffffff" : "#475569",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 800,
                                      fontSize: 14,
                                    }}
                                  >
                                    {(admin.fullName || admin.email || "A").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>
                                      {admin.fullName || "Administrator"}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: "#64748b" }}>{admin.email}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Role & Authority Column */}
                              <td>
                                {isMain ? (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      background: "#ede9fe",
                                      color: "#6366f1",
                                      fontWeight: 800,
                                      fontSize: 11,
                                    }}
                                  >
                                    <LuShield style={{ width: 12, height: 12 }} />
                                    <span>Main Admin (Sole Owner)</span>
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      background: "#e0f2fe",
                                      color: "#0284c7",
                                      fontWeight: 700,
                                      fontSize: 11,
                                    }}
                                  >
                                    <span>Secondary Admin</span>
                                  </span>
                                )}
                              </td>

                              {/* Permissions Column */}
                              <td>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 280 }}>
                                  {isMain ? (
                                    <span
                                      className="mz-admin-badge-purple"
                                      style={{ fontSize: 10, padding: "2px 6px" }}
                                    >
                                      Full Platform Authority (*)
                                    </span>
                                  ) : admin.adminPermissions?.length > 0 ? (
                                    admin.adminPermissions.map((perm) => (
                                      <span
                                        key={perm}
                                        style={{
                                          fontSize: 10,
                                          padding: "2px 6px",
                                          borderRadius: 4,
                                          background: "#f1f5f9",
                                          color: "#475569",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {perm}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Standard View Only</span>
                                  )}
                                </div>
                              </td>

                              {/* Status Column */}
                              <td>
                                {admin.isSuspended ? (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      background: "#fee2e2",
                                      color: "#dc2626",
                                      fontWeight: 700,
                                      fontSize: 11,
                                    }}
                                  >
                                    <LuUserX style={{ width: 12, height: 12 }} />
                                    <span>Suspended</span>
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      background: "#dcfce7",
                                      color: "#16a34a",
                                      fontWeight: 700,
                                      fontSize: 11,
                                    }}
                                  >
                                    <LuUserCheck style={{ width: 12, height: 12 }} />
                                    <span>Active</span>
                                  </span>
                                )}
                                {admin.mustChangePassword && (
                                  <div style={{ marginTop: 3 }}>
                                    <span
                                      style={{
                                        fontSize: 9.5,
                                        color: "#d97706",
                                        background: "#fef3c7",
                                        padding: "1px 5px",
                                        borderRadius: 4,
                                        fontWeight: 600,
                                      }}
                                    >
                                      Password Reset Required
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Created Date */}
                              <td style={{ fontSize: 12, color: "#64748b" }}>
                                {admin.createdAt
                                  ? new Date(admin.createdAt).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Initial"}
                              </td>

                              {/* Actions Column */}
                              <td style={{ textAlign: "right" }}>
                                {isMain ? (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "#94a3b8",
                                      fontStyle: "italic",
                                      padding: "4px 8px",
                                    }}
                                  >
                                    Protected (Sole Owner)
                                  </span>
                                ) : (
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        setSelectedAdminForReset(admin);
                                        setNewPasswordInput(generateStrongPassword());
                                        setShowResetModal(true);
                                      }}
                                      className="mz-admin-btn-secondary"
                                      style={{ padding: "4px 8px", fontSize: 11 }}
                                      title="Reset or edit administrator password"
                                    >
                                      <LuKeyRound style={{ width: 12, height: 12 }} />
                                      <span>Password</span>
                                    </button>

                                    <button
                                      onClick={() => handleToggleAdminStatus(admin)}
                                      className="mz-admin-btn-secondary"
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: 11,
                                        color: admin.isSuspended ? "#16a34a" : "#dc2626",
                                      }}
                                      title={admin.isSuspended ? "Re-activate admin" : "Suspend admin"}
                                    >
                                      {admin.isSuspended ? (
                                        <>
                                          <LuUserCheck style={{ width: 12, height: 12 }} />
                                          <span>Activate</span>
                                        </>
                                      ) : (
                                        <>
                                          <LuUserX style={{ width: 12, height: 12 }} />
                                          <span>Suspend</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={() => handleRemoveAdmin(admin)}
                                      style={{
                                        padding: "4px 6px",
                                        border: "none",
                                        background: "transparent",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        borderRadius: 4,
                                      }}
                                      title="Revoke Admin Access"
                                    >
                                      <LuTrash2 style={{ width: 14, height: 14 }} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 2: PLATFORM CONTROLS ────────────────── */}
      {activeTab === "controls" && (
        <div className="mz-admin-card">
          <div className="mz-admin-card-header">
            <h3 className="mz-admin-card-title">
              <LuSlidersHorizontal style={{ width: 18, height: 18, color: "#6366f1" }} />
              <span>Operational Platform Toggles</span>
            </h3>
            <span className="mz-admin-badge-purple">Real-time Platform Sync</span>
          </div>

          <div className="mz-admin-grid-2">
            {/* Proctoring Sensitivity */}
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <label style={{ fontWeight: 700, color: "#0f172a", fontSize: 13, display: "block" }}>
                Proctoring Sensitivity
              </label>
              <p style={{ margin: "2px 0 10px", fontSize: 11.5, color: "#64748b" }}>
                Controls violation threshold for tab switching, fullscreen exit, and camera occlusions
              </p>
              <select
                value={settings.proctoringSensitivity}
                onChange={(e) => setSettings({ ...settings, proctoringSensitivity: e.target.value })}
                className="mz-admin-select"
                style={{ width: "100%" }}
              >
                <option value="strict">Strict (Immediate Flagging, 3 Warnings)</option>
                <option value="standard">Standard (5 Recovery Chances)</option>
                <option value="lenient">Lenient (Development / Practice Mode)</option>
              </select>
            </div>

            {/* Email Notifications Toggle */}
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
                    Transactional Email Notifications
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                    Dispatch OTPs, score revisions, and admin credentials via Gmail SMTP
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotificationsEnabled}
                  onChange={(e) => setSettings({ ...settings, emailNotificationsEnabled: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "#6366f1", cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", borderTop: "1px dashed #e2e8f0", paddingTop: 10 }}>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  className="mz-admin-btn-secondary"
                  style={{
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: sendingTestEmail ? "not-allowed" : "pointer",
                    opacity: sendingTestEmail ? 0.7 : 1,
                  }}
                >
                  {sendingTestEmail ? "Sending Test Email..." : "Send Test Email"}
                </button>
              </div>
            </div>

            {/* Auto-Record Assessments Toggle */}
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
                  Auto-Record Proctored Examinations
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                  Record candidate screen and audio stream with disclosed examination consent
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRecordAssessments}
                onChange={(e) => setSettings({ ...settings, autoRecordAssessments: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#6366f1", cursor: "pointer" }}
              />
            </div>

            {/* Public User Registration Toggle */}
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
                  Allow Student Registration
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                  Permit new student accounts to sign up on MasteryZone platform
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowedRegistration}
                onChange={(e) => setSettings({ ...settings, allowedRegistration: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#6366f1", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── TAB 3: IMMUTABLE AUDIT TRAIL ────────────────── */}
      {activeTab === "audit" && (
        <div className="mz-admin-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Administrative Security Audit Log
              </h3>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Immutable ledger of all administrator actions, credential changes, and score updates
              </span>
            </div>
            <span className="mz-admin-badge-purple">Tamper Proof Ledger</span>
          </div>

          <div className="mz-admin-table-wrap">
            <table className="mz-admin-table">
              <thead>
                <tr>
                  <th>Action Identifier</th>
                  <th>Admin Identity</th>
                  <th>Action Details / Target</th>
                  <th style={{ textAlign: "right" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                      No administrative actions recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, i) => (
                    <tr key={log._id || i}>
                      <td>
                        <span className="mz-admin-badge-purple" style={{ fontSize: 11 }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#334155" }}>
                        {log.adminId?.email || MAIN_ADMIN_EMAIL}
                      </td>
                      <td style={{ color: "#64748b", fontSize: 12.5 }}>
                        {log.note || "Platform administration event"}
                      </td>
                      <td style={{ textAlign: "right", color: "#64748b", fontSize: 12 }}>
                        {new Date(log.timestamp).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: ADD SECONDARY ADMINISTRATOR ────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 540,
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LuUserPlus style={{ width: 18, height: 18 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                  Add Secondary Administrator
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Administrator Email *
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="admin.candidate@masteryzone.com"
                  className="mz-admin-input"
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="mz-admin-input"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                    Initial Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, initialPassword: generateStrongPassword() })}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  value={addForm.initialPassword}
                  onChange={(e) => setAddForm({ ...addForm, initialPassword: e.target.value })}
                  placeholder="Temporary login password"
                  className="mz-admin-input"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                  Assign Operational Permissions
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    background: "#f8fafc",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {AVAILABLE_PERMISSIONS.map((p) => {
                    const checked = addForm.adminPermissions.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAddForm({ ...addForm, adminPermissions: [...addForm.adminPermissions, p.id] });
                            } else {
                              setAddForm({
                                ...addForm,
                                adminPermissions: addForm.adminPermissions.filter((id) => id !== p.id),
                              });
                            }
                          }}
                          style={{ accentColor: "#6366f1" }}
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={addForm.requirePasswordChange}
                    onChange={(e) => setAddForm({ ...addForm, requirePasswordChange: e.target.checked })}
                    style={{ accentColor: "#6366f1" }}
                  />
                  <span>Require password change upon first administrator login</span>
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="mz-admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="mz-admin-btn-primary"
                >
                  {creatingAdmin ? (
                    <>
                      <LuRefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
                      <span>Dispatching Credentials...</span>
                    </>
                  ) : (
                    <>
                      <LuMail style={{ width: 14, height: 14 }} />
                      <span>Create & Dispatch Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: RESET ADMIN PASSWORD ────────────────── */}
      {showResetModal && selectedAdminForReset && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#fef3c7",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LuKeyRound style={{ width: 18, height: 18 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                  Reset Administrator Password
                </h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} style={{ padding: 24 }}>
              <div
                style={{
                  background: "#f1f5f9",
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: 12.5,
                  color: "#334155",
                }}
              >
                Target Administrator: <strong>{selectedAdminForReset.fullName || selectedAdminForReset.email}</strong>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>{selectedAdminForReset.email}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                    New Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(generateStrongPassword())}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="mz-admin-input"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="mz-admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="mz-admin-btn-primary"
                >
                  {resettingPassword ? (
                    <>
                      <LuRefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <LuSave style={{ width: 14, height: 14 }} />
                      <span>Update Password & Notify</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

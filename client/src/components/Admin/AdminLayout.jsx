import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import "./Admin.css";
import AdminNotificationDropdown from "./AdminNotificationDropdown.jsx";
import {
  LuLayoutGrid,
  LuUsers,
  LuActivity,
  LuTrendingUp,
  LuCode,
  LuFileText,
  LuShield,
  LuChartBar,
  LuVideo,
  LuDatabase,
  LuSettings,
  LuSearch,
  LuChevronDown,
  LuLogOut,
  LuExternalLink,
  LuMenu,
  LuX,
  LuGraduationCap,
  LuLifeBuoy,
} from "react-icons/lu";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LuLayoutGrid, path: "/admin/overview" },
  { id: "users", label: "Users", icon: LuUsers, path: "/admin/users" },
  { id: "live-activity", label: "Live Activity", icon: LuActivity, path: "/admin/live-activity" },
  { id: "learning-analytics", label: "Learning Analytics", icon: LuTrendingUp, path: "/admin/learning-analytics" },
  { id: "coding-analytics", label: "Coding Analytics", icon: LuCode, path: "/admin/coding-analytics" },
  { id: "assessments", label: "Assessments", icon: LuFileText, path: "/admin/assessments" },
  { id: "proctoring", label: "Proctoring", icon: LuShield, path: "/admin/proctoring" },
  { id: "reports", label: "Reports", icon: LuChartBar, path: "/admin/reports" },
  { id: "recordings", label: "Recordings", icon: LuVideo, path: "/admin/recordings" },
  { id: "storage", label: "Storage", icon: LuDatabase, path: "/admin/storage" },
  { id: "support", label: "Help & Support", icon: LuLifeBuoy, path: "/admin/help" },
  { id: "settings", label: "Settings", icon: LuSettings, path: "/admin/settings" },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const isMainAdmin =
    adminUser?.email?.toLowerCase().trim() === "yashashyashash1@gmail.com" ||
    adminUser?.isMainAdmin === true ||
    adminUser?.role === "SUPER_ADMIN";

  // Filter navigation items for secondary admins based on granted permissions
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (isMainAdmin) return true;
    if (item.id === "overview") return true;
    // Settings tab is exclusive to Main Admin
    if (item.id === "settings") return false;
    const permissions = adminUser?.adminPermissions || [];
    return permissions.includes("*") || permissions.includes(item.id);
  });

  // Handle Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("admin-global-search");
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="mz-admin-portal">
      {/* ────────────────── DESKTOP & TABLET SIDEBAR ────────────────── */}
      <aside className={`mz-admin-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        {/* Top: Logo & Platform Identity */}
        <div className="mz-admin-sidebar-top">
          <div className="mz-admin-logo-area">
            <Link to="/admin/overview" className="flex items-center gap-3 group" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <div className="mz-admin-logo-icon">
                <LuGraduationCap style={{ width: 22, height: 22 }} />
              </div>
              <div className="mz-admin-logo-text">
                <span className="mz-admin-logo-title">MasteryZone</span>
                <span className="mz-admin-logo-badge">ADMIN PANEL</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links List */}
          <nav className="mz-admin-nav-list">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.id === "overview" && (location.pathname === "/admin" || location.pathname === "/admin/"));

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`mz-admin-nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon className="mz-admin-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Clean Version & Copyright */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
          <span>© 2026 MasteryZone</span>
          <span style={{ fontSize: 10, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 700, color: "#64748b" }}>Admin v2.4</span>
        </div>
      </aside>

      {/* ────────────────── MAIN CONTENT WRAPPER ────────────────── */}
      <div className="mz-admin-main-wrap">
        {/* Top Header Bar */}
        <header className="mz-admin-header">
          {/* Mobile Menu Toggle & Global Search */}
          <div className="mz-admin-search-wrap">
            <LuSearch className="mz-admin-search-icon" />
            <input
              id="admin-global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, courses, or reports... (Ctrl + K)"
              className="mz-admin-search-input"
            />
          </div>

          {/* Right: Notifications & Admin Profile */}
          <div className="mz-admin-header-right">
            {/* Real-Time Admin Notification Center */}
            <AdminNotificationDropdown />

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="mz-admin-profile-btn"
              >
                <div className="mz-admin-avatar">
                  A
                </div>
                <span className="mz-admin-name">Admin</span>
                <LuChevronDown style={{ width: 14, height: 14, color: '#94a3b8' }} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 8,
                    width: 240,
                    background: '#ffffff',
                    borderRadius: 14,
                    boxShadow: '0 20px 30px -10px rgba(0,0,0,0.18), 0 10px 15px -3px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    padding: 8,
                    zIndex: 9999,
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: 13, color: '#0f172a' }}>{adminUser.fullName || (isMainAdmin ? "MasteryZone Main Admin" : "Administrator")}</p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{adminUser.email || "yashashyashash1@gmail.com"}</p>
                    <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 6px', background: isMainAdmin ? '#ede9fe' : '#e0f2fe', color: isMainAdmin ? '#6366f1' : '#0284c7', fontSize: 10, fontWeight: 700, borderRadius: 4 }}>
                      {isMainAdmin ? "SUPER_ADMIN (MAIN)" : "SECONDARY ADMIN"}
                    </span>
                  </div>

                  <div style={{ padding: '4px 0' }}>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/home");
                      }}
                      style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <LuExternalLink style={{ width: 14, height: 14, color: '#94a3b8' }} />
                      <span>Switch to Student View</span>
                    </button>
                    {isMainAdmin && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate("/admin/settings");
                        }}
                        style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <LuSettings style={{ width: 14, height: 14, color: '#94a3b8' }} />
                        <span>Admin Settings</span>
                      </button>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 4 }}>
                    <button
                      onClick={handleLogout}
                      style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <LuLogOut style={{ width: 14, height: 14, color: '#dc2626' }} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <main className="mz-admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

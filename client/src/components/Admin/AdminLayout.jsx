import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import "./Admin.css";
import AdminNotificationDropdown from "./AdminNotificationDropdown.jsx";
import { performGlobalLogout } from "../../utils/sessionAuth.js";
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
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

  const matchingNavItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return visibleNavItems.filter((item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
  }, [searchQuery, visibleNavItems]);

  // Handle Ctrl+K / Cmd+K global shortcut and outside click
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
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    performGlobalLogout();
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
          <div className="mz-admin-search-wrap" ref={searchContainerRef} style={{ position: "relative" }}>
            <LuSearch className="mz-admin-search-icon" />
            <input
              id="admin-global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowSearchDropdown(false);
                if (e.key === "Enter" && searchQuery.trim()) {
                  setShowSearchDropdown(false);
                  navigate(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="Search..."
              className="mz-admin-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchDropdown(false);
                }}
                style={{
                  position: "absolute",
                  right: 12,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LuX size={14} />
              </button>
            )}

            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div className="mz-global-search-dropdown" style={{ minWidth: 360 }}>
                <div className="mz-global-search-header">
                  <span>Results for &ldquo;{searchQuery.trim()}&rdquo;</span>
                  <span className="mz-global-search-esc">Press ESC to dismiss</span>
                </div>

                {matchingNavItems.length > 0 && (
                  <div className="mz-global-search-group">
                    <div className="mz-global-search-group-title">
                      Admin Modules ({matchingNavItems.length})
                    </div>
                    {matchingNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="mz-global-search-item"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            navigate(item.path);
                          }}
                        >
                          <span className="mz-global-search-item-icon">
                            <Icon size={16} />
                          </span>
                          <div className="mz-global-search-item-content">
                            <div className="mz-global-search-item-title">{item.label}</div>
                            <div className="mz-global-search-item-sub">Go to {item.label} page</div>
                          </div>
                          <span className="mz-global-search-item-action">Open →</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mz-global-search-group">
                  <div className="mz-global-search-group-title">Deep Search</div>
                  <div
                    className="mz-global-search-item"
                    onClick={() => {
                      setShowSearchDropdown(false);
                      navigate(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                  >
                    <span className="mz-global-search-item-icon">👥</span>
                    <div className="mz-global-search-item-content">
                      <div className="mz-global-search-item-title">Search Users</div>
                      <div className="mz-global-search-item-sub">Find &ldquo;{searchQuery.trim()}&rdquo; in user directory</div>
                    </div>
                    <span className="mz-global-search-item-action">Search Users →</span>
                  </div>

                  <div
                    className="mz-global-search-item"
                    onClick={() => {
                      setShowSearchDropdown(false);
                      navigate(`/admin/assessments?search=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                  >
                    <span className="mz-global-search-item-icon">📝</span>
                    <div className="mz-global-search-item-content">
                      <div className="mz-global-search-item-title">Search Assessments</div>
                      <div className="mz-global-search-item-sub">Find submissions & exams for &ldquo;{searchQuery.trim()}&rdquo;</div>
                    </div>
                    <span className="mz-global-search-item-action">Search Assessments →</span>
                  </div>

                  <div
                    className="mz-global-search-item"
                    onClick={() => {
                      setShowSearchDropdown(false);
                      navigate(`/admin/reports?search=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                  >
                    <span className="mz-global-search-item-icon">📊</span>
                    <div className="mz-global-search-item-content">
                      <div className="mz-global-search-item-title">Search Reports</div>
                      <div className="mz-global-search-item-sub">Find evaluation reports for &ldquo;{searchQuery.trim()}&rdquo;</div>
                    </div>
                    <span className="mz-global-search-item-action">Search Reports →</span>
                  </div>
                </div>
              </div>
            )}
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
                  {adminUser?.fullName ? adminUser.fullName.charAt(0).toUpperCase() : "A"}
                </div>
                <span className="mz-admin-name">{adminUser?.fullName || "Admin"}</span>
                <LuChevronDown className={`mz-c-user-chevron ${profileDropdownOpen ? "open" : ""}`} style={{ width: 14, height: 14 }} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  className="mz-c-user-dropdown"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                  style={{ top: "calc(100% + 8px)", right: 0 }}
                >
                  <div className="mz-c-dropdown-header-card">
                    <div className="mz-c-dropdown-avatar-wrap">
                      <div className="mz-c-dropdown-avatar" style={{ background: '#6366f1' }}>
                        {adminUser?.fullName ? adminUser.fullName.charAt(0).toUpperCase() : "A"}
                      </div>
                      <span className="mz-c-dropdown-status-dot" title="Active session" />
                    </div>
                    <div className="mz-c-dropdown-header-info">
                      <div className="mz-c-dropdown-name-row">
                        <strong className="mz-c-dropdown-name" title={adminUser?.fullName || "Admin"}>
                          {adminUser?.fullName || (isMainAdmin ? "Main Admin" : "Administrator")}
                        </strong>
                        <span className="mz-c-role-badge">
                          {isMainAdmin ? "Super Admin" : "Admin"}
                        </span>
                      </div>
                      <span className="mz-c-dropdown-sub" title={adminUser?.email || "yashashyashash1@gmail.com"}>
                        {adminUser?.email || "yashashyashash1@gmail.com"}
                      </span>
                    </div>
                  </div>

                  <div className="mz-c-dropdown-divider" />

                  <div
                    className="mz-c-dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate("/home");
                    }}
                  >
                    <span className="mz-c-dropdown-item-icon">
                      <LuExternalLink size={16} />
                    </span>
                    <div className="mz-c-dropdown-item-content">
                      <span className="mz-c-dropdown-item-title">Switch to Student View</span>
                      <span className="mz-c-dropdown-item-desc">Return to learner dashboard</span>
                    </div>
                  </div>

                  {isMainAdmin && (
                    <div
                      className="mz-c-dropdown-item"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/admin/settings");
                      }}
                    >
                      <span className="mz-c-dropdown-item-icon">
                        <LuSettings size={16} />
                      </span>
                      <div className="mz-c-dropdown-item-content">
                        <span className="mz-c-dropdown-item-title">Admin Settings</span>
                        <span className="mz-c-dropdown-item-desc">System configs & moderation</span>
                      </div>
                    </div>
                  )}

                  <div className="mz-c-dropdown-divider" />

                  <div
                    className="mz-c-dropdown-item mz-c-item-danger"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
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

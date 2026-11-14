import React, { useState, useEffect, useRef, useMemo } from "react";
import "./Admin.css";
import {
  LuUsers,
  LuUser,
  LuSearch,
  LuFilter,
  LuChevronLeft,
  LuChevronRight,
  LuShieldAlert,
  LuShieldCheck,
  LuEye,
  LuSmartphone,
  LuClock,
  LuFlame,
  LuKey,
  LuTrash2,
  LuAward,
} from "react-icons/lu";
import { toast } from "react-toastify";
import AdminUserDetailModal from "./AdminUserDetailModal.jsx";
import AdminPagination from "./AdminPagination.jsx";
import { deduplicatedFetch } from "../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const [status, setStatus] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filteredUsersList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return users.filter(
      (u) =>
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u._id && u._id.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [search, users]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const queryObj = {
        search,
        status,
        page,
        limit: 10,
      };
      if (roleFilter !== "all") {
        queryObj.role = roleFilter;
      }
      const query = new URLSearchParams(queryObj);

      const res = await deduplicatedFetch(`${API_BASE}/api/admin/users?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cacheTtlMs: 3000,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const userList = json.data?.users || json.users || [];
          const pag = json.data?.pagination || json.pagination || { total: userList.length, totalPages: Math.ceil(userList.length / 10) || 1, limit: 10, page: 1 };
          setUsers(userList);
          setPagination(pag);
        }
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load user directory");
    } finally {
      setLoading(false);
    }
  };

  const prevFiltersRef = useRef({ search, status, roleFilter });
  useEffect(() => {
    if (
      prevFiltersRef.current.search !== search ||
      prevFiltersRef.current.status !== status ||
      prevFiltersRef.current.roleFilter !== roleFilter
    ) {
      prevFiltersRef.current = { search, status, roleFilter };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, status, search, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenUserDetail = async (userId) => {
    try {
      setLoadingDetail(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSelectedUserDetail(json.data || json);
        }
      }
    } catch (err) {
      toast.error("Failed to load user profile");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = async (userId, willSuspend) => {
    const reason = willSuspend
      ? window.prompt("Reason for suspending this account:", "Violation of platform policies")
      : "";

    if (willSuspend && reason === null) return; // user cancelled

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isSuspended: willSuspend,
          reason,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        // Refresh users list
        fetchUsers();
        // Update open modal if relevant
        if (selectedUserDetail && (selectedUserDetail.user?._id === userId || selectedUserDetail._id === userId)) {
          setSelectedUserDetail((prev) => ({
            ...prev,
            user: { ...(prev.user || prev), isSuspended: willSuspend, suspendedReason: reason },
          }));
        }
      } else {
        toast.error(json.message || "Failed to update account status");
      }
    } catch (err) {
      toast.error("Error updating account status");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchUsers();
        if (selectedUserDetail && (selectedUserDetail.user?._id === userId || selectedUserDetail._id === userId)) {
          setSelectedUserDetail((prev) => ({
            ...prev,
            user: { ...(prev.user || prev), role: newRole },
          }));
        }
      } else {
        toast.error(json.message || "Failed to update role");
      }
    } catch (err) {
      toast.error("Error updating user role");
    }
  };

  const handleResetPassword = async (userId, directPassword = null) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(directPassword ? { newPassword: directPassword } : { sendEmail: true }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        return true;
      } else {
        toast.error(json.message || "Failed to process password reset");
        return false;
      }
    } catch (err) {
      toast.error("Error resetting user password");
      return false;
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    const confirmed = window.confirm(
      `Are you absolutely sure you want to permanently delete the account for ${userEmail}? This will wipe their records permanently.`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setSelectedUserDetail(null);
        fetchUsers();
      } else {
        toast.error(json.message || "Failed to delete user account");
      }
    } catch (err) {
      toast.error("Error deleting user account");
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "Super Admin", className: "mz-admin-badge-purple" };
      case "admin":
        return { label: "Admin", className: "mz-admin-badge-blue" };
      case "mentor":
        return { label: "Mentor", className: "mz-admin-badge-green" };
      case "instructor":
        return { label: "Instructor", className: "mz-admin-badge-purple" };
      case "student":
      case "user":
      default:
        return { label: "Student", className: "mz-admin-badge-gray" };
    }
  };

  const activeCount = users.filter((u) => !u.isSuspended).length;
  const suspendedCount = users.filter((u) => u.isSuspended).length;
  const adminCount = users.filter((u) => u.role === "admin" || u.role === "SUPER_ADMIN").length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="mz-admin-page-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuUsers style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">User Management</h1>
            <p className="mz-admin-page-subtitle">View, search, audit, and manage all registered student accounts on MasteryZone.</p>
          </div>
        </div>

        <div className="mz-admin-time-pill" style={{ cursor: 'default' }}>
          <span>Total Accounts: <strong>{pagination.total}</strong></span>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="mz-admin-kpi-summary-grid">
        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-blue-bg)", color: "#2563eb" }}>
            <LuUsers style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Total Accounts</span>
            <span className="mz-admin-stat-value">{pagination.total || users.length}</span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-green-bg)", color: "#059669" }}>
            <LuShieldCheck style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Active Users</span>
            <span className="mz-admin-stat-value">{status === "active" ? pagination.total : activeCount}</span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-red-bg)", color: "#dc2626" }}>
            <LuShieldAlert style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Suspended</span>
            <span className="mz-admin-stat-value">{status === "suspended" ? pagination.total : suspendedCount}</span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#7c3aed" }}>
            <LuAward style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Staff / Admins</span>
            <span className="mz-admin-stat-value">{adminCount}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="mz-admin-search-bar">
        <form
          ref={searchContainerRef}
          onSubmit={handleSearchSubmit}
          className="mz-admin-search-box-input"
          style={{ position: 'relative' }}
        >
          <LuSearch style={{ position: 'absolute', left: 12, top: 11, width: 16, height: 16, color: 'var(--mz-text-subtle)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (search.trim()) setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowDropdown(false);
            }}
            placeholder="Search..."
          />
          {showDropdown && search.trim().length > 0 && (
            <div className="mz-global-search-dropdown">
              <div className="mz-global-search-header">
                <span>Users matching &ldquo;{search.trim()}&rdquo;</span>
                <span className="mz-global-search-esc"><kbd>ESC</kbd> to dismiss</span>
              </div>
              {filteredUsersList.length === 0 ? (
                <div className="mz-global-search-empty">
                  <p>No loaded users match &ldquo;{search}&rdquo;</p>
                  <small>Press Enter to search entire database</small>
                </div>
              ) : (
                <div className="mz-global-search-group">
                  {filteredUsersList.map((u) => (
                    <div
                      key={u._id}
                      className="mz-global-search-item"
                      onClick={() => {
                        setShowDropdown(false);
                        handleOpenUserDetail(u._id);
                      }}
                    >
                      <span className="mz-global-search-item-icon mz-icon-track">
                        <LuUser size={15} />
                      </span>
                      <div className="mz-global-search-item-content">
                        <div className="mz-global-search-item-title">{u.fullName || u.username || "User"}</div>
                        <div className="mz-global-search-item-sub">{u.email}</div>
                      </div>
                      <span className="mz-global-search-item-action">View Profile →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="mz-admin-role-select"
            style={{ height: 38, padding: '0 12px' }}
            title="Filter by user role"
          >
            <option value="all">All Roles</option>
            <option value="student">Students / Learners</option>
            <option value="mentor">Mentors</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Administrators</option>
          </select>

          <div className="mz-admin-filter-tabs">
            {[
              { id: "all", label: "All Status" },
              { id: "active", label: "Active" },
              { id: "suspended", label: "Suspended" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setStatus(f.id);
                  setPage(1);
                }}
                className={`mz-admin-tab-btn ${status === f.id ? "active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="mz-admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="mz-admin-table-wrap">
          <table className="mz-admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Last Active</th>
                <th>Submissions</th>
                <th>Assessments</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: 36, textAlign: 'center', color: 'var(--mz-text-subtle)' }}>
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: 36, textAlign: 'center', color: 'var(--mz-text-subtle)' }}>
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    {/* User Identity */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="mz-admin-user-avatar-sm">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName || u.username} />
                          ) : (
                            (u.fullName ? u.fullName[0] : u.username[0]).toUpperCase()
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--mz-text-primary)' }}>{u.fullName || u.username}</span>
                          <span style={{ fontSize: 11, color: 'var(--mz-text-subtle)' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td>
                      {(() => {
                        const rb = getRoleBadgeStyle(u.role);
                        return (
                          <span
                            className={rb.className}
                            style={{ textTransform: "capitalize", fontSize: 11, fontWeight: 700 }}
                          >
                            {rb.label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={u.isSuspended ? "mz-admin-badge-suspended" : "mz-admin-badge-active"}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td style={{ color: 'var(--mz-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Last Active */}
                    <td style={{ color: 'var(--mz-text-muted)', whiteSpace: 'nowrap' }}>
                      <div>
                        <span>{new Date(u.lastActiveDate || u.createdAt).toLocaleDateString()}</span>
                        <p style={{ fontSize: 10, color: 'var(--mz-text-subtle)', margin: '2px 0 0' }}>
                          {u.lastLoginDevice || "Desktop"}
                        </p>
                      </div>
                    </td>

                    {/* Submissions */}
                    <td>
                      <strong style={{ color: 'var(--mz-text-primary)' }}>{u.submissionsCount || 0}</strong>
                    </td>

                    {/* Assessments */}
                    <td>
                      <strong style={{ color: 'var(--mz-text-primary)' }}>{u.assessmentsCount || 0}</strong>
                    </td>

                    {/* Action buttons */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleOpenUserDetail(u._id)}
                          className="mz-admin-btn-action"
                          title="View Profile"
                        >
                          <LuEye style={{ width: 14, height: 14 }} />
                          <span>Profile</span>
                        </button>
                        {u.role !== "SUPER_ADMIN" && (
                          <>
                            <button
                              onClick={() => {
                                const temp = window.prompt(`Enter temporary password for ${u.email} (or leave blank to send reset email):`, "");
                                if (temp === null) return;
                                handleResetPassword(u._id, temp.trim() || null);
                              }}
                              className="mz-admin-btn-action"
                              title="Reset Password"
                            >
                              <LuKey style={{ width: 13, height: 13 }} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u._id, !u.isSuspended)}
                              className={u.isSuspended ? "mz-admin-btn-restore" : "mz-admin-btn-suspend"}
                            >
                              {u.isSuspended ? "Restore" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id, u.email)}
                              className="mz-admin-btn-suspend"
                              style={{ padding: "6px 8px", background: "transparent", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
                              title="Permanently Delete User"
                            >
                              <LuTrash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized 10-per-page Pagination Footer */}
        <AdminPagination
          page={page}
          totalPages={pagination?.totalPages || pagination?.pages || 1}
          totalRecords={pagination?.total || 0}
          limit={10}
          onPageChange={(p) => setPage(p)}
          itemName="registered accounts"
        />
      </div>

      {/* Individual User Profile Modal */}
      {selectedUserDetail && (
        <AdminUserDetailModal
          userDetail={selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
          onToggleStatus={handleToggleStatus}
          onRoleChange={handleRoleChange}
          onResetPassword={handleResetPassword}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default AdminUsers;

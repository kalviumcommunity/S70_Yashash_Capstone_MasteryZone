import React, { useState, useEffect, useRef, useMemo } from "react";
import "./Admin.css";
import {
  LuUsers,
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
} from "react-icons/lu";
import { toast } from "react-toastify";
import AdminUserDetailModal from "./AdminUserDetailModal.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 15 });
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
      const query = new URLSearchParams({
        search,
        status,
        page,
        limit: 15,
      });

      const res = await fetch(`${API_BASE}/api/admin/users?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const userList = json.data?.users || json.users || [];
          const pag = json.data?.pagination || json.pagination || { total: userList.length, pages: 1, limit: 15, page: 1 };
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

  useEffect(() => {
    fetchUsers();
  }, [page, status]);

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
        if (selectedUserDetail && selectedUserDetail.user._id === userId) {
          setSelectedUserDetail((prev) => ({
            ...prev,
            user: { ...prev.user, isSuspended: willSuspend, suspendedReason: reason },
          }));
        }
      } else {
        toast.error(json.message || "Failed to update account status");
      }
    } catch (err) {
      toast.error("Error updating account status");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

      {/* Search and Filters Bar */}
      <div className="mz-admin-search-bar">
        <form
          ref={searchContainerRef}
          onSubmit={handleSearchSubmit}
          className="mz-admin-search-box-input"
          style={{ position: 'relative' }}
        >
          <LuSearch style={{ position: 'absolute', left: 12, top: 11, width: 16, height: 16, color: '#94a3b8' }} />
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
            <div className="mz-global-search-dropdown" style={{ minWidth: 320, left: 0 }}>
              <div className="mz-global-search-header">
                <span>Users matching &ldquo;{search.trim()}&rdquo;</span>
                <span className="mz-global-search-esc">Press ESC</span>
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
                      <span className="mz-global-search-item-icon">👤</span>
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

        <div className="mz-admin-filter-tabs">
          {[
            { id: "all", label: "All Users" },
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

      {/* Users Table */}
      <div className="mz-admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="mz-admin-table-wrap">
          <table className="mz-admin-table">
            <thead>
              <tr>
                <th>User</th>
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
                  <td colSpan="7" style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
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
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{u.fullName || u.username}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={u.isSuspended ? "mz-admin-badge-suspended" : "mz-admin-badge-active"}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Last Active */}
                    <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                      <div>
                        <span>{new Date(u.lastActiveDate || u.createdAt).toLocaleDateString()}</span>
                        <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>
                          {u.lastLoginDevice || "Desktop"}
                        </p>
                      </div>
                    </td>

                    {/* Submissions */}
                    <td>
                      <strong style={{ color: '#0f172a' }}>{u.submissionsCount || 0}</strong>
                    </td>

                    {/* Assessments */}
                    <td>
                      <strong style={{ color: '#0f172a' }}>{u.assessmentsCount || 0}</strong>
                    </td>

                    {/* Action buttons */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleOpenUserDetail(u._id)}
                          className="mz-admin-btn-action"
                        >
                          <LuEye style={{ width: 14, height: 14 }} />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u._id, !u.isSuspended)}
                          className={u.isSuspended ? "mz-admin-btn-restore" : "mz-admin-btn-suspend"}
                        >
                          {u.isSuspended ? "Restore" : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="mz-admin-pagination">
          <span>
            Showing page {pagination?.page || 1} of {pagination?.pages || 1} ({pagination?.total || 0} total accounts)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="mz-admin-page-nav-btn"
            >
              <LuChevronLeft style={{ width: 14, height: 14 }} />
            </button>
            <span style={{ fontWeight: 800, color: '#0f172a', padding: '0 4px' }}>{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination?.pages || 1, p + 1))}
              disabled={page >= (pagination?.pages || 1)}
              className="mz-admin-page-nav-btn"
            >
              <LuChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Individual User Profile Modal */}
      {selectedUserDetail && (
        <AdminUserDetailModal
          userDetail={selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default AdminUsers;

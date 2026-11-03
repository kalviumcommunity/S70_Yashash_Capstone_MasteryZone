import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./profile.css";
import NotificationBell from "./NotificationBell.jsx";
import IndiaLocationPicker from "./IndiaLocationPicker";
import logoIcon from "../assets/logo_icon_transparent.png";
import { getExploredTracks, isTrackExplored } from "../utils/trackExploration";

import {
  LuHouse,
  LuTarget,
  LuChartColumn,
  LuUser,
  LuLogOut,
  LuSettings,
  LuSearch,
  LuBell,
  LuChevronDown,
  LuChevronRight,
  LuCheck,
  LuX,
  LuPencil,
  LuCamera,
  LuUpload,
  LuTrash2,
  LuEye,
  LuMapPin,
  LuCalendar,
  LuBriefcase,
  LuFileText,
  LuAtSign,
  LuMail,
  LuBadgeCheck,
  LuTrendingUp,
  LuFlame,
  LuClock,
  LuTrophy,
  LuCircleCheck,
  LuCodeXml,
  LuSprout,
  LuSparkles,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Vector Badge Component for 100% crisp logo badges across tracks
const TrackBadge = ({ type, className = "" }) => {
  switch (type) {
    case "CODING":
      return (
        <div className={`mz-track-badge mz-track-coding ${className}`} title="Coding Track">
          <svg className="mz-track-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
      );
    case "LANGUAGE":
      return (
        <div className={`mz-track-badge mz-track-language ${className}`} title="Language Track">
          <span className="mz-track-lang-glyph">文A</span>
        </div>
      );
    case "VEHICLES":
    case "VECHILES":
      return (
        <div className={`mz-track-badge mz-track-vehicles ${className}`} title="Vehicles Track">
          <svg className="mz-track-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.9 2 11.2V16c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        </div>
      );
    case "FITNESS":
    case "GYM":
      return (
        <div className={`mz-track-badge mz-track-fitness ${className}`} title="Gym & Fitness Track">
          <svg className="mz-track-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6.5 6.5 11 11" />
            <path d="m21 21-1-1" />
            <path d="m3 3 1 1" />
            <path d="m18 22 4-4" />
            <path d="m2 6 4-4" />
            <path d="m3 10 7-7" />
            <path d="m14 21 7-7" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

const ALL_LEARNING_TRACKS = [
  {
    key: "CODING",
    title: "Coding",
    subtitle: "Python, JavaScript, Web Dev",
    route: "/coding",
    matchKeys: ["CODING", "Coding", "coding"],
  },
  {
    key: "LANGUAGE",
    title: "Language",
    subtitle: "English, Spanish, French",
    route: "/language",
    matchKeys: ["LANGUAGE", "Language", "language"],
  },
  {
    key: "VEHICLES",
    title: "Vehicles",
    subtitle: "Automotive, Electric Vehicles",
    route: "/driving",
    matchKeys: ["VEHICLES", "VECHILES", "Vehicles", "vehicles", "Driving", "driving"],
  },
  {
    key: "FITNESS",
    title: "Gym & Fitness",
    subtitle: "Strength, Nutrition, Wellness",
    route: "/fitness",
    matchKeys: ["FITNESS", "GYM", "Fitness", "fitness", "Gym", "gym"],
  },
];

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Real Database User & Stats State (Zero Fake Data)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [stats, setStats] = useState({
    streak: 1,
    learningHours: 0,
    achievements: 0,
    completedModules: 0,
    certifications: [],
    solvedChallengesCount: 0,
    totalCodingXp: 0,
    challengesSolved: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditFocus, setActiveEditFocus] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    username: "",
    location: "",
    occupation: "",
    bio: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditingLocationInline, setIsEditingLocationInline] = useState(false);

  // Photo Management State
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isPhotoPreviewModalOpen, setIsPhotoPreviewModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDeletePhotoModalOpen, setIsDeletePhotoModalOpen] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch verified user details and calculated real statistics
  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        try {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("mz_user", JSON.stringify(data.user));
          const resolvedName = data.user.fullName || data.user.username || data.user.name || "";
          if (resolvedName) localStorage.setItem("userName", resolvedName);
          if (data.user.email) localStorage.setItem("userEmail", data.user.email);
        } catch {}
        if (data.stats) {
          setStats(data.stats);
        }
        setEditForm({
          fullName: data.user.fullName || "",
          username: data.user.username || "",
          location: data.user.location || "",
          occupation: data.user.occupation || "",
          bio: data.user.bio || "",
        });
      } else {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      toast.error("Network error while loading profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [navigate]);

  // Handle Photo Selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size exceeds 5MB limit. Please choose a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setIsPhotoPreviewModalOpen(true);
    };
  };

  // Upload Photo to Backend
  const handleConfirmPhotoUpload = async () => {
    if (!photoPreview) return;
    setIsUploadingPhoto(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/auth/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: photoPreview }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser((prev) => ({ ...prev, avatarUrl: data.avatarUrl || photoPreview }));
        setIsPhotoPreviewModalOpen(false);
        setPhotoPreview(null);
        toast.success("Profile photo updated successfully!");
        // Synchronize across open views
        window.dispatchEvent(new Event("user_profile_updated"));
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.message || "Failed to update profile photo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while uploading photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Remove Photo
  const handleConfirmPhotoDelete = async () => {
    setIsDeletingPhoto(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/auth/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUser((prev) => ({ ...prev, avatarUrl: null }));
        setIsDeletePhotoModalOpen(false);
        toast.info("Profile photo removed.");
        window.dispatchEvent(new Event("user_profile_updated"));
      } else {
        toast.error("Failed to remove profile photo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while removing photo.");
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  // Open Edit Profile Modal with optional targeted field focus
  const openEditModal = (fieldName = null) => {
    if (user) {
      setEditForm({
        fullName: user.fullName || "",
        username: user.username || "",
        location: user.location || "",
        occupation: user.occupation || "",
        bio: user.bio || "",
      });
    }
    setFormErrors({});
    setActiveEditFocus(fieldName);
    setIsEditModalOpen(true);
  };

  // Save Profile Form
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    const cleanUsername = editForm.username.trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      errors.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      errors.username = "Username can only contain letters, numbers, and underscores.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSavingProfile(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          username: cleanUsername,
          location: editForm.location.trim(),
          occupation: editForm.occupation.trim(),
          bio: editForm.bio.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        try {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("mz_user", JSON.stringify(data.user));
          const resolvedName = data.user.fullName || data.user.username || data.user.name || "";
          if (resolvedName) localStorage.setItem("userName", resolvedName);
          if (data.user.email) localStorage.setItem("userEmail", data.user.email);
        } catch {}
        setIsEditModalOpen(false);
        toast.success("Profile updated successfully!");
        window.dispatchEvent(new Event("user_profile_updated"));
      } else {
        toast.error(data.message || "Failed to save profile changes.");
        if (data.message && data.message.includes("Username")) {
          setFormErrors({ username: data.message });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Direct Inline Location Update with India States & Cities Autocomplete
  const handleInlineLocationUpdate = async (newLocation) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: newLocation,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        try {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("mz_user", JSON.stringify(data.user));
        } catch {}
        setIsEditingLocationInline(false);
        toast.success(`Location updated to ${newLocation}!`);
        window.dispatchEvent(new Event("user_profile_updated"));
      } else {
        toast.error(data.message || "Failed to update location.");
      }
    } catch (err) {
      console.error("Location update error:", err);
      toast.error("Network error while updating location.");
    }
  };

  // Logout confirm
  const handleLogoutConfirm = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.info("Logged out successfully.");
    navigate("/login");
  };

  // Real formatted display name
  const displayName = useMemo(() => {
    if (user?.fullName && user.fullName.trim()) return user.fullName.trim();
    if (user?.name && user.name.trim()) return user.name.trim();
    if (user?.username) {
      return user.username
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    const storedName = localStorage.getItem("userName");
    if (storedName && storedName.trim()) return storedName.trim();
    if (user?.email) return user.email.split("@")[0];
    return "Learner";
  }, [user]);

  // Real formatted join date from database timestamp
  const joinedDateText = useMemo(() => {
    if (!user?.createdAt) return "Joined Recently";
    try {
      const date = new Date(user.createdAt);
      return `Joined ${date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })}`;
    } catch {
      return "Joined Recently";
    }
  }, [user?.createdAt]);

  // Dynamic explored tracks version trigger
  const [exploredVersion, setExploredVersion] = useState(0);

  useEffect(() => {
    const handleTrackExplored = () => {
      setExploredVersion((v) => v + 1);
    };
    window.addEventListener("mz_track_explored", handleTrackExplored);
    return () => window.removeEventListener("mz_track_explored", handleTrackExplored);
  }, []);

  // Genuinely explored tracks (only tracks whose pages the user genuinely visited/explored)
  const exploredTracks = useMemo(() => {
    return getExploredTracks(user, stats);
  }, [user, stats, exploredVersion]);

  // Genuine selected interests array
  const userInterests = useMemo(() => {
    if (!user?.interests || !Array.isArray(user.interests)) return [];
    return user.interests;
  }, [user?.interests]);

  return (
    <div key={location.key} className="mz-profile-layout mz-page-enter">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="mz-sidebar">
        {/* Brand Logo Header */}
        <div className="mz-sidebar-brand" onClick={() => navigate("/home")} title="Mastery Zone Home">
          <img src={logoIcon} alt="Mastery Zone Logo" className="mz-sidebar-brand-icon" />
          <span className="mz-sidebar-brand-text">Mastery Zone</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="mz-sidebar-nav">
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => navigate("/home")}
            title="Home"
          >
            <LuHouse className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Home</span>
          </button>

          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => navigate("/home")}
            title="Select Interests"
          >
            <LuTarget className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Select Interests</span>
          </button>

          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => navigate("/progress")}
            title="Progress"
          >
            <LuChartColumn className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Progress</span>
          </button>

          <button
            type="button"
            className="mz-sidebar-item active"
            title="Profile"
          >
            <LuUser className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Profile</span>
          </button>

          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => setIsSettingsModalOpen(true)}
            title="Settings"
          >
            <LuSettings className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Settings</span>
          </button>

          <button
            type="button"
            className="mz-sidebar-item mz-sidebar-logout"
            onClick={() => setIsLogoutModalOpen(true)}
            title="Log Out"
          >
            <LuLogOut className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Log Out</span>
          </button>
        </nav>
      </aside>

      {/* ================= MAIN WRAPPER ================= */}
      <div className="mz-main-wrapper">
        {/* Top Navbar */}
        <header className="mz-topbar">
          {/* Search Bar */}
          <div className="mz-search-bar-wrap">
            <LuSearch className="mz-search-bar-icon" size={17} />
            <input
              type="text"
              className="mz-search-bar-input"
              placeholder="Search for skills, courses, or anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search skills and courses"
            />
            {searchQuery && (
              <button
                type="button"
                className="mz-search-clear-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <LuX size={14} />
              </button>
            )}
          </div>

          <div className="mz-topbar-right">
            {/* Real-Time Notification Bell */}
            <NotificationBell />

            {/* Profile Dropdown Widget */}
            <div className="mz-profile-widget" ref={dropdownRef}>
              <button
                type="button"
                className="mz-profile-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Profile menu"
              >
                <div className="mz-profile-avatar-circle">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="mz-profile-avatar-img" />
                  ) : (
                    <span className="mz-profile-avatar-fallback">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="mz-profile-name">{displayName}</span>
                <LuChevronDown
                  size={14}
                  className={`mz-chevron ${isDropdownOpen ? "open" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="mz-profile-menu">
                  <div className="mz-menu-header">
                    <strong>{displayName}</strong>
                    <span>{user?.email || "user@masteryzone.com"}</span>
                  </div>
                  <div className="mz-menu-divider" />
                  <button
                    type="button"
                    className="mz-menu-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      openEditModal();
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    className="mz-menu-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    className="mz-menu-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                  >
                    Settings
                  </button>
                  <div className="mz-menu-divider" />
                  <button
                    type="button"
                    className="mz-menu-item text-danger"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handlePhotoSelect}
            />
          </div>
        </header>

        {/* Scrollable Main Profile Content */}
        <main className="mz-profile-content-area">
          <div className="mz-profile-grid">
            {/* ================= LEFT / CENTER COLUMN ================= */}
            <div className="mz-profile-main-col">
              {/* 1. Profile Header Banner Card */}
              <section className="mz-profile-banner-card">
                <div className="mz-banner-left">
                  {/* Avatar with Camera Overlay */}
                  <div className="mz-banner-avatar-wrap">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Profile avatar"
                        className="mz-banner-avatar-img"
                        onClick={() => setIsLightboxOpen(true)}
                        title="Click to view full photo"
                      />
                    ) : (
                      <div className="mz-banner-avatar-fallback">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      className="mz-camera-badge-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Update profile photo"
                      aria-label="Upload photo"
                    >
                      <LuCamera size={14} />
                    </button>
                  </div>

                  {/* Banner User Details */}
                  <div className="mz-banner-details">
                    <div className="mz-banner-name-row">
                      <h1 className="mz-banner-name">{displayName}</h1>
                      <LuBadgeCheck className="mz-verified-badge" size={20} title="Verified Learner" />
                    </div>

                    <p className="mz-banner-email">{user?.email || "email@masteryzone.com"}</p>

                    <div className="mz-banner-meta-row">
                      <span className="mz-meta-item">
                        <LuMapPin size={15} className="mz-meta-icon" />
                        <span>{user?.location || "Location not set"}</span>
                      </span>
                      <span className="mz-meta-item">
                        <LuCalendar size={15} className="mz-meta-icon" />
                        <span>{joinedDateText}</span>
                      </span>
                    </div>

                    <p className="mz-banner-bio">
                      {user?.bio || "Curious learner passionate about coding, exploring new languages, and building better habits every day."}
                    </p>

                    {/* Explored Tracks Section: Visible ONLY if user has genuinely explored the page */}
                    <div className="mz-banner-tags">
                      {exploredTracks.length > 0 ? (
                        exploredTracks.map((track) => {
                          const normalized = track.toUpperCase();
                          let tagClass = "mz-tag-blue";
                          if (normalized.includes("LANG")) tagClass = "mz-tag-green";
                          else if (normalized.includes("FIT") || normalized.includes("GYM")) tagClass = "mz-tag-pink";
                          else if (normalized.includes("VEH") || normalized.includes("DRIV")) tagClass = "mz-tag-cyan";

                          const route =
                            normalized.includes("LANG") ? "/language" :
                            normalized.includes("VEH") || normalized.includes("DRIV") ? "/driving" :
                            normalized.includes("FIT") || normalized.includes("GYM") ? "/fitness" : "/coding";

                          return (
                            <div
                              key={track}
                              className="mz-explored-tag-wrapper"
                              onClick={() => navigate(route)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") navigate(route);
                              }}
                              title={`Click to open ${track} track`}
                            >
                              <span className={`mz-banner-tag-pill ${tagClass} mz-explored-tag`}>
                                <span className="mz-tag-text">{track}</span>
                                <span className="mz-tag-tick" aria-hidden="true">
                                  <LuCheck size={11} strokeWidth={3.5} />
                                </span>
                              </span>

                              {/* Only hover on that text shows explored popup */}
                              <div className="mz-explored-popup" role="tooltip">
                                <LuCircleCheck size={12} className="mz-popup-icon" />
                                <span>Explored</span>
                              </div>
                            </div>
                          );
                        })
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Edit Profile CTA Button */}
                <div className="mz-banner-actions">
                  <button
                    type="button"
                    className="mz-btn-edit-profile"
                    onClick={() => openEditModal()}
                    title="Edit personal details"
                  >
                    <LuPencil size={15} />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Decorative Subtle Wavy Shapes */}
                <div className="mz-banner-wave-decoration" aria-hidden="true" />
              </section>

              {/* 2. Profile Information Card */}
              <section className="mz-profile-info-card">
                <div className="mz-info-card-header">
                  <div className="mz-info-header-icon-box">
                    <LuUser size={20} />
                  </div>
                  <div>
                    <h2 className="mz-info-title">Profile Information</h2>
                    <p className="mz-info-subtitle">Manage your personal details and about section.</p>
                  </div>
                </div>

                <div className="mz-info-card-body">
                  {/* Left Column: Photo Management */}
                  <div className="mz-photo-column">
                    <div className="mz-photo-frame-wrap">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Profile frame"
                          className="mz-photo-frame-img"
                          onClick={() => setIsLightboxOpen(true)}
                          title="Click to view full image"
                        />
                      ) : (
                        <div className="mz-photo-frame-fallback">
                          <span>{displayName.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="mz-photo-frame-camera-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload new photo"
                      >
                        <LuCamera size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="mz-btn-change-photo"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload new image"
                    >
                      <LuUpload size={16} />
                      <span>Change Photo</span>
                    </button>

                    <button
                      type="button"
                      className="mz-btn-remove-photo"
                      onClick={() => {
                        if (!user?.avatarUrl) {
                          toast.info("No custom photo to remove.");
                          return;
                        }
                        setIsDeletePhotoModalOpen(true);
                      }}
                      title="Remove profile image"
                    >
                      <LuTrash2 size={15} />
                      <span>Remove Photo</span>
                    </button>

                    {user?.avatarUrl && (
                      <button
                        type="button"
                        className="mz-link-view-image"
                        onClick={() => setIsLightboxOpen(true)}
                        title="View photo full size"
                      >
                        <LuEye size={14} />
                        <span>View Image</span>
                      </button>
                    )}
                  </div>

                  {/* Right Column: Personal Detail Fields */}
                  <div className="mz-fields-column">
                    {/* Full Name */}
                    <div className="mz-field-row" onClick={() => openEditModal("fullName")}>
                      <div className="mz-field-left">
                        <div className="mz-field-icon-box">
                          <LuUser size={16} />
                        </div>
                        <div className="mz-field-texts">
                          <span className="mz-field-label">Full Name</span>
                          <span className="mz-field-value">
                            {user?.fullName || displayName}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mz-field-edit-btn"
                        title="Edit Full Name"
                        aria-label="Edit Full Name"
                      >
                        <LuPencil size={14} />
                      </button>
                    </div>

                    {/* Username */}
                    <div className="mz-field-row" onClick={() => openEditModal("username")}>
                      <div className="mz-field-left">
                        <div className="mz-field-icon-box">
                          <LuAtSign size={16} />
                        </div>
                        <div className="mz-field-texts">
                          <span className="mz-field-label">Username</span>
                          <span className="mz-field-value">
                            {user?.username ? `@${user.username}` : "username"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mz-field-edit-btn"
                        title="Edit Username"
                        aria-label="Edit Username"
                      >
                        <LuPencil size={14} />
                      </button>
                    </div>

                    {/* Email Address */}
                    <div className="mz-field-row read-only">
                      <div className="mz-field-left">
                        <div className="mz-field-icon-box">
                          <LuMail size={16} />
                        </div>
                        <div className="mz-field-texts">
                          <span className="mz-field-label">Email Address</span>
                          <span className="mz-field-value">{user?.email || "email@example.com"}</span>
                        </div>
                      </div>
                      <span className="mz-field-verified-badge" title="Verified Account Email">
                        Verified
                      </span>
                    </div>

                    {/* Location */}
                    {!isEditingLocationInline ? (
                      <div
                        className="mz-field-row"
                        onClick={() => setIsEditingLocationInline(true)}
                        title="Click to update location (India States & Cities)"
                      >
                        <div className="mz-field-left">
                          <div className="mz-field-icon-box">
                            <LuMapPin size={16} />
                          </div>
                          <div className="mz-field-texts">
                            <span className="mz-field-label">Location</span>
                            <span className={`mz-field-value ${!user?.location ? "text-muted" : ""}`}>
                              {user?.location || "Location not set"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="mz-field-edit-btn"
                          title="Edit Location"
                          aria-label="Edit Location"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingLocationInline(true);
                          }}
                        >
                          <LuPencil size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="mz-inline-location-container">
                        <IndiaLocationPicker
                          compact={true}
                          currentValue={user?.location || ""}
                          onSelectLocation={(loc) => handleInlineLocationUpdate(loc)}
                          onCancel={() => setIsEditingLocationInline(false)}
                        />
                      </div>
                    )}

                    {/* Occupation */}
                    <div className="mz-field-row" onClick={() => openEditModal("occupation")}>
                      <div className="mz-field-left">
                        <div className="mz-field-icon-box">
                          <LuBriefcase size={16} />
                        </div>
                        <div className="mz-field-texts">
                          <span className="mz-field-label">Occupation</span>
                          <span className={`mz-field-value ${!user?.occupation ? "text-muted" : ""}`}>
                            {user?.occupation || "Student & aspiring developer"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mz-field-edit-btn"
                        title="Edit Occupation"
                        aria-label="Edit Occupation"
                      >
                        <LuPencil size={14} />
                      </button>
                    </div>

                    {/* About Me */}
                    <div className="mz-field-row mz-field-bio" onClick={() => openEditModal("bio")}>
                      <div className="mz-field-left">
                        <div className="mz-field-icon-box">
                          <LuFileText size={16} />
                        </div>
                        <div className="mz-field-texts">
                          <span className="mz-field-label">About Me</span>
                          <span className={`mz-field-value ${!user?.bio ? "text-muted" : ""}`}>
                            {user?.bio || "Curious learner passionate about coding, exploring new languages, and building better habits every day."}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mz-field-edit-btn"
                        title="Edit About Me"
                        aria-label="Edit About Me"
                      >
                        <LuPencil size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="mz-profile-side-col">
              {/* 1. Quick Stats Card */}
              <section className="mz-quick-stats-card">
                <div className="mz-side-card-header">
                  <div className="mz-stat-header-icon-box">
                    <LuTrendingUp size={19} />
                  </div>
                  <div>
                    <h3 className="mz-side-card-title">Quick Stats</h3>
                    <p className="mz-side-card-subtitle">Your learning journey at a glance</p>
                  </div>
                </div>

                {/* 2x2 Stats Grid */}
                <div className="mz-stats-grid">
                  {/* Stat 1: Day Streak */}
                  <div className="mz-stat-box mz-stat-purple" title="Consecutive daily learning streak">
                    <div className="mz-stat-top">
                      <div className="mz-stat-icon-wrap purple">
                        <LuFlame size={18} />
                      </div>
                      <LuChevronRight size={15} className="mz-stat-arrow" />
                    </div>
                    <div className="mz-stat-value">{stats.streak || 1}</div>
                    <div className="mz-stat-label">Day Streak</div>
                  </div>

                  {/* Stat 2: Learning Time */}
                  <div className="mz-stat-box mz-stat-blue" title="Total accumulated learning hours">
                    <div className="mz-stat-top">
                      <div className="mz-stat-icon-wrap blue">
                        <LuClock size={18} />
                      </div>
                      <LuChevronRight size={15} className="mz-stat-arrow" />
                    </div>
                    <div className="mz-stat-value">{stats.learningHours || 0} hrs</div>
                    <div className="mz-stat-label">Learning Time</div>
                  </div>

                  {/* Stat 3: Achievements */}
                  <div className="mz-stat-box mz-stat-amber" title="Verified course certifications achieved">
                    <div className="mz-stat-top">
                      <div className="mz-stat-icon-wrap amber">
                        <LuTrophy size={18} />
                      </div>
                      <LuChevronRight size={15} className="mz-stat-arrow" />
                    </div>
                    <div className="mz-stat-value">{stats.achievements || 0}</div>
                    <div className="mz-stat-label">Achievements</div>
                  </div>

                  {/* Stat 4: Completed Modules */}
                  <div className="mz-stat-box mz-stat-emerald" title="Completed learning lessons and modules">
                    <div className="mz-stat-top">
                      <div className="mz-stat-icon-wrap emerald">
                        <LuCircleCheck size={18} />
                      </div>
                      <LuChevronRight size={15} className="mz-stat-arrow" />
                    </div>
                    <div className="mz-stat-value">{stats.completedModules || 0}</div>
                    <div className="mz-stat-label">Completed Modules</div>
                  </div>

                  {/* Stat 5: Challenges Solved */}
                  <div
                    className="mz-stat-box mz-stat-indigo"
                    title="Algorithmic coding challenges passed with 100% test cases"
                    onClick={() => navigate("/coding")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="mz-stat-top">
                      <div className="mz-stat-icon-wrap indigo">
                        <LuCodeXml size={18} />
                      </div>
                      <span className="mz-profile-chip-completed">
                        <LuCircleCheck size={11} /> Completed
                      </span>
                    </div>
                    <div className="mz-stat-value">{stats.solvedChallengesCount || 0}</div>
                    <div className="mz-stat-label">Challenges Solved</div>
                  </div>
                </div>
              </section>

              {/* 1.5 Coding Challenges & Badges Card */}
              <section className="mz-coding-challenges-card">
                <div className="mz-side-card-header">
                  <div className="mz-stat-header-icon-box code">
                    <LuCodeXml size={19} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <h3 className="mz-side-card-title">Coding Challenges</h3>
                      <span className="mz-profile-badge-pill-completed">
                        <LuCircleCheck size={13} /> Completed
                      </span>
                    </div>
                    <p className="mz-side-card-subtitle">
                      {stats.solvedChallengesCount || 0} Solved • {stats.totalCodingXp || 0} XP Earned
                    </p>
                  </div>
                </div>

                {stats.solvedChallengesCount > 0 ? (
                  <div className="mz-solved-challenges-list">
                    {(stats.challengesSolved || []).slice(0, 5).map((c, idx) => (
                      <div key={idx} className="mz-solved-challenge-row">
                        <div className="mz-solved-ch-left">
                          <span className="mz-solved-tick">
                            <LuCircleCheck size={14} />
                          </span>
                          <span className="mz-solved-ch-name">
                            {c.challengeId.replace(/^ch_/, "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        <span className="mz-solved-ch-badge">Completed ✓</span>
                      </div>
                    ))}
                    {(stats.challengesSolved || []).length > 5 && (
                      <div className="mz-solved-more-text">
                        +{(stats.challengesSolved || []).length - 5} more completed challenges
                      </div>
                    )}
                    <button
                      type="button"
                      className="mz-btn-view-all-challenges"
                      onClick={() => navigate("/coding")}
                    >
                      <span>Open Coding Arena (65 Challenges)</span>
                      <LuChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="mz-empty-challenges-box">
                    <p className="mz-empty-ch-title">No challenges completed yet</p>
                    <p className="mz-empty-ch-desc">
                      Solve algorithmic challenges with 100% test pass rate to earn verified Completed badges and XP on your profile.
                    </p>
                    <button
                      type="button"
                      className="mz-btn-start-challenges"
                      onClick={() => navigate("/coding")}
                    >
                      <span>Start Solving (65 Available)</span>
                      <LuChevronRight size={14} />
                    </button>
                  </div>
                )}
              </section>

              {/* 2. Interests Card */}
              <section className="mz-interests-card">
                <div className="mz-side-card-header">
                  <div className="mz-stat-header-icon-box target">
                    <LuTarget size={19} />
                  </div>
                  <div>
                    <h3 className="mz-side-card-title">Interests</h3>
                    <p className="mz-side-card-subtitle">Your explored learning tracks</p>
                  </div>
                </div>

                {/* Track List - ONLY displays tracks genuinely explored */}
                <div className="mz-tracks-list">
                  {ALL_LEARNING_TRACKS.filter((track) =>
                    isTrackExplored(track.title, exploredTracks)
                  ).length > 0 ? (
                    ALL_LEARNING_TRACKS.filter((track) =>
                      isTrackExplored(track.title, exploredTracks)
                    ).map((track) => (
                      <div
                        key={track.key}
                        className="mz-track-row explored"
                        onClick={() => navigate(track.route)}
                        role="button"
                        tabIndex={0}
                        title={`Open ${track.title} training zone`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(track.route);
                        }}
                      >
                        <div className="mz-track-left">
                          <TrackBadge type={track.key} />
                          <div className="mz-track-info">
                            <div className="mz-track-title-wrapper">
                              <span className="mz-track-title">{track.title}</span>
                              <span className="mz-track-explored-tick" aria-hidden="true">
                                <LuCheck size={11} strokeWidth={3.5} />
                              </span>
                              {/* Only hover on that text shows explored popup */}
                              <div className="mz-explored-popup" role="tooltip">
                                <LuCircleCheck size={12} className="mz-popup-icon" />
                                <span>Explored</span>
                              </div>
                            </div>
                            <span className="mz-track-subtitle">{track.subtitle}</span>
                          </div>
                        </div>
                        <LuChevronRight size={16} className="mz-track-chevron" />
                      </div>
                    ))
                  ) : (
                    <div className="mz-empty-tracks-box">
                      <LuSparkles size={24} className="mz-empty-tracks-icon" />
                      <p className="mz-empty-tracks-title">No tracks explored yet</p>
                      <p className="mz-empty-tracks-desc">
                        Visit <strong onClick={() => navigate("/coding")} className="mz-link-text">Coding</strong> or{" "}
                        <strong onClick={() => navigate("/language")} className="mz-link-text">Language</strong> to explore and unlock tracks on your profile.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Centered Subtle Footer */}
          <footer className="mz-profile-footer">
            <p>Mastery Zone • Your journey, your pace, your progress.</p>
          </footer>
        </main>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {isEditModalOpen && (
        <div className="mz-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="mz-modal-box mz-edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mz-modal-header">
              <h2 className="mz-modal-title">Edit Profile Information</h2>
              <button
                type="button"
                className="mz-modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
                title="Close"
              >
                <LuX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mz-edit-form">
              {/* Full Name Field */}
              <div className="mz-form-group">
                <label className="mz-form-label">Full Name</label>
                <input
                  type="text"
                  className="mz-form-input"
                  placeholder="e.g. Alex Morgan"
                  value={editForm.fullName}
                  autoFocus={activeEditFocus === "fullName"}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>

              {/* Username Field */}
              <div className="mz-form-group">
                <label className="mz-form-label">Username</label>
                <input
                  type="text"
                  className={`mz-form-input ${formErrors.username ? "error" : ""}`}
                  placeholder="e.g. alexmorgan"
                  value={editForm.username}
                  autoFocus={activeEditFocus === "username"}
                  onChange={(e) => {
                    setEditForm({ ...editForm, username: e.target.value });
                    if (formErrors.username) setFormErrors({});
                  }}
                />
                {formErrors.username && (
                  <span className="mz-form-error">{formErrors.username}</span>
                )}
              </div>

              {/* Location Field with India States & Cities Suggestion */}
              <div className="mz-form-group">
                <label className="mz-form-label">Location (City, State)</label>
                <IndiaLocationPicker
                  compact={false}
                  currentValue={editForm.location}
                  onSelectLocation={(loc) => {
                    setEditForm((prev) => ({ ...prev, location: loc }));
                  }}
                  autoFocus={activeEditFocus === "location"}
                />
              </div>

              {/* Occupation Field */}
              <div className="mz-form-group">
                <label className="mz-form-label">Occupation</label>
                <input
                  type="text"
                  className="mz-form-input"
                  placeholder="e.g. Student & aspiring developer"
                  value={editForm.occupation}
                  autoFocus={activeEditFocus === "occupation"}
                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                />
              </div>

              {/* About Me Field */}
              <div className="mz-form-group">
                <label className="mz-form-label">About Me / Bio</label>
                <textarea
                  className="mz-form-textarea"
                  rows={3}
                  placeholder="Tell other learners about your goals and interests..."
                  value={editForm.bio}
                  autoFocus={activeEditFocus === "bio"}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>

              <div className="mz-modal-actions">
                <button
                  type="button"
                  className="mz-modal-btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mz-modal-btn-confirm"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <>
                      <span className="mz-btn-spinner" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PHOTO UPLOAD PREVIEW MODAL ================= */}
      {isPhotoPreviewModalOpen && (
        <div className="mz-modal-backdrop" onClick={() => setIsPhotoPreviewModalOpen(false)}>
          <div className="mz-modal-box mz-photo-preview-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="mz-modal-title">Preview Profile Photo</h2>
            <p className="mz-modal-text">Would you like to set this as your Mastery Zone avatar?</p>

            <div className="mz-preview-circle-wrap">
              <img src={photoPreview} alt="Preview avatar" className="mz-preview-circle-img" />
            </div>

            <div className="mz-modal-actions">
              <button
                type="button"
                className="mz-modal-btn-cancel"
                onClick={() => {
                  setIsPhotoPreviewModalOpen(false);
                  setPhotoPreview(null);
                }}
                disabled={isUploadingPhoto}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mz-modal-btn-confirm"
                onClick={handleConfirmPhotoUpload}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <>
                    <span className="mz-btn-spinner" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  "Upload Photo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FULL IMAGE LIGHTBOX MODAL ================= */}
      {isLightboxOpen && user?.avatarUrl && (
        <div className="mz-lightbox-backdrop" onClick={() => setIsLightboxOpen(false)}>
          <div className="mz-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mz-lightbox-close-btn"
              onClick={() => setIsLightboxOpen(false)}
              title="Close image view"
            >
              <LuX size={22} />
            </button>
            <img src={user.avatarUrl} alt={`${displayName}'s Profile Avatar`} className="mz-lightbox-img" />
            <div className="mz-lightbox-caption">
              <strong>{displayName}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= REMOVE PHOTO CONFIRMATION MODAL ================= */}
      {isDeletePhotoModalOpen && (
        <div className="mz-modal-backdrop" onClick={() => setIsDeletePhotoModalOpen(false)}>
          <div className="mz-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="mz-modal-title">Remove Profile Photo</h2>
            <p className="mz-modal-text">
              Are you sure you want to remove your profile picture? This will revert your avatar to your initial letter.
            </p>
            <div className="mz-modal-actions">
              <button
                type="button"
                className="mz-modal-btn-cancel"
                onClick={() => setIsDeletePhotoModalOpen(false)}
                disabled={isDeletingPhoto}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mz-modal-btn-danger"
                onClick={handleConfirmPhotoDelete}
                disabled={isDeletingPhoto}
              >
                {isDeletingPhoto ? (
                  <>
                    <span className="mz-btn-spinner" />
                    <span>Removing...</span>
                  </>
                ) : (
                  "Yes, Remove Photo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOGOUT CONFIRMATION MODAL ================= */}
      {isLogoutModalOpen && (
        <div className="mz-modal-backdrop" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="mz-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="mz-modal-title">Log Out</h2>
            <p className="mz-modal-text">Are you sure you want to log out of Mastery Zone?</p>
            <div className="mz-modal-actions">
              <button
                type="button"
                className="mz-modal-btn-cancel"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mz-modal-btn-confirm"
                onClick={handleLogoutConfirm}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= APP SETTINGS MODAL ================= */}
      {isSettingsModalOpen && (
        <div className="mz-modal-backdrop" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="mz-modal-box mz-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mz-modal-header">
              <h2 className="mz-modal-title">Account Settings</h2>
              <button
                type="button"
                className="mz-modal-close-btn"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="mz-setting-row">
              <div className="mz-setting-info">
                <span className="mz-setting-name">Email Notifications</span>
                <span className="mz-setting-desc">Receive updates about module completion and study goals</span>
              </div>
              <span className="mz-setting-status-pill">Active</span>
            </div>

            <div className="mz-setting-row">
              <div className="mz-setting-info">
                <span className="mz-setting-name">Account Security</span>
                <span className="mz-setting-desc">Password and multi-factor session security</span>
              </div>
              <button
                type="button"
                className="mz-btn-inline-link"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  navigate("/forgot-password");
                }}
              >
                Reset Password
              </button>
            </div>

            <div className="mz-modal-actions" style={{ marginTop: "24px" }}>
              <button
                type="button"
                className="mz-modal-btn-confirm"
                style={{ width: "100%" }}
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./home.css";
import NotificationBell from "./NotificationBell.jsx";
import CertificationExamWorkspace from "./CertificationExamWorkspace.jsx";
import logoIcon from "../assets/logo_icon_transparent.png";
import heroIllustration from "../assets/interests_hero_illustration.png";
import rocketIcon from "../assets/interests_card_rocket.png";

// Ultra-sharp 1024x1024 300DPI 3D Apple-style illustrations (Zero Blur)
import codingIllustration from "../assets/interests_card_coding_hd.png";
import languageIllustration from "../assets/interests_card_language_hd.png";
import vehiclesIllustration from "../assets/interests_card_vehicles_hd.png";
import gymIllustration from "../assets/interests_card_gym_hd.png";

import {
  LuHouse,
  LuTarget,
  LuChartColumn,
  LuUser,
  LuSettings,
  LuLogOut,
  LuSearch,
  LuChevronDown,
  LuCheck,
  LuX,
  LuArrowRight,
  LuCircleCheck,
  LuFileText,
  LuAward,
  LuClock,
  LuCalendar,
  LuExternalLink,
  LuShieldCheck,
  LuVideo,
  LuPlay,
  LuDownload,
  LuPencil,
  LuTrash2,
  LuShare2,
  LuHardDrive,
  LuBookmark,
  LuFilter,
  LuRotateCcw,
  LuPlus,
  LuCodeXml,
  LuLanguages,
  LuCar,
  LuDumbbell,
  LuFolderGit2,
  LuSparkles,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Vector Badge Component for 100% crisp, sharp logo rendering (0 blur on any screen)
const InterestBadge = ({ type, className = "" }) => {
  switch (type) {
    case "CODING":
      return (
        <div className={`mz-badge-box mz-badge-coding ${className}`} title="Coding">
          <LuCodeXml size={22} strokeWidth={2.4} />
        </div>
      );
    case "LANGUAGE":
      return (
        <div className={`mz-badge-box mz-badge-language ${className}`} title="Language">
          <span className="mz-badge-lang-glyph">文A</span>
        </div>
      );
    case "VECHILES":
      return (
        <div className={`mz-badge-box mz-badge-vehicles ${className}`} title="Vehicles">
          <LuCar size={22} strokeWidth={2.3} />
        </div>
      );
    case "GYM":
      return (
        <div className={`mz-badge-box mz-badge-gym ${className}`} title="Gym">
          <LuDumbbell size={22} strokeWidth={2.3} />
        </div>
      );
    default:
      return null;
  }
};

// Extensible registry of interests
const INTEREST_CARDS = [
  {
    key: "CODING",
    title: "Coding",
    description: "Learn programming, build real projects, and grow your problem-solving skills.",
    tags: ["Python", "JavaScript", "Web Development"],
    illustration: codingIllustration,
    activeBorder: "#3b82f6",
    activeGlow: "rgba(59, 130, 246, 0.22)",
    checkBg: "#2563eb",
    targetRoute: "/coding",
  },
  {
    key: "LANGUAGE",
    title: "Language",
    description: "Learn new languages and connect with the world.",
    tags: ["English", "Spanish", "French"],
    illustration: languageIllustration,
    activeBorder: "#10b981",
    activeGlow: "rgba(16, 185, 129, 0.22)",
    checkBg: "#10b981",
    targetRoute: "/language",
  },
  {
    key: "VECHILES",
    title: "Vehicles",
    description: "Explore vehicle systems, maintenance and more.",
    tags: ["Cars", "Motorcycles", "Electric Vehicles"],
    illustration: vehiclesIllustration,
    activeBorder: "#0284c7",
    activeGlow: "rgba(2, 132, 199, 0.22)",
    checkBg: "#0284c7",
    targetRoute: "/driving",
  },
  {
    key: "GYM",
    title: "Gym",
    description: "Build a healthier body and a stronger mindset.",
    tags: ["Fitness", "Nutrition", "Wellness"],
    illustration: gymIllustration,
    activeBorder: "#ec4899",
    activeGlow: "rgba(236, 72, 153, 0.22)",
    checkBg: "#ec4899",
    targetRoute: "/fitness",
  },
];

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active navigation tab directly from current route pathname
  const currentPath = location.pathname;
  const activeNavTab = useMemo(() => {
    if (currentPath === "/reports") return "reports";
    if (currentPath === "/recordings") return "recordings";
    if (currentPath === "/certificates" || currentPath === "/certifications") return "certifications";
    if (currentPath === "/settings") return "settings";
    if (currentPath === "/select-interests") return "select-interests";
    return "home";
  }, [currentPath]);
  const [certHistory, setCertHistory] = useState({ attempts: [], certificates: [] });
  const [isLoadingCertHistory, setIsLoadingCertHistory] = useState(false);
  const [activeCertExamModal, setActiveCertExamModal] = useState(() => {
    try {
      const rawUser = localStorage.getItem("user");
      let uId = "";
      if (rawUser) {
        const u = JSON.parse(rawUser);
        uId = u._id || u.id || u.userId || "";
      }
      const certKey = uId ? `mz_${uId}_active_cert_session` : "mz_active_cert_session";
      const saved = localStorage.getItem(certKey) || localStorage.getItem("mz_active_cert_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.attemptId && parsed.status === "IN_PROGRESS") {
          if (parsed.userId && uId && parsed.userId !== uId) return null;
          return {
            id: parsed.certId || "dsa_cert",
            name: parsed.certTitle || "Data Structures & Algorithms (DSA)",
            attemptId: parsed.attemptId,
          };
        }
      }
    } catch {}
    return null;
  });

  const fetchCertHistory = async () => {
    setIsLoadingCertHistory(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/certifications/my-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCertHistory({
          attempts: data.attempts || [],
          certificates: data.certificates || [],
        });
      }
    } catch (err) {
      console.warn("Cert history fetch note:", err);
    } finally {
      setIsLoadingCertHistory(false);
    }
  };
  const [reportsList, setReportsList] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState("ALL"); // "ALL" | "PASSED" | "FAILED"
  const [reportSubjectFilter, setReportSubjectFilter] = useState("ALL"); // "ALL" | "coding" | "language" | "driving" | "fitness"
  const [reportTypeFilter, setReportTypeFilter] = useState("ALL"); // "ALL" | "mcq_exam" | "coding_assessment"

  // Fetch assessment reports from database & localStorage without UI flash
  const fetchReports = async (showLoader = false) => {
    if (showLoader) {
      setIsLoadingReports(true);
    }
    try {
      const token = localStorage.getItem("token");
      let uId = "";
      let localReports = [];
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          uId = parsed._id || parsed.id || parsed.userId || "";
        }
        const reportsKey = uId ? `mz_${uId}_assessment_reports` : "mz_assessment_reports";
        localReports = JSON.parse(localStorage.getItem(reportsKey) || "[]");
      } catch {}

      let apiReports = [];
      if (token) {
        // 1. Fetch curriculum reports (MCQ Exams & multi-subject assessment attempts)
        try {
          const res = await fetch(`${API_BASE}/api/curriculum/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.reports)) {
              apiReports.push(...data.reports);
            }
          }
        } catch (curErr) {
          console.warn("Curriculum reports fetch note:", curErr);
        }

        // 2. Fetch proctored coding sessions (MZ-ASM practical exams)
        try {
          const res = await fetch(`${API_BASE}/api/coding/proctored-session/user-reports`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.reports)) {
              apiReports.push(...data.reports);
            }
          }
        } catch (apiErr) {
          console.warn("API reports fetch note:", apiErr);
        }
      }

      const map = new Map();
      apiReports.forEach((r) => {
        const key = r.sessionId || r._id || r.id;
        if (key) map.set(key, r);
      });
      localReports.forEach((r) => {
        if (uId && r.userId && String(r.userId) !== String(uId)) return;
        const key = r.sessionId || r._id || r.id;
        if (key && !map.has(key)) map.set(key, r);
      });

      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0)
      );
      setReportsList(combined);
    } catch (err) {
      console.warn("Reports load error:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const [recordingsList, setRecordingsList] = useState([]);
  const [recordingsAnalytics, setRecordingsAnalytics] = useState({
    totalRecordings: 0,
    totalSizeBytes: 0,
    storageQuotaBytes: 5 * 1024 * 1024 * 1024,
  });
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [recSearchQuery, setRecSearchQuery] = useState("");
  const [recDateFilter, setRecDateFilter] = useState("all"); // "all" | "today" | "week" | "month"
  const [recSortOrder, setRecSortOrder] = useState("newest"); // "newest" | "oldest" | "duration_desc" | "duration_asc"
  const [recScope, setRecScope] = useState("all"); // "all" | "personal" | "shared"
  const [activePlayingRecording, setActivePlayingRecording] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [renameModalRecording, setRenameModalRecording] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [shareToast, setShareToast] = useState(null);
  const [newBookmarkNote, setNewBookmarkNote] = useState("");
  const videoPlayerRef = useRef(null);

  // Fetch recordings with smooth state merging to prevent blinking
  const fetchRecordings = async (showLoader = false) => {
    if (showLoader) {
      setIsLoadingRecordings(true);
    }
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (recSearchQuery.trim()) queryParams.set("q", recSearchQuery.trim());
      if (recDateFilter !== "all") queryParams.set("dateFilter", recDateFilter);
      if (recSortOrder) queryParams.set("sort", recSortOrder);
      if (recScope !== "all") queryParams.set("scope", recScope);

      let apiRecs = [];
      const res = await fetch(`${API_BASE}/api/recordings?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recordings)) {
          apiRecs = data.recordings;
        }
        if (data.analytics) {
          setRecordingsAnalytics(data.analytics);
        }
      }

      // Also merge user-specific local recordings
      let uId = "";
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          uId = parsed._id || parsed.id || parsed.userId || "";
        }
      } catch {}

      const recKey = uId ? `mz_${uId}_local_recordings` : "mz_local_recordings";
      let localRecs = [];
      try {
        localRecs = JSON.parse(localStorage.getItem(recKey) || "[]");
      } catch {}

      const recMap = new Map();
      apiRecs.forEach((r) => {
        const key = r.recordingId || r._id || r.id;
        if (key) recMap.set(key, r);
      });
      localRecs.forEach((r) => {
        if (uId && r.hostUserId && String(r.hostUserId) !== String(uId)) return;
        const key = r.recordingId || r._id || r.id;
        if (key && !recMap.has(key)) recMap.set(key, r);
      });

      const combined = Array.from(recMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setRecordingsList(combined);
    } catch (err) {
      console.warn("Recordings fetch note:", err);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  const handleRenameRecordingSubmit = async (e) => {
    e?.preventDefault();
    if (!renameModalRecording || !renameInput.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/recordings/${renameModalRecording.recordingId}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: renameInput.trim() }),
      });
      if (res.ok) {
        setRecordingsList((prev) =>
          prev.map((r) =>
            r.recordingId === renameModalRecording.recordingId
              ? { ...r, title: renameInput.trim() }
              : r
          )
        );
        if (activePlayingRecording?.recordingId === renameModalRecording.recordingId) {
          setActivePlayingRecording((prev) => ({ ...prev, title: renameInput.trim() }));
        }
        setRenameModalRecording(null);
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDeleteRecording = async (recordingId) => {
    if (!window.confirm("Are you sure you want to delete this recorded session? This action cannot be undone.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/recordings/${recordingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRecordingsList((prev) => prev.filter((r) => r.recordingId !== recordingId));
        if (activePlayingRecording?.recordingId === recordingId) {
          setActivePlayingRecording(null);
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleShareRecording = (rec) => {
    const fullUrl = `${window.location.origin}/recordings?id=${rec.recordingId}`;
    navigator.clipboard?.writeText(fullUrl);
    setShareToast(`Meeting link copied to clipboard: ${rec.title}`);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleAddBookmark = async (e) => {
    e?.preventDefault();
    if (!activePlayingRecording || !videoPlayerRef.current) return;
    const currentSeconds = Math.floor(videoPlayerRef.current.currentTime || 0);
    const note = newBookmarkNote.trim() || `Bookmark at ${Math.floor(currentSeconds / 60)}:${String(currentSeconds % 60).padStart(2, "0")}`;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/recordings/${activePlayingRecording.recordingId}/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ timestampSeconds: currentSeconds, note }),
      });
      if (res.ok) {
        const data = await res.json();
        setActivePlayingRecording((prev) => ({
          ...prev,
          bookmarks: data.bookmarks,
        }));
        setNewBookmarkNote("");
      }
    } catch (err) {
      console.error("Add bookmark error:", err);
    }
  };

  useEffect(() => {
    fetchReports(false);
    fetchRecordings(false);
    fetchCertHistory();
  }, []);

  const prevTabRef = useRef(activeNavTab);
  useEffect(() => {
    if (prevTabRef.current !== activeNavTab) {
      prevTabRef.current = activeNavTab;
      if (activeNavTab === "reports") {
        fetchReports(reportsList.length === 0);
      } else if (activeNavTab === "recordings") {
        fetchRecordings(recordingsList.length === 0);
      } else if (activeNavTab === "certifications") {
        fetchCertHistory();
      }
    }
  }, [activeNavTab, reportsList.length, recordingsList.length]);

  useEffect(() => {
    if (activeNavTab === "recordings") {
      fetchRecordings(false);
    }
  }, [recDateFilter, recSortOrder, recScope]);

  useEffect(() => {
    if (activePlayingRecording && videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = playbackSpeed;
      const rawUser = localStorage.getItem("user");
      let uId = "guest";
      try {
        if (rawUser) {
          const u = JSON.parse(rawUser);
          uId = u._id || u.id || u.userId || "guest";
        }
      } catch {}
      const savedTime =
        localStorage.getItem(`mz_${uId}_rec_seek_${activePlayingRecording.recordingId}`) ||
        localStorage.getItem(`mz_rec_seek_${activePlayingRecording.recordingId}`);
      if (savedTime && Number(savedTime) > 0) {
        videoPlayerRef.current.currentTime = Number(savedTime);
      }
    }
  }, [activePlayingRecording]);

  // Single selection: exactly one particular interest can be selected at a time
  const [selectedInterest, setSelectedInterest] = useState("CODING");

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pulseBadge, setPulseBadge] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Settings preferences
  const [preferences, setPreferences] = useState({
    notifications: true,
  });

  // Log Activity Modal & Confirmation State
  const [isLogActivityModalOpen, setIsLogActivityModalOpen] = useState(false);
  const [isLogConfirmed, setIsLogConfirmed] = useState(false);
  const [confirmedActivityData, setConfirmedActivityData] = useState(null);
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [logActivityForm, setLogActivityForm] = useState({
    track: "CODING",
    task: "Completed a lesson",
    moduleName: "",
    hoursSpent: "1.0",
    xpEarned: "30",
  });

  const handleLogActivitySubmit = async (e) => {
    e.preventDefault();
    if (!logActivityForm.moduleName.trim()) {
      toast.error("Please enter a lesson or module name");
      return;
    }

    setIsLoggingActivity(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/progress/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(logActivityForm),
      });

      if (res.ok) {
        setConfirmedActivityData({
          track: logActivityForm.track,
          task: logActivityForm.task,
          moduleName: logActivityForm.moduleName,
          hoursSpent: logActivityForm.hoursSpent,
          xpEarned: logActivityForm.xpEarned,
          date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        setIsLogConfirmed(true);
        toast.success("Learning activity recorded successfully!");
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Could not log activity");
      }
    } catch (err) {
      toast.error("Network error saving activity");
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const handleCloseLogActivityModal = () => {
    setIsLogActivityModalOpen(false);
    setIsLogConfirmed(false);
    setConfirmedActivityData(null);
    setLogActivityForm({
      track: "CODING",
      task: "Completed a lesson",
      moduleName: "",
      hoursSpent: "1.0",
      xpEarned: "30",
    });
  };

  const [isExiting, setIsExiting] = useState(false);

  // Real-time search query
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Fetch current user details and keep synchronized across all views
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          try {
            localStorage.setItem("user", JSON.stringify(data.user));
            if (data.user.avatarUrl) {
              localStorage.setItem("mz_avatarUrl", data.user.avatarUrl);
            } else {
              localStorage.removeItem("mz_avatarUrl");
            }
          } catch {}
          if (data.user.preferences) {
            setPreferences((prev) => ({
              ...prev,
              notifications: data.user.preferences.notifications ?? true,
            }));
          }
          if (Array.isArray(data.user.interests) && data.user.interests.length > 0) {
            const first = data.user.interests[0];
            const normalized = first === "VEHICLES" ? "VECHILES" : first;
            if (INTEREST_CARDS.some((c) => c.key === normalized)) {
              setSelectedInterest(normalized);
            }
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch user", error);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleProfileUpdated = (event) => {
      const newAvatar = event?.detail?.avatarUrl;
      if (newAvatar !== undefined) {
        setUser((prev) => (prev ? { ...prev, avatarUrl: newAvatar } : { avatarUrl: newAvatar }));
      }
      fetchUser();
    };

    const handleSync = () => {
      fetchUser();
      fetchReports(false);
      fetchRecordings(false);
      fetchCertHistory();
    };

    window.addEventListener("user_profile_updated", handleProfileUpdated);
    window.addEventListener("new_recording_saved", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      window.removeEventListener("user_profile_updated", handleProfileUpdated);
      window.removeEventListener("new_recording_saved", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [fetchUser, location.pathname]);

  // Single Selection toggle with micro-spring pulse trigger
  const handleSelectInterest = (key) => {
    setSelectedInterest((prev) => (prev === key ? null : key));
    setPulseBadge(true);
    setTimeout(() => setPulseBadge(false), 350);
  };

  const handleDeselect = (e) => {
    if (e) e.stopPropagation();
    setSelectedInterest(null);
    setPulseBadge(true);
    setTimeout(() => setPulseBadge(false), 350);
  };

  // Real-time search filter for interests
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return INTEREST_CARDS;
    const q = searchQuery.toLowerCase().trim();
    return INTEREST_CARDS.filter(
      (card) =>
        card.title.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Continue to selected training track with animated loading state and transition
  const handleContinue = async () => {
    if (!selectedInterest) {
      toast.warn("Please select an interest to continue your learning journey!");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${API_BASE}/auth/interests`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ interests: [selectedInterest] }),
        });
      }
    } catch (err) {
      console.error("Failed to persist interest:", err);
    }
    localStorage.setItem("userInterests", JSON.stringify([selectedInterest]));

    setIsExiting(true);
    setTimeout(() => {
      const item = INTEREST_CARDS.find((i) => i.key === selectedInterest);
      if (item) {
        navigate(item.targetRoute);
      } else {
        navigate("/coding");
      }
    }, 350);
  };

  const handleLogoutConfirm = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success("Account deleted successfully.");
        localStorage.removeItem("token");
        navigate("/signup");
      }
    } catch (error) {
      console.error("Error deleting account", error);
    }
  };

  const handlePhotoUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      const previousAvatar = user?.avatarUrl;
      setUser((prev) => ({ ...prev, avatarUrl: base64Image }));
      setIsDropdownOpen(false);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/auth/avatar`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl: base64Image }),
        });

        if (!response.ok) {
          setUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
          toast.error("Failed to update profile photo. Image might be too large.");
        } else {
          try {
            const stored = localStorage.getItem("user");
            const u = stored ? JSON.parse(stored) : {};
            u.avatarUrl = base64Image;
            localStorage.setItem("user", JSON.stringify(u));
            localStorage.setItem("mz_avatarUrl", base64Image);
          } catch {}
          window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: { avatarUrl: base64Image } }));
          toast.success("Profile photo updated successfully!");
        }
      } catch (error) {
        console.error("Error updating photo", error);
        setUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
      }
    };
  };

  const handleRemovePhoto = async () => {
    const previousAvatar = user?.avatarUrl;
    setUser((prev) => ({ ...prev, avatarUrl: null }));
    setIsDropdownOpen(false);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/auth/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
        toast.error("Failed to remove profile photo.");
      } else {
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            u.avatarUrl = null;
            localStorage.setItem("user", JSON.stringify(u));
          }
          localStorage.removeItem("mz_avatarUrl");
        } catch {}
        window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: { avatarUrl: null } }));
        toast.info("Profile photo removed.");
      }
    } catch (error) {
      console.error("Error removing photo", error);
      setUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/auth/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error("Failed to update preferences", err);
    }
  };

  const selectedItem = INTEREST_CARDS.find((i) => i.key === selectedInterest);
  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.name ||
    user?.username ||
    localStorage.getItem("userName") ||
    (user?.email ? user.email.split("@")[0] : "Learner");

  return (
    <div
      key={location.key}
      className={`mz-home-layout ${isExiting ? "mz-page-exit" : "mz-page-enter"}`}
    >
      {/* ================= LEFT SIDEBAR (STICKY, LOGOUT ALWAYS ON SCREEN) ================= */}
      <aside className="mz-sidebar">
        {/* Brand Logo Header */}
        <div className="mz-sidebar-brand" onClick={() => navigate("/home")} title="Mastery Zone Home">
          <img src={logoIcon} alt="Mastery Zone Logo" className="mz-sidebar-brand-icon" />
          <span className="mz-sidebar-brand-text">Mastery Zone</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="mz-sidebar-nav">
          {/* 1. Home */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "home" ? "active" : ""}`}
            onClick={() => {
              navigate("/home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Home"
          >
            <LuHouse className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Home</span>
          </button>

          {/* 2. Select Interests */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "select-interests" ? "active" : ""}`}
            onClick={() => {
              navigate("/select-interests");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Select Interests"
          >
            <LuTarget className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Select Interests</span>
          </button>

          {/* 3. Reports */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "reports" ? "active" : ""}`}
            onClick={() => {
              navigate("/reports");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Reports"
          >
            <LuFileText className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Reports</span>
            {reportsList.length > 0 && (
              <span className="mz-sidebar-badge-count">{reportsList.length}</span>
            )}
          </button>

          {/* 4. Recordings */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "recordings" ? "active" : ""}`}
            onClick={() => {
              navigate("/recordings");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Recordings"
            data-testid="sidebar-nav-recordings"
          >
            <LuVideo className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Recordings</span>
            {recordingsList.length > 0 && (
              <span className="mz-sidebar-badge-count" style={{ background: "#2563eb" }}>
                {recordingsList.length}
              </span>
            )}
          </button>

          {/* 5. Certificates */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "certifications" ? "active" : ""}`}
            onClick={() => {
              navigate("/certificates");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Certificates"
            data-testid="sidebar-nav-certifications"
          >
            <LuAward className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Certificates</span>
            {certHistory.certificates?.length > 0 && (
              <span className="mz-sidebar-badge-count" style={{ background: "#7c3aed" }}>
                {certHistory.certificates.length}
              </span>
            )}
          </button>

          {/* 6. Progress */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => navigate("/progress")}
            title="Progress"
          >
            <LuChartColumn className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Progress</span>
          </button>

          {/* 7. Profile */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => navigate("/profile")}
            title="Profile"
          >
            <LuUser className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Profile</span>
          </button>

          {/* 8. Settings */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "settings" ? "active" : ""}`}
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <LuSettings className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Settings</span>
          </button>

          {/* 9. Log Out */}
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

      {/* ================= MAIN CONTAINER ================= */}
      <div className="mz-main-wrapper">
        {/* Top Navbar */}
        <header className="mz-topbar">
          {/* Real-time search bar */}
          <div className="mz-search-bar-wrap">
            <LuSearch className="mz-search-bar-icon" size={17} />
            <input
              ref={searchInputRef}
              type="text"
              className="mz-search-bar-input"
              placeholder="Search interests or skills (e.g. Python, Web, Spanish, Gym, Driving)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Real-time search"
            />
            {searchQuery && (
              <button
                type="button"
                className="mz-search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
              >
                <LuX size={14} />
              </button>
            )}
            {searchQuery && (
              <span className="mz-search-count-pill">
                {filteredCards.length} {filteredCards.length === 1 ? "result" : "results"}
              </span>
            )}
          </div>

          <div className="mz-topbar-right">
            {/* Quick Log Activity Button */}
            <button
              type="button"
              className="mz-btn-quick-log"
              onClick={() => {
                setIsLogConfirmed(false);
                setIsLogActivityModalOpen(true);
              }}
              title="Log completed study hours or lesson"
              data-testid="home-btn-log-activity"
            >
              <LuPlus size={15} />
              <span>Log Activity</span>
            </button>

            {/* Real-Time Notification Bell */}
            <NotificationBell />

            {/* Profile Dropdown Widget with Shimmer Loader */}
            <div className="mz-profile-widget" ref={dropdownRef}>
              {isLoadingUser ? (
                <div className="mz-profile-btn mz-profile-loading" aria-label="Loading profile...">
                  <div className="mz-profile-avatar-circle mz-skeleton-shimmer" />
                  <div className="mz-skeleton-text-pill mz-skeleton-shimmer" />
                </div>
              ) : (
                <button
                  type="button"
                  className="mz-profile-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="User profile menu"
                >
                  <div className="mz-profile-avatar-circle">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="mz-profile-avatar-img" />
                    ) : (
                      <span className="mz-profile-avatar-fallback">
                        <LuUser size={16} />
                      </span>
                    )}
                  </div>
                  <span className="mz-profile-name">{displayName}</span>
                  <LuChevronDown
                    size={14}
                    className={`mz-chevron ${isDropdownOpen ? "open" : ""}`}
                  />
                </button>
              )}

              {isDropdownOpen && (
                <div className="mz-profile-menu">
                  <div className="mz-menu-header">
                    <strong>{user?.fullName || displayName}</strong>
                    <span>{user?.email || localStorage.getItem("userEmail") || "user@masteryzone.com"}</span>
                  </div>
                  <div className="mz-menu-divider" />
                  <button
                    type="button"
                    className="mz-menu-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/profile");
                    }}
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    className="mz-menu-item"
                    onClick={handlePhotoUploadClick}
                  >
                    Update Photo
                  </button>
                  {user?.avatarUrl && (
                    <button
                      type="button"
                      className="mz-menu-item mz-text-danger"
                      onClick={handleRemovePhoto}
                    >
                      Remove Photo
                    </button>
                  )}
                  <button
                    type="button"
                    className="mz-menu-item"
                    onClick={() => {
                      setIsSettingsModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                  >
                    App Settings
                  </button>
                  <button
                    type="button"
                    className="mz-menu-item mz-text-danger"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleDeleteAccount();
                    }}
                  >
                    Delete Account
                  </button>
                  <div className="mz-menu-divider" />
                  <button
                    type="button"
                    className="mz-menu-item"
                    onClick={() => {
                      setIsLogoutModalOpen(true);
                      setIsDropdownOpen(false);
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
              onChange={handleFileChange}
            />
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="mz-content-area">
          {activeNavTab === "reports" ? (
            <div className="mz-reports-page-wrapper">
              <div className="mz-reports-top-banner">
                <div className="mz-reports-top-info">
                  <div className="mz-reports-badge-pill">
                    <LuShieldCheck size={14} /> Official Verified Records
                  </div>
                  <h1 className="mz-reports-main-heading">
                    Assessment <span className="mz-hero-gradient-text">Reports</span>
                  </h1>
                  <p className="mz-reports-sub-heading">
                    Every submitted assessment is permanently recorded here with compiler results, accuracy, test outcomes, and proctoring logs.
                  </p>
                </div>

                <div className="mz-reports-header-stats">
                  <div className="mz-rep-stat-box">
                    <span className="mz-rep-stat-val">{reportsList.length}</span>
                    <span className="mz-rep-stat-lbl">Total Attempts</span>
                  </div>
                  <div className="mz-rep-stat-box mz-stat-passed passed">
                    <span className="mz-rep-stat-val">
                      {reportsList.filter((r) => (r.passed !== undefined ? Boolean(r.passed) : r.score >= 80)).length}
                    </span>
                    <span className="mz-rep-stat-lbl">Passed (≥80%)</span>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Discipline Selectors */}
              <div className="mz-reports-toolbar">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                  {/* Row 1: Subject Filter Pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "4px" }}>
                      Discipline:
                    </span>
                    {[
                      { id: "ALL", label: "All Subjects" },
                      { id: "coding", label: "Coding" },
                      { id: "language", label: "Language" },
                      { id: "driving", label: "Driving" },
                      { id: "fitness", label: "Fitness" },
                    ].map((s) => {
                      const count = s.id === "ALL" ? reportsList.length : reportsList.filter((r) => (r.subjectKey || "coding").toLowerCase() === s.id).length;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`mz-filter-pill ${reportSubjectFilter === s.id ? "active" : ""}`}
                          onClick={() => setReportSubjectFilter(s.id)}
                        >
                          {s.label} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Row 2: Status & Type Filters */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div className="mz-reports-filter-pills">
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportFilter === "ALL" ? "active" : ""}`}
                        onClick={() => setReportFilter("ALL")}
                      >
                        All Results ({reportsList.length})
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportFilter === "PASSED" ? "active" : ""}`}
                        onClick={() => setReportFilter("PASSED")}
                      >
                        Passed ({reportsList.filter((r) => (r.passed !== undefined ? Boolean(r.passed) : r.score >= 80)).length})
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportFilter === "FAILED" ? "active" : ""}`}
                        onClick={() => setReportFilter("FAILED")}
                      >
                        Needs Improvement ({reportsList.filter((r) => !(r.passed !== undefined ? Boolean(r.passed) : r.score >= 80)).length})
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportTypeFilter === "ALL" ? "active" : ""}`}
                        onClick={() => setReportTypeFilter("ALL")}
                      >
                        All Types
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportTypeFilter === "mcq_exam" ? "active" : ""}`}
                        onClick={() => setReportTypeFilter("mcq_exam")}
                      >
                        10-MCQ Exam
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportTypeFilter === "coding_assessment" ? "active" : ""}`}
                        onClick={() => setReportTypeFilter("coding_assessment")}
                      >
                        Practical Code
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportTypeFilter === "project_assessment" ? "active" : ""}`}
                        onClick={() => setReportTypeFilter("project_assessment")}
                      >
                        Projects
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reports Grid */}
              {isLoadingReports && reportsList.length === 0 ? (
                <div className="mz-reports-loading-box">
                  <div className="mz-reports-spinner" />
                  <p>Loading candidate reports...</p>
                </div>
              ) : reportsList.length === 0 ? (
                <div className="mz-reports-empty-box">
                  <div className="mz-rep-empty-icon-wrap">
                    <LuFileText size={44} />
                  </div>
                  <h3>No Assessment Reports Saved Yet</h3>
                  <p>
                    Once you take an assessment or complete an examination across any discipline,
                    your verified score, test outcomes, candidate answers, and tamper-proof proctoring history will be permanently saved here.
                  </p>
                  <button
                    type="button"
                    className="mz-rep-explore-btn"
                    onClick={() => navigate("/coding")}
                  >
                    <span>Go to Courses & Assessments</span>
                    <LuArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="mz-reports-card-grid">
                  {reportsList
                    .filter((rep) => {
                      const isPassScore = rep.passed !== undefined ? Boolean(rep.passed) : (rep.score !== undefined && rep.score >= 80);
                      if (reportFilter === "PASSED" && !isPassScore) return false;
                      if (reportFilter === "FAILED" && isPassScore) return false;
                      if (reportSubjectFilter !== "ALL" && (rep.subjectKey || "coding").toLowerCase() !== reportSubjectFilter.toLowerCase()) return false;
                      if (reportTypeFilter !== "ALL") {
                        const rType = (rep.type || "").toLowerCase();
                        const isMcqAttempt = rType.includes("mcq") || rType.includes("exam") || String(rep.sessionId || "").startsWith("attempt_");
                        const isProjectAttempt = rType.includes("project") || String(rep.sessionId || "").startsWith("proj_sub_");
                        if (reportTypeFilter === "mcq_exam" && !isMcqAttempt) return false;
                        if (reportTypeFilter === "project_assessment" && !isProjectAttempt) return false;
                        if (reportTypeFilter === "coding_assessment" && (isMcqAttempt || isProjectAttempt)) return false;
                      }
                      return true;
                    })
                    .map((rep, idx) => {
                      const isPass = rep.passed !== undefined ? Boolean(rep.passed) : rep.score >= 80;
                      const subj = (rep.subjectKey || "coding").toLowerCase();
                      const isMcq = rep.type === "mcq_exam" || String(rep.sessionId || "").startsWith("attempt_");
                      const isProject = rep.type === "project_assessment" || String(rep.sessionId || "").startsWith("proj_sub_");

                      return (
                        <div key={rep.sessionId || idx} className="mz-saved-report-card">
                          <div className="mz-rep-card-header">
                            <div className="mz-rep-card-tags">
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background:
                                    subj === "language"
                                      ? "rgba(16, 185, 129, 0.15)"
                                      : subj === "driving"
                                      ? "rgba(245, 158, 11, 0.15)"
                                      : subj === "fitness"
                                      ? "rgba(168, 85, 247, 0.15)"
                                      : "rgba(59, 130, 246, 0.15)",
                                  color:
                                    subj === "language"
                                      ? "#34d399"
                                      : subj === "driving"
                                      ? "#fbbf24"
                                      : subj === "fitness"
                                      ? "#c084fc"
                                      : "#60a5fa",
                                  border: "1px solid currentColor",
                                }}
                              >
                                {subj.toUpperCase()}
                              </span>
                              <span className="mz-rep-diff-tag mz-rep-diff-medium medium">
                                {isMcq ? "10-MCQ Exam" : isProject ? "Project" : "Practical"}
                              </span>
                              <span className={`mz-rep-status-badge ${isPass ? "passed" : "failed"}`}>
                                {isPass ? <LuCircleCheck size={12} /> : null}
                                {isProject
                                  ? isPass
                                    ? "PROJECT COMPLETED"
                                    : "Needs Improvement"
                                  : isPass
                                  ? "Passed"
                                  : "Evaluated"}
                              </span>
                            </div>
                            <div className={`mz-rep-grade-pill grade-${(rep.grade || "F").toLowerCase().replace("+", "-plus")}`}>
                              {rep.grade || "F"}
                            </div>
                          </div>

                          <h3 className="mz-rep-card-title">
                            {rep.assessmentTitle || rep.questionTitle || "Proctored Assessment"}
                          </h3>

                          <div className="mz-rep-metrics-list">
                            <div className="mz-rep-metric-row">
                              <span className="mz-rep-metric-label"><LuUser size={13} /> Candidate</span>
                              <span className="mz-rep-metric-value">{rep.candidateDetails?.fullName || user?.fullName || user?.username || "Candidate"}</span>
                            </div>
                            <div className="mz-rep-metric-row">
                              <span className="mz-rep-metric-label"><LuAward size={13} /> Final Score</span>
                              <span className="mz-rep-metric-value mz-bold-score bold-score">
                                {isProject
                                  ? `${rep.marksObtained ?? rep.score ?? 0}/${rep.totalMarks || 100} Marks (${rep.percentage ?? rep.score ?? 0}% • ${rep.passedTests ?? 0}/${rep.totalTests ?? 6} Tests)`
                                  : `${rep.score || 0}% (${rep.passedTests ?? rep.score ?? 0}/{rep.totalTests ?? rep.totalQuestions ?? 10} ${isMcq ? "Correct" : "Tests Passed"})`}
                              </span>
                            </div>
                            <div className="mz-rep-metric-row">
                              <span className="mz-rep-metric-label"><LuClock size={13} /> Time Spent</span>
                              <span className="mz-rep-metric-value">
                                {rep.durationSeconds ? `${Math.floor(rep.durationSeconds / 60)}m ${rep.durationSeconds % 60}s` : "Timed"}
                              </span>
                            </div>
                            <div className="mz-rep-metric-row">
                              <span className="mz-rep-metric-label"><LuCalendar size={13} /> Submitted</span>
                              <span className="mz-rep-metric-value">
                                {rep.submittedAt ? new Date(rep.submittedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                              </span>
                            </div>
                          </div>

                          <div className="mz-rep-card-footer">
                            <span className="mz-rep-anomaly-pill">
                              {rep.violationsCount === 0 ? "0 Proctoring Anomalies" : `${rep.violationsCount} Anomaly Logged`}
                            </span>
                            <button
                              type="button"
                              className="mz-rep-view-report-btn"
                              onClick={() => navigate(rep.reportUrl || `/assessment-report/${rep.sessionId}`)}
                            >
                              <span>View Report</span>
                              <LuExternalLink size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : activeNavTab === "recordings" ? (
            <div className="mz-reports-page-wrapper" data-testid="recordings-full-page">
              {/* Top Banner */}
              <div className="mz-reports-top-banner">
                <div className="mz-reports-top-info">
                  <div className="mz-reports-badge-pill" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                    <LuVideo size={14} /> Cloud Recorded Video Meetings
                  </div>
                  <h1 className="mz-reports-main-heading">
                    Meeting <span className="mz-hero-gradient-text">Recordings</span>
                  </h1>
                  <p className="mz-reports-sub-heading">
                    Review video conferencing recordings, peer discussions, and presentations with searchable bookmarks, playback speeds, and instant sharing.
                  </p>
                </div>

                <div className="mz-reports-header-stats">
                  <div className="mz-rep-stat-box">
                    <span className="mz-rep-stat-val">{recordingsList.length}</span>
                    <span className="mz-rep-stat-lbl">Total Sessions</span>
                  </div>
                  <div className="mz-rep-stat-box" style={{ background: "#f8fafc" }}>
                    <span className="mz-rep-stat-val">
                      {Math.floor(recordingsList.reduce((acc, r) => acc + (r.durationSeconds || 0), 0) / 60)}m
                    </span>
                    <span className="mz-rep-stat-lbl">Recorded Time</span>
                  </div>
                  <div className="mz-rep-stat-box" style={{ minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <LuHardDrive size={13} color="#2563eb" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        {(recordingsAnalytics.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB / 5.0 GB
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(3, Math.round((recordingsAnalytics.totalSizeBytes / (recordingsAnalytics.storageQuotaBytes || 5368709120)) * 100)))}%`,
                          height: "100%",
                          background: "#2563eb",
                        }}
                      />
                    </div>
                    <span className="mz-rep-stat-lbl" style={{ marginTop: 4 }}>Cloud Storage</span>
                  </div>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "14px 18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                {/* Search & Date */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: "6px 12px",
                      minWidth: 240,
                    }}
                  >
                    <LuSearch size={14} color="#64748b" />
                    <input
                      type="text"
                      placeholder="Search title, host, or participant..."
                      value={recSearchQuery}
                      onChange={(e) => setRecSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchRecordings()}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: 13,
                        color: "#0f172a",
                        width: "100%",
                      }}
                      data-testid="recordings-search-input"
                    />
                    {recSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setRecSearchQuery("");
                          setTimeout(fetchRecordings, 10);
                        }}
                        style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                      >
                        <LuX size={14} color="#94a3b8" />
                      </button>
                    )}
                  </div>

                  {/* Date Filter Tabs */}
                  <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                    {[
                      { key: "all", label: "All Dates" },
                      { key: "today", label: "Today" },
                      { key: "week", label: "This Week" },
                      { key: "month", label: "This Month" },
                    ].map((df) => (
                      <button
                        key={df.key}
                        type="button"
                        onClick={() => setRecDateFilter(df.key)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 12,
                          fontWeight: recDateFilter === df.key ? 700 : 500,
                          background: recDateFilter === df.key ? "#ffffff" : "transparent",
                          color: recDateFilter === df.key ? "#2563eb" : "#64748b",
                          boxShadow: recDateFilter === df.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        {df.label}
                      </button>
                    ))}
                  </div>

                  {/* Scope Tabs */}
                  <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                    {[
                      { key: "all", label: "All Sessions" },
                      { key: "personal", label: "My Meetings" },
                      { key: "shared", label: "Shared With Me" },
                    ].map((sc) => (
                      <button
                        key={sc.key}
                        type="button"
                        onClick={() => setRecScope(sc.key)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 12,
                          fontWeight: recScope === sc.key ? 700 : 500,
                          background: recScope === sc.key ? "#ffffff" : "transparent",
                          color: recScope === sc.key ? "#2563eb" : "#64748b",
                          boxShadow: recScope === sc.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Sort & Action */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <select
                    value={recSortOrder}
                    onChange={(e) => setRecSortOrder(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: 12.5,
                      color: "#334155",
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="duration_desc">Sort: Longest Duration</option>
                    <option value="duration_asc">Sort: Shortest Duration</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => navigate("/live")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <LuPlus size={14} /> Start New Meeting
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              {isLoadingRecordings && recordingsList.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>Loading cloud recordings...</p>
                </div>
              ) : recordingsList.length === 0 ? (
                <div
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    background: "#ffffff",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 18,
                  }}
                >
                  <LuVideo size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
                  <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                    No meeting recordings found
                  </h3>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
                    {recSearchQuery || recDateFilter !== "all" || recScope !== "all"
                      ? "Try adjusting your search terms or filters."
                      : "Start a Mastery Zone Live session to record video discussions and peer reviews."}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/live")}
                    style={{
                      padding: "8px 18px",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Start New Meeting
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                  }}
                >
                  {recordingsList.map((rec) => {
                    const mins = Math.floor((rec.durationSeconds || 0) / 60);
                    const secs = (rec.durationSeconds || 0) % 60;
                    const durationStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                    const dateStr = new Date(rec.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const sizeMB = ((rec.fileSize || 0) / (1024 * 1024)).toFixed(1);

                    return (
                      <div
                        key={rec.recordingId}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        }}
                        data-testid={`recording-card-${rec.recordingId}`}
                      >
                        {/* Video Thumbnail Area */}
                        <div
                          style={{
                            position: "relative",
                            height: 140,
                            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          onClick={() => setActivePlayingRecording(rec)}
                        >
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: "50%",
                              background: "rgba(37, 99, 235, 0.95)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            }}
                          >
                            <LuPlay size={22} style={{ marginLeft: 2 }} />
                          </div>

                          <span
                            style={{
                              position: "absolute",
                              bottom: 8,
                              right: 8,
                              background: "rgba(0, 0, 0, 0.8)",
                              color: "#ffffff",
                              padding: "2px 7px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {durationStr}
                          </span>

                          <span
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              background: "rgba(34, 197, 94, 0.9)",
                              color: "#ffffff",
                              padding: "2px 7px",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            {rec.status || "Ready"}
                          </span>
                        </div>

                        {/* Details */}
                        <div style={{ padding: "14px 16px", flex: 1 }}>
                          <h4
                            style={{
                              margin: "0 0 6px",
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#0f172a",
                              lineHeight: 1.35,
                              cursor: "pointer",
                            }}
                            onClick={() => setActivePlayingRecording(rec)}
                          >
                            {rec.title}
                          </h4>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 6,
                            }}
                          >
                            <span>Host: <strong>{rec.hostName}</strong></span>
                            <span>•</span>
                            <span>{rec.participantsCount || 1} participant(s)</span>
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "#94a3b8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>Recorded on {dateStr}</span>
                            <span>{sizeMB} MB</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            padding: "10px 14px",
                            borderTop: "1px solid #f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#fafafa",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setActivePlayingRecording(rec)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              border: "none",
                              background: "#2563eb",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                            data-testid={`play-recording-${rec.recordingId}`}
                          >
                            <LuPlay size={13} /> Play
                          </button>

                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleShareRecording(rec)}
                              style={{
                                border: "1px solid #e2e8f0",
                                background: "#ffffff",
                                color: "#475569",
                                padding: "5px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                              title="Share Link"
                              data-testid={`share-recording-${rec.recordingId}`}
                            >
                              <LuShare2 size={13} />
                            </button>
                            <a
                              href={rec.fileUrl}
                              download={`${rec.title || "recording"}.webm`}
                              style={{
                                border: "1px solid #e2e8f0",
                                background: "#ffffff",
                                color: "#475569",
                                padding: "5px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                textDecoration: "none",
                              }}
                              title="Download Video"
                            >
                              <LuDownload size={13} />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setRenameModalRecording(rec);
                                setRenameInput(rec.title);
                              }}
                              style={{
                                border: "1px solid #e2e8f0",
                                background: "#ffffff",
                                color: "#475569",
                                padding: "5px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                              title="Rename Recording"
                            >
                              <LuPencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecording(rec.recordingId)}
                              style={{
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#dc2626",
                                padding: "5px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                              title="Delete Recording"
                            >
                              <LuTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeNavTab === "certifications" ? (
            <div className="mz-reports-page-wrapper" data-testid="certifications-full-page">
              {/* Top Banner */}
              <div className="mz-reports-top-banner">
                <div className="mz-reports-top-info">
                  <div
                    className="mz-reports-badge-pill"
                    style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}
                  >
                    <LuAward size={14} /> Official Verified Credentials
                  </div>
                  <h1 className="mz-reports-title">Certifications & Assessment History</h1>
                  <p className="mz-reports-subtitle">
                    Review your proctored assessment attempts, examination transcripts, and officially verified credentials.
                  </p>
                </div>

                <div className="mz-reports-top-stats" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div className="mz-stat-pill">
                    <span className="mz-stat-label">Total Attempts</span>
                    <strong className="mz-stat-value">{certHistory.attempts?.length || 0}</strong>
                  </div>
                  <div className="mz-stat-pill">
                    <span className="mz-stat-label">Earned Credentials</span>
                    <strong className="mz-stat-value" style={{ color: "#16a34a" }}>
                      {certHistory.certificates?.length || 0}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCertExamModal({
                        id: "dsa_cert",
                        name: "Data Structures & Algorithms (DSA)",
                      })
                    }
                    style={{
                      padding: "8px 16px",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
                    }}
                  >
                    <LuAward size={15} /> Take DSA Assessment 🚀
                  </button>
                </div>
              </div>

              {/* AREA A: EARNED CERTIFICATES */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                      🏆 My Earned Certificates ({certHistory.certificates?.length || 0})
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                      High-resolution vector PDF certificates verified via unique credential IDs.
                    </p>
                  </div>
                </div>

                {certHistory.certificates?.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                      gap: 18,
                    }}
                  >
                    {certHistory.certificates.map((cert) => {
                      const verifyUrl =
                        cert.verificationUrl ||
                        `${window.location.origin}/verify/${cert.certificateId}`;
                      const shareLinkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        verifyUrl
                      )}`;
                      const issueDateStr = cert.issueDate
                        ? new Date(cert.issueDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Issued";

                      return (
                        <div
                          key={cert.certificateId}
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: 14,
                            padding: 20,
                            boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                              }}
                            >
                              <span
                                style={{
                                  background: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                  color: "#15803d",
                                  padding: "3px 10px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <LuCircleCheck size={13} /> VERIFIED CREDENTIAL
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontFamily: "monospace",
                                  color: "#64748b",
                                  fontWeight: 600,
                                }}
                              >
                                {cert.certificateId}
                              </span>
                            </div>

                            <h3
                              style={{
                                fontSize: 17,
                                fontWeight: 800,
                                color: "#0f172a",
                                margin: "0 0 6px",
                              }}
                            >
                              {cert.certificationTitle}
                            </h3>
                            <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>
                              Issued to: <strong>{cert.recipientName}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                              Issued on: {issueDateStr}
                            </div>
                          </div>

                          <div
                            style={{
                              borderTop: "1px solid #f1f5f9",
                              paddingTop: 12,
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <a
                              href={`${API_BASE}/api/certifications/certificate/${cert.certificateId}/download`}
                              download
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "7px 12px",
                                borderRadius: 6,
                                background: "#2563eb",
                                color: "#ffffff",
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <LuDownload size={13} /> Download PDF
                            </a>

                            <a
                              href={shareLinkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "7px 12px",
                                borderRadius: 6,
                                background: "#0a66c2",
                                color: "#ffffff",
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <LuShare2 size={13} /> LinkedIn
                            </a>

                            <a
                              href={`/verify/${cert.certificateId}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "7px 12px",
                                borderRadius: 6,
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <LuExternalLink size={13} /> Verify
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px dashed #cbd5e1",
                      borderRadius: 14,
                      padding: "36px 20px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: "#faf5ff",
                        color: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px",
                      }}
                    >
                      <LuAward size={24} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                      No Earned Credentials Yet
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        maxWidth: 480,
                        margin: "0 auto 16px",
                        lineHeight: 1.5,
                      }}
                    >
                      Pass the 20 randomized multiple-choice questions (≥80%) and solve both algorithmic coding challenges under live proctoring to earn your verified Mastery Zone Certificate.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCertExamModal({
                          id: "dsa_cert",
                          name: "Data Structures & Algorithms (DSA)",
                        })
                      }
                      style={{
                        padding: "9px 20px",
                        background: "#7c3aed",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Start DSA Certification Assessment 🚀
                    </button>
                  </div>
                )}
              </div>

              {/* AREA B: MY CERTIFICATION ATTEMPTS */}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>
                  📋 Assessment Attempts & Proctoring Audit ({certHistory.attempts?.length || 0})
                </h2>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
                  Complete log of each session, MCQ scores, coding challenges status, and proctoring compliance.
                </p>

                {certHistory.attempts?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {certHistory.attempts.map((att) => {
                      const isPassed = att.status === "PASSED";
                      const isInProgress = att.status === "IN_PROGRESS";
                      const isFailed = att.status === "FAILED";
                      const score = att.score || {};
                      const proctoring = att.proctoring || {};
                      const dateStr = att.startTime
                        ? new Date(att.startTime).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Recent";

                      return (
                        <div
                          key={att.attemptId}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: "16px 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 14,
                          }}
                        >
                          <div style={{ minWidth: 220 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <strong style={{ fontSize: 14.5, color: "#0f172a" }}>
                                {att.certTitle || "DSA Certification"} • Attempt #{att.attemptNumber || 1}
                              </strong>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                  background: isPassed
                                    ? "#dcfce7"
                                    : isInProgress
                                    ? "#dbeafe"
                                    : "#fee2e2",
                                  color: isPassed
                                    ? "#166534"
                                    : isInProgress
                                    ? "#1e40af"
                                    : "#991b1b",
                                }}
                              >
                                {att.status}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              Started on {dateStr}
                            </div>
                          </div>

                          {/* Scores & Proctoring Telemetry */}
                          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ fontSize: 12.5 }}>
                              <div style={{ color: "#64748b", fontSize: 11 }}>Part A: MCQs</div>
                              <strong style={{ color: score.mcqPassed ? "#16a34a" : "#dc2626" }}>
                                {score.mcqScore ?? 0} / {score.mcqTotal ?? 20} ({score.mcqPercentage ?? 0}%)
                              </strong>
                            </div>

                            <div style={{ fontSize: 12.5 }}>
                              <div style={{ color: "#64748b", fontSize: 11 }}>Part B: Coding</div>
                              <strong style={{ color: score.codingPassed ? "#16a34a" : "#475569" }}>
                                Q1: {score.codingQ1Solved ? "✓ Solved" : "✗"} • Q2:{" "}
                                {score.codingQ2Solved ? "✓ Solved" : "✗"}
                              </strong>
                            </div>

                            <div style={{ fontSize: 12.5 }}>
                              <div style={{ color: "#64748b", fontSize: 11 }}>Proctoring</div>
                              <span
                                style={{
                                  color: (proctoring.violationsCount || 0) === 0 ? "#16a34a" : "#d97706",
                                  fontWeight: 600,
                                }}
                              >
                                {(proctoring.violationsCount || 0) === 0
                                  ? "Compliant ✓"
                                  : `${proctoring.violationsCount} Flag(s)`}
                              </span>
                            </div>
                          </div>

                          {/* Action */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {!isInProgress && (
                              <button
                                type="button"
                                onClick={() => navigate(`/assessment-report/${att.attemptId}`)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  background: "#f8fafc",
                                  border: "1px solid #cbd5e1",
                                  color: "#334155",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <LuFileText size={13} /> View Report
                              </button>
                            )}

                            {isInProgress ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCertExamModal({
                                    id: att.certId,
                                    name: att.certTitle,
                                  })
                                }
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  background: "#2563eb",
                                  color: "#ffffff",
                                  border: "none",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Resume Exam ➔
                              </button>
                            ) : isPassed ? (
                              <a
                                href={`/verify/${att.certificateId}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  background: "#dcfce7",
                                  border: "1px solid #86efac",
                                  color: "#166534",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  textDecoration: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <LuCircleCheck size={13} /> Certificate
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCertExamModal({
                                    id: att.certId,
                                    name: att.certTitle,
                                  })
                                }
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  color: "#334155",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Retake Exam
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 20,
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    No assessment attempts recorded yet.
                  </div>
                )}
              </div>
            </div>
          ) : activeNavTab === "settings" ? (
            <div className="mz-reports-page-wrapper">
              <div className="mz-reports-top-banner">
                <div className="mz-reports-top-info">
                  <div className="mz-reports-badge-pill" style={{ color: "#2563eb", background: "#eff6ff", borderColor: "#bfdbfe" }}>
                    <LuSettings size={14} /> System Configuration
                  </div>
                  <h1 className="mz-reports-main-heading">
                    Platform <span className="mz-hero-gradient-text">Settings</span>
                  </h1>
                  <p className="mz-reports-sub-heading">
                    Manage your candidate preferences, notification channels, security parameters, and account controls.
                  </p>
                </div>
              </div>

              <div style={{ maxWidth: 880, margin: "24px auto", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* 1. Account Details */}
                <div style={{ background: "#ffffff", padding: "24px 28px", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Profile & Candidate Identification</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px" }}>Your verified credentials on Mastery Zone.</p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <div style={{ padding: 14, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Full Name</span>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{user?.fullName || displayName || "Verified Candidate"}</div>
                    </div>
                    <div style={{ padding: 14, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Email Address</span>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{user?.email || localStorage.getItem("userEmail") || "user@masteryzone.com"}</div>
                    </div>
                    <div style={{ padding: 14, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Candidate ID</span>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#2563eb", marginTop: 4 }}>{`CAND-${String(user?._id || user?.id || "7CA59D").slice(-6).toUpperCase()}`}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Notification Preferences */}
                <div style={{ background: "#ffffff", padding: "24px 28px", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Preferences & Notifications</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px" }}>Control notification channels, exam reminders, and progress telemetry.</p>
                  
                  <div className="mz-setting-row" style={{ padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div className="mz-setting-info">
                      <span className="mz-setting-name">Email Notifications</span>
                      <span className="mz-setting-desc">Receive assessment receipts, certificate alerts, and learning track milestones.</span>
                    </div>
                    <label className="mz-switch">
                      <input
                        type="checkbox"
                        checked={preferences.notifications}
                        onChange={(e) => handlePreferenceChange("notifications", e.target.checked)}
                      />
                      <span className="mz-slider" />
                    </label>
                  </div>

                  <div className="mz-setting-row" style={{ padding: "14px 0" }}>
                    <div className="mz-setting-info">
                      <span className="mz-setting-name">Compiler Test Passed Audio Chime</span>
                      <span className="mz-setting-desc">Play subtle confirmation tone when all test cases pass in the compiler.</span>
                    </div>
                    <label className="mz-switch">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                      />
                      <span className="mz-slider" />
                    </label>
                  </div>
                </div>

                {/* 3. Security & Account Controls */}
                <div style={{ background: "#ffffff", padding: "24px 28px", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Security & Account Controls</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px" }}>Manage password security and permanent account removal.</p>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                    <button
                      type="button"
                      className="mz-report-btn mz-report-btn-secondary"
                      onClick={() => navigate("/forgot-password")}
                      style={{ padding: "9px 18px", fontSize: "13px" }}
                    >
                      Reset Password
                    </button>
                    <button
                      type="button"
                      className="mz-report-btn"
                      onClick={handleDeleteAccount}
                      style={{ padding: "9px 18px", fontSize: "13px", color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeNavTab === "home" ? (
            <div className="mz-content-columns">
              <div className="mz-center-column" style={{ flex: 1, maxWidth: "100%" }}>
                {/* Home Header / Greeting */}
                <div
                  className="mz-section-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <h2 className="mz-section-title" style={{ fontSize: "1.65rem", fontWeight: 800 }}>
                      Welcome back, {user?.fullName || user?.username || "Learner"} 👋
                    </h2>
                    <p className="mz-section-subtitle" style={{ fontSize: "0.95rem" }}>
                      Track your engineering progress, resume active projects, and conquer daily algorithmic challenges.
                    </p>
                  </div>

                  {user && (
                    <div
                      onClick={() => navigate("/profile")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#ffffff",
                        padding: "6px 14px 6px 8px",
                        borderRadius: 30,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      title="View & Edit Profile"
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: "#3b82f6",
                        }}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Avatar"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          (user.fullName || user.username || "U")[0]?.toUpperCase()
                        )}
                      </div>
                      <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                          {user.fullName || user.username}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: 600 }}>
                          Active Profile →
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hero Spotlight: Active Learning Track */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
                    border: "1px solid #bfdbfe",
                    borderRadius: 20,
                    padding: "28px 32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                    marginBottom: 28,
                    boxShadow: "0 4px 20px rgba(59, 130, 246, 0.08)",
                  }}
                >
                  <div style={{ maxWidth: 560 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dbeafe", color: "#1e40af", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, marginBottom: 12 }}>
                      <LuSparkles size={14} /> Active Learning Track: {selectedItem ? selectedItem.title : "Coding"}
                    </div>
                    <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                      {selectedItem?.title || "Coding"} Engineering Hub
                    </h3>
                    <p style={{ color: "#475569", fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 20px" }}>
                      {selectedItem?.description || "Build real full-stack projects, solve algorithmic problems, and earn verifiable certifications."}
                    </p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="mz-report-btn mz-report-btn-primary"
                        onClick={() => navigate(selectedItem?.targetRoute || "/coding")}
                        style={{ padding: "10px 22px", fontSize: "0.92rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        Continue Learning <LuArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        className="mz-report-btn mz-report-btn-secondary"
                        onClick={() => navigate("/select-interests")}
                        style={{ padding: "10px 18px", fontSize: "0.88rem", display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <LuTarget size={15} /> Switch Track
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
                    <img
                      src={selectedItem?.illustration || codingIllustration}
                      alt="Track Illustration"
                      style={{ width: 140, height: 140, objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.12))" }}
                    />
                  </div>
                </div>

                {/* Quick Launch Cards (4 Grid Items) */}
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>
                  Quick Launchpad
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 28 }}>
                  {/* Card 1: Challenges */}
                  <div
                    onClick={() => navigate("/coding")}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 20,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <LuCodeXml size={22} />
                    </div>
                    <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                      Algorithmic Challenges
                    </h4>
                    <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                      135 challenges with real-time compilers and automated test suites.
                    </p>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Solve Challenges <LuArrowRight size={14} />
                    </span>
                  </div>

                  {/* Card 2: Projects */}
                  <div
                    onClick={() => navigate("/coding")}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 20,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <LuFolderGit2 size={22} />
                    </div>
                    <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                      Industry Projects
                    </h4>
                    <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                      Guided milestone projects with in-browser multi-file workspaces.
                    </p>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#059669", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Open Projects <LuArrowRight size={14} />
                    </span>
                  </div>

                  {/* Card 3: Assessment Reports */}
                  <div
                    onClick={() => navigate("/reports")}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 20,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <LuFileText size={22} />
                    </div>
                    <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                      Assessment Reports
                    </h4>
                    <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                      Review verified code solutions, audit trails, and test execution history.
                    </p>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#4f46e5", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      View Reports ({reportsList.length}) <LuArrowRight size={14} />
                    </span>
                  </div>

                  {/* Card 4: Live Meeting Platform */}
                  <div
                    onClick={() => navigate("/live")}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 20,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <LuVideo size={22} />
                    </div>
                    <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                      Live Study Groups
                    </h4>
                    <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                      Real-time audio, HD video, screen sharing, and collaborative code chat.
                    </p>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#7c3aed", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Start Meeting <LuArrowRight size={14} />
                    </span>
                  </div>
                </div>

                {/* Metrics Summary Strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16,
                    padding: "20px 24px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    marginBottom: 32,
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Active Track</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                      {selectedItem?.title || "Coding"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Total Reports</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2563eb" }}>
                      {reportsList.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Recorded Sessions</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#059669" }}>
                      {recordingsList.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Official Certificates</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#7c3aed" }}>
                      {certHistory.certificates?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mz-content-columns">
            {/* Left Column: Interest Cards */}
            <div className="mz-center-column">
              {/* Section Header: Choose Your Interest Track */}
              <div
                className="mz-section-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <h2 className="mz-section-title">Choose Your Interest Track</h2>
                  <p className="mz-section-subtitle">
                    Select one interest that excites you. You can change this anytime.
                  </p>
                </div>

                {user && (
                  <div
                    onClick={() => navigate("/profile")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "#ffffff",
                      padding: "6px 14px 6px 8px",
                      borderRadius: 30,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="View & Edit Profile"
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #3b82f6",
                        flexShrink: 0,
                      }}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={displayName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <LuUser size={18} color="#2563eb" />
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                        {displayName}
                      </span>
                      <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>Active Profile ➔</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2x2 Grid of Interest Cards */}
              <div className="mz-cards-grid">
                {filteredCards.length > 0 ? (
                  filteredCards.map((card, idx) => {
                    const isSelected = selectedInterest === card.key;

                    return (
                      <div
                        key={card.key}
                        className={`mz-interest-card mz-card-anim-${idx + 1} ${
                          isSelected ? "selected" : ""
                        }`}
                        style={{
                          "--card-active-border": card.activeBorder,
                          "--card-active-glow": card.activeGlow,
                          "--card-check-bg": card.checkBg,
                        }}
                        onClick={() => handleSelectInterest(card.key)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectInterest(card.key);
                          }
                        }}
                      >
                        {/* Top Row: Crisp Vector Logo Badge & Checkmark Indicator */}
                        <div className="mz-card-top-row">
                          <InterestBadge type={card.key} />

                          <div
                            className={`mz-card-checkbox ${isSelected ? "checked" : ""}`}
                            style={{
                              backgroundColor: isSelected ? card.checkBg : "#ffffff",
                              borderColor: isSelected ? card.checkBg : "#cbd5e1",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectInterest(card.key);
                            }}
                          >
                            {isSelected && <LuCheck size={14} className="mz-check-icon" />}
                          </div>
                        </div>

                        {/* Card Content & Sharpened 3D Illustration */}
                        <div className="mz-card-body-row">
                          <div className="mz-card-text-col">
                            <h3 className="mz-card-title">{card.title}</h3>
                            <p className="mz-card-desc">{card.description}</p>

                            {/* Skill Tags */}
                            <div className="mz-card-tags">
                              {card.tags.map((tag) => (
                                <span key={tag} className="mz-card-tag-pill">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mz-card-illus-col">
                            <img
                              src={card.illustration}
                              alt={`${card.title} 3D illustration`}
                              className="mz-card-3d-img"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mz-no-results-box">
                    <p>No interests match "{searchQuery}"</p>
                    <button
                      type="button"
                      className="mz-reset-search-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      Show All Interests
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Continue Action */}
              <div className="mz-bottom-actions mz-bottom-single-action single-action">
                <button
                  type="button"
                  className={`mz-btn-continue ${isSubmitting ? "is-loading" : ""}`}
                  onClick={handleContinue}
                  disabled={isSubmitting}
                  title="Continue to training track"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mz-btn-spinner" aria-hidden="true" />
                      <span>Saving Focus...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <LuArrowRight size={17} className="mz-continue-arrow" />
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Right Column: Selected Summary Panel */}
            <aside className="mz-right-panel">
              {/* Section 1: Selected Interest Box */}
              <div className="mz-summary-card">
                <div className="mz-summary-header">
                  <div className="mz-summary-title-wrap">
                    <span className="mz-summary-icon-box">
                      <LuTarget size={18} />
                    </span>
                    <h4 className="mz-summary-title">Selected Interests</h4>
                  </div>
                  <span
                    className={`mz-summary-count-badge ${pulseBadge ? "mz-badge-pulse" : ""}`}
                  >
                    {selectedInterest ? 1 : 0} of 1
                  </span>
                </div>

                <div className="mz-selected-list">
                  {selectedItem ? (
                    <div className="mz-selected-row">
                      <div className="mz-selected-row-left">
                        <InterestBadge type={selectedItem.key} className="mini" />
                        <span className="mz-selected-name">{selectedItem.title}</span>
                      </div>
                      <button
                        type="button"
                        className="mz-remove-btn"
                        onClick={handleDeselect}
                        title={`Remove ${selectedItem.title}`}
                        aria-label={`Remove ${selectedItem.title}`}
                      >
                        <LuX size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="mz-selected-empty">
                      <p>No interest selected</p>
                      <span>Click an interest card to select</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Why It Matters Box */}
              <div className="mz-why-matters-card">
                <h4 className="mz-why-title">Why it matters?</h4>
                <ul className="mz-why-list">
                  <li className="mz-why-item">
                    <LuCircleCheck className="mz-why-check" size={17} />
                    <span>Get personalized recommendations</span>
                  </li>
                  <li className="mz-why-item">
                    <LuCircleCheck className="mz-why-check" size={17} />
                    <span>See relevant learning paths</span>
                  </li>
                  <li className="mz-why-item">
                    <LuCircleCheck className="mz-why-check" size={17} />
                    <span>Track your progress in your favorite area</span>
                  </li>
                </ul>
              </div>

              {/* Section 3: Motivation Card with 3D Rocket */}
              <div className="mz-promo-card">
                <div className="mz-promo-rocket-wrap">
                  <img src={rocketIcon} alt="Rocket icon" className="mz-promo-rocket-img" />
                </div>
                <div className="mz-promo-text-wrap">
                  <h5 className="mz-promo-heading">Your goals. Our guidance.</h5>
                  <p className="mz-promo-subheading">Let's build your future together.</p>
                </div>
              </div>
            </aside>
          </div>
          )}
        </main>
      </div>

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

      {/* ================= LOG ACTIVITY MODAL WITH CONFIRMATION SCREEN ================= */}
      {isLogActivityModalOpen && (
        <div className="mz-modal-backdrop" onClick={handleCloseLogActivityModal}>
          <div
            className="mz-modal-box mz-log-activity-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: isLogConfirmed ? "460px" : "540px" }}
          >
            {isLogConfirmed && confirmedActivityData ? (
              /* Confirmation Success Screen */
              <div className="mz-log-confirm-view" data-testid="log-activity-confirmation-screen">
                <div className="mz-log-confirm-badge">
                  <LuCircleCheck size={36} color="#10b981" />
                </div>
                <h3 className="mz-log-confirm-title">Activity Logged Successfully!</h3>
                <p className="mz-log-confirm-sub">Your progress and experience points have been verified and saved to your profile.</p>

                <div className="mz-log-confirm-summary-card">
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Learning Track</span>
                    <span className="mz-log-confirm-val mz-track-pill">{confirmedActivityData.track}</span>
                  </div>
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Activity Type</span>
                    <span className="mz-log-confirm-val">{confirmedActivityData.task}</span>
                  </div>
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Topic / Lesson</span>
                    <span className="mz-log-confirm-val" style={{ fontWeight: 600 }}>{confirmedActivityData.moduleName}</span>
                  </div>
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Duration</span>
                    <span className="mz-log-confirm-val">{confirmedActivityData.hoursSpent} hrs</span>
                  </div>
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Earned XP</span>
                    <span className="mz-log-confirm-val mz-xp-tag">+{confirmedActivityData.xpEarned} XP</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mz-modal-btn-confirm"
                  style={{ width: "100%", marginTop: "20px", padding: "12px", borderRadius: "12px" }}
                  onClick={handleCloseLogActivityModal}
                >
                  Done
                </button>
              </div>
            ) : (
              /* Log Activity Input Form */
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <LuPlus size={20} />
                    </div>
                    <div>
                      <h3 className="mz-modal-title" style={{ margin: 0, fontSize: "17px" }}>Log Learning Activity</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Record verified lessons, study hours, or workouts</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mz-search-clear-btn"
                    onClick={handleCloseLogActivityModal}
                    title="Close"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                  >
                    <LuX size={18} />
                  </button>
                </div>

                <form onSubmit={handleLogActivitySubmit} className="mz-p-modal-form">
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Learning Track
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                      {[
                        { key: "CODING", name: "Coding" },
                        { key: "LANGUAGE", name: "Language" },
                        { key: "VEHICLES", name: "Vehicles" },
                        { key: "FITNESS", name: "Gym & Fitness" },
                      ].map((t) => (
                        <button
                          type="button"
                          key={t.key}
                          onClick={() => setLogActivityForm({ ...logActivityForm, track: t.key })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            border: logActivityForm.track === t.key ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                            background: logActivityForm.track === t.key ? "#eff6ff" : "#ffffff",
                            color: logActivityForm.track === t.key ? "#2563eb" : "#475569",
                            fontWeight: logActivityForm.track === t.key ? 700 : 500,
                            cursor: "pointer",
                            fontSize: "13px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <InterestBadge type={t.key === "FITNESS" ? "GYM" : t.key === "VEHICLES" ? "VECHILES" : t.key} />
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Activity Type
                    </label>
                    <select
                      className="mz-search-bar-input"
                      style={{ padding: "8px 12px", borderRadius: "10px", width: "100%", background: "#f8fafc", boxSizing: "border-box" }}
                      value={logActivityForm.task}
                      onChange={(e) => setLogActivityForm({ ...logActivityForm, task: e.target.value })}
                    >
                      <option value="Completed a lesson">Completed a lesson</option>
                      <option value="Joined study group">Joined study group</option>
                      <option value="Workout logged">Workout logged</option>
                      <option value="Learned new vocabulary">Learned new vocabulary</option>
                      <option value="Practice session completed">Practice session completed</option>
                      <option value="Module exam passed">Module exam passed</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Lesson / Topic Name
                    </label>
                    <input
                      type="text"
                      className="mz-search-bar-input"
                      style={{ padding: "8px 12px", borderRadius: "10px", width: "100%", background: "#f8fafc", boxSizing: "border-box" }}
                      placeholder="e.g. Python - Control Flow & Conditionals"
                      value={logActivityForm.moduleName}
                      onChange={(e) => setLogActivityForm({ ...logActivityForm, moduleName: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        Study Hours
                      </label>
                      <select
                        className="mz-search-bar-input"
                        style={{ padding: "8px 12px", borderRadius: "10px", width: "100%", background: "#f8fafc", boxSizing: "border-box" }}
                        value={logActivityForm.hoursSpent}
                        onChange={(e) => setLogActivityForm({ ...logActivityForm, hoursSpent: e.target.value })}
                      >
                        <option value="0.5">0.5 hrs (30m)</option>
                        <option value="0.75">0.75 hrs (45m)</option>
                        <option value="1.0">1.0 hr (60m)</option>
                        <option value="1.5">1.5 hrs</option>
                        <option value="2.0">2.0 hrs</option>
                        <option value="3.0">3.0 hrs</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        XP Earned
                      </label>
                      <select
                        className="mz-search-bar-input"
                        style={{ padding: "8px 12px", borderRadius: "10px", width: "100%", background: "#f8fafc", boxSizing: "border-box" }}
                        value={logActivityForm.xpEarned}
                        onChange={(e) => setLogActivityForm({ ...logActivityForm, xpEarned: e.target.value })}
                      >
                        <option value="15">+15 XP</option>
                        <option value="20">+20 XP</option>
                        <option value="30">+30 XP</option>
                        <option value="50">+50 XP</option>
                      </select>
                    </div>
                  </div>

                  <div className="mz-modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      className="mz-modal-btn-cancel"
                      onClick={handleCloseLogActivityModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="mz-modal-btn-confirm"
                      disabled={isLoggingActivity}
                    >
                      {isLoggingActivity ? "Saving..." : "Log Activity"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= APP SETTINGS MODAL ================= */}
      {isSettingsModalOpen && (
        <div className="mz-modal-backdrop" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="mz-modal-box mz-settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="mz-modal-title">App Settings</h2>

            <div className="mz-setting-row">
              <div className="mz-setting-info">
                <span className="mz-setting-name">Email Notifications</span>
                <span className="mz-setting-desc">Receive updates about your learning tracks</span>
              </div>
              <label className="mz-switch">
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => handlePreferenceChange("notifications", e.target.checked)}
                />
                <span className="mz-slider" />
              </label>
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
      {/* ================= IN-BROWSER VIDEO PLAYBACK MODAL ================= */}
      {activePlayingRecording && (
        <div
          className="mz-modal-backdrop"
          style={{ zIndex: 99999, background: "rgba(15, 23, 42, 0.88)" }}
          onClick={() => setActivePlayingRecording(null)}
          data-testid="home-video-player-modal"
        >
          <div
            className="mz-modal-box"
            style={{
              maxWidth: 880,
              width: "94%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 22,
              background: "#0f172a",
              color: "#ffffff",
              border: "1px solid #334155",
              borderRadius: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f8fafc" }}>
                  {activePlayingRecording.title}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  Host: {activePlayingRecording.hostName} • {activePlayingRecording.participantsCount || 1} participant(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePlayingRecording(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <LuX size={22} />
              </button>
            </div>

            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                background: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <video
                ref={videoPlayerRef}
                src={activePlayingRecording.fileUrl}
                controls
                autoPlay
                onTimeUpdate={() => {
                  if (videoPlayerRef.current) {
                    const uId = user?._id || user?.id || user?.userId || "guest";
                    localStorage.setItem(
                      `mz_${uId}_rec_seek_${activePlayingRecording.recordingId}`,
                      Math.floor(videoPlayerRef.current.currentTime)
                    );
                  }
                }}
                style={{ width: "100%", maxHeight: 420, outline: "none" }}
                data-testid="home-video-player-element"
              />
            </div>

            {/* Video Controls Toolbar: Speed, Duration, Sharing, Bookmarks */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid #1e293b",
                marginBottom: 14,
              }}
            >
              {/* Playback Speed Switcher */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Speed:</span>
                {[0.5, 1, 1.25, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setPlaybackSpeed(spd);
                      if (videoPlayerRef.current) {
                        videoPlayerRef.current.playbackRate = spd;
                      }
                    }}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: "none",
                      fontSize: 11,
                      fontWeight: 700,
                      background: playbackSpeed === spd ? "#2563eb" : "#1e293b",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleShareRecording(activePlayingRecording)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <LuShare2 size={13} /> Share Link
                </button>
                <a
                  href={activePlayingRecording.fileUrl}
                  download={`${activePlayingRecording.title}.webm`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: "#2563eb",
                    color: "#ffffff",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                  data-testid="home-modal-download-btn"
                >
                  <LuDownload size={13} /> Download
                </a>
              </div>
            </div>

            {/* Chapters & Bookmarks Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Chapters List */}
              <div
                style={{
                  background: "#1e293b",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: "#93c5fd", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <LuClock size={13} /> Chapters
                </div>
                {activePlayingRecording.chapters && activePlayingRecording.chapters.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {activePlayingRecording.chapters.map((ch, idx) => {
                      const m = Math.floor(ch.timestampSeconds / 60);
                      const s = ch.timestampSeconds % 60;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.currentTime = ch.timestampSeconds;
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 6px",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <span style={{ color: "#38bdf8", fontWeight: 700, fontFamily: "monospace" }}>
                            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>{ch.title}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ color: "#64748b" }}>No chapters set</span>
                )}
              </div>

              {/* Bookmarks & Add Bookmark */}
              <div
                style={{
                  background: "#1e293b",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: "#86efac", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <LuBookmark size={13} /> Saved Bookmarks
                </div>
                <div style={{ maxHeight: 90, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                  {activePlayingRecording.bookmarks && activePlayingRecording.bookmarks.length > 0 ? (
                    activePlayingRecording.bookmarks.map((bm, idx) => {
                      const m = Math.floor(bm.timestampSeconds / 60);
                      const s = bm.timestampSeconds % 60;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.currentTime = bm.timestampSeconds;
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "3px 6px",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <span style={{ color: "#4ade80", fontWeight: 700, fontFamily: "monospace" }}>
                            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>{bm.note}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: "#64748b" }}>No custom bookmarks yet</span>
                  )}
                </div>

                {/* Add Bookmark Form */}
                <form onSubmit={handleAddBookmark} style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Bookmark note at current second..."
                    value={newBookmarkNote}
                    onChange={(e) => setNewBookmarkNote(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "1px solid #334155",
                      background: "#0f172a",
                      color: "#ffffff",
                      fontSize: 11,
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Save
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Toast */}
      {shareToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#0f172a",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
            animation: "mzFadeIn 0.2s ease-out",
          }}
        >
          <LuCheck color="#22c55e" size={16} />
          <span>{shareToast}</span>
        </div>
      )}

      {/* ================= RENAME RECORDING MODAL ================= */}
      {renameModalRecording && (
        <div
          className="mz-modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => setRenameModalRecording(null)}
        >
          <div
            className="mz-modal-box"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
            data-testid="home-rename-modal"
          >
            <h3 className="mz-modal-title">Rename Recording</h3>
            <p className="mz-modal-subtitle">
              Enter a new title for this recorded session:
            </p>
            <form onSubmit={handleRenameRecordingSubmit}>
              <input
                type="text"
                className="mz-rename-input"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  marginTop: 10,
                  marginBottom: 16,
                  outline: "none",
                }}
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                autoFocus
                required
                data-testid="home-rename-input"
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="mz-modal-btn-cancel"
                  onClick={() => setRenameModalRecording(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mz-modal-btn-confirm"
                  data-testid="home-confirm-rename-btn"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proctored Certification Exam Workspace Modal */}
      {activeCertExamModal && (
        <CertificationExamWorkspace
          certId={activeCertExamModal.id || "dsa_cert"}
          certTitle={activeCertExamModal.name || "Data Structures & Algorithms (DSA)"}
          onClose={() => setActiveCertExamModal(null)}
          onCompleted={() => {
            setActiveCertExamModal(null);
            fetchCertHistory();
          }}
        />
      )}
    </div>
  );
};

export default Home;

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { LuCircleAlert } from "react-icons/lu";
import MasteryZoneLiveLanding from "./MasteryZoneLiveLanding";
import MasteryZoneLiveMeeting from "./MasteryZoneLiveMeeting";
import MasteryZoneGlobalLoader from "../MasteryZoneGlobalLoader";
import "./masteryZoneLive.css";

const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5012";
    }
    if (window.location.hostname.includes("vercel.app")) {
      return "https://mastery-zone.onrender.com";
    }
    return window.location.origin;
  }
  return "http://localhost:5012";
};

const API_BASE = getBackendUrl();
const SOCKET_SERVER_URL = API_BASE;

export default function MasteryZoneLivePlatform({ initialMeetingId = null }) {
  const params = useParams();
  const navigate = useNavigate();
  const meetingIdFromRoute = initialMeetingId || params?.meetingId || null;

  const [activeMeetingId, setActiveMeetingId] = useState(meetingIdFromRoute);
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [meetingError, setMeetingError] = useState(null);
  const [isValidatingMeeting, setIsValidatingMeeting] = useState(Boolean(meetingIdFromRoute));

  // 1. Fetch authenticated user profile
  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token") || "";

    async function fetchUser() {
      try {
        if (token) {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (active && data?.user) {
              const u = data.user;
              const name = u.fullName || u.username || u.name || localStorage.getItem("userName") || "Learner";
              const email = u.email || localStorage.getItem("userEmail") || "learner@masteryzone.com";
              const avatar = u.avatar || u.avatarUrl || "";
              setCurrentUser({ ...u, name, fullName: u.fullName || name, email, avatar });
              setIsLoadingUser(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
      }

      // Guest / Fallback user with persistent session identity
      if (active) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            const name = u.fullName || u.username || u.name || localStorage.getItem("userName") || "Learner";
            const email = u.email || localStorage.getItem("userEmail") || "learner@masteryzone.com";
            const avatar = u.avatar || u.avatarUrl || "";
            setCurrentUser({ ...u, name, fullName: u.fullName || name, email, avatar });
            setIsLoadingUser(false);
            return;
          } catch {}
        }

        let persistentGuest = null;
        try {
          const raw = localStorage.getItem("mz_persistent_guest");
          if (raw) persistentGuest = JSON.parse(raw);
        } catch {}

        if (!persistentGuest || !persistentGuest._id) {
          persistentGuest = {
            _id: "guest_" + Math.random().toString(36).substring(2, 10),
            fullName: "Guest User",
            username: "guest_user",
            email: "guest@masteryzone.com",
          };
          localStorage.setItem("mz_persistent_guest", JSON.stringify(persistentGuest));
        }

        setCurrentUser(persistentGuest);
        setIsLoadingUser(false);
      }
    }

    fetchUser();
    return () => {
      active = false;
    };
  }, []);

  // 2. Initialize Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const s = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    s.on("connect", () => {
      console.log("⚡ Mastery Zone Live Socket connected:", s.id);
      if (currentUser) {
        s.emit("register_user_session", {
          token,
          userId: currentUser._id || currentUser.id,
        });
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [currentUser]);

  // Validate and sync route param changes for meeting links and browser refreshes
  useEffect(() => {
    let active = true;
    if (!meetingIdFromRoute) {
      setActiveMeetingId(null);
      setMeetingError(null);
      setIsValidatingMeeting(false);
      return;
    }

    async function validateAndJoinMeeting() {
      setIsValidatingMeeting(true);
      setMeetingError(null);
      try {
        const token = localStorage.getItem("token") || "";
        let cleanCode = String(meetingIdFromRoute || "").trim().toLowerCase();
        if (cleanCode.includes("/meeting/")) {
          cleanCode = cleanCode.split("/meeting/").pop().split("?")[0].split("/")[0];
        }

        // Validate meeting exists and check status on server
        let res;
        try {
          res = await fetch(`${API_BASE}/api/meetings/${cleanCode}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        } catch {
          res = await fetch(`/api/meetings/${cleanCode}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }

        if (!active) return;

        const data = await res.json().catch(() => ({}));

        if (res.status === 404) {
          setMeetingError({
            type: "not_found",
            title: "Meeting Not Found",
            message: data.message || "The meeting link or ID is invalid or does not exist. Please check your link or start a new meeting.",
          });
          setIsValidatingMeeting(false);
          return;
        }

        if (res.status === 403) {
          setMeetingError({
            type: "forbidden",
            title: "Private Meeting — Access Denied",
            message: data.message || "This is a private meeting session. Only authorized participants or the meeting host can join.",
          });
          setIsValidatingMeeting(false);
          return;
        }

        if (res.status === 401) {
          setMeetingError({
            type: "unauthorized",
            title: "Authentication Required",
            message: data.message || "Please sign in to your Mastery Zone account to join this meeting.",
          });
          setIsValidatingMeeting(false);
          return;
        }

        if (!res.ok) {
          setMeetingError({
            type: "error",
            title: "Unable to Join Meeting",
            message: data.message || data.error || `Server returned HTTP ${res.status} while validating the meeting.`,
          });
          setIsValidatingMeeting(false);
          return;
        }

        if (data.isEnded || data.meeting?.status === "ended") {
          const currentUid = currentUser?._id || currentUser?.id || localStorage.getItem("userId");
          const isHost = String(data.meeting?.hostUserId) === String(currentUid);
          if (!isHost) {
            setMeetingError({
              type: "ended",
              title: "Meeting Has Ended",
              message: "This live collaboration session has concluded and is no longer available to join.",
            });
            setIsValidatingMeeting(false);
            return;
          }
        }

        // Properly register participant in backend
        const effectiveUserName = currentUser?.fullName || currentUser?.username || localStorage.getItem("userName") || "Learner";
        const effectiveUserId = currentUser?._id || currentUser?.id || localStorage.getItem("userId") || "";
        let joinRes = null;
        try {
          try {
            joinRes = await fetch(`${API_BASE}/api/meetings/${cleanCode}/join`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ fullName: effectiveUserName, guestId: effectiveUserId }),
            });
          } catch {
            joinRes = await fetch(`/api/meetings/${cleanCode}/join`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ fullName: effectiveUserName, guestId: effectiveUserId }),
            });
          }
        } catch (jErr) {
          console.warn("Meeting join registration note:", jErr);
        }

        if (joinRes && !joinRes.ok) {
          const joinErrData = await joinRes.json().catch(() => ({}));
          if (active) {
            setMeetingError({
              type: joinRes.status === 403 ? "forbidden" : joinRes.status === 410 ? "ended" : "error",
              title:
                joinRes.status === 403
                  ? "Private Meeting — Access Denied"
                  : joinRes.status === 410
                  ? "Meeting Has Ended"
                  : "Unable to Join Meeting",
              message:
                joinErrData.message ||
                joinErrData.error ||
                "You could not be added to this meeting session.",
            });
            setIsValidatingMeeting(false);
          }
          return;
        }

        if (active) {
          const actualId = data.meeting?.meetingId || cleanCode;
          if (data.isHost) {
            sessionStorage.setItem(`mz_host_${actualId}`, "true");
          }
          setActiveMeetingId(actualId);
          setMeetingError(null);
          setIsValidatingMeeting(false);
        }
      } catch (err) {
        if (active) {
          setMeetingError({
            type: "error",
            title: "Unable to Join Meeting",
            message: err.message || "Failed to validate meeting link. Please check your network connection.",
          });
          setIsValidatingMeeting(false);
        }
      }
    }

    if (!isLoadingUser) {
      validateAndJoinMeeting();
    }
    return () => {
      active = false;
    };
  }, [meetingIdFromRoute, isLoadingUser, currentUser]);

  // 3. Action Handlers
  const handleStartMeeting = async ({ title, groupKey }) => {
    if (isActionPending) return;
    setIsActionPending(true);
    try {
      const token = localStorage.getItem("token") || "";
      const effectiveUserId = currentUser?._id || currentUser?.id || localStorage.getItem("userId") || "";
      const effectiveHostName = currentUser?.fullName || currentUser?.username || localStorage.getItem("userName") || "Host";

      const payload = {
        title: title || "Live Practice Session",
        groupKey: groupKey || "dsa",
        userId: effectiveUserId,
        hostName: effectiveHostName,
      };

      let res;
      try {
        res = await fetch(`${API_BASE}/api/meetings/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      } catch (directErr) {
        // Fallback to relative URL if direct API call had connection failure
        res = await fetch("/api/meetings/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || "Failed to create meeting session");
      }

      const data = await res.json().catch(() => ({}));
      const newId = data.meetingId || data.meeting?.meetingId;
      if (!newId) throw new Error("Invalid meeting id returned by server");

      sessionStorage.setItem(`mz_host_${newId}`, "true");
      toast.success(`Meeting created: ${newId}`);
      setActiveMeetingId(newId);
      if (window.location.pathname.startsWith("/live") || window.location.pathname.startsWith("/meeting")) {
        navigate(`/meeting/${newId}`);
      }
      return data;
    } catch (err) {
      toast.error(err.message || "Failed to start meeting");
      throw err;
    } finally {
      setIsActionPending(false);
    }
  };

  const handleJoinMeetingById = async (code) => {
    if (isActionPending) return;
    setIsActionPending(true);
    try {
      let cleanCode = String(code || "").trim().toLowerCase();
      if (cleanCode.includes("/meeting/")) {
        cleanCode = cleanCode.split("/meeting/").pop().split("?")[0].split("/")[0];
      }
      const alphanumeric = cleanCode.replace(/[^a-z0-9]/g, "");
      if (alphanumeric.length === 10) {
        cleanCode = `${alphanumeric.slice(0, 3)}-${alphanumeric.slice(3, 7)}-${alphanumeric.slice(7, 10)}`;
      }

      const token = localStorage.getItem("token") || "";
      const effectiveUserId = currentUser?._id || currentUser?.id || localStorage.getItem("userId") || "";
      const effectiveUserName = currentUser?.fullName || currentUser?.username || localStorage.getItem("userName") || "Learner";

      const payload = {
        fullName: effectiveUserName,
        guestId: effectiveUserId,
      };

      let res;
      try {
        res = await fetch(`${API_BASE}/api/meetings/${cleanCode}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      } catch (directErr) {
        res = await fetch(`/api/meetings/${cleanCode}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || "Could not join meeting");
      }

      const data = await res.json().catch(() => ({}));
      const actualMeetingId = data.meeting?.meetingId || cleanCode;
      if (data.isHost) {
        sessionStorage.setItem(`mz_host_${actualMeetingId}`, "true");
      } else {
        sessionStorage.removeItem(`mz_host_${actualMeetingId}`);
      }
      toast.success(`Joined meeting room: ${actualMeetingId}`);
      setActiveMeetingId(actualMeetingId);
      if (window.location.pathname.startsWith("/live") || window.location.pathname.startsWith("/meeting")) {
        navigate(`/meeting/${actualMeetingId}`);
      }
    } catch (err) {
      toast.error(err.message || "Meeting code invalid or inactive");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleLeaveMeeting = () => {
    try {
      document.querySelectorAll("video, audio").forEach((el) => {
        if (el.srcObject && typeof el.srcObject.getTracks === "function") {
          el.srcObject.getTracks().forEach((t) => {
            try { t.stop(); t.enabled = false; } catch {}
          });
          el.srcObject = null;
        }
      });
    } catch (e) {
      console.warn("Media shutdown warning:", e);
    }
    setActiveMeetingId(null);
    setMeetingError(null);
    if (window.location.pathname.startsWith("/meeting")) {
      navigate("/live", { replace: true });
    }
  };

  const handleNavigateHome = () => {
    navigate("/home", { replace: true });
  };

  if (isLoadingUser || isValidatingMeeting) {
    return (
      <MasteryZoneGlobalLoader
        message={isValidatingMeeting ? "Joining secure meeting room..." : "Loading Mastery Zone Live..."}
      />
    );
  }

  if (meetingError) {
    return (
      <div className="mzl-container" style={{ alignItems: "center", justifyContent: "center", padding: 24, minHeight: "100vh" }}>
        <div style={{ maxWidth: 460, width: "100%", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "36px 28px", textAlign: "center", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <LuCircleAlert size={30} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
            {meetingError.title}
          </h2>
          <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.5, margin: "0 0 24px" }}>
            {meetingError.message}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setMeetingError(null);
                navigate("/live", { replace: true });
              }}
              style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: "#2563eb", color: "#ffffff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
            >
              Live Platform
            </button>
            <button
              type="button"
              onClick={() => navigate("/home", { replace: true })}
              style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mzl-platform-root">
      {activeMeetingId ? (
        <MasteryZoneLiveMeeting
          meetingId={activeMeetingId}
          currentUser={currentUser}
          socket={socket}
          onLeaveMeeting={handleLeaveMeeting}
        />
      ) : (
        <MasteryZoneLiveLanding
          currentUser={currentUser}
          onStartMeeting={handleStartMeeting}
          onJoinMeetingById={handleJoinMeetingById}
          onNavigateHome={handleNavigateHome}
        />
      )}
    </div>
  );
}

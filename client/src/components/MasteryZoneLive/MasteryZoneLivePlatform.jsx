import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import MasteryZoneLiveLanding from "./MasteryZoneLiveLanding";
import MasteryZoneLiveMeeting from "./MasteryZoneLiveMeeting";
import "./masteryZoneLive.css";

const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5012";
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

  // Sync route param changes
  useEffect(() => {
    if (meetingIdFromRoute) {
      setActiveMeetingId(meetingIdFromRoute);
    }
  }, [meetingIdFromRoute]);

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
    if (window.location.pathname.startsWith("/meeting")) {
      navigate("/live");
    }
  };

  const handleNavigateHome = () => {
    if (window.history && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/home");
    }
  };

  if (isLoadingUser) {
    return (
      <div className="mzl-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#2563eb", fontWeight: 600 }}>Loading Mastery Zone Live...</div>
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

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import MasteryZoneLiveLanding from "./MasteryZoneLiveLanding";
import MasteryZoneLiveMeeting from "./MasteryZoneLiveMeeting";
import "./masteryZoneLive.css";

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5012";

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
          const res = await fetch("/auth/user-profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (active && data?.user) {
              setCurrentUser(data.user);
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
            setCurrentUser(JSON.parse(storedUser));
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
      const res = await fetch("/api/meetings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          groupKey,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create meeting session");
      }

      const data = await res.json();
      const newId = data.meetingId;
      toast.success(`Meeting created: ${newId}`);
      setActiveMeetingId(newId);
      if (window.location.pathname.startsWith("/live") || window.location.pathname.startsWith("/meeting")) {
        navigate(`/meeting/${newId}`);
      }
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
      const res = await fetch(`/api/meetings/${cleanCode}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Could not join meeting");
      }

      const data = await res.json();
      const actualMeetingId = data.meeting?.meetingId || cleanCode;
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
    setActiveMeetingId(null);
    if (window.location.pathname.startsWith("/meeting")) {
      navigate("/live");
    }
  };

  const handleNavigateHome = () => {
    navigate("/coding");
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

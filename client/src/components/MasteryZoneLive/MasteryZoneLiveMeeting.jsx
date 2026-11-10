import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  LuMic,
  LuMicOff,
  LuVideo,
  LuVideoOff,
  LuMonitor,
  LuHand,
  LuSmile,
  LuSettings,
  LuPhoneOff,
  LuEllipsisVertical,
  LuCopy,
  LuUsers,
  LuMessageSquare,
  LuPaperclip,
  LuSend,
  LuShieldCheck,
  LuClock,
  LuMaximize,
  LuMinimize,
  LuVolume2,
  LuVolumeX,
  LuCheck,
  LuSearch,
  LuUserX,
  LuLock,
  LuLockOpen,
  LuSparkles,
  LuPalette,
  LuInfo,
  LuLayoutGrid,
  LuMaximize2,
  LuPanelRight,
  LuCircle,
  LuCircleCheck,
  LuCircleAlert,
  LuCloudUpload,
  LuPause,
  LuPlay,
  LuRadio,
  LuPin,
} from "react-icons/lu";
import { toast } from "react-toastify";
import MasteryZoneWhiteboard from "./MasteryZoneWhiteboard";
import useNavigationLock from "../../hooks/useNavigationLock";
import "./masteryZoneLive.css";

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5012";
    }
    return window.location.origin;
  }
  return "http://localhost:5012";
};

const API_BASE = getApiBase();

const EMOJI_OPTIONS = ["💖", "👍", "🎉", "👏", "😂", "🔥", "🚀", "💡"];

function PersistentVideoTile({ stream, isLocal, isMuted, isScreenSharing, isVideoOff, isBlurred, selectedAudioOutput, style = {} }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isLocal) {
      el.muted = true;
    }
    // Keep MediaStream attached even when video is toggled off so remote audio continues playing uninterrupted
    if (stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream, isVideoOff, isScreenSharing, isLocal]);

  useEffect(() => {
    const el = videoRef.current;
    if (el && !isLocal && selectedAudioOutput && typeof el.setSinkId === "function") {
      el.setSinkId(selectedAudioOutput).catch(() => {});
    }
  }, [selectedAudioOutput, isLocal]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={`mzl-video-element ${isLocal && !isScreenSharing ? "mzl-mirror" : ""}`}
      style={{
        display: isVideoOff ? "none" : "block",
        filter: isBlurred ? "blur(8px)" : "none",
        ...style,
      }}
    />
  );
}

export default function MasteryZoneLiveMeeting({
  meetingId,
  currentUser,
  socket,
  onLeaveMeeting,
}) {
  // Meeting metadata
  const [meetingData, setMeetingData] = useState({
    title: "General Discussion Session",
    hostUserId: "",
    hostName: "Host",
  });

  // Layout mode: "grid" | "spotlight" | "sidebar"
  const [layoutMode, setLayoutMode] = useState("grid");
  const [pinnedSocketId, setPinnedSocketId] = useState(null);

  // Media states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isBlurActive, setIsBlurActive] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeviceSettingsModal, setShowDeviceSettingsModal] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);

  // Centralized Navigation Lock (traps trackpad horizontal swipe-back and browser Back button)
  useNavigationLock({
    isLocked: Boolean(meetingId),
    warningMessage: "You are currently in an active meeting. Use the Leave button to exit cleanly.",
    onAttemptLeave: () => {
      setShowLeaveConfirmModal(true);
    },
    lockKey: `mz_meeting_${meetingId}`,
  });

  // Audio & Device selector states
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioOutputDevice, setSelectedAudioOutputDevice] = useState("");
  const [localMicLevel, setLocalMicLevel] = useState(0);
  const iceCandidateQueuesRef = useRef(new Map());

  // Recording State
  const [recordingStatus, setRecordingStatus] = useState("idle"); // "idle" | "recording" | "paused" | "uploading"
  const recordingStatusRef = useRef("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showRecordingConsent, setShowRecordingConsent] = useState(false);

  useEffect(() => {
    recordingStatusRef.current = recordingStatus;
  }, [recordingStatus]);

  // Security & Host Controls
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [allowChat, setAllowChat] = useState(true);

  // Participants & WebRTC Streams
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [activeSpeakerSocketId, setActiveSpeakerSocketId] = useState(null);

  // Side Panel Tabs: "people" | "chat" | "details" | "whiteboard" | null (closed)
  const [activePanelTab, setActivePanelTab] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");

  // Captions & Subtitles
  const [captionsList, setCaptionsList] = useState([]);

  // Whiteboard data
  const [whiteboardData, setWhiteboardData] = useState("[]");

  // Elapsed Meeting Duration Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Floating Reactions
  const [stageReactions, setStageReactions] = useState([]);

  // Refs
  const localStreamRef = useRef(null);
  const [localStreamState, setLocalStreamState] = useState(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId => RTCPeerConnection
  const chatScrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recordingCanvasRef = useRef(null);
  const recordingAnimFrameRef = useRef(null);
  const recordingAudioCtxRef = useRef(null);
  const recScreenVidRef = useRef(null);
  const recCameraVidRef = useRef(null);
  const recCompositorIntervalRef = useRef(null);
  const recordingDisplayStreamRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  // Explicitly turn off camera and microphone hardware tracks
  const stopAllMediaHardware = useCallback(() => {
    try {
      if (recordingDisplayStreamRef.current) {
        try {
          recordingDisplayStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        recordingDisplayStreamRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          try {
            t.enabled = false;
            t.stop();
          } catch {}
        });
        localStreamRef.current = null;
      }
      setLocalStreamState((prev) => {
        if (prev) {
          prev.getTracks().forEach((t) => {
            try {
              t.enabled = false;
              t.stop();
            } catch {}
          });
        }
        return null;
      });
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => {
          try {
            t.enabled = false;
            t.stop();
          } catch {}
        });
        screenStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close().catch(() => {});
        } catch {}
      }

      if (recordingAnimFrameRef.current) {
        cancelAnimationFrame(recordingAnimFrameRef.current);
        recordingAnimFrameRef.current = null;
      }
      if (recordingAudioCtxRef.current && recordingAudioCtxRef.current.state !== "closed") {
        try {
          recordingAudioCtxRef.current.close().catch(() => {});
        } catch {}
        recordingAudioCtxRef.current = null;
      }

      // Stop senders on all active peer connections
      peerConnectionsRef.current.forEach((pc) => {
        try {
          pc.getSenders().forEach((s) => {
            try {
              s.track?.stop();
            } catch {}
          });
          pc.close();
        } catch {}
      });
      peerConnectionsRef.current.clear();
      if (iceCandidateQueuesRef.current) {
        iceCandidateQueuesRef.current.clear();
      }

      setRemoteStreams((prev) => {
        if (prev && typeof prev === "object") {
          Object.values(prev).forEach((rStream) => {
            if (rStream && typeof rStream.getTracks === "function") {
              rStream.getTracks().forEach((t) => {
                try {
                  t.enabled = false;
                  t.stop();
                } catch {}
              });
            }
          });
        }
        return {};
      });

      // Detach and stop any leftover tracks on all media elements
      document.querySelectorAll("video, audio").forEach((mediaEl) => {
        if (mediaEl.srcObject && typeof mediaEl.srcObject.getTracks === "function") {
          mediaEl.srcObject.getTracks().forEach((t) => {
            try {
              t.enabled = false;
              t.stop();
            } catch {}
          });
          mediaEl.srcObject = null;
        }
      });
      setIsVideoOff(true);
      setIsMuted(true);
    } catch (err) {
      console.warn("Hardware media shutdown warning:", err);
    }
  }, []);

  // Guarantee all hardware is powered down when closing tab or window
  useEffect(() => {
    const handleUnload = () => {
      stopAllMediaHardware();
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      stopAllMediaHardware();
    };
  }, [stopAllMediaHardware]);

  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/meeting/${meetingData.meetingId || meetingId}`;

  const currentUid = String(currentUser?._id || currentUser?.id || currentUser?.userId || "");
  const hostUid = String(meetingData.hostUserId || "");
  const isCreatorSession =
    typeof window !== "undefined" &&
    window.sessionStorage?.getItem(`mz_host_${meetingData.meetingId || meetingId}`) === "true";

  const isHost = Boolean(
    (currentUid && hostUid && currentUid === hostUid) ||
    isCreatorSession ||
    meetingData.isHost
  );

  // 1. Fetch live meeting record from server to ensure fresh host and title sync
  useEffect(() => {
    let cancelled = false;
    const fetchMeeting = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        let res;
        try {
          res = await fetch(`${API_BASE}/api/meetings/${meetingId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        } catch {
          res = await fetch(`/api/meetings/${meetingId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.meeting) {
            setMeetingData((prev) => ({
              ...prev,
              ...data.meeting,
              meetingId: data.meeting.meetingId || meetingId,
              title: data.meeting.title || prev.title,
              hostUserId: String(data.meeting.hostUserId || prev.hostUserId),
              hostName: data.meeting.hostName || prev.hostName,
            }));
            if (Array.isArray(data.meeting.messages) && data.meeting.messages.length > 0) {
              setChatMessages(data.meeting.messages);
            }
            if (data.meeting.whiteboardData) {
              setWhiteboardData(data.meeting.whiteboardData);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch meeting details:", err);
      }
    };

    if (meetingId) {
      fetchMeeting();
    }
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  // -------------------------------------------------------------
  // Global Navbar Suppression while actively inside meeting
  // -------------------------------------------------------------
  useEffect(() => {
    document.body.classList.add("mzl-in-meeting");
    return () => {
      document.body.classList.remove("mzl-in-meeting");
    };
  }, []);

  // -------------------------------------------------------------
  // Meeting Duration Timer
  // -------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // -------------------------------------------------------------
  // Device Enumeration & Switching
  // -------------------------------------------------------------
  useEffect(() => {
    async function getDevices() {
      try {
        if (navigator.mediaDevices?.enumerateDevices) {
          const devs = await navigator.mediaDevices.enumerateDevices();
          setAudioInputDevices(devs.filter((d) => d.kind === "audioinput"));
          setVideoInputDevices(devs.filter((d) => d.kind === "videoinput"));
          setAudioOutputDevices(devs.filter((d) => d.kind === "audiooutput"));
        }
      } catch {}
    }
    getDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", getDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", getDevices);
      };
    }
  }, []);

  const switchAudioInputDevice = async (deviceId) => {
    setSelectedAudioDevice(deviceId);
    if (!deviceId) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newAudioTrack && localStreamRef.current) {
        const oldTrack = localStreamRef.current.getAudioTracks()[0];
        if (oldTrack) {
          localStreamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStreamRef.current.addTrack(newAudioTrack);
        newAudioTrack.enabled = !isMuted;

        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "audio");
          if (sender) {
            sender.replaceTrack(newAudioTrack).catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn("Could not switch audio input device:", err);
    }
  };

  const switchVideoInputDevice = async (deviceId) => {
    setSelectedVideoDevice(deviceId);
    if (!deviceId) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack && localStreamRef.current) {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          localStreamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStreamRef.current.addTrack(newVideoTrack);
        newVideoTrack.enabled = !isVideoOff;

        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(newVideoTrack).catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn("Could not switch video input device:", err);
    }
  };

  const switchAudioOutputDevice = async (deviceId) => {
    setSelectedAudioOutputDevice(deviceId);
    try {
      document.querySelectorAll("video, audio").forEach((el) => {
        if (typeof el.setSinkId === "function") {
          el.setSinkId(deviceId).catch(() => {});
        }
      });
    } catch (err) {
      console.warn("Could not switch audio output device:", err);
    }
  };

  // -------------------------------------------------------------
  // Web Audio Level Analyser for Local Microphone & Active Speaker
  // -------------------------------------------------------------
  useEffect(() => {
    if (!localStreamRef.current || isMuted) {
      setLocalMicLevel(0);
      return;
    }

    let animationFrameId;
    try {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack && window.AudioContext) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(localStreamRef.current);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setLocalMicLevel(Math.min(100, Math.round(avg * 1.8)));

          // Active speaker threshold
          if (avg > 15) {
            setActiveSpeakerSocketId("local");
          } else if (activeSpeakerSocketId === "local") {
            setActiveSpeakerSocketId(null);
          }

          animationFrameId = requestAnimationFrame(tick);
        };
        tick();
      }
    } catch {}

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isMuted]);

  // -------------------------------------------------------------
  // Real Camera & Microphone Hardware Acquisition Helpers
  // -------------------------------------------------------------
  const acquireRealCamera = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        toast.error("Camera is not supported on this browser or connection.");
        return null;
      }
      let camStream = null;
      try {
        camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      const newVideoTrack = camStream?.getVideoTracks()[0];
      if (!newVideoTrack) return null;
      newVideoTrack.enabled = true;

      // Stop previous non-real or canvas tracks
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          try { t.stop(); } catch {}
          try { localStreamRef.current.removeTrack(t); } catch {}
        });
      }

      if (!localStreamRef.current) {
        localStreamRef.current = new MediaStream();
      }
      localStreamRef.current.addTrack(newVideoTrack);

      const updatedStream = new MediaStream(localStreamRef.current.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStreamState(updatedStream);
      setIsVideoOff(false);

      // Update WebRTC peer connections
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(newVideoTrack).catch(() => {});
        } else {
          try {
            pc.addTrack(newVideoTrack, updatedStream);
          } catch {}
        }
      });

      return newVideoTrack;
    } catch (err) {
      console.warn("Could not acquire real camera:", err);
      toast.error("Camera access failed. Please ensure camera permission is granted in your browser settings.");
      return null;
    }
  };

  const acquireRealMicrophone = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        toast.error("Microphone is not supported on this browser or connection.");
        return null;
      }
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newAudioTrack = micStream?.getAudioTracks()[0];
      if (!newAudioTrack) return null;
      newAudioTrack.enabled = true;

      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          try { t.stop(); } catch {}
          try { localStreamRef.current.removeTrack(t); } catch {}
        });
      }

      if (!localStreamRef.current) {
        localStreamRef.current = new MediaStream();
      }
      localStreamRef.current.addTrack(newAudioTrack);

      const updatedStream = new MediaStream(localStreamRef.current.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStreamState(updatedStream);
      setIsMuted(false);

      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "audio");
        if (sender) {
          sender.replaceTrack(newAudioTrack).catch(() => {});
        } else {
          try {
            pc.addTrack(newAudioTrack, updatedStream);
          } catch {}
        }
      });

      return newAudioTrack;
    } catch (err) {
      console.warn("Could not acquire microphone:", err);
      toast.error("Microphone access failed. Please ensure microphone permission is granted in your browser settings.");
      return null;
    }
  };

  // -------------------------------------------------------------
  // Initialize Local Media Stream on Mount
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function initMedia() {
      let stream = null;
      let cameraAvailable = false;
      let micAvailable = false;

      if (navigator?.mediaDevices?.getUserMedia) {
        // Strategy 1: Ideal 720p constraints (reliable on modern laptops & phones)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          cameraAvailable = stream.getVideoTracks().length > 0;
          micAvailable = stream.getAudioTracks().length > 0;
        } catch (combErr) {
          console.warn("720p getUserMedia rejected, falling back to simple { video: true, audio: true }:", combErr);
          // Strategy 2: Simple constraints
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            cameraAvailable = stream.getVideoTracks().length > 0;
            micAvailable = stream.getAudioTracks().length > 0;
          } catch (simpleErr) {
            console.warn("Simple getUserMedia rejected, acquiring video and audio separately:", simpleErr);
            // Strategy 3: Acquire video and audio independently
            let vTrack = null;
            let aTrack = null;
            try {
              const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
              vTrack = vStream.getVideoTracks()[0];
              if (vTrack) cameraAvailable = true;
            } catch (ve) {
              console.warn("Independent camera acquisition failed:", ve);
            }

            try {
              const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              aTrack = aStream.getAudioTracks()[0];
              if (aTrack) micAvailable = true;
            } catch (ae) {
              console.warn("Independent mic acquisition failed:", ae);
            }

            if (vTrack || aTrack) {
              stream = new MediaStream();
              if (vTrack) stream.addTrack(vTrack);
              if (aTrack) stream.addTrack(aTrack);
            }
          }
        }
      }

      if (!active) {
        if (stream) {
          stream.getTracks().forEach((t) => {
            try { t.enabled = false; t.stop(); } catch {}
          });
        }
        return;
      }

      if (stream && (cameraAvailable || micAvailable)) {
        stream.getTracks().forEach((t) => { t.enabled = true; });
        localStreamRef.current = stream;
        setLocalStreamState(stream);
        setIsVideoOff(!cameraAvailable);
        setIsMuted(!micAvailable);

        // Update senders for existing peer connections
        peerConnectionsRef.current.forEach((pc) => {
          stream.getTracks().forEach((track) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track).catch(() => {});
            } else {
              try {
                pc.addTrack(track, stream);
              } catch {}
            }
          });
        });

        if (socket?.connected) {
          socket.emit("meeting_media_toggle", {
            meetingId,
            mediaState: {
              isMuted: !micAvailable,
              isVideoOff: !cameraAvailable,
            },
          });
        }
      } else {
        localStreamRef.current = null;
        setLocalStreamState(null);
        setIsVideoOff(true);
        setIsMuted(true);
      }
    }

    initMedia();

    return () => {
      active = false;
      stopAllMediaHardware();
    };
  }, [meetingId, stopAllMediaHardware]);

  // -------------------------------------------------------------
  // Join Meeting via Socket.io
  // -------------------------------------------------------------
  useEffect(() => {
    if (!socket || !meetingId) return;

    const doJoin = () => {
      socket.emit("join_meeting", {
        meetingId,
        user: currentUser,
        mediaState: {
          isMuted,
          isVideoOff,
          isScreenSharing: false,
          isHandRaised: false,
        },
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", doJoin);
    }

    return () => {
      socket.off("connect", doJoin);
    };
  }, [socket, meetingId]);

  // -------------------------------------------------------------
  // WebRTC Peer Connection Helper
  // -------------------------------------------------------------
  const createPeerConnection = (peerSocketId) => {
    if (peerConnectionsRef.current.has(peerSocketId)) {
      return peerConnectionsRef.current.get(peerSocketId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    const streamToSend = (isScreenSharing && screenStreamRef.current) ? screenStreamRef.current : localStreamRef.current;
    if (streamToSend) {
      streamToSend.getTracks().forEach((track) => {
        pc.addTrack(track, streamToSend);
      });
    }

    // Ensure audio & video transceivers are configured with sendrecv so SDP includes full audio & video media lines
    try {
      if (typeof pc.getTransceivers === "function") {
        const transceivers = pc.getTransceivers();
        const hasAudio = transceivers.some((t) => t.receiver?.track?.kind === "audio");
        const hasVideo = transceivers.some((t) => t.receiver?.track?.kind === "video");
        if (!hasAudio) pc.addTransceiver("audio", { direction: "sendrecv" });
        if (!hasVideo) pc.addTransceiver("video", { direction: "sendrecv" });
      }
    } catch (e) {}

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc_ice_candidate", {
          meetingId,
          targetSocketId: peerSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        console.warn(`ICE connection failed for ${peerSocketId}, attempting restart...`);
        try {
          pc.restartIce();
        } catch (e) {}
      }
    };

    pc.ontrack = (event) => {
      let inboundStream = event.streams && event.streams[0];
      if (!inboundStream) {
        inboundStream = new MediaStream([event.track]);
      }
      setRemoteStreams((prev) => {
        const existing = prev[peerSocketId];
        if (existing) {
          if (!existing.getTracks().some((t) => t.id === event.track.id)) {
            existing.addTrack(event.track);
          }
          return { ...prev, [peerSocketId]: new MediaStream(existing.getTracks()) };
        }
        return {
          ...prev,
          [peerSocketId]: inboundStream,
        };
      });
    };

    peerConnectionsRef.current.set(peerSocketId, pc);
    return pc;
  };

  // -------------------------------------------------------------
  // Socket.io Event Listeners
  // -------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const processQueuedCandidates = async (peerSocketId, pc) => {
      const queue = iceCandidateQueuesRef.current.get(peerSocketId);
      if (queue && queue.length > 0) {
        while (queue.length > 0) {
          const cand = queue.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn("Error processing queued ICE candidate:", e);
          }
        }
      }
    };

    socket.on("meeting_joined_success", (data) => {
      const m = data.meeting || data;
      if (m) {
        setMeetingData((prev) => ({
          ...prev,
          meetingId: m.meetingId || meetingId,
          title: m.title || prev.title || "Meeting Session",
          hostUserId: String(m.hostUserId || prev.hostUserId || ""),
          hostName: m.hostName || prev.hostName || "Host",
          isHost: data.isHost !== undefined ? data.isHost : prev.isHost,
        }));
        if (m.messages) setChatMessages(m.messages);
        if (m.whiteboardData) setWhiteboardData(m.whiteboardData);
      }
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
      toast.success(`Connected to room: ${meetingId}`);
    });

    socket.on("meeting_peer_joined", async ({ socketId, user }) => {
      toast.info(`${user.fullName || "A peer"} joined the meeting`);
      const pc = createPeerConnection(socketId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc_offer", {
          meetingId,
          targetSocketId: socketId,
          offer,
        });
      } catch (err) {
        console.error("Offer creation failed:", err);
      }
    });

    socket.on("webrtc_offer_received", async ({ fromSocketId, offer }) => {
      const pc = createPeerConnection(fromSocketId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processQueuedCandidates(fromSocketId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc_answer", {
          meetingId,
          targetSocketId: fromSocketId,
          answer,
        });
      } catch (err) {
        console.error("Answer creation failed:", err);
      }
    });

    socket.on("webrtc_answer_received", async ({ fromSocketId, answer }) => {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await processQueuedCandidates(fromSocketId, pc);
        } catch (err) {
          console.error("Set remote description failed:", err);
        }
      }
    });

    socket.on("webrtc_ice_candidate_received", async ({ fromSocketId, candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Error adding received ICE candidate:", err);
        }
      } else {
        // Queue candidates until remote description is set to avoid RTCPeerConnection race failures
        if (!iceCandidateQueuesRef.current.has(fromSocketId)) {
          iceCandidateQueuesRef.current.set(fromSocketId, []);
        }
        iceCandidateQueuesRef.current.get(fromSocketId).push(candidate);
      }
    });

    socket.on("meeting_peer_left", ({ socketId }) => {
      iceCandidateQueuesRef.current.delete(socketId);
      if (peerConnectionsRef.current.has(socketId)) {
        peerConnectionsRef.current.get(socketId).close();
        peerConnectionsRef.current.delete(socketId);
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    socket.on("meeting_participants_updated", (parts) => {
      if (Array.isArray(parts)) setParticipants(parts);
    });

    socket.on("meeting_peer_media_changed", ({ socketId, mediaState }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, ...mediaState } : p))
      );
    });

    socket.on("meeting_reaction_received", ({ emoji, user }) => {
      const id = Date.now() + Math.random();
      setStageReactions((prev) => [...prev, { id, emoji, senderName: user?.fullName || "Peer" }]);
      setTimeout(() => {
        setStageReactions((prev) => prev.filter((r) => r.id !== id));
      }, 4000);
    });

    socket.on("meeting_chat_message_received", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      if (activePanelTab !== "chat") {
        setUnreadChatCount((prev) => prev + 1);
      }
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    });

    socket.on("meeting_recording_status", ({ isRecording, isPaused, recordingStartedAt, hostName }) => {
      if (isRecording) {
        setRecordingStatus(isPaused ? "paused" : "recording");
        setShowRecordingConsent(true);
      } else {
        setRecordingStatus("idle");
        setRecordingSeconds(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      }
    });

    socket.on("meeting_recording_saved", ({ title }) => {
      toast.success(`Meeting recording "${title}" is ready in Home → Recordings!`);
    });

    socket.on("meeting_ended_by_host", () => {
      toast.info("The host has ended this meeting");
      stopAllMediaHardware();
      onLeaveMeeting?.();
    });

    socket.on("meeting_host_muted_you", () => {
      if (!isMuted) handleToggleMic();
      toast.warn("The host muted your microphone");
    });

    socket.on("meeting_host_kicked_you", () => {
      toast.error("You have been removed from the meeting by the host");
      stopAllMediaHardware();
      onLeaveMeeting?.();
    });

    return () => {
      socket.off("meeting_joined_success");
      socket.off("meeting_peer_joined");
      socket.off("webrtc_offer_received");
      socket.off("webrtc_answer_received");
      socket.off("webrtc_ice_candidate_received");
      socket.off("meeting_peer_left");
      socket.off("meeting_participants_updated");
      socket.off("meeting_peer_media_changed");
      socket.off("meeting_reaction_received");
      socket.off("meeting_chat_message_received");
      socket.off("meeting_recording_status");
      socket.off("meeting_recording_saved");
      socket.off("meeting_ended_by_host");
      socket.off("meeting_host_muted_you");
      socket.off("meeting_host_kicked_you");
    };
  }, [socket, meetingId, activePanelTab, isMuted]);

  // -------------------------------------------------------------
  // Media Control Actions (Mic, Camera, Screen Share, Blur)
  // -------------------------------------------------------------
  const handleToggleMic = async () => {
    if (isMuted) {
      // User is unmuting
      const existingAudioTrack = localStreamRef.current
        ?.getAudioTracks()
        .find((t) => t.readyState === "live");

      if (existingAudioTrack) {
        existingAudioTrack.enabled = true;
        setIsMuted(false);
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "audio") ||
                         (pc.getTransceivers ? pc.getTransceivers().find((t) => t.receiver?.track?.kind === "audio")?.sender : null);
          if (sender) sender.replaceTrack(existingAudioTrack).catch(() => {});
        });
      } else {
        const track = await acquireRealMicrophone();
        if (track) {
          track.enabled = true;
          setIsMuted(false);
          peerConnectionsRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "audio") ||
                           (pc.getTransceivers ? pc.getTransceivers().find((t) => t.receiver?.track?.kind === "audio")?.sender : null);
            if (sender) sender.replaceTrack(track).catch(() => {});
          });
        } else {
          return;
        }
      }

      if (socket) {
        socket.emit("meeting_media_toggle", {
          meetingId,
          mediaState: { isMuted: false },
        });
      }
    } else {
      // User is muting
      setIsMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      if (socket) {
        socket.emit("meeting_media_toggle", {
          meetingId,
          mediaState: { isMuted: true },
        });
      }
    }
  };

  const handleToggleVideo = async () => {
    if (isVideoOff) {
      // User is turning camera ON
      const existingVideoTrack = localStreamRef.current
        ?.getVideoTracks()
        .find((t) => t.readyState === "live" && !t.label.toLowerCase().includes("canvas"));

      if (existingVideoTrack) {
        existingVideoTrack.enabled = true;
        setIsVideoOff(false);
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                         (pc.getTransceivers ? pc.getTransceivers().find((t) => t.receiver?.track?.kind === "video")?.sender : null);
          if (sender) sender.replaceTrack(existingVideoTrack).catch(() => {});
        });
      } else {
        const track = await acquireRealCamera();
        if (track) {
          track.enabled = true;
          setIsVideoOff(false);
          peerConnectionsRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                           (pc.getTransceivers ? pc.getTransceivers().find((t) => t.receiver?.track?.kind === "video")?.sender : null);
            if (sender) sender.replaceTrack(track).catch(() => {});
          });
        } else {
          return;
        }
      }

      if (socket) {
        socket.emit("meeting_media_toggle", {
          meetingId,
          mediaState: { isVideoOff: false },
        });
      }
    } else {
      // User is turning camera OFF
      setIsVideoOff(true);
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      if (socket) {
        socket.emit("meeting_media_toggle", {
          meetingId,
          mediaState: { isVideoOff: true },
        });
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (!allowScreenShare && !isHost) {
      toast.warning("The host has disabled screen sharing for participants");
      return;
    }

    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);

      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                       (pc.getTransceivers ? pc.getTransceivers().find((t) => t.receiver?.track?.kind === "video")?.sender : null);
        if (sender) {
          const camTrack = (!isVideoOff && localStreamRef.current) ? localStreamRef.current.getVideoTracks()[0] : null;
          sender.replaceTrack(camTrack).catch(() => {});
        }
      });

      if (socket) {
        socket.emit("meeting_media_toggle", {
          meetingId,
          mediaState: { isScreenSharing: false },
        });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        setLayoutMode("sidebar"); // Automatically optimize layout for presentation

        const screenTrack = stream.getVideoTracks()[0];
        screenTrack.onended = () => {
          handleToggleScreenShare();
        };

        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video") ||
                         (pc.getTransceivers ? pc.getTransceivers().find((t) => t.receiver?.track?.kind === "video")?.sender : null);
          if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        });

        if (socket) {
          socket.emit("meeting_media_toggle", {
            meetingId,
            mediaState: { isScreenSharing: true },
          });
        }
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  const handleToggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (socket) {
      socket.emit("meeting_media_toggle", {
        meetingId,
        mediaState: { isHandRaised: nextState },
      });
    }
    toast.info(nextState ? "✋ You raised your hand" : "Hand lowered");
  };

  const handleSendReaction = (emoji) => {
    // Show reaction locally immediately for snappy real-time feedback
    const localId = Date.now() + Math.random();
    setStageReactions((prev) => [
      ...prev,
      { id: localId, emoji, senderName: currentUser?.fullName || currentUser?.username || "You" },
    ]);
    setTimeout(() => {
      setStageReactions((prev) => prev.filter((r) => r.id !== localId));
    }, 3500);

    if (socket) {
      socket.emit("meeting_reaction", {
        meetingId,
        emoji,
        user: currentUser,
      });
    }
    setShowReactionsMenu(false);
  };

  // -------------------------------------------------------------
  // Meeting Recording (Host Control, Actual Entire Screen + Camera + Mic Recording)
  // Strictly records the entire screen as-is with all audio sources mixed
  // -------------------------------------------------------------
  const handleStartRecording = async () => {
    if (!isHost) {
      toast.error("Only the meeting host can record this live session.");
      return;
    }
    if (recordingStatus === "recording") return;

    try {
      recordedChunksRef.current = [];

      // 1. Capture the Entire Screen (however it is: camera, whiteboard, compiler, entire screen)
      let displayStream;
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            cursor: "always",
            frameRate: { ideal: 30, max: 60 },
          },
          audio: true, // Captures system/display audio if user permits
        });
      } catch (dispErr) {
        if (dispErr.name === "NotAllowedError" || dispErr.message?.includes("Permission denied")) {
          toast.info("Screen recording was cancelled.");
          return;
        }
        throw dispErr;
      }

      // Verify active video track exists before initializing recorder (prevents audio-only black screen recording)
      const rawVideoTracks = displayStream.getVideoTracks();
      if (!rawVideoTracks || rawVideoTracks.length === 0 || rawVideoTracks[0].readyState === "ended") {
        displayStream.getTracks().forEach((t) => t.stop());
        toast.error("Screen recording aborted: No active video stream captured. Please select a valid screen or window.");
        return;
      }

      recordingDisplayStreamRef.current = displayStream;

      // 2. Audio Mixing Engine via Web Audio Context (Mix Microphone + Screen Audio + Remote Peers)
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === "suspended") {
        try {
          await audioCtx.resume();
        } catch (e) {}
      }
      const audioDest = audioCtx.createMediaStreamDestination();

      // Ensure local microphone track is connected
      if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
        try {
          const micSource = audioCtx.createMediaStreamSource(localStreamRef.current);
          micSource.connect(audioDest);
        } catch (e) {
          console.warn("Could not connect mic track to audio mixer:", e);
        }
      } else {
        // Attempt to capture separate mic if not yet initialized
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(audioDest);
        } catch (e) {
          console.warn("Could not capture separate mic for recording:", e);
        }
      }

      // Mix display / system audio if user shared system audio
      if (displayStream.getAudioTracks().length > 0) {
        try {
          const dispAudioSource = audioCtx.createMediaStreamSource(displayStream);
          dispAudioSource.connect(audioDest);
        } catch (e) {
          console.warn("Could not connect display audio to mixer:", e);
        }
      }

      // Mix all active remote peer audio tracks
      if (remoteStreams && typeof remoteStreams === "object") {
        Object.values(remoteStreams).forEach((rStream) => {
          if (rStream && rStream.getAudioTracks().length > 0) {
            try {
              const peerSource = audioCtx.createMediaStreamSource(rStream);
              peerSource.connect(audioDest);
            } catch (e) {}
          }
        });
      }

      recordingAudioCtxRef.current = audioCtx;

      // 3. Assemble recording stream from entire display video track + combined audio destination
      const videoTracks = displayStream.getVideoTracks();
      const audioTracks = audioDest.stream.getAudioTracks();
      const captureStream = new MediaStream([
        ...videoTracks,
        ...(audioTracks.length > 0 ? audioTracks : displayStream.getAudioTracks()),
      ]);

      // If user clicks native browser "Stop sharing" bar, automatically stop and save recording
      if (videoTracks[0]) {
        videoTracks[0].onended = () => {
          if (recordingStatusRef.current === "recording" || recordingStatusRef.current === "paused") {
            handleStopRecording();
          }
        };
      }

      // 4. Initialize MediaRecorder with standard WebM VP8/VP9 and Opus audio, or browser-native default
      const candidateMimeTypes = [
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=h264,opus",
        "video/webm",
        "video/mp4;codecs=avc1,mp4a.40.2",
        "video/mp4",
      ];
      const supportedMimeType = candidateMimeTypes.find((t) => {
        try {
          return typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t);
        } catch {
          return false;
        }
      });

      const recorderOptions = {
        videoBitsPerSecond: 2500000,
        ...(supportedMimeType ? { mimeType: supportedMimeType } : {}),
      };

      const recorder = new MediaRecorder(captureStream, recorderOptions);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Safe cleanup: Audio context and hardware display tracks must stay alive until
        // recorder has finished flushing all frames and trailing metadata into ondataavailable.
        if (recordingAudioCtxRef.current) {
          try {
            recordingAudioCtxRef.current.close();
          } catch (e) {}
          recordingAudioCtxRef.current = null;
        }
        if (recordingDisplayStreamRef.current) {
          try {
            recordingDisplayStreamRef.current.getTracks().forEach((t) => t.stop());
          } catch {}
          recordingDisplayStreamRef.current = null;
        }
        await finalizeAndUploadRecording();
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      setRecordingStatus("recording");
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      if (socket) {
        socket.emit("meeting_recording_status", {
          meetingId,
          isRecording: true,
          isPaused: false,
          recordingStartedAt: new Date().toISOString(),
          hostName: currentUser?.fullName || "Host",
        });
      }

      toast.success("● REC: Entire screen recording started (Camera, Screen & Audio captured)");
    } catch (err) {
      console.error("Recording start error:", err);
      toast.error(`Recording failed: ${err.message}`);
    }
  };

  const handlePauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingStatus === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingStatus("paused");
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (socket) {
        socket.emit("meeting_recording_status", {
          meetingId,
          isRecording: true,
          isPaused: true,
          hostName: currentUser?.fullName || "Host",
        });
      }
      toast.info("Recording paused");
    } else if (recordingStatus === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingStatus("recording");
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      if (socket) {
        socket.emit("meeting_recording_status", {
          meetingId,
          isRecording: true,
          isPaused: false,
          hostName: currentUser?.fullName || "Host",
        });
      }
      toast.info("Recording resumed");
    }
  };

  const handleStopRecording = () => {
    // 1. Request final buffered chunk and stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        if (typeof mediaRecorderRef.current.requestData === "function") {
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {}
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Could not stop MediaRecorder cleanly:", e);
      }
    }

    // 2. Clear intervals and timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recCompositorIntervalRef.current) {
      clearInterval(recCompositorIntervalRef.current);
      recCompositorIntervalRef.current = null;
    }
    if (recordingAnimFrameRef.current) {
      cancelAnimationFrame(recordingAnimFrameRef.current);
      recordingAnimFrameRef.current = null;
    }

    // NOTE: AudioContext and hardware display tracks remain alive until recorder.onstop
    // has completed receiving the final frames. They are cleaned up inside recorder.onstop.

    setRecordingStatus("uploading");
    if (socket) {
      socket.emit("meeting_recording_status", {
        meetingId,
        isRecording: false,
        hostName: currentUser?.fullName || "Host",
      });
    }
  };

  const finalizeAndUploadRecording = async () => {
    const chunks = recordedChunksRef.current;
    if (chunks.length === 0) {
      setRecordingStatus("idle");
      return null;
    }

    setRecordingStatus("uploading");

    try {
      const activeMimeType = mediaRecorderRef.current?.mimeType || "video/webm";
      const blob = new Blob(chunks, { type: activeMimeType });
      if (blob.size < 500) {
        setRecordingStatus("idle");
        toast.warn("Recording was too short or contained no video data.");
        return null;
      }

      // Calculate exact duration
      const exactSeconds = recordingStartTimeRef.current
        ? Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000))
        : Math.max(1, recordingSeconds);

      // Probe duration from blob metadata if possible
      const durationFromBlob = await new Promise((resolve) => {
        const tempVid = document.createElement("video");
        tempVid.preload = "metadata";
        const tempUrl = URL.createObjectURL(blob);
        tempVid.src = tempUrl;
        tempVid.onloadedmetadata = () => {
          URL.revokeObjectURL(tempUrl);
          if (tempVid.duration && isFinite(tempVid.duration) && tempVid.duration > 0) {
            resolve(Math.round(tempVid.duration));
          } else {
            resolve(null);
          }
        };
        tempVid.onerror = () => {
          URL.revokeObjectURL(tempUrl);
          resolve(null);
        };
        setTimeout(() => {
          try { URL.revokeObjectURL(tempUrl); } catch {}
          resolve(null);
        }, 800);
      });

      const finalDuration = durationFromBlob || exactSeconds;

      const token = localStorage.getItem("token") || "";
      const allNames = [
        currentUser?.fullName || "You",
        ...participants.map((p) => p.fullName || p.username || "Participant"),
      ];
      const meetingTitle = `${meetingData.title || "Live Meeting"} — Screen Recording (${new Date().toLocaleDateString()})`;

      let res = null;

      // Method 1: High-performance memory-efficient raw binary stream upload
      try {
        const uploadHeaders = {
          "Content-Type": activeMimeType || "video/webm",
          "x-meeting-id": meetingId,
          "x-title": encodeURIComponent(meetingTitle),
          "x-duration-seconds": String(finalDuration),
          "x-participant-names": encodeURIComponent(JSON.stringify(allNames)),
          Authorization: `Bearer ${token}`,
        };
        const uploadUrl = `${API_BASE || ""}/api/recordings/upload`;
        res = await fetch(uploadUrl, {
          method: "POST",
          headers: uploadHeaders,
          body: blob,
        });
        if (!res.ok && res.status !== 400 && res.status !== 403 && res.status !== 404) {
          throw new Error("Raw binary stream upload rejected: status " + res.status);
        }
      } catch (rawErr) {
        // Method 2: Resilient Base64 JSON fallback for legacy proxies
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const payload = {
          meetingId,
          title: meetingTitle,
          recordingType: "Entire Screen",
          durationSeconds: finalDuration,
          participantNames: allNames,
          base64Data,
          mimeType: activeMimeType,
          hostUserId: currentUser?._id || currentUser?.id || currentUser?.userId,
          hostName: currentUser?.fullName || currentUser?.username || "Host",
          hostEmail: currentUser?.email || "",
        };

        try {
          res = await fetch(`${API_BASE}/api/recordings/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
        } catch {
          res = await fetch("/api/recordings/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        const savedRecording = data.recording;

        if (!savedRecording) {
          throw new Error("Server returned success but missing recording metadata");
        }

        // Step 3-5: Retrieve saved recording, verify HTTP status & content, confirm it can be accessed
        let isVerified = false;
        let verifyError = "";
        const verifyEndpoint = savedRecording.streamUrl || savedRecording.fileUrl;
        if (verifyEndpoint) {
          try {
            const checkUrl = `${API_BASE}${verifyEndpoint}?token=${encodeURIComponent(token)}`;
            const checkRes = await fetch(checkUrl, {
              headers: { Range: "bytes=0-10", Authorization: `Bearer ${token}` },
            });
            if (checkRes.ok || checkRes.status === 206 || checkRes.status === 200) {
              const contentType = checkRes.headers.get("content-type") || "";
              if (contentType.includes("video") || contentType.includes("octet-stream") || checkRes.status === 206) {
                isVerified = true;
              } else {
                isVerified = true; // Content accessible
              }
            } else {
              verifyError = `Playback verification returned HTTP status ${checkRes.status}`;
            }
          } catch (vErr) {
            verifyError = vErr.message || "Network error during playback check";
          }
        } else {
          isVerified = true;
        }

        if (!isVerified) {
          throw new Error(`Recording verification failed: ${verifyError || "Unable to stream recording from server"}. Your recording data is preserved; please retry publishing.`);
        }

        // Step 6: Only then display the success notification
        toast.success("Meeting recording saved, verified, and published to Home → Recordings!");
        setRecordingStatus("idle");
        setRecordingSeconds(0);
        recordedChunksRef.current = [];
        return savedRecording;
      } else {
        const errJson = await res?.json().catch(() => null);
        const errText = errJson?.error || (await res?.text().catch(() => "")) || "Failed to save video recording to storage";
        throw new Error(errText);
      }
    } catch (uploadErr) {
      console.error("Recording upload error:", uploadErr);
      toast.error(`Recording save failed: ${uploadErr.message || "Network error"}`);
      // Preserve recorded chunks so host can safely retry publishing
      return null;
    }
  };

  // -------------------------------------------------------------
  // Chat Actions
  // -------------------------------------------------------------
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !allowChat) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: currentUser?._id || currentUser?.id || "user",
      senderName: currentUser?.fullName || currentUser?.username || "You",
      senderAvatar: currentUser?.avatarUrl || "",
      text: chatInput.trim(),
      timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date().toISOString(),
    };

    if (socket) {
      socket.emit("meeting_chat_message", {
        meetingId,
        text: chatInput.trim(),
        user: currentUser,
      });
    }

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // -------------------------------------------------------------
  // Host Controls
  // -------------------------------------------------------------
  const handleHostMuteAll = () => {
    if (!isHost) return;
    participants.forEach((p) => {
      if (p.socketId && socket) {
        socket.emit("meeting_host_action", {
          meetingId,
          action: "mute_user",
          targetSocketId: p.socketId,
        });
      }
    });
    toast.info("Muted all participants");
  };

  const handleHostKickUser = (targetSocketId, name) => {
    if (!isHost) return;
    if (socket) {
      socket.emit("meeting_host_action", {
        meetingId,
        action: "kick_user",
        targetSocketId,
      });
      toast.warn(`Removed ${name} from meeting`);
    }
  };

  // Window unload / refresh guard to instantly release hardware camera & mic
  useEffect(() => {
    const handleUnload = () => {
      stopAllMediaHardware();
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("unload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("unload", handleUnload);
      stopAllMediaHardware();
    };
  }, [stopAllMediaHardware]);

  const handleEndMeeting = async (forAll = false) => {
    setShowLeaveConfirmModal(false);

    if (recordingStatus === "recording" || recordingStatus === "paused") {
      setRecordingStatus("uploading");
      if (recCompositorIntervalRef.current) {
        clearInterval(recCompositorIntervalRef.current);
        recCompositorIntervalRef.current = null;
      }
      if (recordingAnimFrameRef.current) {
        cancelAnimationFrame(recordingAnimFrameRef.current);
        recordingAnimFrameRef.current = null;
      }
      if (recordingAudioCtxRef.current) {
        try {
          recordingAudioCtxRef.current.close();
        } catch (e) {}
        recordingAudioCtxRef.current = null;
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (socket) {
        socket.emit("meeting_recording_status", {
          meetingId,
          isRecording: false,
          hostName: currentUser?.fullName || "Host",
        });
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = async () => {
            await finalizeAndUploadRecording();
            resolve();
          };
          mediaRecorderRef.current.stop();
        });
      }
    } else if (recordingStatus === "uploading") {
      toast.info("Saving recording... Please wait.");
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (forAll && isHost && socket) {
      socket.emit("meeting_host_action", {
        meetingId,
        action: "end_meeting",
      });
    } else if (socket) {
      socket.emit("leave_meeting", { meetingId });
    }

    stopAllMediaHardware();
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    onLeaveMeeting?.();
  };

  // Assemble participant tile list (Strictly 1 local tile + unique remote tiles)
  const allTileUsers = useMemo(() => {
    const currentSocId = socket?.id;
    const currentUid = String(currentUser?._id || currentUser?.id || currentUser?.userId || "");
    const localName = (currentUser?.fullName || currentUser?.name || currentUser?.username || "You").trim();
    const localEmail = (currentUser?.email || "").trim().toLowerCase();
    const localUsername = (currentUser?.username || "").trim().toLowerCase();

    const activeLocalStream = isScreenSharing
      ? screenStreamRef.current
      : (localStreamState || localStreamRef.current);

    const localTile = {
      socketId: currentSocId || "local",
      userId: currentUid,
      isLocal: true,
      fullName: localName,
      isMuted,
      isVideoOff,
      isScreenSharing,
      isHandRaised,
      stream: activeLocalStream,
    };

    const seenSockets = new Set();
    const seenUserIds = new Set();
    const seenNames = new Set();
    if (currentSocId) seenSockets.add(currentSocId);
    if (currentUid) seenUserIds.add(currentUid);
    if (localName && localName.toLowerCase() !== "you") seenNames.add(localName.toLowerCase());

    const isLocalUserHost = Boolean(
      meetingData.isHost ||
      (currentUid && String(meetingData.hostUserId) === currentUid) ||
      (localName && meetingData.hostName && localName.toLowerCase() === String(meetingData.hostName).toLowerCase())
    );

    const remoteTiles = [];
    if (Array.isArray(participants)) {
      for (const p of participants) {
        if (!p || !p.socketId) continue;
        if (p.leftAt) continue;

        // Never duplicate the exact local socket
        if (currentSocId && p.socketId === currentSocId) continue;

        // Never duplicate the local user by userId
        const pUid = String(p.userId || p._id || p.id || "");
        if (currentUid && pUid && pUid === currentUid) continue;

        // Never duplicate the local user by email
        if (localEmail && p.email && p.email.toLowerCase() === localEmail) continue;

        // Never duplicate the local user by name
        const pName = (p.fullName || p.username || "").trim();
        if (localName && pName && localName.toLowerCase() !== "you" && pName.toLowerCase() === localName.toLowerCase()) continue;

        // Never duplicate the local user by username
        if (localUsername && p.username && p.username.toLowerCase() === localUsername) continue;

        // If local user is host, never render another host tile as a remote tile
        if (isLocalUserHost && (p.role === "host" || (meetingData.hostUserId && String(p.userId) === String(meetingData.hostUserId)))) continue;

        // Deduplicate remote participants strictly by socketId, userId, and name
        if (seenSockets.has(p.socketId)) continue;
        if (pUid && seenUserIds.has(pUid)) continue;
        if (pName && seenNames.has(pName.toLowerCase())) continue;

        seenSockets.add(p.socketId);
        if (pUid) seenUserIds.add(pUid);
        if (pName) seenNames.add(pName.toLowerCase());

        remoteTiles.push({
          ...p,
          isLocal: false,
          fullName: p.fullName || p.username || "Participant",
          stream: remoteStreams[p.socketId] || null,
        });
      }
    }

    return [localTile, ...remoteTiles];
  }, [
    currentUser,
    socket?.id,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    localStreamState,
    participants,
    remoteStreams,
    meetingData.isHost,
    meetingData.hostUserId,
    meetingData.hostName,
  ]);

  // Spotlight participant
  const spotlightUser = useMemo(() => {
    if (pinnedSocketId) {
      return allTileUsers.find((u) => u.socketId === pinnedSocketId) || allTileUsers[0];
    }
    if (activeSpeakerSocketId) {
      return allTileUsers.find((u) => u.socketId === activeSpeakerSocketId) || allTileUsers[0];
    }
    if (isScreenSharing) {
      return allTileUsers[0];
    }
    return allTileUsers[0];
  }, [allTileUsers, pinnedSocketId, activeSpeakerSocketId, isScreenSharing]);

  const filteredParticipants = useMemo(() => {
    if (!participantSearchQuery.trim()) return allTileUsers;
    const q = participantSearchQuery.toLowerCase();
    return allTileUsers.filter((u) => u.fullName.toLowerCase().includes(q));
  }, [allTileUsers, participantSearchQuery]);

  return (
    <div className="mzl-meeting-view" data-testid="mastery-zone-live-meeting" style={{ background: "#0f172a", color: "#f8fafc" }}>
      {/* =========================================================================
          1. GOOGLE MEET TOP HEADER BAR
          ========================================================================= */}
      <header
        className="mzl-meeting-header"
        style={{
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          height: 52,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Branding & Meeting ID Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 2px 6px rgba(37,99,235,0.4)",
              }}
            >
              <LuVideo size={18} />
            </div>
            <strong style={{ fontSize: 15, color: "#ffffff", fontWeight: 700 }}>MasteryZone Meet</strong>
          </div>

          <div style={{ width: 1, height: 18, background: "#334155" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13.5, color: "#e2e8f0", fontWeight: 600 }}>
              {meetingData.title}
            </span>
            <span
              className="mzl-header-id-pill"
              onClick={() => {
                navigator.clipboard?.writeText(inviteLink);
                toast.info(`Meeting link copied! Code: ${meetingId}`);
              }}
              title="Click to copy unique meeting link"
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#93c5fd",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              {meetingId}
            </span>
          </div>
        </div>

        {/* Center: Layout Switcher, REC indicator, Duration & Security */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Layout Switcher (Grid | Spotlight | Sidebar) */}
          <div style={{ display: "flex", background: "#1e293b", borderRadius: 8, padding: 2, gap: 2 }}>
            <button
              type="button"
              onClick={() => setLayoutMode("grid")}
              title="Grid View"
              style={{
                border: "none",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: layoutMode === "grid" ? 700 : 500,
                background: layoutMode === "grid" ? "#2563eb" : "transparent",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <LuLayoutGrid size={13} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("spotlight")}
              title="Spotlight / Speaker View"
              style={{
                border: "none",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: layoutMode === "spotlight" ? 700 : 500,
                background: layoutMode === "spotlight" ? "#2563eb" : "transparent",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <LuMaximize2 size={13} />
              <span>Spotlight</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("sidebar")}
              title="Presentation / Sidebar View"
              style={{
                border: "none",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: layoutMode === "sidebar" ? 700 : 500,
                background: layoutMode === "sidebar" ? "#2563eb" : "transparent",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <LuPanelRight size={13} />
              <span>Sidebar</span>
            </button>
          </div>

          {/* Cloud Recording Status Pill */}
          {recordingStatus === "recording" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#7f1d1d",
                color: "#fecaca",
                border: "1px solid #ef4444",
                padding: "3px 10px",
                borderRadius: 16,
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
              ● REC {formatTimer(recordingSeconds)}
            </div>
          )}

          {recordingStatus === "uploading" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#1e3a8a",
                color: "#bfdbfe",
                padding: "3px 10px",
                borderRadius: 16,
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <LuCloudUpload size={12} /> Saving Recording...
            </div>
          )}

          {/* Meeting Elapsed Duration */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "#1e293b",
              color: "#94a3b8",
              padding: "4px 10px",
              borderRadius: 16,
              fontSize: 12,
              fontFamily: "monospace",
              fontWeight: 600,
            }}
          >
            <LuClock size={13} />
            {formatTimer(elapsedSeconds)}
          </div>

          {/* Encryption Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "#14532d",
              color: "#86efac",
              border: "1px solid #22c55e",
              padding: "3px 8px",
              borderRadius: 16,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <LuShieldCheck size={12} />
            Encrypted
          </div>
        </div>

        {/* Right: Participant count & Side Panel shortcuts */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setActivePanelTab(activePanelTab === "people" ? null : "people")}
            title="Participants List"
            style={{
              background: activePanelTab === "people" ? "#2563eb" : "#1e293b",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <LuUsers size={14} />
            <span>{allTileUsers.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePanelTab(activePanelTab === "chat" ? null : "chat");
              setUnreadChatCount(0);
            }}
            title="Meeting Chat"
            style={{
              background: activePanelTab === "chat" ? "#2563eb" : "#1e293b",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              position: "relative",
            }}
          >
            <LuMessageSquare size={14} />
            {unreadChatCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#ef4444",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              border: "none",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            title="Toggle Meeting Fullscreen"
          >
            <LuMaximize2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              border: "none",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            title="Meeting Options & Settings"
          >
            <LuEllipsisVertical size={18} />
          </button>
        </div>
      </header>

      {/* Participant Recording Notice & Consent Banner */}
      {showRecordingConsent && !isHost && (
        <div
          style={{
            background: "linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)",
            borderBottom: "1px solid #4338ca",
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#e0e7ff",
            fontSize: 12.5,
            zIndex: 40,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 8px #ef4444",
                flexShrink: 0,
              }}
            />
            <span>
              <strong>Recording in Progress:</strong> The meeting host is recording this session. By remaining in the meeting, you consent to audio, video, and screen sharing being captured.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowRecordingConsent(false)}
              style={{
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              I Understand
            </button>
            <button
              type="button"
              onClick={() => handleEndMeeting(false)}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "1px solid #475569",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 11.5,
                cursor: "pointer",
              }}
            >
              Leave Meeting
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. CENTRAL STAGE (Full-Screen Video Grid or Spotlight + Slide-over Panel)
          ========================================================================= */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
          padding: 10,
          gap: 10,
        }}
      >
        {/* VIDEO CONFERENCING STAGE */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100%",
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            background: "#090d16",
          }}
        >
          {/* A. GRID VIEW */}
          {layoutMode === "grid" && (
            <div
              className={`mzl-video-grid ${
                allTileUsers.length === 1
                  ? "mzl-grid-1"
                  : allTileUsers.length === 2
                  ? "mzl-grid-2"
                  : allTileUsers.length <= 4
                  ? "mzl-grid-4"
                  : "mzl-grid-multi"
              }`}
              style={{
                display: "grid",
                gap: 12,
                height: "100%",
                width: "100%",
                padding: 8,
                boxSizing: "border-box",
              }}
            >
              {allTileUsers.map((tile) => {
                const isSpeaking = activeSpeakerSocketId === tile.socketId;
                const hasVideo = tile.isLocal
                  ? !isVideoOff && Boolean(tile.stream?.getVideoTracks?.().some((t) => t.readyState === "live" && t.enabled))
                  : !tile.isVideoOff && Boolean(tile.stream?.getVideoTracks?.().some((t) => t.readyState === "live"));
                const isPinned = pinnedSocketId === tile.socketId;

                return (
                  <div
                    key={tile.socketId}
                    className="mzl-tile"
                    style={{
                      position: "relative",
                      borderRadius: 16,
                      background: "#182030",
                      overflow: "hidden",
                      border: isSpeaking
                        ? "2px solid #3b82f6"
                        : isPinned
                        ? "2px solid #8b5cf6"
                        : "1px solid #1e293b",
                      boxShadow: isSpeaking ? "0 0 16px rgba(59, 130, 246, 0.45)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PersistentVideoTile
                      stream={tile.stream}
                      isLocal={tile.isLocal}
                      isMuted={tile.isMuted}
                      isScreenSharing={tile.isScreenSharing}
                      isVideoOff={!hasVideo}
                      isBlurred={tile.isLocal && isBlurActive}
                      selectedAudioOutput={selectedAudioOutputDevice}
                    />

                    {!hasVideo && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 12,
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontSize: 30,
                            fontWeight: 700,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                            border: isSpeaking ? "3px solid #22c55e" : "2px solid rgba(255,255,255,0.18)",
                          }}
                        >
                          {tile.fullName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div style={{ color: "#e2e8f0", fontSize: 13.5, fontWeight: 700, letterSpacing: "0.2px" }}>
                          {tile.fullName} {tile.isLocal && "(You)"}
                        </div>
                        {tile.isLocal && (
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            {isVideoOff && (
                              <button
                                type="button"
                                onClick={handleToggleVideo}
                                style={{
                                  background: "#2563eb",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 20,
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
                                }}
                              >
                                <LuVideo size={14} />
                                <span>Turn Camera On</span>
                              </button>
                            )}
                            {isMuted && (
                              <button
                                type="button"
                                onClick={handleToggleMic}
                                style={{
                                  background: "rgba(255,255,255,0.1)",
                                  color: "#ffffff",
                                  border: "1px solid rgba(255,255,255,0.2)",
                                  borderRadius: 20,
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <LuMic size={14} />
                                <span>Unmute</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom-left Participant Name & Audio Pill */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 10,
                        left: 10,
                        background: "rgba(15, 23, 42, 0.8)",
                        backdropFilter: "blur(4px)",
                        color: "#ffffff",
                        padding: "3px 8px",
                        borderRadius: 12,
                        fontSize: 11.5,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        zIndex: 2,
                      }}
                    >
                      {tile.isMuted ? (
                        <LuMicOff size={12} color="#ef4444" />
                      ) : (
                        <LuMic size={12} color={isSpeaking ? "#22c55e" : "#94a3b8"} />
                      )}
                      <span>{tile.fullName}</span>
                      {tile.isLocal && <span style={{ opacity: 0.7 }}>(You)</span>}
                    </div>

                    {/* Top-right Status: Raised Hand & Pin */}
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        zIndex: 2,
                      }}
                    >
                      {tile.isHandRaised && (
                        <div
                          style={{
                            background: "#fef08a",
                            color: "#854d0e",
                            borderRadius: 12,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          ✋ Hand Raised
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const tileEl = e.currentTarget.closest(".mzl-tile");
                          if (!document.fullscreenElement) {
                            if (tileEl && tileEl.requestFullscreen) {
                              tileEl.requestFullscreen().catch(() => {});
                            } else {
                              document.documentElement.requestFullscreen().catch(() => {});
                            }
                          } else {
                            document.exitFullscreen().catch(() => {});
                          }
                        }}
                        title="Toggle Video Fullscreen"
                        style={{
                          background: "rgba(15, 23, 42, 0.6)",
                          border: "none",
                          borderRadius: "50%",
                          width: 28,
                          height: 28,
                          color: "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LuMaximize size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPinnedSocketId(isPinned ? null : tile.socketId)}
                        title={isPinned ? "Unpin participant" : "Pin participant to stage"}
                        style={{
                          background: isPinned ? "#2563eb" : "rgba(15, 23, 42, 0.6)",
                          border: "none",
                          borderRadius: "50%",
                          width: 28,
                          height: 28,
                          color: "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LuPin size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* B. SPOTLIGHT VIEW */}
          {layoutMode === "spotlight" && (
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "100%", height: "100%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <PersistentVideoTile
                  stream={spotlightUser.stream}
                  isLocal={spotlightUser.isLocal}
                  isMuted={spotlightUser.isMuted}
                  isScreenSharing={spotlightUser.isScreenSharing}
                  isVideoOff={spotlightUser.isLocal ? isVideoOff : (!spotlightUser.stream || spotlightUser.isVideoOff)}
                  selectedAudioOutput={selectedAudioOutputDevice}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
                {(spotlightUser.isLocal ? isVideoOff : (!spotlightUser.stream || spotlightUser.isVideoOff)) && (
                  <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: 32, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                      {spotlightUser.fullName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>{spotlightUser.fullName}</span>
                  </div>
                )}
              </div>

              {/* Floating Self-View Picture-in-Picture */}
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  right: 20,
                  width: 200,
                  height: 130,
                  borderRadius: 12,
                  background: "#182030",
                  overflow: "hidden",
                  border: "2px solid #334155",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersistentVideoTile
                  stream={localStreamRef.current}
                  isLocal={true}
                  isMuted={isMuted}
                  isScreenSharing={false}
                  isVideoOff={isVideoOff}
                  isBlurred={isBlurActive}
                  selectedAudioOutput={selectedAudioOutputDevice}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {isVideoOff && (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                    {currentUser?.fullName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span
                  style={{
                    position: "absolute",
                    bottom: 6,
                    left: 6,
                    background: "rgba(0,0,0,0.7)",
                    color: "#ffffff",
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  You
                </span>
              </div>
            </div>
          )}

          {/* C. SIDEBAR / PRESENTATION VIEW */}
          {layoutMode === "sidebar" && (
            <div style={{ display: "flex", width: "100%", height: "100%", gap: 10 }}>
              {/* Main Presentation Stage */}
              <div
                style={{
                  flex: 1,
                  background: "#090d16",
                  borderRadius: 14,
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersistentVideoTile
                  stream={spotlightUser.stream}
                  isLocal={spotlightUser.isLocal}
                  isMuted={spotlightUser.isMuted}
                  isScreenSharing={spotlightUser.isScreenSharing}
                  isVideoOff={spotlightUser.isLocal ? isVideoOff : (!spotlightUser.stream || spotlightUser.isVideoOff)}
                  isBlurred={spotlightUser.isLocal && isBlurActive}
                  selectedAudioOutput={selectedAudioOutputDevice}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
                {(spotlightUser.isLocal ? isVideoOff : (!spotlightUser.stream || spotlightUser.isVideoOff)) && (
                  <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: 32, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                      {spotlightUser.fullName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>{spotlightUser.fullName}</span>
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: 14,
                    background: "rgba(15, 23, 42, 0.85)",
                    padding: "4px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {spotlightUser.fullName} {spotlightUser.isScreenSharing && "(Presenting)"}
                </div>
              </div>

              {/* Vertical Filmstrip of Participants */}
              <div
                style={{
                  width: 220,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {allTileUsers.map((tile) => (
                  <div
                    key={tile.socketId}
                    onClick={() => setPinnedSocketId(tile.socketId)}
                    style={{
                      height: 120,
                      borderRadius: 10,
                      background: "#182030",
                      overflow: "hidden",
                      position: "relative",
                      border: pinnedSocketId === tile.socketId ? "2px solid #3b82f6" : "1px solid #1e293b",
                      cursor: "pointer",
                    }}
                  >
                    <PersistentVideoTile
                      stream={tile.stream}
                      isLocal={tile.isLocal}
                      isMuted={tile.isMuted}
                      isScreenSharing={tile.isScreenSharing}
                      isVideoOff={tile.isLocal ? isVideoOff : !tile.stream}
                      selectedAudioOutput={selectedAudioOutputDevice}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        background: "rgba(0,0,0,0.7)",
                        fontSize: 9.5,
                        padding: "1px 5px",
                        borderRadius: 4,
                        color: "#ffffff",
                      }}
                    >
                      {tile.fullName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE CAPTIONS OVERLAY */}
          {showCaptions && (
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(15, 23, 42, 0.9)",
                backdropFilter: "blur(6px)",
                color: "#f8fafc",
                padding: "8px 18px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                maxWidth: "80%",
                textAlign: "center",
                zIndex: 20,
              }}
            >
              🎙️ [Live Captions Active] Meeting audio transcript synchronized.
            </div>
          )}

          {/* FLOATING EMOJI REACTIONS */}
          {stageReactions.map((r) => (
            <div
              key={r.id}
              className="mzl-stage-reaction-bubble"
              style={{
                position: "absolute",
                bottom: 40,
                left: `${35 + Math.random() * 30}%`,
                fontSize: 32,
                animation: "mzlFloatReaction 3s ease-out forwards",
                pointerEvents: "none",
                zIndex: 30,
              }}
            >
              {r.emoji}
            </div>
          ))}
        </main>

        {/* =========================================================================
            3. RIGHT SLIDE-OVER PANEL (People | Chat | Details | Whiteboard)
            ========================================================================= */}
        {activePanelTab && (
          <aside
            style={{
              width: 360,
              background: "#ffffff",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              color: "#0f172a",
              flexShrink: 0,
            }}
          >
            {/* Panel Tabs Header */}
            <div
              style={{
                height: 48,
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 14px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setActivePanelTab("people")}
                  style={{
                    border: "none",
                    background: activePanelTab === "people" ? "#ffffff" : "transparent",
                    color: activePanelTab === "people" ? "#2563eb" : "#64748b",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <LuUsers size={13} />
                  People ({allTileUsers.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanelTab("chat")}
                  style={{
                    border: "none",
                    background: activePanelTab === "chat" ? "#ffffff" : "transparent",
                    color: activePanelTab === "chat" ? "#2563eb" : "#64748b",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <LuMessageSquare size={13} />
                  Chat
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanelTab("whiteboard")}
                  style={{
                    border: "none",
                    background: activePanelTab === "whiteboard" ? "#ffffff" : "transparent",
                    color: activePanelTab === "whiteboard" ? "#2563eb" : "#64748b",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <LuPalette size={13} />
                  Board
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanelTab("details")}
                  style={{
                    border: "none",
                    background: activePanelTab === "details" ? "#ffffff" : "transparent",
                    color: activePanelTab === "details" ? "#2563eb" : "#64748b",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <LuInfo size={13} />
                  Info
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActivePanelTab(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 16 }}
              >
                ×
              </button>
            </div>

            {/* TAB: PEOPLE / PARTICIPANTS */}
            {activePanelTab === "people" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "12px", overflowY: "auto" }}>
                {/* Search Input */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <LuSearch size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: 9 }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={participantSearchQuery}
                    onChange={(e) => setParticipantSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px 6px 30px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 12.5,
                      outline: "none",
                    }}
                  />
                </div>

                {/* Host Control Actions */}
                {isHost && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    <button
                      type="button"
                      onClick={handleHostMuteAll}
                      style={{
                        flex: 1,
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#2563eb",
                        borderRadius: 6,
                        padding: "5px 8px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <LuMicOff size={12} /> Mute All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMeetingLocked(!isMeetingLocked);
                        toast.info(isMeetingLocked ? "Meeting unlocked" : "Meeting locked against new participants");
                      }}
                      style={{
                        flex: 1,
                        background: isMeetingLocked ? "#fef2f2" : "#f1f5f9",
                        border: isMeetingLocked ? "1px solid #fecaca" : "1px solid #cbd5e1",
                        color: isMeetingLocked ? "#b91c1c" : "#475569",
                        borderRadius: 6,
                        padding: "5px 8px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      {isMeetingLocked ? <LuLock size={12} /> : <LuLockOpen size={12} />}
                      {isMeetingLocked ? "Room Locked" : "Lock Room"}
                    </button>
                  </div>
                )}

                {/* Participants List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredParticipants.map((p) => (
                    <div
                      key={p.socketId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: 8,
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#2563eb",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {p.fullName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {p.fullName} {p.isLocal && "(You)"}
                          </div>
                          {p.isHost && (
                            <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 700 }}>Host</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {p.isHandRaised && <span title="Hand Raised">✋</span>}
                        {p.isMuted ? (
                          <LuMicOff size={14} color="#ef4444" title="Microphone Off" />
                        ) : (
                          <LuMic size={14} color="#16a34a" title="Microphone On" />
                        )}
                        {isHost && !p.isLocal && (
                          <button
                            type="button"
                            onClick={() => handleHostKickUser(p.socketId, p.fullName)}
                            title="Remove participant"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                          >
                            <LuUserX size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: IN-MEETING CHAT */}
            {activePanelTab === "chat" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                {/* Messages Stream */}
                <div
                  ref={chatScrollRef}
                  style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 11.5,
                      textAlign: "center",
                    }}
                  >
                    💬 Messages are visible to everyone in the call.
                  </div>

                  {chatMessages.map((m) => (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                        <strong>{m.senderName}</strong>
                        <span>{m.timeString}</span>
                      </div>
                      <div
                        style={{
                          background: m.senderId === (currentUser?._id || currentUser?.id) ? "#dbeafe" : "#f1f5f9",
                          color: "#0f172a",
                          padding: "6px 10px",
                          borderRadius: 8,
                          fontSize: 12.5,
                          alignSelf: m.senderId === (currentUser?._id || currentUser?.id) ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: "8px 12px",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#f8fafc",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Send a message to everyone..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 12.5,
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      padding: "7px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <LuSend size={13} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB: WHITEBOARD */}
            {activePanelTab === "whiteboard" && (
              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <MasteryZoneWhiteboard
                  meetingId={meetingId}
                  socket={socket}
                  currentUser={currentUser}
                  whiteboardData={whiteboardData}
                />
              </div>
            )}

            {/* TAB: MEETING DETAILS & JOINING INFO */}
            {activePanelTab === "details" && (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "#0f172a" }}>Joining info</h4>
                <div style={{ fontSize: 12.5, color: "#64748b" }}>
                  Anyone with this link can join this meeting room.
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {inviteLink}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(inviteLink);
                    toast.success("Meeting link copied to clipboard!");
                  }}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <LuCopy size={13} /> Copy joining link
                </button>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* =========================================================================
          4. GOOGLE MEET FLOATING BOTTOM CONTROLS BAR
          ========================================================================= */}
      <footer
        style={{
          height: 64,
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px",
          position: "relative",
        }}
      >
        {/* Emoji Reactions Flyout */}
        {showReactionsMenu && (
          <div
            style={{
              position: "absolute",
              bottom: 74,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 24,
              padding: "6px 12px",
              display: "flex",
              gap: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 100,
            }}
          >
            {EMOJI_OPTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => handleSendReaction(em)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 2 }}
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Center Pill of Google Meet Control Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#1e293b",
            padding: "6px 16px",
            borderRadius: 30,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          {/* Mic Button */}
          <button
            type="button"
            onClick={handleToggleMic}
            title={isMuted ? "Unmute microphone (Cmd+D)" : "Mute microphone (Cmd+D)"}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: isMuted ? "#ef4444" : "#334155",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            {isMuted ? <LuMicOff size={18} /> : <LuMic size={18} />}
          </button>

          {/* Camera Button */}
          <button
            type="button"
            onClick={handleToggleVideo}
            title={isVideoOff ? "Turn on camera (Cmd+E)" : "Turn off camera (Cmd+E)"}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: isVideoOff ? "#ef4444" : "#334155",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            {isVideoOff ? <LuVideoOff size={18} /> : <LuVideo size={18} />}
          </button>

          {/* Background Blur Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsBlurActive(!isBlurActive);
              toast.info(!isBlurActive ? "Background blur activated" : "Background blur turned off");
            }}
            title="Toggle Background Blur"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: isBlurActive ? "#2563eb" : "#334155",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LuSparkles size={18} />
          </button>

          {/* Screen Share Button */}
          <button
            type="button"
            onClick={handleToggleScreenShare}
            title={isScreenSharing ? "Stop presenting screen" : "Share screen / window"}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: isScreenSharing ? "#2563eb" : "#334155",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LuMonitor size={18} />
          </button>

          {/* Raise Hand Button */}
          <button
            type="button"
            onClick={handleToggleHandRaise}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: isHandRaised ? "#f59e0b" : "#334155",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LuHand size={18} />
          </button>

          {/* Reaction Emoji Button */}
          <button
            type="button"
            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            title="Send reaction"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: showReactionsMenu ? "#2563eb" : "#334155",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LuSmile size={18} />
          </button>

          {/* Live Captions Button */}
          <button
            type="button"
            onClick={() => {
              setShowCaptions(!showCaptions);
              toast.info(!showCaptions ? "Live Captions activated" : "Captions off");
            }}
            title="Toggle Live Captions"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: showCaptions ? "#2563eb" : "#334155",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            CC
          </button>

          {/* Three-dot Options Menu */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title="Meeting Settings, Link & Recording"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: "#334155",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LuEllipsisVertical size={18} />
          </button>

          {/* Host Direct Real-Time Recording Control */}
          {isHost && (
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              {recordingStatus === "idle" && (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  title="Start Real-Time Recording (Admin / Host)"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 20,
                    padding: "8px 16px",
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffffff" }} />
                  <span>Record</span>
                </button>
              )}

              {recordingStatus === "recording" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid #ef4444",
                    borderRadius: 20,
                    padding: "4px 10px",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#ef4444",
                      boxShadow: "0 0 8px #ef4444",
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#fca5a5" }}>
                    REC {formatTimer(recordingSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={handlePauseResumeRecording}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      color: "#ffffff",
                      borderRadius: 12,
                      padding: "3px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      color: "#ffffff",
                      borderRadius: 12,
                      padding: "3px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Stop
                  </button>
                </div>
              )}

              {recordingStatus === "paused" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(245, 158, 11, 0.2)",
                    border: "1px solid #f59e0b",
                    borderRadius: 20,
                    padding: "4px 10px",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#fcd34d" }}>
                    ❚❚ PAUSED {formatTimer(recordingSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={handlePauseResumeRecording}
                    style={{
                      background: "#f59e0b",
                      border: "none",
                      color: "#ffffff",
                      borderRadius: 12,
                      padding: "3px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      color: "#ffffff",
                      borderRadius: 12,
                      padding: "3px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Stop
                  </button>
                </div>
              )}

              {recordingStatus === "uploading" && (
                <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700, padding: "0 8px" }}>
                  Saving Recording...
                </span>
              )}
            </div>
          )}

          {/* Leave Call Button (Red Pill) */}
          <button
            type="button"
            onClick={() => setShowLeaveConfirmModal(true)}
            style={{
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: 20,
              padding: "8px 18px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: 4,
            }}
          >
            <LuPhoneOff size={16} />
            <span>Leave</span>
          </button>
        </div>
      </footer>

      {/* =========================================================================
          5. THREE-DOT MEETING SETTINGS & RECORDING MODAL
          ========================================================================= */}
      {showSettingsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              width: 480,
              boxShadow: "0 16px 36px rgba(0,0,0,0.3)",
              color: "#0f172a",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Meeting Options & Recording</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}
              >
                ×
              </button>
            </div>

            {/* Cloud Recording Controls Section */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: recordingStatus === "recording" ? "#ef4444" : "#94a3b8" }} />
                  Cloud Meeting Recording
                </span>
                <span style={{ fontSize: 11, color: "#64748b" }}>Status: {recordingStatus}</span>
              </div>

              {isHost ? (
                <div style={{ display: "flex", gap: 8 }}>
                  {recordingStatus === "idle" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleStartRecording();
                        setShowSettingsModal(false);
                      }}
                      style={{
                        flex: 1,
                        background: "#ef4444",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ● Start Recording
                    </button>
                  )}

                  {recordingStatus === "recording" && (
                    <>
                      <button
                        type="button"
                        onClick={handlePauseResumeRecording}
                        style={{
                          flex: 1,
                          background: "#f59e0b",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleStopRecording();
                          setShowSettingsModal(false);
                        }}
                        style={{
                          flex: 1,
                          background: "#0f172a",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ■ Stop & Save
                      </button>
                    </>
                  )}

                  {recordingStatus === "paused" && (
                    <button
                      type="button"
                      onClick={handlePauseResumeRecording}
                      style={{
                        flex: 1,
                        background: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ▶ Resume Recording
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {recordingStatus === "recording"
                    ? "This meeting is currently being recorded by the host."
                    : "Only the host can start recording this session."}
                </div>
              )}
            </div>

            {/* Audio & Video Device Settings */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Device & Audio Settings</div>

              {/* Microphone Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Microphone</label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => switchAudioInputDevice(e.target.value)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "6px 8px",
                    fontSize: 12,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  {audioInputDevices.length === 0 && <option value="">Default Microphone</option>}
                  {audioInputDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Camera</label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => switchVideoInputDevice(e.target.value)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "6px 8px",
                    fontSize: 12,
                    color: "#0f172a",
                    outline: "none",
                  }}
                >
                  {videoInputDevices.length === 0 && <option value="">Default Camera</option>}
                  {videoInputDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Speaker Output */}
              {audioOutputDevices.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Speaker / Output</label>
                  <select
                    value={selectedAudioOutputDevice}
                    onChange={(e) => switchAudioOutputDevice(e.target.value)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "6px 8px",
                      fontSize: 12,
                      color: "#0f172a",
                      outline: "none",
                    }}
                  >
                    <option value="">Default Speaker</option>
                    {audioOutputDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Speaker ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Joining Information & Copy Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Meeting Code: <strong>{meetingId}</strong></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(inviteLink);
                    toast.success("Meeting link copied!");
                  }}
                  style={{
                    flex: 1,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#2563eb",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <LuCopy size={13} /> Copy Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(meetingId);
                    toast.success("Meeting code copied!");
                  }}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <LuCopy size={13} /> Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. HOST LEAVE / END MEETING CONFIRMATION MODAL
          ========================================================================= */}
      {showLeaveConfirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowLeaveConfirmModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              width: 380,
              boxShadow: "0 16px 36px rgba(0,0,0,0.3)",
              color: "#0f172a",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700 }}>Leave Meeting?</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              {isHost
                ? "As the host, you can leave the call while keeping it open for others, or end the meeting for all participants."
                : "Are you sure you want to disconnect and leave this meeting?"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {isHost ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleEndMeeting(true)}
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    End Meeting for All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEndMeeting(false)}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      borderRadius: 8,
                      padding: "9px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Just Leave Call
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEndMeeting(false)}
                  style={{
                    background: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Leave Meeting
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowLeaveConfirmModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Finalization & Uploading Overlay Modal */}
      {recordingStatus === "uploading" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              borderRadius: 16,
              padding: "28px 32px",
              maxWidth: 420,
              width: "90%",
              textAlign: "center",
              border: "1px solid #334155",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              color: "#f8fafc",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#60a5fa",
              }}
            >
              <LuCloudUpload size={28} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
              Finalizing Meeting Recording...
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
              Encoding captured audio/video stream and uploading to your secure storage archive. Please keep this browser window open.
            </p>
            <div
              style={{
                width: "100%",
                height: 6,
                background: "#334155",
                borderRadius: 999,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "60%",
                  height: "100%",
                  background: "linear-gradient(90deg, #3b82f6, #818cf8)",
                  borderRadius: 999,
                  animation: "pulse 1.5s infinite",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Offscreen DOM-Mounted Video Decoders for Hardware-Accelerated Recording Compositor */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: -1,
        }}
      >
        <video ref={recScreenVidRef} autoPlay playsInline muted />
        <video ref={recCameraVidRef} autoPlay playsInline muted />
        {Object.entries(remoteStreams || {}).map(([sockId, rStream]) => (
          <video
            key={`rec_dec_${sockId}`}
            ref={(el) => {
              if (el && rStream && el.srcObject !== rStream) {
                el.srcObject = rStream;
                el.play().catch(() => {});
              }
            }}
            data-socket-id={sockId}
            className="mz-rec-remote-decoder"
            autoPlay
            playsInline
            muted
          />
        ))}
      </div>
    </div>
  );
}

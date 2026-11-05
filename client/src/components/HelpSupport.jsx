import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  LuLifeBuoy,
  LuTicket,
  LuCircleCheck,
  LuClock,
  LuCircleAlert,
  LuSearch,
  LuSend,
  LuMessageSquare,
  LuShieldCheck,
  LuCode,
  LuAward,
  LuFileText,
  LuVideo,
  LuFolderGit2,
  LuKey,
  LuChevronRight,
  LuArrowLeft,
  LuRefreshCw,
  LuSparkles,
  LuUser,
  LuShield,
  LuCircleHelp,
  LuExternalLink,
  LuCheck,
  LuPlus,
  LuFlame,
  LuGraduationCap,
  LuPaperclip,
  LuCloudUpload,
  LuDownload,
  LuFile,
  LuImage,
  LuX,
  LuCopy,
  LuZoomIn,
} from "react-icons/lu";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import "./home.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isImageAttachment = (att) => {
  if (!att) return false;
  const mt = (att.mimeType || "").toLowerCase();
  const fn = (att.fileName || att.originalName || "").toLowerCase();
  return (
    mt.startsWith("image/") ||
    fn.endsWith(".png") ||
    fn.endsWith(".jpg") ||
    fn.endsWith(".jpeg") ||
    fn.endsWith(".webp") ||
    fn.endsWith(".gif") ||
    fn.endsWith(".svg")
  );
};

const getAttachmentUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("data:") || fileUrl.startsWith("blob:") || fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const clean = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${API_BASE}${clean}`;
};

const CATEGORIES = [
  {
    id: "Login and Authentication",
    title: "Login & Authentication",
    desc: "Password reset, OTP verification, session expiration, and credential access.",
    icon: LuKey,
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    id: "Coding Compiler Issues",
    title: "Coding Compiler & IDE",
    desc: "Syntax execution errors, infinite loops, timeout issues, and language runtimes.",
    icon: LuCode,
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  {
    id: "Assignments and Assessments",
    title: "Assignments & Assessments",
    desc: "Test submission issues, proctoring locks, webcam/screen permissions, timers.",
    icon: LuFileText,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  {
    id: "Reports and Marks",
    title: "Reports & Marks",
    desc: "Scorecard discrepancies, missing module marks, pass/fail verification.",
    icon: LuShieldCheck,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    id: "Projects and Progress",
    title: "Projects & Progress",
    desc: "Industry project git submissions, milestones tracking, streak sync.",
    icon: LuFolderGit2,
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    id: "Meetings and Recordings",
    title: "Meetings & Recordings",
    desc: "Live study pod connection, screen share video playback, audio channels.",
    icon: LuVideo,
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  {
    id: "Certificates",
    title: "Official Certificates",
    desc: "Credential generation, verification QR/URL, distinction honors, PDF download.",
    icon: LuAward,
    color: "#9333ea",
    bg: "#faf5ff",
    border: "#f3e8ff",
  },
  {
    id: "Other Technical Issues",
    title: "Other Technical Issues",
    desc: "Browser incompatibilities, platform performance, UI rendering errors.",
    icon: LuCircleHelp,
    color: "#475569",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
];

const HelpSupport = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTicketId = searchParams.get("ticket");

  const [activeTab, setActiveTab] = useState("submit"); // "submit" | "tickets"
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[1].id);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);

  // Attachment states for ticket creation
  const [newAttachments, setNewAttachments] = useState([]);
  const [uploadingNew, setUploadingNew] = useState(false);
  const fileInputRef = useRef(null);

  // User Tickets State
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTicket, setActiveTicket] = useState(null);

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [uploadingReply, setUploadingReply] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const replyFileInputRef = useRef(null);

  // Real-time & Typing States
  const [isConnected, setIsConnected] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const socketRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const adminTypingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Image Lightbox Viewer
  const [lightboxAttachment, setLightboxAttachment] = useState(null);
  const isSubmittingRef = useRef(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // Upload helper using base64 payload to ensure 100% native stability
  const uploadAttachmentFile = async (file) => {
    const previewBlobUrl = file.type && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const token = localStorage.getItem("token");
          const base64Data = reader.result;
          const res = await fetch(`${API_BASE}/api/support/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              originalName: file.name,
              mimeType: file.type || "application/octet-stream",
              base64Data,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.attachment) {
            resolve({
              ...data.attachment,
              previewUrl: previewBlobUrl || data.attachment.fileUrl,
            });
          } else {
            reject(new Error(data.message || "Upload failed"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesChosen = async (files, target = "new") => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    if (target === "new") setUploadingNew(true);
    else setUploadingReply(true);

    try {
      for (const file of fileList) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds 15MB limit.`, { toastId: `err-size-${file.name}` });
          continue;
        }
        const uploaded = await uploadAttachmentFile(file);
        if (target === "new") {
          setNewAttachments((prev) => [...prev, uploaded]);
        } else {
          setReplyAttachments((prev) => [...prev, uploaded]);
        }
        toast.success(`Attached: ${file.name}`, { toastId: `att-${file.name}`, autoClose: 2000 });
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload attachment", { toastId: "upload-error" });
    } finally {
      if (target === "new") setUploadingNew(false);
      else setUploadingReply(false);
    }
  };

  const fetchMyTickets = async (silent = false) => {
    try {
      if (!silent) setLoadingTickets(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/support/my-tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMyTickets(data.tickets || []);
          if (requestedTicketId) {
            const found = (data.tickets || []).find((t) => t.ticketId === requestedTicketId);
            if (found) {
              setActiveTicket(found);
              setActiveTab("tickets");
            }
          } else if (activeTicket) {
            const refreshed = (data.tickets || []).find((t) => t.ticketId === activeTicket.ticketId);
            if (refreshed) setActiveTicket(refreshed);
          }
        }
      }
    } catch (err) {
      console.error("Fetch tickets error:", err);
    } finally {
      if (!silent) setLoadingTickets(false);
    }
  };

  // 1. Socket.io Connection & Listeners
  useEffect(() => {
    fetchMyTickets();

    let socket;
    try {
      const token = localStorage.getItem("token");
      socket = io(API_BASE || window.location.origin, {
        auth: { token },
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        const uid = user?._id || user?.userId;
        if (uid) {
          socket.emit("authenticate_user", { userId: uid });
        }
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("TICKET_UPDATED", (updatedTicket) => {
        if (!updatedTicket) return;
        setMyTickets((prev) =>
          prev.map((t) => (t.ticketId === updatedTicket.ticketId ? updatedTicket : t))
        );
        setActiveTicket((current) => {
          if (current && current.ticketId === updatedTicket.ticketId) {
            return updatedTicket;
          }
          return current;
        });
        toast.info(`🔔 Support Ticket ${updatedTicket.ticketId} updated: Status is ${updatedTicket.status}`);
      });

      socket.on("TICKET_CREATED", (newTkt) => {
        if (!newTkt) return;
        setMyTickets((prev) => [newTkt, ...prev.filter((t) => t.ticketId !== newTkt.ticketId)]);
      });

      socket.on("TICKET_MESSAGE_ADDED", ({ ticketId, message }) => {
        setActiveTicket((curr) => {
          if (curr && curr.ticketId === ticketId) {
            const exists = curr.messages?.some((m) => m._id && m._id === message._id);
            if (!exists) {
              return {
                ...curr,
                messages: [...(curr.messages || []), message],
              };
            }
          }
          return curr;
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      });

      socket.on("ticket_typing_update", ({ ticketId, userRole, isTyping }) => {
        if (activeTicket?.ticketId === ticketId && userRole === "ADMIN") {
          setAdminTyping(isTyping);
          if (isTyping) {
            clearTimeout(adminTypingTimeoutRef.current);
            adminTypingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 3000);
          }
        }
      });
    } catch (err) {
      console.warn("Socket connection warning:", err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // 2. Join specific ticket room when active ticket changes
  useEffect(() => {
    if (activeTicket?.ticketId && socketRef.current) {
      socketRef.current.emit("join_ticket_room", activeTicket.ticketId);
      return () => {
        socketRef.current?.emit("leave_ticket_room", activeTicket.ticketId);
      };
    }
  }, [activeTicket?.ticketId]);

  // When requestedTicketId query parameter changes, open it
  useEffect(() => {
    if (requestedTicketId && myTickets.length > 0) {
      const found = myTickets.find((t) => t.ticketId === requestedTicketId);
      if (found) {
        setActiveTicket(found);
        setActiveTab("tickets");
      }
    }
  }, [requestedTicketId, myTickets]);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || submitting) return;

    if (!subject.trim()) {
      toast.error("Please enter a brief subject for your issue.", { toastId: "err-sub" });
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a detailed problem description.", { toastId: "err-desc" });
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: selectedCategory,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          attachments: newAttachments.map((a) => ({
            fileName: a.fileName,
            originalName: a.originalName,
            fileUrl: a.fileUrl,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.dismiss();
        toast.success(`🎉 Ticket ${data.ticket.ticketId} submitted! Confirmation email sent.`, {
          toastId: "ticket_submit_success",
          autoClose: 3500,
        });
        setSubject("");
        setDescription("");
        setPriority("Medium");
        setNewAttachments([]);
        setMyTickets((prev) => [data.ticket, ...prev.filter((t) => t.ticketId !== data.ticket.ticketId)]);
        setActiveTicket(data.ticket);
        setActiveTab("tickets");
        setSearchParams({ ticket: data.ticket.ticketId });
      } else {
        toast.error(data.message || "Failed to submit support ticket.", { toastId: "ticket_submit_error" });
      }
    } catch (err) {
      console.error("Submit ticket error:", err);
      toast.error("Network error while submitting ticket.", { toastId: "ticket_submit_net_error" });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleReplyChange = (e) => {
    setReplyText(e.target.value);
    if (socketRef.current && activeTicket) {
      socketRef.current.emit("ticket_typing", {
        ticketId: activeTicket.ticketId,
        userName: user?.fullName || "Student",
        userRole: "USER",
        isTyping: true,
      });
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        socketRef.current?.emit("ticket_typing", {
          ticketId: activeTicket.ticketId,
          userName: user?.fullName || "Student",
          userRole: "USER",
          isTyping: false,
        });
      }, 1500);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if ((!replyText.trim() && replyAttachments.length === 0) || !activeTicket) return;

    setSendingReply(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/support/tickets/${activeTicket.ticketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: replyText.trim(),
          attachments: replyAttachments,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Reply added to ticket discussion.");
        setReplyText("");
        setReplyAttachments([]);
        setActiveTicket(data.ticket);
        setMyTickets((prev) =>
          prev.map((t) => (t.ticketId === data.ticket.ticketId ? data.ticket : t))
        );
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        toast.error(data.message || "Failed to send reply.");
      }
    } catch (err) {
      console.error("Reply error:", err);
      toast.error("Network error while posting reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTickets = myTickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      return (
        t.ticketId.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Submitted":
        return { bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff", label: "Submitted" };
      case "Under Review":
        return { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Under Review" };
      case "In Progress":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "In Progress" };
      case "Resolved":
        return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Resolved" };
      default:
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: status };
    }
  };

  const renderAttachments = (attachments, isWhiteTheme = false) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {attachments.map((att, idx) => {
          const isImg = isImageAttachment(att);
          const attUrl = getAttachmentUrl(att.previewUrl || att.fileUrl);
          if (isImg) {
            return (
              <div
                key={att._id || idx}
                onClick={() => setLightboxAttachment({ ...att, fileUrl: attUrl })}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: isWhiteTheme ? "1px solid rgba(255,255,255,0.3)" : "1px solid #cbd5e1",
                  background: isWhiteTheme ? "rgba(255,255,255,0.15)" : "#f1f5f9",
                  width: 140,
                  height: 95,
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                }}
                title="Click to inspect high-resolution image"
              >
                <img
                  src={attUrl}
                  alt={att.originalName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    const fname = att.fileName || (att.fileUrl ? att.fileUrl.split("/").pop() : "");
                    if (fname && !e.currentTarget.src.includes(`/api/support/attachments/${fname}`)) {
                      e.currentTarget.src = `${API_BASE}/api/support/attachments/${fname}`;
                    }
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    opacity: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <LuZoomIn size={22} />
                </div>
              </div>
            );
          }
          return (
            <a
              key={att._id || idx}
              href={attUrl}
              target="_blank"
              rel="noreferrer"
              download={att.originalName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: isWhiteTheme ? "rgba(255,255,255,0.15)" : "#ffffff",
                color: isWhiteTheme ? "#ffffff" : "#1e293b",
                border: isWhiteTheme ? "1px solid rgba(255,255,255,0.25)" : "1px solid #cbd5e1",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                maxWidth: 260,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
            >
              <LuFileText size={18} color={isWhiteTheme ? "#ffffff" : "#4f46e5"} />
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{att.originalName}</div>
                <span style={{ fontSize: 10.5, opacity: 0.75 }}>{formatFileSize(att.fileSize)}</span>
              </div>
              <LuDownload size={14} style={{ marginLeft: "auto", flexShrink: 0 }} />
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div className="home-container" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* ────────────────── TOP NAVIGATION BAR ────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => navigate("/home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "7px 12px",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LuArrowLeft style={{ width: 15, height: 15 }} />
            <span>Dashboard</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 10px rgba(79, 70, 229, 0.25)",
              }}
            >
              <LuLifeBuoy style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  MasteryZone Help & Support Center
                </h1>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: isConnected ? "#ecfdf5" : "#f1f5f9",
                    color: isConnected ? "#059669" : "#64748b",
                    border: `1px solid ${isConnected ? "#a7f3d0" : "#cbd5e1"}`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isConnected ? "#10b981" : "#94a3b8",
                      animation: isConnected ? "pulse 2s infinite" : "none",
                    }}
                  />
                  {isConnected ? "Live Real-Time Sync" : "Connecting..."}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                24/7 Technical Support, File Attachment Inspection & Issue Resolution
              </p>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => {
              setActiveTab("submit");
              setActiveTicket(null);
              setSearchParams({});
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: activeTab === "submit" && !activeTicket ? "#4f46e5" : "#f1f5f9",
              color: activeTab === "submit" && !activeTicket ? "#ffffff" : "#475569",
              boxShadow: activeTab === "submit" && !activeTicket ? "0 2px 8px rgba(79, 70, 229, 0.25)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <LuPlus style={{ width: 15, height: 15 }} />
            <span>Report New Issue</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("tickets");
              fetchMyTickets(true);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: activeTab === "tickets" || activeTicket ? "#4f46e5" : "#f1f5f9",
              color: activeTab === "tickets" || activeTicket ? "#ffffff" : "#475569",
              boxShadow: activeTab === "tickets" || activeTicket ? "0 2px 8px rgba(79, 70, 229, 0.25)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <LuTicket style={{ width: 15, height: 15 }} />
            <span>My Support Tickets ({myTickets.length})</span>
          </button>
        </div>
      </header>

      {/* ────────────────── MAIN CONTENT CONTAINER ────────────────── */}
      <main style={{ maxWidth: 1280, margin: "24px auto", padding: "0 20px" }}>
        {activeTicket ? (
          /* ── TICKET CONVERSATION DETAIL VIEW ── */
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                background: "#fafafa",
              }}
            >
              <div>
                <button
                  onClick={() => {
                    setActiveTicket(null);
                    setSearchParams({});
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#4f46e5",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: 0,
                    marginBottom: 6,
                  }}
                >
                  <LuArrowLeft style={{ width: 14, height: 14 }} />
                  <span>Back to all tickets</span>
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      color: "#4338ca",
                      fontSize: 14,
                      background: "#eef2ff",
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #c7d2fe",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(activeTicket.ticketId);
                      toast.info(`Copied Ticket ID: ${activeTicket.ticketId}`);
                    }}
                    title="Click to copy ticket ID"
                  >
                    {activeTicket.ticketId}
                    <LuCopy size={12} />
                  </span>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                    {activeTicket.subject}
                  </h2>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {(() => {
                  const badge = getStatusBadge(activeTicket.status);
                  return (
                    <span
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 12.5,
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {activeTicket.status === "Resolved" ? (
                        <LuCircleCheck style={{ width: 14, height: 14 }} />
                      ) : (
                        <LuClock style={{ width: 14, height: 14 }} />
                      )}
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748b",
                    padding: "4px 10px",
                    background: "#f1f5f9",
                    borderRadius: 6,
                  }}
                >
                  Category: {activeTicket.category}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#dc2626",
                    padding: "4px 10px",
                    background: "#fef2f2",
                    borderRadius: 6,
                    border: "1px solid #fecaca",
                  }}
                >
                  Priority: {activeTicket.priority || "Medium"}
                </span>
              </div>
            </div>

            {/* Initial Ticket Overview & Attachments Strip */}
            {activeTicket.attachments && activeTicket.attachments.length > 0 && (
              <div
                style={{
                  padding: "12px 24px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  📎 Ticket Attachments & Evidence ({activeTicket.attachments.length}):
                </div>
                {renderAttachments(activeTicket.attachments)}
              </div>
            )}

            {/* Conversation Thread Messages */}
            <div
              style={{
                padding: "24px",
                maxHeight: 520,
                overflowY: "auto",
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {(activeTicket.messages || []).map((msg, idx) => {
                const isAdmin = msg.senderRole === "ADMIN";
                return (
                  <div
                    key={msg._id || idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isAdmin ? "flex-start" : "flex-end",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      {isAdmin ? (
                        <>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "#4f46e5",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            <LuShield style={{ width: 11, height: 11 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: "#4f46e5" }}>
                            {msg.senderName} (Administrator)
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 600, color: "#334155" }}>
                            {msg.senderName} (You)
                          </span>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "#3b82f6",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            <LuUser style={{ width: 11, height: 11 }} />
                          </div>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : ""}
                      </span>
                    </div>

                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: isAdmin ? "#ffffff" : "#4f46e5",
                        color: isAdmin ? "#1e293b" : "#ffffff",
                        border: isAdmin ? "1px solid #e2e8f0" : "none",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.message}
                      {renderAttachments(msg.attachments, !isAdmin)}
                    </div>
                  </div>
                );
              })}

              {/* Real-Time Admin Typing Indicator */}
              {adminTyping && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#ffffff",
                    padding: "8px 14px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    width: "fit-content",
                    fontSize: 12.5,
                    color: "#4f46e5",
                    fontWeight: 600,
                  }}
                >
                  <LuShield size={14} />
                  <span>Support Admin is typing a response...</span>
                  <span className="typing-dots">● ● ●</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Resolution Banner */}
            {activeTicket.status === "Resolved" && (
              <div
                style={{
                  padding: "14px 24px",
                  background: "#ecfdf5",
                  borderTop: "1px solid #a7f3d0",
                  borderBottom: "1px solid #a7f3d0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "#065f46",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <LuCircleCheck style={{ width: 18, height: 18, color: "#059669" }} />
                <span>
                  This support ticket is marked as <strong>Resolved</strong> by our engineering team. If
                  you need further assistance, reply below to reopen the ticket.
                </span>
              </div>
            )}

            {/* Reply Input Box with File Attachment capability */}
            <div style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
              {replyAttachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "12px 20px 0" }}>
                  {replyAttachments.map((att, idx) => {
                    const isImg = isImageAttachment(att);
                    const displayUrl = getAttachmentUrl(att.previewUrl || att.fileUrl);
                    if (isImg) {
                      return (
                        <div
                          key={att.fileName || idx}
                          style={{
                            position: "relative",
                            width: 80,
                            height: 60,
                            borderRadius: 6,
                            overflow: "hidden",
                            border: "1px solid #bfdbfe",
                            background: "#eff6ff",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                            cursor: "pointer",
                          }}
                          onClick={() => setLightboxAttachment({ ...att, fileUrl: displayUrl })}
                          title="Click to view full image"
                        >
                          <img
                            src={displayUrl}
                            alt={att.originalName}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              const fname = att.fileName || (att.fileUrl ? att.fileUrl.split("/").pop() : "");
                              if (fname && !e.currentTarget.src.includes(`/api/support/attachments/${fname}`)) {
                                e.currentTarget.src = `${API_BASE}/api/support/attachments/${fname}`;
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyAttachments((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "rgba(220, 38, 38, 0.9)",
                              border: "none",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                              zIndex: 2,
                            }}
                            title="Remove attachment"
                          >
                            <LuX size={12} />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={att.fileName || idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: 6,
                          fontSize: 12,
                          color: "#1e40af",
                          fontWeight: 600,
                        }}
                      >
                        <LuFileText size={13} />
                        <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {att.originalName}
                        </span>
                        <span style={{ fontSize: 10.5, opacity: 0.75 }}>({formatFileSize(att.fileSize)})</span>
                        <button
                          type="button"
                          onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <LuX size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <form onSubmit={handleSendReply} style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    multiple
                    accept="image/*,.pdf,.txt,.log,.json,.js,.py,.cpp,.java,.html,.css"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleFilesChosen(e.target.files, "reply");
                        e.target.value = "";
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    title="Attach screenshot or error log"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: uploadingReply ? "#e0e7ff" : "#f8fafc",
                      color: "#475569",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 44,
                    }}
                  >
                    {uploadingReply ? (
                      <LuRefreshCw className="animate-spin" size={16} />
                    ) : (
                      <LuPaperclip size={16} />
                    )}
                    <span>{uploadingReply ? "Uploading..." : "Attach"}</span>
                  </button>

                  <textarea
                    value={replyText}
                    onChange={handleReplyChange}
                    placeholder="Type your reply or additional details here..."
                    rows={2}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                      minHeight: 44,
                    }}
                  />

                  <button
                    type="submit"
                    disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                    style={{
                      padding: "0 24px",
                      height: 44,
                      borderRadius: 8,
                      border: "none",
                      background: replyText.trim() || replyAttachments.length > 0 ? "#4f46e5" : "#cbd5e1",
                      color: "#ffffff",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: replyText.trim() || replyAttachments.length > 0 ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {sendingReply ? (
                      <LuRefreshCw className="animate-spin" style={{ width: 16, height: 16 }} />
                    ) : (
                      <LuSend style={{ width: 16, height: 16 }} />
                    )}
                    <span>Reply</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeTab === "tickets" ? (
          /* ── MY TICKETS LIST VIEW ── */
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 14,
              }}
            >
              <div style={{ position: "relative", minWidth: 300 }}>
                <LuSearch
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    width: 16,
                    height: 16,
                  }}
                />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search tickets by ID, subject, or category..."
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 36px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    background: "#ffffff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Status Filters */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {["all", "Submitted", "Under Review", "In Progress", "Resolved"].map((st) => {
                  const isActive = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        background: isActive ? "#4f46e5" : "#f1f5f9",
                        color: isActive ? "#ffffff" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {st === "all" ? "All Tickets" : st}
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingTickets ? (
              <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
                <LuRefreshCw className="animate-spin" style={{ width: 28, height: 28, margin: "0 auto 10px" }} />
                <div>Loading your support tickets...</div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  padding: "50px 20px",
                  textAlign: "center",
                  border: "1px solid #e2e8f0",
                }}
              >
                <LuTicket style={{ width: 44, height: 44, color: "#cbd5e1", margin: "0 auto 12px" }} />
                <h3 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: 16 }}>No Support Tickets Found</h3>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
                  {ticketSearch || statusFilter !== "all"
                    ? "No tickets match your active filter."
                    : "You haven't submitted any support requests yet."}
                </p>
                <button
                  onClick={() => setActiveTab("submit")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Create a Support Request
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredTickets.map((t) => {
                  const badge = getStatusBadge(t.status);
                  const msgCount = t.messages?.length || 1;
                  const totalAttachments = (t.attachments?.length || 0) + (t.messages?.reduce((acc, m) => acc + (m.attachments?.length || 0), 0) || 0);

                  return (
                    <div
                      key={t.ticketId}
                      onClick={() => {
                        setActiveTicket(t);
                        setSearchParams({ ticket: t.ticketId });
                      }}
                      style={{
                        background: "#ffffff",
                        borderRadius: 12,
                        padding: "18px 22px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#c7d2fe";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 280, marginRight: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: 12,
                              color: "#4338ca",
                              background: "#eef2ff",
                              padding: "2px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {t.ticketId}
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                            }}
                          >
                            {badge.label}
                          </span>
                          <span style={{ fontSize: 11.5, color: "#64748b" }}>
                            {t.category}
                          </span>
                          {totalAttachments > 0 && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#4f46e5",
                                background: "#e0e7ff",
                                padding: "2px 7px",
                                borderRadius: 10,
                              }}
                            >
                              <LuPaperclip size={11} />
                              {totalAttachments} {totalAttachments === 1 ? "file" : "files"}
                            </span>
                          )}
                        </div>

                        <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                          {t.subject}
                        </h4>

                        <p
                          style={{
                            margin: 0,
                            fontSize: 12.5,
                            color: "#64748b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 650,
                          }}
                        >
                          {t.description}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                            {new Date(t.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#6366f1", fontWeight: 600 }}>
                            {msgCount} {msgCount === 1 ? "Message" : "Messages"}
                          </div>
                        </div>
                        <LuChevronRight style={{ width: 18, height: 18, color: "#94a3b8" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── SUBMIT ISSUE VIEW ── */
          <div>
            {/* Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                borderRadius: 16,
                padding: "32px 36px",
                color: "#ffffff",
                marginBottom: 28,
                boxShadow: "0 10px 25px rgba(30, 27, 75, 0.2)",
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(255, 255, 255, 0.15)", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                <LuSparkles style={{ width: 14, height: 14, color: "#facc15" }} />
                <span>Priority Student Support</span>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800 }}>
                How can we assist your learning today?
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "#cbd5e1", maxWidth: 700, lineHeight: 1.5 }}>
                Select an issue category below, provide details, attach screenshots/logs, and our engineering team will inspect your
                account, compiler logs, and assessment telemetry in real-time.
              </p>
            </div>

            {/* Step 1: Select Category */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#4f46e5", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 800 }}>1</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Select Issue Category</h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 14,
                }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        background: "#ffffff",
                        border: isSelected ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "16px 18px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 4px 14px rgba(79, 70, 229, 0.15)" : "none",
                        transform: isSelected ? "translateY(-2px)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: cat.bg,
                            color: cat.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon style={{ width: 18, height: 18 }} />
                        </div>
                        {isSelected && (
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "#4f46e5",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <LuCheck style={{ width: 12, height: 12 }} />
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                        {cat.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                        {cat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Issue Details & File Attachment Form */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                padding: "26px 30px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#4f46e5", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 800 }}>2</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Describe the Issue & Attach Files</h3>
              </div>

              <form onSubmit={handleSubmitTicket}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Subject / Brief Summary *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Compiler timeout on Longest Substring problem, or missing DSA certificate"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13.5,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 600,
                        background: "#ffffff",
                        color: "#334155",
                        outline: "none",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="Low">Low — General inquiry</option>
                      <option value="Medium">Medium — Standard issue</option>
                      <option value="High">High — Blocked progress</option>
                      <option value="Critical">Critical — Exam/Login blocker</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Problem Description & Steps to Reproduce *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Describe what occurred, any error messages displayed, problem number or module name, and device/browser details..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                      outline: "none",
                      boxSizing: "border-box",
                      lineHeight: 1.5,
                    }}
                    required
                  />
                </div>

                {/* ── DRAG & DROP / CLICK FILE ATTACHMENT UPLOADER ── */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    File Attachments & Evidence (Screenshots, Error Logs, Code Snippets)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "#4f46e5";
                      e.currentTarget.style.background = "#eef2ff";
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.background = "#fafafa";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.background = "#fafafa";
                      if (e.dataTransfer.files?.length) {
                        handleFilesChosen(e.dataTransfer.files, "new");
                      }
                    }}
                    style={{
                      border: "2px dashed #cbd5e1",
                      borderRadius: 10,
                      padding: "24px 20px",
                      textAlign: "center",
                      background: "#fafafa",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*,.pdf,.txt,.log,.json,.js,.py,.cpp,.java,.html,.css"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleFilesChosen(e.target.files, "new");
                          e.target.value = "";
                        }
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {uploadingNew ? (
                          <LuRefreshCw className="animate-spin" size={20} />
                        ) : (
                          <LuCloudUpload size={24} />
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                        {uploadingNew ? "Uploading attachments..." : "Click or drag & drop files here to attach"}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Support for screenshots (PNG, JPG, WEBP), Error Logs (TXT, LOG), and Documents (PDF) up to 15MB each
                      </div>
                    </div>
                  </div>

                  {/* Attached Files Visual Previews & Chips */}
                  {newAttachments.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
                      {newAttachments.map((att, idx) => {
                        const isImg = isImageAttachment(att);
                        const displayUrl = getAttachmentUrl(att.previewUrl || att.fileUrl);
                        if (isImg) {
                          return (
                            <div
                              key={att.fileName || idx}
                              style={{
                                position: "relative",
                                width: 110,
                                height: 85,
                                borderRadius: 8,
                                overflow: "hidden",
                                border: "1px solid #bfdbfe",
                                background: "#eff6ff",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                cursor: "pointer",
                              }}
                              onClick={() => setLightboxAttachment({ ...att, fileUrl: displayUrl })}
                              title="Click to zoom image preview"
                            >
                              <img
                                src={displayUrl}
                                alt={att.originalName}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  const fname = att.fileName || (att.fileUrl ? att.fileUrl.split("/").pop() : "");
                                  if (fname && !e.currentTarget.src.includes(`/api/support/attachments/${fname}`)) {
                                    e.currentTarget.src = `${API_BASE}/api/support/attachments/${fname}`;
                                  }
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "rgba(0,0,0,0.35)",
                                  opacity: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#ffffff",
                                  transition: "opacity 0.2s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                              >
                                <LuZoomIn size={20} />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewAttachments((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  width: 20,
                                  height: 20,
                                  borderRadius: "50%",
                                  background: "rgba(220, 38, 38, 0.9)",
                                  border: "none",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  padding: 0,
                                  zIndex: 2,
                                }}
                                title="Remove attachment"
                              >
                                <LuX size={13} />
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={att.fileName || idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 12px",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              borderRadius: 8,
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "#1e40af",
                            }}
                          >
                            <LuFileText size={16} />
                            <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {att.originalName}
                            </span>
                            <span style={{ fontSize: 11, opacity: 0.75 }}>({formatFileSize(att.fileSize)})</span>
                            <button
                              type="button"
                              onClick={() => setNewAttachments((prev) => prev.filter((_, i) => i !== idx))}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#dc2626",
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                              }}
                              title="Remove attachment"
                            >
                              <LuX size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
                    <LuShieldCheck style={{ width: 16, height: 16, color: "#16a34a" }} />
                    <span>Your registered account details ({user?.email || "student"}) and telemetry are securely linked.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || uploadingNew}
                    style={{
                      padding: "11px 28px",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: submitting || uploadingNew ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {submitting ? (
                      <LuRefreshCw className="animate-spin" style={{ width: 16, height: 16 }} />
                    ) : (
                      <LuSend style={{ width: 16, height: 16 }} />
                    )}
                    <span>{submitting ? "Submitting Ticket..." : "Submit Support Ticket"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ────────────────── LIGHTBOX IMAGE VIEWER MODAL ────────────────── */}
      {lightboxAttachment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setLightboxAttachment(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "92vw",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                color: "#ffffff",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {lightboxAttachment.originalName || lightboxAttachment.fileName}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    opacity: 0.8,
                    background: "rgba(255,255,255,0.2)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {formatFileSize(lightboxAttachment.fileSize)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a
                  href={getAttachmentUrl(lightboxAttachment.fileUrl)}
                  download={lightboxAttachment.originalName || "attachment"}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#4f46e5",
                    color: "#ffffff",
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <LuDownload size={14} />
                  Download
                </a>
                <button
                  onClick={() => setLightboxAttachment(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: 8,
                    width: 34,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <LuX size={20} />
                </button>
              </div>
            </div>

            {/* Main Preview Image */}
            <img
              src={getAttachmentUrl(lightboxAttachment.fileUrl)}
              alt={lightboxAttachment.originalName || "Attachment"}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 12,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
              onError={(e) => {
                const fname = lightboxAttachment.fileName || (lightboxAttachment.fileUrl ? lightboxAttachment.fileUrl.split("/").pop() : "");
                if (fname && !e.currentTarget.src.includes(`/api/support/attachments/${fname}`)) {
                  e.currentTarget.src = `${API_BASE}/api/support/attachments/${fname}`;
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupport;

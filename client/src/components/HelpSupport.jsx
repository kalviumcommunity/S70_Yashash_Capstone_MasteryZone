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
import { useTheme } from "../context/ThemeContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isImageAttachment = (att) => {
  if (!att) return false;
  if (typeof att === "string") {
    const s = att.toLowerCase().trim();
    return s.startsWith("data:image/") || /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif|jfif|tiff)(\?.*)?$/i.test(s);
  }
  const mt = (att.mimeType || att.type || "").toLowerCase().trim();
  const fn = (att.fileName || att.originalName || att.name || "").toLowerCase().trim();
  const url = (att.fileUrl || att.previewUrl || "").toLowerCase().trim();
  return (
    mt.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif|jfif|tiff)(\?.*)?$/i.test(fn) ||
    /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif|jfif|tiff)(\?.*)?$/i.test(url) ||
    url.startsWith("data:image/")
  );
};

const isPdfAttachment = (att) => {
  if (!att) return false;
  const mt = (att.mimeType || att.type || "").toLowerCase().trim();
  const fn = (att.fileName || att.originalName || att.name || "").toLowerCase().trim();
  const url = (att.fileUrl || att.previewUrl || "").toLowerCase().trim();
  return mt === "application/pdf" || fn.endsWith(".pdf") || url.includes(".pdf");
};

const getAttachmentUrl = (fileUrl, fileName) => {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("data:") || fileUrl.startsWith("blob:")) {
    return fileUrl;
  }
  const token = localStorage.getItem("token") || "";
  const tokenQuery = token ? `token=${encodeURIComponent(token)}` : "";

  let cleanUrl = fileUrl;
  if (fileUrl.includes("/uploads/support_attachments/")) {
    const fn = fileName || fileUrl.split("/uploads/support_attachments/")[1].split("?")[0];
    cleanUrl = `/api/support/attachments/${fn}`;
  } else if (!fileUrl.startsWith("/api/support/attachments/") && fileName) {
    cleanUrl = `/api/support/attachments/${fileName}`;
  }

  const base = cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")
    ? cleanUrl
    : `${API_BASE}${cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`}`;

  if (tokenQuery && !base.includes("token=")) {
    return base.includes("?") ? `${base}&${tokenQuery}` : `${base}?${tokenQuery}`;
  }
  return base;
};

const CATEGORIES = [
  {
    id: "Login and Authentication",
    title: "Login & Authentication",
    desc: "Password reset, OTP verification, session expiration, and credential access.",
    icon: LuKey,
    color: "var(--mz-indigo-text)",
    bg: "var(--mz-indigo-bg)",
    border: "var(--mz-indigo-border)",
  },
  {
    id: "Coding Compiler Issues",
    title: "Coding Compiler & IDE",
    desc: "Syntax execution errors, infinite loops, timeout issues, and language runtimes.",
    icon: LuCode,
    color: "var(--mz-cyan-text)",
    bg: "var(--mz-cyan-bg)",
    border: "var(--mz-cyan-border)",
  },
  {
    id: "Assignments and Assessments",
    title: "Assignments & Assessments",
    desc: "Test submission issues, proctoring locks, webcam/screen permissions, timers.",
    icon: LuFileText,
    color: "var(--mz-purple-text)",
    bg: "var(--mz-purple-bg)",
    border: "var(--mz-purple-border)",
  },
  {
    id: "Reports and Marks",
    title: "Reports & Marks",
    desc: "Scorecard discrepancies, missing module marks, pass/fail verification.",
    icon: LuShieldCheck,
    color: "var(--mz-blue-text)",
    bg: "var(--mz-blue-bg)",
    border: "var(--mz-blue-border)",
  },
  {
    id: "Projects and Progress",
    title: "Projects & Progress",
    desc: "Industry project git submissions, milestones tracking, streak sync.",
    icon: LuFolderGit2,
    color: "var(--mz-emerald-text)",
    bg: "var(--mz-emerald-bg)",
    border: "var(--mz-emerald-border)",
  },
  {
    id: "Meetings and Recordings",
    title: "Meetings & Recordings",
    desc: "Live study pod connection, screen share video playback, audio channels.",
    icon: LuVideo,
    color: "var(--mz-amber-text)",
    bg: "var(--mz-amber-bg)",
    border: "var(--mz-amber-border)",
  },
  {
    id: "Certificates",
    title: "Official Certificates",
    desc: "Credential generation, verification QR/URL, distinction honors, PDF download.",
    icon: LuAward,
    color: "var(--mz-purple-text)",
    bg: "var(--mz-purple-bg)",
    border: "var(--mz-purple-border)",
  },
  {
    id: "Other Technical Issues",
    title: "Other Technical Issues",
    desc: "Browser incompatibilities, platform performance, UI rendering errors.",
    icon: LuCircleHelp,
    color: "var(--mz-text-secondary)",
    bg: "var(--mz-surface-subtle)",
    border: "var(--mz-border)",
  },
];

const HelpSupport = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTicket, setActiveTicket] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        return { bg: "var(--mz-purple-bg)", color: "var(--mz-purple-text)", border: "var(--mz-purple-border)", label: "Submitted" };
      case "Under Review":
        return { bg: "var(--mz-amber-bg)", color: "var(--mz-amber-text)", border: "var(--mz-amber-border)", label: "Under Review" };
      case "In Progress":
        return { bg: "var(--mz-blue-bg)", color: "var(--mz-blue-text)", border: "var(--mz-blue-border)", label: "In Progress" };
      case "Resolved":
        return { bg: "var(--mz-emerald-bg)", color: "var(--mz-emerald-text)", border: "var(--mz-emerald-border)", label: "Resolved" };
      default:
        return { bg: "var(--mz-surface-subtle)", color: "var(--mz-text-secondary)", border: "var(--mz-border)", label: status };
    }
  };

  const renderAttachments = (attachments, isWhiteTheme = false) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {attachments.map((att, idx) => {
          const isImg = isImageAttachment(att);
          const attUrl = getAttachmentUrl(att.previewUrl || att.fileUrl, att.fileName || att.originalName);
          if (isImg) {
            return (
              <div
                key={att._id || idx}
                onClick={() => setLightboxAttachment({ ...att, fileUrl: attUrl })}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: isWhiteTheme ? "1px solid rgba(255,255,255,0.3)" : "1px solid var(--mz-border-strong)",
                  background: isWhiteTheme ? "rgba(255,255,255,0.15)" : "var(--mz-surface-subtle)",
                  width: 150,
                  height: 105,
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
                    const token = localStorage.getItem("token") || "";
                    if (fname && !e.currentTarget.src.includes(`/api/support/attachments/${fname}`)) {
                      e.currentTarget.src = `${API_BASE}/api/support/attachments/${fname}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
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
                background: isWhiteTheme ? "rgba(255,255,255,0.15)" : "var(--mz-surface)",
                color: isWhiteTheme ? "#ffffff" : "var(--mz-text-primary)",
                border: isWhiteTheme ? "1px solid rgba(255,255,255,0.25)" : "1px solid var(--mz-border-strong)",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                maxWidth: 260,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
            >
              <LuFileText size={18} color={isWhiteTheme ? "#ffffff" : "var(--mz-indigo-text)"} />
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
    <div className="home-container" style={{ minHeight: "100vh", background: "var(--mz-bg-primary)", color: "var(--mz-text-primary)" }}>
      {/* ────────────────── TOP NAVIGATION BAR ────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--mz-topbar-bg)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--mz-border)",
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
              background: isDark ? "var(--mz-surface-subtle)" : "#ffffff",
              border: isDark ? "1px solid var(--mz-border-strong)" : "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "7px 12px",
              color: "var(--mz-text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
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
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--mz-text-primary)" }}>
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
                    background: isConnected ? "var(--mz-emerald-bg)" : "var(--mz-surface-subtle)",
                    color: isConnected ? "var(--mz-emerald-text)" : "var(--mz-text-muted)",
                    border: `1px solid ${isConnected ? "var(--mz-emerald-border)" : "var(--mz-border-strong)"}`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isConnected ? "#10b981" : "var(--mz-text-subtle)",
                      animation: isConnected ? "pulse 2s infinite" : "none",
                    }}
                  />
                  {isConnected ? "Live Real-Time Sync" : "Connecting..."}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--mz-text-muted)" }}>
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
              border: isDark ? "none" : activeTab === "submit" && !activeTicket ? "none" : "1px solid #e2e8f0",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: activeTab === "submit" && !activeTicket ? "#4f46e5" : isDark ? "var(--mz-surface-subtle)" : "#ffffff",
              color: activeTab === "submit" && !activeTicket ? "#ffffff" : "var(--mz-text-secondary)",
              boxShadow: activeTab === "submit" && !activeTicket ? "0 2px 8px rgba(79, 70, 229, 0.25)" : isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
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
              border: isDark ? "none" : activeTab === "tickets" || activeTicket ? "none" : "1px solid #e2e8f0",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: activeTab === "tickets" || activeTicket ? "#4f46e5" : isDark ? "var(--mz-surface-subtle)" : "#ffffff",
              color: activeTab === "tickets" || activeTicket ? "#ffffff" : "var(--mz-text-secondary)",
              boxShadow: activeTab === "tickets" || activeTicket ? "0 2px 8px rgba(79, 70, 229, 0.25)" : isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
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
              background: "var(--mz-surface)",
              borderRadius: 16,
              border: "1px solid var(--mz-border)",
              boxShadow: "var(--mz-shadow-md)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--mz-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                background: "var(--mz-surface-subtle)",
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
                    color: "var(--mz-indigo-text)",
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
                      color: "var(--mz-indigo-text)",
                      fontSize: 14,
                      background: "var(--mz-indigo-bg)",
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--mz-indigo-border)",
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
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--mz-text-primary)" }}>
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
                    color: "var(--mz-text-muted)",
                    padding: "4px 10px",
                    background: "var(--mz-surface)",
                    border: "1px solid var(--mz-border)",
                    borderRadius: 6,
                  }}
                >
                  Category: {activeTicket.category}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--mz-red-text)",
                    padding: "4px 10px",
                    background: "var(--mz-red-bg)",
                    borderRadius: 6,
                    border: "1px solid var(--mz-red-border)",
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
                  background: "var(--mz-surface-subtle)",
                  borderBottom: "1px solid var(--mz-border)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", marginBottom: 6 }}>
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
                background: "var(--mz-bg-secondary)",
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
                        color: "var(--mz-text-muted)",
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
                          <span style={{ fontWeight: 700, color: "var(--mz-indigo-text)" }}>
                            {msg.senderName} (Administrator)
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 600, color: "var(--mz-text-secondary)" }}>
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
                        background: isAdmin ? "var(--mz-surface)" : "#4f46e5",
                        color: isAdmin ? "var(--mz-text-primary)" : "#ffffff",
                        border: isAdmin ? "1px solid var(--mz-border)" : "none",
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
                    background: "var(--mz-surface)",
                    padding: "8px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--mz-border)",
                    width: "fit-content",
                    fontSize: 12.5,
                    color: "var(--mz-indigo-text)",
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
                  background: "var(--mz-emerald-bg)",
                  borderTop: "1px solid var(--mz-emerald-border)",
                  borderBottom: "1px solid var(--mz-emerald-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "var(--mz-emerald-text)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <LuCircleCheck style={{ width: 18, height: 18, color: "var(--mz-emerald-text)" }} />
                <span>
                  This support ticket is marked as <strong>Resolved</strong> by our engineering team. If
                  you need further assistance, reply below to reopen the ticket.
                </span>
              </div>
            )}

            {/* Reply Input Box with File Attachment capability */}
            <div style={{ background: "var(--mz-surface)", borderTop: "1px solid var(--mz-border)" }}>
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
                            border: "1px solid var(--mz-blue-border)",
                            background: "var(--mz-blue-bg)",
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
                          background: "var(--mz-blue-bg)",
                          border: "1px solid var(--mz-blue-border)",
                          borderRadius: 6,
                          fontSize: 12,
                          color: "var(--mz-blue-text)",
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
                      border: "1px solid var(--mz-border-strong)",
                      background: uploadingReply ? "var(--mz-indigo-bg)" : "var(--mz-surface-subtle)",
                      color: "var(--mz-text-secondary)",
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
                      border: "1px solid var(--mz-input-border)",
                      background: "var(--mz-input-bg)",
                      color: "var(--mz-input-text)",
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
                      background: replyText.trim() || replyAttachments.length > 0 ? "#4f46e5" : "var(--mz-surface-muted)",
                      color: replyText.trim() || replyAttachments.length > 0 ? "#ffffff" : "var(--mz-text-subtle)",
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
              <div ref={searchContainerRef} style={{ position: "relative", minWidth: 300 }}>
                <LuSearch
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--mz-text-subtle)",
                    width: 16,
                    height: 16,
                  }}
                />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => {
                    setTicketSearch(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => {
                    if (ticketSearch.trim()) setShowSearchDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowSearchDropdown(false);
                  }}
                  placeholder="Search..."
                  style={{
                    width: "100%",
                    padding: "9px 30px 9px 36px",
                    borderRadius: 8,
                    border: "1px solid var(--mz-input-border)",
                    fontSize: 13,
                    background: "var(--mz-input-bg)",
                    color: "var(--mz-input-text)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {ticketSearch && (
                  <button
                    onClick={() => {
                      setTicketSearch("");
                      setShowSearchDropdown(false);
                    }}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--mz-text-subtle)",
                      cursor: "pointer",
                    }}
                  >
                    <LuX style={{ width: 14, height: 14 }} />
                  </button>
                )}

                {showSearchDropdown && ticketSearch.trim().length > 0 && (
                  <div className="mz-global-search-dropdown" style={{ minWidth: 320, left: 0 }}>
                    <div className="mz-global-search-header">
                      <span>Tickets matching &ldquo;{ticketSearch.trim()}&rdquo;</span>
                      <span className="mz-global-search-esc">Press ESC</span>
                    </div>
                    {filteredTickets.length === 0 ? (
                      <div className="mz-global-search-empty">
                        <p>No tickets match &ldquo;{ticketSearch}&rdquo;</p>
                        <small>Try searching by ticket ID, subject, or category</small>
                      </div>
                    ) : (
                      <div className="mz-global-search-group">
                        {filteredTickets.slice(0, 6).map((t) => (
                          <div
                            key={t.ticketId}
                            className="mz-global-search-item"
                            onClick={() => {
                              setShowSearchDropdown(false);
                              setActiveTicket(t);
                              setSearchParams({ ticket: t.ticketId });
                            }}
                          >
                            <span className="mz-global-search-item-icon">🎫</span>
                            <div className="mz-global-search-item-content">
                              <div className="mz-global-search-item-title">{t.subject || "Ticket"}</div>
                              <div className="mz-global-search-item-sub">
                                {t.ticketId} • {t.category} ({t.status})
                              </div>
                            </div>
                            <span className="mz-global-search-item-action">View →</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                        background: isActive ? "#4f46e5" : "var(--mz-surface-subtle)",
                        color: isActive ? "#ffffff" : "var(--mz-text-secondary)",
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
              <div style={{ textAlign: "center", padding: 60, color: "var(--mz-text-subtle)" }}>
                <LuRefreshCw className="animate-spin" style={{ width: 28, height: 28, margin: "0 auto 10px" }} />
                <div>Loading your support tickets...</div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div
                style={{
                  background: "var(--mz-surface)",
                  borderRadius: 14,
                  padding: "50px 20px",
                  textAlign: "center",
                  border: "1px solid var(--mz-border)",
                }}
              >
                <LuTicket style={{ width: 44, height: 44, color: "var(--mz-text-subtle)", margin: "0 auto 12px" }} />
                <h3 style={{ margin: "0 0 6px", color: "var(--mz-text-primary)", fontSize: 16 }}>No Support Tickets Found</h3>
                <p style={{ margin: "0 0 16px", color: "var(--mz-text-muted)", fontSize: 13 }}>
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
                        background: isDark ? "var(--mz-surface)" : "#ffffff",
                        borderRadius: 12,
                        padding: "18px 22px",
                        border: isDark ? "1px solid var(--mz-border)" : "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isDark ? "0 2px 6px rgba(0, 0, 0, 0.2)" : "0 2px 8px rgba(15, 23, 42, 0.04)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--mz-indigo-border)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = isDark ? "0 4px 14px rgba(79, 70, 229, 0.2)" : "0 4px 14px rgba(79, 70, 229, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isDark ? "var(--mz-border)" : "#e2e8f0";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = isDark ? "0 2px 6px rgba(0, 0, 0, 0.2)" : "0 2px 8px rgba(15, 23, 42, 0.04)";
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 280, marginRight: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: 12,
                              color: "var(--mz-indigo-text)",
                              background: "var(--mz-indigo-bg)",
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
                          <span style={{ fontSize: 11.5, color: "var(--mz-text-muted)" }}>
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
                                color: "var(--mz-indigo-text)",
                                background: "var(--mz-indigo-bg)",
                                padding: "2px 7px",
                                borderRadius: 10,
                              }}
                            >
                              <LuPaperclip size={11} />
                              {totalAttachments} {totalAttachments === 1 ? "file" : "files"}
                            </span>
                          )}
                        </div>

                        <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)" }}>
                          {t.subject}
                        </h4>

                        <p
                          style={{
                            margin: 0,
                            fontSize: 12.5,
                            color: "var(--mz-text-muted)",
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
                          <div style={{ fontSize: 11.5, color: "var(--mz-text-subtle)" }}>
                            {new Date(t.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--mz-indigo-text)", fontWeight: 600 }}>
                            {msgCount} {msgCount === 1 ? "Message" : "Messages"}
                          </div>
                        </div>
                        <LuChevronRight style={{ width: 18, height: 18, color: "var(--mz-text-subtle)" }} />
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
                background: isDark
                  ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #f8faff 45%, #eef2ff 100%)",
                borderRadius: 16,
                padding: "32px 36px",
                color: isDark ? "#ffffff" : "var(--mz-text-primary)",
                marginBottom: 28,
                border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e0e7ff",
                boxShadow: isDark
                  ? "0 10px 25px rgba(30, 27, 75, 0.2)"
                  : "0 8px 24px -4px rgba(79, 70, 229, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle background ambient mesh glow */}
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  background: isDark
                    ? "radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(199, 210, 254, 0.25) 50%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -60,
                  left: "30%",
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: isDark
                    ? "radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(147, 197, 253, 0.15) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: isDark
                        ? "rgba(255, 255, 255, 0.15)"
                        : "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #c7d2fe",
                      fontSize: 12,
                      fontWeight: 700,
                      color: isDark ? "#ffffff" : "#4338ca",
                      boxShadow: isDark ? "none" : "0 1px 3px rgba(79, 70, 229, 0.1)",
                    }}
                  >
                    <LuSparkles style={{ width: 14, height: 14, color: isDark ? "#facc15" : "#eab308" }} />
                    <span>Priority Student Support</span>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 11px",
                      borderRadius: 20,
                      background: isDark ? "rgba(16, 185, 129, 0.16)" : "#ecfdf5",
                      border: isDark ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid #a7f3d0",
                      color: isDark ? "#34d399" : "#059669",
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: isDark ? "#34d399" : "#10b981",
                        boxShadow: isDark
                          ? "0 0 6px rgba(52, 211, 153, 0.8)"
                          : "0 0 6px rgba(16, 185, 129, 0.6)",
                      }}
                    />
                    <span>24/7 Real-Time Resolution Desk</span>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 11px",
                      borderRadius: 20,
                      background: isDark ? "rgba(59, 130, 246, 0.16)" : "#eff6ff",
                      border: isDark ? "1px solid rgba(96, 165, 250, 0.3)" : "1px solid #bfdbfe",
                      color: isDark ? "#60a5fa" : "#1d4ed8",
                      fontSize: 11.5,
                      fontWeight: 600,
                    }}
                  >
                    <LuClock style={{ width: 13, height: 13 }} />
                    <span>Avg response &lt; 15 mins</span>
                  </div>
                </div>

                <h2
                  style={{
                    margin: "0 0 8px",
                    fontSize: 24,
                    fontWeight: 800,
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: "-0.015em",
                  }}
                >
                  How can we assist your learning today?
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: isDark ? "#cbd5e1" : "#475569",
                    maxWidth: 720,
                    lineHeight: 1.55,
                  }}
                >
                  Select an issue category below, provide details, attach screenshots/logs, and our engineering team will inspect your
                  account, compiler logs, and assessment telemetry in real-time.
                </p>
              </div>
            </div>

            {/* Step 1: Select Category */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11.5,
                    fontWeight: 800,
                    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                  }}
                >
                  1
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--mz-text-primary)" }}>Select Issue Category</h3>
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
                        background: isSelected
                          ? isDark
                            ? "rgba(79, 70, 229, 0.12)"
                            : "#f8faff"
                          : isDark
                          ? "var(--mz-surface)"
                          : "#ffffff",
                        border: isSelected
                          ? "2px solid #4f46e5"
                          : isDark
                          ? "1px solid var(--mz-border)"
                          : "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "16px 18px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected
                          ? isDark
                            ? "0 4px 14px rgba(79, 70, 229, 0.2)"
                            : "0 4px 16px rgba(79, 70, 229, 0.1)"
                          : isDark
                          ? "none"
                          : "0 1px 3px rgba(0, 0, 0, 0.03)",
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
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)" }}>
                        {cat.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--mz-text-muted)", lineHeight: 1.4 }}>
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
                background: isDark ? "var(--mz-surface)" : "#ffffff",
                borderRadius: 14,
                border: isDark ? "1px solid var(--mz-border)" : "1px solid #e2e8f0",
                padding: "26px 30px",
                boxShadow: isDark ? "var(--mz-shadow-sm)" : "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11.5,
                    fontWeight: 800,
                    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                  }}
                >
                  2
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--mz-text-primary)" }}>Describe the Issue & Attach Files</h3>
              </div>

              <form onSubmit={handleSubmitTicket}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--mz-text-secondary)", marginBottom: 6 }}>
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
                        border: "1px solid var(--mz-input-border)",
                        background: "var(--mz-input-bg)",
                        color: "var(--mz-input-text)",
                        fontSize: 13.5,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--mz-text-secondary)", marginBottom: 6 }}>
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--mz-input-border)",
                        fontSize: 13,
                        fontWeight: 600,
                        background: "var(--mz-input-bg)",
                        color: "var(--mz-input-text)",
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
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--mz-text-secondary)", marginBottom: 6 }}>
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
                      border: "1px solid var(--mz-input-border)",
                      background: "var(--mz-input-bg)",
                      color: "var(--mz-input-text)",
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
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--mz-text-secondary)", marginBottom: 6 }}>
                    File Attachments & Evidence (Screenshots, Error Logs, Code Snippets)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "#4f46e5";
                      e.currentTarget.style.background = isDark ? "var(--mz-indigo-bg)" : "#eef2ff";
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = isDark ? "var(--mz-border-strong)" : "#c7d2fe";
                      e.currentTarget.style.background = isDark ? "var(--mz-surface-subtle)" : "#f8faff";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = isDark ? "var(--mz-border-strong)" : "#c7d2fe";
                      e.currentTarget.style.background = isDark ? "var(--mz-surface-subtle)" : "#f8faff";
                      if (e.dataTransfer.files?.length) {
                        handleFilesChosen(e.dataTransfer.files, "new");
                      }
                    }}
                    style={{
                      border: isDark ? "2px dashed var(--mz-border-strong)" : "2px dashed #c7d2fe",
                      borderRadius: 10,
                      padding: "24px 20px",
                      textAlign: "center",
                      background: isDark ? "var(--mz-surface-subtle)" : "#f8faff",
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
                          background: "var(--mz-indigo-bg)",
                          color: "var(--mz-indigo-text)",
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)" }}>
                        {uploadingNew ? "Uploading attachments..." : "Click or drag & drop files here to attach"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--mz-text-muted)" }}>
                        Support for screenshots (PNG, JPG, WEBP), Error Logs (TXT, LOG), and Documents (PDF) up to 15MB each
                      </div>
                    </div>
                  </div>

                  {/* Attached Files Visual Previews & Chips */}
                  {newAttachments.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
                      {newAttachments.map((att, idx) => {
                        const isImg = isImageAttachment(att);
                        const displayUrl = getAttachmentUrl(att.previewUrl || att.fileUrl, att.fileName || att.originalName);
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
                                border: "1px solid var(--mz-blue-border)",
                                background: "var(--mz-blue-bg)",
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
                                  const token = localStorage.getItem("token") || "";
                                  if (fname && !e.currentTarget.src.includes(`/api/support/attachments/${fname}`)) {
                                    e.currentTarget.src = `${API_BASE}/api/support/attachments/${fname}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
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
                              background: "var(--mz-blue-bg)",
                              border: "1px solid var(--mz-blue-border)",
                              borderRadius: 8,
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "var(--mz-blue-text)",
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, paddingTop: 10, borderTop: "1px solid var(--mz-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--mz-text-muted)" }}>
                    <LuShieldCheck style={{ width: 16, height: 16, color: "var(--mz-green-text)" }} />
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
              src={getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName)}
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
                const token = localStorage.getItem("token") || "";
                if (fname && !e.currentTarget.src.includes(`/api/support/attachments/${fname}`)) {
                  e.currentTarget.src = `${API_BASE}/api/support/attachments/${fname}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
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

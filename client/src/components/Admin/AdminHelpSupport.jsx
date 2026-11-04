import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  LuRefreshCw,
  LuUser,
  LuMail,
  LuFilter,
  LuCheck,
  LuX,
  LuSparkles,
  LuExternalLink,
  LuPaperclip,
  LuDownload,
  LuCloudUpload,
  LuZoomIn,
  LuImage,
} from "react-icons/lu";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import "./Admin.css";

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

const CATEGORIES = [
  "All Categories",
  "Login and Authentication",
  "Coding Compiler Issues",
  "Assignments and Assessments",
  "Reports and Marks",
  "Projects and Progress",
  "Meetings and Recordings",
  "Certificates",
  "Other Technical Issues",
];

const AdminHelpSupport = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicketId = searchParams.get("ticket");

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Active Selected Ticket for Detail / Response Modal
  const [activeTicket, setActiveTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [newStatus, setNewStatus] = useState("In Progress");
  const [adminNotes, setAdminNotes] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Admin attachments & typing
  const [adminReplyAttachments, setAdminReplyAttachments] = useState([]);
  const [uploadingAdminAtt, setUploadingAdminAtt] = useState(false);
  const [studentTyping, setStudentTyping] = useState(false);
  const adminFileInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const studentTypingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Image Lightbox Modal
  const [lightboxAttachment, setLightboxAttachment] = useState(null);

  // Upload helper using base64 payload to ensure 100% native stability
  const uploadAttachmentFile = async (file) => {
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
            resolve(data.attachment);
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

  const handleAdminFilesChosen = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploadingAdminAtt(true);
    try {
      for (const file of fileList) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds 15MB limit.`);
          continue;
        }
        const uploaded = await uploadAttachmentFile(file);
        setAdminReplyAttachments((prev) => [...prev, uploaded]);
        toast.success(`Attached: ${file.name}`);
      }
    } catch (err) {
      console.error("Admin upload error:", err);
      toast.error(err.message || "Failed to upload attachment");
    } finally {
      setUploadingAdminAtt(false);
    }
  };

  const fetchTickets = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/support/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTickets(data.tickets || []);
          if (data.stats) setStats(data.stats);

          if (initialTicketId) {
            const found = (data.tickets || []).find((t) => t.ticketId === initialTicketId);
            if (found) {
              setActiveTicket(found);
              setNewStatus(found.status);
            }
          } else if (activeTicket) {
            const refreshed = (data.tickets || []).find((t) => t.ticketId === activeTicket.ticketId);
            if (refreshed) setActiveTicket(refreshed);
          }
        }
      }
    } catch (err) {
      console.error("Admin fetch tickets error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

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
        socket.emit("join_admin_monitoring");
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("NEW_SUPPORT_TICKET", (newTkt) => {
        if (!newTkt) return;
        toast.info(`🔔 New support ticket received: ${newTkt.ticketId} (${newTkt.category})`);
        fetchTickets(true);
      });

      socket.on("TICKET_UPDATED", (updTkt) => {
        if (!updTkt) return;
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === updTkt.ticketId ? updTkt : t))
        );
        setActiveTicket((current) => {
          if (current && current.ticketId === updTkt.ticketId) {
            return updTkt;
          }
          return current;
        });
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
        if (activeTicket?.ticketId === ticketId && userRole === "USER") {
          setStudentTyping(isTyping);
          if (isTyping) {
            clearTimeout(studentTypingTimeoutRef.current);
            studentTypingTimeoutRef.current = setTimeout(() => setStudentTyping(false), 3000);
          }
        }
      });
    } catch (err) {
      console.warn("Admin socket connection warning:", err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Join ticket room when modal opens
  useEffect(() => {
    if (activeTicket?.ticketId && socketRef.current) {
      socketRef.current.emit("join_ticket_room", activeTicket.ticketId);
      return () => {
        socketRef.current?.emit("leave_ticket_room", activeTicket.ticketId);
      };
    }
  }, [activeTicket?.ticketId]);

  const handleOpenTicket = (ticket) => {
    setActiveTicket(ticket);
    setNewStatus(ticket.status);
    setAdminNotes(ticket.adminNotes || "");
    setResponseMessage("");
    setAdminReplyAttachments([]);
    setSearchParams({ ticket: ticket.ticketId });
  };

  const handleCloseModal = () => {
    setActiveTicket(null);
    setAdminReplyAttachments([]);
    setSearchParams({});
  };

  const handleAdminTypingChange = (e) => {
    setResponseMessage(e.target.value);
    if (socketRef.current && activeTicket) {
      socketRef.current.emit("ticket_typing", {
        ticketId: activeTicket.ticketId,
        userName: "MasteryZone Support Admin",
        userRole: "ADMIN",
        isTyping: true,
      });
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        socketRef.current?.emit("ticket_typing", {
          ticketId: activeTicket.ticketId,
          userName: "MasteryZone Support Admin",
          userRole: "ADMIN",
          isTyping: false,
        });
      }, 1500);
    }
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if ((!responseMessage.trim() && adminReplyAttachments.length === 0) || !activeTicket) return;

    setSubmittingReply(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/support/admin/tickets/${activeTicket.ticketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: responseMessage.trim(),
          status: newStatus,
          adminNotes: adminNotes.trim(),
          attachments: adminReplyAttachments,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`✅ Response sent to student (${activeTicket.userEmail}) and email delivered.`);
        setResponseMessage("");
        setAdminReplyAttachments([]);
        setActiveTicket(data.ticket);
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === data.ticket.ticketId ? data.ticket : t))
        );
        fetchTickets(true);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        toast.error(data.message || "Failed to post response.");
      }
    } catch (err) {
      console.error("Admin reply submit error:", err);
      toast.error("Network error while sending response.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatusOnly = async (statusToSet) => {
    if (!activeTicket) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/support/admin/tickets/${activeTicket.ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusToSet,
          adminNotes: adminNotes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Status updated to ${statusToSet}. Notification sent.`);
        setNewStatus(statusToSet);
        setActiveTicket(data.ticket);
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === data.ticket.ticketId ? data.ticket : t))
        );
        fetchTickets(true);
      } else {
        toast.error(data.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Network error while updating status.");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (categoryFilter !== "All Categories" && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.ticketId?.toLowerCase().includes(q) ||
        t.userName?.toLowerCase().includes(q) ||
        t.userEmail?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
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
          if (isImg) {
            return (
              <div
                key={att._id || idx}
                onClick={() => setLightboxAttachment(att)}
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
                title="Click to inspect high-resolution evidence"
              >
                <img
                  src={att.fileUrl}
                  alt={att.originalName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
              href={att.fileUrl}
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
    <div className="admin-page-container" style={{ padding: "24px 32px", minHeight: "100vh", background: "#f8fafc" }}>
      {/* ────────────────── TOP HEADER & TELEMETRY ────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              Help & Support Management
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 14,
                background: isConnected ? "#ecfdf5" : "#f1f5f9",
                color: isConnected ? "#059669" : "#64748b",
                border: `1px solid ${isConnected ? "#a7f3d0" : "#cbd5e1"}`,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: isConnected ? "#10b981" : "#94a3b8",
                  animation: isConnected ? "pulse 2s infinite" : "none",
                }}
              />
              {isConnected ? "Real-Time Telemetry Online" : "Connecting..."}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            Inspect student support requests, review attached evidence/screenshots, and dispatch immediate verified resolutions.
          </p>
        </div>

        <button
          onClick={() => fetchTickets(false)}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#334155",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <LuRefreshCw className={loading ? "animate-spin" : ""} style={{ width: 14, height: 14 }} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ────────────────── STATS KPI CARDS ────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Total Tickets
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>All logged inquiries</div>
        </div>

        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid #e9d5ff", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Submitted
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#7e22ce", marginTop: 4 }}>
            {stats.submitted}
          </div>
          <div style={{ fontSize: 11.5, color: "#a855f7", marginTop: 2 }}>Awaiting initial review</div>
        </div>

        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid #fde68a", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Under Review
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#b45309", marginTop: 4 }}>
            {stats.underReview}
          </div>
          <div style={{ fontSize: 11.5, color: "#d97706", marginTop: 2 }}>Inspection underway</div>
        </div>

        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid #bfdbfe", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            In Progress
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8", marginTop: 4 }}>
            {stats.inProgress}
          </div>
          <div style={{ fontSize: 11.5, color: "#3b82f6", marginTop: 2 }}>Active correspondence</div>
        </div>

        <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: 12, border: "1px solid #a7f3d0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Resolved
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#047857", marginTop: 4 }}>
            {stats.resolved}
          </div>
          <div style={{ fontSize: 11.5, color: "#10b981", marginTop: 2 }}>Successfully closed</div>
        </div>
      </div>

      {/* ────────────────── FILTER CONTROLS ────────────────── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flex: 1 }}>
          {/* Search bar */}
          <div style={{ position: "relative", minWidth: 280, flex: "1 1 280px" }}>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID, student name, email, or subject..."
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              background: "#ffffff",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pill Filters */}
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
                  transition: "all 0.15s ease",
                }}
              >
                {st === "all" ? "All Statuses" : st}
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────── TICKETS DATA TABLE ────────────────── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <LuRefreshCw className="animate-spin" style={{ width: 28, height: 28, margin: "0 auto 10px" }} />
            <div>Loading verified student tickets...</div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <LuTicket style={{ width: 44, height: 44, color: "#cbd5e1", margin: "0 auto 10px" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#0f172a" }}>No Support Tickets Found</h3>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              {searchQuery || statusFilter !== "all" || categoryFilter !== "All Categories"
                ? "No support tickets match your current filters."
                : "No student issues have been submitted to date."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Ticket ID</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Candidate Details</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Category & Subject</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Evidence</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Submitted</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => {
                  const badge = getStatusBadge(t.status);
                  const totalAttachments = (t.attachments?.length || 0) + (t.messages?.reduce((acc, m) => acc + (m.attachments?.length || 0), 0) || 0);

                  return (
                    <tr
                      key={t.ticketId}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                      onClick={() => handleOpenTicket(t)}
                    >
                      {/* Ticket ID */}
                      <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: 12.5,
                            color: "#4338ca",
                            background: "#eef2ff",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid #c7d2fe",
                          }}
                        >
                          {t.ticketId}
                        </span>
                      </td>

                      {/* Candidate */}
                      <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                          {t.userName}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>
                          {t.userEmail}
                        </div>
                      </td>

                      {/* Category & Subject */}
                      <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#475569",
                              background: "#f1f5f9",
                              padding: "2px 8px",
                              borderRadius: 4,
                              display: "inline-block",
                              marginBottom: 4,
                            }}
                          >
                            {t.category}
                          </span>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#0f172a",
                              maxWidth: 380,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={t.subject}
                          >
                            {t.subject}
                          </div>
                        </div>
                      </td>

                      {/* Evidence / Attachments */}
                      <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                        {totalAttachments > 0 ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 8px",
                              borderRadius: 12,
                              background: "#e0e7ff",
                              color: "#4338ca",
                              fontSize: 11.5,
                              fontWeight: 700,
                            }}
                          >
                            <LuPaperclip size={13} />
                            {totalAttachments} {totalAttachments === 1 ? "file" : "files"}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, color: "#94a3b8" }}>None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 14,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: badge.color,
                            }}
                          />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Submitted At */}
                      <td style={{ padding: "14px 18px", verticalAlign: "middle", fontSize: 12, color: "#64748b" }}>
                        <div>
                          {new Date(t.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {new Date(t.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", verticalAlign: "middle", textAlign: "right" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicket(t);
                          }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 6,
                            border: "1px solid #c7d2fe",
                            background: "#eff6ff",
                            color: "#4338ca",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          Inspect & Respond
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ────────────────── TICKET DETAIL & RESPONSE MODAL ────────────────── */}
      {activeTicket && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 920,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#4338ca",
                      background: "#eef2ff",
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid #c7d2fe",
                    }}
                  >
                    {activeTicket.ticketId}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      padding: "3px 8px",
                      background: "#e2e8f0",
                      borderRadius: 4,
                    }}
                  >
                    {activeTicket.category}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  {activeTicket.subject}
                </h2>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Status Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Status:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => {
                      const st = e.target.value;
                      setNewStatus(st);
                      handleUpdateStatusOnly(st);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 12.5,
                      fontWeight: 700,
                      background: "#ffffff",
                      color: "#334155",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <button
                  onClick={handleCloseModal}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <LuX style={{ width: 22, height: 22 }} />
                </button>
              </div>
            </div>

            {/* Candidate Metadata Strip */}
            <div
              style={{
                padding: "12px 24px",
                background: "#f1f5f9",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12.5,
                color: "#475569",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span>
                  <strong>Candidate:</strong> {activeTicket.userName}
                </span>
                <span>
                  <strong>Email:</strong> {activeTicket.userEmail}
                </span>
                <span>
                  <strong>Priority:</strong> {activeTicket.priority}
                </span>
              </div>
              <div>
                <span>
                  Submitted on{" "}
                  {new Date(activeTicket.createdAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Candidate Attachments / Evidence Section */}
            {activeTicket.attachments && activeTicket.attachments.length > 0 && (
              <div
                style={{
                  padding: "14px 24px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
                  📎 Candidate Uploaded Evidence & Screenshots ({activeTicket.attachments.length}):
                </div>
                {renderAttachments(activeTicket.attachments)}
              </div>
            )}

            {/* Messages Thread */}
            <div
              style={{
                padding: 24,
                overflowY: "auto",
                flex: 1,
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
                      alignItems: isAdmin ? "flex-end" : "flex-start",
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
                          <span style={{ fontWeight: 700, color: "#4f46e5" }}>
                            {msg.senderName} (You / Admin)
                          </span>
                          <span>•</span>
                          <span>
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>
                            {msg.senderName} (Student)
                          </span>
                          <span>•</span>
                          <span>
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </>
                      )}
                    </div>

                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: isAdmin ? "#4f46e5" : "#ffffff",
                        color: isAdmin ? "#ffffff" : "#1e293b",
                        border: isAdmin ? "none" : "1px solid #e2e8f0",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.message}
                      {renderAttachments(msg.attachments, isAdmin)}
                    </div>
                  </div>
                );
              })}

              {/* Student Typing Indicator */}
              {studentTyping && (
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
                    fontSize: 12,
                    color: "#059669",
                    fontWeight: 600,
                  }}
                >
                  <LuUser size={14} />
                  <span>Student is typing...</span>
                  <span className="typing-dots">● ● ●</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Admin Response Composer */}
            <form
              onSubmit={handleSendAdminReply}
              style={{
                padding: "20px 24px",
                borderTop: "1px solid #e2e8f0",
                background: "#ffffff",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Write Personalized Admin Response (Triggers immediate in-app notification & user email):
                </label>
                <textarea
                  value={responseMessage}
                  onChange={handleAdminTypingChange}
                  rows={3}
                  placeholder="e.g. Hello Yashash, we reviewed your compiler logs and screenshots. We have reset your attempt and credited your score..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13.5,
                    fontFamily: "inherit",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Admin Attachments Preview Chips */}
              {adminReplyAttachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {adminReplyAttachments.map((att, idx) => (
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
                      {isImageAttachment(att) ? <LuImage size={13} /> : <LuFileText size={13} />}
                      <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {att.originalName}
                      </span>
                      <span style={{ fontSize: 10.5, opacity: 0.75 }}>({formatFileSize(att.fileSize)})</span>
                      <button
                        type="button"
                        onClick={() => setAdminReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
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
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="file"
                    ref={adminFileInputRef}
                    multiple
                    accept="image/*,.pdf,.txt,.log,.json,.js,.py,.cpp,.java,.html,.css"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleAdminFilesChosen(e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => adminFileInputRef.current?.click()}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: uploadingAdminAtt ? "#e0e7ff" : "#f8fafc",
                      color: "#475569",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {uploadingAdminAtt ? <LuRefreshCw className="animate-spin" size={14} /> : <LuPaperclip size={14} />}
                    <span>{uploadingAdminAtt ? "Uploading..." : "Attach File"}</span>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      Update Status:
                    </span>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 12,
                        fontWeight: 600,
                        background: "#ffffff",
                        color: "#334155",
                        outline: "none",
                      }}
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingReply || (!responseMessage.trim() && adminReplyAttachments.length === 0)}
                    style={{
                      padding: "9px 24px",
                      borderRadius: 8,
                      border: "none",
                      background: responseMessage.trim() || adminReplyAttachments.length > 0 ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" : "#cbd5e1",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: submittingReply || (!responseMessage.trim() && adminReplyAttachments.length === 0) ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                    }}
                  >
                    {submittingReply ? (
                      <LuRefreshCw className="animate-spin" style={{ width: 15, height: 15 }} />
                    ) : (
                      <LuSend style={{ width: 15, height: 15 }} />
                    )}
                    <span>{submittingReply ? "Dispatching..." : "Send Response & Email User"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  href={lightboxAttachment.fileUrl}
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
              src={lightboxAttachment.fileUrl}
              alt={lightboxAttachment.originalName || "Attachment"}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 12,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHelpSupport;

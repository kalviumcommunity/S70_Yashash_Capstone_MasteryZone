import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { deduplicatedFetch, invalidateCachePattern } from "../../utils/apiClient";
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
  LuEye,
  LuCloudUpload,
  LuZoomIn,
  LuImage,
  LuFileCode,
  LuFolder,
  LuFolderOpen,
  LuCopy,
  LuMusic,
  LuDownload,
  LuFileArchive,
} from "react-icons/lu";
import { toast } from "react-toastify";
import { getSharedSocket, releaseSharedSocket } from "../../utils/socketClient";
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
  if (typeof att === "string") return /\.pdf(\?.*)?$/i.test(att.toLowerCase().trim());
  const mt = (att.mimeType || att.type || "").toLowerCase().trim();
  const fn = (att.fileName || att.originalName || att.name || "").toLowerCase().trim();
  const url = (att.fileUrl || att.previewUrl || "").toLowerCase().trim();
  return mt === "application/pdf" || /\.pdf(\?.*)?$/i.test(fn) || /\.pdf(\?.*)?$/i.test(url);
};

const isCodeOrTextAttachment = (att) => {
  if (!att) return false;
  const fn = (att.fileName || att.originalName || att.name || (typeof att === "string" ? att : "")).toLowerCase().trim();
  const mt = (att.mimeType || att.type || "").toLowerCase().trim();
  const codeExtRegex = /\.(txt|log|md|json|csv|xml|yaml|yml|js|jsx|ts|tsx|py|java|c|cpp|cc|cxx|h|hpp|cs|go|rs|php|rb|swift|kt|dart|sql|sh|bash|zsh|env|ini|conf|cfg|dockerfile|toml|html|css|scss|less|vue|svelte|graphql|prisma|lua|r|m)(\?.*)?$/i;
  return (
    mt.startsWith("text/") ||
    mt === "application/json" ||
    mt === "application/xml" ||
    mt === "application/javascript" ||
    codeExtRegex.test(fn)
  );
};

const isVideoAttachment = (att) => {
  if (!att) return false;
  const fn = (att.fileName || att.originalName || att.name || (typeof att === "string" ? att : "")).toLowerCase().trim();
  const mt = (att.mimeType || att.type || "").toLowerCase().trim();
  return mt.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi|wmv|flv|m4v)(\?.*)?$/i.test(fn);
};

const isAudioAttachment = (att) => {
  if (!att) return false;
  const fn = (att.fileName || att.originalName || att.name || (typeof att === "string" ? att : "")).toLowerCase().trim();
  const mt = (att.mimeType || att.type || "").toLowerCase().trim();
  return mt.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?.*)?$/i.test(fn);
};

const isArchiveAttachment = (att) => {
  if (!att) return false;
  const fn = (att.fileName || att.originalName || att.name || (typeof att === "string" ? att : "")).toLowerCase().trim();
  const mt = (att.mimeType || att.type || "").toLowerCase().trim();
  return (
    mt.includes("zip") ||
    mt.includes("tar") ||
    mt.includes("compressed") ||
    /\.(zip|tar|gz|tgz|7z|rar|bz2|xz)(\?.*)?$/i.test(fn)
  );
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
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
  const adminFolderInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const studentTypingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Image & File Lightbox Modal
  const [lightboxAttachment, setLightboxAttachment] = useState(null);
  const [lightboxViewMode, setLightboxViewMode] = useState("image"); // "image" | "document" | "code" | "video" | "audio" | "file"
  const [lightboxCodeContent, setLightboxCodeContent] = useState("");
  const [loadingCodeContent, setLoadingCodeContent] = useState(false);
  const [lightboxWordWrap, setLightboxWordWrap] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleOpenLightbox = async (att, defaultMode = null) => {
    const isImg = isImageAttachment(att);
    const isPdf = isPdfAttachment(att);
    const isCode = isCodeOrTextAttachment(att);
    const isVid = isVideoAttachment(att);
    const isAud = isAudioAttachment(att);
    const isArch = isArchiveAttachment(att);

    const attUrl = getAttachmentUrl(att.previewUrl || att.fileUrl, att.fileName || att.originalName);
    const imgUrl = att.imageUrl || (isPdf ? attUrl.replace(/\.pdf(\?.*)?$/i, ".png$1") : attUrl);

    let initialMode = defaultMode;
    if (!initialMode) {
      if (isImg) initialMode = "image";
      else if (isPdf) initialMode = "document";
      else if (isCode) initialMode = "code";
      else if (isVid) initialMode = "video";
      else if (isAud) initialMode = "audio";
      else initialMode = "file";
    }

    setLightboxViewMode(initialMode);
    setLightboxAttachment({
      ...att,
      fileUrl: attUrl,
      imageUrl: imgUrl,
      isImage: isImg,
      isPdf,
      isCode,
      isVideo: isVid,
      isAudio: isAud,
      isArchive: isArch,
    });

    if (isCode || initialMode === "code") {
      setLoadingCodeContent(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(attUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const text = await res.text();
          setLightboxCodeContent(text);
        } else {
          setLightboxCodeContent(`// Could not load file content directly (HTTP ${res.status}).\n// You can click 'Download' or 'Open in Tab' above to view.`);
        }
      } catch (err) {
        setLightboxCodeContent(`// Error fetching file preview: ${err.message}\n// Please click 'Download' or 'Open in Tab' to access.`);
      } finally {
        setLoadingCodeContent(false);
      }
    } else {
      setLightboxCodeContent("");
    }
  };

  const handleAdminPaste = async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.items) return;
    const items = Array.from(clipboardData.items);
    const imgItem = items.find((item) => item.type && item.type.startsWith("image/"));
    if (imgItem) {
      const blob = imgItem.getAsFile();
      if (blob) {
        e.preventDefault();
        const ext = blob.type === "image/jpeg" ? "jpg" : "png";
        const file = new File([blob], `screenshot_${Date.now()}.${ext}`, { type: blob.type });
        toast.info("Pasting screenshot...", { autoClose: 1500 });
        await handleAdminFilesChosen([file]);
      }
    }
  };

  // Upload helper using base64 payload to ensure 100% native stability
  const uploadAttachmentFile = async (file) => {
    const relPath = file.webkitRelativePath || file.name;
    const isFolder = Boolean(file.webkitRelativePath && file.webkitRelativePath.includes("/"));
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
              relativePath: relPath,
              isFolderItem: isFolder,
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
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds 25MB limit.`);
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
      const res = await deduplicatedFetch(`${API_BASE}/api/support/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      }, { ttlMs: 8000 });
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
    let handleConnect = null;
    let handleDisconnect = null;
    let handleNewTicket = null;
    let handleTicketUpdated = null;
    let handleMessageAdded = null;
    let handleTypingUpdate = null;

    try {
      const token = localStorage.getItem("token");
      socket = getSharedSocket(API_BASE || window.location.origin, {
        auth: { token },
      });
      socketRef.current = socket;

      handleConnect = () => {
        setIsConnected(true);
        if (socket) socket.emit("join_admin_monitoring");
      };

      handleDisconnect = () => {
        setIsConnected(false);
      };

      handleNewTicket = (newTkt) => {
        if (!newTkt) return;
        toast.info(`🔔 New support ticket received: ${newTkt.ticketId} (${newTkt.category})`);
        fetchTickets(true);
      };

      handleTicketUpdated = (updTkt) => {
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
      };

      handleMessageAdded = ({ ticketId, message }) => {
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
      };

      handleTypingUpdate = ({ ticketId, userRole, isTyping }) => {
        if (activeTicket?.ticketId === ticketId && userRole === "USER") {
          setStudentTyping(isTyping);
          if (isTyping) {
            clearTimeout(studentTypingTimeoutRef.current);
            studentTypingTimeoutRef.current = setTimeout(() => setStudentTyping(false), 3000);
          }
        }
      };

      socket.on("connect", handleConnect);
      if (socket.connected) {
        handleConnect();
      }
      socket.on("disconnect", handleDisconnect);
      socket.on("NEW_SUPPORT_TICKET", handleNewTicket);
      socket.on("TICKET_UPDATED", handleTicketUpdated);
      socket.on("TICKET_MESSAGE_ADDED", handleMessageAdded);
      socket.on("ticket_typing_update", handleTypingUpdate);
    } catch (err) {
      console.warn("Admin socket connection warning:", err);
    }

    return () => {
      if (socket) {
        if (handleConnect) socket.off("connect", handleConnect);
        if (handleDisconnect) socket.off("disconnect", handleDisconnect);
        if (handleNewTicket) socket.off("NEW_SUPPORT_TICKET", handleNewTicket);
        if (handleTicketUpdated) socket.off("TICKET_UPDATED", handleTicketUpdated);
        if (handleMessageAdded) socket.off("TICKET_MESSAGE_ADDED", handleMessageAdded);
        if (handleTypingUpdate) socket.off("ticket_typing_update", handleTypingUpdate);
        releaseSharedSocket(socket);
      }
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
        invalidateCachePattern("/api/support");
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
        invalidateCachePattern("/api/support");
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
        return { bg: "var(--mz-purple-bg)", color: "#7e22ce", border: "var(--mz-purple-border)", label: "Submitted" };
      case "Under Review":
        return { bg: "var(--mz-amber-bg)", color: "#b45309", border: "var(--mz-amber-border)", label: "Under Review" };
      case "In Progress":
        return { bg: "var(--mz-blue-bg)", color: "#1d4ed8", border: "var(--mz-blue-border)", label: "In Progress" };
      case "Resolved":
        return { bg: "var(--mz-green-bg)", color: "#047857", border: "var(--mz-green-border)", label: "Resolved" };
      default:
        return { bg: "var(--mz-surface-muted)", color: "var(--mz-text-secondary)", border: "var(--mz-border-strong)", label: status };
    }
  };

  const renderAttachments = (attachments, isWhiteTheme = false) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 12 }}>
        {attachments.map((att, idx) => {
          const isImg = isImageAttachment(att);
          const isPdf = isPdfAttachment(att);
          const isCode = isCodeOrTextAttachment(att);
          const isVid = isVideoAttachment(att);
          const isAud = isAudioAttachment(att);
          const isArch = isArchiveAttachment(att);
          const hasFolder = Boolean(att.isFolderItem || (att.relativePath && att.relativePath.includes("/")));
          const attUrl = getAttachmentUrl(att.previewUrl || att.fileUrl, att.fileName || att.originalName);

          if (isImg) {
            return (
              <div
                key={att._id || idx}
                onClick={() => handleOpenLightbox(att, "image")}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: isWhiteTheme ? "1px solid rgba(255,255,255,0.4)" : "1px solid var(--mz-border-strong)",
                  background: isWhiteTheme ? "rgba(255,255,255,0.15)" : "var(--mz-surface-muted)",
                  width: 160,
                  height: 110,
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                title="Click to view full image in front"
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
                    background: "rgba(15, 23, 42, 0.45)",
                    opacity: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    transition: "opacity 0.2s ease",
                    padding: 6,
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <LuEye size={24} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, marginTop: 4, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
                    View Full Image
                  </span>
                </div>
                {/* Filename sub-bar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 75%, transparent 100%)",
                    padding: "14px 6px 4px 6px",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {hasFolder ? `📁 ${att.relativePath}` : att.originalName}
                </div>
              </div>
            );
          }

          // Icon and accent configuration based on file type
          let icon = <LuFileText size={18} color={isWhiteTheme ? "#ffffff" : "#4f46e5"} />;
          let iconBg = isWhiteTheme ? "rgba(255,255,255,0.2)" : "rgba(79, 70, 229, 0.1)";
          let typeLabel = "Document";

          if (isCode) {
            icon = <LuFileCode size={18} color={isWhiteTheme ? "#ffffff" : "#059669"} />;
            iconBg = isWhiteTheme ? "rgba(255,255,255,0.2)" : "rgba(5, 150, 105, 0.12)";
            typeLabel = "Code / Log";
          } else if (isPdf) {
            icon = <LuFileText size={18} color={isWhiteTheme ? "#ffffff" : "#dc2626"} />;
            iconBg = isWhiteTheme ? "rgba(255,255,255,0.2)" : "rgba(220, 38, 38, 0.12)";
            typeLabel = "PDF";
          } else if (isVid) {
            icon = <LuVideo size={18} color={isWhiteTheme ? "#ffffff" : "#7c3aed"} />;
            iconBg = isWhiteTheme ? "rgba(255,255,255,0.2)" : "rgba(124, 58, 237, 0.12)";
            typeLabel = "Video";
          } else if (isAud) {
            icon = <LuMusic size={18} color={isWhiteTheme ? "#ffffff" : "#db2777"} />;
            iconBg = isWhiteTheme ? "rgba(255,255,255,0.2)" : "rgba(219, 39, 119, 0.12)";
            typeLabel = "Audio";
          } else if (isArch || hasFolder) {
            icon = <LuFolder size={18} color={isWhiteTheme ? "#ffffff" : "#d97706"} />;
            iconBg = isWhiteTheme ? "rgba(255,255,255,0.2)" : "rgba(217, 119, 6, 0.12)";
            typeLabel = hasFolder ? "Folder Item" : "Archive";
          }

          return (
            <div
              key={att._id || idx}
              onClick={() => handleOpenLightbox(att)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: isWhiteTheme ? "rgba(255,255,255,0.15)" : "var(--mz-surface)",
                color: isWhiteTheme ? "#ffffff" : "var(--mz-text-body)",
                border: isWhiteTheme ? "1px solid rgba(255,255,255,0.3)" : "1px solid var(--mz-border-strong)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                maxWidth: 320,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
              }}
              title="Click to view and inspect attachment in front"
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  {hasFolder && <span style={{ opacity: 0.85 }}>📁</span>}
                  <span title={hasFolder ? att.relativePath : att.originalName}>
                    {hasFolder ? att.relativePath : att.originalName}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, opacity: 0.75, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span>{formatFileSize(att.fileSize)}</span>
                  <span>•</span>
                  <span style={{ color: isWhiteTheme ? "#93c5fd" : "#4f46e5", fontWeight: 700 }}>
                    {typeLabel} Preview
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLightbox(att);
                }}
                style={{
                  background: isWhiteTheme ? "rgba(255,255,255,0.15)" : "rgba(79, 70, 229, 0.08)",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 7px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isWhiteTheme ? "#ffffff" : "#4f46e5",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                title="View full attachment in front"
              >
                <LuEye size={17} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="admin-page-container" style={{ padding: "24px 32px", minHeight: "100vh", background: "var(--mz-surface-subtle)" }}>
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
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--mz-text-primary)" }}>
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
                background: isConnected ? "var(--mz-green-bg)" : "var(--mz-surface-muted)",
                color: isConnected ? "#059669" : "var(--mz-text-muted)",
                border: `1px solid ${isConnected ? "var(--mz-green-border)" : "var(--mz-border-strong)"}`,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: isConnected ? "#10b981" : "var(--mz-text-subtle)",
                  animation: isConnected ? "pulse 2s infinite" : "none",
                }}
              />
              {isConnected ? "Real-Time Telemetry Online" : "Connecting..."}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--mz-text-muted)" }}>
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
            border: "1px solid var(--mz-border-strong)",
            background: "var(--mz-surface)",
            color: "var(--mz-text-secondary)",
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
        <div style={{ background: "var(--mz-surface)", padding: "18px 20px", borderRadius: 12, border: "1px solid var(--mz-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mz-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Total Tickets
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--mz-text-primary)", marginTop: 4 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--mz-text-subtle)", marginTop: 2 }}>All logged inquiries</div>
        </div>

        <div style={{ background: "var(--mz-surface)", padding: "18px 20px", borderRadius: 12, border: "1px solid var(--mz-purple-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Submitted
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#7e22ce", marginTop: 4 }}>
            {stats.submitted}
          </div>
          <div style={{ fontSize: 11.5, color: "#a855f7", marginTop: 2 }}>Awaiting initial review</div>
        </div>

        <div style={{ background: "var(--mz-surface)", padding: "18px 20px", borderRadius: 12, border: "1px solid var(--mz-amber-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Under Review
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#b45309", marginTop: 4 }}>
            {stats.underReview}
          </div>
          <div style={{ fontSize: 11.5, color: "#d97706", marginTop: 2 }}>Inspection underway</div>
        </div>

        <div style={{ background: "var(--mz-surface)", padding: "18px 20px", borderRadius: 12, border: "1px solid var(--mz-blue-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            In Progress
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8", marginTop: 4 }}>
            {stats.inProgress}
          </div>
          <div style={{ fontSize: 11.5, color: "#3b82f6", marginTop: 2 }}>Active correspondence</div>
        </div>

        <div style={{ background: "var(--mz-surface)", padding: "18px 20px", borderRadius: 12, border: "1px solid var(--mz-green-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
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
          background: "var(--mz-surface)",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid var(--mz-border)",
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
          <div ref={searchContainerRef} style={{ position: "relative", minWidth: 280, flex: "1 1 280px" }}>
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
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowSearchDropdown(false);
              }}
              placeholder="Search..."
              style={{
                width: "100%",
                padding: "8px 30px 8px 36px",
                borderRadius: 8,
                border: "1px solid var(--mz-border-strong)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
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

            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div className="mz-global-search-dropdown">
                <div className="mz-global-search-header">
                  <span>Tickets matching &ldquo;{searchQuery.trim()}&rdquo;</span>
                  <span className="mz-global-search-esc"><kbd>ESC</kbd> to dismiss</span>
                </div>
                {filteredTickets.length === 0 ? (
                  <div className="mz-global-search-empty">
                    <p>No tickets match &ldquo;{searchQuery}&rdquo;</p>
                    <small>Try searching by ticket ID, student name, or subject</small>
                  </div>
                ) : (
                  <div className="mz-global-search-group">
                    {filteredTickets.slice(0, 6).map((t) => (
                      <div
                        key={t.ticketId}
                        className="mz-global-search-item"
                        onClick={() => {
                          setShowSearchDropdown(false);
                          handleOpenTicket(t);
                        }}
                      >
                        <span className="mz-global-search-item-icon">🎫</span>
                        <div className="mz-global-search-item-content">
                          <div className="mz-global-search-item-title">{t.subject || "Support Ticket"}</div>
                          <div className="mz-global-search-item-sub">
                            {t.ticketId} • {t.userName} ({t.status})
                          </div>
                        </div>
                        <span className="mz-global-search-item-action">Inspect →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--mz-border-strong)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--mz-text-secondary)",
              background: "var(--mz-surface)",
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
                  background: isActive ? "#4f46e5" : "var(--mz-surface-muted)",
                  color: isActive ? "#ffffff" : "var(--mz-text-secondary)",
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
          background: "var(--mz-surface)",
          borderRadius: 14,
          border: "1px solid var(--mz-border)",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--mz-text-subtle)" }}>
            <LuRefreshCw className="animate-spin" style={{ width: 28, height: 28, margin: "0 auto 10px" }} />
            <div>Loading verified student tickets...</div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--mz-text-muted)" }}>
            <LuTicket style={{ width: 44, height: 44, color: "var(--mz-border-strong)", margin: "0 auto 10px" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "var(--mz-text-primary)" }}>No Support Tickets Found</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--mz-text-subtle)" }}>
              {searchQuery || statusFilter !== "all" || categoryFilter !== "All Categories"
                ? "No support tickets match your current filters."
                : "No student issues have been submitted to date."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--mz-surface-subtle)", borderBottom: "1px solid var(--mz-border)" }}>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", textTransform: "uppercase" }}>Ticket ID</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", textTransform: "uppercase" }}>Candidate Details</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", textTransform: "uppercase" }}>Category & Subject</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", textTransform: "uppercase" }}>Evidence</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", textTransform: "uppercase" }}>Submitted</th>
                  <th style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
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
                        borderBottom: "1px solid var(--mz-surface-muted)",
                        transition: "background 0.15s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mz-surface-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--mz-surface)")}
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
                            background: "var(--mz-indigo-bg)",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--mz-indigo-border)",
                          }}
                        >
                          {t.ticketId}
                        </span>
                      </td>

                      {/* Candidate */}
                      <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--mz-text-primary)" }}>
                          {t.userName}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--mz-text-muted)" }}>
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
                              color: "var(--mz-text-secondary)",
                              background: "var(--mz-surface-muted)",
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
                              color: "var(--mz-text-primary)",
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
                              background: "var(--mz-indigo-border)",
                              color: "#4338ca",
                              fontSize: 11.5,
                              fontWeight: 700,
                            }}
                          >
                            <LuPaperclip size={13} />
                            {totalAttachments} {totalAttachments === 1 ? "file" : "files"}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, color: "var(--mz-text-subtle)" }}>None</span>
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
                      <td style={{ padding: "14px 18px", verticalAlign: "middle", fontSize: 12, color: "var(--mz-text-muted)" }}>
                        <div>
                          {new Date(t.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>
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
                            border: "1px solid var(--mz-indigo-border)",
                            background: "var(--mz-blue-bg)",
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
            zIndex: 10000,
            padding: 20,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "var(--mz-surface)",
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
                borderBottom: "1px solid var(--mz-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--mz-surface-subtle)",
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
                      background: "var(--mz-indigo-bg)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid var(--mz-indigo-border)",
                    }}
                  >
                    {activeTicket.ticketId}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--mz-text-secondary)",
                      padding: "3px 8px",
                      background: "var(--mz-border)",
                      borderRadius: 4,
                    }}
                  >
                    {activeTicket.category}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                  {activeTicket.subject}
                </h2>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Status Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--mz-text-muted)", fontWeight: 600 }}>Status:</span>
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
                      border: "1px solid var(--mz-border-strong)",
                      fontSize: 12.5,
                      fontWeight: 700,
                      background: "var(--mz-surface)",
                      color: "var(--mz-text-secondary)",
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
                    color: "var(--mz-text-subtle)",
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
                background: "var(--mz-surface-muted)",
                borderBottom: "1px solid var(--mz-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12.5,
                color: "var(--mz-text-secondary)",
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
                  background: "var(--mz-surface-subtle)",
                  borderBottom: "1px solid var(--mz-border)",
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mz-text-body)", marginBottom: 6 }}>
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
                background: "var(--mz-surface-subtle)",
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
                        color: "var(--mz-text-muted)",
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
                          <span style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
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
                        background: isAdmin ? "#4f46e5" : "var(--mz-surface)",
                        color: isAdmin ? "#ffffff" : "var(--mz-text-body)",
                        border: isAdmin ? "none" : "1px solid var(--mz-border)",
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
                    background: "var(--mz-surface)",
                    padding: "8px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--mz-border)",
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
                borderTop: "1px solid var(--mz-border)",
                background: "var(--mz-surface)",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", marginBottom: 6 }}>
                  Write Personalized Admin Response (Triggers immediate in-app notification & user email):
                </label>
                <textarea
                  value={responseMessage}
                  onChange={handleAdminTypingChange}
                  onPaste={handleAdminPaste}
                  rows={3}
                  placeholder="e.g. Hello Yashash, we reviewed your compiler logs, folder files, and screenshots. We have verified your submission..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--mz-border-strong)",
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
                  {adminReplyAttachments.map((att, idx) => {
                    const isImg = isImageAttachment(att);
                    const isCode = isCodeOrTextAttachment(att);
                    const isFold = Boolean(att.isFolderItem || (att.relativePath && att.relativePath.includes("/")));
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
                          color: "#1e40af",
                          fontWeight: 600,
                        }}
                      >
                        {isFold ? (
                          <LuFolder size={13} color="#d97706" />
                        ) : isCode ? (
                          <LuFileCode size={13} color="#059669" />
                        ) : isImg ? (
                          <LuImage size={13} />
                        ) : (
                          <LuFileText size={13} />
                        )}
                        <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {isFold ? `📁 ${att.relativePath}` : att.originalName}
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
                    );
                  })}
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
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="file"
                    ref={adminFileInputRef}
                    multiple
                    accept="*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleAdminFilesChosen(e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />
                  <input
                    type="file"
                    ref={adminFolderInputRef}
                    multiple
                    webkitdirectory=""
                    directory=""
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
                      border: "1px solid var(--mz-border-strong)",
                      background: uploadingAdminAtt ? "var(--mz-indigo-border)" : "var(--mz-surface-subtle)",
                      color: "var(--mz-text-secondary)",
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

                  <button
                    type="button"
                    onClick={() => adminFolderInputRef.current?.click()}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--mz-border-strong)",
                      background: uploadingAdminAtt ? "var(--mz-indigo-border)" : "var(--mz-surface-subtle)",
                      color: "var(--mz-text-secondary)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <LuFolder size={14} color="#d97706" />
                    <span>Attach Folder</span>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)" }}>
                      Update Status:
                    </span>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid var(--mz-border-strong)",
                        fontSize: 12,
                        fontWeight: 600,
                        background: "var(--mz-surface)",
                        color: "var(--mz-text-secondary)",
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
                      border: "1px solid var(--mz-border-strong)",
                      background: "var(--mz-surface)",
                      color: "var(--mz-text-secondary)",
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
                      background: responseMessage.trim() || adminReplyAttachments.length > 0 ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" : "var(--mz-border-strong)",
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

      {/* ────────────────── LIGHTBOX FILE VIEWER MODAL ────────────────── */}
      {lightboxAttachment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.94)",
            backdropFilter: "blur(8px)",
            zIndex: 110000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 20px",
          }}
          onClick={() => setLightboxAttachment(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "96vw",
              maxHeight: "94vh",
              width: lightboxViewMode === "code" ? "90vw" : "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#0f172a",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 16,
              padding: "16px 20px",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.85)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar Header */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                color: "#ffffff",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {isImageAttachment(lightboxAttachment) ? (
                  <LuImage size={19} color="#60a5fa" />
                ) : isPdfAttachment(lightboxAttachment) ? (
                  <LuFileText size={19} color="#ef4444" />
                ) : isCodeOrTextAttachment(lightboxAttachment) ? (
                  <LuFileCode size={19} color="#34d399" />
                ) : isVideoAttachment(lightboxAttachment) ? (
                  <LuVideo size={19} color="#a78bfa" />
                ) : isAudioAttachment(lightboxAttachment) ? (
                  <LuMusic size={19} color="#f472b6" />
                ) : (
                  <LuFolder size={19} color="#fbbf24" />
                )}

                {lightboxAttachment.relativePath && (
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid rgba(52, 211, 153, 0.4)",
                      color: "#6ee7b7",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    📁 {lightboxAttachment.relativePath}
                  </span>
                )}

                <span style={{ fontWeight: 700, fontSize: 15, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {lightboxAttachment.originalName || lightboxAttachment.fileName}
                </span>

                <span
                  style={{
                    fontSize: 11.5,
                    opacity: 0.85,
                    background: "rgba(255,255,255,0.18)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {formatFileSize(lightboxAttachment.fileSize)}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "rgba(99, 102, 241, 0.25)",
                    border: "1px solid rgba(129, 140, 248, 0.4)",
                    color: "#a5b4fc",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {isImageAttachment(lightboxAttachment)
                    ? "Full Image View"
                    : isPdfAttachment(lightboxAttachment)
                    ? "Document & Evidence"
                    : isCodeOrTextAttachment(lightboxAttachment)
                    ? "Source Code / Log Viewer"
                    : isVideoAttachment(lightboxAttachment)
                    ? "Video Playback"
                    : isAudioAttachment(lightboxAttachment)
                    ? "Audio Playback"
                    : "File Details"}
                </span>

                {/* PDF View Mode Switcher */}
                {isPdfAttachment(lightboxAttachment) && (
                  <div style={{ display: "inline-flex", background: "rgba(255, 255, 255, 0.1)", borderRadius: 6, padding: 2, marginLeft: 6 }}>
                    <button
                      type="button"
                      onClick={() => setLightboxViewMode("image")}
                      style={{
                        background: lightboxViewMode === "image" ? "#4f46e5" : "transparent",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 4,
                        padding: "3px 10px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Image View
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxViewMode("document")}
                      style={{
                        background: lightboxViewMode === "document" ? "#4f46e5" : "transparent",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 4,
                        padding: "3px 10px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      PDF Document
                    </button>
                  </div>
                )}

                {/* Code Viewer Controls */}
                {lightboxViewMode === "code" && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
                    <button
                      type="button"
                      onClick={() => setLightboxWordWrap(!lightboxWordWrap)}
                      style={{
                        background: lightboxWordWrap ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 6,
                        padding: "3px 9px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Wrap: {lightboxWordWrap ? "ON" : "OFF"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (lightboxCodeContent) {
                          navigator.clipboard.writeText(lightboxCodeContent);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                          toast.success("Code copied to clipboard!");
                        }
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: copiedCode ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 6,
                        padding: "3px 9px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {copiedCode ? <LuCheck size={13} color="#34d399" /> : <LuCopy size={13} />}
                      <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <a
                  href={getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName)}
                  download={lightboxAttachment.originalName}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 11px",
                    borderRadius: 7,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: 11.5,
                    fontWeight: 600,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                  title="Download attachment file"
                >
                  <LuDownload size={13} />
                  <span>Download</span>
                </a>

                <a
                  href={getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 11px",
                    borderRadius: 7,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: 11.5,
                    fontWeight: 600,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                  title="Open file in a new browser tab"
                >
                  <LuExternalLink size={13} />
                  <span>Open in Tab</span>
                </a>

                <button
                  onClick={() => setLightboxAttachment(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: 7,
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  title="Close viewer (Esc)"
                >
                  <LuX size={17} />
                </button>
              </div>
            </div>

            {/* Direct File Image, PDF, Code, Video, Audio or File Viewer Container */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                maxWidth: "92vw",
                maxHeight: "82vh",
                overflow: "auto",
                borderRadius: 12,
                background: lightboxViewMode === "image" ? "#ffffff" : "#090d16",
                padding: lightboxViewMode === "image" ? 8 : 0,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
              }}
            >
              {lightboxViewMode === "image" || (isImageAttachment(lightboxAttachment) && lightboxViewMode !== "document") ? (
                <img
                  src={
                    lightboxAttachment.imageUrl ||
                    (isPdfAttachment(lightboxAttachment)
                      ? getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName).replace(/\.pdf(\?.*)?$/i, ".png$1")
                      : getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName))
                  }
                  alt={lightboxAttachment.originalName || "Attachment"}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    borderRadius: 8,
                    display: "block",
                  }}
                  onError={(e) => {
                    const rawUrl = getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName);
                    if (!e.currentTarget.src.includes(rawUrl)) {
                      e.currentTarget.src = rawUrl;
                    }
                  }}
                />
              ) : isPdfAttachment(lightboxAttachment) && lightboxViewMode === "document" ? (
                <iframe
                  src={getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName)}
                  title={lightboxAttachment.originalName || "PDF Document"}
                  style={{
                    width: "84vw",
                    height: "78vh",
                    border: "none",
                    borderRadius: 12,
                    background: "#ffffff",
                  }}
                />
              ) : lightboxViewMode === "code" || isCodeOrTextAttachment(lightboxAttachment) ? (
                <div
                  style={{
                    width: "100%",
                    height: "76vh",
                    overflow: "auto",
                    background: "#090d16",
                    color: "#f1f5f9",
                    padding: "16px 20px",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
                    fontSize: 13,
                    lineHeight: 1.6,
                    borderRadius: 12,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {loadingCodeContent ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "#94a3b8" }}>
                      <LuRefreshCw className="animate-spin" size={20} />
                      <span>Loading source code content...</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 16 }}>
                      {/* Line Numbers */}
                      <div
                        style={{
                          userSelect: "none",
                          color: "#475569",
                          textAlign: "right",
                          paddingRight: 14,
                          borderRight: "1px solid rgba(255,255,255,0.1)",
                          fontFamily: "inherit",
                        }}
                      >
                        {lightboxCodeContent
                          .split("\n")
                          .map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                      </div>
                      {/* Code Content */}
                      <pre
                        style={{
                          margin: 0,
                          padding: 0,
                          flex: 1,
                          fontFamily: "inherit",
                          whiteSpace: lightboxWordWrap ? "pre-wrap" : "pre",
                          wordBreak: lightboxWordWrap ? "break-word" : "normal",
                          color: "#e2e8f0",
                        }}
                      >
                        {lightboxCodeContent || "// Empty file"}
                      </pre>
                    </div>
                  )}
                </div>
              ) : isVideoAttachment(lightboxAttachment) ? (
                <div style={{ padding: 12, display: "flex", justifyContent: "center", background: "#000", borderRadius: 12 }}>
                  <video
                    src={getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName)}
                    controls
                    style={{ maxWidth: "86vw", maxHeight: "78vh", borderRadius: 8 }}
                  />
                </div>
              ) : isAudioAttachment(lightboxAttachment) ? (
                <div
                  style={{
                    padding: "40px 60px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    background: "#1e293b",
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  <LuMusic size={48} color="#f472b6" />
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                    {lightboxAttachment.originalName}
                  </div>
                  <audio
                    src={getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName)}
                    controls
                    style={{ width: 420, maxWidth: "80vw" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: "40px 60px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                    background: "#1e293b",
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  <LuFolder size={50} color="#fbbf24" />
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                    {lightboxAttachment.relativePath || lightboxAttachment.originalName}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#94a3b8" }}>
                    {formatFileSize(lightboxAttachment.fileSize)} • {lightboxAttachment.mimeType}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <a
                      href={getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName)}
                      download={lightboxAttachment.originalName}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "#4f46e5",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <LuDownload size={15} />
                      <span>Download File</span>
                    </a>
                    <a
                      href={getAttachmentUrl(lightboxAttachment.fileUrl, lightboxAttachment.fileName || lightboxAttachment.originalName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.12)",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <LuExternalLink size={15} />
                      <span>Open in Browser</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHelpSupport;

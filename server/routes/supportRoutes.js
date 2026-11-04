const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");
const { verifyAdmin, recordAdminAudit } = require("../middleware/adminAuth");
const { pushNotification } = require("../utils/notificationService");
const { pushAdminNotification } = require("../utils/adminNotificationService");
const {
  sendSupportTicketSubmittedEmail,
  sendSupportTicketResponseEmail,
} = require("../utils/mailer");

const router = express.Router();

function resolveReqUserId(req) {
  return String(req.user?.userId || req.user?.id || req.user?._id || "").trim();
}

function generateTicketId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MZ-TKT-${suffix}`;
}

function sanitizeAttachments(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter((a) => a && (a.fileUrl || a.fileName))
    .map((a) => ({
      fileName: String(a.fileName || "").trim(),
      originalName: String(a.originalName || a.fileName || "attachment").trim(),
      fileUrl: String(a.fileUrl || "").trim(),
      mimeType: String(a.mimeType || "application/octet-stream").trim(),
      fileSize: Number(a.fileSize) || 0,
      uploadedAt: a.uploadedAt ? new Date(a.uploadedAt) : new Date(),
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACHMENT UPLOAD ROUTE (FOR BOTH USERS & ADMINS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/support/upload
 * Securely uploads file attachment (screenshot, log, document, code file)
 */
router.post("/upload", authenticateToken, async (req, res) => {
  try {
    const { originalName, mimeType, base64Data } = req.body;
    if (!base64Data || !originalName) {
      return res.status(400).json({ success: false, message: "Missing file payload or file name." });
    }

    const ext = path.extname(originalName) || "";
    const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    const uniqueFileName = `tkt_att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanBase}${ext}`;
    const uploadDir = path.join(__dirname, "../uploads/support_attachments");

    await fs.promises.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, uniqueFileName);

    const rawData = base64Data.includes(";base64,") ? base64Data.split(";base64,").pop() : base64Data;
    const buffer = Buffer.from(rawData, "base64");

    // Max 15MB limit
    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: "File exceeds 15MB limit." });
    }

    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/support_attachments/${uniqueFileName}`;
    res.status(200).json({
      success: true,
      attachment: {
        fileName: uniqueFileName,
        originalName,
        fileUrl,
        mimeType: mimeType || "application/octet-stream",
        fileSize: buffer.length,
        uploadedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("Support file upload error:", err);
    res.status(500).json({ success: false, message: "Failed to upload attachment", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USER SUPPORT ROUTES (AUTHENTICATED USER)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/support/tickets
 * Create a new genuine support ticket with optional attachments
 */
router.post("/tickets", authenticateToken, async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: "Invalid user session." });
    }

    const { category, subject, description, priority = "Medium", attachments = [] } = req.body;
    const cleanAttachments = sanitizeAttachments(attachments);

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Category, subject, and problem description are required.",
      });
    }

    // Lookup user details
    const user = await User.findById(userId).select("fullName username email").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    const userName = user.fullName || user.username || "Student";
    const userEmail = user.email || "";

    // Generate unique Ticket ID
    let ticketId = generateTicketId();
    let collision = await SupportTicket.findOne({ ticketId });
    while (collision) {
      ticketId = generateTicketId();
      collision = await SupportTicket.findOne({ ticketId });
    }

    const ticket = await SupportTicket.create({
      ticketId,
      userId: user._id,
      userName,
      userEmail,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority: ["Low", "Medium", "High", "Critical"].includes(priority) ? priority : "Medium",
      status: "Submitted",
      attachments: cleanAttachments,
      messages: [
        {
          senderRole: "USER",
          senderId: user._id,
          senderName: userName,
          message: description.trim(),
          attachments: cleanAttachments,
          createdAt: new Date(),
        },
      ],
      lastUpdatedBy: "USER",
    });

    const io = req.app.get("io");

    // Send confirmation email asynchronously
    sendSupportTicketSubmittedEmail({
      userEmail,
      userName,
      ticketId,
      category,
      subject,
      description,
      priority,
      ticketUrl: `http://localhost:5174/help?ticket=${ticketId}`,
    }).catch((e) => console.warn("Ticket submission email warning:", e.message));

    // Send Admin event notification & broadcast
    pushAdminNotification({
      title: `New Support Ticket [${ticketId}]`,
      message: `${userName} submitted a support ticket: "${subject}" (${category})${cleanAttachments.length ? ` with ${cleanAttachments.length} attachment(s)` : ""}`,
      type: "support",
      severity: priority === "Critical" ? "alert" : "info",
      targetId: ticketId,
      targetUser: user._id,
      actionUrl: `/admin/help?ticket=${ticketId}`,
      io,
    }).catch(() => {});

    if (io) {
      const tktObj = ticket.toObject();
      io.to("super_admin_room").emit("NEW_SUPPORT_TICKET", tktObj);
      io.to(`user_${String(user._id)}`).emit("TICKET_CREATED", tktObj);
      io.to(`ticket_${ticketId}`).emit("TICKET_CREATED", tktObj);
    }

    res.status(201).json({
      success: true,
      message: `Support Ticket ${ticketId} created successfully.`,
      ticket,
    });
  } catch (err) {
    console.error("Support ticket creation error:", err);
    res.status(500).json({ success: false, message: "Failed to submit ticket", error: err.message });
  }
});

/**
 * GET /api/support/my-tickets
 * Fetch tickets submitted by current user
 */
router.get("/my-tickets", authenticateToken, async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: "Invalid user session." });
    }

    const tickets = await SupportTicket.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err) {
    console.error("Fetch my-tickets error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch support requests", error: err.message });
  }
});

/**
 * GET /api/support/tickets/:ticketId
 * Fetch single ticket details
 */
router.get("/tickets/:ticketId", authenticateToken, async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({
      ticketId,
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found or access denied." });
    }

    res.status(200).json({ success: true, ticket });
  } catch (err) {
    console.error("Fetch ticket error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ticket", error: err.message });
  }
});

/**
 * POST /api/support/tickets/:ticketId/reply
 * User reply in ticket discussion thread with optional attachments
 */
router.post("/tickets/:ticketId/reply", authenticateToken, async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    const { ticketId } = req.params;
    const { message = "", attachments = [] } = req.body;
    const cleanAttachments = sanitizeAttachments(attachments);

    if (!message.trim() && cleanAttachments.length === 0) {
      return res.status(400).json({ success: false, message: "Message content or an attachment is required." });
    }

    const ticket = await SupportTicket.findOne({
      ticketId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found or access denied." });
    }

    const user = await User.findById(userId).select("fullName username").lean();
    const senderName = user?.fullName || user?.username || "Student";

    const replyMsg = {
      senderRole: "USER",
      senderId: new mongoose.Types.ObjectId(userId),
      senderName,
      message: message.trim(),
      attachments: cleanAttachments,
      createdAt: new Date(),
    };

    ticket.messages.push(replyMsg);
    ticket.lastUpdatedBy = "USER";
    if (ticket.status === "Resolved") {
      ticket.status = "In Progress";
    }
    await ticket.save();

    const io = req.app.get("io");
    if (io) {
      const tktObj = ticket.toObject();
      io.to("super_admin_room").emit("TICKET_UPDATED", tktObj);
      io.to(`user_${String(userId)}`).emit("TICKET_UPDATED", tktObj);
      io.to(`ticket_${ticketId}`).emit("TICKET_UPDATED", tktObj);
      io.to(`ticket_${ticketId}`).emit("TICKET_MESSAGE_ADDED", { ticketId, message: replyMsg });
    }

    res.status(200).json({
      success: true,
      message: "Reply sent successfully.",
      ticket,
    });
  } catch (err) {
    console.error("User reply error:", err);
    res.status(500).json({ success: false, message: "Failed to post reply", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SUPPORT MANAGEMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/support/admin/tickets or /api/admin/support/tickets
 * Admin list all tickets with filters, statistics and real database records
 */
router.get("/admin/tickets", verifyAdmin, async (req, res) => {
  try {
    const { q, status, category } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { ticketId: regex },
        { userName: regex },
        { userEmail: regex },
        { subject: regex },
        { description: regex },
      ];
    }

    const [tickets, totalCount, submittedCount, reviewCount, progressCount, resolvedCount] =
      await Promise.all([
        SupportTicket.find(filter).sort({ updatedAt: -1, createdAt: -1 }).lean(),
        SupportTicket.countDocuments(),
        SupportTicket.countDocuments({ status: "Submitted" }),
        SupportTicket.countDocuments({ status: "Under Review" }),
        SupportTicket.countDocuments({ status: "In Progress" }),
        SupportTicket.countDocuments({ status: "Resolved" }),
      ]);

    res.status(200).json({
      success: true,
      tickets,
      stats: {
        total: totalCount,
        submitted: submittedCount,
        underReview: reviewCount,
        inProgress: progressCount,
        resolved: resolvedCount,
      },
    });
  } catch (err) {
    console.error("Admin fetch tickets error:", err);
    res.status(500).json({ success: false, message: "Failed to load support tickets", error: err.message });
  }
});

/**
 * GET /api/support/admin/tickets/:ticketId or /api/admin/support/tickets/:ticketId
 * Admin inspect complete ticket thread
 */
router.get("/admin/tickets/:ticketId", verifyAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await SupportTicket.findOne({ ticketId }).populate("userId", "fullName username email avatar").lean();
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }
    res.status(200).json({ success: true, ticket });
  } catch (err) {
    console.error("Admin ticket detail error:", err);
    res.status(500).json({ success: false, message: "Failed to load ticket details", error: err.message });
  }
});

/**
 * PUT /api/support/admin/tickets/:ticketId/status or /api/admin/support/tickets/:ticketId/status
 * Admin change ticket status
 */
router.put("/admin/tickets/:ticketId/status", verifyAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ["Submitted", "Under Review", "In Progress", "Resolved"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.status = status;
    ticket.lastUpdatedBy = "ADMIN";
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;
    if (status === "Resolved") {
      ticket.resolvedAt = new Date();
    }
    await ticket.save();

    const io = req.app.get("io");

    // In-app user notification
    pushNotification(io, {
      userId: ticket.userId,
      title: `Support Ticket ${ticket.ticketId} Status Updated`,
      message: `Your support request has been updated to "${status}".`,
      type: "support",
      severity: status === "Resolved" ? "success" : "info",
      actionUrl: `/help?ticket=${ticket.ticketId}`,
      actionLabel: "View Ticket",
      meta: { ticketId: ticket.ticketId, status },
    }).catch(() => {});

    // Send email notification on status resolution or update
    sendSupportTicketResponseEmail({
      userEmail: ticket.userEmail,
      userName: ticket.userName,
      ticketId: ticket.ticketId,
      category: ticket.category,
      subject: ticket.subject,
      adminResponse: `Status updated to ${status}. ${adminNotes ? `Admin Note: ${adminNotes}` : ""}`,
      status,
      respondedBy: req.user?.fullName || "MasteryZone Administrator",
      ticketUrl: `http://localhost:5174/help?ticket=${ticket.ticketId}`,
    }).catch((e) => console.warn("Status change email warning:", e.message));

    // Broadcast real-time update
    if (io) {
      const tktObj = ticket.toObject();
      io.to(`user_${String(ticket.userId)}`).emit("TICKET_UPDATED", tktObj);
      io.to("super_admin_room").emit("TICKET_UPDATED", tktObj);
      io.to(`ticket_${ticketId}`).emit("TICKET_UPDATED", tktObj);
    }

    recordAdminAudit(
      req,
      "UPDATE_SUPPORT_TICKET_STATUS",
      `Ticket ${ticket.ticketId} status changed to ${status}`,
      ticketId
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Ticket status successfully changed to ${status}.`,
      ticket,
    });
  } catch (err) {
    console.error("Update ticket status error:", err);
    res.status(500).json({ success: false, message: "Failed to update ticket status", error: err.message });
  }
});

/**
 * POST /api/support/admin/tickets/:ticketId/reply or /api/admin/support/tickets/:ticketId/reply
 * Admin writes personalized response with optional attachments and updates ticket status
 */
router.post("/admin/tickets/:ticketId/reply", verifyAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message = "", status, adminNotes, attachments = [] } = req.body;
    const cleanAttachments = sanitizeAttachments(attachments);

    if (!message.trim() && cleanAttachments.length === 0) {
      return res.status(400).json({ success: false, message: "Response message or an attachment is required." });
    }

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    const adminName = req.user?.fullName || req.user?.username || "MasteryZone Support Admin";

    const newStatus = status && ["Submitted", "Under Review", "In Progress", "Resolved"].includes(status)
      ? status
      : "In Progress";

    const adminMsg = {
      senderRole: "ADMIN",
      senderId: req.user?._id,
      senderName: adminName,
      message: message.trim(),
      attachments: cleanAttachments,
      createdAt: new Date(),
    };

    ticket.messages.push(adminMsg);
    ticket.adminResponse = message.trim();
    ticket.respondedBy = adminName;
    ticket.respondedAt = new Date();
    ticket.status = newStatus;
    ticket.lastUpdatedBy = "ADMIN";
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;
    if (newStatus === "Resolved") {
      ticket.resolvedAt = new Date();
    }
    await ticket.save();

    const io = req.app.get("io");

    // Push in-app user notification with sound chime & link
    pushNotification(io, {
      userId: ticket.userId,
      title: `Response Received on Ticket ${ticket.ticketId}`,
      message: `${adminName} replied: "${message.trim().slice(0, 120)}${message.length > 120 ? "..." : ""}"`,
      type: "support",
      severity: newStatus === "Resolved" ? "success" : "info",
      actionUrl: `/help?ticket=${ticket.ticketId}`,
      actionLabel: "View Support Ticket",
      meta: { ticketId: ticket.ticketId, status: newStatus },
    }).catch(() => {});

    // Send personalized response email to user's registered email
    sendSupportTicketResponseEmail({
      userEmail: ticket.userEmail,
      userName: ticket.userName,
      ticketId: ticket.ticketId,
      category: ticket.category,
      subject: ticket.subject,
      adminResponse: message.trim(),
      status: newStatus,
      respondedBy: adminName,
      ticketUrl: `http://localhost:5174/help?ticket=${ticket.ticketId}`,
    }).catch((e) => console.warn("Admin response email warning:", e.message));

    // Real-time broadcast
    if (io) {
      const tktObj = ticket.toObject();
      io.to(`user_${String(ticket.userId)}`).emit("TICKET_UPDATED", tktObj);
      io.to("super_admin_room").emit("TICKET_UPDATED", tktObj);
      io.to(`ticket_${ticketId}`).emit("TICKET_UPDATED", tktObj);
      io.to(`ticket_${ticketId}`).emit("TICKET_MESSAGE_ADDED", { ticketId, message: adminMsg });
    }

    recordAdminAudit(
      req,
      "REPLIED_SUPPORT_TICKET",
      `Replied to ticket ${ticket.ticketId} with status ${newStatus}${cleanAttachments.length ? ` with ${cleanAttachments.length} attachment(s)` : ""}`,
      ticketId
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Response sent to user and ticket updated.",
      ticket,
    });
  } catch (err) {
    console.error("Admin reply error:", err);
    res.status(500).json({ success: false, message: "Failed to post response", error: err.message });
  }
});

module.exports = router;

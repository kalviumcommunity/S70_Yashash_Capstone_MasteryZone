const mongoose = require("mongoose");

const supportAttachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    relativePath: {
      type: String,
      default: "",
    },
    isFolderItem: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const supportMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["USER", "ADMIN"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [supportAttachmentSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "Login and Authentication",
        "Coding Compiler Issues",
        "Assignments and Assessments",
        "Reports and Marks",
        "Projects and Progress",
        "Meetings and Recordings",
        "Certificates",
        "Other Technical Issues",
      ],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Submitted", "Under Review", "In Progress", "Resolved"],
      default: "Submitted",
      index: true,
    },
    attachments: [supportAttachmentSchema],
    messages: [supportMessageSchema],
    adminResponse: {
      type: String,
      default: "",
    },
    respondedBy: {
      type: String,
      default: "",
    },
    respondedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      default: "",
    },
    lastUpdatedBy: {
      type: String,
      default: "USER",
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ userEmail: 1, createdAt: -1 });
supportTicketSchema.index({ updatedAt: -1 });
supportTicketSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);

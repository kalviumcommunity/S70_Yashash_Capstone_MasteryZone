const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      default: "DSA Practice",
    },
    groupKey: {
      type: String,
      default: "coding",
    },
    groupTitle: {
      type: String,
      default: "Coding",
    },
    hostUserId: {
      type: String,
      required: true,
    },
    hostName: {
      type: String,
      default: "Host",
    },
    hostEmail: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
      index: true,
    },
    invitationCode: {
      type: String,
      default: "",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        userId: String,
        socketId: String,
        fullName: String,
        username: String,
        avatarUrl: String,
        role: {
          type: String,
          enum: ["host", "co-host", "participant"],
          default: "participant",
        },
        isMuted: { type: Boolean, default: false },
        isVideoOff: { type: Boolean, default: false },
        isScreenSharing: { type: Boolean, default: false },
        isHandRaised: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
        leftAt: Date,
      },
    ],
    sharedCode: {
      code: {
        type: String,
        default:
          '# Welcome to Mastery Zone Live Shared Coding\ndef solve(n):\n    """Compute square of n"""\n    return n * n\n\nif __name__ == "__main__":\n    for x in range(1, 6):\n        print(f"solve({x}) = {solve(x)}")\n',
      },
      language: {
        type: String,
        default: "python",
      },
      lastModifiedBy: String,
      lastUpdatedAt: { type: Date, default: Date.now },
    },
    notes: {
      content: {
        type: String,
        default:
          "# Meeting Notes — DSA Practice\n\n- Discussing algorithmic complexity and optimal two-pointer approaches.\n- Next topic: Dynamic Programming on Trees.\n",
      },
      lastModifiedBy: String,
      lastUpdatedAt: { type: Date, default: Date.now },
    },
    messages: [
      {
        id: String,
        senderId: String,
        senderName: String,
        senderAvatar: String,
        text: String,
        timeString: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    codingPermission: {
      type: String,
      enum: ["collaborative", "host-only", "read-only"],
      default: "collaborative",
    },
    workspaceFiles: [
      {
        id: String,
        name: String,
        language: String,
        content: String,
        lastModifiedBy: String,
      },
    ],
    activeFileId: {
      type: String,
      default: "file_0",
    },
    testCases: [
      {
        id: String,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        passed: Boolean,
      },
    ],
    codeReviews: [
      {
        id: String,
        fileId: String,
        fileName: String,
        lineNumber: Number,
        codeSnippet: String,
        authorName: String,
        authorId: String,
        text: String,
        status: { type: String, enum: ["open", "resolved"], default: "open" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    whiteboardData: {
      type: String,
      default: "[]",
    },
    sharedTasks: [
      {
        id: String,
        title: String,
        assignedTo: String,
        completed: { type: Boolean, default: false },
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
  },
  {
    timestamps: true,
  }
);

meetingSchema.index({ status: 1, groupKey: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);

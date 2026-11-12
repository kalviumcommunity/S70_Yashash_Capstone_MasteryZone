const mongoose = require("mongoose");

const codingSnippetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Untitled Snippet",
    },
    language: {
      type: String,
      default: "python",
    },
    code: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

codingSnippetSchema.index({ userId: 1, updatedAt: -1 });

module.exports =
  mongoose.models.CodingSnippet ||
  mongoose.model("CodingSnippet", codingSnippetSchema);

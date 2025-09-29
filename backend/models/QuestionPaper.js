// models/QuestionPaper.js
import mongoose from "mongoose";

// Simplified schema to store the entire AI-generated paper in a single field
const questionPaperSchema = new mongoose.Schema(
  {
    // Store the complete AI response structure here
    paper: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Optional metadata (kept non-required for flexibility)
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    examDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "finalized", "published"],
      default: "draft",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    llmPrompt: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "question_papers",
  }
);

// Indexes (optional metadata)
questionPaperSchema.index({ createdAt: -1 });
questionPaperSchema.index({ status: 1 });

// Transform output
questionPaperSchema.methods.toJSON = function () {
  const qpObject = this.toObject();
  delete qpObject.__v;
  return qpObject;
};

const QuestionPaper = mongoose.model("QuestionPaper", questionPaperSchema);

export default QuestionPaper;

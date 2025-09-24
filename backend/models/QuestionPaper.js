// models/QuestionPaper.js
import mongoose from "mongoose";

const questionPaperSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    examDate: {
      type: Date,
      required: true,
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
      type: mongoose.Schema.Types.Mixed, // JSON object
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "question_papers",
  }
);

// Indexes
questionPaperSchema.index({ schoolId: 1 });
questionPaperSchema.index({ createdBy: 1 });
questionPaperSchema.index({ bookId: 1 });
questionPaperSchema.index({ subjectId: 1 });
questionPaperSchema.index({ classId: 1 });
questionPaperSchema.index({ status: 1 });
questionPaperSchema.index({ examDate: 1 });
questionPaperSchema.index({ createdAt: -1 });

// Instance methods
questionPaperSchema.methods.getSchool = function () {
  return mongoose.model("School").findById(this.schoolId);
};

questionPaperSchema.methods.getCreator = function () {
  return mongoose.model("Teacher").findById(this.createdBy);
};

questionPaperSchema.methods.getBook = function () {
  return mongoose.model("Book").findById(this.bookId);
};

questionPaperSchema.methods.getSubject = function () {
  return mongoose.model("Subject").findById(this.subjectId);
};

questionPaperSchema.methods.getClass = function () {
  return mongoose.model("Class").findById(this.classId);
};

questionPaperSchema.methods.isDraft = function () {
  return this.status === "draft";
};

questionPaperSchema.methods.isFinalized = function () {
  return this.status === "finalized";
};

questionPaperSchema.methods.isPublished = function () {
  return this.status === "published";
};

// Static methods
questionPaperSchema.statics.findBySchool = function (schoolId) {
  return this.find({ schoolId });
};

questionPaperSchema.statics.findByCreator = function (createdBy) {
  return this.find({ createdBy });
};

questionPaperSchema.statics.findByBook = function (bookId) {
  return this.find({ bookId });
};

questionPaperSchema.statics.findBySubject = function (subjectId) {
  return this.find({ subjectId });
};

questionPaperSchema.statics.findByClass = function (classId) {
  return this.find({ classId });
};

questionPaperSchema.statics.findByStatus = function (status) {
  return this.find({ status });
};

questionPaperSchema.statics.findByExamDate = function (examDate) {
  return this.find({ examDate });
};

questionPaperSchema.statics.findDraftPapers = function () {
  return this.find({ status: "draft" });
};

questionPaperSchema.statics.findFinalizedPapers = function () {
  return this.find({ status: "finalized" });
};

questionPaperSchema.statics.findPublishedPapers = function () {
  return this.find({ status: "published" });
};

// Transform output
questionPaperSchema.methods.toJSON = function () {
  const qpObject = this.toObject();
  delete qpObject.__v;
  return qpObject;
};

const QuestionPaper = mongoose.model("QuestionPaper", questionPaperSchema);

export default QuestionPaper;

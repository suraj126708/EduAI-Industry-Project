// models/AnswerSheet.js
import mongoose from "mongoose";

const answerSheetSchema = new mongoose.Schema(
  {
    questionPaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionPaper",
      required: true,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    ocrText: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "evaluated", "failed"],
      default: "pending",
    },

    evaluationMetadata: {
      type: mongoose.Schema.Types.Mixed, // JSON object
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "answer_sheets",
  }
);

// Indexes
answerSheetSchema.index({ questionPaperId: 1 });
answerSheetSchema.index({ submittedBy: 1 });
answerSheetSchema.index({ status: 1 });
answerSheetSchema.index({ submittedAt: -1 });

// Instance methods
answerSheetSchema.methods.getQuestionPaper = function () {
  return mongoose.model("QuestionPaper").findById(this.questionPaperId);
};

answerSheetSchema.methods.getSubmitter = function () {
  return mongoose.model("Teacher").findById(this.submittedBy);
};

answerSheetSchema.methods.isPending = function () {
  return this.status === "pending";
};

answerSheetSchema.methods.isEvaluated = function () {
  return this.status === "evaluated";
};

answerSheetSchema.methods.isFailed = function () {
  return this.status === "failed";
};

answerSheetSchema.methods.markAsEvaluated = function () {
  this.status = "evaluated";
  return this.save();
};

answerSheetSchema.methods.markAsFailed = function () {
  this.status = "failed";
  return this.save();
};

// Static methods
answerSheetSchema.statics.findByQuestionPaper = function (questionPaperId) {
  return this.find({ questionPaperId });
};

answerSheetSchema.statics.findBySubmitter = function (submittedBy) {
  return this.find({ submittedBy });
};

answerSheetSchema.statics.findByStatus = function (status) {
  return this.find({ status });
};

answerSheetSchema.statics.findPendingSheets = function () {
  return this.find({ status: "pending" });
};

answerSheetSchema.statics.findEvaluatedSheets = function () {
  return this.find({ status: "evaluated" });
};

answerSheetSchema.statics.findFailedSheets = function () {
  return this.find({ status: "failed" });
};

answerSheetSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    submittedAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

// Transform output
answerSheetSchema.methods.toJSON = function () {
  const answerSheetObject = this.toObject();
  delete answerSheetObject.__v;
  return answerSheetObject;
};

const AnswerSheet = mongoose.model("AnswerSheet", answerSheetSchema);

export default AnswerSheet;

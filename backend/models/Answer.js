// models/Answer.js
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    answerSheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnswerSheet",
      required: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    answerText: {
      type: String,
      required: true,
      trim: true,
    },

    marksAwarded: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    feedback: {
      type: String,
      default: null,
      trim: true,
    },

    evaluationByLlm: {
      type: Boolean,
      default: false,
    },

    llmMetadata: {
      type: mongoose.Schema.Types.Mixed, // JSON object
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "answers",
  }
);

// Indexes
answerSchema.index({ answerSheetId: 1 });
answerSchema.index({ questionId: 1 });
answerSchema.index({ marksAwarded: 1 });
answerSchema.index({ evaluationByLlm: 1 });

// Instance methods
answerSchema.methods.getAnswerSheet = function () {
  return mongoose.model("AnswerSheet").findById(this.answerSheetId);
};

answerSchema.methods.getQuestion = function () {
  return mongoose.model("Question").findById(this.questionId);
};

answerSchema.methods.isEvaluatedByLlm = function () {
  return this.evaluationByLlm === true;
};

answerSchema.methods.isFullMarks = function () {
  return this.marksAwarded === this.question?.marks;
};

answerSchema.methods.isZeroMarks = function () {
  return this.marksAwarded === 0;
};

// Static methods
answerSchema.statics.findByAnswerSheet = function (answerSheetId) {
  return this.find({ answerSheetId });
};

answerSchema.statics.findByQuestion = function (questionId) {
  return this.find({ questionId });
};

answerSchema.statics.findByMarksRange = function (minMarks, maxMarks) {
  return this.find({ marksAwarded: { $gte: minMarks, $lte: maxMarks } });
};

answerSchema.statics.findEvaluatedByLlm = function () {
  return this.find({ evaluationByLlm: true });
};

answerSchema.statics.findFullMarksAnswers = function () {
  return this.find({ marksAwarded: { $gt: 0 } });
};

answerSchema.statics.findZeroMarksAnswers = function () {
  return this.find({ marksAwarded: 0 });
};

answerSchema.statics.getAverageMarks = function (answerSheetId) {
  return this.aggregate([
    { $match: { answerSheetId: mongoose.Types.ObjectId(answerSheetId) } },
    { $group: { _id: null, averageMarks: { $avg: "$marksAwarded" } } },
  ]);
};

answerSchema.statics.getTotalMarks = function (answerSheetId) {
  return this.aggregate([
    { $match: { answerSheetId: mongoose.Types.ObjectId(answerSheetId) } },
    { $group: { _id: null, totalMarks: { $sum: "$marksAwarded" } } },
  ]);
};

// Transform output
answerSchema.methods.toJSON = function () {
  const answerObject = this.toObject();
  delete answerObject.__v;
  return answerObject;
};

const Answer = mongoose.model("Answer", answerSchema);

export default Answer;

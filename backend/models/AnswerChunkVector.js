// models/AnswerChunkVector.js
import mongoose from "mongoose";

const answerChunkVectorSchema = new mongoose.Schema(
  {
    questionPaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionPaper",
      required: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    chunkIndex: {
      type: [Number], // Array of chunk indices
      required: true,
    },

    chapter: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    sourceType: {
      type: String,
      required: true,
      enum: ["answer_key", "reference_passage", "textbook_content"],
      trim: true,
    },

    llmMetadata: {
      type: mongoose.Schema.Types.Mixed, // JSON object
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "answer_chunk_vectors",
  }
);

// Indexes
answerChunkVectorSchema.index({ questionPaperId: 1 });
answerChunkVectorSchema.index({ questionId: 1 });
answerChunkVectorSchema.index({ chapter: 1 });
answerChunkVectorSchema.index({ sourceType: 1 });
answerChunkVectorSchema.index({ questionPaperId: 1, questionId: 1 });

// Instance methods
answerChunkVectorSchema.methods.getQuestionPaper = function () {
  return mongoose.model("QuestionPaper").findById(this.questionPaperId);
};

answerChunkVectorSchema.methods.getQuestion = function () {
  return mongoose.model("Question").findById(this.questionId);
};

answerChunkVectorSchema.methods.isAnswerKey = function () {
  return this.sourceType === "answer_key";
};

answerChunkVectorSchema.methods.isReferencePassage = function () {
  return this.sourceType === "reference_passage";
};

answerChunkVectorSchema.methods.isTextbookContent = function () {
  return this.sourceType === "textbook_content";
};

answerChunkVectorSchema.methods.getChunkCount = function () {
  return this.chunkIndex ? this.chunkIndex.length : 0;
};

answerChunkVectorSchema.methods.hasChunkIndex = function (index) {
  return this.chunkIndex && this.chunkIndex.includes(index);
};

// Static methods
answerChunkVectorSchema.statics.findByQuestionPaper = function (
  questionPaperId
) {
  return this.find({ questionPaperId });
};

answerChunkVectorSchema.statics.findByQuestion = function (questionId) {
  return this.find({ questionId });
};

answerChunkVectorSchema.statics.findByChapter = function (chapter) {
  return this.find({ chapter: { $regex: chapter, $options: "i" } });
};

answerChunkVectorSchema.statics.findBySourceType = function (sourceType) {
  return this.find({ sourceType });
};

answerChunkVectorSchema.statics.findAnswerKeys = function () {
  return this.find({ sourceType: "answer_key" });
};

answerChunkVectorSchema.statics.findReferencePassages = function () {
  return this.find({ sourceType: "reference_passage" });
};

answerChunkVectorSchema.statics.findTextbookContent = function () {
  return this.find({ sourceType: "textbook_content" });
};

answerChunkVectorSchema.statics.findByQuestionPaperAndChapter = function (
  questionPaperId,
  chapter
) {
  return this.find({
    questionPaperId,
    chapter: { $regex: chapter, $options: "i" },
  });
};

answerChunkVectorSchema.statics.findByQuestionAndSourceType = function (
  questionId,
  sourceType
) {
  return this.find({ questionId, sourceType });
};

answerChunkVectorSchema.statics.getChaptersByQuestionPaper = function (
  questionPaperId
) {
  return this.distinct("chapter", { questionPaperId });
};

answerChunkVectorSchema.statics.getSourceTypesByQuestionPaper = function (
  questionPaperId
) {
  return this.distinct("sourceType", { questionPaperId });
};

// Transform output
answerChunkVectorSchema.methods.toJSON = function () {
  const acvObject = this.toObject();
  delete acvObject.__v;
  return acvObject;
};

const AnswerChunkVector = mongoose.model(
  "AnswerChunkVector",
  answerChunkVectorSchema
);

export default AnswerChunkVector;

// models/Question.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionPaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionPaper",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["MCQ", "short_answer", "long_answer", "true_false", "fill_blank"],
      trim: true,
    },

    units: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    marks: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: String, // JSON string for MCQ options
      default: null,
    },

    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },

    generatedByLlm: {
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
    collection: "questions",
  }
);

// Indexes
questionSchema.index({ questionPaperId: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ units: 1 });
questionSchema.index({ marks: 1 });
questionSchema.index({ generatedByLlm: 1 });

// Instance methods
questionSchema.methods.getQuestionPaper = function () {
  return mongoose.model("QuestionPaper").findById(this.questionPaperId);
};

questionSchema.methods.isMCQ = function () {
  return this.type === "MCQ";
};

questionSchema.methods.isShortAnswer = function () {
  return this.type === "short_answer";
};

questionSchema.methods.isLongAnswer = function () {
  return this.type === "long_answer";
};

questionSchema.methods.isGeneratedByLlm = function () {
  return this.generatedByLlm === true;
};

questionSchema.methods.getOptionsArray = function () {
  if (this.options) {
    try {
      return JSON.parse(this.options);
    } catch (error) {
      return [];
    }
  }
  return [];
};

questionSchema.methods.setOptionsArray = function (optionsArray) {
  this.options = JSON.stringify(optionsArray);
};

// Static methods
questionSchema.statics.findByQuestionPaper = function (questionPaperId) {
  return this.find({ questionPaperId });
};

questionSchema.statics.findByType = function (type) {
  return this.find({ type });
};

questionSchema.statics.findByUnits = function (units) {
  return this.find({ units: { $regex: units, $options: "i" } });
};

questionSchema.statics.findByMarks = function (marks) {
  return this.find({ marks });
};

questionSchema.statics.findByMarksRange = function (minMarks, maxMarks) {
  return this.find({ marks: { $gte: minMarks, $lte: maxMarks } });
};

questionSchema.statics.findGeneratedByLlm = function () {
  return this.find({ generatedByLlm: true });
};

questionSchema.statics.findByQuestionPaperAndType = function (
  questionPaperId,
  type
) {
  return this.find({ questionPaperId, type });
};

questionSchema.statics.findByQuestionPaperAndUnits = function (
  questionPaperId,
  units
) {
  return this.find({
    questionPaperId,
    units: { $regex: units, $options: "i" },
  });
};

// Transform output
questionSchema.methods.toJSON = function () {
  const questionObject = this.toObject();
  delete questionObject.__v;

  // Parse options if it's a string
  if (questionObject.options && typeof questionObject.options === "string") {
    try {
      questionObject.options = JSON.parse(questionObject.options);
    } catch (error) {
      questionObject.options = [];
    }
  }

  return questionObject;
};

const Question = mongoose.model("Question", questionSchema);

export default Question;

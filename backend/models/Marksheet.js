// models/Marksheet.js
import mongoose from "mongoose";

const marksheetSchema = new mongoose.Schema(
  {
    answerSheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnswerSheet",
      required: true,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    grade: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },

    report: {
      type: String,
      required: true,
      trim: true,
    },

    insights: {
      type: mongoose.Schema.Types.Mixed, // JSON object
      default: null,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "marksheets",
  }
);

// Indexes
marksheetSchema.index({ answerSheetId: 1 });
marksheetSchema.index({ totalMarks: 1 });
marksheetSchema.index({ grade: 1 });
marksheetSchema.index({ generatedAt: -1 });

// Instance methods
marksheetSchema.methods.getAnswerSheet = function () {
  return mongoose.model("AnswerSheet").findById(this.answerSheetId);
};

marksheetSchema.methods.getGradeValue = function () {
  const gradeMap = {
    "A+": 95,
    A: 90,
    "A-": 85,
    "B+": 80,
    B: 75,
    "B-": 70,
    "C+": 65,
    C: 60,
    "C-": 55,
    "D+": 50,
    D: 45,
    "D-": 40,
    F: 0,
  };
  return gradeMap[this.grade] || 0;
};

marksheetSchema.methods.isPassingGrade = function () {
  const passingGrades = [
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D+",
    "D",
  ];
  return passingGrades.includes(this.grade);
};

marksheetSchema.methods.isFailingGrade = function () {
  return this.grade === "F";
};

marksheetSchema.methods.getInsightsArray = function () {
  if (this.insights && typeof this.insights === "object") {
    return Object.values(this.insights);
  }
  return [];
};

// Static methods
marksheetSchema.statics.findByAnswerSheet = function (answerSheetId) {
  return this.findOne({ answerSheetId });
};

marksheetSchema.statics.findByGrade = function (grade) {
  return this.find({ grade });
};

marksheetSchema.statics.findByMarksRange = function (minMarks, maxMarks) {
  return this.find({ totalMarks: { $gte: minMarks, $lte: maxMarks } });
};

marksheetSchema.statics.findPassingGrades = function () {
  const passingGrades = [
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D+",
    "D",
  ];
  return this.find({ grade: { $in: passingGrades } });
};

marksheetSchema.statics.findFailingGrades = function () {
  return this.find({ grade: "F" });
};

marksheetSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    generatedAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

marksheetSchema.statics.getAverageMarks = function () {
  return this.aggregate([
    { $group: { _id: null, averageMarks: { $avg: "$totalMarks" } } },
  ]);
};

marksheetSchema.statics.getGradeDistribution = function () {
  return this.aggregate([
    { $group: { _id: "$grade", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

marksheetSchema.statics.getTopPerformers = function (limit = 10) {
  return this.find({}).sort({ totalMarks: -1 }).limit(limit);
};

// Transform output
marksheetSchema.methods.toJSON = function () {
  const marksheetObject = this.toObject();
  delete marksheetObject.__v;
  return marksheetObject;
};

const Marksheet = mongoose.model("Marksheet", marksheetSchema);

export default Marksheet;

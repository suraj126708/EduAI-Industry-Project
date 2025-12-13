import mongoose from "mongoose";

const SemesterReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The principal who generated it
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      academicYear: { type: String }, // e.g., "2025-2026"
      semesterName: { type: String }, // e.g., "Term 1"
    },
    // The structured analysis from AI
    aiInsights: {
      summary: { type: String },
      overallGrade: { type: String },
      subjectAnalysis: [
        {
          subject: String,
          score: Number,
          proficiency: String,
          insight: String,
        },
      ],
      skillAnalysis: [
        {
          skill: String,
          score: Number,
        },
      ],
      strengths: [String],
      weaknesses: [String], // Recommendations
      highlights: [String],
    },
    // The raw data for graphs/charts
    examHistory: [
      {
        examId: { type: mongoose.Schema.Types.ObjectId, ref: "Evaluation" },
        examType: String,
        subject: String,
        date: Date,
        obtainedMarks: Number,
        totalMarks: Number,
        percentage: Number,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("SemesterReport", SemesterReportSchema);

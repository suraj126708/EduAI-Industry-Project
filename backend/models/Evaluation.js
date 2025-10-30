import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    questionPaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionPaper",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    answerSheetUrl: {
      type: String, // Path to the uploaded file (e.g., on disk or S3 URL)
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "evaluating", "completed", "error"],
      default: "pending",
    },
    // This is where the AI's results will be stored
    evaluationResults: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    totalMarksObtained: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "evaluations",
  }
);

evaluationSchema.index({ studentId: 1, questionPaperId: 1 });

const Evaluation = mongoose.model("Evaluation", evaluationSchema);
export default Evaluation;

import Evaluation from "../models/Evaluation.js";
import QuestionPaper from "../models/QuestionPaper.js";
import Student from "../models/Student.js";

// @desc    Upload an answer sheet for evaluation
// @route   POST /api/evaluations/upload
// @access  Private (Teacher)
export const uploadAnswerSheetForEvaluation = async (req, res) => {
  try {
    const { studentId, questionPaperId } = req.body;
    const teacherId = req.user._id;
    const schoolId = req.user.schoolId;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No answer sheet file provided." });
    }

    if (!studentId || !questionPaperId) {
      return res.status(400).json({
        success: false,
        message: "Student and Question Paper are required.",
      });
    }

    // 1. Verify all documents exist
    const student = await Student.findById(studentId);
    const paper = await QuestionPaper.findById(questionPaperId);

    if (!student || !paper) {
      return res.status(404).json({
        success: false,
        message: "Student or Question Paper not found.",
      });
    }

    // 2. Check for duplicate evaluation
    const existingEvaluation = await Evaluation.findOne({
      studentId,
      questionPaperId,
    });
    if (existingEvaluation) {
      // Here you might decide to overwrite it or return an error
      return res.status(409).json({
        success: false,
        message: "An evaluation for this student and paper already exists.",
      });
    }

    // 3. Create the new evaluation record
    const newEvaluation = new Evaluation({
      studentId,
      questionPaperId,
      teacherId,
      schoolId,
      answerSheetUrl: req.file.path, // Save the path to the uploaded file
      status: "pending",
    });

    await newEvaluation.save();

    // 4. (Future Step) Send to AI for processing
    // You would await an AI service call here, passing:
    // - paper.paper (the full question paper object)
    // - req.file.path (the path to the answer sheet)
    // - newEvaluation._id (so the AI can send results back)
    // Example: aiService.startEvaluation(paper.paper, req.file.path, newEvaluation._id);

    res.status(201).json({
      success: true,
      message: "Answer sheet uploaded successfully. Evaluation is pending.",
      data: newEvaluation,
    });
  } catch (error) {
    console.error("Evaluation Error - Upload:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to upload answer sheet.",
      error: error.message,
    });
  }
};

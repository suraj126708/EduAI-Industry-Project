import Evaluation from "../models/Evaluation.js";
import QuestionPaper from "../models/QuestionPaper.js";
import Student from "../models/Student.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

// Get the AI service URL from your teacherController (move this to a central config later)
const deplyed_url = "https://suraj6708-eduai.hf.space/";

// @desc    Upload an answer sheet for evaluation
// @route   POST /api/evaluations/upload
// @access  Private (Teacher)
export const uploadAnswerSheetForEvaluation = async (req, res) => {
  let evaluation; // To store the evaluation document
  const answerSheetUrl = req.file?.path; // Get the path from multer

  try {
    const { studentId, questionPaperId } = req.body;
    const teacherId = req.user._id;
    const schoolId = req.user.schoolId;

    // 1. Check for file
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No answer sheet file provided." });
    }

    // 2. Check for required IDs
    if (!studentId || !questionPaperId) {
      // If IDs are missing, delete the file that just got uploaded
      if (answerSheetUrl) await fs.promises.unlink(answerSheetUrl);
      return res.status(400).json({
        success: false,
        message: "Student ID and Question Paper ID are required.",
      });
    }

    // 3. Verify all documents exist and belong to the teacher's school
    const student = await Student.findById(studentId);
    const paper = await QuestionPaper.findById(questionPaperId);

    if (!student || !paper) {
      if (answerSheetUrl) await fs.promises.unlink(answerSheetUrl);
      return res
        .status(404)
        .json({
          success: false,
          message: "Student or Question Paper not found.",
        });
    }

    if (
      student.schoolId.toString() !== schoolId.toString() ||
      paper.schoolId.toString() !== schoolId.toString()
    ) {
      if (answerSheetUrl) await fs.promises.unlink(answerSheetUrl);
      return res.status(403).json({
        success: false,
        message: "Student or paper does not belong to this school.",
      });
    }

    // 4. Find or Create Evaluation (Overwrite old one if it exists)
    const existingEvaluation = await Evaluation.findOne({
      studentId,
      questionPaperId,
    });

    if (existingEvaluation) {
      // Overwrite: Delete old file, update record
      if (existingEvaluation.answerSheetUrl) {
        await fs.promises
          .unlink(existingEvaluation.answerSheetUrl)
          .catch((err) =>
            console.error("Failed to delete old answer sheet:", err.message)
          );
      }
      existingEvaluation.answerSheetUrl = answerSheetUrl;
      existingEvaluation.status = "evaluating"; // Reset status
      existingEvaluation.evaluationResults = null;
      existingEvaluation.totalMarksObtained = null;
      existingEvaluation.teacherId = teacherId; // Update teacher
      evaluation = await existingEvaluation.save();
    } else {
      // Create new record
      evaluation = new Evaluation({
        studentId,
        questionPaperId,
        teacherId,
        schoolId,
        answerSheetUrl,
        status: "evaluating", // Set to "evaluating" immediately
      });
      await evaluation.save();
    }

    // 5. Send to AI Service for Evaluation
    console.log("Sending to AI service for evaluation...");
    const form = new FormData();

    // a) Append the Question Paper JSON object
    //    We send the 'paper' sub-document, as requested
    form.append("question_paper", JSON.stringify(paper.paper));

    // b) Append the Answer Sheet File Stream
    const fileStream = fs.createReadStream(answerSheetUrl);
    form.append("answer_sheet", fileStream, {
      filename: path.basename(answerSheetUrl),
      contentType: req.file.mimetype,
    });

    // c) Append the Evaluation ID (so the AI can tag the response)
    form.append("evaluation_id", evaluation._id.toString());

    // Make the POST request to the AI service
    // (Assuming the endpoint is named 'evaluate_answer_sheet/')
    const aiResponse = await axios.post(
      deplyed_url + "evaluate_answer_sheet/",
      form,
      {
        headers: { ...form.getHeaders() },
        timeout: 10 * 60 * 1000, // 10 minute timeout for evaluation
      }
    );

    // 6. Process AI Response
    if (aiResponse.status !== 200 || !aiResponse.data.success) {
      // AI failed
      throw new Error(
        aiResponse.data.message || "AI service failed to evaluate."
      );
    }

    // AI Succeeded
    const results = aiResponse.data.results; // Assuming this is the structure

    evaluation.status = "completed";
    evaluation.evaluationResults = results.evaluationDetails; // e.g., marks per question
    evaluation.totalMarksObtained = results.totalMarksObtained;
    await evaluation.save();

    // 7. Send final success response to frontend
    res.status(201).json({
      success: true,
      message: "Answer sheet uploaded and evaluated successfully.",
      data: evaluation, // Send back the full evaluation
    });
  } catch (error) {
    console.error("Evaluation Error - Upload:", error.message);

    // If an error occurred, set the evaluation status to "error"
    if (evaluation) {
      evaluation.status = "error";
      evaluation.evaluationResults = { error: error.message };
      await evaluation
        .save()
        .catch((err) => console.error("Failed to save error status:", err));
    }

    // We *keep* the file if an error occurred for debugging
    // but send a 500 error to the frontend.
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload answer sheet.",
      error: error.message,
    });
  }
};

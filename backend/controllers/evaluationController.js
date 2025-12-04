//Answer sheet evaluation and report generation controller

import Evaluation from "../models/Evaluation.js";
import QuestionPaper from "../models/QuestionPaper.js";
import Student from "../models/Student.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import moment from "moment";

//const deplyed_url = "http://127.0.0.1:8000/";
//const deplyed_url = "https://joshiaryan-eduai-ai-deployment.hf.space/";
const deplyed_url = "https://suraj6708-question-gen-api.hf.space/";

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
      return res.status(404).json({
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
    form.append("question_paper_str", JSON.stringify(paper.paper));

    // b) Append the Answer Sheet File Stream
    const fileStream = fs.createReadStream(answerSheetUrl);
    form.append("file", fileStream, {
      filename: path.basename(answerSheetUrl),
      contentType: req.file.mimetype,
    });

    // c) Append the Evaluation ID (so the AI can tag the response)
    form.append("evaluation_id", evaluation._id.toString());

    // Make the POST request to the AI service
    // (Assuming the endpoint is named 'evaluate_answer_sheet/')
    const aiResponse = await axios.post(
      deplyed_url + "evaluate_answer_paper/",
      form,
      {
        headers: { ...form.getHeaders() },
        timeout: 10 * 60 * 1000, // 10 minute timeout for evaluation
      }
    );

    const aiData = aiResponse.data; // Get the root of the AI response
    if (!aiData.sections || aiData.obtainedMarks === undefined) {
      throw new Error(
        "AI response format is incorrect. Missing sections, obtainedMarks, or totalMarks."
      );
    }

    evaluation.status = "completed";
    evaluation.evaluationResults = {
      set: aiData.set,
      totalMarks: aiData.totalMarks, // This is the paper's total marks
      sections: aiData.sections,
    };

    evaluation.totalMarksObtained = aiData.obtainedMarks; // This is the student's score
    await evaluation.save();

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

// @desc    Get a single evaluation report
// @route   GET /api/evaluations/:id
// @access  Private (Teacher/Student)
export const getEvaluationReport = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate("studentId", "name rollNo class div") // Get student info
      .populate("questionPaperId", "subject examType paper"); // Get paper info

    if (!evaluation) {
      return res
        .status(404)
        .json({ success: false, message: "Evaluation not found." });
    } // Optional: Check if req.user has access to this report // (e.g., is the teacher or the student)

    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    console.error("Get Report Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve evaluation report.",
    });
  }
};

// @desc    Get all evaluations for a specific class/division
// @route   GET /api/evaluations/class-status
// @access  Private (Teacher)
export const getEvaluationsByClass = async (req, res) => {
  try {
    const { classGrade, division } = req.query;
    const schoolId = req.user.schoolId;

    if (!classGrade) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid class grade." });
    }

    // 1. Find all students in that class/division
    const students = await Student.find({
      class: classGrade, // <--- THE FIX: Use 'class' to match your DB
      div: division,
      schoolId,
    }).select("_id");

    if (students.length === 0) {
      console.log("No students found in getEvaluationsByClass for:", {
        class: classGrade, // Use 'class' for logging
        division,
      });
      return res.status(200).json({ success: true, data: {} }); // Return empty OBJECT
    }

    const studentIds = students.map((s) => s._id);

    // 2. Find all 'completed' evaluations for those students
    const evaluations = await Evaluation.find({
      studentId: { $in: studentIds },
      status: "completed",
    }).select(
      "studentId questionPaperId totalMarksObtained evaluationResults _id"
    );

    // 3. Convert to a map for easier frontend lookup { studentId: [eval1, eval2] }
    const evalMap = evaluations.reduce((acc, evaluation) => {
      const sId = evaluation.studentId.toString();
      if (!acc[sId]) {
        acc[sId] = [];
      }
      acc[sId].push(evaluation);
      return acc;
    }, {});

    res.status(200).json({ success: true, data: evalMap });
  } catch (error) {
    console.error("Get Class Evals Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve evaluations.",
    });
  }
};

export const generateSemesterReport = async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.body;

    if (!studentId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // 1. Fetch Evaluations with Full Student & Paper Details
    const evaluations = await Evaluation.find({
      studentId: studentId,
      status: "completed",
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .populate("questionPaperId", "subject examType paper.maxMarks paper.date")
      .populate("studentId", "name rollNo class division")
      .sort({ createdAt: 1 });

    if (!evaluations || evaluations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No evaluations found for this period.",
      });
    }

    // --- DATA ADAPTER START ---

    // 2. Extract Student Info (From the first evaluation found)
    const studentObj = evaluations[0].studentId;

    // 3. Transform Evaluations into 'evaluation_reports' for Python
    // The Python Model expects: Subject, Class, totalMarks, obtainedMarks, exam_name, exam_date, sections
    const evaluationReports = evaluations.map((evalDoc) => ({
      Subject: evalDoc.questionPaperId?.subject || "General",
      Class: `${studentObj.class}-${studentObj.division}`, // e.g., "10-A"
      totalMarks: evalDoc.evaluationResults?.totalMarks || 100,
      obtainedMarks: evalDoc.totalMarksObtained || 0,
      exam_name: evalDoc.questionPaperId?.examType || "Assessment",
      exam_date: evalDoc.createdAt.toISOString().split("T")[0], // YYYY-MM-DD
      sections: evalDoc.evaluationResults?.sections || [], // Passing the sections directly
    }));

    // 4. Calculate Academic Metadata
    const startYear = new Date(startDate).getFullYear();
    const academicYear = `${startYear}-${startYear + 1}`;
    const currentMonth = new Date(startDate).getMonth();
    const semester =
      currentMonth >= 5 ? "Fall " + startYear : "Spring " + startYear;

    // 5. Construct the Payload EXACTLY as Python expects
    const pythonPayload = {
      student_name: studentObj.name,
      student_id: studentId,
      semester: semester,
      academic_year: academicYear,
      evaluation_reports: evaluationReports, // The array we mapped above
      export_format: "json",
    };

    console.log(
      "Sending Payload to AI:",
      JSON.stringify(pythonPayload, null, 2)
    );

    // 6. Send to AI Service
    // Note: Added trailing slash to URL because your Python route is defined as "/generate_semester_report/"
    const aiResponse = await axios.post(
      deplyed_url + "generate_semester_report",
      pythonPayload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    const aiData = aiResponse.data;

    // --- DATA ADAPTER END ---

    // 7. Prepare Response for Frontend (The 'rawHistory' table needs database data)

    // Re-map evaluations for the frontend table list
    const rawHistory = evaluations.map((ev) => ({
      examId: ev._id,
      date: ev.createdAt,
      examType: ev.questionPaperId?.examType || "Exam",
      subject: ev.questionPaperId?.subject || "General",
      obtainedMarks: ev.totalMarksObtained,
      totalMarks: ev.evaluationResults?.totalMarks || 100,
    }));

    // Map AI visual data for Recharts (Frontend expects Arrays)
    // We try to use AI data if available, otherwise fallback to calculating it here
    let trendData = [];

    // If AI returns an image string for trend, we can't use it in Recharts.
    // So we rebuild the array data here for the charts:
    trendData = rawHistory.map((h) => ({
      examName: h.examType,
      percentage: ((h.obtainedMarks / h.totalMarks) * 100).toFixed(1),
    }));

    // Construct Final Object for React
    const finalReportData = {
      schoolInfo: {
        name: "Green Valley High School",
        address: "123 Education Lane",
      },
      studentInfo: {
        name: studentObj.name,
        class: studentObj.class,
        division: studentObj.division,
        rollNo: studentObj.rollNo,
      },
      period: { start: startDate, end: endDate },

      aiAnalysis: {
        // Access fields based on what your Python Generator returns structure is
        // Usually generator.generate_semester_report() returns a specific dict structure.
        // Adjust these keys based on the *actual* Python return value.
        aggregate_score: aiData.summary?.overall_percentage || "N/A",
        overall_grade: aiData.summary?.overall_grade || "N/A",
        strongest_subject: "Math", // You might need to parse this from AI stats

        trend_data: trendData, // Use the array calculated above for charts
        subject_performance: [], // Fill this if you want subject bar charts

        strengths: aiData.recommendations || ["Good effort"],
        weaknesses: ["Focus on consistency"],
        recommendation: aiData.recommendations?.[0] || "Keep working hard.",
      },

      rawHistory: rawHistory,
    };

    return res.status(200).json({
      success: true,
      data: finalReportData,
    });
  } catch (error) {
    console.error("Report Generation Error:", error.message);
    // Log detailed axios error if available
    if (error.response) {
      console.error("AI Service Error Details:", error.response.data);
    }
    res
      .status(500)
      .json({ success: false, message: "Report generation failed." });
  }
};

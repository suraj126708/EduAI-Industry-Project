//Answer sheet evaluation and report generation controller

import Evaluation from "../models/Evaluation.js";
import QuestionPaper from "../models/QuestionPaper.js";
import Student from "../models/Student.js";
import School from "../models/School.js";
import SemesterReport from "../models/SemesterReport.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import moment from "moment";

const deplyed_url = "http://127.0.0.1:8000/";
//const deplyed_url = "https://joshiaryan-eduai-ai-deployment.hf.space/";
//const deplyed_url = "https://suraj6708-question-gen-api.hf.space/";

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
      chapter_summary: aiData.chapter_summary,
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

const getSemesterDates = (year, semester) => {
  const y = parseInt(year);
  let start, end;

  if (semester === "Semester 1") {
    // June 1st to December 31st
    start = new Date(y, 5, 1); // Month is 0-indexed (5 = June)
    end = new Date(y, 11, 31); // 11 = Dec
  } else {
    // Semester 2: January 1st to May 31st
    start = new Date(y, 0, 1); // 0 = Jan
    end = new Date(y, 4, 31); // 4 = May
  }

  // Set times to start/end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const generateSemesterReport = async (req, res) => {
  try {
    const { studentId, year, semester } = req.body;

    // 1. Validation & Fetching (Keep existing logic)
    if (!studentId || !year || !semester) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields." });
    }
    const { start: startDate, end: endDate } = getSemesterDates(year, semester);

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Fetch School for the record
    const school = await School.findById(student.schoolId);

    // 2. Fetch Evaluations (Keep existing logic)
    const evaluations = await Evaluation.find({
      studentId: studentId,
      status: "completed",
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .populate("questionPaperId", "subject examType paper.maxMarks")
      .sort({ createdAt: 1 });

    if (!evaluations.length) {
      return res
        .status(404)
        .json({ success: false, message: "No exams found." });
    }

    // 3. Prepare AI Payload (Keep existing logic)
    const evalPayload = evaluations.map((ev) => ({
      subject: ev.questionPaperId?.subject || "General",
      exam_type: ev.questionPaperId?.examType || "Assessment",
      marks_obtained: ev.totalMarksObtained || 0,
      total_marks: ev.evaluationResults?.totalMarks || 20,
      date: ev.createdAt.toISOString().split("T")[0],
    }));

    const pythonPayload = {
      student_name: student.name,
      class_grade: String(student.class),
      semester: "Term 1",
      academic_year: `${new Date(startDate).getFullYear()}`,
      evaluations: evalPayload,
    };

    // 4. Call AI (Keep existing logic)
    const aiResponse = await axios.post(
      deplyed_url + "generate_semester_report/",
      pythonPayload,
      { headers: { "Content-Type": "application/json" }, timeout: 60000 }
    );

    if (!aiResponse.data.success) throw new Error("AI generation failed");

    const aiData = aiResponse.data.report;

    // 5. Calculate Grades (Keep existing logic)
    const totalObtained = evalPayload.reduce(
      (acc, c) => acc + c.marks_obtained,
      0
    );
    const totalMax = evalPayload.reduce((acc, c) => acc + c.total_marks, 0);
    const overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    let grade = "F";
    if (overallPct >= 90) grade = "A+";
    else if (overallPct >= 80) grade = "A";
    else if (overallPct >= 70) grade = "B";
    else if (overallPct >= 60) grade = "C";
    else if (overallPct >= 50) grade = "D";

    // --- 6. CREATE & SAVE DATABASE RECORD (NEW STEP) ---
    const newReport = new SemesterReport({
      studentId: student._id,
      schoolId: student.schoolId,
      generatedBy: req.user?._id, // Assuming auth middleware
      period: {
        startDate: startDate,
        endDate: endDate,
        academicYear: String(year),
        semesterName: semester, // You can make this dynamic from frontend input
      },
      aiInsights: {
        summary: aiData.summary,
        overallGrade: grade,
        subjectAnalysis: aiData.subject_analysis,
        skillAnalysis: aiData.skill_analysis,
        strengths: aiData.highlights || [],
        weaknesses: aiData.recommendations || [],
        highlights: aiData.highlights || [],
      },
      examHistory: evalPayload.map((ev, i) => ({
        examId: evaluations[i]._id, // Link back to original exam
        examType: ev.exam_type,
        subject: ev.subject,
        date: new Date(ev.date),
        obtainedMarks: ev.marks_obtained,
        totalMarks: ev.total_marks,
        percentage: (ev.marks_obtained / ev.total_marks) * 100,
      })),
    });

    await newReport.save();

    // 7. Return the Saved Report ID
    return res.status(200).json({
      success: true,
      message: "Report generated and saved successfully.",
      reportId: newReport._id, // Frontend will use this to redirect
      data: newReport, // Optional: return data immediately
    });
  } catch (error) {
    console.error("Generate Report Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate report" });
  }
};

// --- Add a GET endpoint to fetch the saved report ---
export const getSemesterReportById = async (req, res) => {
  try {
    const report = await SemesterReport.findById(req.params.id)
      .populate("studentId", "name rollNo class division")
      .populate("schoolId", "name address logo");

    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check which students have existing semester reports for a specific period
// @route   POST /api/evaluation/semester/check-status
export const checkSemesterReports = async (req, res) => {
  try {
    const { studentIds, year, semester } = req.body; // Expect year/sem

    if (!studentIds || !year || !semester) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    // Find reports for these students matching the exact semester & year
    const reports = await SemesterReport.find({
      studentId: { $in: studentIds },
      "period.academicYear": String(year),
      "period.semesterName": semester,
    }).select("studentId _id");

    const reportMap = {};
    reports.forEach((r) => {
      reportMap[r.studentId.toString()] = r._id;
    });

    res.status(200).json({ success: true, data: reportMap });
  } catch (error) {
    console.error("Check Reports Error:", error);
    res.status(500).json({ success: false, message: "Failed to check status" });
  }
};

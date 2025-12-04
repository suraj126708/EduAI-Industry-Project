/**
 * Teacher Controller
 *
 * Handles teacher management, book uploads, question paper generation,
 * and teacher assignments for the Teacher Management System.
 *
 * @author Teacher Management System Team
 * @version 1.0.0
 */

import User from "../models/UserSchema.js";
import QuestionPaper from "../models/QuestionPaper.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import School from "../models/School.js";
import Book from "../models/BookSchema.js";
import TeacherClassSubject from "../models/TeacherClassSubject.js";
import Student from "../models/Student.js";

import { validationResult } from "express-validator";
import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import mongoose from "mongoose";
/**
 * Get all teachers (Admin only)
 * @desc    Retrieve all teachers with pagination and filtering
 * @route   GET /api/teachers
 * @access  Private (Admin)
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 *
 *
 */

const local_url = "http://localhost:8000/";
//const deplyed_url = "https://joshiaryan-eduai-ai-deployment.hf.space/";
//const deplyed_url = "http://127.0.0.1:8000/";
const deplyed_url = "https://suraj6708-question-gen-api.hf.space/";
//const deplyed_url = "http://10.20.29.221:8000/";

export const getAllTeachers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { role: "teacher" };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.schoolId) filter.schoolId = req.query.schoolId;
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: "i" } },
        { name: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const teachers = await User.find(filter)
      .populate("schoolId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTeachers = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Teachers retrieved successfully",
      data: {
        teachers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTeachers / limit),
          totalTeachers,
          hasNext: page < Math.ceil(totalTeachers / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Teacher Error - Get all teachers:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teachers",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
export const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: { $in: ["teacher", "principal"] },
    }).populate("schoolId", "name address contact");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Teacher retrieved successfully",
      data: { teacher },
    });
  } catch (error) {
    console.error("Teacher Error - Get teacher by ID:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teacher",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update teacher profile
// @route   PUT /api/teachers/:id
// @access  Private
export const updateTeacher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Authorization check: can update own or admin only
    if (
      req.user._id.toString() !== teacher._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this teacher",
      });
    }

    const updateData = req.body;
    const allowedUpdates = ["name", "role", "phone"];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        teacher[field] = updateData[field];
      }
    });

    await teacher.save();

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: { teacher },
    });
  } catch (error) {
    console.error("Teacher Error - Update teacher:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update teacher",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/*---------Upload controller---------*/

export const getChaptersBySubjectAndClass = async (req, res) => {
  try {
    const { subject, classId } = req.query;

    const teacherId = req.user._id;
    const schoolId = req.user.schoolId;

    if (!subject || !classId) {
      return res.status(400).json({
        success: false,
        message: "Subject and classId are required parameters",
      });
    }

    // Find the class document to get the ObjectId
    const classDoc = await Class.findOne({ grade: classId });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: `Class with grade '${classId}' not found`,
      });
    }

    // Get all books for the subject and class with chapters
    const books = await Book.getChaptersBySubjectAndClass(
      schoolId,
      teacherId,
      subject,
      classDoc._id
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No processed books found for subject '${subject}' and class '${classId}'`,
      });
    }

    // Extract and combine all chapters from all books
    const allChapters = [];
    books.forEach((book) => {
      if (book.chapters && book.chapters.length > 0) {
        book.chapters.forEach((chapter) => {
          // Avoid duplicates by checking if chapter already exists
          const existingChapter = allChapters.find(
            (c) =>
              c.chapter_no === chapter.chapter_no &&
              c.chapter_title === chapter.chapter_title
          );
          if (!existingChapter) {
            allChapters.push({
              chapter_no: chapter.chapter_no,
              chapter_title: chapter.chapter_title,
              source_book: book.title,
              author: book.author,
            });
          }
        });
      }
    });

    // Sort chapters by chapter number
    allChapters.sort((a, b) => {
      const numA = parseInt(a.chapter_no) || 0;
      const numB = parseInt(b.chapter_no) || 0;
      return numA - numB;
    });

    res.status(200).json({
      success: true,
      subject,
      classId,
      totalBooks: books.length,
      chapters: allChapters,
    });
  } catch (error) {
    console.error("Teacher Error - Get chapters:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chapters",
      error: error.message,
    });
  }
};

export const teacherUploadBook = async (req, res) => {
  let tempFilePath;
  try {
    const { classId, subject, author, year, schoolId, teacherId, title } =
      req.body;

    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required." });
    }
    tempFilePath = req.file.path;
    const requiredFields = {
      classId,
      subject,
      author,
      year,
      schoolId,
      teacherId,
      title,
    };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        await fs.promises.unlink(req.file.path);
        return res
          .status(400)
          .json({ message: `${field} is a required field.` });
      }
    }

    const teacher = await User.findOne({
      firebaseUid: teacherId,
      //role: "teacher",
    });
    if (!teacher) {
      await fs.promises.unlink(req.file.path);
      return res
        .status(404)
        .json({ message: `Teacher with ID '${teacherId}' not found.` });
    }

    const classDoc = await Class.findOne({ grade: classId });
    if (!classDoc) {
      await fs.promises.unlink(req.file.path);
      return res
        .status(404)
        .json({ message: `Class with ID '${classId}' not found.` });
    }

    const duplicateBook = await Book.findOne({
      classId: classDoc._id,
      title: title,
      schoolId: schoolId,
      uploadedBy: teacher._id,
    });

    if (duplicateBook) {
      // Clean up orphaned file
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.error("Error deleting orphaned file:", err.message);
      }
      return res.status(409).json({
        success: false,
        message:
          "A book already exists for this class and subject in your school",
      });
    }
    const bookId = new mongoose.Types.ObjectId();
    const sanitizedTitle = title
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");
    const uniquePdfName = `${sanitizedTitle}_${bookId}.pdf`; // Result example: "Physics_Concept_Vol1_654321098765432109876543.pdf"

    let processingResult;
    try {
      const sendToProcessor = async (fieldName) => {
        const fileStream = fs.createReadStream(tempFilePath);
        const form = new FormData();
        const subjectData = {
          class: classId,
          subject: subject,
          pdf_name: uniquePdfName,
        };
        form.append("subject_data", JSON.stringify(subjectData));
        form.append(fieldName, fileStream, {
          filename: path.basename(uniquePdfName),
          contentType: "application/pdf",
        });

        return axios.post(deplyed_url + "process_pdf/", form, {
          headers: { ...form.getHeaders() },
          timeout: 15 * 60 * 1000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          validateStatus: (s) => s >= 200 && s < 500,
        });
      };

      let response = await sendToProcessor("file");
      if (response.status === 422) {
        response = await sendToProcessor("pdf");
      }
      processingResult = response.data || {};
    } catch (procErr) {
      console.error("PDF processing service error:", procErr.message);
      throw new Error("Could not connect to the book processing service.");
    }

    // --- 3. Conditionally Save Based on Processing Result ---
    const { status, chunks, chapters } = processingResult;

    if (status === "success" && Number.isFinite(chunks) && chunks > 0) {
      // SUCCESS: Processing worked, now we create the database record.
      const book = new Book({
        _id: bookId,
        schoolId,
        classId: classDoc._id,
        uploadedBy: teacher._id,
        title,
        subject,
        author,
        year,
        fileUrl: tempFilePath,
        processedStatus: "processed",
        noOfChunks: chunks,
        uniqueName: uniquePdfName,
        chapters: chapters && Array.isArray(chapters) ? chapters : [],
      });
      await book.save();

      // Send the final success response. The temporary file is now permanent.
      return res.status(201).json({
        success: true,
        message: "Book uploaded and processed successfully.",
        data: {
          // Send a smaller object
          _id: book._id,
          processedStatus: book.processedStatus,
          noOfChunks: book.noOfChunks,
        },
      });
    } else {
      // FAILURE: Processing failed.
      throw new Error(
        "Failed to extract content from the PDF. It may be empty or corrupted."
      );
    }
  } catch (error) {
    // --- 4. Centralized Error Handling & Cleanup ---
    if (tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch((err) => {
        if (err.code !== "ENOENT") {
          console.error("Error cleaning up failed upload file:", err.message);
        }
      });
    }

    //console.error("Teacher Error - Book upload:", error.message);

    if (!res.headersSent) {
      // Use the appropriate status code for the error type
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({
        message: error.message || "Failed to upload book.",
      });
    }
  }
};

export const getBooksByClassAndSubject = async (req, res) => {
  try {
    const { classId, subject, schoolId } = req.query;

    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (classId) query.classId = classId;
    if (subject)
      query.title = { $regex: subject.replace(/_/g, " "), $options: "i" };
    if (!classId && !subject) {
      return res.status(200).json({ success: true, data: [] });
    }

    const books = await Book.find(query)
      .populate("classId", "grade")
      .sort({ createdAt: -1 });

    /*if (!books.length) {
      return res.status(200).json({
        success: false,
        message: "No books found",
      });
    }*/

    res.status(200).json({
      success: true,
      data: books || [],
    });
  } catch (error) {
    console.error("Teacher Error - Get books:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
      error: error.message,
    });
  }
};

// Delete a book uploaded by the current teacher (or admin)
export const deleteTeacherBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!bookId) {
      return res
        .status(400)
        .json({ success: false, message: "bookId is required" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    // Ownership or admin check
    const isOwner = book.uploadedBy?.toString() === req.user?._id?.toString();
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete books you uploaded",
      });
    }

    // Try to remove file from disk if it exists
    try {
      if (book.fileUrl) {
        await fs.promises.unlink(book.fileUrl);
      }
    } catch (unlinkErr) {
      if (unlinkErr.code !== "ENOENT") {
        console.warn("Failed to delete file:", unlinkErr.message);
      }
    }

    await Book.findByIdAndDelete(bookId);

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully",
      data: { _id: bookId },
    });
  } catch (error) {
    console.error("Teacher Error - Delete book:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
};
// @desc    Get all books uploaded by the current teacher
// @route   GET /api/teachers/my-books
// @access  Private (Teacher)
export const getMyUploadedBooks = async (req, res) => {
  try {
    // req.user is populated by authenticateFirebaseToken and points to User collection
    const teacherUserId = req.user._id;

    const books = await Book.find({ uploadedBy: teacherUserId })
      .populate("classId", "grade division")
      .populate("schoolId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: books });
  } catch (error) {
    console.error("Teacher Error - Get my books:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve books uploaded by teacher",
      error: error.message,
    });
  }
};

// @desc    Get teacher assignments (classes and subjects)
// @route   GET /api/teachers/assignments
// @access  Private (Teacher)
export const getTeacherAssignments = async (req, res) => {
  try {
    const { schoolId, email } = req.query;

    if (!schoolId && !email) {
      return res.status(400).json({
        success: false,
        message: "Either schoolId or email must be provided",
      });
    }

    // Find the teacher by schoolId and/or email
    const teacherQuery = {
      role: { $in: ["teacher", "principal"] },
    };
    if (schoolId) teacherQuery.schoolId = schoolId;
    if (email) teacherQuery.email = email;

    const teacher = await User.findOne(teacherQuery);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Get teacher assignments with populated class and subject data
    const assignments = await TeacherClassSubject.find({
      teacherId: teacher._id,
    })
      .populate({
        path: "classId",
        select: "grade division schoolId",
        populate: {
          path: "schoolId",
          select: "name",
        },
      })
      .populate({
        path: "subjectId",
        select: "name subjectId schoolId",
        populate: {
          path: "schoolId",
          select: "name",
        },
      })
      .sort({ assignedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Teacher assignments retrieved successfully",
      data: {
        teacher: {
          // Include teacher info if needed elsewhere
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          schoolId: teacher.schoolId,
        },
        assignments: assignments.map((assignment) => ({
          // Optionally simplify structure
          _id: assignment._id,
          classId: assignment.classId
            ? {
                _id: assignment.classId._id,
                grade: assignment.classId.grade,
                division: assignment.classId.division,
                schoolName:
                  assignment.classId.schoolId?.name || "Unknown School",
              }
            : null,
          subjectId: assignment.subjectId
            ? {
                _id: assignment.subjectId._id,
                name: assignment.subjectId.name,
                subjectId: assignment.subjectId.subjectId, // The code like 'CS101'
                schoolName:
                  assignment.subjectId.schoolId?.name || "Unknown School",
              }
            : null,
          assignedAt: assignment.assignedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Teacher Error - Get teacher assignments:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teacher assignments",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Generate question paper with PDF data
// @route   POST /api/teachers/generate-question-paper
// @access  Private (Teacher)
export const generateQuestionPaper = async (req, res) => {
  try {
    // Accept new payload shape as-is; also support legacy pdf_name key
    const {
      class: classValue,
      subject,
      pdf_name: pdfName,
      numberofPapers = 1,
      duration,
      totalMarks, // <-- Get totalMarks from the body

      examType,
    } = req.body;

    if (!classValue || !subject || !pdfName) {
      return res.status(400).json({
        success: false,
        message: "Fields 'class', 'subject', and 'pdf_name' are required.",
      });
    }

    // Forward the entire body to the AI service (port 8000)
    const response = await axios.post(
      deplyed_url + "generate_question_paper/",
      { ...req.body, pdf_name: pdfName, numberofPapers: numberofPapers },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 5 * 60 * 1000,
        validateStatus: (status) => status >= 200 && status < 500,
      }
    );

    // ✅ ADD THIS LOG to see the raw response from the AI
    console.log(
      "RAW RESPONSE FROM AI SERVICE:",
      JSON.stringify(response.data, null, 2)
    );

    if (response.status !== 200) {
      console.log(response.data);
      return res.status(response.status).json({
        success: false,
        message: response.data?.message || "AI service error",
        error: response.data,
      });
    }

    // Expect AI returns the final paper JSON structure
    let aiPapersArray = response.data.question_paper;
    if (
      aiPapersArray &&
      typeof aiPapersArray === "object" &&
      !Array.isArray(aiPapersArray)
    ) {
      // If so, wrap it in an array to standardize the structure
      aiPapersArray = [aiPapersArray];
    }
    if (!Array.isArray(aiPapersArray) || aiPapersArray.length === 0) {
      return res.status(500).json({
        success: false,
        message: "AI service did not return a valid array of papers.",
      });
    }

    // Resolve teacher user, classId (by grade), subjectId (by name or subjectId), and schoolId
    const teacherUser = await User.findById(req.user?._id);

    // 1. Resolve School Name for College Name
    let resolvedSchoolName = "New High School"; // Default fallback
    if (teacherUser?.schoolId) {
      const school = await School.findById(teacherUser.schoolId);
      if (school) {
        resolvedSchoolName = school.name;
      }
    }

    // 2. Format Duration String
    let formattedDuration = "2 hours"; // Default fallback
    if (
      duration &&
      typeof duration.hours !== "undefined" &&
      typeof duration.minutes !== "undefined"
    ) {
      const { hours, minutes } = duration;
      const parts = [];
      if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
      if (parts.length > 0) formattedDuration = parts.join(" ");
    }
    // --- END: NEW DATA RESOLUTION LOGIC ---

    let resolvedClassId = undefined;
    let resolvedClassGrade = undefined;
    let resolvedSchoolId = teacherUser?.schoolId || undefined;
    if (classValue !== undefined && classValue !== null && classValue !== "") {
      const gradeNum = Number(classValue);
      const classDoc = Number.isFinite(gradeNum)
        ? await Class.findOne({ grade: gradeNum })
        : null;
      if (classDoc) {
        resolvedClassId = classDoc._id;
        resolvedClassGrade = String(classDoc.grade);
        if (!resolvedSchoolId) resolvedSchoolId = classDoc.schoolId;
      } else {
        // fallback: store provided value as classGrade string if class doc missing
        resolvedClassGrade = String(classValue);
      }
    }

    let resolvedSubjectId = undefined;
    let resolvedSubjectName = undefined;
    if (typeof subject === "string" && subject.trim().length > 0) {
      const subjName = subject.replace(/_/g, " ").trim();
      // Try to find by name within teacher's school, otherwise any
      let subjDoc = null;
      if (resolvedSchoolId) {
        subjDoc = await Subject.findOne({
          schoolId: resolvedSchoolId,
          name: new RegExp(`^${subjName}$`, "i"),
        });
      }
      if (!subjDoc) {
        subjDoc = await Subject.findOne({
          name: new RegExp(`^${subjName}$`, "i"),
        });
      }
      if (subjDoc) {
        resolvedSubjectId = subjDoc._id;
        resolvedSubjectName = subjDoc.name;
      } else {
        resolvedSubjectName = subjName;
      }
    }

    // Persist in database as a single document with resolved metadata
    const savedPapers = await Promise.all(
      aiPapersArray.map(async (aiPaper) => {
        // Create a new document for each paper in the array
        // --- START: MODIFIED finalPaper OBJECT ---
        // This object now intelligently combines AI output with reliable fallbacks
        const finalPaper = {
          ...aiPaper,
          collegeName: aiPaper.collegeName || resolvedSchoolName,
          maxMarks: aiPaper.maxMarks || totalMarks || 0,
          timeAllowed: aiPaper.timeAllowed || formattedDuration,
          instructions:
            aiPaper.instructions && aiPaper.instructions.length > 0
              ? aiPaper.instructions
              : [
                  "All questions are compulsory.",
                  "Read each question carefully.",
                ],
          date: aiPaper.date || new Date().toISOString().split("T")[0],
        };
        // --- END: MODIFIED finalPaper OBJECT ---

        const newPaper = await QuestionPaper.create({
          paper: finalPaper,
          title: pdfName || undefined,
          status: "draft",
          llmPrompt: req.body,
          createdBy: teacherUser?._id,
          schoolId: resolvedSchoolId,
          classId: resolvedClassId,
          classGrade: resolvedClassGrade,
          subjectId: resolvedSubjectId,
          subject: resolvedSubjectName,
          teacherEmail: teacherUser?.email,
          examType: examType || undefined,
        });
        return newPaper;
      })
    );

    return res.status(200).json({
      success: true,
      message: `${savedPapers.length} question paper(s) generated successfully`,
      generated_papers: savedPapers,
    });
  } catch (error) {
    console.error("Teacher Error - Question paper generation:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate question paper",
      error: error.message,
    });
  }
};

// @desc    Update an existing question paper's content
// @route   PUT /api/teachers/question-papers/:id
// @access  Private (Teacher or Admin, restricted to owner if creator is set)
// in teacherController.js

export const updateQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const incoming = req.body || {};

    // --- 1. Validate the incoming request ---
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Question paper ID is required" });
    }

    // Directly and reliably get the paper content from the 'paper' property
    const newPaperContent = incoming.paper;
    if (
      !newPaperContent ||
      typeof newPaperContent !== "object" ||
      !Array.isArray(newPaperContent.sections)
    ) {
      console.log(
        "Validation failed: The 'paper' object in the request body is missing or invalid."
      );
      return res
        .status(400)
        .json({ success: false, message: "Valid paper content is required" });
    }

    // --- 2. Verify the document exists and the user has permission ---
    const existingPaper = await QuestionPaper.findById(id);
    if (!existingPaper) {
      return res
        .status(404)
        .json({ success: false, message: "Question paper not found" });
    }
    const isOwner =
      existingPaper.createdBy?.toString() === req.user?._id?.toString();
    if (req.user?.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only edit papers you created",
      });
    }

    // --- 3. Build a complete payload with all changes ---
    const updatePayload = {
      paper: newPaperContent,
    };
    if (typeof incoming.title === "string") {
      updatePayload.title = incoming.title;
    }
    if (typeof incoming.status === "string") {
      updatePayload.status = incoming.status;
    }

    console.log(
      "Updating question paper with payload:",
      JSON.stringify(updatePayload, null, 2)
    );

    // --- 4. Use findByIdAndUpdate for a direct, atomic update ---
    const updatedPaper = await QuestionPaper.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true } // This option returns the updated document
    );

    if (!updatedPaper) {
      throw new Error(
        "Failed to find and update the document after validation."
      );
    }

    console.log("Question paper updated successfully");

    // --- 5. Return the NEW, updated document ---
    return res.status(200).json({
      success: true,
      message: "Question paper updated successfully",
      question_paper: updatedPaper.paper, // Send back the 'paper' field from the updated document
      id: updatedPaper._id,
    });
  } catch (error) {
    console.error("Teacher Error - Update question paper:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update question paper",
      error: error.message,
    });
  }
};

// @desc    Get question papers created by the authenticated teacher
// @route   GET /api/teachers/my-question-papers
// @access  Private (Teacher)
export const getMyQuestionPapers = async (req, res) => {
  try {
    const teacherId = req.user?._id;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const papers = await QuestionPaper.find({ createdBy: teacherId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ success: true, data: papers });
  } catch (error) {
    console.error("Teacher Error - Get my question papers:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve question papers",
      error: error.message,
    });
  }
};

// @desc    Get a single question paper by ID
// @route   GET /api/teachers/question-papers/:id
// @access  Private (Owner or Admin)
export const getQuestionPaperById = async (req, res) => {
  try {
    const { id } = req.params;
    const paper = await QuestionPaper.findById(id);

    if (!paper) {
      return res
        .status(404)
        .json({ success: false, message: "Question paper not found" });
    }

    // --- Authorization Check ---
    const isOwner = paper.createdBy?.toString() === req.user?._id?.toString();
    const isAdmin = req.user?.role === "principal";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this paper",
      });
    }

    return res.status(200).json({ success: true, data: paper });
  } catch (error) {
    console.error("Teacher Error - Get question paper by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve question paper",
      error: error.message,
    });
  }
};

export const deleteTeacherQuestionPaper = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No paper IDs provided" });
    }

    const deleted = [];

    for (const paperId of ids) {
      const paper = await QuestionPaper.findById(paperId);
      if (!paper) continue;

      const isOwner = paper.createdBy?.toString() === req.user?._id?.toString();
      const isAdmin = req.user?.role === "admin";

      if (isOwner || isAdmin) {
        await QuestionPaper.findByIdAndDelete(paperId);
        deleted.push(paperId);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${deleted.length} paper(s) deleted successfully.`,
      data: deleted,
    });
  } catch (error) {
    console.error("Delete paper error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete papers" });
  }
};

// @desc    Get students by class grade and division
// @route   GET /api/teachers/students-by-class
// @access  Private (Teacher)
export const getStudentsByClass = async (req, res) => {
  try {
    const { grade, division, rollNumber } = req.query;
    const schoolId = req.user.schoolId; // Get schoolId from the authenticated user

    // --- THIS IS THE FIX ---
    // We only require a 'grade'. 'division' and 'rollNumber' are optional.
    if (!grade) {
      return res
        .status(400)
        .json({ success: false, message: "Grade is required." });
    }

    // 1. Build the student query
    const studentQuery = {
      schoolId: schoolId,
      class: grade, // Match the 'class' field (e.g., "10")
    };

    // 2. Add optional filters
    if (division) {
      studentQuery.div = division; // Match the 'div' field (e.g., "A")
    }

    if (rollNumber) {
      const roll = parseInt(rollNumber);
      if (!isNaN(roll) && roll > 0) {
        studentQuery.rollNo = roll; // Match the 'rollNo' field (as a number)
      } else if (rollNumber.trim() !== "") {
        // Handle non-numeric roll numbers (like 'A-01') if they are strings
        studentQuery.rollNo = new RegExp(rollNumber.trim(), "i");
      }
    }
    // --- END OF FIX ---

    // 3. Find all students matching the query
    const students = await Student.find(studentQuery).sort({
      div: 1, // Sort by division first
      rollNo: 1, // Then by roll number
      name: 1,
    });

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error("Teacher Error - Get students by class:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message,
    });
  }
};

// @desc    Get question paper groups, filtered by criteria
// @route   GET /api/teachers/my-question-papers-grouped
// @access  Private (Teacher)
export const getFilteredQuestionPaperGroups = async (req, res) => {
  try {
    // --- MODIFIED: Removed examType and date ---
    const { classGrade, subject } = req.query;
    const teacherId = req.user._id;

    if (!classGrade || !subject) {
      return res.status(400).json({
        success: false,
        message: "Class and Subject are required to find papers.",
      });
    }

    // 1. Build the initial match filter
    const matchFilter = {
      createdBy: teacherId,
      classGrade: classGrade,
      subject: subject,
    };
    // --- MODIFIED: Removed examType and date filters ---

    const paperGroups = await QuestionPaper.aggregate([
      // 1. Match papers based on filters
      { $match: matchFilter },
      // 2. Sort by creation date (newest first)
      { $sort: { createdAt: -1 } },
      // 3. Add a field for grouping
      {
        $addFields: {
          roundedCreatedAt: {
            $dateTrunc: { date: "$createdAt", unit: "minute" },
          },
        },
      },
      // 4. Group by batchId or the fallback composite key
      {
        $group: {
          _id: {
            batchKey: {
              $ifNull: [
                "$generationBatchId",
                {
                  subject: "$subject",
                  class: "$classGrade",
                  time: "$roundedCreatedAt",
                },
              ],
            },
          },
          sets: { $sum: 1 },
          firstDoc: { $first: "$$ROOT" },
          papers: { $push: "$$ROOT" },
        },
      },
      // 5. Format the output
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$firstDoc",
              {
                sets: "$sets",
                papers: "$papers",
                _id: "$firstDoc._id",
                // Create a user-friendly title
                groupTitle: {
                  $concat: [
                    "$firstDoc.subject",
                    " - ",
                    "$firstDoc.examType",
                    " (",
                    { $toString: "$sets" },
                    " sets)",
                  ],
                },
              },
            ],
          },
        },
      },
      // 6. Sort the final groups
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({ success: true, data: paperGroups });
  } catch (error) {
    console.error("Teacher Error - Get filtered paper groups:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve question paper groups",
      error: error.message,
    });
  }
};

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
import { validationResult } from "express-validator";
import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import Book from "../models/BookSchema.js";
import TeacherClassSubject from "../models/TeacherClassSubject.js";

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
const deplyed_url = "https://suraj6708-eduai.hf.space/";

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
      role: "teacher",
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
  try {
    const { classId, subject, author, year, schoolId, teacherId, title } =
      req.body;

    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required." });
    }

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
      role: "teacher",
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

    const book = new Book({
      schoolId: schoolId,
      classId: classDoc._id,
      uploadedBy: teacher._id,
      title: title,
      subject: subject,
      author,
      year,
      fileUrl: req.file.path,
      processedStatus: "pending",
    });

    await book.save();

    try {
      const sendToProcessor = async (fieldName) => {
        const fileStream = fs.createReadStream(req.file.path);
        const form = new FormData();

        // Prepare subject data
        const subjectData = {
          class: classId,
          subject: subject,
          pdf_name: `${title}_${classId}_${subject}.pdf`,
        };

        // Add the subject data as JSON string
        form.append("subject_data", JSON.stringify(subjectData));

        // Add the file
        form.append(fieldName, fileStream, {
          filename: path.basename(req.file.path),
          contentType: "application/pdf",
        });

        const response = await axios.post(deplyed_url + "process_pdf/", form, {
          headers: { ...form.getHeaders() },
          timeout: 5 * 60 * 1000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          validateStatus: (s) => s >= 200 && s < 500,
        });
        return response;
      };

      let response = await sendToProcessor("file");
      if (response.status === 422) {
        response = await sendToProcessor("pdf");
      }

      const { status, chunks, chapters } = response.data || {};
      if (status === "success" && Number.isFinite(chunks)) {
        book.processedStatus = "processed";
        book.noOfChunks = chunks;
        // Store chapters if available
        if (chapters && Array.isArray(chapters)) {
          book.chapters = chapters;
        }
      } else {
        book.processedStatus = "failed";
      }
      await book.save();
    } catch (procErr) {
      console.error("PDF processing error:", procErr?.message || procErr);
      book.processedStatus = "failed";
      await book.save();
    }

    res.status(201).json({
      message: "Book uploaded successfully.",
      book,
    });
  } catch (error) {
    if (req.file && req.file.path) {
      try {
        await fs.promises.access(req.file.path);
        await fs.promises.unlink(req.file.path);
      } catch (cleanupErr) {
        if (cleanupErr.code !== "ENOENT") {
          console.error("Error during file cleanup:", cleanupErr.message);
        }
      }
    }
    console.error("Teacher Error - Book upload:", error.message);
    res.status(500).json({
      message: "Failed to upload book.",
      error: error.message,
    });
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
    const teacherQuery = { role: "teacher" };
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

    // Extract unique classes and subjects
    const classes = [];
    const subjects = [];
    const classMap = new Map();
    const subjectMap = new Map();

    assignments.forEach((assignment) => {
      if (
        assignment.classId &&
        !classMap.has(assignment.classId._id.toString())
      ) {
        classes.push({
          _id: assignment.classId._id,
          grade: assignment.classId.grade,
          division: assignment.classId.division,
          schoolName: assignment.classId.schoolId?.name || "Unknown School",
        });
        classMap.set(assignment.classId._id.toString(), true);
      }

      if (
        assignment.subjectId &&
        !subjectMap.has(assignment.subjectId._id.toString())
      ) {
        subjects.push({
          _id: assignment.subjectId._id,
          name: assignment.subjectId.name,
          subjectId: assignment.subjectId.subjectId,
          schoolName: assignment.subjectId.schoolId?.name || "Unknown School",
        });
        subjectMap.set(assignment.subjectId._id.toString(), true);
      }
    });

    res.status(200).json({
      success: true,
      message: "Teacher assignments retrieved successfully",
      data: {
        teacher: {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          schoolId: teacher.schoolId,
        },
        classes,
        subjects,
        assignments: assignments.map((assignment) => ({
          _id: assignment._id,
          class: assignment.classId
            ? {
                _id: assignment.classId._id,
                grade: assignment.classId.grade,
                division: assignment.classId.division,
              }
            : null,
          subject: assignment.subjectId
            ? {
                _id: assignment.subjectId._id,
                name: assignment.subjectId.name,
                subjectId: assignment.subjectId.subjectId,
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
    const body = req.body || {};
    const classValue = body.class; // could be grade as number/string
    const subject = body.subject; // could be subject name or id string
    const pdfName = body.pdf_name || body.pdf_name;

    console.log(body);

    if (!classValue || !subject || !pdfName) {
      return res.status(400).json({
        success: false,
        message: "Fields 'class', 'subject', and 'pdf_name' are required.",
      });
    }

    // Forward the entire body to the AI service (port 8000)
    const response = await axios.post(
      deplyed_url + "generate_question_paper/",
      { ...body, pdf_name: pdfName },
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
    let aiPapersArray = response.data;
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
        const newPaper = await QuestionPaper.create({
          paper: aiPaper,
          title: body.pdf_name || body.pdf_name || undefined,
          status: "draft",
          llmPrompt: body,
          createdBy: teacherUser?._id,
          schoolId: resolvedSchoolId,
          classId: resolvedClassId,
          classGrade: resolvedClassGrade,
          subjectId: resolvedSubjectId,
          subject: resolvedSubjectName,
          teacherEmail: teacherUser?.email,
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
export const updateQuestionPaper = async (req, res) => {
  try {
    console.log("---Received request to update question paper---");
    const { id } = req.params;

    console.log(`Question paper ID: ${id}`);
    console.log(`Request body: ${JSON.stringify(req.body)}`);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Question paper id is required" });
    }

    const existing = await QuestionPaper.findById(id);
    if (!existing) {
      console.log("Question paper not found");
      return res
        .status(404)
        .json({ success: false, message: "Question paper not found" });
    }
    console.log("Question paper found");

    const isAdmin = req.user?.role === "admin";
    const isOwner =
      existing.createdBy?.toString() === req.user?._id?.toString();
    if (!isAdmin && existing.createdBy && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only edit papers you created",
      });
    }

    // Accept either { paper: {...} } or the paper structure directly (with sections)
    const incoming = req.body || {};
    const newPaper = incoming.sections ? incoming : incoming.paper;
    if (!newPaper || typeof newPaper !== "object") {
      console.log("Invalid paper content");
      return res
        .status(400)
        .json({ success: false, message: "Valid paper content is required" });
    }

    existing.paper = newPaper;
    // Allow optional fields to be updated if provided
    if (typeof incoming.title === "string") existing.title = incoming.title;
    if (typeof incoming.status === "string") existing.status = incoming.status;
    existing.llmPrompt = existing.llmPrompt || null;

    console.log("Updating question paper...");

    existing.markModified("paper");
    await existing.save();

    console.log("Question paper updated successfully");

    return res.status(200).json({
      success: true,
      message: "Question paper updated successfully",
      question_paper: existing.paper,
      id: existing._id,
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

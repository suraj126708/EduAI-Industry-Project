import User from "../models/UserSchema.js"; // Changed from Teacher to User
import { validationResult } from "express-validator";
import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import Book from "../models/BookSchema.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import TeacherClassSubject from "../models/TeacherClassSubject.js";

// @desc    Get all teachers (Admin only)
// @route   GET /api/teachers
// @access  Private (Admin)
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
    console.error("Get all teachers error:", error);
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
    console.error("Get teacher by ID error:", error);
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
    console.error("Update teacher error:", error);
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
    console.error("Get chapters error:", error);
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

    console.log(req.body);

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
      // --- FIX: This block now correctly deletes the orphaned file ---
      try {
        await fs.promises.unlink(req.file.path);
        console.log(`Deleted orphaned duplicate file: ${req.file.path}`);
      } catch (err) {
        console.error(`Error deleting orphaned file ${req.file.path}:`, err);
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
        form.append(fieldName, fileStream, {
          filename: path.basename(req.file.path),
          contentType: "application/pdf",
        });
        const response = await axios.post(
          "http://127.0.0.1:8000/process_pdf/",
          form,
          {
            headers: { ...form.getHeaders() },
            timeout: 5 * 60 * 1000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: (s) => s >= 200 && s < 500,
          }
        );
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
        console.log(`Cleaned up file due to error: ${req.file.path}`);
      } catch (cleanupErr) {
        if (cleanupErr.code !== "ENOENT") {
          console.error(`Error during file cleanup:`, cleanupErr);
        }
      }
    }
    console.error("Book upload error:", error);
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
    console.error("Get books error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
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
    console.error("Get teacher assignments error:", error);
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
    const { class: classValue, subject, Pdf_name } = req.body;

    console.log("Question paper generation request:", req.body);

    // Validate required fields
    if (!classValue || !subject || !Pdf_name) {
      return res.status(400).json({
        success: false,
        message: "Class, subject, and PDF name are required fields.",
      });
    }

    // Prepare payload for external API
    const payload = {
      class: classValue,
      subject: subject,
      Pdf_name: Pdf_name,
    };

    console.log("Sending to external API:", payload);

    // Send to external question generation API
    const response = await axios.post(
      "http://127.0.0.1:8000/generate_question_paper/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5 * 60 * 1000, // 5 minutes timeout
        validateStatus: (status) => status >= 200 && status < 500,
      }
    );

    console.log("External API response status:", response.status);
    console.log("External API response data:", response.data);

    if (response.status === 200 && response.data.status === "success") {
      res.status(200).json({
        success: true,
        message: "Question paper generated successfully",
        data: response.data,
      });
    } else {
      res.status(response.status || 500).json({
        success: false,
        message: response.data?.message || "Failed to generate question paper",
        error: response.data,
      });
    }
  } catch (error) {
    console.error("Question paper generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate question paper",
      error: error.message,
    });
  }
};

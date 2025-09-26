import User from "../models/UserSchema.js"; // Changed from Teacher to User
import { validationResult } from "express-validator";
import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import Book from "../models/BookSchema.js";
import Class from "../models/Class.js";

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

export const teacherUploadBook = async (req, res) => {
  try {
    const { classId, subject, author, year, schoolId, teacherId } = req.body;

    // --- FIX: Improved Validation ---
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
    };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
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
      return res
        .status(404)
        .json({ message: `Teacher with ID '${teacherId}' not found.` });
    }

    const classDoc = await Class.findOne({ grade: classId }); // Assuming your Class model has a 'name' field like "01"
    if (!classDoc) {
      return res
        .status(404)
        .json({ message: `Class with ID '${classId}' not found.` });
    }
    // --- End of FIX ---

    const book = new Book({
      schoolId: schoolId,
      classId: classDoc._id, // Use the actual ObjectId from the found document
      uploadedBy: teacher._id,
      title: subject,
      author,
      year,
      fileUrl: req.file.path,
      processedStatus: "pending",
    });

    await book.save();

    // Send the uploaded PDF to external processor (with retry on field name)
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
            headers: {
              ...form.getHeaders(),
            },
            timeout: 5 * 60 * 1000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: (s) => s >= 200 && s < 500, // handle 422 gracefully
          }
        );
        return response;
      };

      // First try common field name 'file', then fallback to 'pdf' if needed
      let response = await sendToProcessor("file");
      if (response.status === 422) {
        response = await sendToProcessor("pdf");
      }

      const { status, chunks } = response.data || {};
      if (status === "success" && Number.isFinite(chunks)) {
        book.processedStatus = "processed";
        book.noOfChunks = chunks;
      } else if (response.status >= 200 && response.status < 300) {
        // 2xx but unexpected body
        book.processedStatus = "failed";
      } else {
        // non-2xx
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
    console.error("Book upload error:", error);
    res.status(500).json({
      message: "Failed to upload book.",
      error: error.message,
    });
  }
};

export const getBooksByClassAndSubject = async (req, res) => {
  try {
    const { classId, subject } = req.query;
    if (!classId && !subject) {
      return res.status(400).json({
        success: false,
        message: "At least one of classId or subject must be provided",
      });
    }

    const query = {};
    if (classId) query.classId = classId;
    if (subject) query.title = { $regex: subject, $options: "i" };

    const books = await Book.find(query).sort({ createdAt: -1 });

    if (!books.length) {
      return res.status(404).json({
        success: false,
        message: "No books found",
      });
    }

    res.status(200).json({
      success: true,
      data: books,
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

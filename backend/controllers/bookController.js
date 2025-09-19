// controllers/bookController.js
import Book from "../models/Book.js";
import BookSubjectClass from "../models/BookSubjectClass.js";
import VectorMetadataBook from "../models/VectorMetadataBook.js";
import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import School from "../models/School.js";
import Teacher from "../models/Teacher.js";
import { validationResult } from "express-validator";
import path from "path";
import fs from "fs";

// @desc    Upload book PDF
// @route   POST /api/books/upload
// @access  Private (Teacher/Admin)
export const uploadBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    const { classValue, subjectValue, title, author, year } = req.body;
    const uploadedBy = req.teacher._id;
    let schoolId = req.teacher.schoolId;

    // If teacher doesn't have a school, create a default one or use a hardcoded one
    if (!schoolId) {
      // For now, we'll create a default school for the teacher
      // In a real application, you might want to handle this differently
      const defaultSchool = await School.findOne({ name: "Default School" });
      if (!defaultSchool) {
        const newSchool = await School.create({
          name: "Default School",
          address: "Default Address",
          contact: "default@school.com",
        });
        schoolId = newSchool._id;

        // Update teacher with school
        req.teacher.schoolId = schoolId;
        await req.teacher.save();
      } else {
        schoolId = defaultSchool._id;
        req.teacher.schoolId = schoolId;
        await req.teacher.save();
      }
    }

    // Find or create class
    let classDoc = await Class.findOne({
      schoolId,
      name: `Class ${classValue}`,
    });

    if (!classDoc) {
      classDoc = await Class.create({
        schoolId,
        name: `Class ${classValue}`,
      });
    }

    // Find or create subject
    let subjectDoc = await Subject.findOne({
      schoolId,
      code: subjectValue,
    });

    if (!subjectDoc) {
      const subjectName =
        subjectValue.charAt(0).toUpperCase() +
        subjectValue.slice(1).replace("_", " ");
      subjectDoc = await Subject.create({
        schoolId,
        name: subjectName,
        code: subjectValue,
      });
    }

    // Generate file URL (in production, this would be a cloud storage URL)
    const fileUrl = `/uploads/${req.file.filename}`;

    // Create book document
    const book = await Book.create({
      schoolId,
      classId: classDoc._id,
      uploadedBy,
      title: title || `${subjectDoc.name} - Class ${classValue}`,
      author: author || "Unknown",
      year: year || new Date().getFullYear(),
      fileUrl,
      processedStatus: "pending",
    });

    // Create BookSubjectClass relationship
    await BookSubjectClass.create({
      bookId: book._id,
      subjectId: subjectDoc._id,
      classId: classDoc._id,
    });

    // Populate the response
    const populatedBook = await Book.findById(book._id)
      .populate("schoolId", "name")
      .populate("classId", "name")
      .populate("uploadedBy", "name email");

    res.status(201).json({
      success: true,
      message: "Book uploaded successfully",
      data: { book: populatedBook },
    });
  } catch (error) {
    console.error("Upload book error:", error);

    // Clean up uploaded file if book creation fails
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload book",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get all books
// @route   GET /api/books
// @access  Private
export const getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (req.query.status) filter.processedStatus = req.query.status;
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.schoolId) filter.schoolId = req.query.schoolId;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { author: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // If user is not admin, only show books from their school
    if (req.teacher.role !== "admin") {
      filter.schoolId = req.teacher.schoolId;
    }

    const books = await Book.find(filter)
      .populate("schoolId", "name")
      .populate("classId", "name")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBooks = await Book.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Books retrieved successfully",
      data: {
        books,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBooks / limit),
          totalBooks,
          hasNext: page < Math.ceil(totalBooks / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all books error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get book by ID
// @route   GET /api/books/:id
// @access  Private
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("schoolId", "name address contact")
      .populate("classId", "name")
      .populate("uploadedBy", "name email role");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if user can access this book (same school or admin)
    if (
      req.teacher.role !== "admin" &&
      book.schoolId._id.toString() !== req.teacher.schoolId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this book",
      });
    }

    // Get related subjects and classes
    const bookSubjectClasses = await BookSubjectClass.find({ bookId: book._id })
      .populate("subjectId", "name code")
      .populate("classId", "name");

    res.status(200).json({
      success: true,
      message: "Book retrieved successfully",
      data: {
        book,
        relatedSubjects: bookSubjectClasses.map((bsc) => ({
          subject: bsc.subjectId,
          class: bsc.classId,
        })),
      },
    });
  } catch (error) {
    console.error("Get book by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve book",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update book processing status
// @route   PUT /api/books/:id/status
// @access  Private (Admin/Teacher)
export const updateBookStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "processed", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pending', 'processed', or 'failed'",
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if user can update this book (same school or admin)
    if (
      req.teacher.role !== "admin" &&
      book.schoolId.toString() !== req.teacher.schoolId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this book",
      });
    }

    book.processedStatus = status;
    await book.save();

    res.status(200).json({
      success: true,
      message: "Book status updated successfully",
      data: { book },
    });
  } catch (error) {
    console.error("Update book status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update book status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin/Teacher)
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if user can delete this book (same school or admin)
    if (
      req.teacher.role !== "admin" &&
      book.schoolId.toString() !== req.teacher.schoolId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this book",
      });
    }

    // Delete associated BookSubjectClass records
    await BookSubjectClass.deleteMany({ bookId: book._id });

    // Delete associated VectorMetadataBook records
    await VectorMetadataBook.deleteMany({ bookId: book._id });

    // Delete the file from filesystem
    if (book.fileUrl) {
      const filePath = path.join(process.cwd(), book.fileUrl);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }

    // Delete the book
    await Book.findByIdAndDelete(book._id);

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete book error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete book",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get books by class and subject
// @route   GET /api/books/filter
// @access  Private
export const getBooksByFilter = async (req, res) => {
  try {
    const { classValue, subjectValue } = req.query;
    const schoolId = req.teacher.schoolId;

    // Find class and subject
    const classDoc = await Class.findOne({
      schoolId,
      name: `Class ${classValue}`,
    });

    const subjectDoc = await Subject.findOne({
      schoolId,
      code: subjectValue,
    });

    if (!classDoc || !subjectDoc) {
      return res.status(404).json({
        success: false,
        message: "Class or subject not found",
      });
    }

    // Find BookSubjectClass relationships
    const bookSubjectClasses = await BookSubjectClass.find({
      classId: classDoc._id,
      subjectId: subjectDoc._id,
    }).populate("bookId");

    const books = bookSubjectClasses
      .map((bsc) => bsc.bookId)
      .filter((book) => book);

    res.status(200).json({
      success: true,
      message: "Books retrieved successfully",
      data: { books },
    });
  } catch (error) {
    console.error("Get books by filter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

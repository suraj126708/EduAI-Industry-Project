// routes/bookRoutes.js
import express from "express";
import { body, param, query } from "express-validator";
import {
  uploadBook,
  getAllBooks,
  getBookById,
  updateBookStatus,
  deleteBook,
  getBooksByFilter,
} from "../controllers/bookController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";
import { pdfUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Validation middleware
const bookIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Book ID is required")
    .isMongoId()
    .withMessage("Invalid book ID format"),
];

const uploadBookValidation = [
  body("classValue")
    .notEmpty()
    .withMessage("Class is required")
    .matches(/^(0[1-9]|1[0-2])$/)
    .withMessage("Class must be between 01 and 12"),
  body("subjectValue")
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Subject must be between 1 and 50 characters"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("author")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Author must be between 1 and 100 characters"),
  body("year")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage("Year must be between 1900 and current year + 5"),
];

const updateStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "processed", "failed"])
    .withMessage("Status must be 'pending', 'processed', or 'failed'"),
];

const filterValidation = [
  query("classValue")
    .optional()
    .matches(/^(0[1-9]|1[0-2])$/)
    .withMessage("Class must be between 01 and 12"),
  query("subjectValue")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Subject must be between 1 and 50 characters"),
];

// @route   POST /api/books/upload
// @desc    Upload book PDF
// @access  Private (Teacher/Admin)
router.post(
  "/upload",
  authenticateFirebaseToken,
  authorize(["teacher", "admin"]),
  pdfUpload.single("pdf"),
  uploadBookValidation,
  uploadBook
);

// @route   GET /api/books
// @desc    Get all books
// @access  Private
router.get("/", authenticateFirebaseToken, getAllBooks);

// @route   GET /api/books/filter
// @desc    Get books by class and subject filter
// @access  Private
router.get(
  "/filter",
  authenticateFirebaseToken,
  filterValidation,
  getBooksByFilter
);

// @route   GET /api/books/:id
// @desc    Get book by ID
// @access  Private
router.get("/:id", authenticateFirebaseToken, bookIdValidation, getBookById);

// @route   PUT /api/books/:id/status
// @desc    Update book processing status
// @access  Private (Admin/Teacher)
router.put(
  "/:id/status",
  authenticateFirebaseToken,
  authorize(["teacher", "admin"]),
  bookIdValidation,
  updateStatusValidation,
  updateBookStatus
);

// @route   DELETE /api/books/:id
// @desc    Delete book
// @access  Private (Admin/Teacher)
router.delete(
  "/:id",
  authenticateFirebaseToken,
  authorize(["teacher", "admin"]),
  bookIdValidation,
  deleteBook
);

export default router;

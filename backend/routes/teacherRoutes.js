/**
 * Teacher Routes
 *
 * Handles all teacher-related endpoints including teacher management,
 * book uploads, question paper generation, and teacher assignments.
 *
 * @author Teacher Management System Team
 * @version 1.0.0
 */

import express from "express";
import { body, param } from "express-validator";
import {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  getTeacherAssignments,
  generateQuestionPaper,
  teacherUploadBook,
  getBooksByClassAndSubject,
  getChaptersBySubjectAndClass,
  deleteTeacherBook,
  getMyUploadedBooks,
  updateQuestionPaper,
  getMyQuestionPapers,
  getQuestionPaperById,
  deleteTeacherQuestionPaper,
} from "../controllers/teacherController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";
import { pdfUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Validation middleware
const teacherIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Teacher ID is required")
    .isMongoId()
    .withMessage("Invalid teacher ID format"),
];

const updateTeacherValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("role")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Role must be between 1 and 50 characters"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
];

// --- START OF ROUTE DEFINITIONS ---

// --- MOST SPECIFIC ROUTES FIRST ---

router.get("/", authenticateFirebaseToken, authorize("admin"), getAllTeachers);

router.get(
  "/assignments",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  getTeacherAssignments
);

router.get(
  "/fetch-books-metadata",
  authenticateFirebaseToken,
  authorize("teacher"),
  getBooksByClassAndSubject
);

router.get(
  "/chapters",
  authenticateFirebaseToken,
  authorize("teacher", "admin"),
  getChaptersBySubjectAndClass
);

router.get(
  "/my-books",
  authenticateFirebaseToken,
  authorize("teacher"),
  getMyUploadedBooks
);

router.get(
  "/my-question-papers",
  authenticateFirebaseToken,
  authorize("teacher"),
  getMyQuestionPapers
);

// --- ROUTES WITH PARAMETERS BUT MORE SPECIFIC THAN /:id ---

router.delete(
  "/books/:bookId",
  authenticateFirebaseToken,
  authorize("teacher", "admin"),
  deleteTeacherBook
);

router.get(
  "/question-papers/:id",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  getQuestionPaperById
);

router.put(
  "/question-papers/:id",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  updateQuestionPaper
);

router.delete(
  "/question-papers",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  deleteTeacherQuestionPaper
);

// --- FILE UPLOAD AND GENERATION ROUTES ---

router.post(
  "/upload-book",
  authenticateFirebaseToken,
  pdfUpload.single("pdf"),
  teacherUploadBook
);

router.post(
  "/generate-question-paper",
  authenticateFirebaseToken,
  // authorize(["teacher"]),
  generateQuestionPaper
);

// --- MOST GENERIC PARAMETERIZED ROUTES LAST ---

router.get(
  "/:id",
  authenticateFirebaseToken,
  teacherIdValidation,
  getTeacherById
);

router.put(
  "/:id",
  authenticateFirebaseToken,
  teacherIdValidation,
  updateTeacherValidation,
  updateTeacher
);

export default router;

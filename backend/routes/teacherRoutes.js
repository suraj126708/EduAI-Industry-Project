// routes/teacherRoutes.js
import express from "express";
import { body, param } from "express-validator";
import {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
} from "../controllers/teacherController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";

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

// @route   GET /api/teachers
// @desc    Get all teachers (Admin only)
// @access  Private (Admin)
router.get("/", authenticateFirebaseToken, authorize("admin"), getAllTeachers);

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID
// @access  Private
router.get(
  "/:id",
  authenticateFirebaseToken,
  teacherIdValidation,
  getTeacherById
);

// @route   PUT /api/teachers/:id
// @desc    Update teacher profile
// @access  Private
router.put(
  "/:id",
  authenticateFirebaseToken,
  teacherIdValidation,
  updateTeacherValidation,
  updateTeacher
);

export default router;

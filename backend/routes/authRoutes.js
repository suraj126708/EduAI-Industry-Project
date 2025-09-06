// routes/authRoutes.js
import express from "express";
import { body } from "express-validator";
import {
  registerTeacher,
  getTeacherProfile,
  updateTeacherProfile,
  deleteTeacherAccount,
  verifyToken,
  createCustomToken,
} from "../controllers/authController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Validation middleware
const profileValidation = [
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
  body("schoolId")
    .optional()
    .isMongoId()
    .withMessage("Please provide a valid school ID"),
];

const updateProfileValidation = [
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

const customTokenValidation = [
  body("uid").notEmpty().withMessage("UID is required"),
  body("additionalClaims")
    .optional()
    .isObject()
    .withMessage("Additional claims must be an object"),
];

// @route   GET /api/auth/verify
// @desc    Verify Firebase token
// @access  Private
router.get("/verify", authenticateFirebaseToken, verifyToken);

// @route   POST /api/auth/register
// @desc    Complete teacher registration with additional profile data
// @access  Private
router.post(
  "/register",
  authenticateFirebaseToken,
  profileValidation,
  registerTeacher
);

// @route   GET /api/auth/profile
// @desc    Get current teacher profile
// @access  Private
router.get("/profile", authenticateFirebaseToken, getTeacherProfile);

// @route   PUT /api/auth/profile
// @desc    Update current teacher profile
// @access  Private
router.put(
  "/profile",
  authenticateFirebaseToken,
  updateProfileValidation,
  updateTeacherProfile
);

// @route   DELETE /api/auth/account
// @desc    Delete current teacher account
// @access  Private
router.delete("/account", authenticateFirebaseToken, deleteTeacherAccount);

// @route   POST /api/auth/custom-token
// @desc    Create custom Firebase token (Admin only)
// @access  Private (Admin)
router.post(
  "/custom-token",
  authenticateFirebaseToken,
  authorize("admin"),
  customTokenValidation,
  createCustomToken
);

export default router;

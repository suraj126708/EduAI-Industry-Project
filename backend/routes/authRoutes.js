// routes/authRoutes.js
import express from "express";
import { body } from "express-validator";
import {
  registerUser,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
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
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters"),
  body("preferences.theme")
    .optional()
    .isIn(["light", "dark", "auto"])
    .withMessage("Theme must be light, dark, or auto"),
];

const updateProfileValidation = [
  body("displayName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Display name must be between 1 and 100 characters"),
  body("profile.firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("profile.lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("profile.phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("profile.bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters"),
  body("profile.dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth"),
  body("profile.location")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Location must not exceed 100 characters"),
  body("preferences.theme")
    .optional()
    .isIn(["light", "dark", "auto"])
    .withMessage("Theme must be light, dark, or auto"),
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
// @desc    Complete user registration with additional profile data
// @access  Private
router.post(
  "/register",
  authenticateFirebaseToken,
  profileValidation,
  registerUser
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", authenticateFirebaseToken, getUserProfile);

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private
router.put(
  "/profile",
  authenticateFirebaseToken,
  updateProfileValidation,
  updateUserProfile
);

// @route   DELETE /api/auth/account
// @desc    Delete current user account
// @access  Private
router.delete("/account", authenticateFirebaseToken, deleteUserAccount);

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

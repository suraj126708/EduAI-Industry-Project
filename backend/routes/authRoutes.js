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

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify Firebase token
 *     description: Verify the Firebase authentication token and return user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token verified successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/verify", authenticateFirebaseToken, verifyToken);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Complete teacher registration
 *     description: Complete teacher registration with additional profile data after Firebase authentication
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 minLength: 1
 *                 maxLength: 100
 *               role:
 *                 type: string
 *                 example: "teacher"
 *                 minLength: 1
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               schoolId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Teacher registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Teacher registered successfully"
 *                 teacher:
 *                   $ref: '#/components/schemas/Teacher'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/register",
  authenticateFirebaseToken,
  profileValidation,
  registerTeacher
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current teacher profile
 *     description: Retrieve the profile information of the currently authenticated teacher
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 teacher:
 *                   $ref: '#/components/schemas/Teacher'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/profile", authenticateFirebaseToken, getTeacherProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update current teacher profile
 *     description: Update the profile information of the currently authenticated teacher
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 minLength: 1
 *                 maxLength: 100
 *               role:
 *                 type: string
 *                 example: "teacher"
 *                 minLength: 1
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 teacher:
 *                   $ref: '#/components/schemas/Teacher'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/profile",
  authenticateFirebaseToken,
  updateProfileValidation,
  updateTeacherProfile
);

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Delete current teacher account
 *     description: Permanently delete the account of the currently authenticated teacher
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/account", authenticateFirebaseToken, deleteTeacherAccount);

/**
 * @swagger
 * /api/auth/custom-token:
 *   post:
 *     summary: Create custom Firebase token
 *     description: Create a custom Firebase token for a user (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *             properties:
 *               uid:
 *                 type: string
 *                 example: "user123"
 *                 description: "Firebase UID of the user"
 *               additionalClaims:
 *                 type: object
 *                 example: { role: "teacher" }
 *                 description: "Additional custom claims to include in the token"
 *     responses:
 *       200:
 *         description: Custom token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Custom token created successfully"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/custom-token",
  authenticateFirebaseToken,
  authorize("admin"),
  customTokenValidation,
  createCustomToken
);

export default router;

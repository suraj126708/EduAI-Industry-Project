// routes/teacherRoutes.js
import express from "express";
import { body, param } from "express-validator";
import {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  getTeacherAssignments,
  generateQuestionPaper,
} from "../controllers/teacherController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";

import { pdfUpload } from "../middleware/uploadMiddleware.js";
import {
  teacherUploadBook,
  getBooksByClassAndSubject,
} from "../controllers/teacherController.js";

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

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: Get all teachers
 *     description: Retrieve a list of all teachers (Admin only)
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teachers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 teachers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Teacher'
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
router.get("/", authenticateFirebaseToken, authorize("admin"), getAllTeachers);

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Get teacher by ID
 *     description: Retrieve a specific teacher by their ID
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         description: MongoDB ObjectId of the teacher
 *     responses:
 *       200:
 *         description: Teacher retrieved successfully
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
 *       400:
 *         description: Invalid teacher ID
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
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/teachers/assignments:
 *   get:
 *     summary: Get teacher assignments (classes and subjects)
 *     description: Retrieve classes and subjects assigned to a teacher
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *         description: School ID to filter by
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Teacher email to filter by
 *     responses:
 *       200:
 *         description: Teacher assignments retrieved successfully
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
 *                   example: "Teacher assignments retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     teacher:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         schoolId:
 *                           type: string
 *                     classes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           grade:
 *                             type: number
 *                           division:
 *                             type: string
 *                           schoolName:
 *                             type: string
 *                     subjects:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           subjectId:
 *                             type: string
 *                           schoolName:
 *                             type: string
 *                     assignments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           class:
 *                             type: object
 *                           subject:
 *                             type: object
 *                           assignedAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Bad request - missing required parameters
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
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/assignments",
  authenticateFirebaseToken,
  authorize("teacher"),
  getTeacherAssignments
);

router.get(
  "/fetch-books-metadata",
  authenticateFirebaseToken,
  authorize("teacher"),
  getBooksByClassAndSubject
);

router.get(
  "/:id",
  authenticateFirebaseToken,
  teacherIdValidation,
  getTeacherById
);

/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     summary: Update teacher profile
 *     description: Update the profile information of a specific teacher
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         description: MongoDB ObjectId of the teacher
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
 *         description: Teacher updated successfully
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
 *                   example: "Teacher updated successfully"
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
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id",
  authenticateFirebaseToken,
  teacherIdValidation,
  updateTeacherValidation,
  updateTeacher
);

/*----------- Teachers Routes --------------- */
router.post(
  "/upload-book",
  authenticateFirebaseToken,
  teacherIdValidation,
  pdfUpload.single("pdf"),
  teacherUploadBook
);

// Generate question paper endpoint
router.post(
  "/generate-question-paper",
  authenticateFirebaseToken,
  authorize(["teacher"]),
  generateQuestionPaper
);

export default router;

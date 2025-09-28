/**
 * Admin Routes
 *
 * Handles all administrative endpoints including user management,
 * system statistics, school management, and bulk operations.
 *
 * @author Teacher Management System Team
 * @version 1.0.0
 */

import express from "express";
import { body, param } from "express-validator";
import {
  getAdminDashboard,
  getSystemStats,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  updateTeacherRole,
  updateTeacherStatus,
  deleteTeacher,
  demoteFromAdmin,
  bulkUpdateTeachers,
  exportTeachers,
  getStudentsByClassDivision,
  uploadStudentExcel,
  bulkPromoteStudents,
  dedupeStudents,
  createSchool,
  addOrUpdateClass,
  deleteClass,
  addOrUpdateSubject,
  deleteSubject,
  assignTeacher,
  removeAssignment,
  getAssignments,
  getSchools,
  getClasses,
  getSubjects,
  createTeacher,
} from "../controllers/adminController.js";
import {
  authenticateFirebaseToken,
  authorize,
  checkPermissions,
  authorizeMultiple,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Validation middleware
const teacherIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Teacher ID is required")
    .isMongoId()
    .withMessage("Invalid teacher ID format"),
];

const roleValidation = [
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["teacher", "admin", "moderator", "editor"])
    .withMessage("Role must be teacher, admin, moderator, or editor"),
];

const statusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Status must be active, inactive, or suspended"),
];

const bulkTeacherValidation = [
  body("teacherIds")
    .isArray({ min: 1 })
    .withMessage("Teacher IDs must be a non-empty array"),
  body("updates").isObject().withMessage("Updates must be an object"),
];

// 🔥 RBAC Protected Routes

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     description: Retrieve comprehensive dashboard data for admin users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     totalTeachers:
 *                       type: integer
 *                       example: 150
 *                     totalStudents:
 *                       type: integer
 *                       example: 2500
 *                     totalBooks:
 *                       type: integer
 *                       example: 300
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
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
router.get(
  "/dashboard",
  authenticateFirebaseToken,
  authorize("admin"),
  getAdminDashboard
);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Retrieve detailed system statistics and metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 150
 *                         active:
 *                           type: integer
 *                           example: 145
 *                         inactive:
 *                           type: integer
 *                           example: 5
 *                     books:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 300
 *                         processed:
 *                           type: integer
 *                           example: 280
 *                         pending:
 *                           type: integer
 *                           example: 20
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
router.get(
  "/stats",
  authenticateFirebaseToken,
  authorize("admin"),
  getSystemStats
);

/**
 * @swagger
 * /api/admin/teachers:
 *   get:
 *     summary: Get all teachers with pagination
 *     description: Retrieve all teachers with pagination and filtering options (Admin/Moderator)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 10
 *         description: Number of teachers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "john"
 *         description: Search term for teacher name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [teacher, admin, moderator, editor]
 *           example: "teacher"
 *         description: Filter by teacher role
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 15
 *                     totalTeachers:
 *                       type: integer
 *                       example: 150
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/teachers",
  authenticateFirebaseToken,
  authorizeMultiple({
    admin: true,
    moderator: ["read"],
  }),
  getAllTeachers
);

// @route POST /api/admin/teachers
// @desc Create teacher
// @access Private (Admin)
router.post(
  "/teachers",
  authenticateFirebaseToken,
  authorize("admin"),
  createTeacher
);

// @route   GET /api/admin/teachers/:id
// @desc    Get teacher by ID
// @access  Private (Admin, Moderator)
router.get(
  "/teachers/:id",
  authenticateFirebaseToken,
  authorize("admin", "moderator"),
  teacherIdValidation,
  getTeacherById
);

// @route   PUT /api/admin/teachers/:id/role
// @desc    Update teacher role (Admin only)
// @access  Private (Admin)
router.put(
  "/teachers/:id/role",
  authenticateFirebaseToken,
  checkPermissions("manage_roles"),
  teacherIdValidation,
  roleValidation,
  updateTeacherRole
);

// @route   PUT /api/admin/teachers/:id
// @desc    Update teacher (general update)
// @access  Private (Admin)
router.put(
  "/teachers/:id",
  authenticateFirebaseToken,
  authorize("admin"),
  teacherIdValidation,
  updateTeacher
);

// @route   PUT /api/admin/teachers/:id/status
// @desc    Update teacher status
// @access  Private (Admin, Moderator with manage_users permission)
router.put(
  "/teachers/:id/status",
  authenticateFirebaseToken,
  authorizeMultiple({
    admin: true,
    moderator: ["manage_users"],
  }),
  teacherIdValidation,
  statusValidation,
  updateTeacherStatus
);

// @route   POST /api/admin/teachers/:id/demote
// @desc    Demote admin to teacher (Super Admin only)
// @access  Private (Admin with manage_roles permission)
router.post(
  "/teachers/:id/demote",
  authenticateFirebaseToken,
  checkPermissions("manage_roles"),
  teacherIdValidation,
  demoteFromAdmin
);

// @route   POST /api/admin/teachers/bulk-update
// @desc    Bulk update teachers (Admin only)
// @access  Private (Admin)
router.post(
  "/teachers/bulk-update",
  authenticateFirebaseToken,
  authorize("admin"),
  bulkTeacherValidation,
  bulkUpdateTeachers
);

// @route   GET /api/admin/teachers/export
// @desc    Export teachers data (Admin only)
// @access  Private (Admin)
router.get(
  "/teachers/export",
  authenticateFirebaseToken,
  authorize("admin"),
  exportTeachers
);

// @route   DELETE /api/admin/teachers/:id
// @desc    Delete teacher (Admin only)
// @access  Private (Admin)
router.delete(
  "/teachers/:id",
  authenticateFirebaseToken,
  authorize("admin"),
  teacherIdValidation,
  deleteTeacher
);

// Students routes

// Get students filtered by class & division
router.get(
  "/students",
  authenticateFirebaseToken,
  authorize("admin"),
  async (req, res, next) => {
    // Simple validation
    if (!req.query.class || !req.query.div) {
      return res
        .status(400)
        .json({ success: false, message: "class and div are required" });
    }
    next();
  },
  getStudentsByClassDivision
);

// Upload student details via Excel (file in form-data under 'file' key)
router.post(
  "/students/uploads",
  authenticateFirebaseToken,
  authorize("admin"),
  upload.single("file"),
  uploadStudentExcel
);

// Bulk promote students (e.g., after academic year)
router.put(
  "/students/promote",
  authenticateFirebaseToken,
  authorize("admin"),
  async (req, res, next) => {
    const { fromClass, toClass, div } = req.body;
    if (!fromClass || !toClass || !div) {
      return res.status(400).json({
        success: false,
        message: "fromClass, toClass and div are required",
      });
    }
    next();
  },
  bulkPromoteStudents
);

// Deduplicate students (admin maintenance)
router.post(
  "/students/dedupe",
  authenticateFirebaseToken,
  authorize("admin"),
  dedupeStudents
);

/*--------------New Routes added here-----------*/
// Schools
router.post(
  "/schools",
  authenticateFirebaseToken,
  authorize("admin"),
  createSchool
);

router.get(
  "/schools",
  authenticateFirebaseToken,
  authorize("admin"),
  getSchools
);

// Classes
router.post(
  "/classes",
  authenticateFirebaseToken,
  authorize("admin"),
  addOrUpdateClass
);

router.get(
  "/classes",
  authenticateFirebaseToken,
  authorize("admin", "teacher"),
  getClasses
);

router.delete(
  "/classes/:classId",
  authenticateFirebaseToken,
  authorize("admin"),
  deleteClass
);

// Subjects
router.post(
  "/subjects",
  authenticateFirebaseToken,
  authorize("admin"),
  addOrUpdateSubject
);

router.get(
  "/subjects",
  authenticateFirebaseToken,
  authorize("admin", "teacher"),
  getSubjects
);

router.delete(
  "/subjects/:subjectId",
  authenticateFirebaseToken,
  authorize("admin"),
  deleteSubject
);

// Teacher assignments to class + subject
router.get(
  "/assignments",
  authenticateFirebaseToken,
  authorize("admin"),
  getAssignments
);

router.post(
  "/assignments",
  authenticateFirebaseToken,
  authorize("admin"),
  assignTeacher
);

router.delete(
  "/assignments/:assignmentId",
  authenticateFirebaseToken,
  authorize("admin"),
  removeAssignment
);

export default router;

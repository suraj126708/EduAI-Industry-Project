// Enhanced routes with RBAC - routes/adminRoutes.js
import express from "express";
import { body, param } from "express-validator";
import {
  getAdminDashboard,
  getSystemStats,
  getAllTeachers,
  getTeacherById,
  updateTeacherRole,
  updateTeacherStatus,
  deleteTeacher,
  demoteFromAdmin,
  bulkUpdateTeachers,
  exportTeachers,
  getStudentsByClassDivision,
  uploadStudentExcel,
  downloadStudentExcel,
} from "../controllers/adminController.js";
import {
  authenticateFirebaseToken,
  authorize,
  checkPermissions,
  authorizeMultiple,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/multerMiddleware.js";

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

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get(
  "/dashboard",
  authenticateFirebaseToken,
  authorize("admin"),
  getAdminDashboard
);

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private (Admin)
router.get(
  "/stats",
  authenticateFirebaseToken,
  authorize("admin"),
  getSystemStats
);

// @route   GET /api/admin/teachers
// @desc    Get all teachers with pagination and filtering
// @access  Private (Admin, Moderator with read permission)
router.get(
  "/teachers",
  authenticateFirebaseToken,
  authorizeMultiple({
    admin: true,
    moderator: ["read"],
  }),
  getAllTeachers
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
  "/students/upload",
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

export default router;

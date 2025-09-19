// controllers/adminController.js
import Teacher from "../models/Teacher.js";
import School from "../models/School.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";
import { validationResult } from "express-validator";
import admin from "../config/firebase.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getAdminDashboard = async (req, res) => {
  try {
    // Get teacher statistics
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: "active" });
    const inactiveTeachers = await Teacher.countDocuments({
      status: "inactive",
    });
    const suspendedTeachers = await Teacher.countDocuments({
      status: "suspended",
    });

    // Get role statistics
    const teacherCount = await Teacher.countDocuments({ role: "teacher" });
    const moderatorCount = await Teacher.countDocuments({ role: "moderator" });
    const adminCount = await Teacher.countDocuments({ role: "admin" });

    // Get school statistics
    const totalSchools = await School.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalSubjects = await Subject.countDocuments();

    // Get recent activity
    const recentTeachers = await Teacher.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("email name role status createdAt");

    const recentlyActiveTeachers = await Teacher.find()
      .sort({ lastLoginAt: -1 })
      .limit(5)
      .select("email name role lastLoginAt");

    // Get monthly teacher growth
    const currentDate = new Date();
    const lastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const thisMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const teachersThisMonth = await Teacher.countDocuments({
      createdAt: { $gte: thisMonth },
    });

    const teachersLastMonth = await Teacher.countDocuments({
      createdAt: { $gte: lastMonth, $lt: thisMonth },
    });

    res.status(200).json({
      success: true,
      message: "Admin dashboard data retrieved successfully",
      data: {
        statistics: {
          totalTeachers,
          activeTeachers,
          inactiveTeachers,
          suspendedTeachers,
          teacherCount,
          moderatorCount,
          adminCount,
          totalSchools,
          totalClasses,
          totalSubjects,
          teachersThisMonth,
          teachersLastMonth,
          growthRate:
            teachersLastMonth > 0
              ? (
                  ((teachersThisMonth - teachersLastMonth) /
                    teachersLastMonth) *
                  100
                ).toFixed(2)
              : 0,
        },
        recentActivity: {
          newTeachers: recentTeachers,
          activeTeachers: recentlyActiveTeachers,
        },
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve admin dashboard data",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getSystemStats = async (req, res) => {
  try {
    const stats = await Teacher.aggregate([
      {
        $group: {
          _id: null,
          totalTeachers: { $sum: 1 },
          activeTeachers: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
        },
      },
    ]);

    const roleStats = await Teacher.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = await Teacher.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "System statistics retrieved successfully",
      data: {
        overview: stats[0] || {
          totalTeachers: 0,
          activeTeachers: 0,
        },
        roles: roleStats,
        statuses: statusStats,
      },
    });
  } catch (error) {
    console.error("System stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve system statistics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get all teachers with advanced filtering (Admin only)
// @route   GET /api/admin/teachers
// @access  Private (Admin)
export const getAllTeachers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.schoolId) filter.schoolId = req.query.schoolId;
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: "i" } },
        { name: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Build sort query
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const teachers = await Teacher.find(filter)
      .populate("schoolId", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalTeachers = await Teacher.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Teachers retrieved successfully",
      data: {
        teachers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTeachers / limit),
          totalTeachers,
          hasNext: page < Math.ceil(totalTeachers / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all teachers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teachers",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get teacher by ID (Admin only)
// @route   GET /api/admin/teachers/:id
// @access  Private (Admin)
export const getTeacherById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const teacher = await Teacher.findById(req.params.id).populate(
      "schoolId",
      "name address contact"
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Teacher retrieved successfully",
      data: { teacher },
    });
  } catch (error) {
    console.error("Get teacher by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teacher",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update teacher role (Admin only)
// @route   PUT /api/admin/teachers/:id/role
// @access  Private (Admin)
export const updateTeacherRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { role, reason } = req.body;
    const teacherId = req.params.id;

    // Prevent admin from changing their own role
    if (teacherId === req.teacher._id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const oldRole = teacher.role;
    teacher.role = role;

    // Update Firebase custom claims if needed
    try {
      await admin.auth().setCustomUserClaims(teacher.firebaseUid, {
        role: role,
        updatedBy: req.teacher._id,
        updatedAt: new Date().toISOString(),
      });
    } catch (firebaseError) {
      console.error("Firebase custom claims update error:", firebaseError);
      // Continue with database update even if Firebase fails
    }

    await teacher.save();

    console.log(
      `🔧 Admin ${req.teacher.email} changed teacher ${teacher.email} role from ${oldRole} to ${role}`
    );

    res.status(200).json({
      success: true,
      message: "Teacher role updated successfully",
      data: {
        teacher: {
          _id: teacher._id,
          email: teacher.email,
          role: teacher.role,
          oldRole,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Update teacher role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update teacher role",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update teacher status (Admin only)
// @route   PUT /api/admin/teachers/:id/status
// @access  Private (Admin)
export const updateTeacherStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { status, reason } = req.body;
    const teacherId = req.params.id;

    // Prevent admin from changing their own status
    if (teacherId === req.teacher._id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own status",
      });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const oldStatus = teacher.status;
    teacher.status = status;

    await teacher.save();

    console.log(
      `🔧 Admin ${req.teacher.email} changed teacher ${teacher.email} status from ${oldStatus} to ${status}`
    );

    res.status(200).json({
      success: true,
      message: "Teacher status updated successfully",
      data: {
        teacher: {
          _id: teacher._id,
          email: teacher.email,
          status: teacher.status,
          oldStatus,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Update teacher status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update teacher status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Delete teacher (Admin only)
// @route   DELETE /api/admin/teachers/:id
// @access  Private (Admin)
export const deleteTeacher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const teacherId = req.params.id;

    // Prevent admin from deleting themselves
    if (teacherId === req.teacher._id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Delete from Firebase (optional - you might want to keep Firebase user)
    try {
      await admin.auth().deleteUser(teacher.firebaseUid);
    } catch (firebaseError) {
      console.error("Firebase teacher deletion error:", firebaseError);
      // Continue with database deletion even if Firebase fails
    }

    await Teacher.findByIdAndDelete(teacherId);

    console.log(
      `🗑️ Admin ${req.teacher.email} deleted teacher ${teacher.email}`
    );

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
      data: {
        deletedTeacher: {
          _id: teacher._id,
          email: teacher.email,
        },
      },
    });
  } catch (error) {
    console.error("Delete teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete teacher",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Bulk update teachers (Admin only)
// @route   POST /api/admin/teachers/bulk-update
// @access  Private (Admin)
export const bulkUpdateTeachers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { teacherIds, updates } = req.body;

    // Remove sensitive fields that shouldn't be bulk updated
    const safeUpdates = { ...updates };
    delete safeUpdates._id;
    delete safeUpdates.firebaseUid;
    delete safeUpdates.email;

    const result = await Teacher.updateMany(
      { _id: { $in: teacherIds } },
      { $set: safeUpdates }
    );

    console.log(
      `🔧 Admin ${req.teacher.email} bulk updated ${result.modifiedCount} teachers`
    );

    res.status(200).json({
      success: true,
      message: "Bulk update completed successfully",
      data: {
        updatedCount: result.modifiedCount,
        totalRequested: teacherIds.length,
      },
    });
  } catch (error) {
    console.error("Bulk update teachers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update teachers",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Export teachers data (Admin only)
// @route   GET /api/admin/teachers/export
// @access  Private (Admin)
export const exportTeachers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { format = "json", role, status, schoolId } = req.query;

    // Build filter query
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (schoolId) filter.schoolId = schoolId;

    const teachers = await Teacher.find(filter)
      .populate("schoolId", "name")
      .sort({ createdAt: -1 });

    if (format === "csv") {
      // Convert to CSV format
      const csvHeaders =
        "Email,Name,Role,Status,School,Created At,Last Login\n";
      const csvData = teachers
        .map(
          (teacher) =>
            `"${teacher.email}","${teacher.name || ""}","${teacher.role}","${
              teacher.status
            }","${teacher.schoolId?.name || ""}","${teacher.createdAt}","${
              teacher.lastLoginAt
            }"`
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=teachers-export.csv"
      );
      res.send(csvHeaders + csvData);
    } else {
      // JSON format
      res.status(200).json({
        success: true,
        message: "Teachers exported successfully",
        data: {
          format: "json",
          totalTeachers: teachers.length,
          teachers,
        },
      });
    }
  } catch (error) {
    console.error("Export teachers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export teachers",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Demote teacher from admin (Admin only)
// @route   POST /api/admin/teachers/:id/demote
// @access  Private (Admin)
export const demoteFromAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const teacherId = req.params.id;
    const { role: newRole = "moderator", reason } = req.body;

    // Prevent admin from demoting themselves
    if (teacherId === req.teacher._id) {
      return res.status(400).json({
        success: false,
        message: "You cannot demote your own admin privileges",
      });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    if (teacher.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Target teacher is not an admin",
      });
    }

    // Ensure we don't remove the last admin
    const adminCount = await Teacher.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot demote the last remaining admin",
      });
    }

    const oldRole = teacher.role;
    teacher.role = newRole;

    // Update Firebase custom claims (best-effort)
    try {
      await admin.auth().setCustomUserClaims(teacher.firebaseUid, {
        role: newRole,
        updatedBy: req.teacher._id,
        updatedAt: new Date().toISOString(),
      });
    } catch (firebaseError) {
      console.error("Firebase custom claims update error:", firebaseError);
      // Continue even if Firebase update fails
    }

    await teacher.save();

    console.log(
      `🔧 Admin ${req.teacher.email} demoted teacher ${teacher.email} from ${oldRole} to ${newRole}`
    );

    res.status(200).json({
      success: true,
      message: "Teacher demoted successfully",
      data: {
        teacher: {
          _id: teacher._id,
          email: teacher.email,
          oldRole,
          role: teacher.role,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Demote from admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to demote teacher from admin",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get students by class and division
// @route   GET /api/admin/students
// @access  Private (Admin)
export const getStudentsByClassDivision = async (req, res) => {
  try {
    const { class: cls, div } = req.query;
    if (!cls || !div) {
      return res
        .status(400)
        .json({ success: false, message: "Class and Division required" });
    }
    const students = await Student.find({ class: cls, div }).sort({
      rollNo: 1,
    });
    if (!students || students.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No students found" });
    }
    res.json({ success: true, data: students });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message,
    });
  }
};

// @desc Bulk upload students via Excel file
// @route POST /api/admin/students/upload
// @access Private (Admin)
export const uploadStudentExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file required" });
    }
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Normalize and prepare upserts to avoid duplicates
    const operations = [];
    for (const r of jsonData) {
      const name = String(r.name || r.Name || "").trim();
      const clsRaw = r.class ?? r.Class ?? "";
      const divRaw = r.div ?? r.Div ?? "";
      const rollRaw = r.rollNo ?? r["Roll No"] ?? r["Roll"] ?? 0;

      // Normalize class: remove leading "Class" and trim
      const normalizedClass = String(clsRaw)
        .replace(/^Class\s*/i, "")
        .trim();
      const normalizedDiv = String(divRaw).trim().toUpperCase();
      const normalizedRoll = Number(rollRaw) || 0;

      if (!name || !normalizedClass || !normalizedDiv || !normalizedRoll) {
        continue; // skip incomplete rows
      }

      const parentContact = String(
        r.parentContact || r["Parent Contact No"] || r["Parent Phone"] || ""
      ).trim();
      const parentEmail = String(
        r.parentEmail || r["Parent Email"] || r["Parent Mail"] || ""
      ).trim();

      operations.push({
        updateOne: {
          filter: {
            class: normalizedClass,
            div: normalizedDiv,
            rollNo: normalizedRoll,
          },
          update: {
            $set: {
              name,
              parentContact,
              parentEmail,
            },
            $setOnInsert: {
              class: normalizedClass,
              div: normalizedDiv,
              rollNo: normalizedRoll,
            },
          },
          upsert: true,
        },
      });
    }

    let upserted = 0;
    let modified = 0;
    if (operations.length > 0) {
      const bulkResult = await Student.bulkWrite(operations, {
        ordered: false,
      });
      upserted = bulkResult.upsertedCount || 0;
      modified = bulkResult.modifiedCount || 0;
    }

    // Remove temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (_) {}

    res.json({
      success: true,
      message: `Students processed. Added: ${upserted}, Updated: ${modified}.`,
      data: {
        added: upserted,
        updated: modified,
        totalProcessed: operations.length,
      },
    });
  } catch (error) {
    console.error("Excel upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload students from Excel.",
      error: error.message,
    });
  }
};

// @desc Bulk update student classes (e.g., promote after academic year)
// @route PUT /api/admin/students/promote
// @access Private (Admin)
export const bulkPromoteStudents = async (req, res) => {
  try {
    const { fromClass, toClass, div } = req.body;
    if (!fromClass || !toClass || !div) {
      return res.status(400).json({
        success: false,
        message: "fromClass, toClass, and div are required",
      });
    }
    const result = await Student.updateMany(
      { class: fromClass, div },
      { $set: { class: toClass } }
    );
    res.json({
      success: true,
      message: `${result.modifiedCount} students promoted from ${fromClass} to ${toClass} in division ${div}.`,
    });
  } catch (error) {
    console.error("Promote students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to promote students.",
      error: error.message,
    });
  }
};

// @desc Dedupe students by (class, div, rollNo), keep most recent
// @route POST /api/admin/students/dedupe
// @access Private (Admin)
export const dedupeStudents = async (req, res) => {
  try {
    // Aggregate duplicates
    const duplicates = await Student.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: { class: "$class", div: "$div", rollNo: "$rollNo" },
          ids: { $push: "$_id" },
          keep: { $first: "$_id" },
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    const toRemove = duplicates.flatMap((d) =>
      d.ids.filter((id) => id.toString() !== d.keep.toString())
    );
    if (toRemove.length > 0) {
      await Student.deleteMany({ _id: { $in: toRemove } });
    }

    res.json({
      success: true,
      message: `Deduplication complete. Removed ${toRemove.length} duplicate records across ${duplicates.length} keys`,
    });
  } catch (error) {
    console.error("Deduplicate students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deduplicate students.",
      error: error.message,
    });
  }
};

/**
 * Admin Controller
 *
 * Handles administrative functions including user management, system statistics,
 * school management, and bulk operations for the Teacher Management System.
 *
 * @author Teacher Management System Team
 * @version 1.0.0
 */

import User from "../models/UserSchema.js";
import School from "../models/School.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import TeacherProfile from "../models/Teacher.js";
import TeacherClassSubject from "../models/TeacherClassSubject.js";
import Student from "../models/Student.js";
import QuestionPaper from "../models/QuestionPaper.js";
import Book from "../models/BookSchema.js";

import { validationResult } from "express-validator";
import admin from "../config/firebase.js";
import XLSX from "xlsx";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// -----------------------------
// Admin Dashboard Data
// -----------------------------
export const getAdminDashboard = async (req, res) => {
  try {
    // Determine the user's role and school ID from the authenticated request
    const userRole = req.user.role;
    const userSchoolId = req.user.schoolId;

    // Create a dynamic filter:
    // - If the user is a 'principal', it filters all queries by their schoolId.
    // - If the user is a 'superadmin', the filter is an empty object, matching all documents.
    const queryFilter =
      userRole === "principal" ? { schoolId: userSchoolId } : {}; // --- User counts by roles and statuses (with filter applied) ---

    const totalTeachers = await User.countDocuments({
      role: "teacher",
      ...queryFilter,
    });
    const activeTeachers = await User.countDocuments({
      role: { $in: ["teacher", "principal"] },
      status: "active",
      ...queryFilter,
    });
    const inactiveTeachers = await User.countDocuments({
      role: "teacher",
      status: "inactive",
      ...queryFilter,
    });
    const suspendedTeachers = await User.countDocuments({
      role: "teacher",
      status: "suspended",
      ...queryFilter,
    });

    // For a superadmin, count all verified schools. For a principal, the count is always 1.
    const totalSchools =
      userRole === "superadmin" ? await School.countDocuments() : 1;

    // --- School-specific entity counts (with filter applied) ---
    const totalClasses = await Class.countDocuments(queryFilter);
    const totalSubjects = await Subject.countDocuments(queryFilter); // --- Recent Activity (with filter applied) ---
    // Assuming you have a Student model with schoolId
    const totalStudents = await Student.countDocuments(queryFilter);

    const recentTeachers = await User.find({ role: "teacher", ...queryFilter })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("email name role status createdAt");

    const recentlyActiveTeachers = await User.find({
      role: "teacher",
      ...queryFilter,
    })
      .sort({ lastLoginAt: -1 })
      .limit(5)
      .select("email name role lastLoginAt"); // --- Monthly teacher growth (with filter applied) ---

    const currentDate = new Date();
    const thisMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(thisMonth.getMonth() - 1);

    const teachersThisMonth = await User.countDocuments({
      role: "teacher",
      createdAt: { $gte: thisMonth },
      ...queryFilter,
    });

    const teachersLastMonth = await User.countDocuments({
      role: "teacher",
      createdAt: { $gte: lastMonth, $lt: thisMonth },
      ...queryFilter,
    });

    const growthRate =
      teachersLastMonth > 0
        ? (
            ((teachersThisMonth - teachersLastMonth) / teachersLastMonth) *
            100
          ).toFixed(2)
        : teachersThisMonth > 0
        ? "100.00"
        : "0.00"; // Handle case where last month was 0

    res.status(200).json({
      success: true,
      message: "Admin dashboard data retrieved successfully",
      data: {
        statistics: {
          totalTeachers,
          activeTeachers,
          inactiveTeachers,
          suspendedTeachers,
          totalSchools,
          totalClasses,
          totalSubjects,
          totalStudents,
          teachersThisMonth,
          teachersLastMonth,
          growthRate,
        },
        recentActivity: {
          newTeachers: recentTeachers,
          activeTeachers: recentlyActiveTeachers,
        },
      },
    });
  } catch (error) {
    console.error("Admin Error - Dashboard:", error.message);
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

// -----------------------------
// System Statistics
// -----------------------------
export const getSystemStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userSchoolId = req.user.schoolId;

    // Create a dynamic filter for aggregation pipelines.
    // For principals, it adds a $match stage.
    // For superadmins, it's an empty array and has no effect.
    const matchFilter =
      userRole === "principal" ? [{ $match: { schoolId: userSchoolId } }] : []; // --- Teacher Overview Stats ---

    const stats = await User.aggregate([
      ...matchFilter, // Apply school filter first
      {
        $match: { role: "teacher" },
      },
      {
        $group: {
          _id: null,
          totalTeachers: { $sum: 1 },
          activeTeachers: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
        },
      },
    ]); // --- User Role Distribution ---

    const roleStats = await User.aggregate([
      ...matchFilter, // Apply school filter first
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]); // --- User Status Distribution ---

    const statusStats = await User.aggregate([
      ...matchFilter, // Apply school filter first
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
    console.error("Admin Error - System stats:", error.message);
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

// -----------------------------
// Get all Teachers with Filtering
// -----------------------------
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

    // Build filter query for users with role teacher
    const filter = {
      role: { $in: ["teacher", "principal"] },
    };

    if (req.user.role === "principal") {
      filter.schoolId = { $in: [req.user.schoolId, null] };
    } else if (req.user.role === "superadmin" && req.query.schoolId) {
      filter.schoolId = req.query.schoolId;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: "i" } },
        { name: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Sorting
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const teachers = await User.find(filter)
      .populate("schoolId", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalTeachers = await User.countDocuments(filter);

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
    console.error("Admin Error - Get all teachers:", error.message);
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

// -----------------------------
// Create Teacher
// -----------------------------
export const createTeacher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    // 1. Get inputs from request body (password is now required)
    const { name, email, password, phone, specialization, experienceYears } =
      req.body;

    // 2. Determine School ID based on user role
    let schoolId;
    if (req.user.role === "principal") {
      schoolId = req.user.schoolId;
    } else if (req.user.role === "superadmin") {
      schoolId = req.body.schoolId; // Superadmin gets it from the body
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: "Superadmin must provide a schoolId to create a teacher.",
        });
      }
    } else {
      // This should be caught by route-level auth, but as a safeguard:
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to create a teacher.",
      });
    }

    // 3. Check if user with this email already exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        // 409 Conflict is more appropriate
        success: false,
        message: "A user with this email already exists in the database.",
      });
    }

    // 4. Create Firebase Auth user FIRST
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password: password, // Use the provided password
        displayName: name,
        disabled: false,
      });
    } catch (firebaseCreateErr) {
      // Handle specific Firebase errors
      if (firebaseCreateErr?.code === "auth/email-already-exists") {
        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists in the authentication system.",
        });
      }
      if (firebaseCreateErr?.code === "auth/weak-password") {
        return res.status(400).json({
          success: false,
          message: firebaseCreateErr.message, // e.g., "Password must be at least 6 characters"
        });
      }
      // For other errors, log and throw
      console.error("Firebase create user error:", firebaseCreateErr);
      throw new Error("Failed to create user in authentication system.");
    }

    // 5. Create User in MongoDB (now that Firebase user is confirmed)
    const user = new User({
      name,
      email,
      role: "teacher",
      phone,
      schoolId: schoolId,
      status: "active",
      firebaseUid: firebaseUser.uid, // Link to Firebase user
    });

    // 6. Set Firebase Custom Claims
    try {
      await admin.auth().setCustomUserClaims(firebaseUser.uid, {
        role: "teacher",
        schoolId: schoolId.toString(), // Store schoolId in claims as well
      });
    } catch (claimsErr) {
      // This is a problem. For robustness, we should delete the new Firebase user
      // to prevent an inconsistent state.
      console.error("Firebase custom claims update error:", claimsErr);
      await admin.auth().deleteUser(firebaseUser.uid);
      return res.status(500).json({
        success: false,
        message: "Failed to set user claims, rolling back user creation.",
      });
    }

    // 7. Save MongoDB user
    await user.save();

    // 8. Create TeacherProfile (optional)
    let teacherProfile = null;
    if (specialization || experienceYears) {
      teacherProfile = new TeacherProfile({
        userId: user._id,
        specialization,
        experienceYears,
      });
      await teacherProfile.save();
    }

    // 9. Populate school info for the response
    await user.populate("schoolId", "name");

    // 10. Send success response
    res.status(201).json({
      success: true,
      message:
        "Teacher created successfully. You can now share the email and password with them.",
      data: {
        user: user.toJSON(),
        teacherProfile: teacherProfile ? teacherProfile.toJSON() : null,
        // DO NOT return the password
      },
    });
  } catch (error) {
    // General error handler
    console.error("Admin Error - Create teacher:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create teacher",
      error: error.message,
    });
  }
};

// -----------------------------
// Get Teacher by ID
// -----------------------------
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
    if (req.user.role === "principal") {
      query.schoolId = req.user.schoolId;
    }
    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ["teacher", "principal"] },
    }).populate("schoolId", "name address contact");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Teacher retrieved successfully",
      data: { teacher: user },
    });
  } catch (error) {
    console.error("Admin Error - Get teacher by ID:", error.message);
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

// -----------------------------
// Update Teacher (General Update)
// -----------------------------
export const updateTeacher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, email, role, status, schoolId, phone } = req.body;
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot update your own account",
      });
    }

    // A principal can only find users in their school OR unassigned users.
    const findQuery = { _id: userId };
    if (req.user.role === "principal") {
      findQuery.schoolId = { $in: [req.user.schoolId, null] };
    }

    const user = await User.findOne(findQuery);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // --- SECURITY CHECKS FOR PRINCIPALS ---
    if (req.user.role === "principal") {
      // Prevent a principal from moving a teacher to a DIFFERENT school.
      if (schoolId && schoolId.toString() !== req.user.schoolId.toString()) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: You can only assign teachers to your own school.",
        });
      }
      // Prevent a principal from creating a superadmin.
      if (role === "superadmin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You cannot create a superadmin.",
        });
      }
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (schoolId !== undefined) user.schoolId = schoolId;
    if (phone !== undefined) user.phone = phone;

    // --- SECURELY UPDATE schoolId AND role ---
    if (req.user.role === "principal") {
      // A principal can assign a school (only their own) and change roles (except to superadmin).
      user.schoolId = req.user.schoolId; // ✅ THIS IS THE KEY FIX
      if (role) user.role = role;
    }

    // --- SUPERADMIN-ONLY UPDATES ---
    // Only a superadmin can change a teacher's role or move them to another school.
    if (req.user.role === "superadmin") {
      if (role !== undefined) user.role = role;
      if (schoolId !== undefined) user.schoolId = schoolId;
    }

    await user.save();

    // Populate school info for response
    await user.populate("schoolId", "name");

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: {
        teacher: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Admin Error - Update teacher:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update teacher",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// -----------------------------
// Update Teacher Role
// -----------------------------
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

    if (req.user.role !== "principal") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to change user roles.",
      });
    }

    const { role, reason } = req.body;
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findOne({ _id: userId, role: "teacher" });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const oldRole = user.role;
    user.role = role;

    try {
      await admin.auth().setCustomUserClaims(user.firebaseUid, {
        role: role,
        updatedBy: req.user._id,
        updatedAt: new Date().toISOString(),
      });
    } catch (firebaseError) {
      console.error("Firebase custom claims update error:", firebaseError);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Teacher role updated successfully",
      data: {
        teacher: {
          _id: user._id,
          email: user.email,
          role: user.role,
          oldRole,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Admin Error - Update teacher role:", error.message);
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

// -----------------------------
// Update Teacher Status
// -----------------------------
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
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own status",
      });
    }

    // Build a query to find the teacher, scoped by the user's role
    const findQuery = { _id: userId, role: "teacher" };
    if (req.user.role === "principal") {
      findQuery.schoolId = req.user.schoolId;
    }

    const user = await User.findOne(findQuery);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const oldStatus = user.status;
    user.status = status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Teacher status updated successfully",
      data: {
        teacher: {
          _id: user._id,
          email: user.email,
          status: user.status,
          oldStatus,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Admin Error - Update teacher status:", error.message);
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

// -----------------------------
// Delete Teacher
// -----------------------------
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

    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Build a query to find the teacher, scoped by the user's role
    const findQuery = { _id: userId, role: "teacher" };
    if (req.user.role === "principal") {
      findQuery.schoolId = req.user.schoolId;
    }

    const user = await User.findOne(findQuery);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    try {
      await admin.auth().deleteUser(user.firebaseUid);
    } catch (firebaseError) {
      console.error("Firebase user deletion error:", firebaseError);
    }

    await User.deleteOne({ _id: userId });

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
      data: {
        deletedTeacher: {
          _id: user._id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("Admin Error - Delete teacher:", error.message);
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

// -----------------------------
// Bulk Update Teachers
// -----------------------------
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

    const { userIds, updates } = req.body;
    const query = { _id: { $in: userIds }, role: "teacher" };
    // Remove sensitive fields
    const safeUpdates = { ...updates };
    delete safeUpdates._id;
    delete safeUpdates.firebaseUid;
    delete safeUpdates.email;

    // --- ROLE-BASED LOGIC ---
    if (req.user.role === "principal") {
      // 1. Force the query to only match teachers in the principal's school.
      query.schoolId = req.user.schoolId;

      // 2. Prevent principals from escalating privileges or changing school.
      delete safeUpdates.role;
      delete safeUpdates.schoolId;
    }

    const result = await User.updateMany(query, { $set: safeUpdates });

    res.status(200).json({
      success: true,
      message: "Bulk update completed successfully",
      data: {
        updatedCount: result.modifiedCount,
        totalRequested: userIds.length,
      },
    });
  } catch (error) {
    console.error("Admin Error - Bulk update teachers:", error.message);
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

// -----------------------------
// Export Teachers Data
// -----------------------------
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

    const { format = "json", status } = req.query;

    // Filter teachers only
    const filter = { role: "teacher" };
    if (req.user.role === "principal") {
      filter.schoolId = req.user.schoolId;
    }
    // A superadmin can optionally filter by a schoolId passed in the query.
    else if (req.user.role === "superadmin" && req.query.schoolId) {
      filter.schoolId = req.query.schoolId;
    }

    // Add other optional filters
    if (status) filter.status = status;

    const teachers = await User.find(filter)
      .populate("schoolId", "name")
      .sort({ createdAt: -1 });

    if (format === "csv") {
      // Use a filename that reflects the data scope
      const schoolName =
        teachers[0]?.schoolId?.name?.replace(/\s+/g, "_") || "All_Schools";
      const fileName = `teachers-export_${schoolName}_${
        new Date().toISOString().split("T")[0]
      }.csv`;

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
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.send(csvHeaders + csvData);
    } else {
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
    console.error("Admin Error - Export teachers:", error.message);
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

// -----------------------------
// Demote Teacher from Admin
// -----------------------------
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

    // --- PRIMARY SECURITY CHECK ---
    // This action MUST be restricted to superadmins.
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not have permission to perform this action.",
      });
    }

    const userId = req.params.id;
    const { role: newRole = "moderator", reason } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot demote your own admin privileges",
      });
    }

    const user = await User.findOne({
      _id: userId,
      role: { $in: ["superadmin", "admin"] },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not an admin",
      });
    }

    // Prevent demoting the last superadmin to avoid system lockout.
    if (user.role === "superadmin") {
      const superadminCount = await User.countDocuments({ role: "superadmin" });
      if (superadminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote the last remaining superadmin.",
        });
      }
    }

    const oldRole = user.role;
    user.role = newRole;

    try {
      await admin.auth().setCustomUserClaims(user.firebaseUid, {
        role: newRole,
        updatedBy: req.user._id,
        updatedAt: new Date().toISOString(),
      });
    } catch (firebaseError) {
      console.error("Firebase custom claims update error:", firebaseError);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User demoted successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          oldRole,
          role: user.role,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Admin Error - Demote from admin:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to demote user from admin",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// -----------------------------
// Get Students by Class and Division
// -----------------------------

export const getStudentsByClassDivision = async (req, res) => {
  try {
    const { class: cls, div } = req.query;
    if (!cls || !div) {
      return res.status(400).json({
        success: false,
        message: "Class and Division required",
      });
    }

    // 🛡️ SECURITY: Use the principal's schoolId from the authenticated user token.
    const schoolId = req.user.schoolId;

    const students = await Student.find({
      schoolId: schoolId, // Filter by the principal's school
      class: cls,
      div: div,
    });

    if (!students.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No students found for this class and division",
      });
    }

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Admin Error - Get students:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message,
    });
  }
};

// Upload Students (Excel)
export const uploadStudentExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file required" });
    }
    // 🔑 Get the principal's schoolId to associate with all uploaded students.
    const schoolId = req.user.schoolId; // This line is correct

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let successCount = 0;
    let failedRows = [];

    for (const r of jsonData) {
      try {
        const name = String(r.name || r.Name || "").trim();
        const clsRaw = String(r.class ?? r.Class ?? "").trim();
        const divRaw = String(r.div ?? r.Div ?? "").trim();
        const rollRaw = r.rollNo ?? r["Roll No"] ?? r["Roll"] ?? 0;

        // --- 🔑 PARSE ROLL NO ---
        const rollNo = parseInt(rollRaw);

        const parentContact = String(r.parentContact || "").trim();
        const parentEmail = String(r.parentEmail || "").trim();

        // Basic validation: require name, class, div, rollNo
        if (!name || !clsRaw || !divRaw || isNaN(rollNo) || rollNo === 0) {
          failedRows.push({
            row: r,
            error: "Missing required fields (name, class, div, rollNo)",
          });
          continue;
        }

        // --- 🔑 UPDATED QUERY ---
        // We find a student by their unique key: school, class, division, and roll number.
        const query = {
          schoolId: schoolId,
          class: clsRaw,
          div: divRaw,
          rollNo: rollNo,
        };

        // This is the data that will be set or updated.
        const studentData = {
          schoolId: schoolId, // <-- Save the schoolId
          name: name,
          class: clsRaw,
          div: divRaw,
          rollNo: rollNo,
          parentContact: parentContact,
          parentEmail: parentEmail,
        };

        await Student.findOneAndUpdate(
          query, // The unique key
          studentData, // The data to set
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        // -------------------------

        successCount++;
      } catch (upsertError) {
        // Catch duplicate key errors if the index is set
        failedRows.push({ row: r, error: upsertError.message });
      }
    }

    try {
      fs.unlinkSync(req.file.path);
    } catch (_) {}

    res.json({
      success: true,
      message: `Students processed successfully.`,
      data: {
        successCount,
        failedRows,
        failedCount: failedRows.length,
      },
    });
  } catch (error) {
    console.error("Admin Error - Excel upload:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to upload students from Excel.",
      error: error.message,
    });
  }
};

// Bulk promote students (e.g., move from one class to another)
export const bulkPromoteStudents = async (req, res) => {
  try {
    const { fromClass, toClass, div } = req.body;

    if (!fromClass || !toClass || !div) {
      return res.status(400).json({
        success: false,
        message: "fromClass, toClass, and div are required",
      });
    }

    // 🛡️ SECURITY: Get the schoolId from the authenticated principal.
    const schoolId = req.user.schoolId; // Perform the update operation, strictly filtering by the principal's school.

    const result = await Student.updateMany(
      { schoolId: schoolId, class: fromClass, div: div }, // Securely scope the update
      { $set: { class: toClass } }
    );

    if (result.matchedCount === 0) {
      return res.json({
        success: true,
        message: `No students found in class ${fromClass}, division ${div} to promote.`,
      });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} students promoted from class ${fromClass} to ${toClass} in division ${div}`,
    });
  } catch (error) {
    console.error("Admin Error - Bulk promote students:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to bulk promote students",
      error: error.message,
    });
  }
};

// Deduplicate student profiles
export const dedupeStudents = async (req, res) => {
  try {
    // Your deduplication logic, e.g., remove duplicate student profiles or users
    // Example:
    const duplicates = await Student.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            class: "$class",
            div: "$div",
            rollNo: "$rollNo",
          },
          ids: { $push: "$_id" },
          keep: { $first: "$_id" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    const idsToDelete = duplicates.flatMap((d) =>
      d.ids.filter((id) => id.toString() !== d.keep.toString())
    );

    if (idsToDelete.length > 0) {
      await Student.deleteMany({ _id: { $in: idsToDelete } });
    }

    res.json({
      success: true,
      message: `Deduplication complete. Removed ${idsToDelete.length} duplicate records.`,
    });
  } catch (error) {
    console.error("Admin Error - Deduplication:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to deduplicate students.",
      error: error.message,
    });
  }
};

// Add or update a class in school (grade + division unique in school)
export async function addOrUpdateClass(req, res) {
  try {
    const { grade, division } = req.body;

    let schoolId;

    // 🛡️ SECURITY: Determine schoolId based on the user's role, not the request body.
    if (req.user.role === "principal") {
      schoolId = req.user.schoolId;
    } else if (req.user.role === "superadmin") {
      schoolId = req.body.schoolId; // Superadmin must provide it
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: "Superadmin must provide a schoolId.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot manage classes.",
      });
    }

    if (!grade || !division) {
      return res
        .status(400)
        .json({ success: false, message: "Grade and division are required." });
    }

    let existingClass = await Class.findBySchoolGradeDivision(
      schoolId,
      grade,
      division
    );
    let isNew = false;
    if (!existingClass) {
      // Create new class if it doesn't exist
      existingClass = new Class({ schoolId, grade, division });
      await existingClass.save();
      isNew = true;
    }
    // If it exists, we just return it (no update logic needed based on your original code)

    // --- 👇 FIX: Return consistent success response ---
    res.status(isNew ? 201 : 200).json({
      success: true,
      message: `Class ${isNew ? "created" : "already exists"}`,
      data: existingClass, // Send back the created/existing class
    });
  } catch (e) {
    console.error("Admin Error - Add/Update class:", e.message);
    res.status(500).json({ error: e.message });
  }
}

// Get all classes
export async function getClasses(req, res) {
  try {
    const { role, schoolId } = req.user;
    const filter = {};

    // 🛡️ SECURITY: Apply filter based on user role.
    if (role === "principal") {
      filter.schoolId = schoolId;
    } else if (role === "superadmin" && req.query.schoolId) {
      // Superadmin can optionally filter
      filter.schoolId = req.query.schoolId;
    } else if (
      role !== "superadmin" &&
      role !== "principal" &&
      role !== "teacher"
    ) {
      // Explicitly block other roles if necessary, though route auth should handle this.
      return res.status(200).json({ success: true, data: [] });
    }

    const classes = await Class.find(filter).populate("schoolId", "name");
    res.status(200).json({ success: true, data: classes });
  } catch (e) {
    console.error("Admin Error - Get classes:", e.message);
    res.status(500).json({ error: e.message });
  }
}

// Delete a class by ID
export async function deleteClass(req, res) {
  try {
    const { classId } = req.params;
    const { role, schoolId } = req.user;

    const query = { _id: classId };

    // 🛡️ SECURITY: If the user is a principal, add their schoolId to the query.
    // This prevents them from deleting classes in other schools.
    if (role === "principal") {
      query.schoolId = schoolId;
    } else if (role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot delete classes.",
      });
    }

    // findOneAndDelete is atomic and secure. It will only delete if both _id and schoolId (if applicable) match.
    const deletedClass = await Class.findOneAndDelete(query);

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found or you do not have permission to delete it.",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Class deleted successfully" });
  } catch (e) {
    console.error("Admin Error - Delete class:", e.message);
    res.status(500).json({ error: e.message });
  }
}

// Add or update a subject in school with unique subjectId
export async function addOrUpdateSubject(req, res) {
  try {
    const { subjectId, name } = req.body;
    let schoolId;

    // 🛡️ SECURITY: Determine schoolId from the user's role, not the request body.
    if (req.user.role === "principal") {
      schoolId = req.user.schoolId;
    } else if (req.user.role === "superadmin") {
      schoolId = req.body.schoolId; // Superadmin must provide it
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: "Superadmin must provide a schoolId.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot manage subjects.",
      });
    }

    if (!subjectId || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Subject ID and name are required." });
    }

    let subject = await Subject.findOne({ schoolId, subjectId });
    let isNew = false;
    if (subject) {
      // Update subject name if different
      if (subject.name !== name) {
        subject.name = name;
        await subject.save();
      }
      return res.json(subject);
    } else {
      // Create new subject
      subject = new Subject({ schoolId, subjectId, name });
      await subject.save();
      isNew = true;
    }
    res.status(isNew ? 201 : 200).json({
      success: true,
      message: `Subject ${isNew ? "created" : "found/updated"} successfully`,
      data: subject, // Send back the created/updated subject
    });
  } catch (e) {
    console.error("Admin Error - Add/Update subject:", e.message);
    res.status(500).json({ error: e.message || "Failed to save subject." });
  }
}

// Get all subjects
export async function getSubjects(req, res) {
  try {
    const { role, schoolId } = req.user;
    const filter = {}; // 🛡️ SECURITY: Apply a filter based on the user's role.

    if (role === "principal" || role === "teacher") {
      filter.schoolId = schoolId;
    } else if (role === "superadmin" && req.query.schoolId) {
      // A superadmin can optionally filter the list by a specific school.
      filter.schoolId = req.query.schoolId;
    } else if (role !== "superadmin") {
      // For any other roles, return an empty array.
      return res.status(200).json({ success: true, data: [] });
    }

    const subjects = await Subject.find(filter).populate("schoolId", "name");
    res.status(200).json({ success: true, data: subjects });
  } catch (e) {
    console.error("Admin Error - Get subjects:", e.message);
    res.status(500).json({ error: e.message });
  }
}

// Delete a subject by ID
export async function deleteSubject(req, res) {
  try {
    const { subjectId } = req.params; // This should be the MongoDB document _id
    const { role, schoolId } = req.user;
    const query = { _id: subjectId }; // 🛡️ SECURITY: If the user is a principal, scope the query to their school. // This prevents them from deleting subjects in other schools even if they know the ID.

    if (role === "principal") {
      query.schoolId = schoolId;
    } else if (role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot delete subjects.",
      });
    } // This atomic operation will only delete if both _id and schoolId (if applicable) match.

    const deletedSubject = await Subject.findOneAndDelete(query);

    if (!deletedSubject) {
      return res.status(404).json({
        success: false,
        message:
          "Subject not found or you do not have permission to delete it.",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Subject deleted successfully" });
  } catch (e) {
    console.error("Admin Error - Delete subject:", e.message);
    res.status(500).json({ error: e.message });
  }
}

// Get all teacher assignments
export async function getAssignments(req, res) {
  try {
    // 🛡️ SECURITY: Only principals can access this. The query is scoped to their school.
    if (req.user.role !== "principal") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Not authorized." });
    }
    const schoolId = req.user.schoolId;

    const assignments = await TeacherClassSubject.find({ schoolId: schoolId })
      .populate("teacherId", "name email")
      .populate({
        path: "classId",
        select: "grade division schoolId",
        // Nested populate to get school details *from* the class
        populate: {
          path: "schoolId",
          select: "name",
        },
      })
      .populate("subjectId", "name subjectId")
      .sort({ createdAt: -1 });

    // --- 💡 START OF FIX ---
    // This .map() block safely handles null references
    const transformedAssignments = assignments.map((assignment) => {
      // Use "|| {}" to provide a fallback empty object if a reference is null
      const teacher = assignment.teacherId || {};
      const classData = assignment.classId || {};
      const subject = assignment.subjectId || {};

      // schoolData is nested, so we access it from the (now safe) classData
      const schoolData = classData.schoolId || {};

      return {
        _id: assignment._id,
        teacherId: teacher._id, // Will be undefined, not an error
        teacherName: teacher.name || "Deleted Teacher",
        teacherEmail: teacher.email || "N/A",
        classId: classData._id, // Will be undefined, not an error
        className: `Grade ${classData.grade || "?"} - Division ${
          classData.division || "?"
        }`,
        schoolName: schoolData.name || "Unknown School",
        subjectId: subject._id, // Will be undefined, not an error
        subjectName: subject.name || "Deleted Subject",
        subjectCode: subject.subjectId || "N/A",
        assignedAt: assignment.assignedAt,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      };
    });
    // --- 💡 END OF FIX ---

    res.status(200).json({
      success: true,
      data: transformedAssignments,
    });
  } catch (error) {
    console.error("Admin Error - Get assignments:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Assign teacher to class + subject
export async function assignTeacher(req, res) {
  try {
    // 🛡️ SECURITY: Only principals can assign teachers.
    if (req.user.role !== "principal") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Not authorized." });
    }
    const schoolId = req.user.schoolId;

    const { teacherId, classId, subjectId } = req.body;

    // Validate that all required fields are provided
    if (!teacherId || !classId || !subjectId) {
      return res.status(400).json({
        success: false,
        error: "Teacher ID, Class ID, and Subject ID are required",
      });
    }

    // Check if assignment already exists
    const existingAssignment = await TeacherClassSubject.findOne({
      teacherId,
      classId,
      subjectId,
    });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: "Assignment already exists",
      });
    }

    // Get teacher details to check school
    const teacher = await User.findById(teacherId).populate("schoolId");
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: "Teacher not found",
      });
    }

    // Get class details to check school
    const classData = await Class.findById(classId).populate("schoolId");
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: "Class not found",
      });
    }

    // Get subject details to check school
    const subject = await Subject.findById(subjectId).populate("schoolId");
    if (!subject) {
      return res.status(404).json({
        success: false,
        error: "Subject not found",
      });
    }

    // Validate school consistency
    const teacherSchoolId = teacher.schoolId?._id?.toString();
    const classSchoolId = classData.schoolId?._id?.toString();
    const subjectSchoolId = subject.schoolId?._id?.toString();

    if (!teacherSchoolId || !classSchoolId || !subjectSchoolId) {
      return res.status(400).json({
        success: false,
        error: "Teacher, class, or subject must be associated with a school",
      });
    }

    if (
      teacherSchoolId !== classSchoolId ||
      teacherSchoolId !== subjectSchoolId
    ) {
      return res.status(400).json({
        success: false,
        error: "Teacher, class, and subject must belong to the same school",
      });
    }

    const assignment = new TeacherClassSubject({
      schoolId,
      teacherId,
      classId,
      subjectId,
    });
    await assignment.save();

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("Admin Error - Assign teacher:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Remove teacher assignment by ID
export async function removeAssignment(req, res) {
  try {
    // 🛡️ SECURITY: Only principals can remove assignments.
    if (req.user.role !== "principal") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Not authorized." });
    }
    const schoolId = req.user.schoolId;

    const { assignmentId } = req.params;
    const deletedAssignment = await TeacherClassSubject.findOneAndDelete({
      _id: assignmentId,
      schoolId: schoolId,
    });

    if (!deletedAssignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment removed successfully",
      data: deletedAssignment,
    });
  } catch (error) {
    console.error("Admin Error - Remove assignment:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// @desc    Get all question papers for the admin's school
// @route   GET /api/admin/papers
// @access  Private (Admin)
export async function getAllPapersForSchool(req, res) {
  try {
    const schoolIdFromUser = req.user.schoolId; // This is an ObjectId object

    if (!schoolIdFromUser) {
      return res.status(400).json({
        success: false,
        message: "Admin is not associated with a school.",
      });
    }

    const paperGroups = await QuestionPaper.aggregate([
      // 1. Match using the top-level 'schoolId' field
      {
        $match: { schoolId: schoolIdFromUser },
      },

      // 2. Sort by top-level 'createdAt'
      {
        $sort: { createdAt: -1 },
      },
      // 3. Add a field for grouping by top-level 'createdAt'
      {
        $addFields: {
          roundedCreatedAt: {
            $dateTrunc: {
              date: "$createdAt", // Use top-level field
              unit: "minute",
            },
          },
        },
      },
      // 4. Group by batchId or the fallback composite key (using top-level fields)
      {
        $group: {
          _id: {
            batchKey: {
              $ifNull: [
                "$generationBatchId", // Use top-level field
                {
                  // Otherwise, build the composite key
                  subject: "$subject", // Use top-level field
                  class: "$classGrade", // Use top-level field
                  time: "$roundedCreatedAt",
                },
              ],
            },
          },
          sets: { $sum: 1 }, // Count the papers in the group
          firstFullDocument: { $first: "$$ROOT" }, // Get the entire document
          papers: { $push: "$$ROOT" },
        },
      },
      // 5. Promote the 'firstFullDocument' details to the top level
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$firstFullDocument", // Start with the full, original paper
              {
                // Add/overwrite these fields
                sets: "$sets",
                papers: "$papers",
                _id: "$firstFullDocument._id", // Ensure the _id is the paper's ID
              },
            ],
          },
        },
      },
      // 6. Sort the final groups (newest batch first)
      {
        $sort: { createdAt: -1 },
      },
      // 7. Manually populate the teacher's info (this will work now)
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser",
        },
      },
      {
        $unwind: {
          path: "$createdByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          createdBy: {
            _id: "$createdByUser._id",
            name: "$createdByUser.name",
            email: "$createdByUser.email",
          },
        },
      },
      {
        $project: { createdByUser: 0 },
      },
    ]);

    console.log(`Aggregation found ${paperGroups.length} paper groups.`);

    res.status(200).json({
      success: true,
      data: {
        papers: paperGroups,
      },
    });
  } catch (error) {
    console.error("Error fetching papers for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching papers.",
    });
  }
}

// @desc    Get all books for the admin's school, grouped by class
// @route   GET /api/admin/books-by-class
// @access  Private (Admin/Principal)
export async function getBooksByClass(req, res) {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "Admin has no school assigned." });
    }

    const booksGroupedByClass = await Book.aggregate([
      // 1. Match books for the admin's school
      {
        $match: { schoolId: new mongoose.Types.ObjectId(schoolId) },
      },
      // 2. Sort by Class ID and then maybe book title or creation date
      {
        $sort: { classId: 1, createdAt: -1 }, // Sort primarily by class, then newest book first
      },
      // 3. Populate Teacher info (Uploaded By)
      {
        $lookup: {
          from: "users", // Your users collection name
          localField: "uploadedBy",
          foreignField: "_id",
          as: "uploaderInfo",
        },
      },
      // 4. Populate Class info
      {
        $lookup: {
          from: "classes", // Your classes collection name
          localField: "classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      // 5. Unwind the populated arrays (usually contain one element)
      {
        $unwind: {
          path: "$uploaderInfo",
          preserveNullAndEmptyArrays: true, // Keep book even if uploader deleted
        },
      },
      {
        $unwind: {
          path: "$classInfo",
          preserveNullAndEmptyArrays: true, // Keep book even if class deleted (though unlikely)
        },
      },
      // 6. Group by Class ID
      {
        $group: {
          _id: "$classId", // Group by the class ObjectId
          classGrade: { $first: "$classInfo.grade" }, // Get the grade number
          books: {
            // Push relevant book details into an array for this class
            $push: {
              _id: "$_id",
              title: "$title",
              subject: "$subject",
              author: "$author",
              year: "$year",
              uploadedAt: "$createdAt",
              uploadedBy: {
                name: "$uploaderInfo.name",
                email: "$uploaderInfo.email",
              },
              processedStatus: "$processedStatus",
              noOfChunks: "$noOfChunks",
            },
          },
        },
      },
      // 7. Sort the final groups by class grade (numeric sort)
      {
        $sort: { classGrade: 1 },
      },
      // 8. Project to rename _id to classId for clarity (optional)
      {
        $project: {
          _id: 0, // Remove the default _id group field
          classId: "$_id", // Rename _id to classId
          classGrade: 1,
          books: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: booksGroupedByClass });
  } catch (error) {
    console.error("Error fetching books for admin:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching books." });
  }
}

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Get counts based on User Roles
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const totalPrincipals = await User.countDocuments({ role: "principal" });
    const totalStudents = await User.countDocuments({ role: "student" });

    // 2. Get active users
    const activeTeachers = await User.countDocuments({
      role: "teacher",
      status: "active",
    });

    // 3. Get School Counts
    const totalSchools = await School.countDocuments({});

    // 4. (Optional) Get Class/Subject counts if you have those models
    // const totalClasses = await Class.countDocuments({});

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalTeachers,
          activeTeachers,
          totalSchools,
          totalPrincipals,
          totalStudents,
          totalClasses: 0, // Placeholder if you don't have classes yet
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

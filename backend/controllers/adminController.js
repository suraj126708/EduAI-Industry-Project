// controllers/adminController.js
import User from "../models/UserSchema.js";
import School from "../models/School.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import TeacherProfile from "../models/Teacher.js";
import TeacherClassSubject from "../models/TeacherClassSubject.js";
import StudentProfile from "../models/Student.js";
import { validationResult } from "express-validator";
import admin from "../config/firebase.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { log } from "console";

// -----------------------------
// Admin Dashboard Data
// -----------------------------
export const getAdminDashboard = async (req, res) => {
  try {
    // User counts by roles and statuses
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const activeTeachers = await User.countDocuments({
      role: "teacher",
      status: "active",
    });
    const inactiveTeachers = await User.countDocuments({
      role: "teacher",
      status: "inactive",
    });
    const suspendedTeachers = await User.countDocuments({
      role: "teacher",
      status: "suspended",
    });

    const teacherCount = totalTeachers;
    const moderatorCount = await User.countDocuments({ role: "moderator" });
    const adminCount = await User.countDocuments({ role: "admin" });

    const totalSchools = await School.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalSubjects = await Subject.countDocuments();

    // Recent Teachers - fetch basic user info
    const recentTeachers = await User.find({ role: "teacher" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("email name role status createdAt");

    const recentlyActiveTeachers = await User.find({ role: "teacher" })
      .sort({ lastLoginAt: -1 })
      .limit(5)
      .select("email name role lastLoginAt");

    // Monthly teacher growth
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

    const teachersThisMonth = await User.countDocuments({
      role: "teacher",
      createdAt: { $gte: thisMonth },
    });

    const teachersLastMonth = await User.countDocuments({
      role: "teacher",
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

// -----------------------------
// System Statistics
// -----------------------------
export const getSystemStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
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
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = await User.aggregate([
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
    const filter = { role: "teacher" };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.schoolId) filter.schoolId = req.query.schoolId;
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

// -----------------------------
// Create Teacher
// -----------------------------
export const createTeacher = async (req, res) => {
  try {
    const { name, email, phone, schoolId, specialization, experienceYears } =
      req.body;

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create User with teacher role
    const user = new User({
      name,
      email,
      role: "teacher",
      phone,
      schoolId,
      status: "active",
    });

    await user.save();

    // Create TeacherProfile if additional teacher-specific data is provided
    let teacherProfile = null;
    if (specialization || experienceYears) {
      teacherProfile = new TeacherProfile({
        userId: user._id,
        specialization,
        experienceYears,
      });
      await teacherProfile.save();
    }

    // Populate the user with school info
    await user.populate("schoolId", "name");

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: {
        user: user.toJSON(),
        teacherProfile: teacherProfile ? teacherProfile.toJSON() : null,
      },
    });

    console.log(`🔧 Admin ${req.user.email} created teacher ${user.email}`);
  } catch (error) {
    console.error("Create teacher error:", error);
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

    const user = await User.findOne({
      _id: req.params.id,
      role: "teacher",
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

    const user = await User.findOne({ _id: userId, role: "teacher" });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (schoolId !== undefined) user.schoolId = schoolId;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Populate school info for response
    await user.populate("schoolId", "name");

    console.log(`🔧 Admin ${req.user.email} updated teacher ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: {
        teacher: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update teacher error:", error);
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

    console.log(
      `🔧 Admin ${req.user.email} changed teacher ${user.email} role from ${oldRole} to ${role}`
    );

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

    const user = await User.findOne({ _id: userId, role: "teacher" });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const oldStatus = user.status;
    user.status = status;

    await user.save();

    console.log(
      `🔧 Admin ${req.user.email} changed teacher ${user.email} status from ${oldStatus} to ${status}`
    );

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

    const user = await User.findOne({ _id: userId, role: "teacher" });

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

    console.log(`🗑️ Admin ${req.user.email} deleted teacher ${user.email}`);

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

    // Remove sensitive fields
    const safeUpdates = { ...updates };
    delete safeUpdates._id;
    delete safeUpdates.firebaseUid;
    delete safeUpdates.email;

    const result = await User.updateMany(
      { _id: { $in: userIds }, role: "teacher" },
      { $set: safeUpdates }
    );

    console.log(
      `🔧 Admin ${req.user.email} bulk updated ${result.modifiedCount} teachers`
    );

    res.status(200).json({
      success: true,
      message: "Bulk update completed successfully",
      data: {
        updatedCount: result.modifiedCount,
        totalRequested: userIds.length,
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

    const { format = "json", role, status, schoolId } = req.query;

    // Filter teachers only
    const filter = { role: "teacher" };
    if (status) filter.status = status;
    if (schoolId) filter.schoolId = schoolId;

    const teachers = await User.find(filter)
      .populate("schoolId", "name")
      .sort({ createdAt: -1 });

    if (format === "csv") {
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

    const userId = req.params.id;
    const { role: newRole = "moderator", reason } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot demote your own admin privileges",
      });
    }

    const user = await User.findOne({ _id: userId, role: "admin" });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not an admin",
      });
    }

    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot demote the last remaining admin",
      });
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

    console.log(
      `🔧 Admin ${req.user.email} demoted user ${user.email} from ${oldRole} to ${newRole}`
    );

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
    console.error("Demote from admin error:", error);
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

    const students = await StudentProfile.find({ class: cls, div: div });

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
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message,
    });
  }
};

// Bulk Upload Students (Excel)
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

    let successCount = 0;
    let failedRows = [];
    for (const r of jsonData) {
      const name = String(r.name || r.Name || "").trim();
      const clsRaw = r.class ?? r.Class ?? "";
      const divRaw = r.div ?? r.Div ?? "";
      const rollRaw = r.rollNo ?? r["Roll No"] ?? r["Roll"] ?? 0;
      const parentContact = r.parentContact || "";
      const parentEmail = r.parentEmail || "";

      // Basic validation: require name, class, div, rollNo
      if (!name || !clsRaw || !divRaw || !rollRaw) {
        failedRows.push(r);
        continue;
      }

      // Upsert student document directly (no user doc)
      await StudentProfile.findOneAndUpdate(
        { name, class: clsRaw, div: divRaw, rollNo: rollRaw }, // key to avoid duplicates
        {
          name,
          class: clsRaw,
          div: divRaw,
          rollNo: rollRaw,
          parentContact,
          parentEmail,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      successCount++;
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

    // Find student profiles matching the class and division
    const studentProfiles = await StudentProfile.find({
      class: fromClass,
      div: div,
    });

    const userIdsToPromote = studentProfiles.map((sp) => sp.userId);

    // Update the class field in student profiles to 'toClass'
    const result = await StudentProfile.updateMany(
      { userId: { $in: userIdsToPromote } },
      { $set: { class: toClass } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} students promoted from class ${fromClass} to ${toClass} in division ${div}`,
    });
  } catch (error) {
    console.error("bulkPromoteStudents error:", error);
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
    const duplicates = await StudentProfile.aggregate([
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
      await StudentProfile.deleteMany({ _id: { $in: idsToDelete } });
    }

    res.json({
      success: true,
      message: `Deduplication complete. Removed ${idsToDelete.length} duplicate records.`,
    });
  } catch (error) {
    console.error("Deduplication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deduplicate students.",
      error: error.message,
    });
  }
};

/*-------------Schools-------------*/

// Create a school (Admin only)
export async function createSchool(req, res) {
  try {
    const {
      name,
      type,
      establishedYear,
      address,
      addressDetails,
      contact,
      emailDomain,
    } = req.body;

    const existingSchool = await School.findByName(name);
    if (existingSchool)
      return res.status(400).json({ error: "School name already exists" });

    const school = new School({
      name,
      type,
      establishedYear,
      address,
      addressDetails,
      contact,
      emailDomain,
    });

    await school.save();
    res.status(201).json(school);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
}

// Get all schools
export async function getSchools(req, res) {
  try {
    const schools = await School.find();
    res.status(200).json(schools);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Add or update a class in school (grade + division unique in school)
export async function addOrUpdateClass(req, res) {
  try {
    const { schoolId, grade, division } = req.body;
    console.log(req.body);

    let existingClass = await Class.findBySchoolGradeDivision(
      schoolId,
      grade,
      division
    );

    if (existingClass) {
      // Update if necessary or just return
      return res.json(existingClass);
    }

    const newClass = new Class({ schoolId, grade, division });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Get all classes
export async function getClasses(req, res) {
  try {
    const classes = await Class.find();
    res.status(200).json(classes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Delete a class by ID
export async function deleteClass(req, res) {
  try {
    const { classId } = req.params;
    await Class.findByIdAndDelete(classId);
    res.json({ message: "Class deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Add or update a subject in school with unique subjectId
export async function addOrUpdateSubject(req, res) {
  try {
    const { schoolId, subjectId, name } = req.body;
    console.log(req.body);

    let subject = await Subject.findOne({ schoolId, subjectId });
    if (subject) {
      // Update subject name if different
      if (subject.name !== name) {
        subject.name = name;
        await subject.save();
      }
      return res.json(subject);
    }

    subject = new Subject({ schoolId, subjectId, name });
    await subject.save();
    res.status(201).json(subject);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
}

// Get all subjects
export async function getSubjects(req, res) {
  try {
    const subjects = await Subject.find();
    res.status(200).json(subjects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Delete a subject by ID
export async function deleteSubject(req, res) {
  try {
    const { subjectId } = req.params;
    await Subject.findByIdAndDelete(subjectId);
    res.json({ message: "Subject deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Get all teacher assignments
export async function getAssignments(req, res) {
  try {
    const assignments = await TeacherClassSubject.find()
      .populate("teacherId", "name email")
      .populate("classId", "grade division schoolId")
      .populate("subjectId", "name subjectId")
      .populate("classId.schoolId", "name")
      .sort({ createdAt: -1 });

    // Transform the data to include readable names
    const transformedAssignments = assignments.map((assignment) => ({
      _id: assignment._id,
      teacherId: assignment.teacherId._id,
      teacherName: assignment.teacherId.name,
      teacherEmail: assignment.teacherId.email,
      classId: assignment.classId._id,
      className: `Grade ${assignment.classId.grade} - Division ${assignment.classId.division}`,
      schoolName: assignment.classId.schoolId?.name || "Unknown School",
      subjectId: assignment.subjectId._id,
      subjectName: assignment.subjectId.name,
      subjectCode: assignment.subjectId.subjectId,
      assignedAt: assignment.assignedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: transformedAssignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Assign teacher to class + subject
export async function assignTeacher(req, res) {
  try {
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
    console.error("Assign teacher error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Remove teacher assignment by ID
export async function removeAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const deletedAssignment = await TeacherClassSubject.findByIdAndDelete(
      assignmentId
    );

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
    console.error("Remove assignment error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

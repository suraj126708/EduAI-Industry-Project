// controllers/adminController.js
import User from "../models/User.js";
import { validationResult } from "express-validator";
import admin from "../config/firebase.js";

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getAdminDashboard = async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const inactiveUsers = await User.countDocuments({ status: "inactive" });
    const suspendedUsers = await User.countDocuments({ status: "suspended" });

    // Get role statistics
    const userCount = await User.countDocuments({ role: "user" });
    const moderatorCount = await User.countDocuments({ role: "moderator" });
    const adminCount = await User.countDocuments({ role: "admin" });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("email displayName role status createdAt");

    const recentlyActiveUsers = await User.find()
      .sort({ lastActiveAt: -1 })
      .limit(5)
      .select("email displayName role lastActiveAt");

    // Get monthly user growth
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

    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonth },
    });

    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth, $lt: thisMonth },
    });

    res.status(200).json({
      success: true,
      message: "Admin dashboard data retrieved successfully",
      data: {
        statistics: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          suspendedUsers,
          userCount,
          moderatorCount,
          adminCount,
          usersThisMonth,
          usersLastMonth,
          growthRate:
            usersLastMonth > 0
              ? (
                  ((usersThisMonth - usersLastMonth) / usersLastMonth) *
                  100
                ).toFixed(2)
              : 0,
        },
        recentActivity: {
          newUsers: recentUsers,
          activeUsers: recentlyActiveUsers,
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
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          verifiedUsers: {
            $sum: { $cond: ["$isEmailVerified", 1, 0] },
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
          totalUsers: 0,
          activeUsers: 0,
          verifiedUsers: 0,
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

// @desc    Get all users with advanced filtering (Admin only)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
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
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: "i" } },
        { displayName: { $regex: req.query.search, $options: "i" } },
        { "profile.firstName": { $regex: req.query.search, $options: "i" } },
        { "profile.lastName": { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Build sort query
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("-preferences -__v");

    const totalUsers = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page < Math.ceil(totalUsers / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUserById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserRole = async (req, res) => {
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

    // Prevent admin from changing their own role
    if (userId === req.user._id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldRole = user.role;
    user.role = role;

    // Update Firebase custom claims if needed
    try {
      await admin.auth().setCustomUserClaims(user.firebaseUid, {
        role: role,
        updatedBy: req.user._id,
        updatedAt: new Date().toISOString(),
      });
    } catch (firebaseError) {
      console.error("Firebase custom claims update error:", firebaseError);
      // Continue with database update even if Firebase fails
    }

    await user.save();

    console.log(
      `🔧 Admin ${req.user.email} changed user ${user.email} role from ${oldRole} to ${role}`
    );

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          oldRole,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update user status (Admin only)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = async (req, res) => {
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

    // Prevent admin from changing their own status
    if (userId === req.user._id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own status",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldStatus = user.status;
    user.status = status;

    await user.save();

    console.log(
      `🔧 Admin ${req.user.email} changed user ${user.email} status from ${oldStatus} to ${status}`
    );

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          status: user.status,
          oldStatus,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
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

    // Prevent admin from deleting themselves
    if (userId === req.user._id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete from Firebase (optional - you might want to keep Firebase user)
    try {
      await admin.auth().deleteUser(user.firebaseUid);
    } catch (firebaseError) {
      console.error("Firebase user deletion error:", firebaseError);
      // Continue with database deletion even if Firebase fails
    }

    await User.findByIdAndDelete(userId);

    console.log(`🗑️ Admin ${req.user.email} deleted user ${user.email}`);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {
        deletedUser: {
          _id: user._id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Bulk update users (Admin only)
// @route   POST /api/admin/users/bulk-update
// @access  Private (Admin)
export const bulkUpdateUsers = async (req, res) => {
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

    // Remove sensitive fields that shouldn't be bulk updated
    const safeUpdates = { ...updates };
    delete safeUpdates._id;
    delete safeUpdates.firebaseUid;
    delete safeUpdates.email;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: safeUpdates }
    );

    console.log(
      `🔧 Admin ${req.user.email} bulk updated ${result.modifiedCount} users`
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
    console.error("Bulk update users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update users",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Export users data (Admin only)
// @route   GET /api/admin/users/export
// @access  Private (Admin)
export const exportUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { format = "json", role, status } = req.query;

    // Build filter query
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select("-preferences -__v")
      .sort({ createdAt: -1 });

    if (format === "csv") {
      // Convert to CSV format
      const csvHeaders =
        "Email,Display Name,Role,Status,Created At,Last Active\n";
      const csvData = users
        .map(
          (user) =>
            `"${user.email}","${user.displayName || ""}","${user.role}","${
              user.status
            }","${user.createdAt}","${user.lastActiveAt}"`
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=users-export.csv"
      );
      res.send(csvHeaders + csvData);
    } else {
      // JSON format
      res.status(200).json({
        success: true,
        message: "Users exported successfully",
        data: {
          format: "json",
          totalUsers: users.length,
          users,
        },
      });
    }
  } catch (error) {
    console.error("Export users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export users",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

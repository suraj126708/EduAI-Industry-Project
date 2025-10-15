/**
 * Authentication Controller
 *
 * Handles user authentication, registration, profile management,
 * and Firebase token operations for the Teacher Management System.
 *
 * @author Teacher Management System Team
 * @version 1.0.0
 */

import admin from "../config/firebase.js";
import User from "../models/UserSchema.js";
import { validationResult } from "express-validator";

/**
 * Register teacher after Firebase authentication
 * @desc    Complete teacher registration with additional profile data
 * @route   POST /api/auth/register
 * @access  Private (requires Firebase token)
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
export const registerTeacher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, role, phone, schoolId } = req.body;

    const user = req.user;

    if (user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "User is not a teacher",
      });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (schoolId) user.schoolId = schoolId;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Teacher profile updated successfully",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Auth Error - Register teacher:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get current teacher profile
// @route   GET /api/auth/profile
// @access  Private
export const getTeacherProfile = async (req, res) => {
  try {
    const user = req.user;

    await user.updateLastLogin();

    res.status(200).json({
      success: true,
      message: "Teacher profile retrieved successfully",
      data: {
        user: user.toJSON(),
        firebaseData: {
          uid: req.firebaseUser.uid,
          email: req.firebaseUser.email,
          emailVerified: req.firebaseUser.email_verified,
          signInProvider: req.firebaseUser.firebase.sign_in_provider,
          authTime: new Date(req.firebaseUser.auth_time * 1000),
          issuedAt: new Date(req.firebaseUser.iat * 1000),
          expiresAt: new Date(req.firebaseUser.exp * 1000),
        },
      },
    });
  } catch (error) {
    console.error("Auth Error - Get teacher profile:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teacher profile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update teacher profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateTeacherProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const user = req.user;
    const updateData = req.body;

    const allowedUpdates = ["name", "role", "phone"];
    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Auth Error - Update teacher profile:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Delete teacher account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteTeacherAccount = async (req, res) => {
  try {
    const user = req.user;

    const firebaseUid = user.firebaseUid;

    // Delete teacher from Firebase
    await admin.auth().deleteUser(firebaseUid);

    // Delete teacher from MongoDB
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Auth Error - Delete teacher account:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Verify teacher token (health check for auth)
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
        tokenInfo: {
          uid: req.firebaseUser.uid,
          issuedAt: new Date(req.firebaseUser.iat * 1000),
          expiresAt: new Date(req.firebaseUser.exp * 1000),
          signInProvider: req.firebaseUser.firebase.sign_in_provider,
        },
      },
    });
  } catch (error) {
    console.error("Auth Error - Verify token:", error.message);
    res.status(500).json({
      success: false,
      message: "Token verification failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Create custom token (for server-side auth)
// @route   POST /api/auth/custom-token
// @access  Private (Admin only)
export const createCustomToken = async (req, res) => {
  try {
    const { uid, additionalClaims = {} } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "UID is required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const customToken = await admin
      .auth()
      .createCustomToken(uid, additionalClaims);

    res.status(200).json({
      success: true,
      message: "Custom token created successfully",
      data: {
        customToken,
        uid,
        additionalClaims,
      },
    });
  } catch (error) {
    console.error("Auth Error - Create custom token:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create custom token",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

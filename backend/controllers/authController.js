// controllers/authController.js
import admin from "../config/firebase.js";
import User from "../models/User.js";
import { validationResult } from "express-validator";

// @desc    Register user after Firebase auth
// @route   POST /api/auth/register
// @access  Private (requires Firebase token)
export const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { firstName, lastName, phoneNumber, bio, preferences } = req.body;

    // User is already authenticated via middleware, so we have req.user
    const user = req.user;

    // Update user profile with additional information
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phoneNumber) user.profile.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;

    // Update preferences if provided
    if (preferences) {
      if (preferences.theme) user.preferences.theme = preferences.theme;
      if (preferences.notifications) {
        Object.assign(
          user.preferences.notifications,
          preferences.notifications
        );
      }
      if (preferences.privacy) {
        Object.assign(user.preferences.privacy, preferences.privacy);
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Register user error:", error);
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

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    // Update last active time
    await user.updateLastActive();

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
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
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
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

    // Update basic fields
    const allowedUpdates = ["displayName", "photoURL"];
    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    // Update profile fields
    if (updateData.profile) {
      const profileUpdates = [
        "firstName",
        "lastName",
        "phoneNumber",
        "bio",
        "dateOfBirth",
        "location",
      ];
      profileUpdates.forEach((field) => {
        if (updateData.profile[field] !== undefined) {
          user.profile[field] = updateData.profile[field];
        }
      });
    }

    // Update preferences
    if (updateData.preferences) {
      if (updateData.preferences.theme) {
        user.preferences.theme = updateData.preferences.theme;
      }
      if (updateData.preferences.notifications) {
        Object.assign(
          user.preferences.notifications,
          updateData.preferences.notifications
        );
      }
      if (updateData.preferences.privacy) {
        Object.assign(user.preferences.privacy, updateData.preferences.privacy);
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update user profile error:", error);
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

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteUserAccount = async (req, res) => {
  try {
    const user = req.user;
    const firebaseUid = user.firebaseUid;

    // Delete user from Firebase
    await admin.auth().deleteUser(firebaseUid);

    // Delete user from MongoDB
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete user account error:", error);
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

// @desc    Verify user token (health check for auth)
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          displayName: req.user.displayName,
          role: req.user.role,
          status: req.user.status,
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
    console.error("Verify token error:", error);
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

    // Only allow admins to create custom tokens
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
    console.error("Create custom token error:", error);
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

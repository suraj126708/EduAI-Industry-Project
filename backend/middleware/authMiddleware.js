// Enhanced middlewares/authMiddleware.js - Complete RBAC Implementation
import admin from "../config/firebase.js";
import User from "../models/User.js";

// Middleware to verify Firebase ID token
export const authenticateFirebaseToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No valid token provided.",
        error: "MISSING_TOKEN",
      });
    }

    // Extract token
    const idToken = authHeader.split(" ")[1];

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No valid token provided.",
        error: "INVALID_TOKEN_FORMAT",
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if token is expired
    const now = Date.now() / 1000;
    if (decodedToken.exp < now) {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
        error: "TOKEN_EXPIRED",
      });
    }

    // Find or create user in MongoDB
    let user = await User.findByFirebaseUid(decodedToken.uid);

    if (!user) {
      // Create new user if doesn't exist
      const userData = {
        _id: decodedToken.uid,
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email?.split("@")[0],
        photoURL: decodedToken.picture || null,
        isEmailVerified: decodedToken.email_verified || false,
        authProvider: getAuthProvider(decodedToken.firebase.sign_in_provider),
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
        role: "user", // Default role for new users
      };

      user = new User(userData);
      await user.save();

      console.log(
        `✨ New user created: ${user.email} (${user.firebaseUid}) with role: ${user.role}`
      );
    } else {
      // Update last login and active time
      user.lastLoginAt = new Date();
      user.lastActiveAt = new Date();

      // Update user info if changed
      if (user.email !== decodedToken.email) user.email = decodedToken.email;
      if (user.displayName !== decodedToken.name && decodedToken.name) {
        user.displayName = decodedToken.name;
      }
      if (user.photoURL !== decodedToken.picture && decodedToken.picture) {
        user.photoURL = decodedToken.picture;
      }
      if (user.isEmailVerified !== decodedToken.email_verified) {
        user.isEmailVerified = decodedToken.email_verified;
      }

      await user.save({ validateBeforeSave: false });
    }

    // Check if user account is active
    if (!user.isActive()) {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
        error: "ACCOUNT_INACTIVE",
      });
    }

    // Attach user info to request object
    req.user = user;
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("🔒 Auth middleware error:", error.message);

    // Handle specific Firebase errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please sign in again.",
        error: "TOKEN_EXPIRED",
      });
    }

    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked. Please sign in again.",
        error: "TOKEN_REVOKED",
      });
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({
        success: false,
        message: "Invalid token format.",
        error: "INVALID_TOKEN",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
      error: "AUTH_FAILED",
    });
  }
};

// 🔥 Enhanced Role-Based Authorization Middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    // Check if user has any of the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(
          " or "
        )}. Your role: ${req.user.role}`,
        error: "INSUFFICIENT_PERMISSIONS",
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
    }

    console.log(
      `✅ User ${req.user.email} authorized with role: ${req.user.role}`
    );
    next();
  };
};

// 🔥 Permission-Based Authorization Middleware
export const checkPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    // Define role permissions
    const rolePermissions = {
      admin: [
        "create",
        "read",
        "update",
        "delete",
        "manage_users",
        "manage_roles",
        "view_analytics",
      ],
      moderator: ["create", "read", "update", "delete", "manage_posts"],
      editor: ["create", "read", "update"],
      user: ["read", "update_own"],
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    // Check if user has all required permissions
    const hasAllPermissions = permissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permissions: ${permissions.join(
          ", "
        )}`,
        error: "INSUFFICIENT_PERMISSIONS",
        userRole: req.user.role,
        userPermissions,
        requiredPermissions: permissions,
      });
    }

    console.log(
      `✅ User ${
        req.user.email
      } authorized with permissions: ${permissions.join(", ")}`
    );
    next();
  };
};

// 🔥 Resource Ownership Middleware
export const checkOwnership = (resourceField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    // Admin and moderator can access all resources
    if (["admin", "moderator"].includes(req.user.role)) {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId =
      req.params.id || req.body[resourceField] || req.query[resourceField];

    if (resourceUserId && resourceUserId !== req.user._id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources.",
        error: "RESOURCE_ACCESS_DENIED",
      });
    }

    next();
  };
};

// 🔥 Dynamic Role Check Middleware
export const checkRole = (getRoleFromRequest) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    const requiredRole = getRoleFromRequest(req);

    if (!requiredRole) {
      return res.status(400).json({
        success: false,
        message: "Required role not specified.",
        error: "ROLE_NOT_SPECIFIED",
      });
    }

    if (req.user.role !== requiredRole && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${requiredRole}`,
        error: "INSUFFICIENT_PERMISSIONS",
      });
    }

    next();
  };
};

// 🔥 Multiple Role Strategy Middleware
export const authorizeMultiple = (roleConfig) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    // roleConfig example: { admin: true, moderator: ['read', 'update'], user: ['read'] }
    const userRole = req.user.role;
    const roleAccess = roleConfig[userRole];

    if (!roleAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Your role is not authorized.",
        error: "ROLE_NOT_AUTHORIZED",
      });
    }

    // If role has full access (true)
    if (roleAccess === true) {
      return next();
    }

    // If role has specific permissions (array)
    if (Array.isArray(roleAccess)) {
      const method = req.method.toLowerCase();
      const methodPermissionMap = {
        get: "read",
        post: "create",
        put: "update",
        patch: "update",
        delete: "delete",
      };

      const requiredPermission = methodPermissionMap[method];

      if (!roleAccess.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Your role does not have ${requiredPermission} permission.`,
          error: "PERMISSION_DENIED",
        });
      }
    }

    next();
  };
};

// Middleware for optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue without authentication
    }

    const idToken = authHeader.split(" ")[1];
    if (!idToken) {
      return next(); // Continue without authentication
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await User.findByFirebaseUid(decodedToken.uid);

    if (user && user.isActive()) {
      req.user = user;
      req.firebaseUser = decodedToken;

      // Update last active time
      await user.updateLastActive();
    }

    next();
  } catch (error) {
    // If optional auth fails, just continue without user
    console.warn("⚠️ Optional auth failed:", error.message);
    next();
  }
};

// Helper function to determine auth provider
const getAuthProvider = (signInProvider) => {
  const providerMap = {
    password: "email",
    "google.com": "google",
    "facebook.com": "facebook",
    "twitter.com": "twitter",
    "github.com": "github",
  };

  return providerMap[signInProvider] || "email";
};

// Export default middleware
export default authenticateFirebaseToken;

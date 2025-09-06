// Enhanced middlewares/authMiddleware.js - Complete RBAC Implementation
import admin from "../config/firebase.js";
import Teacher from "../models/Teacher.js";

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

    // Find or create teacher in MongoDB
    let teacher = await Teacher.findByFirebaseUid(decodedToken.uid);

    if (!teacher) {
      // Create new teacher if doesn't exist
      const teacherData = {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split("@")[0],
        role: "teacher", // Default role for new teachers
        lastLoginAt: new Date(),
        status: "active",
      };

      teacher = new Teacher(teacherData);
      await teacher.save();

      console.log(
        `✨ New teacher created: ${teacher.email} (${teacher.firebaseUid}) with role: ${teacher.role}`
      );
    } else {
      // Update last login time
      teacher.lastLoginAt = new Date();

      // Update teacher info if changed
      if (teacher.email !== decodedToken.email)
        teacher.email = decodedToken.email;
      if (teacher.name !== decodedToken.name && decodedToken.name) {
        teacher.name = decodedToken.name;
      }

      await teacher.save({ validateBeforeSave: false });
    }

    // Check if teacher account is active
    if (!teacher.isActive()) {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
        error: "ACCOUNT_INACTIVE",
      });
    }

    // Attach teacher info to request object
    req.teacher = teacher;
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
    if (!req.teacher) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Teacher not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    // Check if teacher has any of the allowed roles
    if (!allowedRoles.includes(req.teacher.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(
          " or "
        )}. Your role: ${req.teacher.role}`,
        error: "INSUFFICIENT_PERMISSIONS",
        teacherRole: req.teacher.role,
        requiredRoles: allowedRoles,
      });
    }

    console.log(
      `✅ Teacher ${req.teacher.email} authorized with role: ${req.teacher.role}`
    );
    next();
  };
};

// 🔥 Permission-Based Authorization Middleware
export const checkPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.teacher) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Teacher not authenticated.",
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
        "manage_teachers",
        "manage_roles",
        "view_analytics",
      ],
      moderator: ["create", "read", "update", "delete", "manage_posts"],
      editor: ["create", "read", "update"],
      teacher: ["read", "update_own"],
    };

    const teacherPermissions = rolePermissions[req.teacher.role] || [];

    // Check if teacher has all required permissions
    const hasAllPermissions = permissions.every((permission) =>
      teacherPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permissions: ${permissions.join(
          ", "
        )}`,
        error: "INSUFFICIENT_PERMISSIONS",
        teacherRole: req.teacher.role,
        teacherPermissions,
        requiredPermissions: permissions,
      });
    }

    console.log(
      `✅ Teacher ${
        req.teacher.email
      } authorized with permissions: ${permissions.join(", ")}`
    );
    next();
  };
};

// 🔥 Resource Ownership Middleware
export const checkOwnership = (resourceField = "teacherId") => {
  return (req, res, next) => {
    if (!req.teacher) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Teacher not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    // Admin and moderator can access all resources
    if (["admin", "moderator"].includes(req.teacher.role)) {
      return next();
    }

    // Check if teacher owns the resource
    const resourceTeacherId =
      req.params.id || req.body[resourceField] || req.query[resourceField];

    if (resourceTeacherId && resourceTeacherId !== req.teacher._id) {
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
    if (!req.teacher) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Teacher not authenticated.",
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

    if (req.teacher.role !== requiredRole && req.teacher.role !== "admin") {
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
    if (!req.teacher) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Teacher not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    // roleConfig example: { admin: true, moderator: ['read', 'update'], teacher: ['read'] }
    const teacherRole = req.teacher.role;
    const roleAccess = roleConfig[teacherRole];

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
    const teacher = await Teacher.findByFirebaseUid(decodedToken.uid);

    if (teacher && teacher.isActive()) {
      req.teacher = teacher;
      req.firebaseUser = decodedToken;

      // Update last login time
      await teacher.updateLastLogin();
    }

    next();
  } catch (error) {
    // If optional auth fails, just continue without teacher
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

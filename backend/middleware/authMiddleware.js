import admin from "../config/firebase.js";
import User from "../models/UserSchema.js";

// Middleware to verify Firebase ID token and attach user to request
export const authenticateFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No valid token provided.",
        error: "MISSING_TOKEN",
      });
    }

    const idToken = authHeader.split(" ")[1];

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No valid token provided.",
        error: "INVALID_TOKEN_FORMAT",
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const now = Date.now() / 1000;
    if (decodedToken.exp < now) {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
        error: "TOKEN_EXPIRED",
      });
    }

    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      const userData = {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split("@")[0],
        role: "teacher", // Default role can be adjusted here
        lastLoginAt: new Date(),
        status: "active",
      };
      user = new User(userData);
      await user.save();

      console.log(
        `✨ New user created: ${user.email} (${user.firebaseUid}) with role: ${user.role}`
      );
    } else {
      user.lastLoginAt = new Date();

      if (user.email !== decodedToken.email) user.email = decodedToken.email;
      if (user.name !== decodedToken.name && decodedToken.name)
        user.name = decodedToken.name;

      await user.save({ validateBeforeSave: false });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
        error: "ACCOUNT_INACTIVE",
      });
    }

    req.user = user;
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("🔒 Auth middleware error:", error.message);

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

// Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

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

// Permission-based authorization middleware
export const checkPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

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

    const userPermissions = rolePermissions[req.user.role] || [];

    const hasAllPermissions = permissions.every((perm) =>
      userPermissions.includes(perm)
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

// Check resource ownership middleware
export const checkOwnership = (resourceField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    if (["admin", "moderator"].includes(req.user.role)) return next();

    const resourceUserId =
      req.params.id || req.body[resourceField] || req.query[resourceField];

    if (resourceUserId && resourceUserId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources.",
        error: "RESOURCE_ACCESS_DENIED",
      });
    }

    next();
  };
};

// Dynamic role check middleware
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

// Multiple role strategy middleware: supports object mapping of roles to permissions or boolean
export const authorizeMultiple = (roleConfig) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
        error: "NOT_AUTHENTICATED",
      });
    }

    const userRole = req.user.role;
    const roleAccess = roleConfig[userRole];

    if (!roleAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Your role is not authorized.",
        error: "ROLE_NOT_AUTHORIZED",
      });
    }

    if (roleAccess === true) {
      return next();
    }

    if (Array.isArray(roleAccess)) {
      const method = req.method.toLowerCase();
      const permissionMap = {
        get: "read",
        post: "create",
        put: "update",
        patch: "update",
        delete: "delete",
      };

      const requiredPermission = permissionMap[method];

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

// Optional authentication middleware that does not block unauthenticated access
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const idToken = authHeader.split(" ")[1];
    if (!idToken) return next();

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (user && user.status === "active") {
      req.user = user;
      req.firebaseUser = decodedToken;
      // Optionally update last login here
      user.lastLoginAt = new Date();
      await user.save({ validateBeforeSave: false });
    }

    next();
  } catch (error) {
    console.warn("⚠️ Optional auth failed:", error.message);
    next();
  }
};

export default authenticateFirebaseToken;

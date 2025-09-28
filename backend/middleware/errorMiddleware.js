/**
 * Error Middleware
 *
 * Handles global error processing, custom error classes,
 * and standardized error responses for the Teacher Management System.
 *
 * @author Teacher Management System Team
 * @version 1.0.0
 */

/**
 * Custom Error class for application-specific errors
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error("Error Details:", {
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.email || "Anonymous",
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  // Firebase Admin SDK errors
  if (err.code?.startsWith("auth/")) {
    const firebaseErrors = {
      "auth/id-token-expired": {
        message: "Token has expired",
        statusCode: 401,
      },
      "auth/id-token-revoked": {
        message: "Token has been revoked",
        statusCode: 401,
      },
      "auth/invalid-id-token": { message: "Invalid token", statusCode: 401 },
      "auth/user-not-found": { message: "User not found", statusCode: 404 },
      "auth/insufficient-permission": {
        message: "Insufficient permissions",
        statusCode: 403,
      },
    };

    const firebaseError = firebaseErrors[err.code];
    if (firebaseError) {
      error = new AppError(firebaseError.message, firebaseError.statusCode);
    }
  }

  // JSON Web Token errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new AppError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new AppError(message, 401);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = "Too many requests, please try again later";
    error = new AppError(message, 429);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      error: err,
      stack: err.stack,
    }),
  });
};

/**
 * Async error handler wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

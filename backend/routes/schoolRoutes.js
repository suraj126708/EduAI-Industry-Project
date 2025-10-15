// routes/schoolRoutes.js

import express from "express";
import {
  createSchool, // Assuming this is in adminController.js
  getSchools, // Assuming this is in adminController.js
} from "../controllers/adminController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// This file will handle routes prefixed with /api/superadmin

// @route   GET /api/superadmin/schools
// @desc    Get all schools (Superadmin only)
// @access  Private (Superadmin)
router.get(
  "/schools",
  authenticateFirebaseToken,
  authorize("superadmin"),
  getSchools
);

// @route   POST /api/superadmin/schools
// @desc    Create a school and its principal (Superadmin only)
// @access  Private (Superadmin)
router.post(
  "/schools",
  authenticateFirebaseToken,
  authorize("superadmin"),
  createSchool // The controller that creates the school and principal
);

export default router;

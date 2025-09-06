// routes/userRoutes.js
import express from "express";
import { body, param } from "express-validator";
import { getAllUsers } from "../controllers/userController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only) - DEPRECATED: Use /api/admin/users instead
// @access  Private (Admin)
router.get("/", authenticateFirebaseToken, authorize("admin"), getAllUsers);

export default router;

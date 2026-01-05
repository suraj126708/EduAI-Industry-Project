// routes/schoolRoutes.js

import express from "express";
import {
  createSchool,
  getSchools,
  registerSchool,
  verifySchool,
} from "../controllers/schoolController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", authenticateFirebaseToken, registerSchool);

router.get(
  "/schools",
  authenticateFirebaseToken,
  authorize("superadmin"),
  getSchools
);

router.post(
  "/schools",
  authenticateFirebaseToken,
  authorize("superadmin"),
  createSchool
);

router.put(
  "/schools/:id/verify",
  authenticateFirebaseToken,
  authorize("superadmin"),
  verifySchool
);

export default router;

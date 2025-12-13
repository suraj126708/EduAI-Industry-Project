import express from "express";
import {
  uploadAnswerSheetForEvaluation,
  getEvaluationReport,
  getEvaluationsByClass,
  generateSemesterReport,
  getSemesterReportById,
  checkSemesterReports,
} from "../controllers/evaluationController.js"; // We will create this controller next
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";
import { uploadAnswerSheet } from "../middleware/uploadMiddleware.js";
//import { auth } from "firebase-admin";

const router = express.Router();

router.post(
  "/upload",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  uploadAnswerSheet.single("answerSheet"), // "answerSheet" must match the FormData key
  uploadAnswerSheetForEvaluation
);

router.get(
  "/class/status",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  getEvaluationsByClass
);

router.get(
  "/:id",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  getEvaluationReport
);

router.post(
  "/semester",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  generateSemesterReport
);

router.get(
  "/semester-report/:id",
  authenticateFirebaseToken,
  authorize("principal"),
  getSemesterReportById
);

router.post(
  "/semester/check-status",
  authenticateFirebaseToken,
  authorize("principal"),
  checkSemesterReports
);

export default router;

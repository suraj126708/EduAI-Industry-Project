import express from "express";
import { uploadAnswerSheetForEvaluation } from "../controllers/evaluationController.js"; // We will create this controller next
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";
import { uploadAnswerSheet } from "../middleware/uploadMiddleware.js";
//import { auth } from "firebase-admin";

const router = express.Router();

// Route to handle answer sheet upload
router.post(
  "/upload",
  authenticateFirebaseToken,
  authorize("teacher", "principal"),
  uploadAnswerSheet.single("answerSheet"), // "answerSheet" must match the FormData key
  uploadAnswerSheetForEvaluation
);

export default router;

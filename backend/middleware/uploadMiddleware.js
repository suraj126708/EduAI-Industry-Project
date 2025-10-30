/**
 * Upload Middleware
 *
 * Handles file uploads for PDFs, Excel files, and other documents
 * with proper validation and storage configuration.
 *
 * @author Teacher Management System Team
 * @version 1.0.0
 */

import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Configure multer storage to save files in 'uploads' folder with original names
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads";
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (err) {
      return cb(err, uploadDir);
    }
    cb(null, uploadDir + "/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

/**
 * File filter for general uploads (Excel, CSV, PDF)
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  // Accept Excel, CSV, and PDF files
  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "text/csv" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only Excel, CSV, and PDF files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
});

/**
 * PDF-specific file filter with larger file size limit
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const pdfFileFilter = (req, file, cb) => {
  // Accept only PDF files
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF files are allowed."), false);
  }
};

const pdfUpload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit 50MB for PDFs
});

export const uploadAnswerSheet = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export { pdfUpload };
export default upload;

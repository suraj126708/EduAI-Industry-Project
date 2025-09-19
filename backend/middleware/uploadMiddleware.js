import multer from "multer";
import path from "path";

// Configure multer storage to save files in 'uploads' folder with original names
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

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

// PDF-specific upload middleware with larger file size limit
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

export { pdfUpload };
export default upload;

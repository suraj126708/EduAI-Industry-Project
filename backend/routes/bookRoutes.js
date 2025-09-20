// routes/bookRoutes.js
import express from "express";
import { body, param, query } from "express-validator";
import {
  uploadBook,
  getAllBooks,
  getBookById,
  updateBookStatus,
  deleteBook,
  getBooksByFilter,
} from "../controllers/bookController.js";
import {
  authenticateFirebaseToken,
  authorize,
} from "../middleware/authMiddleware.js";
import { pdfUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Validation middleware
const bookIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Book ID is required")
    .isMongoId()
    .withMessage("Invalid book ID format"),
];

const uploadBookValidation = [
  body("classValue")
    .notEmpty()
    .withMessage("Class is required")
    .matches(/^(0[1-9]|1[0-2])$/)
    .withMessage("Class must be between 01 and 12"),
  body("subjectValue")
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Subject must be between 1 and 50 characters"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("author")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Author must be between 1 and 100 characters"),
  body("year")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage("Year must be between 1900 and current year + 5"),
];

const updateStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "processed", "failed"])
    .withMessage("Status must be 'pending', 'processed', or 'failed'"),
];

const filterValidation = [
  query("classValue")
    .optional()
    .matches(/^(0[1-9]|1[0-2])$/)
    .withMessage("Class must be between 01 and 12"),
  query("subjectValue")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Subject must be between 1 and 50 characters"),
];

/**
 * @swagger
 * /api/books/upload:
 *   post:
 *     summary: Upload book PDF
 *     description: Upload a book PDF file with metadata
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdf
 *               - classValue
 *               - subjectValue
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload
 *               classValue:
 *                 type: string
 *                 pattern: "^(0[1-9]|1[0-2])$"
 *                 example: "10"
 *                 description: Class (01-12)
 *               subjectValue:
 *                 type: string
 *                 example: "Mathematics"
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Subject name
 *               title:
 *                 type: string
 *                 example: "Advanced Mathematics"
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Book title
 *               author:
 *                 type: string
 *                 example: "Dr. Smith"
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Book author
 *               year:
 *                 type: integer
 *                 example: 2023
 *                 minimum: 1900
 *                 maximum: 2028
 *                 description: Publication year
 *     responses:
 *       201:
 *         description: Book uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Book uploaded successfully"
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error or file upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/upload",
  authenticateFirebaseToken,
  authorize(["teacher", "admin"]),
  pdfUpload.single("pdf"),
  uploadBookValidation,
  uploadBook
);

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     description: Retrieve a list of all books
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", authenticateFirebaseToken, getAllBooks);

/**
 * @swagger
 * /api/books/filter:
 *   get:
 *     summary: Get books by filter
 *     description: Retrieve books filtered by class and subject
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classValue
 *         schema:
 *           type: string
 *           pattern: "^(0[1-9]|1[0-2])$"
 *           example: "10"
 *         description: Class filter (01-12)
 *       - in: query
 *         name: subjectValue
 *         schema:
 *           type: string
 *           example: "Mathematics"
 *           minLength: 1
 *           maxLength: 50
 *         description: Subject filter
 *     responses:
 *       200:
 *         description: Filtered books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid filter parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/filter",
  authenticateFirebaseToken,
  filterValidation,
  getBooksByFilter
);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     description: Retrieve a specific book by its ID
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         description: MongoDB ObjectId of the book
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid book ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authenticateFirebaseToken, bookIdValidation, getBookById);

/**
 * @swagger
 * /api/books/{id}/status:
 *   put:
 *     summary: Update book processing status
 *     description: Update the processing status of a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         description: MongoDB ObjectId of the book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processed, failed]
 *                 example: "processed"
 *                 description: New processing status
 *     responses:
 *       200:
 *         description: Book status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Book status updated successfully"
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/status",
  authenticateFirebaseToken,
  authorize(["teacher", "admin"]),
  bookIdValidation,
  updateStatusValidation,
  updateBookStatus
);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete book
 *     description: Permanently delete a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         description: MongoDB ObjectId of the book
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Book deleted successfully"
 *       400:
 *         description: Invalid book ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  authenticateFirebaseToken,
  authorize(["teacher", "admin"]),
  bookIdValidation,
  deleteBook
);

export default router;

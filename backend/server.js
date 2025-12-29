/**
 * Teacher Management System Backend Server
 *
 * This is the main server file for the Teacher Management System API.
 * It handles authentication, teacher management, question paper generation,
 * and administrative functions.
 *
 * @author Teacher Management System Team
 * @version 1.0.0
 */

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import evaluationRoute from "./routes/evaluationRoutes.js";

// Import database connection
import connectDB from "./config/db.js";

// Import Firebase configuration
import "./config/firebase.js";

// Import error middleware
import { errorHandler } from "./middleware/errorMiddleware.js";

// Import Swagger configuration
import { specs, swaggerUi } from "./config/swagger.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS middleware configuration
const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};
app.use(cors(corsOptions));

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser middlewar
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Swagger API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Teacher Management System API Documentation",
  })
);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API server is running and healthy
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy and running
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
 *                   example: "Teacher Management System Backend is running!"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 environment:
 *                   type: string
 *                   example: "development"
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Teacher Management System Backend is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", schoolRoutes);
app.use("/api/evaluation", evaluationRoute);
//app.use("/api/books", bookRoutes);

// ✅ NEW (Works in Express v5)
app.use("/{*catchall}", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown handlers
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT. Graceful shutdown...");
  mongoose.connection.close(() => {
    console.log("📊 MongoDB connection closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM. Graceful shutdown...");
  mongoose.connection.close(() => {
    console.log("📊 MongoDB connection closed.");
    process.exit(0);
  });
});

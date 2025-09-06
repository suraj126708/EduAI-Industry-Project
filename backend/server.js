// server.js
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

// Import database connection
import connectDB from "./config/db.js";

// Import Firebase configuration
import "./config/firebase.js";

// Import error middleware
import { errorHandler } from "./middleware/errorMiddleware.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
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

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check route
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
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log("\n======================================\n");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Graceful shutdown...");
  mongoose.connection.close(() => {
    console.log("📊 MongoDB connection closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM. Graceful shutdown...");
  mongoose.connection.close(() => {
    console.log("📊 MongoDB connection closed.");
    process.exit(0);
  });
});

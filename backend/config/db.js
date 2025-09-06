// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Remove deprecated options that are now defaults in Mongoose 6+
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    // MongoDB connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;

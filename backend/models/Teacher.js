import mongoose from "mongoose";

const teacherProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    specialization: String,
    experienceYears: Number,
    // Add other teacher-specific fields here
  },
  {
    timestamps: true,
    collection: "teachers",
  }
);

const TeacherProfile = mongoose.model("TeacherProfile", teacherProfileSchema);

export default TeacherProfile;

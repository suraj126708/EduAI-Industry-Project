import mongoose from "mongoose";

const teacherProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: false, // Made optional since teachers can exist as User documents
    },
    specialization: {
      type: String,
      trim: true,
    },
    experienceYears: {
      type: Number,
      min: 0,
      max: 50,
    },
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    // Add other teacher-specific fields here
  },
  {
    timestamps: true,
    collection: "teachers",
  }
);

const TeacherProfile = mongoose.model("TeacherProfile", teacherProfileSchema);

export default TeacherProfile;

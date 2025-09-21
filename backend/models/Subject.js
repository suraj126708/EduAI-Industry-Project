import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    classDivisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassDivision",
      required: false,
    },
    rollNumber: Number,
    admissionDate: Date,
    parentContact: String,
    parentEmail: String,
    // Add more student-specific fields if needed
  },
  {
    timestamps: true,
    collection: "studentprofiles",
  }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;

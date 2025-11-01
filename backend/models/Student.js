import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // No userId link, standalone student schema
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true, // Index for faster queries
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: String,
      required: true,
    },
    div: {
      type: String,
      required: true,
    },
    rollNo: {
      type: Number,
      required: true,
    },
    parentContact: {
      type: String,
      required: false,
    },
    parentEmail: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "students",
  }
);

// Ensure uniqueness per class/div/rollNo
studentSchema.index(
  { schoolId: 1, class: 1, div: 1, rollNo: 1 },
  { unique: true }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;

import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    subjectId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Add other subject-specific fields if needed
  },
  {
    timestamps: true,
    collection: "subjects",
  }
);

// Unique index to enforce unique subjectId per school
subjectSchema.index({ schoolId: 1, subjectId: 1 }, { unique: true });

// Optional: transform output to remove __v
subjectSchema.methods.toJSON = function () {
  const subjectObject = this.toObject();
  delete subjectObject.__v;
  return subjectObject;
};

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;

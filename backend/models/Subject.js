// models/Subject.js
import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "subjects",
  }
);

// Indexes
subjectSchema.index({ schoolId: 1 });
subjectSchema.index({ code: 1 });
subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });
subjectSchema.index({ name: 1 });

// Instance methods
subjectSchema.methods.getSchool = function () {
  return mongoose.model("School").findById(this.schoolId);
};

// Static methods
subjectSchema.statics.findBySchool = function (schoolId) {
  return this.find({ schoolId });
};

subjectSchema.statics.findByCode = function (code) {
  return this.findOne({ code });
};

subjectSchema.statics.findByName = function (name) {
  return this.find({ name: { $regex: name, $options: "i" } });
};

subjectSchema.statics.findBySchoolAndCode = function (schoolId, code) {
  return this.findOne({ schoolId, code });
};

// Transform output
subjectSchema.methods.toJSON = function () {
  const subjectObject = this.toObject();
  delete subjectObject.__v;
  return subjectObject;
};

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;

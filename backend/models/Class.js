import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    grade: {
      type: Number,
      required: true,
      min: 1,
      max: 12, // You can adjust max grade as needed
    },

    division: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10, // e.g., "A", "B", or "10-A"
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "classes",
  }
);

// Indexes
classSchema.index({ schoolId: 1 });
classSchema.index({ grade: 1 });
classSchema.index({ division: 1 });
classSchema.index({ schoolId: 1, grade: 1, division: 1 }, { unique: true });

// Instance methods
classSchema.methods.getSchool = function () {
  return mongoose.model("School").findById(this.schoolId);
};

// Static methods
classSchema.statics.findBySchool = function (schoolId) {
  return this.find({ schoolId });
};

classSchema.statics.findByGrade = function (grade) {
  return this.find({ grade });
};

classSchema.statics.findByDivision = function (division) {
  return this.find({ division: { $regex: division, $options: "i" } });
};

classSchema.statics.findBySchoolGradeDivision = function (
  schoolId,
  grade,
  division
) {
  return this.findOne({ schoolId, grade, division });
};

// Transform output
classSchema.methods.toJSON = function () {
  const classObject = this.toObject();
  delete classObject.__v;
  return classObject;
};

const Class = mongoose.model("Class", classSchema);

export default Class;

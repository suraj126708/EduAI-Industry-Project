// models/Class.js
import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "classes",
  }
);

// Indexes
classSchema.index({ schoolId: 1 });
classSchema.index({ name: 1 });
classSchema.index({ schoolId: 1, name: 1 }, { unique: true });

// Instance methods
classSchema.methods.getSchool = function () {
  return mongoose.model("School").findById(this.schoolId);
};

// Static methods
classSchema.statics.findBySchool = function (schoolId) {
  return this.find({ schoolId });
};

classSchema.statics.findByName = function (name) {
  return this.find({ name: { $regex: name, $options: "i" } });
};

classSchema.statics.findBySchoolAndName = function (schoolId, name) {
  return this.findOne({ schoolId, name });
};

// Transform output
classSchema.methods.toJSON = function () {
  const classObject = this.toObject();
  delete classObject.__v;
  return classObject;
};

const Class = mongoose.model("Class", classSchema);

export default Class;

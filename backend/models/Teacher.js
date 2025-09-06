// models/Teacher.js
import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: false, // Made optional for Firebase auth
    },

    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      default: "teacher",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    password: {
      type: String,
      required: false, // Made optional for Firebase auth
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "teachers",
  }
);

// Indexes
teacherSchema.index({ schoolId: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ name: 1 });
teacherSchema.index({ role: 1 });
teacherSchema.index({ firebaseUid: 1 });
teacherSchema.index({ status: 1 });

// Instance methods
teacherSchema.methods.getSchool = function () {
  return mongoose.model("School").findById(this.schoolId);
};

teacherSchema.methods.isActive = function () {
  return this.status === "active";
};

teacherSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static methods
teacherSchema.statics.findBySchool = function (schoolId) {
  return this.find({ schoolId });
};

teacherSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

teacherSchema.statics.findByRole = function (role) {
  return this.find({ role });
};

teacherSchema.statics.findByName = function (name) {
  return this.find({ name: { $regex: name, $options: "i" } });
};

teacherSchema.statics.findByFirebaseUid = function (firebaseUid) {
  return this.findOne({ firebaseUid });
};

// Pre-save middleware
teacherSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Transform output (remove sensitive fields)
teacherSchema.methods.toJSON = function () {
  const teacherObject = this.toObject();
  delete teacherObject.__v;
  delete teacherObject.password;
  return teacherObject;
};

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;

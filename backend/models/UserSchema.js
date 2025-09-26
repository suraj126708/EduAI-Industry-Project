import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: false,
    },

    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
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
      enum: ["admin", "teacher", "student"],
      default: "student",
      trim: true,
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
      required: false,
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
    timestamps: true,
    collection: "users",
  }
);

// Indexes
UserSchema.index({ schoolId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ name: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ firebaseUid: 1 });
UserSchema.index({ status: 1 });

// Instance methods
UserSchema.methods.isActive = function () {
  return this.status === "active";
};

UserSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save({ validateBeforeSave: false });
};

// Pre-save middleware
UserSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Transform output to hide sensitive fields
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.__v;
  delete userObject.password;
  return userObject;
};

const User = mongoose.model("User", UserSchema);

export default User;

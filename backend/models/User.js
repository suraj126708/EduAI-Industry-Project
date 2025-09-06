// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Firebase UID as the primary identifier
    _id: {
      type: String, // Using Firebase UID as _id
      required: true,
    },

    // Basic user information
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    photoURL: {
      type: String,
      default: null,
    },

    // Additional user profile data
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      phoneNumber: {
        type: String,
        trim: true,
      },
      bio: {
        type: String,
        maxlength: 500,
      },
      dateOfBirth: {
        type: Date,
      },
      location: {
        type: String,
        maxlength: 100,
      },
    },

    // User preferences and settings
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      privacy: {
        profileVisible: { type: Boolean, default: true },
        emailVisible: { type: Boolean, default: false },
      },
    },

    // Account status and metadata
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "active",
    },

    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    // Firebase auth provider info
    authProvider: {
      type: String,
      enum: ["email", "google", "facebook", "twitter", "github"],
      default: "email",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Timestamps for user activity
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "users",
    // Disable automatic _id generation since we're using Firebase UID
    _id: false,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ "profile.firstName": 1, "profile.lastName": 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

userSchema.virtual("fullName").get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.displayName || this.email.split("@")[0];
});

userSchema.methods.updateLastActive = function () {
  this.lastActiveAt = new Date();
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.isActive = function () {
  return this.status === "active";
};

userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

userSchema.statics.findByFirebaseUid = function (firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getActiveUsers = function () {
  return this.find({ status: "active" });
};

userSchema.pre("save", function (next) {
  if (this.firebaseUid && !this._id) {
    this._id = this.firebaseUid;
  }

  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  next();
});

// Transform output (remove sensitive fields)
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  // Remove sensitive fields from output
  delete userObject.__v;

  // Add virtual fullName
  userObject.fullName = this.fullName;

  return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;

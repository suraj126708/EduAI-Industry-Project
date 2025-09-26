import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // New fields
    type: {
      type: String,
      enum: ["government", "private", "public"],
      required: true,
    },

    establishedYear: {
      type: Number,
      min: 1800, // reasonable minimum year
      max: new Date().getFullYear(),
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    addressDetails: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },

    contact: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    emailDomain: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      // For example: to hold "vit.edu" to check teacher emails
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "schools",
  }
);

// Indexes
schoolSchema.index({ name: 1 });
schoolSchema.index({ createdAt: -1 });

// Instance methods
schoolSchema.methods.isActive = function () {
  return true; // Schools are always active unless explicitly deactivated
};

// Static methods
schoolSchema.statics.findByName = function (name) {
  return this.findOne({ name: { $regex: name, $options: "i" } });
};

schoolSchema.statics.findByContact = function (contact) {
  return this.findOne({ contact });
};

// Transform output
schoolSchema.methods.toJSON = function () {
  const schoolObject = this.toObject();
  delete schoolObject.__v;
  return schoolObject;
};

/**
 * Helper function to validate a teacher's email matches school's domain
 * @param {string} email - The teacher's email to validate
 * @returns {boolean} - true if matches school's email domain
 */
schoolSchema.methods.isValidTeacherEmail = function (email) {
  if (!email) return false;
  const emailDomain = this.emailDomain.toLowerCase();
  return email.toLowerCase().endsWith(`@${emailDomain}`);
};

const School = mongoose.model("School", schoolSchema);

export default School;

// models/School.js
import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
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

const School = mongoose.model("School", schoolSchema);

export default School;

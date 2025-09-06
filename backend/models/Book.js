// models/Book.js
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 5,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    processedStatus: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "books",
  }
);

// Indexes
bookSchema.index({ schoolId: 1 });
bookSchema.index({ classId: 1 });
bookSchema.index({ uploadedBy: 1 });
bookSchema.index({ processedStatus: 1 });
bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ year: 1 });
bookSchema.index({ createdAt: -1 });

// Instance methods
bookSchema.methods.getSchool = function () {
  return mongoose.model("School").findById(this.schoolId);
};

bookSchema.methods.getClass = function () {
  return mongoose.model("Class").findById(this.classId);
};

bookSchema.methods.getUploader = function () {
  return mongoose.model("Teacher").findById(this.uploadedBy);
};

bookSchema.methods.isProcessed = function () {
  return this.processedStatus === "processed";
};

bookSchema.methods.isPending = function () {
  return this.processedStatus === "pending";
};

// Static methods
bookSchema.statics.findBySchool = function (schoolId) {
  return this.find({ schoolId });
};

bookSchema.statics.findByClass = function (classId) {
  return this.find({ classId });
};

bookSchema.statics.findByUploader = function (uploadedBy) {
  return this.find({ uploadedBy });
};

bookSchema.statics.findByStatus = function (processedStatus) {
  return this.find({ processedStatus });
};

bookSchema.statics.findByTitle = function (title) {
  return this.find({ title: { $regex: title, $options: "i" } });
};

bookSchema.statics.findByAuthor = function (author) {
  return this.find({ author: { $regex: author, $options: "i" } });
};

bookSchema.statics.findByYear = function (year) {
  return this.find({ year });
};

bookSchema.statics.findProcessedBooks = function () {
  return this.find({ processedStatus: "processed" });
};

bookSchema.statics.findPendingBooks = function () {
  return this.find({ processedStatus: "pending" });
};

// Transform output
bookSchema.methods.toJSON = function () {
  const bookObject = this.toObject();
  delete bookObject.__v;
  return bookObject;
};

const Book = mongoose.model("Book", bookSchema);

export default Book;

// models/Book.js
import mongoose from "mongoose";

const BookSchema = new mongoose.Schema(
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
      required: false,
      trim: true,
      maxlength: 200,
    },

    author: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },

    year: {
      type: Number,
      required: false,
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

    noOfChunks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "books",
  }
);

// Indexes
BookSchema.index({ schoolId: 1 });
BookSchema.index({ classId: 1 });
BookSchema.index({ uploadedBy: 1 });
BookSchema.index({ processedStatus: 1 });
BookSchema.index({ title: 1 });
BookSchema.index({ author: 1 });
BookSchema.index({ year: 1 });
BookSchema.index({ createdAt: -1 });

// Instance methods
BookSchema.methods.getSchool = function () {
  return mongoose.model("School").findById(this.schoolId);
};

BookSchema.methods.getClass = function () {
  return mongoose.model("Class").findById(this.classId);
};

BookSchema.methods.getUploader = function () {
  return mongoose.model("Teacher").findById(this.uploadedBy);
};

BookSchema.methods.isProcessed = function () {
  return this.processedStatus === "processed";
};

BookSchema.methods.isPending = function () {
  return this.processedStatus === "pending";
};

// Static methods
BookSchema.statics.findBySchool = function (schoolId) {
  return this.find({ schoolId });
};

BookSchema.statics.findByClass = function (classId) {
  return this.find({ classId });
};

BookSchema.statics.findByUploader = function (uploadedBy) {
  return this.find({ uploadedBy });
};

BookSchema.statics.findByStatus = function (processedStatus) {
  return this.find({ processedStatus });
};

BookSchema.statics.findByTitle = function (title) {
  return this.find({ title: { $regex: title, $options: "i" } });
};

BookSchema.statics.findByAuthor = function (author) {
  return this.find({ author: { $regex: author, $options: "i" } });
};

BookSchema.statics.findByYear = function (year) {
  return this.find({ year });
};

BookSchema.statics.findProcessedBooks = function () {
  return this.find({ processedStatus: "processed" });
};

BookSchema.statics.findPendingBooks = function () {
  return this.find({ processedStatus: "pending" });
};

// Transform output
BookSchema.methods.toJSON = function () {
  const bookObject = this.toObject();
  delete bookObject.__v;
  return bookObject;
};

const Book = mongoose.model("Book", BookSchema);

export default Book;

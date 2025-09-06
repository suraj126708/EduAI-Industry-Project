// models/BookSubjectClass.js
import mongoose from "mongoose";

const bookSubjectClassSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "book_subject_classes",
  }
);

// Indexes
bookSubjectClassSchema.index({ bookId: 1 });
bookSubjectClassSchema.index({ subjectId: 1 });
bookSubjectClassSchema.index({ classId: 1 });
bookSubjectClassSchema.index(
  { bookId: 1, subjectId: 1, classId: 1 },
  { unique: true }
);

// Instance methods
bookSubjectClassSchema.methods.getBook = function () {
  return mongoose.model("Book").findById(this.bookId);
};

bookSubjectClassSchema.methods.getSubject = function () {
  return mongoose.model("Subject").findById(this.subjectId);
};

bookSubjectClassSchema.methods.getClass = function () {
  return mongoose.model("Class").findById(this.classId);
};

// Static methods
bookSubjectClassSchema.statics.findByBook = function (bookId) {
  return this.find({ bookId });
};

bookSubjectClassSchema.statics.findBySubject = function (subjectId) {
  return this.find({ subjectId });
};

bookSubjectClassSchema.statics.findByClass = function (classId) {
  return this.find({ classId });
};

bookSubjectClassSchema.statics.findByBookAndSubject = function (
  bookId,
  subjectId
) {
  return this.find({ bookId, subjectId });
};

bookSubjectClassSchema.statics.findByBookAndClass = function (bookId, classId) {
  return this.find({ bookId, classId });
};

bookSubjectClassSchema.statics.findBySubjectAndClass = function (
  subjectId,
  classId
) {
  return this.find({ subjectId, classId });
};

// Transform output
bookSubjectClassSchema.methods.toJSON = function () {
  const bscObject = this.toObject();
  delete bscObject.__v;
  return bscObject;
};

const BookSubjectClass = mongoose.model(
  "BookSubjectClass",
  bookSubjectClassSchema
);

export default BookSubjectClass;

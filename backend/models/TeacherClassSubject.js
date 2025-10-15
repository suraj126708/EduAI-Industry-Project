// models/TeacherClassSubject.js
import mongoose from "mongoose";

const teacherClassSubjectSchema = new mongoose.Schema(
  {
    // 🔑 REQUIRED for multi-school security and performance
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "teacher_class_subjects",
  }
);

// Indexes
teacherClassSubjectSchema.index({ teacherId: 1 });
teacherClassSubjectSchema.index({ classId: 1 });
teacherClassSubjectSchema.index({ subjectId: 1 });
teacherClassSubjectSchema.index(
  { teacherId: 1, classId: 1, subjectId: 1 },
  { unique: true }
);

// Instance methods
teacherClassSubjectSchema.methods.getTeacher = function () {
  return mongoose.model("User").findById(this.teacherId);
};

teacherClassSubjectSchema.methods.getClass = function () {
  return mongoose.model("Class").findById(this.classId);
};

teacherClassSubjectSchema.methods.getSubject = function () {
  return mongoose.model("Subject").findById(this.subjectId);
};

// Static methods
teacherClassSubjectSchema.statics.findByTeacher = function (teacherId) {
  return this.find({ teacherId });
};

teacherClassSubjectSchema.statics.findByClass = function (classId) {
  return this.find({ classId });
};

teacherClassSubjectSchema.statics.findBySubject = function (subjectId) {
  return this.find({ subjectId });
};

teacherClassSubjectSchema.statics.findByTeacherAndClass = function (
  teacherId,
  classId
) {
  return this.find({ teacherId, classId });
};

teacherClassSubjectSchema.statics.findByTeacherAndSubject = function (
  teacherId,
  subjectId
) {
  return this.find({ teacherId, subjectId });
};

teacherClassSubjectSchema.statics.findByClassAndSubject = function (
  classId,
  subjectId
) {
  return this.find({ classId, subjectId });
};

// Transform output
teacherClassSubjectSchema.methods.toJSON = function () {
  const tcsObject = this.toObject();
  delete tcsObject.__v;
  return tcsObject;
};

const TeacherClassSubject = mongoose.model(
  "TeacherClassSubject",
  teacherClassSubjectSchema
);

export default TeacherClassSubject;

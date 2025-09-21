import mongoose from "mongoose";

const classSubjectSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
    collection: "classsubjects",
  }
);

// Composite unique index to prevent duplicate subject assignment to the same class
classSubjectSchema.index({ classId: 1, subjectId: 1 }, { unique: true });

// Static methods
classSubjectSchema.statics.findByClass = function (classId) {
  return this.find({ classId });
};

classSubjectSchema.statics.findBySubject = function (subjectId) {
  return this.find({ subjectId });
};

// Transform output to remove __v field
classSubjectSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const ClassSubject = mongoose.model("ClassSubject", classSubjectSchema);

export default ClassSubject;

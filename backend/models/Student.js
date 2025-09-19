const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    class: { type: String, required: true },
    div: { type: String, required: true },
    rollNo: { type: Number, required: true },
    parentContact: { type: String, required: true },
    parentEmail: { type: String, required: true },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;

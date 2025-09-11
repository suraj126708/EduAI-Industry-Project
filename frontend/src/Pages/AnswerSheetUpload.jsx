import React, { useState } from "react";

// Mock data for demonstration; replace with backend/API calls
const mockClasses = ["Class 1", "Class 2", "Class 3"];
const mockDivisions = ["A", "B", "C"];
const mockExams = ["Midterm", "Final", "Unit Test"];
const mockStudents = [
  { rollNo: 1, name: "Amit" },
  { rollNo: 2, name: "Ravi" },
  { rollNo: 3, name: "Leena" },
  { rollNo: 4, name: "Sara" },
];

function AnswerSheetBulkUpload() {
  // Step 1: Select class/division/exam just once
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [filterConfirmed, setFilterConfirmed] = useState(false);

  // Step 2: Upload for each student in table
  const [uploads, setUploads] = useState({});
  const [errors, setErrors] = useState({});

  // Dropdown handlers
  const handleClassChange = (e) => setSelectedClass(e.target.value);
  const handleDivisionChange = (e) => setSelectedDivision(e.target.value);
  const handleExamChange = (e) => setSelectedExam(e.target.value);

  // Confirm selection and show table
  const handleConfirm = () => {
    if (!selectedClass || !selectedDivision || !selectedExam) {
      alert("Please select class, division, and exam");
      return;
    }
    setFilterConfirmed(true);
  };

  // Remove/Change filter selection
  const handleResetFilter = () => {
    setSelectedClass("");
    setSelectedDivision("");
    setSelectedExam("");
    setFilterConfirmed(false);
    setUploads({});
    setErrors({});
  };

  // File change per student
  const handleFileChange = (rollNo, file) => {
    setErrors((prev) => ({ ...prev, [rollNo]: "" }));
    // Validation
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrors((prev) => ({
        ...prev,
        [rollNo]: "Only image or PDF files allowed",
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [rollNo]: "File size must be under 10MB",
      }));
      return;
    }
    // Save file
    setUploads((prev) => ({
      ...prev,
      [rollNo]: { ...prev[rollNo], file, status: "Ready" },
    }));
  };

  // Upload per student
  const handleUpload = (rollNo) => {
    if (!uploads[rollNo]?.file) {
      setErrors((prev) => ({ ...prev, [rollNo]: "File required" }));
      return;
    }
    setUploads((prev) => ({
      ...prev,
      [rollNo]: { ...prev[rollNo], status: "Uploading" },
    }));
    setTimeout(() => {
      setUploads((prev) => ({
        ...prev,
        [rollNo]: { ...prev[rollNo], status: "Uploaded" },
      }));
    }, 1200);
  };

  return (
    <div className="container py-5">
      <div
        className="bg-white rounded p-4 shadow-sm"
        style={{ maxWidth: 1000, margin: "0 auto" }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold">Answer Sheet Upload</h2>
          <div className="text-muted">
            Set section details once, then upload sheets for each student
          </div>
        </div>
        {!filterConfirmed ? (
          <>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={selectedClass}
                  onChange={handleClassChange}
                >
                  <option value="">Select Class</option>
                  {mockClasses.map((cls) => (
                    <option key={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={selectedDivision}
                  onChange={handleDivisionChange}
                >
                  <option value="">Select Division</option>
                  {mockDivisions.map((div) => (
                    <option key={div}>{div}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={selectedExam}
                  onChange={handleExamChange}
                >
                  <option value="">Select Exam</option>
                  {mockExams.map((ex) => (
                    <option key={ex}>{ex}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-center">
              <button className="btn btn-primary" onClick={handleConfirm}>
                Show Student List
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 d-flex justify-content-between align-items-center">
              <div>
                <span className="me-3">
                  <b>Class:</b> {selectedClass}
                </span>
                <span className="me-3">
                  <b>Division:</b> {selectedDivision}
                </span>
                <span className="me-3">
                  <b>Exam:</b> {selectedExam}
                </span>
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleResetFilter}
              >
                Change Section
              </button>
            </div>
            <table className="table align-middle table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Upload Answer Sheet</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockStudents.map((student) => (
                  <tr key={student.rollNo}>
                    <td>{student.rollNo}</td>
                    <td>{student.name}</td>
                    <td>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        style={{ maxWidth: 170, display: "inline-block" }}
                        onChange={(e) =>
                          handleFileChange(student.rollNo, e.target.files[0])
                        }
                        disabled={
                          uploads[student.rollNo]?.status === "Uploaded"
                        }
                      />
                      <button
                        className="btn btn-success btn-sm ms-2"
                        disabled={
                          !uploads[student.rollNo]?.file ||
                          uploads[student.rollNo]?.status === "Uploaded"
                        }
                        onClick={() => handleUpload(student.rollNo)}
                      >
                        Upload
                      </button>
                      {errors[student.rollNo] && (
                        <div className="small text-danger">
                          {errors[student.rollNo]}
                        </div>
                      )}
                    </td>
                    <td>
                      {uploads[student.rollNo]?.status === "Uploaded" && (
                        <span className="badge bg-success">Uploaded</span>
                      )}
                      {uploads[student.rollNo]?.status === "Uploading" && (
                        <span className="badge bg-warning text-dark">
                          Uploading...
                        </span>
                      )}
                      {uploads[student.rollNo]?.status === "Ready" && (
                        <span className="badge bg-info text-dark">Ready</span>
                      )}
                      {!uploads[student.rollNo]?.status && (
                        <span className="badge bg-secondary">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default AnswerSheetBulkUpload;

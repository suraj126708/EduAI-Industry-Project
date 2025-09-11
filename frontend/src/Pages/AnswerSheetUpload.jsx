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
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="font-bold text-2xl">Answer Sheet Upload</h2>
          <div className="text-gray-500">
            Set section details once, then upload sheets for each student
          </div>
        </div>
        {!filterConfirmed ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedClass}
                  onChange={handleClassChange}
                >
                  <option value="">Select Class</option>
                  {mockClasses.map((cls) => (
                    <option key={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedDivision}
                  onChange={handleDivisionChange}
                >
                  <option value="">Select Division</option>
                  {mockDivisions.map((div) => (
                    <option key={div}>{div}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                onClick={handleConfirm}
              >
                Show Student List
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <span className="mr-4">
                  <b>Class:</b> {selectedClass}
                </span>
                <span className="mr-4">
                  <b>Division:</b> {selectedDivision}
                </span>
                <span className="mr-4">
                  <b>Exam:</b> {selectedExam}
                </span>
              </div>
              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                onClick={handleResetFilter}
              >
                Change Section
              </button>
            </div>
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">
                    Roll No.
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">
                    Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">
                    Upload Answer Sheet
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockStudents.map((student) => (
                  <tr key={student.rollNo} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {student.rollNo}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {student.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="max-w-[170px] inline-block px-2 py-1 border border-gray-300 rounded text-sm"
                        onChange={(e) =>
                          handleFileChange(student.rollNo, e.target.files[0])
                        }
                        disabled={
                          uploads[student.rollNo]?.status === "Uploaded"
                        }
                      />
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded ml-2 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={
                          !uploads[student.rollNo]?.file ||
                          uploads[student.rollNo]?.status === "Uploaded"
                        }
                        onClick={() => handleUpload(student.rollNo)}
                      >
                        Upload
                      </button>
                      {errors[student.rollNo] && (
                        <div className="text-xs text-red-500 mt-1">
                          {errors[student.rollNo]}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {uploads[student.rollNo]?.status === "Uploaded" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Uploaded
                        </span>
                      )}
                      {uploads[student.rollNo]?.status === "Uploading" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Uploading...
                        </span>
                      )}
                      {uploads[student.rollNo]?.status === "Ready" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Ready
                        </span>
                      )}
                      {!uploads[student.rollNo]?.status && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Pending
                        </span>
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

import React, { useState } from "react";

const currentYear = new Date().getFullYear();
const mockClasses = ["Class 1", "Class 2", "Class 3"];
const mockDivisions = ["A", "B", "C"];
const mockExams = ["Midterm", "Final", "Unit Test"];
const mockStudents = [
  { rollNo: 1, name: "Amit" },
  { rollNo: 2, name: "Ravi" },
  { rollNo: 3, name: "Leena" },
  { rollNo: 4, name: "Sara" },
];

function getRenamedFileName(
  rollNo,
  className,
  division,
  year,
  index,
  ext = "pdf"
) {
  return `${rollNo}_${className.replace(
    /\s/g,
    ""
  )}_${division}_${year}_${index}.${ext}`;
}

function AnswerSheetBulkUpload() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [filterConfirmed, setFilterConfirmed] = useState(false);
  const [uploads, setUploads] = useState({}); // rollNo => [{file,..}]
  const [errors, setErrors] = useState({});
  const [fileInputs, setFileInputs] = useState({}); // rollNo => inputs array, each tracks its file

  const handleClassChange = (e) => setSelectedClass(e.target.value);
  const handleDivisionChange = (e) => setSelectedDivision(e.target.value);
  const handleExamChange = (e) => setSelectedExam(e.target.value);

  const handleConfirm = () => {
    if (!selectedClass || !selectedDivision || !selectedExam) {
      alert("Please select class, division, and exam");
      return;
    }
    setFilterConfirmed(true);
  };

  const handleResetFilter = () => {
    setSelectedClass("");
    setSelectedDivision("");
    setSelectedExam("");
    setFilterConfirmed(false);
    setUploads({});
    setErrors({});
    setFileInputs({});
  };

  // Initialize file inputs when user list appears
  React.useEffect(() => {
    if (filterConfirmed) {
      const initialInputs = {};
      mockStudents.forEach((s) => (initialInputs[s.rollNo] = [{ file: null }]));
      setFileInputs(initialInputs);
    }
  }, [filterConfirmed]);

  // Handle file select for each input
  const handleFileChange = (rollNo, inputIdx, fileList) => {
    setErrors((prev) => ({ ...prev, [rollNo]: "" }));
    const file = fileList[0];
    if (!file) return;
    let ext =
      file.type === "application/pdf" ? "pdf" : file.name.split(".").pop();
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
    const newFile = new File(
      [file],
      getRenamedFileName(
        rollNo,
        selectedClass,
        selectedDivision,
        currentYear,
        inputIdx + 1,
        ext
      ),
      { type: file.type }
    );
    setFileInputs((prev) => ({
      ...prev,
      [rollNo]: prev[rollNo].map((input, idx) =>
        idx === inputIdx ? { ...input, file: newFile } : input
      ),
    }));
    setUploads((prev) => ({
      ...prev,
      [rollNo]: [
        ...(prev[rollNo]
          ? prev[rollNo].filter((_, idx) => idx !== inputIdx)
          : []),
        { file: newFile, status: "Ready" },
      ].sort((a, b) => a.file.name.localeCompare(b.file.name)),
    }));
  };

  // Camera capture handler (always adds a new field)
  const handleCameraCapture = (rollNo, fileList) => {
    const file = fileList[0];
    if (!file) return;
    let ext =
      file.type === "application/pdf" ? "pdf" : file.name.split(".").pop();
    const nextIdx = (fileInputs[rollNo]?.length || 0) + 1;
    const newFile = new File(
      [file],
      getRenamedFileName(
        rollNo,
        selectedClass,
        selectedDivision,
        currentYear,
        nextIdx,
        ext
      ),
      { type: file.type }
    );
    setFileInputs((prev) => ({
      ...prev,
      [rollNo]: [...(prev[rollNo] || []), { file: newFile }],
    }));
    setUploads((prev) => ({
      ...prev,
      [rollNo]: [...(prev[rollNo] || []), { file: newFile, status: "Ready" }],
    }));
  };

  // Only add "+"" if latest input has a file selected
  const handleAddInput = (rollNo) => {
    const inputs = fileInputs[rollNo] || [];
    if (!inputs[inputs.length - 1].file) return; // Block adding empty input
    setFileInputs((prev) => ({
      ...prev,
      [rollNo]: [...inputs, { file: null }],
    }));
  };

  // Remove a file input (and its file) before uploading
  const handleRemoveFile = (rollNo, idx) => {
    setFileInputs((prev) => ({
      ...prev,
      [rollNo]: prev[rollNo].filter((_, i) => i !== idx),
    }));
    setUploads((prev) => ({
      ...prev,
      [rollNo]: prev[rollNo]?.filter((_, i) => i !== idx),
    }));
  };

  // Simulated upload for all files under a rollNo
  const handleUpload = (rollNo) => {
    if (!uploads[rollNo] || uploads[rollNo].length === 0) {
      setErrors((prev) => ({ ...prev, [rollNo]: "File required" }));
      return;
    }
    setUploads((prev) => ({
      ...prev,
      [rollNo]: prev[rollNo].map((item) =>
        item.status !== "Uploaded" ? { ...item, status: "Uploading" } : item
      ),
    }));
    setTimeout(() => {
      setUploads((prev) => ({
        ...prev,
        [rollNo]: prev[rollNo].map((item) =>
          item.status !== "Uploaded" ? { ...item, status: "Uploaded" } : item
        ),
      }));
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-5xl w-full bg-white shadow-lg rounded-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Bulk Answer Sheet Upload
          </h2>
          <p className="text-gray-500">
            Select section once; upload multiple answer sheets per student
          </p>
        </div>
        {!filterConfirmed ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <select
                className="border rounded p-2 w-full"
                value={selectedClass}
                onChange={handleClassChange}
              >
                <option value="">Select Class</option>
                {mockClasses.map((cls) => (
                  <option key={cls}>{cls}</option>
                ))}
              </select>
              <select
                className="border rounded p-2 w-full"
                value={selectedDivision}
                onChange={handleDivisionChange}
              >
                <option value="">Select Division</option>
                {mockDivisions.map((div) => (
                  <option key={div}>{div}</option>
                ))}
              </select>
              <select
                className="border rounded p-2 w-full"
                value={selectedExam}
                onChange={handleExamChange}
              >
                <option value="">Select Exam</option>
                {mockExams.map((ex) => (
                  <option key={ex}>{ex}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-center">
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleConfirm}
              >
                Show Student List
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="space-x-4 text-gray-600">
                <span>
                  <b>Class:</b> {selectedClass}
                </span>
                <span>
                  <b>Division:</b> {selectedDivision}
                </span>
                <span>
                  <b>Exam:</b> {selectedExam}
                </span>
                <span>
                  <b>Year:</b> {currentYear}
                </span>
              </div>
              <button
                className="px-3 py-1 rounded text-sm border"
                onClick={handleResetFilter}
              >
                Change Section
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-sm rounded-lg">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="py-2 px-4 text-left">Roll No.</th>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Upload</th>
                    <th className="py-2 px-4 text-left">Camera</th>
                    <th className="py-2 px-4 text-left">Files (Renamed)</th>
                    <th className="py-2 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStudents.map((student) => (
                    <tr
                      key={student.rollNo}
                      className="border-b last:border-none"
                    >
                      <td className="py-2 px-4">{student.rollNo}</td>
                      <td className="py-2 px-4">{student.name}</td>
                      <td className="py-2 px-4">
                        {(fileInputs[student.rollNo] || []).map(
                          (input, idx) => (
                            <div key={idx} className="flex items-center mb-2">
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                className="block w-full"
                                style={{ maxWidth: "150px" }}
                                onChange={(e) =>
                                  handleFileChange(
                                    student.rollNo,
                                    idx,
                                    e.target.files
                                  )
                                }
                              />
                              {/* Show + only if current input contains a file and it's the last input */}
                              {input.file &&
                                idx ===
                                  fileInputs[student.rollNo].length - 1 && (
                                  <button
                                    type="button"
                                    className="text-blue-600 ml-2"
                                    onClick={() =>
                                      handleAddInput(student.rollNo)
                                    }
                                    title="Add another file"
                                  >
                                    <span className="text-xl font-bold">+</span>
                                  </button>
                                )}
                              {/* Optionally a remove button for each upload */}
                              {input.file && (
                                <button
                                  className="text-xs text-red-500 ml-2"
                                  type="button"
                                  onClick={() =>
                                    handleRemoveFile(student.rollNo, idx)
                                  }
                                  title="Remove file"
                                >
                                  x
                                </button>
                              )}
                            </div>
                          )
                        )}
                        <button
                          className={`px-3 py-1 rounded text-white mt-2 ${
                            !uploads[student.rollNo] ||
                            uploads[student.rollNo].length === 0 ||
                            uploads[student.rollNo].some(
                              (f) =>
                                f.status === "Uploading" ||
                                f.status === "Uploaded"
                            )
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                          disabled={
                            !uploads[student.rollNo] ||
                            uploads[student.rollNo].length === 0 ||
                            uploads[student.rollNo].some(
                              (f) =>
                                f.status === "Uploading" ||
                                f.status === "Uploaded"
                            )
                          }
                          onClick={() => handleUpload(student.rollNo)}
                        >
                          Upload
                        </button>
                        {errors[student.rollNo] && (
                          <div className="text-red-500 text-xs mt-1">
                            {errors[student.rollNo]}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="block w-full"
                          style={{ maxWidth: "140px" }}
                          onChange={(e) =>
                            e.target.files.length > 0 &&
                            handleCameraCapture(student.rollNo, e.target.files)
                          }
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          Camera (mobile)
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <ul className="list-disc pl-4">
                          {uploads[student.rollNo]?.length > 0 &&
                            uploads[student.rollNo].map((item, idx) => (
                              <li key={idx} className="mb-1">
                                {item.file.name}
                              </li>
                            ))}
                        </ul>
                      </td>
                      <td className="py-2 px-4">
                        {uploads[student.rollNo]?.length > 0 ? (
                          uploads[student.rollNo].map((item, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded mr-2 ${
                                item.status === "Uploaded"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "Uploading"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : item.status === "Ready"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 rounded bg-gray-200 text-gray-700">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AnswerSheetBulkUpload;

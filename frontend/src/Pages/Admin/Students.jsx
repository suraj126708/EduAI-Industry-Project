import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

const mockClasses = ["Class 1", "Class 2", "Class 3"];
const mockDivisions = ["A", "B", "C"];

function Students() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [students, setStudents] = useState([]);
  const [excelError, setExcelError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchStudents = async () => {
    try {
      console.log(
        "Requesting students with class:",
        selectedClass,
        "and division:",
        selectedDivision
      );
      const response = await axios.get("/admin/students", {
        params: {
          class: selectedClass,
          div: selectedDivision,
        },
      });
      console.log("Received students:", response.data.data);
      setStudents(response.data.data);
      setSuccessMessage("");
    } catch (error) {
      setStudents([]);
      setSuccessMessage("");
      console.error("Fetch students error:", error);
    }
  };

  // Use actual API endpoint for Excel upload
  const uploadExcel = async (formData) => {
    try {
      const response = await axios.post("/admin/students/uploads", formData);
      setSuccessMessage(response.data.message || "Upload successful");
      fetchStudents();
    } catch (error) {
      setExcelError(error.response?.data?.message || "Upload failed");
      console.error("Upload error:", error);
    }
  };

  const handleExcelUpload = (e) => {
    setExcelError("");
    const file = e.target.files[0];
    if (!file) return;
    if (
      ![
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ].includes(file.type)
    ) {
      setExcelError("Please upload a valid Excel or CSV file.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    uploadExcel(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Manage Students</h2>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">
          Upload Students Excel (.xlsx, .csv)
        </label>
        <input type="file" accept=".xlsx, .csv" onChange={handleExcelUpload} />
        {excelError && <p className="text-red-600 mt-1">{excelError}</p>}
        {successMessage && (
          <p className="text-green-600 mt-1">{successMessage}</p>
        )}
      </div>

      <div className="mb-4 flex gap-4">
        <select
          className="border rounded p-2"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Select Class</option>
          {mockClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>

        <select
          className="border rounded p-2"
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
        >
          <option value="">Select Division</option>
          {mockDivisions.map((div) => (
            <option key={div} value={div}>
              {div}
            </option>
          ))}
        </select>

        <button
          className="bg-blue-600 text-white rounded px-4"
          onClick={fetchStudents}
        >
          Fetch Students
        </button>
      </div>

      <table className="min-w-full border rounded text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">Roll No</th>
            <th className="border px-3 py-2">Name</th>
            <th className="border px-3 py-2">Class</th>
            <th className="border px-3 py-2">Division</th>
            <th className="border px-3 py-2">Parent Contact</th>
            <th className="border px-3 py-2">Parent Email</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td className="border px-3 py-6 text-center" colSpan="6">
                No students found!
              </td>
            </tr>
          ) : (
            students.map((stu, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "" : "bg-gray-50"}>
                <td className="border px-3 py-2">{stu.rollNo}</td>
                <td className="border px-3 py-2">{stu.name}</td>
                <td className="border px-3 py-2">{stu.class}</td>
                <td className="border px-3 py-2">{stu.div}</td>
                <td className="border px-3 py-2">{stu.parentContact || "-"}</td>
                <td className="border px-3 py-2">{stu.parentEmail || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Students;

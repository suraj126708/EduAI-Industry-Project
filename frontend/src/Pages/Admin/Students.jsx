import React, { useState } from "react";
import api from "../../utils/api";
import { FaUsers, FaUpload, FaSearch, FaFileExcel } from "react-icons/fa";

const mockClasses = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];
const mockDivisions = ["A", "B", "C", "D"];

function Students() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [students, setStudents] = useState([]);
  const [excelError, setExcelError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchStudents = async () => {
    try {
      if (!selectedClass || !selectedDivision) {
        // Avoid calling API with empty filters
        return;
      }
      console.log(
        "Requesting students with class:",
        selectedClass,
        "and division:",
        selectedDivision
      );
      const response = await api.get("admin/students", {
        params: {
          class: String(selectedClass)
            .replace(/^Class\s*/i, "")
            .trim(),
          div: String(selectedDivision).trim().toUpperCase(),
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
      const response = await api.post("admin/students/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage(response.data.message || "Upload successful");
      if (selectedClass && selectedDivision) {
        fetchStudents();
      }
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
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUsers className="mr-2 text-indigo-600" />
          Student Management
        </h2>
      </div>

      {excelError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {excelError}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaUpload className="mr-2 text-indigo-600" />
          Upload Students Data
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Students Excel (.xlsx, .csv)
            </label>
            <input
              type="file"
              accept=".xlsx, .csv"
              onChange={handleExcelUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaSearch className="mr-2 text-indigo-600" />
          Filter Students
        </h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Division
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </div>

          <button
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
            onClick={fetchStudents}
          >
            <FaSearch className="mr-2" />
            Fetch Students
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <FaUsers className="mr-2 text-indigo-600" />
            Students List
          </h3>
        </div>
        <div className="p-6">
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaUsers className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>No students found for this class and division!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Division
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Email
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((stu, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stu.rollNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stu.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stu.class}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {stu.div}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stu.parentContact || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stu.parentEmail || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Students;

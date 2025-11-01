import React, { useState, useEffect } from "react";
import { adminService } from "../../utils/api"; // Import from your services
import { FaUsers, FaUpload, FaSearch, FaSpinner } from "react-icons/fa";
import { AlertCircle } from "lucide-react";

// Reusable Select component
const SelectInput = ({ label, value, onChange, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    >
      <option value="">
        {label === "Division" ? "All Divisions" : "Select Class"}
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

function Students() {
  // State for filters
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [searchRollNo, setSearchRollNo] = useState("");

  // State for data
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);

  // State for UI feedback
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch classes for the principal's school on load
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const res = await adminService.getClasses(); // Assumes this fetches classes for the school
        if (res.data.success) {
          const classes = res.data.data;
          // Get unique grades
          const uniqueGrades = [...new Set(classes.map((c) => c.grade))];
          setClassOptions(
            uniqueGrades
              .sort((a, b) => a - b)
              .map((g) => ({ value: g, label: `Class ${g}` }))
          );
          // Store all divisions for filtering
          const allDivs = [...new Set(classes.map((c) => c.division))].sort();
          setDivisionOptions(allDivs.map((d) => ({ value: d, label: d })));
        }
      } catch (err) {
        setError(err.message || "Failed to load classes.");
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Handler for the "Fetch Students" button
  const handleFetchStudents = async () => {
    if (!selectedClass) {
      setError("Please select a class to fetch students.");
      return;
    }

    setIsLoadingStudents(true);
    setError("");
    setSuccessMessage("");
    setStudents([]);

    try {
      const res = await adminService.getStudents(
        selectedClass,
        selectedDivision, // Pass division (can be "" for "All")
        searchRollNo // Pass roll no (can be "" for all)
      );

      if (res.success) {
        setStudents(res.data);
        if (res.data.length === 0) {
          setSuccessMessage("No students found matching these criteria.");
        }
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      setStudents([]);
      setError(error.message || "Failed to fetch students.");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Handler for Excel file upload
  const handleExcelUpload = async (e) => {
    setError("");
    setSuccessMessage("");
    const file = e.target.files[0];
    if (!file) return;

    if (
      ![
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ].includes(file.type)
    ) {
      setError("Please upload a valid Excel or CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await adminService.uploadStudentExcel(formData);
      setSuccessMessage(
        `${res.data.successCount} students uploaded. ${res.data.failedCount} rows failed.`
      );
      // Automatically refresh the student list if filters are set
      if (selectedClass) {
        handleFetchStudents();
      }
    } catch (error) {
      setError(error.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = null; // Clear the file input
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6">
        <FaUsers className="mr-2 text-indigo-600" />
        Student Management
      </h2>

      {error && (
        <div className="flex items-center p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      {successMessage && (
        <div className="flex items-center p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaUpload className="mr-2 text-indigo-600" />
          Upload Student Roster
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                disabled:opacity-50"
            />
          </div>
          {uploading && <FaSpinner className="animate-spin text-indigo-600" />}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaSearch className="mr-2 text-indigo-600" />
          Find Students
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <SelectInput
            label="Select Class"
            value={selectedClass}
            onChange={setSelectedClass}
            options={classOptions}
            disabled={isLoadingClasses}
          />
          <SelectInput
            label="Select Division (Optional)"
            value={selectedDivision}
            onChange={setSelectedDivision}
            options={divisionOptions}
            disabled={isLoadingClasses || !selectedClass}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Roll No. (Optional)
            </label>
            <input
              type="text"
              value={searchRollNo}
              onChange={(e) => setSearchRollNo(e.target.value)}
              placeholder="Enter Roll No..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              disabled={!selectedClass}
            />
          </div>
          <button
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center"
            onClick={handleFetchStudents}
            disabled={isLoadingStudents || !selectedClass}
          >
            {isLoadingStudents ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSearch className="mr-2" />
            )}
            Fetch Students
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Student List</h3>
        </div>
        {isLoadingStudents ? (
          <div className="text-center py-8 text-gray-500">
            <FaSpinner className="mx-auto text-4xl mb-4 animate-spin text-indigo-600" />
            <p>Fetching students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaUsers className="mx-auto text-4xl mb-4 text-gray-300" />
            <p>No students found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Roll No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Parent Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Parent Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((stu) => (
                  <tr key={stu._id} className="hover:bg-gray-50">
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
  );
}

export default Students;

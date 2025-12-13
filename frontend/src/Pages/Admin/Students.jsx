import React, { useState, useEffect } from "react";
import { adminService, evaluationAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import {
  FaUsers,
  FaUpload,
  FaSearch,
  FaSpinner,
  FaFileAlt,
  FaChartLine,
  FaEye, // Icon for View
} from "react-icons/fa";
import {
  AlertCircle,
  FileText,
  CheckCircle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Helper Component for Select Inputs
const SelectInput = ({
  label,
  value,
  onChange,
  options,
  disabled,
  ...props
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      {...props}
    >
      <option value="">Select Option</option>
      {options.map((opt, idx) => (
        <option key={`${opt.value}-${idx}`} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

function Students() {
  const navigate = useNavigate(); // ✅ Initialize hook

  // --- Filter State ---
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [searchRollNo, setSearchRollNo] = useState("");

  // --- Report Mode State ---
  const [isReportMode, setIsReportMode] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(new Date().getFullYear(), 0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }); // Jan 1st
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999); // Set to end of today
    return d;
  });

  // ✅ Store existing report IDs (Map: studentId -> reportId)
  const [existingReports, setExistingReports] = useState({});

  // --- Data State ---
  const [students, setStudents] = useState([]);
  const [allClassesData, setAllClassesData] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);

  // --- UI State ---
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingForId, setGeneratingForId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportSemester, setReportSemester] = useState("Semester 1");
  // 1. Fetch Classes on Mount
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const res = await adminService.getClasses();
        if (res.data.success) {
          const classes = res.data.data;
          setAllClassesData(classes);

          const uniqueGrades = [...new Set(classes.map((c) => c.grade))];
          setClassOptions(
            uniqueGrades
              .sort((a, b) => a - b)
              .map((g) => ({ value: g, label: `Class ${g}` }))
          );
        }
      } catch (err) {
        setError(err.message || "Failed to load classes.");
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // 2. Dynamic Division Options
  useEffect(() => {
    setSelectedDivision("");
    if (!selectedClass) {
      setDivisionOptions([]);
      return;
    }
    const availableClasses = allClassesData.filter(
      (c) => c.grade.toString() === selectedClass.toString()
    );
    const uniqueDivisions = [
      ...new Set(availableClasses.map((c) => c.division)),
    ].sort();

    setDivisionOptions(
      uniqueDivisions.map((d) => ({ value: d, label: `Division ${d}` }))
    );
  }, [selectedClass, allClassesData]);

  const getPayloadDates = () => {
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // 3. ✅ Helper: Check Report Status for Loaded Students
  const checkReportsStatus = async (studentList) => {
    if (!isReportMode || studentList.length === 0) return;

    try {
      const studentIds = studentList.map((s) => s._id);
      // Use helper to get dates
      const { startDate: s, endDate: e } = getPayloadDates();

      const res = await evaluationAPI.checkReportStatus({
        studentIds,
        year: reportYear, // Send Year
        semester: reportSemester,
      });

      if (res.success) {
        setExistingReports(res.data);
      }
    } catch (err) {
      console.error("Failed to check report status", err);
    }
  };

  // 4. Fetch Students Logic
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
        selectedDivision,
        searchRollNo
      );

      if (res.success) {
        setStudents(res.data);
        // ✅ Check reports immediately after fetching students if in report mode
        if (isReportMode) {
          await checkReportsStatus(res.data);
        }
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

  // 5. ✅ Re-check reports when dates change OR when students list updates
  useEffect(() => {
    if (isReportMode && students.length > 0) {
      checkReportsStatus(students);
    }
  }, [reportYear, reportSemester, isReportMode, students]);

  // 6. ✅ Handle Generate or View Report
  const handleGenerateOrViewReport = async (studentId) => {
    if (existingReports[studentId]) {
      window.open(`/semester-report/${existingReports[studentId]}`, "_blank");
      return;
    }

    setGeneratingForId(studentId);
    setError("");

    try {
      const res = await evaluationAPI.generateSemesterReport({
        studentId: studentId,
        year: reportYear, // Send Year
        semester: reportSemester,
      });

      if (res.success && res.reportId) {
        setExistingReports((prev) => ({ ...prev, [studentId]: res.reportId }));
        window.open(`/semester-report/${existingReports[studentId]}`, "_blank");
      } else {
        setError(res.message || "Failed to generate report.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while generating the report.");
    } finally {
      setGeneratingForId(null);
    }
  };

  // 7. Handle Excel Upload
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
      if (res.success) {
        setSuccessMessage(
          `Upload successful! ${res.data?.successCount || 0} students added.`
        );
        if (selectedClass) handleFetchStudents();
      } else {
        setError(res.message || "Upload failed.");
      }
    } catch (error) {
      setError(error.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUsers className="mr-3 text-indigo-600" />
          Student Details & Report
        </h2>

        {/* Toggle Mode Button */}
        <button
          onClick={() => {
            setIsReportMode(!isReportMode);
            setError("");
            setSuccessMessage("");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-medium shadow-sm ${
            isReportMode
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md ring-2 ring-indigo-200"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
          }`}
        >
          {isReportMode ? <FaChartLine /> : <FaFileAlt />}
          {isReportMode ? "Report Mode Active" : "Switch to Report Mode"}
        </button>
      </div>

      {error && (
        <div className="flex items-center p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center p-4 mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg shadow-sm">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* --- Report Mode Config --- */}
      {isReportMode && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl mb-8 border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-indigo-800 font-bold mb-4 flex items-center gap-2 text-lg">
            <TrendingUp size={20} /> Configure Report Period
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Year Selector */}
            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-2 tracking-wider">
                Academic Year
              </label>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className="w-full px-3 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm text-gray-700 bg-white"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i + 1; // 2026, 2025, 2024...
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Semester Selector */}
            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-2 tracking-wider">
                Semester
              </label>
              <select
                value={reportSemester}
                onChange={(e) => setReportSemester(e.target.value)}
                className="w-full px-3 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm text-gray-700 bg-white"
              >
                <option value="Semester 1">Semester 1 (Jun - Dec)</option>
                <option value="Semester 2">Semester 2 (Jan - May)</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-indigo-500 mt-4 flex items-center gap-1 font-medium">
            <AlertCircle size={12} />
            Reports will include evaluations from{" "}
            {reportSemester === "Semester 1"
              ? "June 1st to Dec 31st"
              : "Jan 1st to May 31st"}{" "}
            of {reportYear}.
          </p>
        </div>
      )}

      {/* --- Upload Section (Hidden in Report Mode) --- */}
      {!isReportMode && (
        <div className="bg-white p-6 rounded-xl mb-8 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <FaUpload className="mr-3 text-indigo-600" />
            Upload Students Details
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="block">
                <span className="sr-only">Choose excel file</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2.5 file:px-6
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100
                    cursor-pointer file:cursor-pointer
                    border border-gray-300 rounded-lg p-1"
                />
              </label>
              <p className="mt-2 text-xs text-gray-500">
                Supports .xlsx, .xls, and .csv formats.
              </p>
            </div>
            {uploading && (
              <div className="flex items-center text-indigo-600 font-medium animate-pulse">
                <FaSpinner className="animate-spin mr-2" /> Uploading...
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Filter Section --- */}
      <div className="bg-white p-6 rounded-xl mb-8 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <FaSearch className="mr-3 text-indigo-600" />
          Search & Filter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-3">
            <SelectInput
              label="Select Class"
              value={selectedClass}
              onChange={setSelectedClass}
              options={classOptions}
              disabled={isLoadingClasses}
            />
          </div>
          <div className="md:col-span-3">
            <SelectInput
              label="Select Division"
              value={selectedDivision}
              onChange={setSelectedDivision}
              options={divisionOptions}
              disabled={isLoadingClasses || !selectedClass}
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by Roll No.
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400 text-xs" />
              </div>
              <input
                type="text"
                value={searchRollNo}
                onChange={(e) => setSearchRollNo(e.target.value)}
                placeholder="Enter Roll Number..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 shadow-sm"
                disabled={!selectedClass}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <button
              className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center font-medium shadow-sm transition-colors"
              onClick={handleFetchStudents}
              disabled={isLoadingStudents || !selectedClass}
            >
              {isLoadingStudents ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Fetching...
                </>
              ) : (
                "Fetch Students"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- Students Table --- */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaUsers className="w-5 h-5 text-gray-500" />
            Student List{" "}
            {students.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({students.length} students found)
              </span>
            )}
          </h3>
          {isReportMode && students.length > 0 && (
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium border border-green-200 flex items-center gap-1">
              <CheckCircle size={12} /> Ready to generate reports
            </span>
          )}
        </div>

        {isLoadingStudents ? (
          <div className="text-center py-12 text-gray-500">
            <FaSpinner className="mx-auto text-4xl mb-4 animate-spin text-indigo-600" />
            <p className="text-lg">Fetching student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <FaUsers size={32} />
            </div>
            <h4 className="text-gray-900 font-medium mb-1">
              No students found
            </h4>
            <p className="text-gray-500 text-sm">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Parent Email
                  </th>
                  {isReportMode && (
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((stu) => {
                  // Check if this student already has a report ID in our map
                  const reportId = existingReports[stu._id];

                  return (
                    <tr
                      key={stu._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stu.rollNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {stu.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stu.parentContact || (
                          <span className="italic text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stu.parentEmail || (
                          <span className="italic text-gray-400">N/A</span>
                        )}
                      </td>

                      {isReportMode && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleGenerateOrViewReport(stu._id)}
                            disabled={generatingForId === stu._id}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm
                              ${
                                reportId
                                  ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 ring-1 ring-green-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                              } disabled:opacity-70 disabled:cursor-not-allowed`}
                          >
                            {generatingForId === stu._id ? (
                              <>
                                <FaSpinner className="animate-spin" />{" "}
                                Processing...
                              </>
                            ) : reportId ? (
                              <>
                                <FaEye size={14} /> View Report
                              </>
                            ) : (
                              <>
                                <FileText size={14} /> Generate Report
                              </>
                            )}

                            {!generatingForId && !reportId && (
                              <ChevronRight size={14} className="ml-1" />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Students;

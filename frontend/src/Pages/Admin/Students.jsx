import React, { useState, useEffect } from "react";
import { adminService, evaluationAPI } from "../../utils/api";
import {
  FaUsers,
  FaUpload,
  FaSearch,
  FaSpinner,
  FaFileAlt,
  FaTimes,
  FaDownload,
  FaChartLine,
} from "react-icons/fa";
import {
  AlertCircle,
  FileText,
  School,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  User,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- Report Modal Component (Kept same as provided) ---
const ReportModal = ({ reportData, onClose }) => {
  if (!reportData) return null;

  const renderPerformanceTrend = (data) => {
    if (!data || data.length === 0)
      return (
        <p className="text-gray-500 text-center py-10">
          No trend data available.
        </p>
      );

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="examName" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="#4F46E5"
            strokeWidth={3}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FaTimes size={24} />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 border-b pb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <School size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {reportData.schoolInfo?.name || "School Name"}
              </h2>
              <p className="text-gray-500">Semester Progress Report</p>
            </div>
            <div className="ml-auto text-right">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors shadow-sm"
              >
                <FaDownload /> Download PDF
              </button>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg border mb-8">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                Student
              </span>
              <p className="font-semibold text-gray-900">
                {reportData.studentInfo.name}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                Roll No
              </span>
              <p className="font-semibold text-gray-900">
                {reportData.studentInfo.rollNo}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                Class
              </span>
              <p className="font-semibold text-gray-900">
                {reportData.studentInfo.class} -{" "}
                {reportData.studentInfo.division}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                Overall Grade
              </span>
              <p className="font-bold text-indigo-600 text-lg">
                {reportData.aiAnalysis.overall_grade}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="border p-4 rounded-lg bg-white shadow-sm">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <TrendingUp size={18} className="text-indigo-600" /> Performance
                Trend
              </h4>
              {renderPerformanceTrend(reportData.aiAnalysis.trend_data)}
            </div>
            <div className="border p-4 rounded-lg bg-white shadow-sm">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <FileText size={18} className="text-indigo-600" /> AI Analysis
              </h4>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <strong className="text-green-600 flex items-center gap-1 mb-1">
                    <CheckCircle size={14} /> Strengths:
                  </strong>
                  <ul className="list-disc pl-5 space-y-1">
                    {reportData.aiAnalysis.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong className="text-orange-600 flex items-center gap-1 mb-1">
                    <AlertTriangle size={14} /> Areas to Improve:
                  </strong>
                  <ul className="list-disc pl-5 space-y-1">
                    {reportData.aiAnalysis.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Raw History Table */}
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="font-bold text-gray-800">Exam History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {reportData.rawHistory.map((exam) => (
                    <tr key={exam.examId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(exam.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {exam.examType}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {exam.subject}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {exam.obtainedMarks} / {exam.totalMarks}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            exam.obtainedMarks / exam.totalMarks >= 0.75
                              ? "bg-green-100 text-green-800"
                              : exam.obtainedMarks / exam.totalMarks >= 0.5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {(
                            (exam.obtainedMarks / exam.totalMarks) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

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
      <option value="">Select Class</option>
      {options.map((opt, idx) => (
        <option key={`${opt.value}-${idx}`} value={opt.value}>
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

  // Report Mode State
  const [isReportMode, setIsReportMode] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1)
  ); // Jan 1st
  const [endDate, setEndDate] = useState(new Date());

  // State for data
  const [students, setStudents] = useState([]);
  const [allClassesData, setAllClassesData] = useState([]); // Store raw class data
  const [classOptions, setClassOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);

  // State for UI feedback
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Generating Report State
  const [generatingForId, setGeneratingForId] = useState(null); // ID of student being processed
  const [viewReportData, setViewReportData] = useState(null); // Data for modal

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const res = await adminService.getClasses();
        if (res.data.success) {
          const classes = res.data.data;
          setAllClassesData(classes); // Save raw data for dynamic filtering

          // Extract unique Grades
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

  // Dynamic Division Filter Logic
  useEffect(() => {
    // Reset division selection when class changes
    setSelectedDivision("");

    if (!selectedClass) {
      setDivisionOptions([]);
      return;
    }

    // Filter raw data to find divisions matching the selected grade
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

  // Fetch Students
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

  // Generate Report Action
  const handleGenerateReport = async (studentId) => {
    setGeneratingForId(studentId);
    setError("");

    try {
      const res = await evaluationAPI.generateSemesterReport({
        studentId: studentId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (res.success) {
        setViewReportData(res.data);
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
        if (selectedClass) {
          handleFetchStudents();
        }
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
      {/* --- Modal for Report --- */}
      {viewReportData && (
        <ReportModal
          reportData={viewReportData}
          onClose={() => setViewReportData(null)}
        />
      )}

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
        <div className="flex items-center p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center p-4 mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* --- Report Mode Configuration Panel --- */}
      {isReportMode && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl mb-8 border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-indigo-800 font-bold mb-4 flex items-center gap-2 text-lg">
            <TrendingUp size={20} /> Configure Report Period
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-2 tracking-wider">
                Start Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  className="w-full pl-4 pr-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-gray-700"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-2 tracking-wider">
                End Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  className="w-full pl-4 pr-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-gray-700"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-indigo-500 mt-4 flex items-center gap-1 font-medium">
            <AlertCircle size={12} />
            Reports will include all evaluations conducted between these dates.
          </p>
        </div>
      )}

      {/* --- Upload Section (Enabled & Styled) --- */}
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
                    disabled:opacity-50 disabled:cursor-not-allowed
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
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors shadow-sm"
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
            <User className="w-5 h-5 text-gray-500" />
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
                    Parent Contact
                  </th>
                  {/* Added Parent Email Column */}
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
                {students.map((stu) => (
                  <tr
                    key={stu._id}
                    className={`transition-colors ${
                      viewReportData?.studentInfo?.rollNo === stu.rollNo
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stu.rollNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {stu.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stu.parentContact ? (
                        stu.parentContact
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          Not Provided
                        </span>
                      )}
                    </td>
                    {/* Added Parent Email Data */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stu.parentEmail ? (
                        stu.parentEmail
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          Not Provided
                        </span>
                      )}
                    </td>

                    {/* Report Generation Button */}
                    {isReportMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleGenerateReport(stu._id)}
                          disabled={generatingForId === stu._id}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200 px-4 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                        >
                          {generatingForId === stu._id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FileText size={14} />
                          )}
                          {generatingForId === stu._id
                            ? "Generating..."
                            : "Generate Report"}
                          {!generatingForId && (
                            <ChevronRight size={14} className="ml-1" />
                          )}
                        </button>
                      </td>
                    )}
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

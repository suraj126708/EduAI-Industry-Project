import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
// Import the new services
import {
  bookAPI,
  teacherAPI,
  evaluationAPI,
  fetchTeacherProfile,
} from "../utils/api";
import {
  Loader2,
  AlertCircle,
  UploadCloud,
  Search,
  CheckCircle2, // <-- Import Check icon
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link } from "react-router-dom"; // Import Link for report

// Reusable Select component (No changes)
const SelectInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100`}
    >
      <option value="" hidden>
        {placeholder || `Select ${label}...`}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const EvaluationSetupForm = () => {
  const { user } = useAuth();

  // --- State for Dropdowns ---
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPaperGroup, setSelectedPaperGroup] = useState(null);

  // --- State for Data Options ---
  const [allAssignments, setAllAssignments] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [paperGroupOptions, setPaperGroupOptions] = useState([]);

  // --- State for Students & Uploads ---
  const [students, setStudents] = useState([]);
  const [paperSets, setPaperSets] = useState([]);
  const [selectedSets, setSelectedSets] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  // --- *** MODIFIED STATE *** ---
  const [uploadStatus, setUploadStatus] = useState({}); // For *live* upload status
  const [existingEvals, setExistingEvals] = useState({}); // For *database* status

  // --- Loading & Error State ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);

  // --- ADDED THESE 2 LINES ---
  const [searchRollNo, setSearchRollNo] = useState("");
  const [studentFetchError, setStudentFetchError] = useState(null);

  // === 1. Fetch Initial Assignments (on load) ===
  // ... (This function is correct, no changes needed) ...
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user || !user.email) return;
      setIsLoading(true);
      setError(null);
      try {
        const profile = await fetchTeacherProfile();
        const schoolId = profile.schoolId;
        if (!schoolId) throw new Error("School ID not found.");
        const res = await bookAPI.getTeacherAssignments(schoolId, user.email);
        if (!res.data.success) throw new Error(res.data.message);
        const assignments = res.data.data.assignments || [];
        setAllAssignments(assignments);
        const uniqueGrades = [
          ...new Set(assignments.map((a) => a.classId.grade)),
        ];
        setGradeOptions(
          uniqueGrades
            .sort((a, b) => a - b)
            .map((grade) => ({ value: grade, label: `Class ${grade}` }))
        );
      } catch (err) {
        setError(err.message || "Failed to load initial data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  // === 2. Update Division Options (No API call, logic is fine) ===
  // ... (This function is correct, no changes needed) ...
  useEffect(() => {
    if (!selectedGrade) {
      setDivisionOptions([]);
      setSelectedDivision("");
      return;
    }
    const divisions = [
      ...new Set(
        allAssignments
          .filter((a) => a.classId.grade === parseInt(selectedGrade))
          .map((a) => a.classId.division)
      ),
    ];
    setDivisionOptions(
      divisions.sort().map((div) => ({ value: div, label: div }))
    );
  }, [selectedGrade, allAssignments]);

  // === 3. Update Subject Options (No API call, logic is fine) ===
  // ... (This function is correct, no changes needed) ...
  useEffect(() => {
    if (!selectedGrade || !selectedDivision) {
      setSubjectOptions([]);
      setSelectedSubject("");
      return;
    }
    const subjects = [
      ...new Map(
        allAssignments
          .filter(
            (a) =>
              a.classId.grade === parseInt(selectedGrade) &&
              a.classId.division === selectedDivision
          )
          .map((a) => [a.subjectId._id, a.subjectId.name])
      ),
    ];
    setSubjectOptions(
      subjects.map(([id, name]) => ({ value: name, label: name }))
    );
  }, [selectedDivision, selectedGrade, allAssignments]);

  // === 5. NEW: Handler to manually fetch students ===
  // --- *** MODIFIED THIS FUNCTION *** ---
  const handleFetchStudents = async () => {
    if (!selectedGrade || !selectedDivision) {
      setStudentFetchError("Please select a Class and Division first.");
      return;
    }
    setIsLoadingStudents(true);
    setStudentFetchError(null);
    setStudents([]);
    setExistingEvals({}); // Clear old evaluations
    setUploadStatus({}); // Clear old upload statuses

    try {
      // Fetch students and evaluations in parallel
      const [studentRes, evalRes] = await Promise.all([
        teacherAPI.getStudentsByClass(
          selectedGrade,
          selectedDivision,
          searchRollNo
        ),
        evaluationAPI.getEvaluationsByClass(selectedGrade, selectedDivision),
      ]);

      // Process students
      if (studentRes.success) {
        setStudents(studentRes.data);
        if (studentRes.data.length === 0) {
          setStudentFetchError("No students found matching these criteria.");
        }
      } else {
        throw new Error(studentRes.message);
      }

      // Process existing evaluations
      if (evalRes.success) {
        console.log("Existing evaluations fetched:", evalRes.data);
        setExistingEvals(evalRes.data); // evalRes.data is already a map { studentId: [...] }
      } else {
        console.error("Could not fetch existing evaluations");
      }
    } catch (err) {
      setStudentFetchError(`Failed to fetch students: ${err.message}`);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // === 6. Fetch Filtered Paper Groups (when filters change) ===
  // ... (This function is correct, no changes needed) ...
  useEffect(() => {
    const shouldFetch = selectedGrade && selectedSubject && selectedExamType;

    if (!shouldFetch) {
      setPaperGroupOptions([]);
      return;
    }
    const fetchPapers = async () => {
      setIsLoadingPapers(true);
      setPaperGroupOptions([]);
      try {
        const res = await teacherAPI.getFilteredPaperGroups(
          selectedGrade,
          selectedSubject,
          selectedExamType,
          selectedDate
        );
        if (res.success) {
          setPaperGroupOptions(
            res.data.map((group) => ({
              value: group._id,
              label: group.groupTitle,
              fullGroup: group,
            }))
          );
        } else {
          throw new Error(res.message);
        }
      } catch (err) {
        setError(`Failed to fetch papers: ${err.message}`);
      } finally {
        setIsLoadingPapers(false);
      }
    };
    fetchPapers();
  }, [selectedGrade, selectedSubject, selectedExamType, selectedDate]);

  // === 7. Handle Paper Group Change (No API call, logic is fine) ===
  // ... (This function is correct, no changes needed) ...
  const handlePaperGroupChange = (paperId) => {
    const groupOption = paperGroupOptions.find((opt) => opt.value === paperId);
    if (groupOption) {
      setSelectedPaperGroup(groupOption.fullGroup);
      setPaperSets(groupOption.fullGroup.papers);
    } else {
      setSelectedPaperGroup(null);
      setPaperSets([]);
    }
  };

  // === 8. Handlers for student list (No API call, logic is fine) ===
  // ... (This function is correct, no changes needed) ...
  const handleSetSelection = (studentId, paperSetId) => {
    setSelectedSets((prev) => ({ ...prev, [studentId]: paperSetId }));
  };
  const handleFileChange = (studentId, file) => {
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [studentId]: file }));
    }
  };

  // === 9. Handle Submit ===
  // --- *** MODIFIED THIS FUNCTION *** ---
  const handleSubmit = async (studentId) => {
    const questionPaperId = selectedSets[studentId];
    const answerSheetFile = uploadedFiles[studentId];

    if (!questionPaperId || !answerSheetFile) {
      alert(
        "Please select a paper set and upload an answer sheet for this student."
      );
      return;
    }

    setUploadStatus((prev) => ({
      ...prev,
      [studentId]: { status: "loading" },
    }));

    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("questionPaperId", questionPaperId);
      formData.append("answerSheet", answerSheetFile);

      const res = await evaluationAPI.uploadAnswerSheet(formData);

      if (res.success) {
        // --- This part is now for LIVE feedback ---
        setUploadStatus((prev) => ({
          ...prev,
          [studentId]: { status: "success", data: res.data },
        }));

        // --- ALSO update the persistent list ---
        setExistingEvals((prev) => {
          const newEvals = { ...prev };
          if (!newEvals[studentId]) {
            newEvals[studentId] = [];
          }
          // Add or replace this specific evaluation
          const existingIndex = newEvals[studentId].findIndex(
            (e) => e.questionPaperId === questionPaperId
          );
          if (existingIndex > -1) {
            newEvals[studentId][existingIndex] = res.data;
          } else {
            newEvals[studentId].push(res.data);
          }
          return newEvals;
        });
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setUploadStatus((prev) => ({
        ...prev,
        [studentId]: { status: "error", message: err.message },
      }));
    }
  };

  // === 10. JSX ===
  return (
    <div className="space-y-6">
      {/* --- Main Criteria Form --- */}
      {/* ... (This section is correct, no changes needed) ... */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-medium mb-4">Select Evaluation Criteria</h3>
        {error && (
          <div className="flex items-center p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}

        {/* --- Row 1: Class, Division, Roll No --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <SelectInput
            label="Class"
            value={selectedGrade}
            onChange={setSelectedGrade}
            options={gradeOptions}
            disabled={isLoading}
          />
          <SelectInput
            label="Division"
            value={selectedDivision}
            onChange={setSelectedDivision}
            options={divisionOptions}
            disabled={!selectedGrade}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roll No. (Optional)
            </label>
            <input
              type="text"
              value={searchRollNo}
              onChange={(e) => setSearchRollNo(e.target.value)}
              placeholder="Search by Roll No..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              disabled={!selectedDivision}
            />
          </div>
          <button
            onClick={handleFetchStudents}
            disabled={!selectedDivision || isLoadingStudents}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isLoadingStudents ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5 mr-2" />
            )}
            Fetch Students
          </button>
        </div>

        {/* --- Separator --- */}
        <hr className="my-6" />

        {/* --- Row 2: Subject, Exam Type, Paper --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectInput
            label="Subject"
            value={selectedSubject}
            onChange={setSelectedSubject}
            options={subjectOptions}
            disabled={!selectedDivision}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholderText="Select Date (Optional)"
            />
          </div>
          <SelectInput
            label="Exam Type"
            value={selectedExamType}
            onChange={setSelectedExamType}
            options={[
              { value: "Unit Test", label: "Unit Test" },
              { value: "Midterm", label: "Midterm" },
              { value: "Final", label: "Final" },
            ]}
            disabled={!selectedSubject}
          />
          <SelectInput
            label="Question Paper"
            value={selectedPaperGroup ? selectedPaperGroup._id : ""}
            onChange={handlePaperGroupChange}
            options={paperGroupOptions}
            placeholder={
              isLoadingPapers
                ? "Loading papers..."
                : paperGroupOptions.length === 0
                ? "No papers found"
                : "Select Paper..."
            }
            disabled={isLoadingPapers || !selectedExamType}
          />
        </div>
      </div>

      {/* --- Student List Table --- */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-medium mb-4">Upload Answer Sheets</h3>
        {studentFetchError && (
          <div className="flex items-center p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{studentFetchError}</span>
          </div>
        )}
        {isLoadingStudents ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500 mr-2" />
            <span className="text-gray-500">Loading students...</span>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paper Set
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Answer Sheet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Marks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* --- *** MODIFIED THIS ENTIRE TBODY BLOCK *** --- */}
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  // --- LOGIC TO FIND EVALUATION ---

                  // 1. Get LIVE upload status (from button click)
                  const liveStatus = uploadStatus[student._id] || {};

                  // 2. Get the IDs of all paper sets in the currently selected group
                  const currentPaperSetIds = paperSets.map((p) => p._id);

                  // 3. Get all existing evaluations for this student
                  const studentEvals = existingEvals[student._id] || [];

                  if (student.rollNo === "1") {
                    // Log only for the first student
                    console.log("--- DEBUG FOR AARAV PATEL ---");
                    console.log("Available Paper Set IDs:", currentPaperSetIds);
                    console.log("Student's Existing Evals:", studentEvals);
                  }

                  // 4. Find the *first* existing eval that matches a paper in the current group
                  const existingEval = studentEvals.find((e) =>
                    currentPaperSetIds.includes(e.questionPaperId)
                  );

                  // 5. Determine final status
                  let finalStatus = "pending";
                  let evalData = null;

                  if (liveStatus.status === "success") {
                    finalStatus = "success";
                    evalData = liveStatus.data;
                  } else if (liveStatus.status === "loading") {
                    finalStatus = "loading";
                  } else if (liveStatus.status === "error") {
                    finalStatus = "error";
                  } else if (existingEval) {
                    finalStatus = "completed"; // Found in DB
                    evalData = existingEval;
                  }

                  const isEvaluated =
                    finalStatus === "success" || finalStatus === "completed";
                  const isLoading = finalStatus === "loading";

                  // 6. Get Marks
                  const obtainedMarks = evalData?.totalMarksObtained;
                  const paperTotalMarks =
                    evalData?.evaluationResults?.totalMarks;

                  // 7. Get Set Info
                  // Find the ID of the paper set to show
                  let paperSetIdToShow = null;
                  if (finalStatus === "success") {
                    // On live upload, use the ID from the dropdown
                    paperSetIdToShow = selectedSets[student._id];
                  } else if (finalStatus === "completed") {
                    // On load, use the ID from the DB record
                    paperSetIdToShow = evalData.questionPaperId;
                  }

                  const setIndex = paperSets.findIndex(
                    (s) => s._id === paperSetIdToShow
                  );

                  const setLabel =
                    setIndex >= 0
                      ? `Set ${String.fromCharCode(65 + setIndex)}`
                      : "—";

                  return (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Roll: {student.rollNo}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEvaluated ? (
                          <div className="text-sm text-gray-700 px-3 py-2">
                            {setLabel}
                          </div>
                        ) : (
                          <select
                            value={selectedSets[student._id] || ""}
                            onChange={(e) =>
                              handleSetSelection(student._id, e.target.value)
                            }
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={paperSets.length === 0 || isLoading}
                          >
                            <option value="">Select set...</option>
                            {paperSets.map((set, index) => (
                              <option key={set._id} value={set._id}>
                                Set {String.fromCharCode(65 + index)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEvaluated ? (
                          <span className="text-sm text-gray-500 italic px-3 py-2">
                            Evaluated
                          </span>
                        ) : (
                          <label className="text-sm text-gray-600 cursor-pointer">
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/png"
                              onChange={(e) =>
                                handleFileChange(student._id, e.target.files[0])
                              }
                              className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-semibold
                              file:bg-indigo-50 file:text-indigo-700
                              hover:file:bg-indigo-100"
                              disabled={isLoading}
                            />
                          </label>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEvaluated ? (
                          <span className="text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md">
                            {obtainedMarks ?? "?"} / {paperTotalMarks ?? "?"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEvaluated ? (
                          // If evaluated, show a link to the report
                          <Link
                            to={`/reports/${evalData._id}`}
                            target="_blank"
                            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                          >
                            View Report
                          </Link>
                        ) : (
                          // Otherwise, show the upload button
                          <button
                            onClick={() => handleSubmit(student._id)}
                            disabled={
                              !selectedSets[student._id] ||
                              !uploadedFiles[student._id] ||
                              isLoading
                            }
                            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UploadCloud className="w-4 h-4 mr-2" />
                            )}
                            {isLoading ? "Evaluating..." : "Upload"}
                          </button>
                        )}
                        {finalStatus === "error" && (
                          <p
                            className="text-xs text-red-600 mt-1"
                            title={liveStatus.message}
                          >
                            Upload failed.
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoadingStudents && (
            <p className="text-sm text-gray-500 px-2 py-4">
              Select a class and division, then click "Fetch Students" to begin.
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default EvaluationSetupForm;

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
  X,
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

// --- *** NEW MODAL COMPONENT *** ---
const PaperSelectionModal = ({
  isOpen,
  onClose,
  paperGroups,
  onSelect,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "20px",
          width: "90%",
          maxWidth: "700px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h4
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Select a Question Paper
          </h4>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Table Wrapper */}
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table
            className="min-w-full divide-y divide-gray-200"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Exam Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sets
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin inline-block" />
                  </td>
                </tr>
              ) : paperGroups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No paper groups found for this subject.
                  </td>
                </tr>
              ) : (
                paperGroups.map((group) => (
                  <tr key={group._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {new Date(group.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {group.examType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {group.sets}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => onSelect(group)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
// --- *** END NEW MODAL COMPONENT *** ---

const EvaluationSetupForm = () => {
  const { user } = useAuth();

  // --- State for Dropdowns ---
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [allPaperGroups, setAllPaperGroups] = useState([]);
  const [selectedPaperGroup, setSelectedPaperGroup] = useState(null);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  // --- State for Data Options ---
  const [allAssignments, setAllAssignments] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  // --- State for Students & Uploads ---
  const [students, setStudents] = useState([]);
  const [paperSets, setPaperSets] = useState([]);
  const [selectedSets, setSelectedSets] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [existingEvals, setExistingEvals] = useState({});

  // --- Loading & Error State ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  const [searchRollNo, setSearchRollNo] = useState("");
  const [studentFetchError, setStudentFetchError] = useState(null);

  // === 1. Fetch Initial Assignments (on load) ===
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
  useEffect(() => {
    if (!selectedGrade) {
      setDivisionOptions([]);
      setSelectedDivision("");
      return;
    }
    const divisions = [
      ...new Set(
        allAssignments
          .filter((a) => a.classId.grade.toString() === selectedGrade)
          .map((a) => a.classId.division)
      ),
    ];
    setDivisionOptions(
      divisions.sort().map((div) => ({ value: div, label: div }))
    );
  }, [selectedGrade, allAssignments]);

  // === 3. Update Subject Options (No API call, logic is fine) ===
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
              a.classId.grade.toString() === selectedGrade &&
              a.classId.division === selectedDivision
          )
          .map((a) => [a.subjectId.name, a.subjectId.name])
      ),
    ];
    setSubjectOptions(
      subjects.map(([id, name]) => ({ value: name, label: name }))
    );
  }, [selectedDivision, selectedGrade, allAssignments]);

  // === 5. Handler to manually fetch students ===
  const handleFetchStudents = async () => {
    if (!selectedGrade || !selectedDivision) {
      setStudentFetchError("Please select a Class and Division first.");
      return;
    }
    setIsLoadingStudents(true);
    setStudentFetchError(null);
    setStudents([]);
    setExistingEvals({});
    setUploadStatus({});

    try {
      const [studentRes, evalRes] = await Promise.all([
        teacherAPI.getStudentsByClass(
          selectedGrade,
          selectedDivision,
          searchRollNo
        ),
        evaluationAPI.getEvaluationsByClass(selectedGrade, selectedDivision),
      ]);

      if (studentRes.success) {
        setStudents(studentRes.data);
        if (studentRes.data.length === 0) {
          setStudentFetchError("No students found matching these criteria.");
        }
      } else {
        throw new Error(studentRes.message);
      }

      if (evalRes.success) {
        console.log("Existing evaluations fetched:", evalRes.data);
        setExistingEvals(evalRes.data);
      } else {
        console.error("Could not fetch existing evaluations");
      }
    } catch (err) {
      setStudentFetchError(`Failed to fetch students: ${err.message}`);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // === 6. Fetch *ALL* Paper Groups (when subject changes) ===
  useEffect(() => {
    if (!selectedGrade || !selectedSubject) {
      setAllPaperGroups([]);
      setSelectedPaperGroup(null); // <-- ADD THIS
      setPaperSets([]);
      return;
    }
    const fetchPapers = async () => {
      setIsLoadingPapers(true);
      setAllPaperGroups([]);
      setSelectedPaperGroup(null); // <-- ADD THIS
      setPaperSets([]);
      try {
        const res = await teacherAPI.getFilteredPaperGroups(
          selectedGrade,
          selectedSubject
        );
        if (res.success) {
          setAllPaperGroups(res.data);
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
  }, [selectedGrade, selectedSubject]);

  // === 7. NEW: Handlers for Paper Modal ===
  const handleSelectPaper = (group) => {
    setSelectedPaperGroup(group);
    const sets = group.papers || [];
    setPaperSets(sets);
    setIsPaperModalOpen(false);

    // --- *** NEW AUTO-ASSIGN LOGIC *** ---
    if (students.length > 0 && sets.length > 0) {
      const newSelectedSets = {};

      // We must respect the existing sort order of students (by roll no)
      students.forEach((student, index) => {
        // Check if this student ALREADY has an evaluation for one of the sets in this group
        const studentEvals = existingEvals[student._id] || [];
        const existingEval = studentEvals.find((e) =>
          sets.some((s) => s._id === e.questionPaperId)
        );

        if (existingEval) {
          // If they do, set the dropdown to that existing paper's ID
          newSelectedSets[student._id] = existingEval.questionPaperId;
        } else {
          // Otherwise, assign cyclically based on the student's index in the list
          const setIndex = index % sets.length;
          const assignedSetId = sets[setIndex]._id;
          newSelectedSets[student._id] = assignedSetId;
        }
      });
      setSelectedSets(newSelectedSets);
    } else {
      // No students or no sets, just clear it
      setSelectedSets({});
    }
    // --- *** END NEW LOGIC *** ---
  };

  // === 8. Handlers for student list (No API call, logic is fine) ===
  const handleSetSelection = (studentId, paperSetId) => {
    setSelectedSets((prev) => ({ ...prev, [studentId]: paperSetId }));
  };
  const handleFileChange = (studentId, file) => {
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [studentId]: file }));
    }
  };

  // === 9. Handle Submit (No changes, this is fine) ===
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
        setUploadStatus((prev) => ({
          ...prev,
          [studentId]: { status: "success", data: res.data },
        }));
        setExistingEvals((prev) => {
          const newEvals = { ...prev };
          if (!newEvals[studentId]) {
            newEvals[studentId] = [];
          }
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
    // --- *** MODIFICATION HERE: Added wrapper div *** ---
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* --- Main Criteria Form --- */}
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-medium mb-4">
            Select Evaluation Criteria
          </h3>
          {error && (
            <div className="flex items-center p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}

          {/* --- *** MODIFIED ROW 1 (12-col grid) *** --- */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-2">
              <SelectInput
                label="Class"
                value={selectedGrade}
                onChange={setSelectedGrade}
                options={gradeOptions}
                disabled={isLoading}
              />
            </div>
            <div className="md:col-span-2">
              <SelectInput
                label="Division"
                value={selectedDivision}
                onChange={setSelectedDivision}
                options={divisionOptions}
                disabled={!selectedGrade}
              />
            </div>
            <div className="md:col-span-3">
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
            <div className="md:col-span-2">
              <button
                onClick={handleFetchStudents}
                disabled={!selectedDivision || isLoadingStudents}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {isLoadingStudents ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 mr-2" />
                )}
                Fetch Students
              </button>
            </div>
          </div>

          {/* --- Separator --- */}
          <hr className="my-6" />

          {/* --- *** MODIFIED ROW 2 (12-col grid) *** --- */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <SelectInput
                label="Subject"
                value={selectedSubject}
                onChange={setSelectedSubject}
                options={subjectOptions}
                disabled={!selectedDivision}
              />
            </div>
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Paper
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  placeholder="Select a paper..."
                  value={
                    selectedPaperGroup ? selectedPaperGroup.groupTitle : ""
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                />
                <button
                  onClick={() => setIsPaperModalOpen(true)}
                  disabled={!selectedSubject || isLoadingPapers}
                  className="flex-shrink-0 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {isLoadingPapers ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Select"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Student List Table (No changes here) --- */}
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const liveStatus = uploadStatus[student._id] || {};
                    const currentPaperSetIds = paperSets.map((p) => p._id);
                    const studentEvals = existingEvals[student._id] || [];

                    const existingEval = studentEvals.find((e) =>
                      currentPaperSetIds.includes(e.questionPaperId)
                    );

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
                      finalStatus = "completed";
                      evalData = existingEval;
                    }

                    const isEvaluated =
                      finalStatus === "success" || finalStatus === "completed";
                    const isLoading = finalStatus === "loading";

                    const obtainedMarks = evalData?.totalMarksObtained;
                    const paperTotalMarks =
                      evalData?.evaluationResults?.totalMarks;

                    let paperSetIdToShow = null;
                    if (finalStatus === "success") {
                      paperSetIdToShow = selectedSets[student._id];
                    } else if (finalStatus === "completed") {
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
                                  handleFileChange(
                                    student._id,
                                    e.target.files[0]
                                  )
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
                            <Link
                              to={`/reports/${evalData._id}`}
                              target="_blank"
                              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                              View Report
                            </Link>
                          ) : (
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
                Select a class and division, then click "Fetch Students" to
                begin.
              </p>
            )
          )}
        </div>

        {/* --- ADDED THE MODAL RENDER --- */}
        <PaperSelectionModal
          isOpen={isPaperModalOpen}
          onClose={() => setIsPaperModalOpen(false)}
          paperGroups={allPaperGroups}
          onSelect={handleSelectPaper}
          isLoading={isLoadingPapers}
        />
      </div>
    </div>
  );
};

export default EvaluationSetupForm;

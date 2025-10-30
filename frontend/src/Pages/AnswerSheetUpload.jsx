import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
// Import the new services
import {
  bookAPI,
  teacherAPI,
  evaluationAPI,
  fetchTeacherProfile,
} from "../utils/api";
import { Loader2, AlertCircle, UploadCloud } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
      <option value="">{placeholder || `Select ${label}...`}</option>
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
  const [uploadStatus, setUploadStatus] = useState({});

  // --- Loading & Error State ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);

  // === 1. Fetch Initial Assignments (on load) ===
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user || !user.email) return;
      setIsLoading(true);
      setError(null);
      try {
        // --- REFACTORED ---
        const profile = await fetchTeacherProfile();
        const schoolId = profile.schoolId;
        if (!schoolId) throw new Error("School ID not found.");

        // This call was already using bookAPI, so it's fine
        const res = await bookAPI.getTeacherAssignments(schoolId, user.email);
        if (!res.data.success) throw new Error(res.data.message);
        // --- END REFACTOR ---

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
          .filter((a) => a.classId.grade === parseInt(selectedGrade))
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

  // === 4. Fetch Students (when Division changes) ===
  useEffect(() => {
    if (!selectedGrade || !selectedDivision) {
      setStudents([]);
      return;
    }
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      setStudents([]);
      try {
        // --- REFACTORED ---
        const res = await teacherAPI.getStudentsByClass(
          selectedGrade,
          selectedDivision
        );
        if (res.success) {
          setStudents(res.data);
        } else {
          throw new Error(res.message);
        }
        // --- END REFACTOR ---
      } catch (err) {
        setError(`Failed to fetch students: ${err.message}`);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [selectedGrade, selectedDivision]);

  // === 5. Fetch Filtered Paper Groups (when filters change) ===
  useEffect(() => {
    if (!selectedGrade || !selectedSubject || !selectedExamType) {
      setPaperGroupOptions([]);
      return;
    }
    const fetchPapers = async () => {
      setIsLoadingPapers(true);
      setPaperGroupOptions([]);
      try {
        // --- REFACTORED ---
        const res = await teacherAPI.getFilteredPaperGroups(
          selectedGrade,
          selectedSubject,
          selectedExamType
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
        // --- END REFACTOR ---
      } catch (err) {
        setError(`Failed to fetch papers: ${err.message}`);
      } finally {
        setIsLoadingPapers(false);
      }
    };
    fetchPapers();
  }, [selectedGrade, selectedSubject, selectedExamType]);

  // === 6. Handle Paper Group Change (No API call, logic is fine) ===
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

  // === 7. Handlers for student list (No API call, logic is fine) ===
  const handleSetSelection = (studentId, paperSetId) => {
    setSelectedSets((prev) => ({ ...prev, [studentId]: paperSetId }));
  };

  const handleFileChange = (studentId, file) => {
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [studentId]: file }));
    }
  };

  // === 8. Handle Submit ===
  const handleSubmit = async (studentId) => {
    const questionPaperId = selectedSets[studentId];
    const answerSheetFile = uploadedFiles[studentId];

    if (!questionPaperId || !answerSheetFile) {
      alert(
        "Please select a paper set and upload an answer sheet for this student."
      );
      return;
    }

    setUploadStatus((prev) => ({ ...prev, [studentId]: "loading" }));

    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("questionPaperId", questionPaperId);
      formData.append("answerSheet", answerSheetFile);

      // --- REFACTORED ---
      const res = await evaluationAPI.uploadAnswerSheet(formData);
      if (res.success) {
        setUploadStatus((prev) => ({ ...prev, [studentId]: "success" }));
      } else {
        throw new Error(res.message);
      }
      // --- END REFACTOR ---
    } catch (err) {
      setUploadStatus((prev) => ({
        ...prev,
        [studentId]: "error",
        message: err.message,
      }));
    }
  };

  // === 9. JSX (No changes needed) ===
  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-medium mb-4">Select Evaluation Criteria</h3>
        {error && (
          <div className="flex items-center p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              isLoadingPapers ? "Loading papers..." : "Select Paper..."
            }
            disabled={isLoadingPapers || !selectedExamType}
          />
        </div>
      </div>

      {/* --- Student List Table --- */}
      {(isLoadingStudents || students.length > 0) && (
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-medium mb-4">Upload Answer Sheets</h3>
          {isLoadingStudents ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500 mr-2" />
              <span className="text-gray-500">Loading students...</span>
            </div>
          ) : (
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Roll: {student.rollNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={selectedSets[student._id] || ""}
                          onChange={(e) =>
                            handleSetSelection(student._id, e.target.value)
                          }
                          className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                          disabled={paperSets.length === 0}
                        >
                          <option value="">Select set...</option>
                          {paperSets.map((set, index) => (
                            <option key={set._id} value={set._id}>
                              Set {String.fromCharCode(65 + index)} (
                              {set.paper?.maxMarks || 0} Marks)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSubmit(student._id)}
                          disabled={
                            !selectedSets[student._id] ||
                            !uploadedFiles[student._id] ||
                            uploadStatus[student._id] === "loading"
                          }
                          className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                          {uploadStatus[student._id] === "loading" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UploadCloud className="w-4 h-4 mr-2" />
                          )}
                          {uploadStatus[student._id] === "success"
                            ? "Uploaded"
                            : "Upload"}
                        </button>
                        {uploadStatus[student._id] === "error" && (
                          <p
                            className="text-xs text-red-600 mt-1"
                            title={uploadStatus[student._id].message}
                          >
                            Upload failed.
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluationSetupForm;

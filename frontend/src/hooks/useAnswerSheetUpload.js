import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { bookAPI, teacherAPI, evaluationAPI, fetchTeacherProfile } from "../utils/api";

export const useAnswerSheetUpload = () => {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchRollNo, setSearchRollNo] = useState("");
  
  const [allAssignments, setAllAssignments] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  
  const [students, setStudents] = useState([]);
  const [allPaperGroups, setAllPaperGroups] = useState([]);
  const [selectedPaperGroup, setSelectedPaperGroup] = useState(null);
  const [paperSets, setPaperSets] = useState([]);
  const [selectedSets, setSelectedSets] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [existingEvals, setExistingEvals] = useState({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  const [studentFetchError, setStudentFetchError] = useState(null);

  // Fetch Initial Assignments
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
        const uniqueGrades = [...new Set(assignments.map((a) => a.classId.grade))];
        setGradeOptions(
          uniqueGrades
            .sort((a, b) => a - b)
            .map((grade) => ({ value: String(grade), label: `Class ${grade}` }))
        );
      } catch (err) {
        setError(err.message || "Failed to load initial data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  // Update Division Options
  useEffect(() => {
    if (!selectedGrade) {
      setDivisionOptions([]);
      setSelectedDivision("");
      return;
    }
    const divisions = [
      ...new Set(
        allAssignments
          .filter((a) => String(a.classId.grade) === selectedGrade)
          .map((a) => a.classId.division)
      ),
    ];
    setDivisionOptions(divisions.sort().map((div) => ({ value: div, label: div })));
  }, [selectedGrade, allAssignments]);

  // Update Subject Options
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
              String(a.classId.grade) === selectedGrade &&
              a.classId.division === selectedDivision
          )
          .map((a) => [a.subjectId.name, a.subjectId.name])
      ),
    ];
    setSubjectOptions(subjects.map(([id, name]) => ({ value: name, label: name })));
  }, [selectedDivision, selectedGrade, allAssignments]);

  // Fetch Paper Groups
  useEffect(() => {
    if (!selectedGrade || !selectedSubject) {
      setAllPaperGroups([]);
      setSelectedPaperGroup(null);
      setPaperSets([]);
      return;
    }
    const fetchPapers = async () => {
      setIsLoadingPapers(true);
      setAllPaperGroups([]);
      setSelectedPaperGroup(null);
      setPaperSets([]);
      try {
        const res = await teacherAPI.getFilteredPaperGroups(selectedGrade, selectedSubject);
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

  // Fetch Students
  const handleFetchStudents = useCallback(async () => {
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
        teacherAPI.getStudentsByClass(selectedGrade, selectedDivision, searchRollNo),
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
        setExistingEvals(evalRes.data);
      }
    } catch (err) {
      setStudentFetchError(`Failed to fetch students: ${err.message}`);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedGrade, selectedDivision, searchRollNo]);

  // Handle Paper Selection
  const handleSelectPaper = useCallback((group) => {
    setSelectedPaperGroup(group);
    const sets = group.papers || [];
    setPaperSets(sets);
    
    if (students.length > 0 && sets.length > 0) {
      const newSelectedSets = {};
      students.forEach((student, index) => {
        const studentEvals = existingEvals[student._id] || [];
        const existingEval = studentEvals.find((e) =>
          sets.some((s) => s._id === e.questionPaperId)
        );
        if (existingEval) {
          newSelectedSets[student._id] = existingEval.questionPaperId;
        } else {
          const setIndex = index % sets.length;
          newSelectedSets[student._id] = sets[setIndex]._id;
        }
      });
      setSelectedSets(newSelectedSets);
    } else {
      setSelectedSets({});
    }
  }, [students, existingEvals]);

  // Handle Upload
  const handleSubmit = useCallback(async (studentId) => {
    const questionPaperId = selectedSets[studentId];
    const answerSheetFile = uploadedFiles[studentId];

    if (!questionPaperId || !answerSheetFile) {
      return { success: false, message: "Please select a paper set and upload an answer sheet." };
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
        return { success: true, data: res.data };
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setUploadStatus((prev) => ({
        ...prev,
        [studentId]: { status: "error", message: err.message },
      }));
      return { success: false, message: err.message };
    }
  }, [selectedSets, uploadedFiles]);

  // Persistence
  useEffect(() => {
    const savedGrade = sessionStorage.getItem("eval_grade");
    const savedDiv = sessionStorage.getItem("eval_div");
    const savedSub = sessionStorage.getItem("eval_subject");
    if (savedGrade) setSelectedGrade(savedGrade);
    if (savedDiv) setSelectedDivision(savedDiv);
    if (savedSub) setSelectedSubject(savedSub);
  }, []);

  useEffect(() => {
    if (selectedGrade) sessionStorage.setItem("eval_grade", selectedGrade);
    if (selectedDivision) sessionStorage.setItem("eval_div", selectedDivision);
    if (selectedSubject) sessionStorage.setItem("eval_subject", selectedSubject);
  }, [selectedGrade, selectedDivision, selectedSubject]);

  return {
    // State
    selectedGrade,
    setSelectedGrade,
    selectedDivision,
    setSelectedDivision,
    selectedSubject,
    setSelectedSubject,
    searchRollNo,
    setSearchRollNo,
    gradeOptions,
    divisionOptions,
    subjectOptions,
    students,
    allPaperGroups,
    selectedPaperGroup,
    paperSets,
    selectedSets,
    setSelectedSets,
    uploadedFiles,
    setUploadedFiles,
    uploadStatus,
    existingEvals,
    isLoading,
    error,
    isLoadingStudents,
    isLoadingPapers,
    studentFetchError,
    // Handlers
    handleFetchStudents,
    handleSelectPaper,
    handleSubmit,
  };
};


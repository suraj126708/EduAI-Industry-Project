import React, { useState, useCallback, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { bookAPI, fetchTeacherProfile } from "../utils/api";

const createInitialRow = () => ({
  id: Date.now(),
  class: "",
  subject: "",
  file: null,
  status: "pending",
  progress: 0,
  error: null,
  filteredSubjects: [],
  progressMessage: "",
});

export const useBookUpload = () => {
  const [documentRows, setDocumentRows] = useState([createInitialRow()]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [schoolId, setSchoolId] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [uniqueClasses, setUniqueClasses] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(null);

  // Fetch Teacher Profile
  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const profile = await fetchTeacherProfile();
        if (mounted && profile.schoolId) {
          setSchoolId(profile.schoolId);
        } else if (mounted) {
          throw new Error("SchoolId not found in teacher profile.");
        }
      } catch (e) {
        console.error("Failed to fetch teacher profile", e);
        if (mounted) {
          setProfileError(
            e.message ||
              "Could not load teacher profile. Uploading is disabled."
          );
        }
      } finally {
        if (mounted) setIsProfileLoading(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Teacher Assignments
  useEffect(() => {
    let mounted = true;
    const loadTeacherAssignments = async () => {
      if (!schoolId) return;

      setAssignmentsLoading(true);
      setAssignmentsError(null);

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("No current user found");

        const response = await bookAPI.getTeacherAssignments(
          schoolId,
          currentUser.email
        );

        if (!mounted) return;

        const fetchedAssignments = response.data?.data?.assignments || [];
        setTeacherAssignments(fetchedAssignments);

        const uniqueClassMap = new Map();
        fetchedAssignments.forEach((a) => {
          if (
            a.classId &&
            a.classId._id &&
            typeof a.classId.grade === "number"
          ) {
            if (!uniqueClassMap.has(a.classId._id)) {
              uniqueClassMap.set(a.classId._id, {
                _id: a.classId._id,
                value: String(a.classId.grade),
                label: String(a.classId.grade),
                grade: a.classId.grade,
              });
            }
          }
        });
        const sortedClasses = Array.from(uniqueClassMap.values()).sort(
          (a, b) => a.grade - b.grade
        );
        setUniqueClasses(sortedClasses);
      } catch (error) {
        console.error("Failed to load teacher assignments:", error);
        if (mounted) {
          setAssignmentsError("Failed to load teacher assignments");
        }
      } finally {
        if (mounted) setAssignmentsLoading(false);
      }
    };

    loadTeacherAssignments();
    return () => {
      mounted = false;
    };
  }, [schoolId]);

  const handleClassChangeForRow = useCallback(
    (rowId, selectedClassValue, uniqueClasses, teacherAssignments) => {
      setDocumentRows((rows) => {
        const selectedClassObj = uniqueClasses.find(
          (c) => c.value === selectedClassValue
        );
        const selectedClassId = selectedClassObj?._id;

        let filteredSubs = [];
        if (selectedClassId) {
          const relevantAssignments = teacherAssignments.filter(
            (a) => a.classId?._id === selectedClassId && a.subjectId
          );

          const subjectMap = new Map();
          relevantAssignments.forEach((a) => {
            if (a.subjectId && !subjectMap.has(a.subjectId._id)) {
              subjectMap.set(a.subjectId._id, {
                _id: a.subjectId._id,
                value: a.subjectId.name.toLowerCase().replace(/\s+/g, "_"),
                label: a.subjectId.name,
                name: a.subjectId.name,
              });
            }
          });
          filteredSubs = Array.from(subjectMap.values()).sort((a, b) =>
            a.label.localeCompare(b.label)
          );
        }

        return rows.map((r) =>
          r.id === rowId
            ? {
                ...r,
                class: selectedClassValue,
                subject: "",
                filteredSubjects: filteredSubs,
                status: "pending",
                error: null,
                progress: 0,
              }
            : r
        );
      });
    },
    []
  );

  const updateRow = useCallback(
    (id, key, value) => {
      if (key === "class") {
        handleClassChangeForRow(id, value, uniqueClasses, teacherAssignments);
      } else {
        setDocumentRows((rows) =>
          rows.map((r) =>
            r.id === id
              ? {
                  ...r,
                  [key]: value,
                  ...(key === "subject" && r.status === "error"
                    ? {
                        status: "pending",
                        error: null,
                        progress: 0,
                        progressMessage: "",
                      }
                    : {}),
                }
              : r
          )
        );
      }
    },
    [handleClassChangeForRow, uniqueClasses, teacherAssignments]
  );

  const addNewRow = useCallback(() => {
    setDocumentRows((rows) => [...rows, createInitialRow()]);
  }, []);

  const removeRow = useCallback((id) => {
    setDocumentRows((rows) => {
      if (rows.length > 1) {
        return rows.filter((r) => r.id !== id);
      }
      return rows;
    });
  }, []);

  const resetRow = useCallback((id) => {
    setDocumentRows((rows) =>
      rows.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "pending",
              error: null,
              progress: 0,
              progressMessage: "",
            }
          : r
      )
    );
  }, []);

  const clearProcessedRows = useCallback(() => {
    setDocumentRows((rows) => {
      const remaining = rows.filter((r) => r.status !== "processed");
      setUploadResults([]);
      return remaining.length > 0 ? remaining : [createInitialRow()];
    });
  }, []);

  return {
    documentRows,
    setDocumentRows,
    isUploading,
    setIsUploading,
    uploadResults,
    setUploadResults,
    schoolId,
    isProfileLoading,
    profileError,
    teacherAssignments,
    uniqueClasses,
    assignmentsLoading,
    assignmentsError,
    updateRow,
    addNewRow,
    removeRow,
    resetRow,
    clearProcessedRows,
  };
};

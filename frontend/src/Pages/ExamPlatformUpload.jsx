/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { auth } from "../firebase/firebase";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Loader2,
  Search,
  BookOpen,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bookAPI, fetchTeacherProfile } from "../utils/api.js";

// --- Helper Components ---

const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: "Pending", classes: "bg-gray-100 text-gray-700" },
    uploading: { label: "Uploading...", classes: "bg-blue-100 text-blue-700" },
    processing: {
      label: "AI Processing...",
      classes: "bg-purple-100 text-purple-700",
    },
    processed: { label: "Completed", classes: "bg-green-100 text-green-700" },
    error: { label: "Error", classes: "bg-red-100 text-red-700" },
  }[status] || { label: "Pending", classes: "bg-gray-100 text-gray-700" };

  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${config.classes}`}
    >
      {config.label}
    </span>
  );
};

const ProgressBar = ({ progress, status, message }) => {
  // Determine stage message based on progress
  // Note: Backend sends messages dynamically, these are fallbacks only
  const getStageMessage = () => {
    if (message) return message; // Always use backend message if available
    if (progress <= 5) return "Uploading Book...";
    if (progress <= 33) return "Extracting Chapters...";
    if (progress <= 66) return "Elements Extracting (Images/Tables)...";
    if (progress <= 85) return "Storing Vectors in Database...";
    if (progress >= 100) return "Upload Complete! Redirecting...";
    return "Processing...";
  };

  const stageMessage = getStageMessage();

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-2 rounded-full ${
            status === "error"
              ? "bg-red-500"
              : status === "processed"
              ? "bg-green-500"
              : status === "processing"
              ? "bg-purple-500"
              : "bg-blue-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "linear", duration: 0.2 }}
        />
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="flex items-center gap-2">
          {status === "processed" && progress >= 100 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="text-green-500" size={14} />
            </motion.div>
          )}
          {stageMessage}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

const FileUploader = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onFileSelect(e.dataTransfer.files);
  };
  return (
    <label
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex items-center justify-center w-full h-11 px-3 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
    >
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Upload size={16} />
        <span className="hidden sm:inline">Drag PDF or Click</span>
        <span className="sm:hidden">Select PDF</span>
      </div>
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files)}
      />
    </label>
  );
};

// --- Main Component ---
const ExamPlatformUpload = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [uniqueClasses, setUniqueClasses] = useState([]);

  const [documentRows, setDocumentRows] = useState([
    {
      id: Date.now(),
      class: "",
      subject: "",
      file: null,
      status: "pending",
      progress: 0,
      error: null,
      filteredSubjects: [],
      progressMessage: "",
    },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);

  // States for fetching schoolId and handling profile loading
  const [schoolId, setSchoolId] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // States for finding books
  const [books, setBooks] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(null);

  // 1. Fetch Teacher Profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await fetchTeacherProfile();
        if (profile.schoolId) {
          setSchoolId(profile.schoolId);
        } else {
          throw new Error("SchoolId not found in teacher profile.");
        }
      } catch (e) {
        console.error("Failed to fetch teacher profile", e);
        setProfileError(
          e.message || "Could not load teacher profile. Uploading is disabled."
        );
      } finally {
        setIsProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  // 2. Fetch Teacher Assignments
  useEffect(() => {
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
        setAssignmentsError("Failed to load teacher assignments");
      } finally {
        setAssignmentsLoading(false);
      }
    };

    loadTeacherAssignments();
  }, [schoolId]);

  // Handle Class Dropdown Change
  const handleClassChangeForRow = (rowId, selectedClassValue) => {
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

    setDocumentRows((rows) =>
      rows.map((r) =>
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
      )
    );
  };

  const updateRow = (id, key, value) => {
    if (key === "class") {
      handleClassChangeForRow(id, value);
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
  };

  const addNewRow = () =>
    setDocumentRows((rows) => [
      ...rows,
      {
        id: Date.now(),
        class: "",
        subject: "",
        file: null,
        status: "pending",
        progress: 0,
        error: null,
        progressMessage: "",
      },
    ]);

  const removeRow = (id) => {
    if (documentRows.length > 1)
      setDocumentRows((rows) => rows.filter((r) => r.id !== id));
  };

  const clearProcessedRows = () => {
    const remaining = documentRows.filter((r) => r.status !== "processed");
    setUploadResults([]);
    setDocumentRows(
      remaining.length > 0
        ? remaining
        : [
            {
              id: Date.now(),
              class: "",
              subject: "",
              file: null,
              status: "pending",
              progress: 0,
              error: null,
              progressMessage: "",
            },
          ]
    );
  };

  const resetRow = (id) => {
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
  };

  const handleFileSelect = (id, files) => {
    const file = files && files[0];
    if (!file) return;
    resetRow(id);
    if (!file.type.includes("pdf")) {
      updateRow(id, "error", "Invalid file type. Please select a PDF.");
      return;
    }
    updateRow(id, "error", null);
    updateRow(id, "file", file);
  };

  // --- CORE LOGIC: Upload with SSE Progress Streaming ---
  const uploadBooks = async () => {
    if (!schoolId) {
      alert("Cannot upload: School information is missing.");
      return;
    }
    const validRows = documentRows.filter(
      (r) =>
        r.class && r.subject && r.file && !r.error && r.status === "pending"
    );
    if (validRows.length === 0) return;

    setIsUploading(true);
    setUploadResults([]);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("You must be logged in.");
      setIsUploading(false);
      return;
    }

    // Get auth token for SSE request
    const idToken = await currentUser.getIdToken();

    // Loop through rows
    const promises = validRows.map(async (row) => {
      // 1. Initial State
      updateRow(row.id, "status", "uploading");
      updateRow(row.id, "progress", 0);
      updateRow(row.id, "progressMessage", "Uploading Book...");

      // 2. Generate Unique Progress ID (Trace ID)
      const progressId = `${
        currentUser.uid
      }_${Date.now()}_${row.file.name.replace(/\s/g, "_")}`;

      const formData = new FormData();
      const selectedClassObj = uniqueClasses.find((c) => c.value === row.class);
      const selectedSubjectObj = row.filteredSubjects.find(
        (s) => s.value === row.subject
      );

      if (!selectedClassObj || !selectedSubjectObj) {
        updateRow(row.id, "status", "error");
        updateRow(row.id, "error", "Selection mismatch");
        return { success: false, filename: row.file?.name, error: "Mismatch" };
      }

      // 3. Append Data
      formData.append("pdf", row.file);
      formData.append("classId", String(selectedClassObj.grade));
      formData.append("subject", selectedSubjectObj.name);
      formData.append("schoolId", schoolId);
      formData.append("title", selectedSubjectObj.label);
      formData.append("author", "System");
      formData.append("year", new Date().getFullYear());
      formData.append("teacherId", currentUser.uid);
      formData.append("progressId", progressId);

      return new Promise(async (resolve) => {
        try {
          console.log(`[FRONTEND] Starting upload for ${row.file.name}`);
          // Use the same base URL as the api instance
          const apiUrl = `http://localhost:5001/api/teachers/upload-book?sse=true`;

          // Use fetch with streaming response for SSE
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
            body: formData,
          });

          if (
            !response.ok &&
            !response.headers.get("content-type")?.includes("text/event-stream")
          ) {
            // Not SSE response, handle as regular error
            const errorData = await response.json();
            updateRow(row.id, "status", "error");
            updateRow(row.id, "error", errorData.message || "Upload failed");
            updateRow(row.id, "progress", 0);
            resolve({
              success: false,
              filename: row.file.name,
              error: errorData.message || "Upload failed",
            });
            return;
          }

          // Read SSE stream
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.substring(6));

                  if (data.progress !== undefined) {
                    console.log(
                      `[FRONTEND] Progress update for ${row.file.name}: ${
                        data.progress
                      }% - ${data.message || data.stage || ""}`
                    );
                    updateRow(row.id, "progress", data.progress);
                    if (data.message) {
                      updateRow(row.id, "progressMessage", data.message);
                    }
                    if (data.stage) {
                      updateRow(row.id, "status", data.stage);
                    }
                  }

                  if (data.error || data.stage === "error") {
                    console.error(
                      `[FRONTEND] Error for ${row.file.name}:`,
                      data.message || data.error
                    );
                    updateRow(row.id, "status", "error");
                    updateRow(
                      row.id,
                      "error",
                      data.message || data.error || "Upload failed"
                    );
                    updateRow(row.id, "progress", 0);
                    resolve({
                      success: false,
                      filename: row.file.name,
                      error: data.message || data.error || "Upload failed",
                    });
                    return;
                  }

                  if (data.progress >= 100 || data.success) {
                    console.log(
                      `[FRONTEND] Upload complete for ${
                        row.file.name
                      } - Chunks: ${data.data?.noOfChunks || "N/A"}`
                    );
                    updateRow(row.id, "status", "processed");
                    updateRow(row.id, "progress", 100);
                    updateRow(
                      row.id,
                      "progressMessage",
                      "Upload Complete! Redirecting..."
                    );
                    resolve({
                      success: true,
                      filename: row.file.name,
                      chunks: data.data?.noOfChunks,
                      status: data.data?.processedStatus,
                    });
                    return;
                  }
                } catch (e) {
                  console.warn("[FRONTEND] Failed to parse SSE data:", e);
                }
              }
            }
          }
        } catch (err) {
          console.error("Upload error:", err);
          const errorMessage =
            err.response?.data?.message || err.message || "Unknown error.";

          updateRow(row.id, "status", "error");
          updateRow(row.id, "error", errorMessage);
          updateRow(row.id, "progress", 0);

          resolve({
            success: false,
            filename: row.file.name,
            error: errorMessage,
          });
        }
      });
    });

    const results = await Promise.all(promises);
    const finalResults = results.filter(
      (res) => res.error !== "Duplicate entry. User was notified."
    );

    setUploadResults(finalResults);
    setIsUploading(false);
  };

  const fetchBooksMetadata = async () => {
    setFetchLoading(true);
    setFetchError(null);
    setBooks([]);
    try {
      const response = await bookAPI.getMyBooks();
      if (response.success) {
        setBooks(response.data || []);
      } else {
        setFetchError("Failed to fetch books.");
      }
    } catch (error) {
      setFetchError(error.response?.data?.message || "Failed to fetch books.");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "find") {
      fetchBooksMetadata();
    }
  }, [activeTab]);

  const hasPendingRows = documentRows.some(
    (r) => r.class && r.subject && r.file && r.status === "pending"
  );
  const hasProcessedRows = documentRows.some((r) => r.status === "processed");

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        activeTab === id
          ? "bg-blue-600 text-white"
          : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* --- Main Container --- */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <header className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Book Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage educational materials for the platform.
          </p>
        </header>

        <nav className="flex gap-2 p-4 border-b border-gray-200 bg-gray-50">
          <TabButton id="upload" label="Upload Books" icon={Upload} />
          <TabButton id="find" label="Find Books" icon={Search} />
        </nav>

        <main className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "upload" && (
                <div>
                  {isProfileLoading || assignmentsLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="mt-4 font-semibold text-gray-700">
                        Loading Information...
                      </p>
                    </div>
                  ) : profileError || assignmentsError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-red-700 bg-red-50 rounded-lg">
                      <AlertCircle className="h-8 w-8" />
                      <p className="mt-4 font-semibold">Error Loading Data</p>
                      <p className="text-sm">
                        {profileError || assignmentsError}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <AnimatePresence>
                          {documentRows.map((row) => (
                            <motion.div
                              key={row.id}
                              layout
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="p-4 bg-gray-50 rounded-lg border"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                                {/* Class Dropdown */}
                                <select
                                  value={row.class}
                                  onChange={(e) =>
                                    updateRow(row.id, "class", e.target.value)
                                  }
                                  className="md:col-span-1 h-11 border-gray-300 rounded-md shadow-sm w-full bg-white"
                                  disabled={
                                    row.status === "uploading" ||
                                    row.status === "processing"
                                  }
                                >
                                  <option value="">Class</option>
                                  {uniqueClasses.map((c) => (
                                    <option key={c._id} value={c.value}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>

                                {/* Subject Dropdown */}
                                <select
                                  value={row.subject}
                                  onChange={(e) =>
                                    updateRow(row.id, "subject", e.target.value)
                                  }
                                  className="md:col-span-1 h-11 border-gray-300 rounded-md shadow-sm w-full bg-white"
                                  disabled={
                                    row.status === "uploading" ||
                                    row.status === "processing"
                                  }
                                >
                                  <option value="">Subject</option>
                                  {row.filteredSubjects.map((s) => (
                                    <option key={s._id} value={s.value}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>

                                {/* File Input Area */}
                                <div className="md:col-span-4">
                                  {row.file ? (
                                    <div className="flex items-center justify-between p-2 pl-3 border rounded-lg bg-white h-11">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText
                                          className="text-blue-500"
                                          size={18}
                                        />
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px] sm:max-w-xs">
                                          {row.file.name}
                                        </span>
                                      </div>

                                      {/* Only show remove button if not uploading/processing */}
                                      {row.status !== "uploading" &&
                                        row.status !== "processing" && (
                                          <button
                                            onClick={() =>
                                              updateRow(row.id, "file", null)
                                            }
                                            className="p-1 text-gray-400 hover:text-red-500"
                                          >
                                            <X size={16} />
                                          </button>
                                        )}
                                    </div>
                                  ) : (
                                    <FileUploader
                                      onFileSelect={(files) =>
                                        handleFileSelect(row.id, files)
                                      }
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Progress & Status Bar Area */}
                              <div className="mt-3 flex items-center justify-between gap-4">
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                                  <StatusBadge status={row.status} />

                                  {/* Progress Bar Display */}
                                  {(row.status === "uploading" ||
                                    row.status === "processing" ||
                                    row.status === "processed") && (
                                    <div className="flex-1 max-w-sm">
                                      <ProgressBar
                                        progress={row.progress}
                                        status={row.status}
                                        message={row.progressMessage}
                                      />
                                    </div>
                                  )}

                                  {/* Error Display */}
                                  {row.error && (
                                    <div className="flex items-center gap-3">
                                      <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} /> {row.error}
                                      </p>
                                      <button
                                        onClick={() => resetRow(row.id)}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                      >
                                        <Zap size={12} /> Retry
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => removeRow(row.id)}
                                  disabled={
                                    documentRows.length === 1 ||
                                    row.status === "uploading" ||
                                    row.status === "processing"
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Main Action Buttons */}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          onClick={addNewRow}
                          disabled={isUploading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg disabled:opacity-50"
                        >
                          <Plus size={16} /> Add Another
                        </button>
                        <button
                          disabled={!hasPendingRows || isUploading}
                          onClick={uploadBooks}
                          className="inline-flex items-center px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `Upload ${
                              documentRows.filter(
                                (r) => r.status === "pending" && r.file
                              ).length
                            } File(s)`
                          )}
                        </button>
                        {hasProcessedRows && (
                          <button
                            onClick={clearProcessedRows}
                            disabled={isUploading}
                            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            Clear Processed
                          </button>
                        )}
                      </div>

                      {/* Upload Summary */}
                      <AnimatePresence>
                        {uploadResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { delay: 0.3 } }}
                            className="mt-6"
                          >
                            <h3 className="font-semibold text-gray-800">
                              Upload Summary
                            </h3>
                            <div className="mt-2 space-y-2 text-sm">
                              {uploadResults.map((res, index) => (
                                <div
                                  key={index}
                                  className={`flex items-start gap-3 p-3 rounded-lg ${
                                    res.success ? "bg-green-50" : "bg-red-50"
                                  }`}
                                >
                                  {res.success ? (
                                    <CheckCircle className="text-green-500 mt-0.5" />
                                  ) : (
                                    <AlertCircle className="text-red-500 mt-0.5" />
                                  )}
                                  <div className="text-gray-700">
                                    <div>
                                      <span className="font-medium text-gray-900">
                                        {res.filename}
                                      </span>{" "}
                                      {res.success
                                        ? `was uploaded successfully.`
                                        : `- Failed: ${res.error}`}
                                    </div>
                                    {res.success &&
                                      typeof res.chunks === "number" && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          Chunks processed: {res.chunks}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              )}

              {activeTab === "find" && (
                <div>
                  {fetchError && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                      <AlertCircle className="inline w-4 h-4 mr-2" />
                      {fetchError}
                    </div>
                  )}
                  {books.length > 0 ? (
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="p-3">Subject</th>
                          <th className="p-3">Class</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Chunks</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map((book) => (
                          <tr
                            key={book._id}
                            className="bg-white border-b hover:bg-gray-50"
                          >
                            <td className="p-3 font-medium text-gray-900">
                              {book.title}
                            </td>
                            <td className="p-3">
                              {book.classId
                                ? `Class ${book.classId.grade}`
                                : "N/A"}
                            </td>
                            <td className="p-3">
                              <StatusBadge status={book.processedStatus} />
                            </td>
                            <td className="p-3">{book.noOfChunks ?? "-"}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Delete this book? This cannot be undone."
                                    )
                                  )
                                    return;
                                  try {
                                    const resp = await bookAPI.deleteBook(
                                      book._id
                                    );
                                    if (resp?.success) {
                                      setBooks((prev) =>
                                        prev.filter((b) => b._id !== book._id)
                                      );
                                    } else {
                                      alert(
                                        resp?.message || "Failed to delete book"
                                      );
                                    }
                                  } catch (err) {
                                    const msg =
                                      err?.response?.data?.message ||
                                      err.message ||
                                      "Failed to delete";
                                    alert(msg);
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    !fetchLoading && (
                      <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-lg">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 font-medium text-gray-900">
                          No Books Found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You haven't uploaded any books yet.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ExamPlatformUpload;

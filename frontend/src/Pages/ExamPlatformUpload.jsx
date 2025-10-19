/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
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
  CloudUpload,
  FileCheck,
  Zap,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bookAPI, fetchTeacherProfile } from "../utils/api.js";
import Loader from "../components/Loader.jsx";

// --- Constants ---

// --- Helper Components ---
const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: "Pending", classes: "bg-gray-100 text-gray-700" },
    uploading: { label: "Uploading", classes: "bg-blue-100 text-blue-700" },
    processed: { label: "Processed", classes: "bg-green-100 text-green-700" },
    error: { label: "Error", classes: "bg-red-100 text-red-700" },
    duplicate: { label: "Duplicate", classes: "bg-yellow-100 text-yellow-700" },
  }[status] || { label: "Pending", classes: "bg-gray-100 text-gray-700" };
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${config.classes}`}
    >
      {config.label}
    </span>
  );
};

// Removed local UploadLoader in favor of shared Loader component
const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
    <motion.div
      className="bg-blue-500 h-1.5 rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ ease: "linear", duration: 0.2 }}
    />
  </div>
);
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
        <span>Drag & Drop PDF or Click to Select</span>
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
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [documentRows, setDocumentRows] = useState([
    {
      id: Date.now(),
      class: "",
      subject: "",
      file: null,
      status: "pending",
      progress: 0,
      error: null,
    },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);

  // Enhanced loader states
  const [showLoader, setShowLoader] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("upload");
  const [currentFileName, setCurrentFileName] = useState("");

  // States for fetching schoolId and handling profile loading
  const [schoolId, setSchoolId] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // States for finding books
  const [books, setBooks] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // States for teacher assignments loading
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(null);

  // Fetch Teacher Profile on component mount
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

  // Fetch teacher assignments (classes and subjects)
  useEffect(() => {
    const loadTeacherAssignments = async () => {
      if (!schoolId) return; // Wait for schoolId to be loaded

      setAssignmentsLoading(true);
      setAssignmentsError(null);

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error("No current user found");
          setAssignmentsError("No current user found");
          return;
        }

        const response = await bookAPI.getTeacherAssignments(
          schoolId,
          currentUser.email
        );
        const { classes: assignedClasses, subjects: assignedSubjects } =
          response.data.data;

        console.log("Teacher assignments loaded:", {
          assignedClasses,
          assignedSubjects,
        });

        // Transform classes data (preserve raw numeric grade for API)
        const cls = assignedClasses.map((c) => ({
          value: c.grade.toString().padStart(2, "0"), // UI value with leading zero
          label: `${c.grade}`,
          grade: c.grade, // keep raw grade for backend
          _id: c._id,
          schoolName: c.schoolName,
        }));

        // Transform subjects data
        const subj = assignedSubjects.map((s) => ({
          value: s.subjectId || s.name.toLowerCase().replace(/\s+/g, "_"),
          label: s.name,
          name: s.name,
          subjectId: s.subjectId,
          _id: s._id,
          schoolName: s.schoolName,
        }));

        setClasses(cls);
        setSubjects(subj);
      } catch (error) {
        console.error("Failed to load teacher assignments:", error);
        setAssignmentsError(
          error.message || "Failed to load teacher assignments"
        );
        setClasses([]);
        setSubjects([]);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    loadTeacherAssignments();
  }, [schoolId]); // Depend on schoolId

  // Row management functions
  const updateRow = (id, key, value) =>
    setDocumentRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
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
            },
          ]
    );
  };

  const handleFileSelect = (id, files) => {
    const file = files && files[0];
    if (!file) return;
    if (!file.type.includes("pdf")) {
      updateRow(id, "error", "Invalid file type. Please select a PDF.");
      return;
    }
    updateRow(id, "error", null);
    updateRow(id, "file", file);
  };

  const uploadBooks = async () => {
    if (!schoolId) {
      alert(
        "Cannot upload: School information is missing or could not be loaded."
      );
      return;
    }
    const validRows = documentRows.filter(
      (r) =>
        r.class && r.subject && r.file && !r.error && r.status === "pending"
    );
    if (validRows.length === 0) return;

    setIsUploading(true);
    setUploadResults([]);
    setShowLoader(true);
    setLoaderProgress(0);
    setCurrentStep("upload");
    setCurrentFileName(validRows[0]?.file?.name || "");

    validRows.forEach((r) => updateRow(r.id, "status", "uploading"));

    const promises = validRows.map(async (row, index) => {
      const formData = new FormData();
      const selectedClass = classes.find((c) => c.value === row.class);
      const selectedSubject = subjects.find((s) => s.value === row.subject);

      formData.append("pdf", row.file);
      formData.append("classId", selectedClass?.grade || row.class);
      formData.append(
        "subject",
        selectedSubject?.name || selectedSubject?.label || row.subject
      );
      formData.append("schoolId", schoolId);
      formData.append(
        "title",
        selectedSubject?.label || row.subject.replace("_", " ")
      );
      formData.append("author", "System");
      formData.append("year", new Date().getFullYear());

      const currentUser = auth.currentUser;
      if (currentUser) {
        formData.append("teacherId", currentUser.uid);
      }

      // --- FIX: Declare apiResult here, outside the try block ---
      let apiResult;

      try {
        const baseProgress = (index / validRows.length) * 100;
        setCurrentFileName(row.file.name);
        setLoaderProgress(baseProgress);

        // --- FIX: Simplified to a single try block. The API call is now here. ---
        apiResult = await bookAPI.uploadBook(formData, {
          onUploadProgress: (e) => {
            const progress = Math.round((e.loaded * 100) / e.total);
            updateRow(row.id, "progress", progress);
            setLoaderProgress(baseProgress + progress * 0.8);
          },
        });

        // --- This part only runs on SUCCESS ---
        const stepProgression = async () => {
          setCurrentStep("process");
          await new Promise((resolve) => setTimeout(resolve, 500));
          setCurrentStep("analyze");
          await new Promise((resolve) => setTimeout(resolve, 500));
          setCurrentStep("complete");
        };
        await stepProgression();

        const returnedBook = apiResult?.book;
        const processedStatus = returnedBook?.processedStatus || "pending";
        const chunks = returnedBook?.noOfChunks ?? null;

        if (processedStatus === "processed") {
          updateRow(
            row.id,
            "status",
            processedStatus === "processed" ? "processed" : "pending"
          );
          updateRow(row.id, "progress", 100);
          setLoaderProgress(((index + 1) / validRows.length) * 100);

          return {
            success: true,
            filename: row.file.name,
            chunks,
            status: processedStatus,
          };
        } else {
          // Treat "failed" status (including 0 chunks) as a UI error
          const errorMessage = `Processing failed. The book content could not be extracted.`;
          updateRow(row.id, "status", "error");
          updateRow(row.id, "error", errorMessage);
          return {
            success: false,
            error: errorMessage,
            filename: row.file.name,
          };
        }
      } catch (err) {
        console.error("Upload error:", err);

        // Prioritize the specific message from the backend API response
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "An unknown error occurred.";

        updateRow(row.id, "status", "error");
        updateRow(row.id, "error", errorMessage); // <-- Use the new variable here
        return {
          success: false,
          filename: row.file.name,
          error: errorMessage, // <-- And also here
        };
      }
    });

    const results = await Promise.all(promises);

    // Filter out the duplicate notifications from the final summary if you want
    const finalResults = results.filter(
      (res) => res.error !== "Duplicate entry. User was notified."
    );
    setUploadResults(finalResults);

    setIsUploading(false);

    setTimeout(() => {
      setShowLoader(false);
      setCurrentStep("upload");
      setCurrentFileName("");
    }, 1000);
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
      setBooks([]);
    } finally {
      setFetchLoading(false);
    }
  };

  // Auto-fetch when switching to Find tab
  useEffect(() => {
    if (activeTab === "find") {
      fetchBooksMetadata();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Enhanced Upload Loader (shared) - render only when visible to avoid inline animation */}
      {showLoader && (
        <Loader
          isVisible={showLoader}
          title="Processing Your Book"
          message={
            currentStep === "upload"
              ? "Uploading your PDF file to our secure servers..."
              : currentStep === "process"
              ? "Sending PDF to our AI processing engine..."
              : currentStep === "analyze"
              ? "Extracting and analyzing text content..."
              : "Finalizing and saving processed data..."
          }
          progress={loaderProgress}
          currentFile={currentFileName}
          totalFiles={
            documentRows.filter((r) => r.file && r.status === "pending").length
          }
          steps={[
            {
              id: "upload",
              label: "Uploading PDF",
              status: currentStep === "upload" ? "active" : "completed",
            },
            {
              id: "process",
              label: "Processing Content",
              status:
                currentStep === "process"
                  ? "active"
                  : currentStep === "upload"
                  ? "pending"
                  : "completed",
            },
            {
              id: "analyze",
              label: "Analyzing Text",
              status:
                currentStep === "analyze"
                  ? "active"
                  : ["upload", "process"].includes(currentStep)
                  ? "pending"
                  : "completed",
            },
            {
              id: "complete",
              label: "Finalizing",
              status: currentStep === "complete" ? "active" : "pending",
            },
          ]}
        />
      )}

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
                        {isProfileLoading
                          ? "Loading Teacher Profile..."
                          : "Loading Teacher Assignments..."}
                      </p>
                      <p className="text-sm text-gray-500">
                        Please wait, preparing the uploader.
                      </p>
                    </div>
                  ) : profileError || assignmentsError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-red-700 bg-red-50 rounded-lg">
                      <AlertCircle className="h-8 w-8" />
                      <p className="mt-4 font-semibold">
                        {profileError
                          ? "Could not load profile"
                          : "Could not load assignments"}
                      </p>
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
                                <select
                                  value={row.class}
                                  onChange={(e) =>
                                    updateRow(row.id, "class", e.target.value)
                                  }
                                  className="md:col-span-1 h-11 border-gray-300 rounded-md shadow-sm w-full"
                                >
                                  <option value="">Class</option>
                                  {classes.map((c) => (
                                    <option key={c.value} value={c.value}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={row.subject}
                                  onChange={(e) =>
                                    updateRow(row.id, "subject", e.target.value)
                                  }
                                  className="md:col-span-1 h-11 border-gray-300 rounded-md shadow-sm w-full"
                                >
                                  <option value="">Subject</option>
                                  {subjects.map((s) => (
                                    <option key={s.value} value={s.value}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="md:col-span-4">
                                  {row.file ? (
                                    <div className="flex items-center justify-between p-2 pl-3 border rounded-lg bg-white h-11">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText
                                          className="text-blue-500"
                                          size={18}
                                        />
                                        <span className="text-sm font-medium text-gray-700 truncate">
                                          {row.file.name}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          updateRow(row.id, "file", null)
                                        }
                                        className="p-1 text-gray-400 hover:text-red-500"
                                      >
                                        <X size={16} />
                                      </button>
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
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <StatusBadge status={row.status} />
                                  {(row.status === "uploading" ||
                                    row.status === "processed") && (
                                    <div className="w-32">
                                      <ProgressBar progress={row.progress} />
                                    </div>
                                  )}
                                  {row.error && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                      <AlertCircle size={14} /> {row.error}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeRow(row.id)}
                                  disabled={documentRows.length === 1}
                                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          onClick={addNewRow}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg"
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
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
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
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Clear Processed
                          </button>
                        )}
                      </div>
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

                            {/* --- FIX: Display the populated class grade --- */}
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

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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bookAPI, fetchTeacherProfile } from "../utils/api.js";

// --- Constants ---
const classes = [
  { value: "01", label: "Class 01" },
  { value: "02", label: "Class 02" },
  { value: "03", label: "Class 03" },
  { value: "04", label: "Class 04" },
  { value: "05", label: "Class 05" },
  { value: "06", label: "Class 06" },
  { value: "07", label: "Class 07" },
  { value: "08", label: "Class 08" },
  { value: "09", label: "Class 09" },
  { value: "10", label: "Class 10" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
];
const subjects = [
  { value: "mathematics", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "english", label: "English" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "economics", label: "Economics" },
  { value: "political_science", label: "Political Science" },
  { value: "computer_science", label: "Computer Science" },
];

// --- Helper Components (Unchanged) ---
const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: "Pending", classes: "bg-gray-100 text-gray-700" },
    uploading: { label: "Uploading", classes: "bg-blue-100 text-blue-700" },
    processed: { label: "Processed", classes: "bg-green-100 text-green-700" },
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

  // States for fetching schoolId and handling profile loading
  const [schoolId, setSchoolId] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // States for finding books
  const [fetchClass, setFetchClass] = useState("");
  const [fetchSubject, setFetchSubject] = useState("");
  const [books, setBooks] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

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
    validRows.forEach((r) => updateRow(r.id, "status", "uploading"));

    const promises = validRows.map(async (row) => {
      // --- formData is created HERE for each row ---
      const formData = new FormData();

      // --- All .append() calls must happen AFTER the line above ---
      formData.append("pdf", row.file);
      formData.append("classId", row.class);
      formData.append("subject", row.subject);
      formData.append("schoolId", schoolId);
      formData.append(
        "title",
        `${row.subject.replace("_", " ")} - Class ${row.class}`
      );
      formData.append("author", "System");
      formData.append("year", new Date().getFullYear());

      // --- FIX: This logic is now correctly placed inside the loop ---
      const currentUser = auth.currentUser;
      if (currentUser) {
        formData.append("teacherId", currentUser.uid);
      }
      // --- End of FIX ---

      try {
        await bookAPI.uploadBook(formData, {
          onUploadProgress: (e) =>
            updateRow(
              row.id,
              "progress",
              Math.round((e.loaded * 100) / e.total)
            ),
        });
        updateRow(row.id, "status", "processed");
        return { success: true, filename: row.file.name };
      } catch (err) {
        updateRow(row.id, "status", "error");
        updateRow(row.id, "error", err.message || "Upload failed");
        return { success: false, filename: row.file.name, error: err.message };
      }
    });

    const results = await Promise.all(promises);
    setUploadResults(results);
    setIsUploading(false);
  };

  const fetchBooksMetadata = async () => {
    if (!fetchClass && !fetchSubject) {
      setFetchError("Please select a Class or Subject.");
      setBooks([]);
      return;
    }
    setFetchLoading(true);
    setFetchError(null);
    setBooks([]);
    try {
      const response = await bookAPI.getBooks({
        classId: fetchClass,
        subject: fetchSubject,
      });
      setBooks(response.data.data);
    } catch (error) {
      setFetchError(error.response?.data?.message || "Failed to fetch books.");
      setBooks([]);
    } finally {
      setFetchLoading(false);
    }
  };

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
                  {isProfileLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="mt-4 font-semibold text-gray-700">
                        Loading Teacher Profile...
                      </p>
                      <p className="text-sm text-gray-500">
                        Please wait, preparing the uploader.
                      </p>
                    </div>
                  ) : profileError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-red-700 bg-red-50 rounded-lg">
                      <AlertCircle className="h-8 w-8" />
                      <p className="mt-4 font-semibold">
                        Could not load profile
                      </p>
                      <p className="text-sm">{profileError}</p>
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
                                  <p className="text-gray-700">
                                    <span className="font-medium text-gray-900">
                                      {res.filename}
                                    </span>{" "}
                                    {res.success
                                      ? `was uploaded successfully.`
                                      : `- Failed: ${res.error}`}
                                  </p>
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
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <select
                      className="border-gray-300 rounded-md shadow-sm w-full sm:w-48"
                      value={fetchClass}
                      onChange={(e) => setFetchClass(e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.value} value={cls.value}>
                          {cls.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border-gray-300 rounded-md shadow-sm w-full sm:w-64"
                      value={fetchSubject}
                      onChange={(e) => setFetchSubject(e.target.value)}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subj) => (
                        <option key={subj.value} value={subj.value}>
                          {subj.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={fetchBooksMetadata}
                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm disabled:bg-blue-300"
                      disabled={fetchLoading}
                    >
                      {fetchLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Loading...
                        </>
                      ) : (
                        "Fetch Books"
                      )}
                    </button>
                  </div>
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
                          <th className="p-3">Title</th>
                          <th className="p-3">Class</th>
                          <th className="p-3">Subject</th>
                          <th className="p-3">Status</th>
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
                            <td className="p-3">{book.classId}</td>
                            <td className="p-3 capitalize">
                              {book.subject?.replace("_", " ")}
                            </td>
                            <td className="p-3">
                              <StatusBadge status={book.processedStatus} />
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
                          Use the filters above to search for existing books.
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

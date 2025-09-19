import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  FileCheck,
  GraduationCap,
  ChevronDown,
  Plus,
  Trash2,
  Database,
  Brain,
  AlertCircle,
} from "lucide-react";
import { bookAPI } from "../utils/api.js";

const ExamPlatformUpload = () => {
  // Each row now has a status property: "pending" or "processed"
  const [documentRows, setDocumentRows] = useState([
    { id: 1, class: "", subject: "", file: null, status: "pending" },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState(null);

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

  const processingSteps = [
    {
      id: "upload",
      title: "File Upload",
      description: "Uploading PDFs to secure server",
      icon: Upload,
    },
    // {
    //   id: "validation",
    //   title: "Content Validation",
    //   description: "Validating PDF structure and content",
    //   icon: FileCheck,
    // },
    {
      id: "extraction",
      title: "Text Extraction",
      description: "Extracting text from PDF pages",
      icon: FileText,
    },
    {
      id: "vectorization",
      title: "Vector Processing",
      description: "Converting content to vector embeddings",
      icon: Database,
    },
    {
      id: "analysis",
      title: "AI Analysis",
      description: "Analyzing content with AI models",
      icon: Brain,
    },
  ];

  const updateRow = (rowId, field, value) => {
    setDocumentRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleFileSelect = (rowId, files) => {
    const file = files && files[0];
    if (!file) return;
    // Accept PDFs by MIME type or fallback to filename check
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      window.alert("Please select a PDF file.");
      return;
    }
    updateRow(rowId, "file", file);
  };

  const addNewRow = () => {
    const newRow = {
      id: Date.now(),
      class: "",
      subject: "",
      file: null,
      status: "pending",
    };
    setDocumentRows((prev) => [...prev, newRow]);
  };

  // Clear only pending inputs (keep processed rows). If no pending rows remain,
  // ensure at least one empty pending row exists for user convenience.
  const clearInputs = () => {
    setDocumentRows((prev) => {
      const kept = prev.filter((r) => r.status === "pending");
      // If there are processed rows, keep them and ensure a blank pending row exists
      if (kept.length > 0) {
        return [...kept];
      }
    });
  };

  const removeRow = (rowId) => {
    if (documentRows.length > 1) {
      setDocumentRows((prev) => prev.filter((row) => row.id !== rowId));
    }
  };

  const generateFileName = (classValue, subjectValue) => {
    if (!classValue || !subjectValue) return "";
    const year = "2024_25";
    return `class${classValue}_${subjectValue}_${year}.pdf`;
  };

  // Only process rows that are pending and fully filled
  const validRows = documentRows.filter(
    (row) => row.class && row.subject && row.file && row.status === "pending"
  );
  const isComplete =
    completedSteps.length === processingSteps.length && !isProcessing;

  // When processing completes, mark rows as processed and clear processed rows
  // const handleProcessingComplete = () => {
  //   setDocumentRows((prev) =>
  //     // Mark matching validRows as processed but keep them in the list
  //     prev.map((row) =>
  //       validRows.some((vrow) => vrow.id === row.id)
  //         ? { ...row, status: "processed" }
  //         : row
  //     )
  //   );
  //   setCompletedSteps([]);
  //   setCurrentStep(0);
  //   setIsProcessing(false);
  // };

  // Processing: Only unprocessed/pending documents
  const startProcessing = async () => {
    if (validRows.length === 0) return;

    setIsProcessing(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setUploadResults([]);
    setError(null);

    try {
      // Step 1: File Upload
      setCurrentStep(0);
      const uploadPromises = validRows.map(async (row) => {
        const formData = new FormData();
        formData.append("pdf", row.file);
        formData.append("classValue", row.class);
        formData.append("subjectValue", row.subject);
        formData.append(
          "title",
          `${
            row.subject.charAt(0).toUpperCase() +
            row.subject.slice(1).replace("_", " ")
          } - Class ${row.class}`
        );
        formData.append("author", "Unknown");
        formData.append("year", new Date().getFullYear());

        try {
          const result = await bookAPI.uploadBook(formData);
          return { success: true, row, result };
        } catch (error) {
          return { success: false, row, error: error.message };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      setUploadResults(uploadResults);
      setCompletedSteps([0]);

      // Step 2: Content Validation
      setCurrentStep(1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCompletedSteps([0, 1]);

      // Step 3: Text Extraction
      setCurrentStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCompletedSteps([0, 1, 2]);

      // Step 4: Vector Processing
      setCurrentStep(3);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCompletedSteps([0, 1, 2, 3]);

      // Step 5: AI Analysis
      setCurrentStep(4);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCompletedSteps([0, 1, 2, 3, 4]);

      // Mark successful uploads as processed
      const successfulUploads = uploadResults.filter(
        (result) => result.success
      );
      if (successfulUploads.length > 0) {
        setDocumentRows((prev) =>
          prev.map((row) =>
            successfulUploads.some((upload) => upload.row.id === row.id)
              ? { ...row, status: "processed" }
              : row
          )
        );
      }

      // Check for any errors
      const failedUploads = uploadResults.filter((result) => !result.success);
      if (failedUploads.length > 0) {
        setError(
          `Failed to upload ${failedUploads.length} file(s). Please try again.`
        );
      }
    } catch (error) {
      console.error("Processing error:", error);
      setError(
        "An unexpected error occurred during processing. Please try again."
      );
    } finally {
      setIsProcessing(false);
      setCurrentStep(processingSteps.length);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 bg-blue-600 rounded-xl">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Exam Platform Upload
          </h1>
          <p className="text-gray-600 text-sm">
            Configure class, subject, and upload study materials
          </p>
        </div>
        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Document Configuration */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Document Configuration
                </h2>
              </div>
              <span className="text-sm text-gray-500">
                {validRows.length} of {documentRows.length} ready
              </span>
            </div>
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-medium text-gray-700">
              <div className="col-span-3">Class</div>
              <div className="col-span-3">Subject</div>
              <div className="col-span-3">PDF File</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Action</div>
            </div>
            {/* Document Rows */}
            <div className="space-y-3">
              {documentRows.map((row, index) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-12 gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                    row.class && row.subject && row.file
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {/* Class Dropdown */}
                  <div className="col-span-3">
                    <div className="relative">
                      <select
                        value={row.class}
                        onChange={(e) =>
                          updateRow(row.id, "class", e.target.value)
                        }
                        className="w-full p-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.value} value={cls.value}>
                            {cls.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {/* Subject Dropdown */}
                  <div className="col-span-3">
                    <div className="relative">
                      <select
                        value={row.subject}
                        onChange={(e) =>
                          updateRow(row.id, "subject", e.target.value)
                        }
                        className="w-full p-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((subject) => (
                          <option key={subject.value} value={subject.value}>
                            {subject.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {/* File Upload */}
                  <div className="col-span-3">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          handleFileSelect(row.id, e.target.files)
                        }
                        className="sr-only" // Use "sr-only" instead of "hidden"
                        id={`file-${row.id}`}
                        disabled={row.status === "processed"}
                      />
                      <label
                        htmlFor={`file-${row.id}`}
                        className={`w-full p-3 rounded-lg border border-dashed cursor-pointer flex items-center justify-center text-sm transition-colors duration-200 ${
                          row.file
                            ? "border-green-300 bg-green-50 text-green-700"
                            : "border-gray-300 text-gray-500 hover:border-gray-400"
                        } ${
                          row.status === "processed"
                            ? "opacity-70 cursor-not-allowed pointer-events-none"
                            : ""
                        }`}
                      >
                        {row.file ? (
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            <span className="truncate">{row.file.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Choose PDF</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  {/* Status Column */}
                  <div className="col-span-2 flex items-center">
                    {row.status === "pending" ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Processed
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="col-span-1 flex items-center space-x-2">
                    {index === documentRows.length - 1 && (
                      <button
                        onClick={addNewRow}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Add new row"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    {documentRows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Generated File Names Preview */}
            {validRows.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-medium text-blue-900 mb-3">
                  Generated File Names:
                </h3>
                <div className="space-y-2">
                  {validRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="text-sm text-blue-700 font-mono"
                    >
                      {index + 1}. {generateFileName(row.class, row.subject)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Process Button */}
            <div className="mt-8 text-center">
              <button
                onClick={startProcessing}
                disabled={validRows.length === 0 || isProcessing}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  validRows.length > 0 && !isProcessing
                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isProcessing
                  ? "Processing Documents..."
                  : `Process ${validRows.length} Document${
                      validRows.length !== 1 ? "s" : ""
                    }`}
              </button>
              {documentRows.length > validRows.length && (
                <p className="mt-2 text-sm text-amber-600">
                  {documentRows.length - validRows.length} row
                  {documentRows.length - validRows.length !== 1 ? "s" : ""}{" "}
                  incomplete
                </p>
              )}
            </div>
            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700 font-medium">Upload Error</p>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Upload Results */}
            {uploadResults.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-medium text-blue-900 mb-3">
                  Upload Results:
                </h3>
                <div className="space-y-2">
                  {uploadResults.map((result, index) => (
                    <div key={index} className="flex items-center text-sm">
                      {result.success ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-green-700">
                            {result.row.subject} - Class {result.row.class}:
                            Uploaded successfully
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-red-700">
                            {result.row.subject} - Class {result.row.class}:{" "}
                            {result.error}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center items-center mt-4">
              <button
                onClick={clearInputs}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
                title="Clear pending inputs"
              >
                Clear inputs
              </button>
            </div>
          </div>
          {/* Horizontal Progress Bar */}
          {(isProcessing || isComplete) && (
            <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-gray-50 to-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-8 text-center">
                Processing Status
              </h3>
              {/* Progress Bar Container */}
              <div className="relative max-w-4xl mx-auto">
                {/* Connection Lines */}
                <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-8">
                  {processingSteps.map(
                    (_, index) =>
                      index < processingSteps.length - 1 && (
                        <div
                          key={index}
                          className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${
                            completedSteps.includes(index + 1) ||
                            completedSteps.includes(index)
                              ? "bg-gradient-to-r from-green-400 to-green-500"
                              : currentStep > index && isProcessing
                              ? "bg-gradient-to-r from-blue-400 to-blue-500"
                              : "bg-gray-300"
                          }`}
                        >
                          {currentStep === index + 1 && isProcessing && (
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      )
                  )}
                </div>
                {/* Progress Steps */}
                <div className="flex items-start justify-between relative z-10">
                  {processingSteps.map((step, index) => {
                    const isCurrentStep = currentStep === index && isProcessing;
                    const isCompleted = completedSteps.includes(index);
                    const isPending = index > currentStep;
                    return (
                      <div
                        key={step.id}
                        className="flex flex-col items-center max-w-32"
                      >
                        {/* Step Circle */}
                        <div className="relative">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                              isCompleted
                                ? "bg-gradient-to-br from-green-400 to-green-600 shadow-lg scale-110"
                                : isCurrentStep
                                ? "bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg scale-105 animate-pulse"
                                : isPending
                                ? "bg-gray-300"
                                : "bg-gray-400"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-7 h-7 text-white" />
                            ) : isCurrentStep ? (
                              <div className="relative">
                                <step.icon className="w-7 h-7 text-white" />
                                <div className="absolute -top-1 -right-1">
                                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                                </div>
                              </div>
                            ) : (
                              <step.icon className="w-6 h-6 text-white opacity-70" />
                            )}
                          </div>
                          {isCurrentStep && (
                            <div className="absolute inset-0 w-16 h-16 rounded-full bg-blue-400 opacity-30 animate-ping"></div>
                          )}
                          {isCompleted && (
                            <div className="absolute inset-0 w-16 h-16 rounded-full bg-green-400 opacity-20 animate-pulse"></div>
                          )}
                        </div>
                        {/* Step Content */}
                        <div className="mt-4 text-center">
                          <h4
                            className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
                              isCompleted
                                ? "text-green-700"
                                : isCurrentStep
                                ? "text-blue-700"
                                : "text-gray-500"
                            }`}
                          >
                            {step.title}
                          </h4>
                          <p
                            className={`text-xs leading-tight transition-colors duration-300 ${
                              isCompleted
                                ? "text-green-600"
                                : isCurrentStep
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                          >
                            {step.description}
                          </p>
                          <div className="mt-2">
                            {isCompleted ? (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Complete
                              </span>
                            ) : isCurrentStep ? (
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-pulse">
                                Processing...
                              </span>
                            ) : isPending ? (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                Pending
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                Ready
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Overall Progress Percentage */}
                <div className="mt-8 text-center">
                  <div className="inline-block">
                    <div className="text-2xl font-bold text-gray-700 mb-2">
                      {isComplete
                        ? "100%"
                        : `${Math.round(
                            ((completedSteps.length +
                              (isProcessing ? 0.5 : 0)) /
                              processingSteps.length) *
                              100
                          )}%`}
                    </div>
                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          isComplete
                            ? "bg-gradient-to-r from-green-400 to-green-500"
                            : "bg-gradient-to-r from-blue-400 to-purple-500"
                        }`}
                        style={{
                          width: `${
                            isComplete
                              ? 100
                              : ((completedSteps.length +
                                  (isProcessing ? 0.5 : 0)) /
                                  processingSteps.length) *
                                100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {isComplete
                        ? "All steps completed successfully!"
                        : `Step ${currentStep + 1} of ${
                            processingSteps.length
                          }`}
                    </p>
                  </div>
                </div>
              </div>
              {isComplete && (
                <div className="mt-6 p-6 bg-green-50 rounded-xl border border-green-200 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    Processing Complete!
                  </h3>
                  <p className="text-green-600 mb-4">
                    {uploadResults.filter((r) => r.success).length} of{" "}
                    {uploadResults.length} documents processed successfully.
                  </p>
                  {uploadResults.filter((r) => !r.success).length > 0 && (
                    <p className="text-amber-600 mb-4">
                      {uploadResults.filter((r) => !r.success).length}{" "}
                      document(s) failed to upload.
                    </p>
                  )}
                  <div className="flex justify-center space-x-4">
                    <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                      Generate Exams
                    </button>
                    <button className="px-6 py-2 bg-white text-green-600 border border-green-300 rounded-lg font-medium hover:bg-green-50 transition-colors">
                      View Library
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ExamPlatformUpload;

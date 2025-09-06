import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Book,
  GraduationCap,
  BookOpen,
  Zap,
  Database,
  Brain,
  FileCheck,
  X,
  Plus,
  Eye,
  ChevronDown,
  Settings,
} from "lucide-react";

const ExamPlatformUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [processingFiles, setProcessingFiles] = useState([]);

  const classes = [
    { value: "9", label: "Class 9" },
    { value: "10", label: "Class 10" },
    { value: "11", label: "Class 11" },
    { value: "12", label: "Class 12" },
  ];

  const subjects = [
    { value: "mathematics", label: "Mathematics", icon: "📐" },
    { value: "physics", label: "Physics", icon: "⚛️" },
    { value: "chemistry", label: "Chemistry", icon: "🧪" },
    { value: "biology", label: "Biology", icon: "🧬" },
    { value: "english", label: "English", icon: "📚" },
    { value: "history", label: "History", icon: "🏛️" },
  ];

  const processingSteps = [
    {
      id: "upload",
      title: "File Upload",
      description: "Uploading PDFs to secure server",
      icon: Upload,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      id: "validation",
      title: "Content Validation",
      description: "Validating PDF structure and content",
      icon: FileCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      id: "extraction",
      title: "Text Extraction",
      description: "Extracting text from PDF pages",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      id: "chunking",
      title: "Content Chunking",
      description: "Breaking content into manageable segments",
      icon: Zap,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      id: "vectorization",
      title: "Vector Processing",
      description: "Converting chunks to vector embeddings",
      icon: Database,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
    },
    {
      id: "analysis",
      title: "AI Analysis",
      description: "Analyzing content with LLM models",
      icon: Brain,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");

    const newFiles = pdfFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      name: file.name,
      size: file.size,
      status: "ready",
      selectedClass: "",
      selectedSubject: "",
      showDetails: false,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");

    const newFiles = pdfFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      name: file.name,
      size: file.size,
      status: "ready",
      selectedClass: "",
      selectedSubject: "",
      showDetails: false,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const updateFileDetails = (fileId, field, value) => {
    setSelectedFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, [field]: value } : file
      )
    );
  };

  const toggleFileDetails = (fileId) => {
    setSelectedFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, showDetails: !file.showDetails } : file
      )
    );
  };

  const removeFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  const startProcessing = async () => {
    const validFiles = selectedFiles.filter(
      (file) => file.selectedClass && file.selectedSubject
    );
    if (validFiles.length === 0) return;

    setIsProcessing(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setProcessingFiles(validFiles);

    // Simulate processing steps
    for (let i = 0; i < processingSteps.length; i++) {
      setCurrentStep(i);
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 1500)
      );
      setCompletedSteps((prev) => [...prev, i]);
    }

    setIsProcessing(false);
    setCurrentStep(processingSteps.length);
  };

  const validFiles = selectedFiles.filter(
    (file) => file.selectedClass && file.selectedSubject
  );
  const isFormValid = validFiles.length > 0;
  const isComplete =
    completedSteps.length === processingSteps.length && !isProcessing;
  const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Exam Platform
          </h1>
          <p className="text-gray-600 text-lg">
            Upload multiple study materials with individual class and subject
            settings
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Upload Section */}
          <div className="p-8 border-b border-gray-100">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* File Upload */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <Book className="w-6 h-6 mr-3 text-blue-500" />
                    Upload Study Materials
                  </h2>
                  {selectedFiles.length > 0 && (
                    <button
                      onClick={clearAllFiles}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 mb-8 ${
                    selectedFiles.length > 0
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-blue-100 rounded-full mb-4">
                        <Upload className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Drop multiple PDFs here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Each document can have different class and subject
                        settings
                      </p>
                    </div>
                  </label>
                </div>

                {/* File List with Individual Settings */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-gray-700 text-lg">
                        Configure Documents ({selectedFiles.length})
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          Valid: {validFiles.length}/{selectedFiles.length}
                        </span>
                        <span>
                          Total: {(totalSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {selectedFiles.map((fileObj) => (
                        <div
                          key={fileObj.id}
                          className={`border-2 rounded-2xl transition-all duration-300 ${
                            fileObj.selectedClass && fileObj.selectedSubject
                              ? "border-green-200 bg-green-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          {/* File Header */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1 min-w-0">
                                <FileText className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-800 truncate">
                                    {fileObj.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {(fileObj.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                {fileObj.selectedClass &&
                                  fileObj.selectedSubject && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  )}
                                <button
                                  onClick={() => toggleFileDetails(fileObj.id)}
                                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeFile(fileObj.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Quick Status */}
                            <div className="mt-3 flex items-center space-x-4 text-sm">
                              {fileObj.selectedClass ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">
                                  Class {fileObj.selectedClass}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">
                                  No class selected
                                </span>
                              )}
                              {fileObj.selectedSubject ? (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                                  {
                                    subjects.find(
                                      (s) => s.value === fileObj.selectedSubject
                                    )?.icon
                                  }{" "}
                                  {
                                    subjects.find(
                                      (s) => s.value === fileObj.selectedSubject
                                    )?.label
                                  }
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">
                                  No subject selected
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expanded Settings */}
                          {fileObj.showDetails && (
                            <div className="px-4 pb-4 border-t border-gray-200">
                              <div className="pt-4 grid md:grid-cols-2 gap-4">
                                {/* Class Selection */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Class
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {classes.map((cls) => (
                                      <button
                                        key={cls.value}
                                        onClick={() =>
                                          updateFileDetails(
                                            fileObj.id,
                                            "selectedClass",
                                            cls.value
                                          )
                                        }
                                        className={`p-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                                          fileObj.selectedClass === cls.value
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                                        }`}
                                      >
                                        {cls.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Subject Selection */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Subject
                                  </label>
                                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                    {subjects.map((subject) => (
                                      <button
                                        key={subject.value}
                                        onClick={() =>
                                          updateFileDetails(
                                            fileObj.id,
                                            "selectedSubject",
                                            subject.value
                                          )
                                        }
                                        className={`p-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                                          fileObj.selectedSubject ===
                                          subject.value
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                                        }`}
                                      >
                                        <div className="flex items-center">
                                          <span className="mr-2">
                                            {subject.icon}
                                          </span>
                                          <span>{subject.label}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processing Summary */}
                {validFiles.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">
                      Ready to Process
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {validFiles.map((file) => (
                        <div
                          key={file.id}
                          className="bg-white p-3 rounded-lg border border-blue-100"
                        >
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-blue-700">
                            <span>Class {file.selectedClass}</span>
                            <span className="mx-1">•</span>
                            <span>
                              {
                                subjects.find(
                                  (s) => s.value === file.selectedSubject
                                )?.label
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <div className="mt-8 text-center">
              <button
                onClick={startProcessing}
                disabled={!isFormValid || isProcessing}
                className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                  isFormValid && !isProcessing
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isProcessing
                  ? "Processing Documents..."
                  : `Process ${validFiles.length} Document${
                      validFiles.length !== 1 ? "s" : ""
                    }`}
              </button>
              {selectedFiles.length > validFiles.length && (
                <p className="mt-2 text-sm text-amber-600">
                  {selectedFiles.length - validFiles.length} document
                  {selectedFiles.length - validFiles.length !== 1
                    ? "s need"
                    : " needs"}{" "}
                  class and subject selection
                </p>
              )}
            </div>
          </div>

          {/* Processing Steps */}
          {(isProcessing || isComplete) && (
            <div className="p-8 bg-gray-50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-semibold text-gray-800">
                  Processing Status
                </h3>
                <div className="text-sm text-gray-600">
                  Processing {processingFiles.length} document
                  {processingFiles.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="space-y-4">
                {processingSteps.map((step, index) => {
                  const isCurrentStep = currentStep === index && isProcessing;
                  const isCompleted = completedSteps.includes(index);

                  return (
                    <div
                      key={step.id}
                      className={`p-6 rounded-2xl border-2 transition-all duration-500 ${
                        isCompleted
                          ? "border-green-200 bg-green-50"
                          : isCurrentStep
                          ? `border-${step.color.split("-")[1]}-200 ${
                              step.bgColor
                            }`
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`p-3 rounded-xl ${
                            isCompleted
                              ? "bg-green-500"
                              : isCurrentStep
                              ? `bg-${step.color.split("-")[1]}-500`
                              : "bg-gray-300"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : isCurrentStep ? (
                            <Clock className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <step.icon className="w-6 h-6 text-white" />
                          )}
                        </div>

                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`font-semibold ${
                                isCompleted
                                  ? "text-green-700"
                                  : isCurrentStep
                                  ? step.color
                                  : "text-gray-500"
                              }`}
                            >
                              {step.title}
                            </h4>
                            {isCurrentStep && (
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-sm mt-1 ${
                              isCompleted
                                ? "text-green-600"
                                : isCurrentStep
                                ? "text-gray-700"
                                : "text-gray-500"
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {isCurrentStep && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full animate-pulse"
                              style={{ width: "60%" }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isComplete && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-green-700 mb-2">
                      All Documents Processed Successfully!
                    </h3>
                    <p className="text-green-600 mb-6">
                      {processingFiles.length} document
                      {processingFiles.length !== 1 ? "s have" : " has"} been
                      processed and categorized by class and subject.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors duration-200">
                        Generate Exam Papers
                      </button>
                      <button className="px-6 py-3 bg-white text-green-600 border-2 border-green-200 rounded-xl font-semibold hover:bg-green-50 transition-colors duration-200">
                        View Library
                      </button>
                    </div>
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

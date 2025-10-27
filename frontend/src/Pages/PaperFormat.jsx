/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

// A stand-alone component for viewing the paper
const PaperView = ({ paperData, calculateTotalMarks }) => (
  <div className="min-h-screen bg-gray-100 py-8 px-4">
    <div className="max-w-5xl mx-auto">
      <div className="paper-content bg-white border-2 border-blue-400 rounded-xl shadow-lg px-8 py-6 mb-8 min-h-[11in]">
        <div className="header text-center border-b-2 border-blue-300 pb-4 mb-6">
          <h1 className="college-name text-2xl font-bold text-blue-800 mb-2">
            {paperData.collegeName || "New High School"}
          </h1>
          {/* --- CHANGE 1: Use examType for the main title --- */}
          <h2 className="test-name text-lg font-semibold text-gray-700 mb-2">
            {paperData.examType || paperData.testName || "Examination"}
          </h2>

          {/* --- CHANGE 2: REMOVE this h3 --- */}
          {/* <h3 className="subject-class text-md font-medium text-gray-600 mb-3">
            {paperData.subject} - {paperData.className}
          </h3> */}

          {/* --- CHANGE 3: Add Subject and Class to the details row --- */}
          {/* Use grid for better alignment on smaller screens */}
          <div className="exam-details grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1 items-center text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg text-left sm:text-center">
            <span className="col-span-1">
              {" "}
              {/* Make Date span 1 column */}
              <strong>Date:</strong>{" "}
              {paperData.date || new Date().toISOString().split("T")[0]}
            </span>
            {/* Added Subject */}
            <span className="col-span-1">
              <strong>Subject:</strong> {paperData.subject || "-"}
            </span>
            {/* Added Class */}
            <span className="col-span-1">
              <strong>Class:</strong> {paperData.className || "-"}
            </span>
            <span className="col-span-1">
              {" "}
              {/* Make Marks span 1 */}
              <strong>Marks:</strong> {calculateTotalMarks()}
            </span>
            <span className="col-span-1">
              {" "}
              {/* Make Time span 1 */}
              <strong>Time:</strong> {paperData.timeAllowed}
            </span>
          </div>
        </div>
        <div className="instructions border border-blue-300 rounded-lg mb-6 px-4 py-3 bg-blue-50">
          <h3 className="font-semibold mb-2 text-blue-800">
            General Instructions:
          </h3>
          <ul className="list-disc pl-6 text-sm text-gray-700">
            {(paperData.instructions || []).map((instruction, index) => (
              <li key={index} className="mb-1">
                {instruction}
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-gray-400 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-200">
                <th className="border border-gray-400 px-3 py-2 w-16 font-semibold">
                  Q. No.
                </th>
                <th className="border border-gray-400 px-3 py-2 font-semibold">
                  Questions
                </th>
                <th className="border border-gray-400 px-3 py-2 w-16 font-semibold">
                  Marks
                </th>
              </tr>
            </thead>
            <tbody>
              {(paperData.sections || []).map((section, sIdx) => (
                <React.Fragment key={`section-${sIdx}`}>
                  <tr>
                    <td
                      colSpan="3"
                      className="section-header border border-gray-400 bg-blue-100 px-3 py-2"
                    >
                      <div className="font-bold text-blue-800">
                        {section.sectionName}
                      </div>
                      <div className="text-sm text-gray-600 italic">
                        {section.description}
                      </div>
                    </td>
                  </tr>
                  {(section.questions || []).map((question, qIndex) => (
                    <tr
                      key={`q-${sIdx}-${qIndex}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="question-no border border-gray-400 text-center px-2 py-3 font-medium">
                        {question.questionNo}
                      </td>
                      <td className="question-cell border border-gray-400 px-3 py-3">
                        <div className="text-gray-800">{question.question}</div>
                        {Array.isArray(question.options) &&
                          question.options.length > 0 && (
                            <div className="options mt-2 text-sm text-gray-700">
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="ml-4">
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                      </td>
                      <td className="marks-cell border border-gray-400 text-center px-2 py-3 font-medium">
                        {question.marks}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

const EditView = ({
  paperData,
  savedMessage,
  handleInputChange,
  updateSection,
  updateQuestion,
}) => (
  <div className="min-h-screen bg-gray-100 py-8 px-4">
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Edit Paper Details</h2>
        <div className="flex items-center gap-4">
          {savedMessage && (
            <div className="text-green-600 font-medium">{savedMessage}</div>
          )}
        </div>
      </div>

      {/* Paper Header Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 border rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            School/College Name
          </label>
          <input
            type="text"
            value={paperData.collegeName || ""}
            onChange={(e) => handleInputChange("collegeName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Name
          </label>
          <input
            type="text"
            value={paperData.testName || ""}
            onChange={(e) => handleInputChange("testName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Allowed (e.g., 2 hours)
          </label>
          <input
            type="text"
            value={paperData.timeAllowed || ""}
            onChange={(e) => handleInputChange("timeAllowed", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Instructions Input */}
      <div className="mb-6 p-4 border rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          General Instructions
        </label>
        <textarea
          value={(paperData.instructions || []).join("\n")}
          onChange={(e) =>
            handleInputChange("instructions", e.target.value.split("\n"))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-24"
          placeholder="Enter each instruction on a new line"
        />
      </div>

      {/* Sections and Questions Inputs */}
      {(paperData.sections || []).map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="border border-gray-300 rounded-lg p-4 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Section {sectionIndex + 1}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              value={section.sectionName || ""}
              onChange={(e) =>
                updateSection(sectionIndex, "sectionName", e.target.value)
              }
              placeholder="Section Name (e.g., Section A: Multiple Choice)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              value={section.description || ""}
              onChange={(e) =>
                updateSection(sectionIndex, "description", e.target.value)
              }
              placeholder="Section Description (e.g., Answer all questions)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-16"
            />
          </div>

          {(section.questions || []).map((question, questionIndex) => (
            <div
              key={questionIndex}
              className="bg-gray-50 p-4 rounded-md mt-4 border"
            >
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Question {question.questionNo}
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Marks:</label>
                  <input
                    type="number"
                    value={question.marks}
                    onChange={(e) =>
                      updateQuestion(
                        sectionIndex,
                        questionIndex,
                        "marks",
                        Number(e.target.value)
                      )
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <textarea
                value={question.question}
                onChange={(e) =>
                  updateQuestion(
                    sectionIndex,
                    questionIndex,
                    "question",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm h-20"
                placeholder="Enter question text"
              />

              {Array.isArray(question.options) &&
                question.options.length > 0 && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options (one per line)
                    </label>
                    <textarea
                      value={question.options.join("\n")}
                      onChange={(e) =>
                        updateQuestion(
                          sectionIndex,
                          questionIndex,
                          "options",
                          e.target.value.split("\n")
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm h-24"
                      placeholder="Enter each option on a new line"
                    />
                  </div>
                )}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const SaveConfirmationModal = ({
  handleCancelSave,
  handleSavePaper,
  isSaving,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Save</h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to save this question paper?
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleCancelSave}
          disabled={isSaving}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSavePaper}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Paper"}
        </button>
      </div>
    </div>
  </div>
);

// --- Main Component ---
function ExamPaperGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paperIdFromUrl } = useParams();

  const normalizePaper = useCallback((incoming, fallback = {}) => {
    // --- START: MODIFIED LOGIC ---
    const topLevelData = incoming || {}; // Original document
    let paperObjectData = incoming?.paper || {}; // Data inside 'paper' field
    // --- END: MODIFIED LOGIC ---

    // Keep these helpers
    const safeString = (v, fb = "") =>
      typeof v === "string" ? v.trim() || fb : fb;
    const safeNumber = (v, fb = 0) =>
      Number.isFinite(Number(v)) ? Number(v) : fb;
    const safeArray = (v) => (Array.isArray(v) ? v : []);

    // --- START: MODIFIED FIELD RESOLUTION ---
    // Prioritize top-level fields saved by your controller,
    // then fall back to fields inside the 'paper' object, then to fallback object.
    const subject = safeString(
      topLevelData.subject || paperObjectData.subject,
      fallback.subject
    );
    const className = safeString(
      topLevelData.classGrade || paperObjectData.className, // Use classGrade from top-level
      fallback.className
    );
    const examType = safeString(topLevelData.examType, fallback.examType); // Get from top level

    // Use testName from inside 'paper' object or top-level title
    let testName = safeString(
      paperObjectData.testName || topLevelData.title,
      fallback.testName
    );
    if (testName.startsWith("questionPaper")) {
      // If it's the default generated name, use examType or fallback
      testName =
        examType || (subject ? `${subject} Examination` : "Examination");
    }
    // --- END: MODIFIED FIELD RESOLUTION ---

    const normalized = {
      // These come from inside 'paper' object primarily
      collegeName: safeString(
        paperObjectData.collegeName,
        fallback.collegeName
      ),
      testName: testName, // Use the cleaned-up testName
      timeAllowed: safeString(
        paperObjectData.timeAllowed,
        fallback.timeAllowed
      ),
      date: safeString(paperObjectData.date, fallback.date),
      instructions: safeArray(paperObjectData.instructions)
        .map(safeString)
        .filter(Boolean),
      sections: safeArray(paperObjectData.sections).map((section, sIdx) => ({
        sectionName: safeString(section?.sectionName, `Section ${sIdx + 1}`),
        description: safeString(section?.description),
        questions: safeArray(section?.questions).map((q, qIdx) => ({
          questionNo: safeString(q?.questionNo, `${qIdx + 1}`),
          question: safeString(q?.question),
          marks: safeNumber(q?.marks, 1),
          options: safeArray(q?.options).map(safeString).filter(Boolean),
        })),
      })),

      // --- START: ADDED/MODIFIED FIELDS ---
      // These now reliably come from top-level or fallbacks
      subject: subject,
      className: className,
      examType: examType,
      // maxMarks can come from top-level if saved there, or inside paper object
      maxMarks: safeNumber(
        topLevelData.totalMarks || paperObjectData.maxMarks,
        fallback.maxMarks
      ),
    };

    if (normalized.instructions.length === 0 && fallback.instructions) {
      normalized.instructions = fallback.instructions;
    }
    return normalized;
  }, []);

  const [paperData, setPaperData] = useState(null); // Initialize as null
  const [editMode, setEditMode] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [paperId, setPaperId] = useState(paperIdFromUrl || null);
  const [generatedPapers, setGeneratedPapers] = useState([]);
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPaperData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const batchDataString = sessionStorage.getItem("paperBatchData");
        let batchPapers = [];
        let initialPaperToView = null;

        if (batchDataString) {
          batchPapers = JSON.parse(batchDataString);
          setGeneratedPapers(batchPapers);
          initialPaperToView =
            batchPapers.find((p) => p._id === paperIdFromUrl) || batchPapers[0];
          if (initialPaperToView) {
            const initialIndex = batchPapers.findIndex(
              (p) => p._id === initialPaperToView._id
            );
            setSelectedPaperIndex(initialIndex >= 0 ? initialIndex : 0);
          }
        }

        if (paperIdFromUrl) {
          const response = await api.get(
            `/teachers/question-papers/${paperIdFromUrl}`
          );
          if (response.data && response.data.success) {
            const fetchedDoc = response.data.data;
            initialPaperToView = fetchedDoc;

            if (batchPapers.length > 0) {
              const paperIndex = batchPapers.findIndex(
                (p) => p._id === fetchedDoc._id
              );
              if (paperIndex !== -1) {
                batchPapers[paperIndex] = fetchedDoc;
                setGeneratedPapers([...batchPapers]);
              }
            } else {
              setGeneratedPapers([fetchedDoc]);
            }
          } else {
            throw new Error(response.data.message || "Failed to fetch paper.");
          }
        }

        if (initialPaperToView) {
          setPaperData(normalizePaper(initialPaperToView, {}));
          setPaperId(initialPaperToView._id);
        } else {
          setError("No paper data could be found or loaded.");
        }
      } catch (err) {
        console.error("Error loading paper:", err);
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
        sessionStorage.removeItem("paperBatchData");
      }
    };

    loadPaperData();
  }, [paperIdFromUrl, normalizePaper]);

  const handlePaperSelection = (index) => {
    const selectedPaper = generatedPapers[index];
    if (selectedPaper) {
      setPaperData(normalizePaper(selectedPaper, {}));
      setPaperId(selectedPaper._id);
      setSelectedPaperIndex(index);
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setPaperData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const updateSection = useCallback((sectionIndex, field, value) => {
    setPaperData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, [field]: value } : section
      ),
    }));
  }, []);

  const updateQuestion = useCallback(
    (sectionIndex, questionIndex, field, value) => {
      setPaperData((prev) => ({
        ...prev,
        sections: prev.sections.map((section, sIndex) =>
          sIndex === sectionIndex
            ? {
                ...section,
                questions: section.questions.map((question, qIndex) =>
                  qIndex === questionIndex
                    ? { ...question, [field]: value }
                    : question
                ),
              }
            : section
        ),
      }));
    },
    []
  );

  const calculateTotalMarks = useCallback(() => {
    if (!paperData) return 0;
    return (paperData.sections || []).reduce((total, section) => {
      const sectionSum = (section.questions || []).reduce(
        (sectionTotal, question) =>
          sectionTotal + (Number(question.marks) || 0),
        0
      );
      return total + sectionSum;
    }, 0);
  }, [paperData]);

  // ✅ REMOVED useCallback - This ensures the function is always new and has the latest state
  const handleSavePaper = async () => {
    setIsSaving(true);
    try {
      if (!user) {
        throw new Error("Authentication error. Please log in again.");
      }
      const token = await user.getIdToken();

      const paperToSave = {
        ...paperData,
        totalMarks: calculateTotalMarks(),
      };

      let response;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log("--- SAVE BUTTON CLICKED ---");
      console.log("Value of paperId at save time:", paperId); // Keep this for one last check

      if (paperId) {
        console.log("ATTEMPTING TO UPDATE (PUT)");
        const payload = {
          paper: paperToSave,
          title: paperToSave.testName,
        };

        console.log(
          "Sending PUT request with payload:",
          JSON.stringify(payload, null, 2)
        );
        response = await api.put(
          `teachers/question-papers/${paperId}`,
          payload
        );
      } else {
        console.log("ATTEMPTING TO CREATE (POST)");
        const payloadForCreation = {
          class: paperToSave.className,
          subject: paperToSave.subject,
          pdf_name: paperToSave.testName,
          numberofPapers: 1,
          ...paperToSave,
        };
        response = await api.post(
          "teachers/generate-question-paper",
          payloadForCreation
        );
      }

      const data = await response.data;

      if (!data || !data.success) {
        throw new Error(data?.message || "Failed to save question paper");
      }

      // ✅ --- START OF NEW LOGIC ---

      const updatedDocument = data.question_paper;

      // 2. Update the main paperData state by normalizing the new document
      //    This ensures the view updates correctly
      setPaperData(normalizePaper(updatedDocument, {}));

      // 3. Find the index of the paper you just updated
      const updatedIndex = generatedPapers.findIndex((p) => p._id === paperId);

      // 4. Create a new array with the updated document in the correct spot
      if (updatedIndex !== -1) {
        const newGeneratedPapers = [...generatedPapers];
        newGeneratedPapers[updatedIndex] = updatedDocument;
        setGeneratedPapers(newGeneratedPapers);

        // ✅ ADD THIS LINE to persist the changes for the next refresh
        sessionStorage.setItem(
          "generatedPapersArray",
          JSON.stringify(newGeneratedPapers)
        );
      }

      // 4. Show a success message
      setSavedMessage("Question paper saved successfully!");
      setShowSaveModal(false);

      // 5. Switch back to preview mode
      setEditMode(false);

      // 6. Hide the success message after a few seconds
      setTimeout(() => {
        setSavedMessage("");
      }, 3000);
    } catch (error) {
      console.error("Save error:", error);
      let errorMessage = "Failed to save paper.";
      if (error.message) {
        errorMessage = error.message;
      }
      setSavedMessage(`Error: ${errorMessage}`);
      setTimeout(() => setSavedMessage(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSave = () => {
    setShowSaveModal(true);
  };

  const handleCancelSave = () => {
    setShowSaveModal(false);
  };

  const downloadPDF = () => {
    const printWindow = window.open("", "_blank");
    const paperContent = document.querySelector(".paper-content").innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${paperData.testName} - ${paperData.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .college-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 8px; }
            .test-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
            .subject-class { font-size: 16px; margin-bottom: 8px; }
            .exam-details { background: #eff6ff; padding: 10px; border-radius: 8px; }
            .instructions { border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; background: #eff6ff; margin-bottom: 20px; }
            .instructions h3 { color: #1e40af; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #374151; padding: 8px; text-align: left; }
            th { background-color: #bfdbfe; font-weight: bold; }
            .section-header { background-color: #dbeafe; font-weight: bold; color: #1e40af; }
            .question-cell { vertical-align: top; }
            .marks-cell { text-align: center; vertical-align: top; width: 60px; }
            .question-no { text-align: center; vertical-align: top; width: 50px; }
            .options { margin-top: 8px; font-size: 14px; }
            .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 30px; border-top: 1px solid #d1d5db; padding-top: 15px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${paperContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const downloadDOCX = () => {
    try {
      // Create HTML content that Word can open
      const htmlContent = `
        <!DOCTYPE html>
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <meta name="ProgId" content="Word.Document">
            <meta name="Generator" content="Microsoft Word 15">
            <meta name="Originator" content="Microsoft Word 15">
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                margin: 1in; 
                line-height: 1.15; 
                color: #000;
                font-size: 12pt;
              }
              .header { 
                text-align: center; 
                border-bottom: 2px solid #000; 
                padding-bottom: 10px; 
                margin-bottom: 20px; 
              }
              .college-name { 
                font-size: 18pt; 
                font-weight: bold; 
                margin-bottom: 8px; 
              }
              .test-name { 
                font-size: 14pt; 
                font-weight: bold; 
                margin-bottom: 8px; 
              }
              .subject-class { 
                font-size: 12pt; 
                margin-bottom: 8px; 
              }
              .exam-details { 
                background: #f0f0f0; 
                padding: 10px; 
                margin-bottom: 20px; 
                font-size: 10pt;
              }
              .instructions { 
                border: 1px solid #000; 
                padding: 15px; 
                background: #f9f9f9; 
                margin-bottom: 20px; 
              }
              .instructions h3 { 
                font-weight: bold; 
                margin-bottom: 10px; 
                font-size: 12pt;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px; 
              }
              th, td { 
                border: 1px solid #000; 
                padding: 8px; 
                text-align: left; 
                vertical-align: top;
              }
              th { 
                background-color: #e0e0e0; 
                font-weight: bold; 
              }
              .section-header { 
                background-color: #d0d0d0; 
                font-weight: bold; 
              }
              .question-cell { 
                vertical-align: top; 
              }
              .marks-cell { 
                text-align: center; 
                vertical-align: top; 
                width: 60px; 
              }
              .question-no { 
                text-align: center; 
                vertical-align: top; 
                width: 50px; 
              }
              .options { 
                margin-top: 8px; 
                font-size: 11pt; 
              }
              .page-break {
                page-break-before: always;
              }
            </style>
          </head>
          <body>
            <!-- Header -->
            <div class="header">
              <div class="college-name">${
                paperData.collegeName || "New High School"
              }</div>
              <div class="test-name">${paperData.testName}</div>
              <div class="subject-class">${paperData.subject} - ${
        paperData.className
      }</div>
              <div class="exam-details">
                <strong>Date:</strong> ${
                  new Date().toISOString().split("T")[0]
                } &nbsp;&nbsp;&nbsp;
                <strong>Max. Marks:</strong> ${calculateTotalMarks()} &nbsp;&nbsp;&nbsp;
                <strong>Time:</strong> ${paperData.timeAllowed}
              </div>
            </div>

            <!-- Instructions -->
            <div class="instructions">
              <h3>General Instructions:</h3>
              <ol>
                ${(paperData.instructions || [])
                  .filter(
                    (instruction) => instruction && instruction.length > 0
                  )
                  .map((instruction) => `<li>${instruction}</li>`)
                  .join("")}
              </ol>
            </div>

            <!-- Questions Table -->
            <table>
              <thead>
                <tr>
                  <th class="question-no">Q. No.</th>
                  <th>Questions</th>
                  <th class="marks-cell">Marks</th>
                </tr>
              </thead>
              <tbody>
                ${(paperData.sections || [])
                  .map((section) => {
                    const header = `
                  <tr>
                    <td colspan="3" class="section-header">
                      <strong>${section.sectionName}</strong><br>
                      <em>${section.description}</em>
                    </td>
                  </tr>`;
                    const rows = (section.questions || [])
                      .map((question) => {
                        const opts = Array.isArray(question.options)
                          ? question.options.filter((o) => o && o.length > 0)
                          : [];
                        const optsHtml =
                          opts.length > 0
                            ? `
                          <div class="options">
                            ${opts
                              .map((option) => `<div>${option}</div>`)
                              .join("")}
                          </div>
                        `
                            : "";
                        return `
                    <tr>
                      <td class="question-no">${question.questionNo}</td>
                      <td class="question-cell">
                        ${question.question}
                        ${optsHtml}
                      </td>
                      <td class="marks-cell">${question.marks}</td>
                    </tr>`;
                      })
                      .join("");
                    return header + rows;
                  })
                  .join("")}
              </tbody>
            </table>

            <div style="margin-top: 30px; text-align: center; font-size: 10pt; color: #666;">
              Total Marks: ${calculateTotalMarks()}
            </div>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], {
        type: "application/msword",
      });

      const fileName = `${paperData.subject}_${paperData.testName.replace(
        /\s+/g,
        "_"
      )}.doc`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      alert("Error generating DOC file. Please try again.");
    }
  };
  if (isLoading) {
    return <div className="text-center p-10">Loading paper...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-600">Error: {error}</div>;
  }
  if (!paperData) {
    return <div className="text-center p-10">Initializing paper view...</div>;
  }

  return (
    <div>
      {/* Control Panel */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => setEditMode(!editMode)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
        >
          {editMode ? "Preview Paper" : "Edit Paper"}
        </button>
        {!editMode && (
          <>
            <button
              onClick={downloadPDF}
              className="bg-red-600 text-white py-2 px-4 rounded-lg"
            >
              Download PDF
            </button>
            <button
              onClick={downloadDOCX}
              className="bg-green-600 text-white py-2 px-4 rounded-lg"
            >
              Download DOC
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg"
            >
              Save Paper
            </button>
          </>
        )}
      </div>

      {/* --- Paper Set Tabs UI --- */}
      {generatedPapers.length > 1 && !editMode && (
        <div className="max-w-5xl mx-auto my-4 p-2 bg-white rounded-lg shadow">
          <div className="flex border-b border-gray-200">
            {generatedPapers.map((paper, index) => (
              <button
                key={paper._id || index}
                onClick={() => handlePaperSelection(index)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  selectedPaperIndex === index
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Set {String.fromCharCode(65 + index)}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSaveModal && (
        <SaveConfirmationModal
          handleCancelSave={() => setShowSaveModal(false)}
          handleSavePaper={handleSavePaper}
          isSaving={isSaving}
        />
      )}

      {savedMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
          <div
            className={`font-medium ${
              savedMessage.includes("Error") ? "text-red-600" : "text-green-600"
            }`}
          >
            {savedMessage}
          </div>
        </div>
      )}

      {editMode ? (
        <EditView
          paperData={paperData}
          savedMessage={savedMessage}
          handleInputChange={handleInputChange}
          updateSection={updateSection}
          updateQuestion={updateQuestion}
        />
      ) : (
        <PaperView
          paperData={paperData}
          calculateTotalMarks={calculateTotalMarks}
        />
      )}
    </div>
  );
}

export default ExamPaperGenerator;

import React, { useState, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// A stand-alone component for viewing the paper
const PaperView = ({ paperData, calculateTotalMarks }) => (
  <div className="min-h-screen bg-gray-100 py-8 px-4">
    <div className="max-w-5xl mx-auto">
      <div className="paper-content bg-white border-2 border-blue-400 rounded-xl shadow-lg px-8 py-6 mb-8 min-h-[11in]">
        <div className="header text-center border-b-2 border-blue-300 pb-4 mb-6">
          <h1 className="college-name text-2xl font-bold text-blue-800 mb-2">
            {paperData.collegeName || "New High School"}
          </h1>
          <h2 className="test-name text-lg font-semibold text-gray-700 mb-2">
            {paperData.testName}
          </h2>
          <h3 className="subject-class text-md font-medium text-gray-600 mb-3">
            {paperData.subject} - {paperData.className}
          </h3>
          <div className="exam-details flex justify-between items-center text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
            <span>
              <strong>Date:</strong>{" "}
              {paperData.date || new Date().toISOString().split("T")[0]}
            </span>
            <span>
              <strong>Max. Marks:</strong> {calculateTotalMarks()}
            </span>
            <span>
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
          <button
            onClick={() => console.log("Current paperData:", paperData)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Debug State
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            College Name
          </label>
          <input
            type="text"
            value={paperData.collegeName || ""}
            onChange={(e) => handleInputChange("collegeName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Name
          </label>
          <input
            type="text"
            value={paperData.testName || ""}
            onChange={(e) => handleInputChange("testName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* ... other form fields for subject, className, etc. ... */}
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions
        </label>
        <textarea
          value={(paperData.instructions || []).join("\n")}
          onChange={(e) =>
            handleInputChange("instructions", e.target.value.split("\n"))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
        />
      </div>

      {/* Sections and Questions */}
      {(paperData.sections || []).map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="border border-gray-300 rounded-lg p-4 mb-4"
        >
          {/* ... inputs for sectionName, description, etc. ... */}
          {(section.questions || []).map((question, questionIndex) => (
            <div key={questionIndex} className="bg-gray-50 p-3 rounded-md mb-3">
              {/* ... inputs for questionNo, marks, question text, etc. ... */}
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
          className="px-4 py-2 text-gray-600 ..."
        >
          Cancel
        </button>
        <button
          onClick={handleSavePaper}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 ..."
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

  const normalizePaper = useCallback((incoming, fallback) => {
    // ✅ CORRECTED: This logic drills down to find the real paper data
    let data = incoming;
    if (data?.paper) {
      data = data.paper;
    }
    if (data?.question_paper) {
      data = data.question_paper;
    }

    if (Array.isArray(data)) {
      data = data[0] || {}; // Use the first paper, or an empty object as a fallback.
    }

    const safeString = (v, fb = "") =>
      typeof v === "string" ? v.trim() || fb : fb;
    const safeNumber = (v, fb = 0) =>
      Number.isFinite(Number(v)) ? Number(v) : fb;
    const safeArray = (v) => (Array.isArray(v) ? v : []);

    const normalized = {
      collegeName: safeString(data?.collegeName, fallback.collegeName),
      testName: safeString(
        data?.testName || incoming?.title,
        fallback.testName
      ),
      subject: safeString(data?.subject, fallback.subject),
      className: safeString(data?.className, fallback.className),
      maxMarks: safeNumber(data?.maxMarks, fallback.maxMarks),
      timeAllowed: safeString(data?.timeAllowed, fallback.timeAllowed),
      date: safeString(data?.date, fallback.date),
      instructions: safeArray(data?.instructions)
        .map(safeString)
        .filter(Boolean),
      sections: safeArray(data?.sections).map((section, sIdx) => ({
        sectionName: safeString(section?.sectionName, `Section ${sIdx + 1}`),
        description: safeString(section?.description),
        sectionTitle: safeString(section?.sectionTitle),
        questions: safeArray(section?.questions).map((q, qIdx) => ({
          questionNo: safeString(q?.questionNo, `${qIdx + 1}`),
          question: safeString(q?.question),
          marks: safeNumber(q?.marks, 1),
          options: safeArray(q?.options).map(safeString).filter(Boolean),
        })),
      })),
    };

    if (normalized.instructions.length === 0 && fallback.instructions) {
      normalized.instructions = fallback.instructions;
    }
    return normalized;
  }, []);

  const [paperData, setPaperData] = useState({
    collegeName: "Vit pune",
    testName: "Unit Test",
    subject: "History",
    className: "Class 10",
    maxMarks: 30,
    timeAllowed: "1 hour",
    date: new Date().toISOString().split("T")[0],
    instructions: [
      "All questions are compulsory",
      "Read the questions carefully before attempting",
    ],
    sections: [],
  });

  //const [paperData, setPaperData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [paperId, setPaperId] = useState(null);
  const [generatedPapers, setGeneratedPapers] = useState([]);
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0);

  useEffect(() => {
    const papersArray = location.state?.generated_papers;
    const singlePaper = location.state?.paper;

    if (Array.isArray(papersArray) && papersArray.length > 0) {
      setGeneratedPapers(papersArray);
      const firstPaper = papersArray[0];
      if (firstPaper) {
        setPaperData(normalizePaper(firstPaper, {}));
        setPaperId(firstPaper._id);
        setSelectedPaperIndex(0);
      }
    } else if (singlePaper && singlePaper._id) {
      setGeneratedPapers([]); // Clear any previous multi-paper state
      setPaperData(normalizePaper(singlePaper, {}));
      setPaperId(singlePaper._id);
    } else {
      const raw = sessionStorage.getItem("generatedPaperData");
      if (raw) {
        setPaperData(normalizePaper(JSON.parse(raw) || {}, {}));
      }
      setPaperId(null);
    }
  }, [location.state, normalizePaper]);

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
    return (paperData.sections || []).reduce((total, section) => {
      const sectionSum = (section.questions || []).reduce(
        (sectionTotal, question) =>
          sectionTotal + (Number(question.marks) || 0),
        0
      );
      return total + sectionSum;
    }, 0);
  }, [paperData.sections]);

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
        response = await fetch(
          `http://localhost:5000/api/teachers/question-papers/${paperId}`,
          {
            method: "PUT",
            headers: headers,
            body: JSON.stringify(payload),
          }
        );
      } else {
        console.log("ATTEMPTING TO CREATE (POST)");
        const payloadForCreation = {
          class: paperToSave.className,
          subject: paperToSave.subject,
          pdf_name: paperToSave.testName,
          ...paperToSave,
        };
        response = await fetch(
          "http://localhost:5000/api/teachers/generate-question-paper",
          {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payloadForCreation),
          }
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to save question paper");
      }

      setSavedMessage("Question paper saved successfully!");
      setShowSaveModal(false);
      sessionStorage.removeItem("generatedPaperData");

      setTimeout(() => {
        setSavedMessage("");
        navigate("/my-papers"); // Navigate back to the list to see the result
      }, 2000);
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
    // PDF download logic...
  };

  const downloadDOCX = () => {
    // DOCX download logic...
  };

  return (
    <div>
      {/* Control Panel */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => setEditMode(!editMode)}
          className="bg-blue-600 hover:bg-blue-700 ..."
        >
          {editMode ? "Preview Paper" : "Edit Paper"}
        </button>
        {!editMode && (
          <>
            <button onClick={downloadPDF} className="bg-red-600 ...">
              Download PDF
            </button>
            <button onClick={downloadDOCX} className="bg-green-600 ...">
              Download DOC
            </button>
            <button onClick={handleConfirmSave} className="bg-purple-600 ...">
              Save Paper
            </button>
          </>
        )}
      </div>

      {/* Multi-paper Selector */}
      {generatedPapers.length > 1 && !editMode && (
        <div className="max-w-5xl mx-auto my-4 p-4 bg-white rounded-lg shadow">
          <label
            htmlFor="paper-selector"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select a Generated Paper Version to View/Edit:
          </label>
          <select
            id="paper-selector"
            value={selectedPaperIndex}
            onChange={(e) => handlePaperSelection(parseInt(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 ... rounded-md"
          >
            {generatedPapers.map((paper, index) => (
              <option key={paper._id || index} value={index}>
                Version {index + 1} - {paper.title || "Untitled"}
              </option>
            ))}
          </select>
        </div>
      )}

      {showSaveModal && (
        <SaveConfirmationModal
          handleCancelSave={handleCancelSave}
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

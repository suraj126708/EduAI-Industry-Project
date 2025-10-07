/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// A stand-alone component for viewing the paper
const PaperView = ({ paperData, calculateTotalMarks }) => (
  <div className="min-h-screen bg-gray-100 py-8 px-4">
    <div className="max-w-5xl mx-auto">
      <div className="paper-content bg-white border-2 border-blue-400 rounded-xl shadow-lg px-8 py-6 mb-8 min-h-[11in]">
        {/* Header */}
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

        {/* Instructions */}
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

        {/* Questions Table */}
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
                  {(section.questions || []).map((question, questionIndex) => (
                    <tr
                      key={`q-${sIdx}-${questionIndex}`}
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
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="ml-4">
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

        {/* Footer */}
        <div className="footer flex justify-between items-center mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()}{" "}
            {paperData.collegeName || "New High School"}
          </div>
          <div className="font-medium">Page 1 of 1</div>
        </div>
      </div>
    </div>
  </div>
);

// A stand-alone component for editing the paper
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={paperData.subject || ""}
            onChange={(e) => handleInputChange("subject", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class
          </label>
          <input
            type="text"
            value={paperData.className || ""}
            onChange={(e) => handleInputChange("className", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Allowed
          </label>
          <input
            type="text"
            value={paperData.timeAllowed || ""}
            onChange={(e) => handleInputChange("timeAllowed", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="text"
            value={paperData.date || ""}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

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
          placeholder="Enter instructions, one per line"
        />
      </div>

      {(paperData.sections || []).map((section, sectionIndex) => (
        <div
          key={`section-${sectionIndex}`}
          className="border border-gray-300 rounded-lg p-4 mb-4"
        >
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            {section.sectionName}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={section.sectionTitle || ""}
              onChange={(e) =>
                updateSection(sectionIndex, "sectionTitle", e.target.value)
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Section Title"
            />
            <input
              type="text"
              value={section.description || ""}
              onChange={(e) =>
                updateSection(sectionIndex, "description", e.target.value)
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Section Description"
            />
          </div>

          {(section.questions || []).map((question, questionIndex) => (
            <div
              key={`question-${sectionIndex}-${questionIndex}`}
              className="bg-gray-50 p-3 rounded-md mb-3"
            >
              <div className="grid grid-cols-12 gap-2 mb-2">
                <input
                  type="text"
                  value={question.questionNo}
                  onChange={(e) =>
                    updateQuestion(
                      sectionIndex,
                      questionIndex,
                      "questionNo",
                      e.target.value
                    )
                  }
                  className="col-span-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  placeholder="No."
                />
                <input
                  type="number"
                  value={question.marks}
                  onChange={(e) =>
                    updateQuestion(
                      sectionIndex,
                      questionIndex,
                      "marks",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="col-span-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  placeholder="Marks"
                />
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
                  className="col-span-10 px-2 py-1 border border-gray-300 rounded-md text-sm h-20"
                  placeholder="Question"
                />
              </div>
              {question.options && (
                <textarea
                  value={question.options.join("\n")}
                  onChange={(e) =>
                    updateQuestion(
                      sectionIndex,
                      questionIndex,
                      "options",
                      e.target.value.split("\n").filter((opt) => opt.trim())
                    )
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm h-20"
                  placeholder="Options (one per line)"
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Save Confirmation Modal Component
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
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSavePaper}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            "Save Paper"
          )}
        </button>
      </div>
    </div>
  </div>
);

// --- Main Component ---
// --- Main Component ---
function ExamPaperGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ CORRECT, SINGLE DEFINITION of normalizePaper
  // In PaperFormat.jsx

  const normalizePaper = useCallback((incoming, fallback) => {
    // First, determine the actual source of the paper data.
    // Is it the incoming object itself, or is it nested inside a 'paper' property?
    // ✅ NEW: Logic to drill down into the nested data structure
    let data = incoming;
    if (data?.paper) {
      data = data.paper;
    }
    if (data?.question_paper) {
      data = data.question_paper;
    }

    const safeString = (v, fb = "") => {
      if (typeof v === "string") {
        const trimmed = v.trim();
        return trimmed.length > 0 ? trimmed : fb;
      }
      return fb;
    };
    const safeNumber = (v, fb = 0) =>
      Number.isFinite(Number(v)) ? Number(v) : fb;
    const safeArray = (v) => (Array.isArray(v) ? v : []);

    // Now, use 'data' to access properties, but still check the original 'incoming' for top-level DB fields like 'title'
    const normalized = {
      collegeName: safeString(data?.collegeName, fallback.collegeName),
      testName: safeString(
        data?.testName || incoming?.title, // Use data.testName first, then fallback to the top-level title
        fallback.testName
      ),
      subject: safeString(data?.subject || data?.subjectName, fallback.subject),
      className: safeString(
        data?.className || data?.class || data?.classGrade,
        fallback.className
      ),
      maxMarks: safeNumber(data?.maxMarks, fallback.maxMarks),
      timeAllowed: safeString(
        data?.timeAllowed || data?.duration,
        fallback.timeAllowed
      ),
      date: safeString(data?.date, fallback.date),
      instructions: safeArray(data?.instructions)
        .map((i) => safeString(i))
        .filter((i) => i),
      sections: safeArray(data?.sections).map((section, sIdx) => {
        const questions = safeArray(section?.questions).map((q, qIdx) => {
          const options = safeArray(q?.options || q?.choices)
            .map((opt) => safeString(opt))
            .filter((opt) => opt);
          return {
            questionNo: safeString(q?.questionNo, (qIdx + 1).toString()),
            question: safeString(
              q?.question || q?.question_text || q?.text || q?.ques
            ),
            marks: safeNumber(q?.marks, 1),
            ...(options.length > 0 ? { options } : {}),
          };
        });
        return {
          sectionName: safeString(
            section?.sectionName || section?.title || section?.name,
            `Section ${sIdx + 1}`
          ),
          sectionTitle: safeString(section?.sectionTitle),
          description: safeString(section?.description),
          questions,
        };
      }),
    };

    if (normalized.instructions.length === 0) {
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

  const [editMode, setEditMode] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [paperId, setPaperId] = useState(null);

  // In PaperFormat.jsx

  useEffect(() => {
    console.log("DATA RECEIVED ON PAGE LOAD:", location.state);
    const statePaper = location.state?.paper;

    // Prioritize data from navigation state first.
    if (statePaper && statePaper._id) {
      console.log(
        "EFFECT: Found paper in location state. Setting ID:",
        statePaper._id
      );
      const candidate = normalizePaper(statePaper, paperData);
      setPaperData(candidate);
      setPaperId(statePaper._id);
    } else {
      // Fallback to session storage if navigation state is missing.
      console.log("EFFECT: Location state is empty, checking session storage.");
      const raw = sessionStorage.getItem("generatedPaperData");
      if (raw) {
        const gen = JSON.parse(raw);
        const candidate = normalizePaper(gen || {}, paperData);
        setPaperData(candidate);
        // Ensure paperId is reset to null if loading a new, unsaved paper
        setPaperId(null);
      }
    }

    // THIS COMMENT IS CRITICAL. It tells React to ONLY run this effect
    // when the component mounts. This prevents it from re-running and
    // accidentally clearing your paperId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- The dependency array MUST BE EMPTY.

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
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => setEditMode(!editMode)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium transition-colors"
        >
          {editMode ? "Preview Paper" : "Edit Paper"}
        </button>

        {!editMode && (
          <>
            <button
              onClick={downloadPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium transition-colors"
            >
              Download PDF
            </button>
            <button
              onClick={downloadDOCX}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium transition-colors"
            >
              Download DOC
            </button>
            <button
              onClick={handleConfirmSave}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium transition-colors"
            >
              Save Paper
            </button>
          </>
        )}
      </div>

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

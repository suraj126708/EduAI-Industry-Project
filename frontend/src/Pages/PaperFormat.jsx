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

  const [paperData, setPaperData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [paperId, setPaperId] = useState(null);
  const [generatedPapers, setGeneratedPapers] = useState([]);
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0);

  useEffect(() => {
    // Standardize data loading: always look for an array of papers
    const papersFromState = location.state?.papers; // Standard key from navigate()
    const papersFromStorage = JSON.parse(
      sessionStorage.getItem("generatedPapersArray")
    );

    const papersArray = papersFromState || papersFromStorage || [];

    if (papersArray.length > 0) {
      setGeneratedPapers(papersArray);
      // Set the initially displayed paper to the one at the selected index (usually the first one)
      const initialPaper = papersArray[selectedPaperIndex];
      if (initialPaper) {
        setPaperData(normalizePaper(initialPaper, {}));
        setPaperId(initialPaper._id);
      }
    }
  }, [location.state, normalizePaper, selectedPaperIndex]);

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

      {/* ✅ 3. REPLACE the "Multi-paper Selector" dropdown with this Tab UI */}
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
                Paper {index + 1}
              </button>
            ))}
          </div>
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

/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

const VisualRenderer = ({ imageUrl, svgContent, altText }) => {
  if (svgContent) {
    return (
      <div
        className="my-3 p-2 border border-gray-200 rounded flex justify-start bg-white"
        title={altText}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  if (imageUrl) {
    return (
      <div className="my-3 flex justify-start">
        <img
          src={imageUrl}
          alt={altText || "Question Diagram"}
          className="max-h-64 max-w-full object-contain border border-gray-200 rounded p-1 bg-white"
        />
      </div>
    );
  }

  return null;
};

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
            {paperData.examType || paperData.testName || "Examination"}
          </h2>
          <div className="exam-details grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1 items-center text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg text-left sm:text-center">
            <span className="col-span-1">
              <strong>Date:</strong>{" "}
              {paperData.date || new Date().toISOString().split("T")[0]}
            </span>
            <span className="col-span-1">
              <strong>Subject:</strong> {paperData.subject || "-"}
            </span>
            <span className="col-span-1">
              <strong>Class:</strong> {paperData.className || "-"}
            </span>
            <span className="col-span-1">
              <strong>Marks:</strong> {calculateTotalMarks()}
            </span>
            <span className="col-span-1">
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
                      <div className="flex flex-col gap-1">
                        <div className="text-lg">
                          <span className="font-bold text-blue-800">
                            {section.sectionName}
                          </span>
                          {section.sectionTitle && (
                            <span className="font-semibold text-gray-800 font-family-times">
                              : {section.sectionTitle}
                            </span>
                          )}
                        </div>
                        {section.description && (
                          <div className="text-sm text-gray-600 italic">
                            {section.description}
                          </div>
                        )}
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

                        {/* ✅ RENDER VISUALS (SVG or IMAGE) */}
                        <VisualRenderer
                          imageUrl={question.imageUrl}
                          svgContent={question.svgContent}
                          altText={`Diagram for Q${question.questionNo}`}
                        />

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

      {/* Paper Details Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 border rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            School/College Name
          </label>
          <input
            type="text"
            value={paperData.collegeName || ""}
            onChange={(e) => handleInputChange("collegeName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Allowed
          </label>
          <input
            type="text"
            value={paperData.timeAllowed || ""}
            onChange={(e) => handleInputChange("timeAllowed", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm h-24"
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
          <div className="grid grid-cols-1 gap-4 mb-4">
            <input
              type="text"
              value={section.sectionName || ""}
              onChange={(e) =>
                updateSection(sectionIndex, "sectionName", e.target.value)
              }
              placeholder="Section Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
            <input
              type="text"
              value={section.sectionTitle || ""}
              onChange={(e) =>
                updateSection(sectionIndex, "sectionTitle", e.target.value)
              }
              placeholder="Section Instruction"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-semibold"
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
              />

              {/* --- UPDATED IMAGE EDITING UI --- */}
              <div className="mt-2 bg-gray-100 p-2 rounded">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Image URL / Data
                    </label>
                    <input
                      type="text"
                      value={
                        question.imageUrl ||
                        (question.svgContent ? "<SVG Data...>" : "")
                      }
                      onChange={(e) =>
                        updateQuestion(
                          sectionIndex,
                          questionIndex,
                          "imageUrl",
                          e.target.value
                        )
                      }
                      placeholder="http://... or data:image/..."
                      disabled={!!question.svgContent} // Disable direct edit for SVG content
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-500"
                    />
                  </div>
                </div>

                {/* Preview in Edit Mode */}
                <div className="mt-2 p-2 border border-dashed border-gray-300 bg-white rounded flex justify-center items-center">
                  {question.imageUrl || question.svgContent ? (
                    <div className="max-w-xs">
                      <VisualRenderer
                        imageUrl={question.imageUrl}
                        svgContent={question.svgContent}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      No image attached
                    </span>
                  )}
                </div>
              </div>

              {Array.isArray(question.options) &&
                question.options.length > 0 && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options
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
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSavePaper}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isSaving ? "Saving..." : "Save Paper"}
        </button>
      </div>
    </div>
  </div>
);

function ExamPaperGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paperIdFromUrl } = useParams();

  // --- UPDATED NORMALIZATION LOGIC ---
  const normalizePaper = useCallback((incoming, fallback = {}) => {
    const topLevelData = incoming || {};
    let paperObjectData = incoming?.paper || {};

    const safeString = (v, fb = "") =>
      typeof v === "string" ? v.trim() || fb : fb;
    const safeNumber = (v, fb = 0) =>
      Number.isFinite(Number(v)) ? Number(v) : fb;
    const safeArray = (v) => (Array.isArray(v) ? v : []);

    const subject = safeString(
      topLevelData.subject || paperObjectData.subject,
      fallback.subject
    );
    const className = safeString(
      topLevelData.classGrade || paperObjectData.className,
      fallback.className
    );
    const examType = safeString(topLevelData.examType, fallback.examType);
    let testName = safeString(
      paperObjectData.testName || topLevelData.title,
      fallback.testName
    );

    if (testName.startsWith("questionPaper")) {
      testName =
        examType || (subject ? `${subject} Examination` : "Examination");
    }

    return {
      collegeName: safeString(
        paperObjectData.collegeName,
        fallback.collegeName
      ),
      testName: testName,
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
        sectionTitle: safeString(section?.sectionTitle),
        description: safeString(section?.description),

        questions: safeArray(section?.questions).map((q, qIdx) => {
          // --- LOGIC TO EXTRACT VISUALS ---
          const imgData = q?.image_data || {};
          const isSvg =
            imgData.type === "svg" || q?.visual_annotation?.type === "svg";

          let resolvedImageUrl = "";
          let resolvedSvgContent = "";

          if (isSvg && imgData.content) {
            resolvedSvgContent = imgData.content;
          } else if (imgData.type === "image" && imgData.content) {
            // Backend sends Base64 data URI directly
            resolvedImageUrl = imgData.content;
          } else {
            // Fallback for older papers
            resolvedImageUrl = q?.imageUrl || q?.image || q?.diagramUrl || "";
          }

          return {
            questionNo: safeString(q?.questionNo, `${qIdx + 1}`),
            question: safeString(q?.question),
            marks: safeNumber(q?.marks, 1),
            options: safeArray(q?.options).map(safeString).filter(Boolean),
            questionType: safeString(q?.questionType || q?.type, "text"),

            // Set the resolved fields
            imageUrl: resolvedImageUrl,
            svgContent: resolvedSvgContent,
          };
        }),
      })),

      subject: subject,
      className: className,
      examType: examType,
      maxMarks: safeNumber(
        topLevelData.totalMarks || paperObjectData.maxMarks,
        fallback.maxMarks
      ),
    };
  }, []);

  const [paperData, setPaperData] = useState(null);
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
    setPaperData((prev) => ({ ...prev, [field]: value }));
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
      return (
        total +
        (section.questions || []).reduce(
          (sum, q) => sum + (Number(q.marks) || 0),
          0
        )
      );
    }, 0);
  }, [paperData]);

  const handleSavePaper = async () => {
    setIsSaving(true);
    try {
      if (!user) throw new Error("Authentication error.");
      const token = await user.getIdToken();

      const paperToSave = {
        ...paperData,
        totalMarks: calculateTotalMarks(),
      };

      let response;
      if (paperId) {
        const payload = { paper: paperToSave, title: paperToSave.testName };
        response = await api.put(
          `teachers/question-papers/${paperId}`,
          payload
        );
      } else {
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

      const data = response.data;
      if (!data || !data.success)
        throw new Error(data?.message || "Failed to save.");

      const updatedDocument = data.question_paper;
      setPaperData(normalizePaper(updatedDocument, {}));

      const updatedIndex = generatedPapers.findIndex((p) => p._id === paperId);
      if (updatedIndex !== -1) {
        const newGeneratedPapers = [...generatedPapers];
        newGeneratedPapers[updatedIndex] = updatedDocument;
        setGeneratedPapers(newGeneratedPapers);
        sessionStorage.setItem(
          "generatedPapersArray",
          JSON.stringify(newGeneratedPapers)
        );
      }

      setSavedMessage("Paper saved successfully!");
      setShowSaveModal(false);
      setEditMode(false);
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setSavedMessage(`Error: ${error.message || "Failed to save."}`);
      setTimeout(() => setSavedMessage(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = () => {
    const printWindow = window.open("", "_blank");
    const paperContent = document.querySelector(".paper-content").innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${paperData.testName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .college-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 8px; }
            .test-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
            .exam-details { background: #eff6ff; padding: 10px; border-radius: 8px; display: flex; justify-content: space-around; font-size: 14px; }
            .instructions { border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; background: #eff6ff; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #374151; padding: 8px; text-align: left; }
            th { background-color: #bfdbfe; font-weight: bold; }
            .section-header { background-color: #dbeafe; font-weight: bold; color: #1e40af; }
            .question-cell { vertical-align: top; }
            .marks-cell { text-align: center; vertical-align: top; width: 60px; }
            .question-no { text-align: center; vertical-align: top; width: 50px; }
            img { max-width: 100%; height: auto; display: block; margin: 10px 0; border: 1px solid #ddd; }
            svg { max-width: 300px; height: auto; display: block; margin: 10px 0; }
          </style>
        </head>
        <body>${paperContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const downloadDOCX = () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Times New Roman', serif; font-size: 12pt; }
              table { width: 100%; border-collapse: collapse; }
              td, th { border: 1px solid #000; padding: 5px; }
            </style>
          </head>
          <body>
            <div style="text-align: center;">
              <h2>${paperData.collegeName || "School Name"}</h2>
              <h3>${paperData.testName}</h3>
              <p>Subject: ${paperData.subject} | Class: ${
        paperData.className
      }</p>
            </div>
            <table>
              <thead>
                <tr><th>Q. No.</th><th>Question</th><th>Marks</th></tr>
              </thead>
              <tbody>
                ${(paperData.sections || [])
                  .map((section) =>
                    (section.questions || [])
                      .map((q) => {
                        const imgTag = q.imageUrl
                          ? `<br/><img src="${q.imageUrl}" width="200" /><br/>`
                          : "";
                        return `<tr>
                      <td>${q.questionNo}</td>
                      <td>${q.question}${imgTag}
                        ${(q.options || [])
                          .map((o) => `<div>${o}</div>`)
                          .join("")}
                      </td>
                      <td>${q.marks}</td>
                    </tr>`;
                      })
                      .join("")
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: "application/msword" });
      saveAs(
        blob,
        `${paperData.subject}_${paperData.testName.replace(/\s+/g, "_")}.doc`
      );
    } catch (e) {
      console.error(e);
      alert("Error generating DOC.");
    }
  };

  if (isLoading) return <div className="text-center p-10">Loading...</div>;
  if (error)
    return <div className="text-center p-10 text-red-600">Error: {error}</div>;
  if (!paperData) return <div className="text-center p-10">No data</div>;

  return (
    <div>
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => setEditMode(!editMode)}
          className="bg-blue-600 text-white py-2 px-4 rounded"
        >
          {editMode ? "Preview" : "Edit"}
        </button>
        {!editMode && (
          <>
            <button
              onClick={downloadPDF}
              className="bg-red-600 text-white py-2 px-4 rounded"
            >
              PDF
            </button>
            <button
              onClick={downloadDOCX}
              className="bg-green-600 text-white py-2 px-4 rounded"
            >
              DOC
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-purple-600 text-white py-2 px-4 rounded"
            >
              Save
            </button>
          </>
        )}
      </div>

      {generatedPapers.length > 1 && !editMode && (
        <div className="max-w-5xl mx-auto my-4 p-2 bg-white rounded shadow">
          {generatedPapers.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePaperSelection(i)}
              className={`px-4 py-2 ${
                selectedPaperIndex === i ? "text-blue-600 font-bold" : ""
              }`}
            >
              Set {String.fromCharCode(65 + i)}
            </button>
          ))}
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
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white p-4 shadow rounded border">
          <div
            className={
              savedMessage.includes("Error") ? "text-red-600" : "text-green-600"
            }
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

/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { paperAPI } from "../utils/api";

// --- COMPONENT: VISUAL RENDERER ---
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

// --- COMPONENT: SMART QUESTION RENDERER (Match Columns logic) ---
const SmartQuestionRenderer = ({ text }) => {
  const isMatchColumn =
    text && text.includes("Column A:") && text.includes("Column B:");

  if (isMatchColumn) {
    const partsA = text.split(/Column A:/i);
    let instruction = partsA[0] ? partsA[0].trim() : "";

    const cleanInst = instruction.replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (cleanInst.includes("matchtheitemsgivenincolumnawithcolumnb")) {
      instruction = null;
    }

    const partsB = partsA[1] ? partsA[1].split(/Column B:/i) : ["", ""];
    const colARaw = partsB[0] ? partsB[0].trim() : "";
    const colBRaw = partsB[1] ? partsB[1].trim() : "";

    const rowsA = colARaw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const rowsB = colBRaw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const maxRows = Math.max(rowsA.length, rowsB.length);

    return (
      <div className="w-full mt-2">
        {instruction && (
          <div className="mb-3 text-gray-800 whitespace-pre-wrap font-medium">
            {instruction}
          </div>
        )}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="grid grid-cols-2 bg-blue-100 border-b border-gray-300">
            <div className="px-4 py-2 font-bold text-blue-900 border-r border-gray-300">
              Column A
            </div>
            <div className="px-4 py-2 font-bold text-blue-900">Column B</div>
          </div>
          <div className="divide-y divide-gray-200">
            {Array.from({ length: maxRows }).map((_, index) => (
              <div key={index} className="grid grid-cols-2">
                <div className="px-4 py-3 text-gray-700 border-r border-gray-200 whitespace-pre-wrap">
                  {rowsA[index] || ""}
                </div>
                <div className="px-4 py-3 text-gray-700 whitespace-pre-wrap">
                  {rowsB[index] || ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
};

// --- COMPONENT: PAPER VIEW (Read Only) ---
const PaperView = ({ paperData, calculateTotalMarks }) => {
  useEffect(() => {
    if (typeof window?.MathJax !== "undefined" && paperData) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax typesetting complete"))
        .catch((err) => console.log("MathJax error:", err));
    }
  }, [paperData]);

  return (
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
                    {/* Section Header Row */}
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

                    {/* Questions Loop */}
                    {(section.questions || []).map((question, qIndex) => (
                      <tr
                        key={`q-${sIdx}-${qIndex}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="question-no border border-gray-400 text-center px-2 py-3 font-medium">
                          {question.questionNo}
                        </td>
                        <td className="question-cell border border-gray-400 px-3 py-3">
                          <div className="text-gray-800">
                            <SmartQuestionRenderer text={question.question} />
                          </div>

                          {/* Visuals */}
                          <VisualRenderer
                            imageUrl={question.imageUrl}
                            svgContent={question.svgContent}
                            altText={`Diagram for Q${question.questionNo}`}
                          />

                          {/* Options */}
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
};

// --- COMPONENT: EDIT VIEW ---
// --- COMPONENT: EDIT VIEW ---
const EditView = ({
  paperData,
  savedMessage,
  handleInputChange,
  updateSection,
  updateQuestion,
  handleImageUpload,
  handleRegenerateImage,
  regeneratingIds = {},
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

              {/* Image Editing UI */}
              <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-200">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                  Visual Content (Image / Diagram)
                </label>

                <div className="flex flex-col gap-3">
                  {/* 1. URL/Data Input Field */}
                  <input
                    type="text"
                    value={
                      question.imageUrl ||
                      (question.svgContent ? "<SVG Data Present>" : "")
                    }
                    onChange={(e) =>
                      updateQuestion(
                        sectionIndex,
                        questionIndex,
                        "imageUrl",
                        e.target.value
                      )
                    }
                    placeholder="Paste Image URL or Base64 string here..."
                    disabled={!!question.svgContent}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 outline-none"
                  />

                  {/* 2. Action Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* A. Manual Upload Button */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id={`upload-${sectionIndex}-${questionIndex}`}
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, sectionIndex, questionIndex)
                        }
                      />
                      <label
                        htmlFor={`upload-${sectionIndex}-${questionIndex}`}
                        className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-100 transition shadow-sm"
                      >
                        {/* Upload Icon */}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload Image
                      </label>
                    </div>

                    {/* B. AI Regenerate Button */}
                    <button
                      onClick={() =>
                        handleRegenerateImage(
                          sectionIndex,
                          questionIndex,
                          question.question
                        )
                      }
                      disabled={
                        regeneratingIds[`${sectionIndex}-${questionIndex}`]
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm text-white shadow-sm transition
            ${
              regeneratingIds[`${sectionIndex}-${questionIndex}`]
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
                    >
                      {regeneratingIds[`${sectionIndex}-${questionIndex}`] ? (
                        <>
                          {/* Spinner */}
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          {/* Magic Wand Icon */}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                          </svg>
                          Regenerate (AI)
                        </>
                      )}
                    </button>

                    {/* C. Remove Button */}
                    {(question.imageUrl || question.svgContent) && (
                      <button
                        onClick={() => {
                          updateQuestion(
                            sectionIndex,
                            questionIndex,
                            "imageUrl",
                            ""
                          );
                          updateQuestion(
                            sectionIndex,
                            questionIndex,
                            "svgContent",
                            ""
                          );
                        }}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm underline"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  {/* 3. Preview Area */}
                  <div className="mt-2 flex justify-center items-center min-h-[120px] bg-white border border-dashed border-gray-300 rounded overflow-hidden">
                    {question.imageUrl || question.svgContent ? (
                      <div className="max-w-full max-h-[300px]">
                        <VisualRenderer
                          imageUrl={question.imageUrl}
                          svgContent={question.svgContent}
                          altText="Question Visual"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">
                        No visual attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Options Section */}
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

              {/* --- CORRECT ANSWER FIELD --- */}
              <div className="mt-4 border-t pt-3 border-gray-200">
                <label className="block text-sm font-bold text-green-700 mb-1">
                  Correct Answer / Solution
                </label>
                <textarea
                  value={question.correct_answer || ""}
                  onChange={(e) =>
                    updateQuestion(
                      sectionIndex,
                      questionIndex,
                      "correct_answer",
                      e.target.value
                    )
                  }
                  placeholder="Enter the correct answer or key here..."
                  className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded-md shadow-sm h-16 text-sm"
                />
              </div>
              {/* --- END CORRECT ANSWER FIELD --- */}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// --- COMPONENT: DELETE MODAL ---
const DeleteConfirmationModal = ({
  handleCancelDelete,
  handleConfirmDelete,
  isDeleting,
}) => (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-2 border-red-100">
      <h3 className="text-lg font-bold text-red-600 mb-4">Delete Paper</h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete this question paper?
        <br />
        <span className="text-sm text-red-500 font-medium">
          This action cannot be undone.
        </span>
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleCancelDelete}
          disabled={isDeleting}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          {isDeleting ? <>Processing...</> : <>Yes, Delete</>}
        </button>
      </div>
    </div>
  </div>
);

// --- COMPONENT: SAVE MODAL ---
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

// --- MAIN PAGE COMPONENT ---
function ExamPaperGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paperIdFromUrl } = useParams();

  // Data Normalization Logic
  const normalizePaper = useCallback((incoming, fallback = {}) => {
    const topLevelData = incoming || {};
    let paperObjectData = incoming?.paper || {};

    const safeString = (v, fb = "") =>
      v !== null && v !== undefined ? String(v).trim() || fb : fb;
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
          const imgData = q?.image_data || {};
          const isSvg =
            imgData.type === "svg" || q?.visual_annotation?.type === "svg";

          let resolvedImageUrl = "";
          let resolvedSvgContent = "";

          if (isSvg && imgData.content) {
            resolvedSvgContent = imgData.content;
          } else if (imgData.type === "image" && imgData.content) {
            resolvedImageUrl = imgData.content;
          } else {
            resolvedImageUrl = q?.imageUrl || q?.image || q?.diagramUrl || "";
          }

          return {
            questionNo: safeString(q?.questionNo, `${qIdx + 1}`),
            question: safeString(q?.question),
            marks: safeNumber(q?.marks, 1),
            options: safeArray(q?.options).map(safeString).filter(Boolean),
            questionType: safeString(q?.questionType || q?.type, "text"),
            imageUrl: resolvedImageUrl,
            svgContent: resolvedSvgContent,
            correct_answer: safeString(q?.correct_answer, q?.answer),
            chapterNo: q?.chapterNo || q?.chapter || 0,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState({});

  const handleDeletePaper = async () => {
    if (!paperId) return;

    setIsDeleting(true);
    try {
      // 1. Call Backend API
      const response = await paperAPI.deletePaper(paperId);

      if (response && response.success) {
        setSavedMessage("Paper deleted successfully. Redirecting...");

        // 2. Cleanup local state/storage (good practice before navigating)
        const updatedPapersList = generatedPapers.filter(
          (p) => p._id !== paperId
        );
        sessionStorage.setItem(
          "generatedPapersArray",
          JSON.stringify(updatedPapersList)
        );
        setGeneratedPapers(updatedPapersList);

        // 3. Navigate to My Papers page
        // We use a short timeout so the user sees the success message first
        setTimeout(() => {
          navigate("/my-papers");
        }, 1000);
      } else {
        throw new Error(response?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setSavedMessage(`Error: ${err.message || "Failed to delete"}`);
      setTimeout(() => setSavedMessage(""), 4000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleImageUpload = (e, sectionIndex, questionIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Limit size to 2MB to prevent DB bloat
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please upload a file smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result is a full Data URI (e.g., "data:image/png;base64,iVBOR...")
      // This works perfectly in <img src="..." />
      updateQuestion(sectionIndex, questionIndex, "imageUrl", reader.result);
      // Clear SVG content to avoid conflicts
      updateQuestion(sectionIndex, questionIndex, "svgContent", "");
    };
    reader.readAsDataURL(file);
  };

  // 3. Add this Handler for AI Regeneration
  const handleRegenerateImage = async (
    sectionIndex,
    questionIndex,
    questionText
  ) => {
    const uniqueKey = `${sectionIndex}-${questionIndex}`;

    // Start loading spinner for this specific button
    setRegeneratingIds((prev) => ({ ...prev, [uniqueKey]: true }));

    try {
      const response = await paperAPI.regenerateQuestionImage(questionText);

      if (response.success && response.imageUrl) {
        // Backend can return a URL or Base64 string; both work here.
        updateQuestion(
          sectionIndex,
          questionIndex,
          "imageUrl",
          response.imageUrl
        );
        updateQuestion(sectionIndex, questionIndex, "svgContent", "");
      } else {
        alert("AI could not generate an image. Please try again.");
      }
    } catch (err) {
      console.error("Regeneration failed", err);
      alert("Error regenerating image: " + (err.message || "Unknown error"));
    } finally {
      // Stop loading spinner
      setRegeneratingIds((prev) => ({ ...prev, [uniqueKey]: false }));
    }
  };

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
          const response = await paperAPI.getPaperById(paperIdFromUrl);
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

      // 1. Prepare Content
      const paperContent = {
        ...paperData,
        totalMarks: calculateTotalMarks(),
      };

      // 2. Prepare Payload
      const payload = {
        paper: paperContent,
        title: paperData.testName,
      };

      let response;
      if (paperId) {
        response = await paperAPI.updatePaper(paperId, payload);
      } else {
        const payloadForCreation = {
          class: paperContent.className,
          subject: paperContent.subject,
          pdf_name: paperContent.testName,
          numberofPapers: 1,
          ...paperContent,
        };
        response = await paperAPI.createPaper(payloadForCreation);
      }

      const data = response;
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
          <script>
            window.MathJax = {
              tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] },
              startup: { typeset: false }
            };
          </script>
          <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        </head>
        <body>
          ${paperContent}
          <script>
            window.onload = function() {
              window.MathJax.typesetPromise().then(() => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 1000); 
              });
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

            {paperId && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 border border-gray-600"
              >
                Delete
              </button>
            )}
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

      {showDeleteModal && (
        <DeleteConfirmationModal
          handleCancelDelete={() => setShowDeleteModal(false)}
          handleConfirmDelete={handleDeletePaper}
          isDeleting={isDeleting}
        />
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
          handleImageUpload={handleImageUpload} // <--- PASS THIS
          handleRegenerateImage={handleRegenerateImage} // <--- PASS THIS
          regeneratingIds={regeneratingIds}
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

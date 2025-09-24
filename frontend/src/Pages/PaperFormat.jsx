import React, { useState, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

function ExamPaperGenerator() {
  const navigate = useNavigate();
  // Normalize/clean incoming paper JSON safely
  const normalizePaper = useCallback((incoming, fallback) => {
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

    // Prefer incoming values; if missing/empty, keep fallback defaults
    const incomingInstructions =
      Array.isArray(incoming?.instructions) && incoming.instructions.length > 0
        ? incoming.instructions
        : fallback.instructions;
    const incomingSections =
      Array.isArray(incoming?.sections) && incoming.sections.length > 0
        ? incoming.sections
        : fallback.sections;

    const normalized = {
      collegeName: safeString(incoming?.collegeName, fallback.collegeName),
      testName: safeString(incoming?.testName, fallback.testName),
      subject: safeString(incoming?.subject, fallback.subject),
      className: safeString(incoming?.className, fallback.className),
      maxMarks: safeNumber(incoming?.maxMarks, fallback.maxMarks),
      timeAllowed: safeString(incoming?.timeAllowed, fallback.timeAllowed),
      semester: safeString(incoming?.semester, fallback.semester),
      date: safeString(incoming?.date, fallback.date),
      instructions: safeArray(incomingInstructions)
        .map((i) => safeString(i))
        .filter((i) => i && i.length > 0),
      sections: safeArray(incomingSections).map((section, sIdx) => {
        const questions = safeArray(section?.questions).map((q, qIdx) => {
          const options = safeArray(q?.options)
            .map((opt) => safeString(opt))
            .filter((opt) => opt && opt.length > 0);
          return {
            questionNo: safeString(q?.questionNo, (qIdx + 1).toString()),
            question: safeString(q?.question),
            marks: safeNumber(q?.marks, 1),
            ...(options.length > 0 ? { options } : {}),
          };
        });
        return {
          sectionName: safeString(section?.sectionName, `Section ${sIdx + 1}`),
          sectionTitle: safeString(section?.sectionTitle),
          description: safeString(section?.description),
          questions,
        };
      }),
    };

    // If somehow instructions ended empty after filtering, keep fallback's instructions
    if (!normalized.instructions || normalized.instructions.length === 0) {
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
    semester: "Fourth Semester",
    date: new Date().toISOString().split("T")[0],
    instructions: [
      "All questions are compulsory",
      "Read the questions carefully before attempting",
      "Show all working clearly for numerical problems",
      "Use of calculator is allowed for Section C only",
      "Attempt all sections in sequence",
      "Write legibly and maintain proper spacing",
    ],
    sections: [
      {
        sectionName: "Section A",
        sectionTitle: "Multiple Choice Questions",
        description: "Choose the correct option for each question.",
        questions: [
          {
            questionNo: "1",
            question:
              "Which event is considered a major turning point in the French Revolution?",
            options: [
              "a) The Reign of Terror",
              "b) The Storming of the Bastille",
              "c) The execution of Louis XVI",
              "d) The rise of Napoleon",
            ],
            marks: 1,
          },
          {
            questionNo: "2",
            question: "Who was the key leader in the unification of Italy?",
            options: [
              "a) Otto von Bismarck",
              "b) Giuseppe Garibaldi",
              "c) Victor Emmanuel II",
              "d) Cavour",
            ],
            marks: 1,
          },
          {
            questionNo: "3",
            question:
              "What was the primary cause of Balkan nationalism and conflicts?",
            options: [
              "a) Religious differences",
              "b) Ethnic diversity",
              "c) Economic competition",
              "d) Territorial disputes",
            ],
            marks: 1,
          },
          {
            questionNo: "4",
            question:
              "Which of the following was NOT a consequence of the First World War?",
            options: [
              "a) Rise of communism",
              "b) Collapse of empires",
              "c) Treaty of Versailles",
              "d) Unification of Germany",
            ],
            marks: 1,
          },
        ],
      },
      {
        sectionName: "Section B",
        sectionTitle: "Short Answer Questions",
        description: "Answer the following questions in 3-4 lines.",
        questions: [
          {
            questionNo: "1",
            question:
              "Explain the impact of the French Revolution on the spread of nationalism in Europe.",
            marks: 2,
          },
          {
            questionNo: "2",
            question:
              "Describe the role of Otto von Bismarck in the unification of Germany.",
            marks: 2,
          },
          {
            questionNo: "3",
            question:
              "What were the main factors that contributed to the rise of nationalism in India?",
            marks: 2,
          },
          {
            questionNo: "4",
            question:
              "How did the First World War impact the Khilafat Movement in India?",
            marks: 2,
          },
          {
            questionNo: "5",
            question:
              "Briefly explain the objectives and strategies of the Non-Cooperation Movement.",
            marks: 2,
          },
        ],
      },
      {
        sectionName: "Section C",
        sectionTitle: "Long Answer Questions",
        description:
          "Answer any three of the following questions. Show all steps clearly.",
        questions: [
          {
            questionNo: "1",
            question:
              "Analyze the impact of the French Revolution on the development of nationalism in Europe. Discuss its influence on various European countries.",
            marks: 4,
          },
          {
            questionNo: "2",
            question:
              "Explain the process of unification of Germany under Otto von Bismarck. Discuss the role of diplomacy, war, and popular support in this process.",
            marks: 4,
          },
          {
            questionNo: "3",
            question:
              "Describe the various phases of the Indian nationalist movement from the early 20th century to the attainment of independence. Highlight the key events, leaders, and ideologies involved.",
            marks: 4,
          },
          {
            questionNo: "4",
            question:
              "Discuss the causes and consequences of the Balkan nationalism and conflicts in the late 19th and early 20th centuries. Explain how these conflicts contributed to the outbreak of the First World War.",
            marks: 4,
          },
        ],
      },
    ],
  });

  const [editMode, setEditMode] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Load generated paper JSON (if any) saved in sessionStorage and map it to the page state
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("generatedPaperData");
      if (!raw) return;
      const gen = JSON.parse(raw);

      // Normalize incoming API response structure to internal shape with safe fallbacks
      setPaperData((prev) => normalizePaper(gen, prev));
    } catch (err) {
      // keep existing default paperData if parsing/mapping fails
      console.error(
        "Failed to load generatedPaperData from sessionStorage:",
        err
      );
    }
  }, []);

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

  const calculateTotalMarks = () => {
    return (paperData.sections || []).reduce((total, section) => {
      const sectionSum = (section.questions || []).reduce(
        (sectionTotal, question) =>
          sectionTotal + (Number(question.marks) || 0),
        0
      );
      return total + sectionSum;
    }, 0);
  };

  const saveChanges = () => {
    setSavedMessage("Changes saved successfully!");
    setTimeout(() => {
      setSavedMessage("");
    }, 3000);
  };

  const handleSavePaper = useCallback(async () => {
    setIsSaving(true);
    try {
      // Prepare the paper data for saving
      const paperToSave = {
        ...paperData,
        totalMarks: calculateTotalMarks(),
        createdAt: new Date().toISOString(),
      };

      // Call backend API to save the paper
      const res = await fetch("http://localhost:8001/save_question_paper/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paperToSave),
      });

      const data = await res.json();

      if (!res.ok || !data || data.status !== "success") {
        throw new Error(data?.message || "Failed to save question paper");
      }

      setSavedMessage("Question paper saved successfully!");
      setShowSaveModal(false);

      // Clear session storage after successful save
      sessionStorage.removeItem("generatedPaperData");

      setTimeout(() => {
        setSavedMessage("");
        // Navigate back to question generation page
        navigate("/question-paper-generation");
      }, 2000);
    } catch (error) {
      console.error("Save error:", error);

      let errorMessage = "Failed to save question paper";

      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "Unable to connect to the server. Please check if the backend server is running on localhost:8000";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSavedMessage(`Error: ${errorMessage}`);
      setTimeout(() => {
        setSavedMessage("");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  }, [paperData, navigate]);

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
              <div class="college-name">${paperData.collegeName}</div>
              <div class="test-name">${paperData.testName}</div>
              <div class="subject-class">${paperData.subject} - ${
        paperData.className
      }</div>
              <div class="exam-details">
                <strong>Date:</strong> ${paperData.date} &nbsp;&nbsp;&nbsp;
                <strong>Semester:</strong> ${
                  paperData.semester
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
                              .map(
                                (option, idx) =>
                                  `<div>${String.fromCharCode(
                                    97 + idx
                                  )}) ${option}</div>`
                              )
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

  const PaperView = () => (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page 1 */}
        <div className="paper-content bg-white border-2 border-blue-400 rounded-xl shadow-lg px-8 py-6 mb-8 min-h-[11in]">
          {/* Header */}
          <div className="header text-center border-b-2 border-blue-300 pb-4 mb-6">
            <h1 className="college-name text-2xl font-bold text-blue-800 mb-2">
              {paperData.collegeName}
            </h1>
            <h2 className="test-name text-lg font-semibold text-gray-700 mb-2">
              {paperData.testName}
            </h2>
            <h3 className="subject-class text-md font-medium text-gray-600 mb-3">
              {paperData.subject} - {paperData.className}
            </h3>
            <div className="exam-details flex justify-between items-center text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
              <span>
                <strong>Date:</strong> {paperData.date}
              </span>
              <span>
                <strong>Semester:</strong> {paperData.semester}
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

                    {(section.questions || []).map(
                      (question, questionIndex) => (
                        <tr
                          key={`q-${sIdx}-${questionIndex}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="question-no border border-gray-400 text-center px-2 py-3 font-medium">
                            {question.questionNo}
                          </td>
                          <td className="question-cell border border-gray-400 px-3 py-3">
                            <div className="text-gray-800">
                              {question.question}
                            </div>
                            {Array.isArray(question.options) &&
                              question.options.length > 0 && (
                                <div className="options mt-2 text-sm text-gray-700">
                                  {question.options.map(
                                    (option, optionIndex) => (
                                      <div key={optionIndex} className="ml-4">
                                        {String.fromCharCode(97 + optionIndex)}){" "}
                                        {option}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </td>
                          <td className="marks-cell border border-gray-400 text-center px-2 py-3 font-medium">
                            {question.marks}
                          </td>
                        </tr>
                      )
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Page 1 Footer */}
          <div className="footer flex justify-between items-center mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500">
            <div>
              © {new Date().getFullYear()} {paperData.collegeName}
            </div>
            <div className="font-medium">Page 1 of 2</div>
          </div>
        </div>

        {/* Page 2 removed in favor of dynamic single-table rendering to handle variable sections safely */}
      </div>
    </div>
  );

  const EditView = () => (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Edit Paper Details
          </h2>
          <div className="flex items-center gap-4">
            {savedMessage && (
              <div className="text-green-600 font-medium">{savedMessage}</div>
            )}
            <button
              onClick={saveChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => console.log("Current paperData:", paperData)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Debug State
            </button>
          </div>
        </div>

        {/* Basic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College Name
            </label>
            <input
              type="text"
              value={paperData.collegeName}
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
              value={paperData.testName}
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
              value={paperData.subject}
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
              value={paperData.className}
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
              value={paperData.timeAllowed}
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
              value={paperData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <input
              type="text"
              value={paperData.semester}
              onChange={(e) => handleInputChange("semester", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions
          </label>
          <textarea
            value={paperData.instructions.join("\n")}
            onChange={(e) =>
              handleInputChange("instructions", e.target.value.split("\n"))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            placeholder="Enter instructions, one per line"
          />
        </div>

        {/* Sections */}
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
                value={section.sectionTitle}
                onChange={(e) =>
                  updateSection(sectionIndex, "sectionTitle", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Section Title"
              />
              <input
                type="text"
                value={section.description}
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
  const SaveConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Confirm Save
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to save this question paper? This action will
          save the paper to the database and you'll be redirected back to the
          generation page.
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

  return (
    <div>
      {/* Control Panel */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
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

      {/* Save Confirmation Modal */}
      {showSaveModal && <SaveConfirmationModal />}

      {/* Success/Error Message */}
      {savedMessage && (
        <div className="fixed top-20 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
          <div
            className={`font-medium ${
              savedMessage.includes("Error") ? "text-red-600" : "text-green-600"
            }`}
          >
            {savedMessage}
          </div>
        </div>
      )}

      {editMode ? <EditView /> : <PaperView />}
    </div>
  );
}

export default ExamPaperGenerator;

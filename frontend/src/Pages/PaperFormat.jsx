import React, { useState } from "react";

function ExamPaperGenerator() {
  const [paperData, setPaperData] = useState({
    collegeName: "St. Xavier's College of Engineering",
    testName: "End-Term Examination",
    subject: "Applied Mathematics",
    className: "Second Year B.Tech",
    maxMarks: 60,
    timeAllowed: "3 hours",
    semester: "Fourth Semester",
    date: "15th May 2025",
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
        description:
          "Choose the correct option for each question. Each question carries 2 marks.",
        questions: [
          {
            questionNo: "1",
            question: "The derivative of sin(x) with respect to x is:",
            options: ["a) cos(x)", "b) -cos(x)", "c) sin(x)", "d) -sin(x)"],
            marks: 2,
          },
          {
            questionNo: "2",
            question: "If f(x) = x³ + 2x² - 5x + 1, then f'(x) = ?",
            options: [
              "a) 3x² + 4x - 5",
              "b) x³ + 4x - 5",
              "c) 3x² + 2x - 5",
              "d) 3x² + 4x + 1",
            ],
            marks: 2,
          },
          {
            questionNo: "3",
            question: "The integral ∫2x dx is equal to:",
            options: ["a) x² + c", "b) 2x² + c", "c) x²/2 + c", "d) 2x + c"],
            marks: 2,
          },
          {
            questionNo: "4",
            question:
              "In matrix multiplication, if A is a 3×2 matrix and B is a 2×4 matrix, then AB is:",
            options: [
              "a) 3×4 matrix",
              "b) 2×2 matrix",
              "c) 3×2 matrix",
              "d) Not possible",
            ],
            marks: 2,
          },
          {
            questionNo: "5",
            question: "The value of lim(x→0) (sin x)/x is:",
            options: ["a) 0", "b) 1", "c) ∞", "d) -1"],
            marks: 2,
          },
        ],
      },
      {
        sectionName: "Section B",
        sectionTitle: "Short Answer Questions",
        description:
          "Answer the following questions in 3-4 lines. Each question carries 4 marks.",
        questions: [
          {
            questionNo: "6",
            question:
              "Find the equation of tangent to the curve y = x² + 3x - 2 at the point where x = 1.",
            marks: 4,
          },
          {
            questionNo: "7",
            question: "Evaluate the definite integral ∫₀² (2x + 1) dx.",
            marks: 4,
          },
          {
            questionNo: "8",
            question: "Find the inverse of the matrix A = [[2, 1], [3, 2]].",
            marks: 4,
          },
          {
            questionNo: "9",
            question:
              "Determine whether the function f(x) = |x - 2| is differentiable at x = 2. Justify your answer.",
            marks: 4,
          },
          {
            questionNo: "10",
            question:
              "Find the critical points of the function f(x) = x³ - 6x² + 9x + 1.",
            marks: 4,
          },
        ],
      },
      {
        sectionName: "Section C",
        sectionTitle: "Long Answer Questions",
        description:
          "Answer any three of the following questions. Show all steps clearly. Each question carries 10 marks.",
        questions: [
          {
            questionNo: "11",
            question:
              "A rectangular box with an open top is to be constructed from a square piece of cardboard, 12 inches on a side, by cutting out equal squares from each corner and turning up the sides. Find the dimensions of the box of maximum volume and calculate this maximum volume.",
            marks: 10,
          },
          {
            questionNo: "12",
            question:
              "Using integration by parts, evaluate ∫x·e^x dx. Also find the area bounded by the curve y = x·e^x, the x-axis, and the vertical lines x = 0 and x = 1.",
            marks: 10,
          },
          {
            questionNo: "13",
            question:
              "Given the system of linear equations: 2x + y - z = 3, x - y + 2z = 1, 3x + 2y + z = 8. Solve using matrix method and verify your solution.",
            marks: 10,
          },
          {
            questionNo: "14",
            question:
              "A company's profit P(x) in thousands of dollars from selling x units of a product is given by P(x) = -2x² + 40x - 100. Find: (a) The number of units that maximize profit, (b) The maximum profit, (c) The break-even points.",
            marks: 10,
          },
          {
            questionNo: "15",
            question:
              "Prove that the series ∑(n=1 to ∞) 1/n² converges using the integral test. Also find the sum of the first 5 terms and estimate the error in this approximation.",
            marks: 10,
          },
        ],
      },
    ],
  });

  const [editMode, setEditMode] = useState(false);

  const handleInputChange = (field, value) => {
    setPaperData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSection = (sectionIndex, field, value) => {
    setPaperData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, [field]: value } : section
      ),
    }));
  };

  const updateQuestion = (sectionIndex, questionIndex, field, value) => {
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
  };

  const calculateTotalMarks = () => {
    return paperData.sections.reduce((total, section) => {
      return (
        total +
        section.questions.reduce((sectionTotal, question) => {
          return sectionTotal + question.marks;
        }, 0)
      );
    }, 0);
  };

  const generateDocxContent = () => {
    let docxContent = `${paperData.collegeName}\n\n`;
    docxContent += `${paperData.testName}\n`;
    docxContent += `${paperData.subject} - ${paperData.className}\n\n`;
    docxContent += `Date: ${paperData.date}    Semester: ${
      paperData.semester
    }    Max. Marks: ${calculateTotalMarks()}    Time: ${
      paperData.timeAllowed
    }\n\n`;

    docxContent += "General Instructions:\n";
    paperData.instructions.forEach((instruction, index) => {
      docxContent += `${index + 1}. ${instruction}\n`;
    });
    docxContent += "\n";

    paperData.sections.forEach((section) => {
      docxContent += `${section.sectionName}: ${section.sectionTitle}\n`;
      docxContent += `${section.description}\n\n`;

      section.questions.forEach((question) => {
        docxContent += `Q.${question.questionNo} ${question.question} (${question.marks} marks)\n`;
        if (question.options) {
          question.options.forEach((option) => {
            docxContent += `${option}\n`;
          });
        }
        docxContent += "\n";
      });
      docxContent += "\n";
    });

    return docxContent;
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
    const content = generateDocxContent();
    const blob = new Blob([content], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${paperData.subject}_${paperData.testName.replace(
      /\s+/g,
      "_"
    )}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              {paperData.instructions.map((instruction, index) => (
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
                {/* Section A - Page 1 */}
                <tr>
                  <td
                    colSpan="3"
                    className="section-header border border-gray-400 bg-blue-100 px-3 py-2"
                  >
                    <div className="font-bold text-blue-800">
                      {paperData.sections[0].sectionName}:{" "}
                      {paperData.sections[0].sectionTitle}
                    </div>
                    <div className="text-sm text-gray-600 italic">
                      {paperData.sections[0].description}
                    </div>
                  </td>
                </tr>

                {paperData.sections[0].questions.map(
                  (question, questionIndex) => (
                    <tr key={questionIndex} className="hover:bg-gray-50">
                      <td className="question-no border border-gray-400 text-center px-2 py-3 font-medium">
                        {question.questionNo}
                      </td>
                      <td className="question-cell border border-gray-400 px-3 py-3">
                        <div className="text-gray-800">{question.question}</div>
                        {question.options && (
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
                  )
                )}

                {/* Section B - Page 1 */}
                <tr>
                  <td
                    colSpan="3"
                    className="section-header border border-gray-400 bg-blue-100 px-3 py-2"
                  >
                    <div className="font-bold text-blue-800">
                      {paperData.sections[1].sectionName}:{" "}
                      {paperData.sections[1].sectionTitle}
                    </div>
                    <div className="text-sm text-gray-600 italic">
                      {paperData.sections[1].description}
                    </div>
                  </td>
                </tr>

                {paperData.sections[1].questions
                  .slice(0, 3)
                  .map((question, questionIndex) => (
                    <tr key={questionIndex} className="hover:bg-gray-50">
                      <td className="question-no border border-gray-400 text-center px-2 py-3 font-medium">
                        {question.questionNo}
                      </td>
                      <td className="question-cell border border-gray-400 px-3 py-3">
                        <div className="text-gray-800">{question.question}</div>
                      </td>
                      <td className="marks-cell border border-gray-400 text-center px-2 py-3 font-medium">
                        {question.marks}
                      </td>
                    </tr>
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

        {/* Page 2 */}
        <div className="bg-white border-2 border-blue-400 rounded-xl shadow-lg px-8 py-6 min-h-[11in]">
          {/* Page 2 Header */}
          <div className="text-center border-b-2 border-blue-300 pb-3 mb-6">
            <h2 className="text-lg font-semibold text-blue-800">
              {paperData.testName} - {paperData.subject}
            </h2>
            <div className="text-sm text-gray-600">Continued...</div>
          </div>

          {/* Continue Questions Table */}
          <div className="border border-gray-400 rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {/* Section B continued */}
                {paperData.sections[1].questions
                  .slice(3)
                  .map((question, questionIndex) => (
                    <tr key={questionIndex + 3} className="hover:bg-gray-50">
                      <td className="question-no border border-gray-400 text-center px-2 py-3 font-medium w-16">
                        {question.questionNo}
                      </td>
                      <td className="question-cell border border-gray-400 px-3 py-3">
                        <div className="text-gray-800">{question.question}</div>
                      </td>
                      <td className="marks-cell border border-gray-400 text-center px-2 py-3 font-medium w-16">
                        {question.marks}
                      </td>
                    </tr>
                  ))}

                {/* Section C */}
                <tr>
                  <td
                    colSpan="3"
                    className="section-header border border-gray-400 bg-blue-100 px-3 py-2"
                  >
                    <div className="font-bold text-blue-800">
                      {paperData.sections[2].sectionName}:{" "}
                      {paperData.sections[2].sectionTitle}
                    </div>
                    <div className="text-sm text-gray-600 italic">
                      {paperData.sections[2].description}
                    </div>
                  </td>
                </tr>

                {paperData.sections[2].questions.map(
                  (question, questionIndex) => (
                    <tr key={questionIndex} className="hover:bg-gray-50">
                      <td className="question-no border border-gray-400 text-center px-2 py-3 font-medium">
                        {question.questionNo}
                      </td>
                      <td className="question-cell border border-gray-400 px-3 py-3">
                        <div className="text-gray-800">{question.question}</div>
                      </td>
                      <td className="marks-cell border border-gray-400 text-center px-2 py-3 font-medium">
                        {question.marks}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Page 2 Footer */}
          <div className="footer flex justify-between items-center mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500">
            <div>
              © {new Date().getFullYear()} {paperData.collegeName}
            </div>
            <div className="font-medium">
              Total Marks: {calculateTotalMarks()}
            </div>
            <div className="font-medium">Page 2 of 2</div>
          </div>
        </div>
      </div>
    </div>
  );

  const EditView = () => (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Edit Paper Details
        </h2>

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
        {paperData.sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
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

            {section.questions.map((question, questionIndex) => (
              <div
                key={questionIndex}
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
              Download DOCX
            </button>
          </>
        )}
      </div>

      {editMode ? <EditView /> : <PaperView />}
    </div>
  );
}

export default ExamPaperGenerator;

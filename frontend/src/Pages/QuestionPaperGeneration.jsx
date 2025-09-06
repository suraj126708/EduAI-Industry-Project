import React, { useState } from "react";
import { Plus, X, FileText, ChevronDown } from "lucide-react";

const questionTypes = [
  { value: "single_correct", label: "Single MCQ", icon: "○" },
  { value: "multiple_correct", label: "Multiple MCQ", icon: "☑" },
  { value: "true_false", label: "True/False", icon: "✓" },
  { value: "short_answer", label: "Short Answer", icon: "✎" },
  { value: "long_answer", label: "Essay", icon: "📝" },
];

// Available topics/units for selection
const availableTopics = {
  mathematics: [
    "Algebra",
    "Geometry",
    "Trigonometry",
    "Calculus",
    "Statistics",
    "Probability",
    "Number Theory",
    "Linear Equations",
    "Quadratic Equations",
  ],
  science: [
    "Physics - Mechanics",
    "Physics - Thermodynamics",
    "Physics - Optics",
    "Chemistry - Organic",
    "Chemistry - Inorganic",
    "Chemistry - Physical",
    "Biology - Human Body",
    "Biology - Plant Life",
    "Biology - Genetics",
  ],
  english: [
    "Grammar",
    "Literature",
    "Comprehension",
    "Essay Writing",
    "Vocabulary",
    "Poetry",
    "Drama",
    "Prose",
  ],
  history: [
    "Ancient History",
    "Medieval History",
    "Modern History",
    "World War I",
    "World War II",
    "Independence Movement",
  ],
  geography: [
    "Physical Geography",
    "Human Geography",
    "Climate",
    "Natural Resources",
    "Population",
    "Agriculture",
  ],
  general: [
    "Current Affairs",
    "General Knowledge",
    "Sports",
    "Technology",
    "Economy",
    "Politics",
    "Environment",
    "Culture",
  ],
};

// Pre-filled common question types
const initialQuestions = [
  {
    type: "single_correct",
    units: ["General Knowledge", "Current Affairs"],
    numQuestions: 10,
    marksPerQuestion: 1,
  },
  {
    type: "short_answer",
    units: ["Grammar", "Literature"],
    numQuestions: 5,
    marksPerQuestion: 2,
  },
  {
    type: "long_answer",
    units: ["Essay Writing"],
    numQuestions: 3,
    marksPerQuestion: 5,
  },
];

export default function QuestionPaperForm() {
  const [questions, setQuestions] = useState(initialQuestions);
  const [result, setResult] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const updateQuestion = (index, key, value) => {
    const newQuestions = [...questions];
    newQuestions[index][key] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { type: "", units: [], numQuestions: 1, marksPerQuestion: 1 },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const toggleTopic = (questionIndex, topic) => {
    const currentUnits = questions[questionIndex].units || [];
    const newUnits = currentUnits.includes(topic)
      ? currentUnits.filter((u) => u !== topic)
      : [...currentUnits, topic];
    updateQuestion(questionIndex, "units", newUnits);
  };

  const toggleDropdown = (questionIndex) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const getAllTopics = () => {
    return Object.values(availableTopics).flat();
  };

  const handleGenerate = () => {
    const isValid = questions.every(
      (q) =>
        q.type &&
        q.units.length > 0 &&
        q.numQuestions > 0 &&
        q.marksPerQuestion > 0
    );
    if (!isValid) {
      alert(
        "Please fill all fields and select at least one topic for each row"
      );
      return;
    }
    setResult(questions);
  };

  const totalQuestions = questions.reduce((sum, q) => sum + q.numQuestions, 0);
  const totalMarks = questions.reduce(
    (sum, q) => sum + q.numQuestions * q.marksPerQuestion,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <FileText className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Question Paper Builder
          </h1>
          <p className="text-gray-600">
            Edit the table below to customize your question paper
          </p>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="grid grid-cols-12 gap-4 font-medium text-gray-700 text-sm">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Question Type</div>
              <div className="col-span-4">Topics/Units</div>
              <div className="col-span-2 text-center">Questions</div>
              <div className="col-span-1 text-center">Marks</div>
              <div className="col-span-1 text-center">Total</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Row Number */}
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Question Type */}
                  <div className="col-span-3">
                    <select
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(idx, "type", e.target.value)
                      }
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select type...</option>
                      {questionTypes.map(({ value, label, icon }) => (
                        <option value={value} key={value}>
                          {icon} {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topics Selector */}
                  <div className="col-span-4 relative">
                    <div
                      onClick={() => toggleDropdown(idx)}
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer bg-white flex items-center justify-between min-h-[36px]"
                    >
                      <div className="flex-1">
                        {q.units && q.units.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {q.units.slice(0, 2).map((unit, unitIdx) => (
                              <span
                                key={unitIdx}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {unit}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTopic(idx, unit);
                                  }}
                                  className="ml-1 hover:bg-blue-200 rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                            {q.units.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{q.units.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            Select topics...
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          openDropdowns[idx] ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    {openDropdowns[idx] && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {Object.entries(availableTopics).map(
                          ([category, topics]) => (
                            <div key={category} className="p-2">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                                {category}
                              </div>
                              {topics.map((topic) => (
                                <label
                                  key={topic}
                                  className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={q.units && q.units.includes(topic)}
                                    onChange={() => toggleTopic(idx, topic)}
                                    className="mr-2 text-blue-600 focus:ring-blue-500 rounded"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {topic}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Number of Questions */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={q.numQuestions}
                      onChange={(e) =>
                        updateQuestion(idx, "numQuestions", +e.target.value)
                      }
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center"
                    />
                  </div>

                  {/* Marks per Question */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      value={q.marksPerQuestion}
                      onChange={(e) =>
                        updateQuestion(idx, "marksPerQuestion", +e.target.value)
                      }
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center"
                    />
                  </div>

                  {/* Total Marks */}
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      {q.numQuestions * q.marksPerQuestion}
                    </span>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(idx)}
                        className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Remove row"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-7"></div>
              <div className="col-span-2 text-center">
                <span className="font-semibold text-blue-600 text-sm">
                  {totalQuestions}
                </span>
              </div>
              <div className="col-span-1"></div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                  {totalMarks}
                </span>
              </div>
              <div className="col-span-1"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>

          <button
            onClick={handleGenerate}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm"
          >
            Generate Paper
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Paper Generated Successfully!
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">
                  Question Breakdown:
                </h4>
                <div className="space-y-2">
                  {result.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {questionTypes.find((t) => t.value === item.type)?.icon}{" "}
                        {
                          questionTypes.find((t) => t.value === item.type)
                            ?.label
                        }
                        <span className="text-xs text-gray-500 ml-2">
                          ({item.units.join(", ")})
                        </span>
                      </span>
                      <span className="font-medium">
                        {item.numQuestions} × {item.marksPerQuestion} ={" "}
                        {item.numQuestions * item.marksPerQuestion} marks
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Paper Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total Questions:</span>
                    <span className="font-semibold text-blue-900">
                      {totalQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total Marks:</span>
                    <span className="font-semibold text-blue-900">
                      {totalMarks}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Question Types:</span>
                    <span className="font-semibold text-blue-900">
                      {result.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

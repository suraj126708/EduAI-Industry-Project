import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Search,
  ChevronDown,
  FileText,
  Download,
  Edit,
} from "lucide-react";

// Simplified question types
const questionTypes = [
  { value: "single_correct", label: "Single Choice MCQ" },
  { value: "multiple_correct", label: "Multiple Choice MCQ" },
  { value: "true_false", label: "True/False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Essay/Long Answer" },
  { value: "fill_blanks", label: "Fill in the Blanks" },
  { value: "match_following", label: "Match the Following" },
];

const classOptions = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Undergraduate",
  "Postgraduate",
];

const subjectOptions = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Economics",
  "Political Science",
  "Computer Science",
  "Accountancy",
  "Business Studies",
];

const availableTopics = {
  mathematics: {
    "Number Systems": [
      "Real Numbers",
      "Rational Numbers",
      "Irrational Numbers",
      "Operations on Real Numbers",
    ],
    Algebra: [
      "Polynomials",
      "Linear Equations",
      "Quadratic Equations",
      "Factorization",
    ],
    Geometry: ["Triangles", "Circles", "Coordinate Geometry", "Constructions"],
    Trigonometry: [
      "Introduction to Trigonometry",
      "Trigonometric Identities",
      "Heights and Distances",
    ],
  },
  physics: {
    Mechanics: [
      "Motion in a Straight Line",
      "Laws of Motion",
      "Work, Energy and Power",
      "System of Particles",
    ],
    Thermodynamics: [
      "Thermal Properties of Matter",
      "Kinetic Theory",
      "Thermodynamic Laws",
    ],
    "Waves & Optics": [
      "Wave Motion",
      "Sound Waves",
      "Ray Optics",
      "Wave Optics",
    ],
  },
  chemistry: {
    "Basic Concepts": [
      "Some Basic Concepts",
      "Structure of Atom",
      "Classification of Elements",
    ],
    "Chemical Bonding": [
      "Chemical Bonding",
      "States of Matter",
      "Thermodynamics",
    ],
    "Organic Chemistry": [
      "Hydrocarbons",
      "Organic Chemistry Basics",
      "Environmental Chemistry",
    ],
  },
};

const initialQuestions = [
  {
    type: "",
    units: [],
    topics: [],
    numQuestions: 10,
    marksPerQuestion: 1,
  },
];

export default function MinimalQuestionPaperForm() {
  const [paperName, setPaperName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState(initialQuestions);
  const [result, setResult] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [questionTypeInputs, setQuestionTypeInputs] = useState({});
  const [questionTypeSuggestions, setQuestionTypeSuggestions] = useState({});
  const dropdownRefs = useRef({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(openDropdowns).forEach((key) => {
        if (openDropdowns[key] && dropdownRefs.current[key]) {
          if (!dropdownRefs.current[key].contains(event.target)) {
            setOpenDropdowns((prev) => ({ ...prev, [key]: false }));
          }
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdowns]);

  const updateQuestion = (index, key, value) => {
    const newQuestions = [...questions];
    newQuestions[index][key] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { type: "", units: [], topics: [], numQuestions: 1, marksPerQuestion: 1 },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionTypeInput = (questionIndex, value) => {
    setQuestionTypeInputs((prev) => ({ ...prev, [questionIndex]: value }));

    // Clear the selected type if input is empty
    if (value.length === 0) {
      updateQuestion(questionIndex, "type", "");
      setQuestionTypeSuggestions((prev) => ({ ...prev, [questionIndex]: [] }));
    } else {
      const suggestions = questionTypes.filter(
        (type) =>
          type.label.toLowerCase().includes(value.toLowerCase()) ||
          type.value.toLowerCase().includes(value.toLowerCase())
      );
      setQuestionTypeSuggestions((prev) => ({
        ...prev,
        [questionIndex]: suggestions,
      }));
    }
  };

  const selectQuestionType = (questionIndex, type) => {
    updateQuestion(questionIndex, "type", type.value);
    setQuestionTypeInputs((prev) => ({ ...prev, [questionIndex]: type.label }));
    setQuestionTypeSuggestions((prev) => ({ ...prev, [questionIndex]: [] }));
  };

  const toggleUnit = (questionIndex, unit) => {
    const currentUnits = questions[questionIndex].units || [];
    const currentTopics = questions[questionIndex].topics || [];
    const unitTopics = getSubjectTopics()[unit] || [];

    if (currentUnits.includes(unit)) {
      // Deselect unit and remove all its topics
      const newUnits = currentUnits.filter((u) => u !== unit);
      const newTopics = currentTopics.filter((t) => !unitTopics.includes(t));
      updateQuestion(questionIndex, "units", newUnits);
      updateQuestion(questionIndex, "topics", newTopics);
    } else {
      // Select unit and add all its topics
      const newUnits = [...currentUnits, unit];
      const newTopics = [...new Set([...currentTopics, ...unitTopics])]; // Remove duplicates
      updateQuestion(questionIndex, "units", newUnits);
      updateQuestion(questionIndex, "topics", newTopics);
    }
  };

  const toggleTopic = (questionIndex, topic, unit) => {
    const currentTopics = questions[questionIndex].topics || [];
    const currentUnits = questions[questionIndex].units || [];
    const unitTopics = getSubjectTopics()[unit] || [];

    if (currentTopics.includes(topic)) {
      // Deselect topic
      const newTopics = currentTopics.filter((t) => t !== topic);
      updateQuestion(questionIndex, "topics", newTopics);

      // If no topics from this unit remain, deselect the unit
      const hasTopicsFromUnit = newTopics.some((t) => unitTopics.includes(t));
      if (!hasTopicsFromUnit && currentUnits.includes(unit)) {
        updateQuestion(
          questionIndex,
          "units",
          currentUnits.filter((u) => u !== unit)
        );
      }
    } else {
      // Select topic
      const newTopics = [...currentTopics, topic];
      updateQuestion(questionIndex, "topics", newTopics);

      // If all topics from this unit are now selected, select the unit
      const allUnitTopicsSelected = unitTopics.every((t) =>
        newTopics.includes(t)
      );
      if (allUnitTopicsSelected && !currentUnits.includes(unit)) {
        updateQuestion(questionIndex, "units", [...currentUnits, unit]);
      }
    }
  };

  const toggleDropdown = (questionIndex) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const getSubjectTopics = () => {
    const subjectKey = selectedSubject.toLowerCase().replace(/\s+/g, "");
    return availableTopics[subjectKey] || {};
  };

  const handleGenerate = () => {
    if (!paperName.trim() || !selectedClass || !selectedSubject) {
      alert("Please fill in all paper details");
      return;
    }

    const isValid = questions.every(
      (q) =>
        q.type &&
        (q.units.length > 0 || q.topics.length > 0) &&
        q.numQuestions > 0 &&
        q.marksPerQuestion > 0
    );

    if (!isValid) {
      alert("Please complete all question configurations");
      return;
    }

    setResult({
      paperName,
      class: selectedClass,
      subject: selectedSubject,
      questions,
    });
  };

  const totalQuestions = questions.reduce((sum, q) => sum + q.numQuestions, 0);
  const totalMarks = questions.reduce(
    (sum, q) => sum + q.numQuestions * q.marksPerQuestion,
    0
  );

  const getSelectedQuestionType = (questionIndex) => {
    const question = questions[questionIndex];
    return questionTypes.find((type) => type.value === question.type);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Question Paper Builder
          </h1>
          <p className="text-gray-600 text-lg">
            Create customized question papers with AI-powered generation
          </p>
        </div>

        {/* Paper Details - Rich Design */}
        <div className="mb-8">
          <div className=" p-6">
            <div className="flex flex-wrap items-center gap-6 justify-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={paperName}
                    onChange={(e) => setPaperName(e.target.value)}
                    placeholder="Enter paper name"
                    className="px-4 py-3 border-b-2 border-gray-200   focus:outline-none bg-gray-50  text-gray-900 placeholder-gray-400 min-w-[200px] transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-4 py-3 border-b-2 border-gray-200   focus:outline-none bg-gray-50  text-gray-900 min-w-[140px] appearance-none cursor-pointer transition-all duration-200"
                  >
                    <option value="">Select class</option>
                    {classOptions.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-3 border-b-2 border-gray-200   focus:outline-none bg-gray-50  text-gray-900 min-w-[170px] appearance-none cursor-pointer transition-all duration-200"
                  >
                    <option value="">Select subject</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-visible mb-8">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-800">
              <div className="col-span-1 flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">#</span>
                </div>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Question Type
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-green-500" />
                Topics
              </div>
              <div className="col-span-2 text-center">Questions</div>
              <div className="col-span-1 text-center">Marks</div>
              <div className="col-span-1 text-center">Total</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 overflow-visible">
            {questions.map((q, idx) => {
              const selectedType = getSelectedQuestionType(idx);
              return (
                <div
                  key={idx}
                  className="px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Row Number */}
                    <div className="col-span-1">
                      <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold rounded-full shadow-md">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Question Type */}
                    <div className="col-span-3 relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input
                          type="text"
                          value={
                            questionTypeInputs[idx] ||
                            (selectedType ? selectedType.label : "")
                          }
                          onChange={(e) =>
                            handleQuestionTypeInput(idx, e.target.value)
                          }
                          placeholder="Type 'mc' for MCQ..."
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-all duration-200"
                        />
                      </div>

                      {/* Suggestions */}
                      {questionTypeSuggestions[idx] &&
                        questionTypeSuggestions[idx].length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {questionTypeSuggestions[idx].map((type) => (
                              <button
                                key={type.value}
                                onClick={() => selectQuestionType(idx, type)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                              >
                                {type.label}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Topics Selector */}
                    <div
                      className="col-span-4 relative"
                      ref={(el) => (dropdownRefs.current[idx] = el)}
                    >
                      <div
                        onClick={() => toggleDropdown(idx)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg cursor-pointer flex items-center justify-between min-h-[48px] hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 bg-gray-50"
                      >
                        <div className="flex-1">
                          {(q.units && q.units.length > 0) ||
                          (q.topics && q.topics.length > 0) ? (
                            <div className="flex flex-wrap gap-1">
                              {q.units &&
                                q.units.slice(0, 2).map((unit, unitIdx) => (
                                  <span
                                    key={`unit-${unitIdx}`}
                                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md font-medium"
                                  >
                                    {unit}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleUnit(idx, unit);
                                      }}
                                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}

                              {q.topics &&
                                q.topics
                                  .slice(
                                    0,
                                    Math.max(0, 3 - (q.units?.length || 0))
                                  )
                                  .map((topic, topicIdx) => (
                                    <span
                                      key={`topic-${topicIdx}`}
                                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md font-medium"
                                    >
                                      {topic}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const unit = Object.keys(
                                            getSubjectTopics()
                                          ).find((u) =>
                                            getSubjectTopics()[u].includes(
                                              topic
                                            )
                                          );
                                          if (unit)
                                            toggleTopic(idx, topic, unit);
                                        }}
                                        className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}

                              {(q.units?.length || 0) +
                                (q.topics?.length || 0) >
                                3 && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                  +
                                  {(q.units?.length || 0) +
                                    (q.topics?.length || 0) -
                                    3}{" "}
                                  more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              Click to select topics
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
                        <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                          {Object.keys(getSubjectTopics()).length > 0 ? (
                            Object.entries(getSubjectTopics()).map(
                              ([unit, topics]) => (
                                <div
                                  key={unit}
                                  className="p-4 border-b border-gray-100 last:border-b-0"
                                >
                                  {/* Unit Header */}
                                  <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md">
                                    <input
                                      type="checkbox"
                                      checked={
                                        q.units && q.units.includes(unit)
                                      }
                                      onChange={() => toggleUnit(idx, unit)}
                                      className="mr-3 text-blue-600 focus:ring-blue-500 rounded"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900 text-sm">
                                        {unit}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {topics.length} topics
                                      </div>
                                    </div>
                                  </label>

                                  {/* Topics */}
                                  <div className="ml-8 mt-2 space-y-1">
                                    {topics.map((topic) => (
                                      <label
                                        key={topic}
                                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            q.topics && q.topics.includes(topic)
                                          }
                                          onChange={() =>
                                            toggleTopic(idx, topic, unit)
                                          }
                                          className="mr-3 text-green-600 focus:ring-green-500 rounded"
                                        />
                                        <span className="text-sm text-gray-700">
                                          {topic}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              Please select a subject first
                            </div>
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center"
                      />
                    </div>

                    {/* Marks per Question */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        min="1"
                        value={q.marksPerQuestion}
                        onChange={(e) =>
                          updateQuestion(
                            idx,
                            "marksPerQuestion",
                            +e.target.value
                          )
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center"
                      />
                    </div>

                    {/* Total Marks */}
                    <div className="col-span-1 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-md">
                          {q.numQuestions * q.marksPerQuestion}
                        </span>
                        {questions.length > 1 && (
                          <button
                            onClick={() => removeQuestion(idx)}
                            className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-7 text-gray-700 font-medium">
                Total Summary
              </div>
              <div className="col-span-4 text-center">
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">
                  {totalQuestions} Questions
                </span>
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center px-3 py-1 bg-gray-900 text-white text-sm font-medium rounded-md">
                  {totalMarks} Marks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>

          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FileText className="w-4 h-4" />
            Generate Paper
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900 mb-1">
                    Paper Generated Successfully! 🎉
                  </h3>
                  <p className="text-green-700">
                    Your question paper is ready for review and download
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Paper Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Paper Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Paper Name:</span>
                      <span className="font-medium">{result.paperName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Class:</span>
                      <span className="font-medium">{result.class}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Subject:</span>
                      <span className="font-medium">{result.subject}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Questions:</span>
                      <span className="font-medium">{totalQuestions}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Total Marks:</span>
                      <span className="font-medium">{totalMarks}</span>
                    </div>
                  </div>
                </div>

                {/* Question Breakdown */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Question Breakdown
                  </h4>
                  <div className="space-y-3">
                    {result.questions.map((item, idx) => {
                      const questionType = questionTypes.find(
                        (t) => t.value === item.type
                      );
                      return (
                        <div key={idx} className="p-4 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {questionType?.label || "Unknown Type"}
                            </span>
                            <span className="text-sm text-gray-600">
                              {item.numQuestions} × {item.marksPerQuestion} ={" "}
                              {item.numQuestions * item.marksPerQuestion} marks
                            </span>
                          </div>

                          {/* Display selected topics */}
                          <div className="space-y-1">
                            {item.units && item.units.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-gray-500">
                                  Units:
                                </span>
                                {item.units.map((unit, unitIdx) => (
                                  <span
                                    key={unitIdx}
                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                  >
                                    {unit}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.topics && item.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-gray-500">
                                  Topics:
                                </span>
                                {item.topics.map((topic, topicIdx) => (
                                  <span
                                    key={topicIdx}
                                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4 justify-center">
                <button className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md">
                  <Edit className="w-4 h-4" />
                  Edit Paper
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FileText className="w-4 h-4" />
                  Generate Questions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

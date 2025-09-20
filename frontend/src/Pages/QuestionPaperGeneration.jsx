import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, AlertCircle } from "lucide-react";
import questionTypes from "../assets/QuestionType.json";

// Import reusable components
import {
  Button,
  ErrorMessage,
  PaperDetailsForm,
  QuestionsTable,
  DurationPickerModal,
  SuccessModal,
} from "../components";

const classOptions = ["Class 5"];
const subjectOptions = ["Science"];
const examTypeOptions = ["Unit Test", "Midterm", "Final"];

// Main topics (chapters) for the top dropdown
const mainTopics = [
  "Living Things",
  "Materials and Substances",
  "Natural Phenomena",
];

// Full topic structure with subtopics for question rows
const availableTopics = {
  science: {
    "Living Things": [
      "Plants and Animals",
      "Human Body",
      "Food and Nutrition",
      "Health and Hygiene",
    ],
    "Materials and Substances": [
      "States of Matter",
      "Materials Around Us",
      "Changes Around Us",
      "Separation of Substances",
    ],
    "Natural Phenomena": [
      "Weather and Climate",
      "Light and Sound",
      "Force and Motion",
      "Electricity and Magnets",
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
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedMainTopics, setSelectedMainTopics] = useState([]);
  const [numberOfPapers, setNumberOfPapers] = useState(1);
  const [questions, setQuestions] = useState(initialQuestions);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [questionTypeInputs, setQuestionTypeInputs] = useState({});
  const [questionTypeSuggestions, setQuestionTypeSuggestions] = useState({});
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(1);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPaperData, setGeneratedPaperData] = useState(null);
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

  // Clear errors when form values change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  }, [
    selectedClass,
    selectedSubject,
    selectedExamType,
    selectedMainTopics,
    numberOfPapers,
    questions,
  ]);

  const updateQuestion = useCallback((index, key, value) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], [key]: value };
      return newQuestions;
    });
  }, []);

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [
      ...prev,
      { type: "", units: [], topics: [], numQuestions: 1, marksPerQuestion: 1 },
    ]);
  }, []);

  const removeQuestion = useCallback(
    (index) => {
      if (questions.length > 1) {
        setQuestions((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [questions.length]
  );

  const handleQuestionTypeInput = useCallback(
    (questionIndex, value) => {
      setQuestionTypeInputs((prev) => ({ ...prev, [questionIndex]: value }));

      // Clear the selected type if input is empty
      if (value.length === 0) {
        updateQuestion(questionIndex, "type", "");
        setQuestionTypeSuggestions((prev) => ({
          ...prev,
          [questionIndex]: [],
        }));
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
    },
    [updateQuestion]
  );

  const selectQuestionType = useCallback(
    (questionIndex, type) => {
      updateQuestion(questionIndex, "type", type.value);
      setQuestionTypeInputs((prev) => ({
        ...prev,
        [questionIndex]: type.label,
      }));
      setQuestionTypeSuggestions((prev) => ({ ...prev, [questionIndex]: [] }));
    },
    [updateQuestion]
  );

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

  const getSubjectTopics = useCallback(() => {
    // Since we only have Science for Class 5, directly use the science topics
    const allTopics = availableTopics.science || {};

    // If no main topics are selected, return all topics
    if (selectedMainTopics.length === 0) {
      return allTopics;
    }

    // Filter topics based on selected main topics (chapters)
    const filteredTopics = {};
    Object.entries(allTopics).forEach(([unit, topics]) => {
      // If this unit (chapter) is selected in main topics, include all its subtopics
      if (selectedMainTopics.includes(unit)) {
        filteredTopics[unit] = topics;
      }
    });

    return filteredTopics;
  }, [selectedMainTopics]);

  const getAllMainTopicsForSubject = useCallback(() => {
    // Return main topics (chapters) for the top dropdown
    return mainTopics.map((topic) => ({
      topic,
      value: topic,
    }));
  }, []);

  const handleMainTopicToggle = useCallback(
    (topicValue) => {
      if (topicValue === "select-all") {
        const allMainTopics = getAllMainTopicsForSubject();
        const allMainTopicValues = allMainTopics.map((t) => t.value);

        // If all main topics are selected, deselect all; otherwise, select all
        const allSelected = allMainTopicValues.every((val) =>
          selectedMainTopics.includes(val)
        );
        setSelectedMainTopics(allSelected ? [] : allMainTopicValues);
      } else {
        setSelectedMainTopics((prev) => {
          if (prev.includes(topicValue)) {
            return prev.filter((t) => t !== topicValue);
          } else {
            return [...prev, topicValue];
          }
        });
      }
    },
    [getAllMainTopicsForSubject, selectedMainTopics]
  );

  const isAllMainTopicsSelected = useCallback(() => {
    const allMainTopics = getAllMainTopicsForSubject();
    const allMainTopicValues = allMainTopics.map((t) => t.value);
    return (
      allMainTopicValues.length > 0 &&
      allMainTopicValues.every((val) => selectedMainTopics.includes(val))
    );
  }, [getAllMainTopicsForSubject, selectedMainTopics]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate basic form fields
    if (!selectedClass) {
      newErrors.class = "Please select a class";
    }
    if (!selectedSubject) {
      newErrors.subject = "Please select a subject";
    }
    if (!selectedExamType) {
      newErrors.examType = "Please select an exam type";
    }
    if (!selectedMainTopics || selectedMainTopics.length === 0) {
      newErrors.topic = "Please select at least one topic";
    }
    if (!numberOfPapers || numberOfPapers < 1 || numberOfPapers > 10) {
      newErrors.numberOfPapers = "Number of papers must be between 1 and 10";
    }

    // Validate questions
    questions.forEach((q, index) => {
      const questionErrors = {};

      // Check if question type is provided (either from dropdown or custom input)
      const hasQuestionType = q.type || questionTypeInputs[index];
      if (!hasQuestionType) {
        questionErrors.type = "Please select or enter a question type";
      }

      if (!q.units || q.units.length === 0) {
        if (!q.topics || q.topics.length === 0) {
          questionErrors.topics = "Please select at least one unit or topic";
        }
      }

      if (!q.numQuestions || q.numQuestions <= 0) {
        questionErrors.numQuestions =
          "Number of questions must be greater than 0";
      }

      if (!q.marksPerQuestion || q.marksPerQuestion <= 0) {
        questionErrors.marksPerQuestion =
          "Marks per question must be greater than 0";
      }

      if (Object.keys(questionErrors).length > 0) {
        newErrors[`question_${index}`] = questionErrors;
      }
    });

    return newErrors;
  }, [
    selectedClass,
    selectedSubject,
    selectedExamType,
    selectedMainTopics,
    numberOfPapers,
    questions,
    questionTypeInputs,
  ]);

  const handleGenerate = useCallback(async () => {
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const paperData = {
        class: selectedClass,
        subject: selectedSubject,
        examType: selectedExamType,
        topics: selectedMainTopics,
        numberOfPapers: numberOfPapers,
        duration: {
          hours: selectedHour,
          minutes: selectedMinute,
        },
        questions: questions.map((q) => ({
          ...q,
          // Use custom input if no predefined type is selected
          type: q.type || questionTypeInputs[questions.indexOf(q)] || "custom",
        })),
      };

      setGeneratedPaperData(paperData);
      setShowSuccessModal(true);
      setErrors({});
    } catch (error) {
      setErrors({
        general: "Failed to generate question paper. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    validateForm,
    selectedClass,
    selectedSubject,
    selectedExamType,
    selectedMainTopics,
    numberOfPapers,
    selectedHour,
    selectedMinute,
    questions,
    questionTypeInputs,
  ]);

  const totalQuestions = useMemo(
    () => questions.reduce((sum, q) => sum + q.numQuestions, 0),
    [questions]
  );

  const totalMarks = useMemo(
    () =>
      questions.reduce(
        (sum, q) => sum + q.numQuestions * q.marksPerQuestion,
        0
      ),
    [questions]
  );

  const getSelectedQuestionType = useCallback(
    (questionIndex) => {
      const question = questions[questionIndex];
      return questionTypes.find((type) => type.value === question.type);
    },
    [questions]
  );

  // Handle navigation to paper format page
  const handleViewPaper = useCallback(() => {
    // Store paper data in sessionStorage for the PaperFormat page to access
    sessionStorage.setItem(
      "generatedPaperData",
      JSON.stringify(generatedPaperData)
    );
    setShowSuccessModal(false);
    navigate("/paper");
  }, [generatedPaperData, navigate]);

  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    setShowSuccessModal(false);
    setGeneratedPaperData(null);
  }, []);

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

        {/* General Error Display */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Paper Details Form */}
        <PaperDetailsForm
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedExamType={selectedExamType}
          setSelectedExamType={setSelectedExamType}
          selectedMainTopics={selectedMainTopics}
          setSelectedMainTopics={setSelectedMainTopics}
          numberOfPapers={numberOfPapers}
          setNumberOfPapers={setNumberOfPapers}
          showDurationPicker={showDurationPicker}
          setShowDurationPicker={setShowDurationPicker}
          selectedHour={selectedHour}
          selectedMinute={selectedMinute}
          openDropdowns={openDropdowns}
          setOpenDropdowns={setOpenDropdowns}
          handleMainTopicToggle={handleMainTopicToggle}
          getAllMainTopicsForSubject={getAllMainTopicsForSubject}
          isAllMainTopicsSelected={isAllMainTopicsSelected}
          errors={errors}
        />

        {/* Duration Picker Modal */}
        <DurationPickerModal
          isOpen={showDurationPicker}
          onClose={() => setShowDurationPicker(false)}
          selectedHour={selectedHour}
          selectedMinute={selectedMinute}
          onHourChange={setSelectedHour}
          onMinuteChange={setSelectedMinute}
        />

        {/* Number of Papers Input */}

        {/* Questions Table */}
        <QuestionsTable
          questions={questions}
          errors={errors}
          onUpdateQuestion={updateQuestion}
          onRemoveQuestion={removeQuestion}
          onQuestionTypeInput={handleQuestionTypeInput}
          onSelectQuestionType={selectQuestionType}
          questionTypeInputs={questionTypeInputs}
          questionTypeSuggestions={questionTypeSuggestions}
          onToggleDropdown={toggleDropdown}
          onToggleUnit={toggleUnit}
          onToggleTopic={toggleTopic}
          getSubjectTopics={getSubjectTopics}
          openDropdowns={openDropdowns}
          dropdownRefs={dropdownRefs}
          totalQuestions={totalQuestions}
          totalMarks={totalMarks}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <Button
            onClick={addQuestion}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 ${
              isGenerating ? "cursor-not-allowed" : ""
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Paper
              </>
            )}
          </Button>
        </div>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseModal}
          onViewPaper={handleViewPaper}
          generatedPaperData={generatedPaperData}
          totalQuestions={totalQuestions}
          totalMarks={totalMarks}
        />
      </div>
    </div>
  );
}

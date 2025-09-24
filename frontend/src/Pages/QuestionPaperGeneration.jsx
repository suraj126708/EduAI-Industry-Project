/* eslint-disable no-unused-vars */
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

const classOptions = ["Class 10"];
const subjectOptions = ["History", "Geography", "Science"];
const examTypeOptions = ["Unit Test", "Midterm", "Final"];

const mainTopics = [
  "1. Historiography : Development in the West",
  "2. Historiography : Indian Tradition",
  "3. Applied History",
];

// Full topic structure with subtopics for question rows
const availableTopics = {
  history: {
    "1. Historiography : Development in the West": [
      "1.1 Tradition  of  Historiography",
      "1.2  Modern  Historiography",
      "1.3 Development of Scientific Perspective in Europe and Historiography",
      "1.4  Notable  Scholars",
    ],
    "2. Historiography : Indian Tradition": [
      "2.1 Tradition  of  Indian  Historiography",
      "2.2 Indian Historiography : Various Ideological  Frameworks",
    ],
    "3. Applied History": [
      "3.1 What is Applied History?",
      "3.2 Applied History and Research in Various Fields",
      "3.3 Applied History and Our Present",
      "3.4 Management of Cultural and Natural Heritage",
      "3.5 Affiliated Professional Fields",
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
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });
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
    const allTopics = availableTopics.history || {};

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

      // Validate that at least one main topic (units) or sub-topic is selected
      if (!q.units || q.units.length === 0) {
        if (!q.topics || q.topics.length === 0) {
          questionErrors.topics =
            "Please select at least one main topic or sub-topic";
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
      // Prepare payload from current form state to match new API format
      const payload = {
        class: selectedClass,
        subject: selectedSubject,
        examType: selectedExamType,
        topics: selectedMainTopics,
        numberOfPapers,
        duration: {
          hours: selectedHour,
          minutes: selectedMinute,
        },
        question_type: [
          ...new Set(
            questions.map((q, idx) => {
              const questionType =
                q.type || questionTypeInputs[idx] || "custom";
              // Convert internal format to display format
              const typeMapping = {
                single_correct: "Single Correct",
                short_answer: "Short Answer",
                long_answer: "Long Answer",
                multiple_correct: "Multiple Correct",
                fill_in_blank: "Fill in Blanks",
                true_false: "True/False",
              };
              return typeMapping[questionType] || questionType;
            })
          ),
        ],
        questions: questions.map((q, idx) => ({
          type: q.type || questionTypeInputs[idx] || "custom",
          topics: q.units || [],
          sub_topics: q.topics || [],
          numQuestions: q.numQuestions,
          marksPerQuestion: q.marksPerQuestion,
        })),
      };

      console.log("payload", payload);

      const res = await fetch(
        "http://localhost:8000/generate_question_paper/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      console.log(data);
      if (
        !res.ok ||
        !data ||
        data.status !== "success" ||
        !data.question_paper
      ) {
        throw new Error(
          (data && data.message) || "Failed to generate question paper"
        );
      }

      // Use the returned question_paper from the API
      setGeneratedPaperData(data.question_paper);
      setShowSuccessModal(true);
      setErrors({});

      // Show success toast
      setToast({
        visible: true,
        message: "Question paper generated successfully",
        type: "success",
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
    } catch (error) {
      console.error("Generate error:", error);

      let errorMessage = "Failed to generate question paper. Please try again.";

      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "Unable to connect to the server. Please check if the backend server is running on localhost:8000";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({
        general: errorMessage,
      });

      // Show error toast
      setToast({ visible: true, message: errorMessage, type: "error" });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
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
        {/* Toast Notification */}
        {toast.visible && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.message}
          </div>
        )}
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
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          examTypeOptions={examTypeOptions}
          mainTopicOptions={getAllMainTopicsForSubject()}
          isAllMainTopicsSelected={isAllMainTopicsSelected()}
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

          {/* View Paper button shown when a generated paper exists */}
          {generatedPaperData && (
            <Button
              onClick={handleViewPaper}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              View Paper
            </Button>
          )}
        </div>

        {/* Success Modal */}
        {/* <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseModal}
          onViewPaper={handleViewPaper}
          generatedPaperData={generatedPaperData}
          totalQuestions={totalQuestions}
          totalMarks={totalMarks}
        /> */}
      </div>
    </div>
  );
}

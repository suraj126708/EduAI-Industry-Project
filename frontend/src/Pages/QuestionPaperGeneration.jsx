/* eslint-disable no-unused-vars */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, AlertCircle, Loader2 } from "lucide-react";
import questionTypes from "../assets/QuestionType.json";
import { bookAPI, fetchTeacherProfile } from "../utils/api";
import api from "../utils/api";

// Import reusable components
import {
  Button,
  ErrorMessage,
  PaperDetailsForm,
  QuestionsTable,
  DurationPickerModal,
  SuccessModal,
  Modal,
  ModalHeader,
  ModalContent,
  ModalCloseButton,
} from "../components";

//const classOptions = ["Class 10"];
//const subjectOptions = ["History", "Geography", "Science"];
const examTypeOptions = ["Unit Test", "Midterm", "Final"];

// Default topics - will be replaced by dynamic data from API
const defaultMainTopics = [
  // "1. Historiography : Development in the West",
  // "2. Historiography : Indian Tradition",
  // "3. Applied History",
  // "4. History of Indian Arts",
  // "5. Mass Media and History",
  // "6. Entertainment and History",
  // "7. Sports and History",
  // "8. Tourism and History",
  // "9. Heritage Management",
  // "10. History of India",
];

// Full topic structure with subtopics for question rows
// const availableTopics = {
//   history: {
//     "1. Historiography : Development in the West": [
//       "1.1 Tradition of Historiography",
//       "1.2 Modern Historiography",
//       "1.3 Development of Scientific Perspective in Europe and Historiography",
//       "1.4 Notable Scholars",
//     ],
//     "2. Historiography : Indian Tradition": [
//       "2.1 Tradition of Indian Historiography",
//       "2.2 Indian Historiography : Various Ideological Frameworks",
//     ],
//     "3. Applied History": [
//       "3.1 What is Applied History?",
//       "3.2 Applied History and Research in Various Fields",
//       "3.3 Applied History and Our Present",
//       "3.4 Management of Cultural and Natural Heritage",
//       "3.5 Affiliated Professional Fields",
//     ],
//     "4. History of Indian Arts": [
//       "4.1 Literature",
//       "4.2 Various Styles of Indian Paintings",
//       "4.3 Modern Painting",
//       "4.4 Sculpture and Theatre",
//       "4.5 Cinema and Art",
//     ],
//     "5. Mass Media and History": [
//       "5.1 Print Media",
//       "5.2 Television and History",
//       "5.3 Films and Theatre",
//       "5.4 Electronic Media and History",
//       "5.5 Social Media and History",
//     ],
//     "6. Entertainment and History": [
//       "6.1 Theatre",
//       "6.2 Cinema",
//       "6.3 Folk Theatre",
//       "6.4 Television",
//       "6.5 Jatra",
//       "6.6 Tamasha",
//       "6.7 Puppetry",
//     ],
//     "7. Sports and History": [
//       "7.1 Ancient Games and Sports",
//       "7.2 Sports and Development of Nationalism",
//       "7.3 Globalisation and Sports",
//       "7.4 Sports and Technology",
//     ],
//     "8. Tourism and History": [
//       "8.1 Types of Tourism",
//       "8.2 Tourism and History",
//       "8.3 Development of Tourism in India",
//       "8.4 Conservation of Historical Tourism",
//     ],
//     "9. Heritage Management": [
//       "9.1 Concept of Heritage",
//       "9.2 Preservation and Conservation of Heritage",
//       "9.3 Heritage Management Programmes",
//       "9.4 Professional Opportunities in Heritage Management",
//     ],
//   },
// };

const initialQuestions = [
  {
    type: "",
    units: [],
    // topics field deprecated; keeping for backward compatibility but unused
    topics: [],
    difficulty: "medium",
    numQuestions: 10,
    marksPerQuestion: 1,
    subtopicsInput: "",
  },
];

export default function MinimalQuestionPaperForm() {
  const navigate = useNavigate();
  //ADD: The missing state variables for your dropdowns, loading, and errors
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedMainTopics, setSelectedMainTopics] = useState([]);
  const [numberOfPapers, setNumberOfPapers] = useState(1);
  const [dynamicTopics, setDynamicTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
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
  // Removed final LLM note modal; using per-row subtopics instead
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const dropdownRefs = useRef({});
  const [showNoBooksModal, setShowNoBooksModal] = useState(false);

  // Cache keys
  const CACHE_KEY = "qpg_form_state_v1";
  const QUESTIONS_CACHE_KEY = "qpg_questions_v1";

  // Load cached state once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached.selectedClass) setSelectedClass(cached.selectedClass);
        if (cached.selectedSubject) setSelectedSubject(cached.selectedSubject);
        if (cached.selectedExamType)
          setSelectedExamType(cached.selectedExamType);
        if (Array.isArray(cached.selectedMainTopics))
          setSelectedMainTopics(cached.selectedMainTopics);
        if (typeof cached.numberOfPapers === "number")
          setNumberOfPapers(cached.numberOfPapers);
        if (typeof cached.selectedHour === "number")
          setSelectedHour(cached.selectedHour);
        if (typeof cached.selectedMinute === "number")
          setSelectedMinute(cached.selectedMinute);
      }

      const rawQuestions = localStorage.getItem(QUESTIONS_CACHE_KEY);
      if (rawQuestions) {
        const cachedQuestions = JSON.parse(rawQuestions);
        if (Array.isArray(cachedQuestions) && cachedQuestions.length > 0) {
          setQuestions(cachedQuestions);
        }
      }
    } catch (e) {
      console.warn("Failed to load cached form state", e);
    }
  }, []);

  // Persist form state
  useEffect(() => {
    try {
      const toSave = {
        selectedClass,
        selectedSubject,
        selectedExamType,
        selectedMainTopics,
        numberOfPapers,
        selectedHour,
        selectedMinute,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Failed to save form state", e);
    }
  }, [
    selectedClass,
    selectedSubject,
    selectedExamType,
    selectedMainTopics,
    numberOfPapers,
    selectedHour,
    selectedMinute,
  ]);

  // Persist questions state
  useEffect(() => {
    try {
      localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(questions));
    } catch (e) {
      console.warn("Failed to save questions state", e);
    }
  }, [questions]);

  // Function to fetch chapters from API
  const fetchChapters = useCallback(async (subject, classId) => {
    if (!subject || !classId) return;

    setIsLoadingTopics(true);
    try {
      const response = await api.get("teachers/chapters", {
        params: {
          subject: subject,
          classId: classId,
        },
      });

      const data = response.data;
      console.log("Fetched chapters:", data);

      if (data.success && data.chapters && data.chapters.length > 0) {
        // Transform API response to match our format
        const transformedTopics = data.chapters.map((chapter) => ({
          topic: `${chapter.chapter_no}. ${chapter.chapter_title}`,
          value: `${chapter.chapter_no}. ${chapter.chapter_title}`,
          chapter_no: chapter.chapter_no,
          chapter_title: chapter.chapter_title,
          source_book: chapter.source_book,
          author: chapter.author,
        }));

        setDynamicTopics(transformedTopics);
        console.log("Fetched dynamic topics:", transformedTopics);
      } else {
        // Fallback to default topics if no chapters found
        console.log("No chapters found, using default topics");
        setDynamicTopics([]);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      // Fallback to default topics on error
      setDynamicTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  // Fetch chapters when subject or class changes
  useEffect(() => {
    if (selectedSubject && selectedClass) {
      const classObj = classOptions.find((c) => c.grade === selectedClass);

      if (classObj) {
        fetchChapters(selectedSubject, selectedClass);
      }
    } else {
      setDynamicTopics([]);
    }
  }, [selectedSubject, selectedClass, fetchChapters, classOptions]);

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

  // --- DATA FETCHING LOGIC ---
  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
          throw new Error("User not authenticated. Please log in.");
        }

        const profile = await fetchTeacherProfile();
        const schoolId = profile?.schoolId;

        if (!schoolId) {
          throw new Error(
            "Your profile is missing a School ID. Please contact support."
          );
        }

        const response = await bookAPI.getTeacherAssignments(
          schoolId,
          currentUser.email
        );

        if (response.data.success) {
          const { classes, subjects } = response.data.data;

          const formattedClasses = classes.map((c) => ({
            _id: c._id,
            grade: c.grade.toString(),
          }));
          const formattedSubjects = subjects.map((s) => s.name);

          setClassOptions(formattedClasses);
          setSubjectOptions(formattedSubjects);

          if (formattedClasses.length === 0 || formattedSubjects.length === 0) {
            setShowNoBooksModal(true);
          }
        } else {
          throw new Error(
            response.data.message || "Could not retrieve your assignments."
          );
        }
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setFetchError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

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
      {
        type: "",
        units: [],
        // topics deprecated
        topics: [],
        difficulty: "medium",
        numQuestions: 1,
        marksPerQuestion: 1,
        subtopicsInput: "",
      },
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

  // Sub-topic selection logic removed. We keep only main topics (units).

  const toggleDropdown = (questionIndex) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const getSubjectTopics = useCallback(() => {
    // If we have dynamic topics, create a simplified structure
    if (dynamicTopics.length > 0) {
      const allTopics = {};

      // Create topic structure from dynamic topics
      dynamicTopics.forEach((topic) => {
        allTopics[topic.value] = []; // No subtopics for now, just main topics
      });

      // If no main topics are selected, return all topics
      if (selectedMainTopics.length === 0) {
        return allTopics;
      }

      // Filter topics based on selected main topics (chapters)
      const filteredTopics = {};
      Object.entries(allTopics).forEach(([unit, topics]) => {
        // If this unit (chapter) is selected in main topics, include it
        if (selectedMainTopics.includes(unit)) {
          filteredTopics[unit] = topics;
        }
      });

      return filteredTopics;
    }

    // Fallback to static topics for backward compatibility
    const allTopics = {}; // Removed reference to undefined 'availableTopics'

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
  }, [selectedMainTopics, dynamicTopics]);

  const getAllMainTopicsForSubject = useCallback(() => {
    // Use dynamic topics if available, otherwise fallback to default
    if (dynamicTopics.length > 0) {
      return dynamicTopics;
    }

    // Fallback to default topics
    return defaultMainTopics.map((topic) => ({
      topic,
      value: topic,
    }));
  }, [dynamicTopics]);

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

      // Require at least one main topic (unit). Sub-topics are disabled.
      if (!q.units || q.units.length === 0) {
        questionErrors.topics = "Please select at least one main topic";
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

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    try {
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[-:]/g, "")
        .replace("T", "");
      const pdfName = `questionPaper${selectedClass}${selectedSubject}${timestamp}`;

      // ✅ CHANGE 1: The payload is now more detailed to improve AI results.
      const payload = {
        class: selectedClass,
        subject: selectedSubject,
        pdf_name: pdfName,
        examType: selectedExamType || "",
        topics: selectedMainTopics,
        numberOfPapers: Number(numberOfPapers) || 1,
        duration: { hours: selectedHour, minutes: selectedMinute },
        generation_instructions: `
        Generate a complete question paper.
        The total marks should be ${totalMarks}.
        The time allowed is ${selectedHour} hour(s) and ${selectedMinute} minute(s).
        Include 3-4 general instructions for the students.
        The test name is "${selectedExamType}".
        Do not repeat previous answers. Request ID: ${Date.now()}
      `,
        question_type: questions.map((q) =>
          q.type === "single_correct"
            ? "Single Correct"
            : q.type === "short_answer"
            ? "Short Answer"
            : q.type === "long_answer"
            ? "Long Answer"
            : q.type === "fill_in_the_blanks"
            ? "Fill in the Blanks"
            : q.type
        ),
        questions: questions.map((q) => ({
          type: q.type,
          topics: q.topics && q.topics.length ? q.topics : selectedMainTopics,
          llm_note: (q.subtopicsInput || "")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
          difficulty:
            (q.difficulty || "medium").charAt(0).toUpperCase() +
            (q.difficulty || "medium").slice(1),
          numQuestions: q.numQuestions,
          marksPerQuestion: q.marksPerQuestion,
        })),
      };

      console.log("payload", payload);

      const response = await api.post(
        "teachers/generate-question-paper",
        payload
      );

      const data = response.data;
      console.log("generate response", data);

      // ✅ CHANGE 2: This entire block handles the successful response correctly.
      if (!data.success) {
        throw new Error(data.message || "Failed to generate question paper");
      }

      const papersArray = data.generated_papers;

      if (!papersArray || papersArray.length === 0) {
        throw new Error("The AI returned an empty or invalid paper.");
      }

      // Store the full array for session persistence (e.g., on page refresh)
      sessionStorage.setItem(
        "generatedPapersArray",
        JSON.stringify(papersArray)
      );

      // Navigate to the viewer, passing the full array of papers in the state
      navigate("/paper", { state: { papers: papersArray } });

      setErrors({});

      // Show success toast
      setToast({
        visible: true,
        message: data.message || "Question paper generated successfully",
        type: "success",
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
    } catch (error) {
      console.error("Generate error:", error);

      const backendData = error?.response?.data;
      let errorMessage = "Failed to generate question paper. Please try again.";

      if (backendData && backendData.message) {
        errorMessage = backendData.message;
      } else if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "Unable to connect to the server. Please check if the backend server is running on localhost:5000";
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (backendData) {
        console.error("Backend response data:", backendData);
      }

      setErrors({
        general: errorMessage,
        backend: backendData || null,
      });

      setToast({ visible: true, message: errorMessage, type: "error" });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedClass,
    selectedSubject,
    selectedExamType,
    selectedMainTopics,
    numberOfPapers,
    selectedHour,
    selectedMinute,
    questions,
    totalMarks, // Add totalMarks to the dependency array
    navigate, // Add navigate to the dependency array
  ]);

  const handleGenerateClick = useCallback(() => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    handleGenerate();
  }, [validateForm, handleGenerate]);

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

  // --- LOADING AND ERROR UI ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-lg font-semibold text-gray-700">
          Loading Your Assignments...
        </p>
        <p className="text-sm text-gray-500">
          Please wait while we fetch your assigned classes and subjects.
        </p>
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg shadow-md">
          <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
          <p className="mt-4 text-lg font-semibold text-red-800">
            Failed to Load Data
          </p>
          <p className="text-sm text-red-700 mt-1">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* No Books Modal */}
        <Modal
          isOpen={showNoBooksModal}
          onClose={() => setShowNoBooksModal(false)}
        >
          <ModalHeader className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">No Books Found</h3>
              <ModalCloseButton onClose={() => setShowNoBooksModal(false)} />
            </div>
          </ModalHeader>
          <ModalContent>
            <p className="text-gray-700 mb-4">
              We couldn't find any books uploaded by you. Upload at least one
              book to enable class and subject selection for question paper
              generation.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowNoBooksModal(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={() => navigate("/upload")}>Go to Uploads</Button>
            </div>
          </ModalContent>
        </Modal>
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
          isLoadingTopics={isLoadingTopics}
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
          onToggleTopic={() => {}}
          getSubjectTopics={getSubjectTopics}
          openDropdowns={openDropdowns}
          dropdownRefs={dropdownRefs}
          totalQuestions={totalQuestions}
          totalMarks={totalMarks}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <Button
            onClick={addQuestion}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </Button>

          <Button
            onClick={handleGenerateClick}
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

          {generatedPaperData && (
            <Button
              onClick={handleViewPaper}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              View Paper
            </Button>
          )}
        </div>

        {/* Note Modal removed; per-row subtopics inputs are used instead */}

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

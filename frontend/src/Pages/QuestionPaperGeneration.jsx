/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
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

const examTypeOptions = ["Unit Test", "Midterm", "Final"];
const defaultMainTopics = [];

const initialQuestions = [
  {
    type: "",
    units: [],
    topics: [],
    difficulty: "medium",
    numQuestions: 10,
    marksPerQuestion: 1,
    subtopicsInput: "",
  },
];

export default function MinimalQuestionPaperForm() {
  const navigate = useNavigate();

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

  const [teacherProfile, setTeacherProfile] = useState(null);
  const [allAssignments, setAllAssignments] = useState([]);

  // ✅ 1. NEW STATE: Store the actual uploaded books
  const [userBooks, setUserBooks] = useState([]);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const dropdownRefs = useRef({});
  const [showNoBooksModal, setShowNoBooksModal] = useState(false);

  // --- Helper Functions ---
  const getSubjectTopics = useCallback(() => {
    if (dynamicTopics.length > 0) {
      const allTopics = {};
      dynamicTopics.forEach((topic) => {
        allTopics[topic.value] = [];
      });
      if (selectedMainTopics.length === 0) return allTopics;
      const filteredTopics = {};
      Object.entries(allTopics).forEach(([unit, topics]) => {
        if (selectedMainTopics.includes(unit)) {
          filteredTopics[unit] = topics;
        }
      });
      return filteredTopics;
    }
    return {};
  }, [selectedMainTopics, dynamicTopics]);

  const getAllMainTopicsForSubject = useCallback(() => {
    if (dynamicTopics.length > 0) return dynamicTopics;
    return defaultMainTopics.map((topic) => ({ topic, value: topic }));
  }, [dynamicTopics]);

  const fetchChapters = useCallback(async (subject, classId) => {
    if (!subject || !classId) return;
    setIsLoadingTopics(true);
    try {
      const response = await api.get("teachers/chapters", {
        params: { subject: subject, classId: classId, _cacheBust: Date.now() },
      });
      const data = response.data;
      if (data.success && data.chapters && data.chapters.length > 0) {
        const transformedTopics = data.chapters.map((chapter) => ({
          topic: `${chapter.chapter_no}. ${chapter.chapter_title}`,
          value: `${chapter.chapter_no}. ${chapter.chapter_title}`,
          chapter_no: chapter.chapter_no,
          chapter_title: chapter.chapter_title,
          source_book: chapter.source_book,
          author: chapter.author,
        }));
        setDynamicTopics(transformedTopics);
      } else {
        setDynamicTopics([]);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setDynamicTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (selectedSubject && selectedClass) {
      const classObj = classOptions.find((c) => c.grade === selectedClass);
      if (classObj) fetchChapters(selectedSubject, selectedClass);
    } else {
      setDynamicTopics([]);
    }
  }, [selectedSubject, selectedClass, fetchChapters, classOptions]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdowns]);

  useEffect(() => {
    const allAvailableTopicValues = Object.keys(getSubjectTopics());
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => ({ ...q, units: allAvailableTopicValues }))
    );
  }, [selectedMainTopics, getSubjectTopics]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) setErrors({});
  }, [
    selectedClass,
    selectedSubject,
    selectedExamType,
    selectedMainTopics,
    numberOfPapers,
    questions,
  ]);

  useEffect(() => {
    setSubjectOptions([]);
    setSelectedSubject("");
    if (selectedClass && allAssignments.length > 0 && classOptions.length > 0) {
      const classObj = classOptions.find((c) => c.grade === selectedClass);
      if (classObj) {
        const selectedClassId = classObj._id;
        const assignmentsForClass = allAssignments.filter(
          (a) => a.classId?._id === selectedClassId
        );
        const uniqueSubjectMap = new Map();
        assignmentsForClass.forEach((a) => {
          if (a.subjectId && a.subjectId._id && a.subjectId.name) {
            if (!uniqueSubjectMap.has(a.subjectId._id)) {
              uniqueSubjectMap.set(a.subjectId._id, a.subjectId.name);
            }
          }
        });
        const sortedSubjects = Array.from(uniqueSubjectMap.values()).sort();
        setSubjectOptions(sortedSubjects);
      }
    }
  }, [selectedClass, allAssignments, classOptions]);

  // --- ✅ UPDATED DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
          throw new Error("User not authenticated. Please log in.");
        }

        const profile = await fetchTeacherProfile();
        setTeacherProfile(profile);
        const schoolId = profile?.schoolId;

        if (!schoolId) {
          throw new Error("Your profile is missing a School ID.");
        }

        // 1. Fetch Assignments (For Dropdowns)
        const assignmentResponse = await bookAPI.getTeacherAssignments(
          schoolId,
          currentUser.email
        );

        // 2. Fetch Books (For Generation Logic)
        const booksResponse = await bookAPI.getMyBooks(); // Use the API helper

        // Process Assignments
        if (assignmentResponse.data?.success) {
          const fetchedAssignments =
            assignmentResponse.data.data?.assignments || [];
          setAllAssignments(fetchedAssignments);

          const uniqueClassMap = new Map();
          fetchedAssignments.forEach((a) => {
            if (
              a.classId &&
              a.classId._id &&
              typeof a.classId.grade === "number"
            ) {
              if (!uniqueClassMap.has(a.classId._id)) {
                uniqueClassMap.set(a.classId._id, {
                  _id: a.classId._id,
                  grade: String(a.classId.grade),
                });
              }
            }
          });
          const sortedClasses = Array.from(uniqueClassMap.values()).sort(
            (a, b) => parseInt(a.grade) - parseInt(b.grade)
          );
          setClassOptions(sortedClasses);

          if (fetchedAssignments.length === 0) {
            setShowNoBooksModal(true);
          }
        }

        // Process Books
        if (booksResponse.success) {
          console.log("Loaded Books:", booksResponse.data);
          setUserBooks(booksResponse.data); // Store books in state
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setFetchError(err.message);
        setClassOptions([]);
        setSubjectOptions([]);
        setAllAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateQuestion = useCallback((index, key, value) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], [key]: value };
      return newQuestions;
    });
  }, []);

  const addQuestion = useCallback(() => {
    const allAvailableTopicValues = Object.keys(getSubjectTopics());
    setQuestions((prev) => [
      ...prev,
      {
        type: "",
        units: allAvailableTopicValues,
        topics: [],
        difficulty: "medium",
        numQuestions: 1,
        marksPerQuestion: 1,
        subtopicsInput: "",
      },
    ]);
  }, [getSubjectTopics]);

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
      const newUnits = currentUnits.filter((u) => u !== unit);
      const newTopics = currentTopics.filter((t) => !unitTopics.includes(t));
      updateQuestion(questionIndex, "units", newUnits);
      updateQuestion(questionIndex, "topics", newTopics);
    } else {
      const newUnits = [...currentUnits, unit];
      const newTopics = [...new Set([...currentTopics, ...unitTopics])];
      updateQuestion(questionIndex, "units", newUnits);
      updateQuestion(questionIndex, "topics", newTopics);
    }
  };

  const toggleDropdown = (questionIndex) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const handleMainTopicToggle = useCallback(
    (topicValue) => {
      if (topicValue === "select-all") {
        const allMainTopics = getAllMainTopicsForSubject();
        const allMainTopicValues = allMainTopics.map((t) => t.value);
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
    if (!selectedClass) newErrors.class = "Please select a class";
    if (!selectedSubject) newErrors.subject = "Please select a subject";
    if (!selectedExamType) newErrors.examType = "Please select an exam type";
    if (!selectedMainTopics || selectedMainTopics.length === 0)
      newErrors.topic = "Please select at least one topic";
    if (!numberOfPapers || numberOfPapers < 1 || numberOfPapers > 10)
      newErrors.numberOfPapers = "Number of papers must be between 1 and 10";

    questions.forEach((q, index) => {
      const questionErrors = {};
      const hasQuestionType = q.type || questionTypeInputs[index];
      if (!hasQuestionType)
        questionErrors.type = "Please select or enter a question type";
      if (!q.units || q.units.length === 0)
        questionErrors.topics = "Please select at least one main topic";
      if (!q.numQuestions || q.numQuestions <= 0)
        questionErrors.numQuestions =
          "Number of questions must be greater than 0";
      if (!q.marksPerQuestion || q.marksPerQuestion <= 0)
        questionErrors.marksPerQuestion =
          "Marks per question must be greater than 0";
      if (Object.keys(questionErrors).length > 0)
        newErrors[`question_${index}`] = questionErrors;
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

  const totalQuestions = questions.reduce((sum, q) => sum + q.numQuestions, 0);
  const totalMarks = questions.reduce(
    (sum, q) => sum + q.numQuestions * q.marksPerQuestion,
    0
  );

  // --- ✅ FIXED HANDLE GENERATE ---
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    try {
      if (!teacherProfile?._id) {
        throw new Error("Teacher profile not loaded. Please refresh.");
      }
      console.log("Starting Generation...");
      console.log("Selected Criteria:", {
        class: selectedClass,
        subject: selectedSubject,
        teacherId: teacherProfile._id,
      });

      // 1. RE-FETCH BOOKS (Ensure we have the absolute latest list)
      // This prevents stale state issues if you just uploaded a book
      const booksRes = await bookAPI.getMyBooks();
      let currentBooks = [];

      if (booksRes.success && Array.isArray(booksRes.data)) {
        currentBooks = booksRes.data;
        setUserBooks(currentBooks); // Update state while we're at it
      } else {
        // Fallback to existing state if fetch fails
        currentBooks = userBooks;
      }

      console.log("Searching through books:", currentBooks.length);
      // ✅ FIX: Search in userBooks instead of allAssignments
      const selectedBook = userBooks.find((book) => {
        // Match Class (book.classId is populated object)
        const bookGrade = book.classId?.grade;
        const classMatch = String(bookGrade) === String(selectedClass);

        // Match Subject (book.subject is a string)
        // Trim and lowercase comparison for robustness
        const targetSubject = (selectedSubject || "").trim().toLowerCase();
        const bookSubject = (book.subject || "").trim().toLowerCase();
        const bookTitle = (book.title || "").trim().toLowerCase();

        // ✅ Check if EITHER the subject field OR the title field matches
        // Your book has title="Science" but subject=undefined, so this fixes it.
        const subjectMatch =
          bookSubject === targetSubject || bookTitle === targetSubject;

        return classMatch && subjectMatch;
      });

      if (!selectedBook) {
        // --- DEBUG LOGGING ---
        // This will print to your browser console (F12) to show exactly what went wrong
        console.error("❌ BOOK LOOKUP FAILED");
        console.error(
          "Looking for -> Class:",
          selectedClass,
          "| Subject:",
          selectedSubject
        );
        console.error("Available Books (Mapped):");
        console.table(
          currentBooks.map((b) => ({
            id: b._id,
            grade: b.classId?.grade,
            subject: b.subject,
            title: b.title,
            matchClass: String(b.classId?.grade) === String(selectedClass),
            matchSubject:
              (b.subject || "").trim().toLowerCase() ===
              (selectedSubject || "").trim().toLowerCase(),
          }))
        );

        throw new Error(
          `Could not find an uploaded book for Class ${selectedClass} - ${selectedSubject}. Please check the browser console for details.`
        );
      }

      console.log(
        "✅ Found Book:",
        selectedBook.title,
        "ID:",
        selectedBook._id
      );

      const bookId = selectedBook._id; // ✅ We found the correct ID

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[-:]/g, "")
        .replace("T", "");
      const pdfName = `questionPaper${selectedClass}${selectedSubject}${timestamp}`;

      const payload = {
        bookId: bookId, // ✅ Passing the bookId correctly
        totalMarks: totalMarks,
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

      if (!data.success) {
        throw new Error(data.message || "Failed to generate question paper");
      }

      const papersArray = data.generated_papers;
      if (!papersArray || papersArray.length === 0) {
        throw new Error("The AI returned an empty or invalid paper.");
      }

      const firstPaperId = papersArray[0]._id;
      sessionStorage.setItem("paperBatchData", JSON.stringify(papersArray));
      navigate(`/paper/${firstPaperId}`);

      setErrors({});
      setToast({
        visible: true,
        message: data.message || "Question paper generated successfully",
        type: "success",
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
    } catch (error) {
      console.error("Generate error:", error);
      const backendData = error?.response?.data;
      let errorMessage = error.message || "Failed to generate question paper.";
      if (backendData && backendData.message)
        errorMessage = backendData.message;

      setErrors({ general: errorMessage, backend: backendData || null });
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
    totalMarks,
    navigate,
    teacherProfile,
    userBooks, // ✅ Added dependency
  ]);

  const handleGenerateClick = useCallback(() => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    handleGenerate();
  }, [validateForm, handleGenerate]);

  // ... (rest of the component: getSelectedQuestionType, handleViewPaper, UI render) ...
  const getSelectedQuestionType = useCallback(
    (questionIndex) => {
      const question = questions[questionIndex];
      return questionTypes.find((type) => type.value === question.type);
    },
    [questions]
  );

  const handleViewPaper = useCallback(() => {
    setShowSuccessModal(false);
    navigate("/paper");
  }, [navigate]);

  const handleCloseModal = useCallback(() => {
    setShowSuccessModal(false);
    setGeneratedPaperData(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
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
        <Modal
          isOpen={showNoBooksModal}
          onClose={() => setShowNoBooksModal(false)}
        >
          <ModalHeader className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                No Books Found
              </h3>
              <ModalCloseButton onClose={() => setShowNoBooksModal(false)} />
            </div>
          </ModalHeader>
          <ModalContent>
            <p className="text-gray-700 mb-4">
              We couldn't find any books uploaded by you. Upload a book to
              generate papers.
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

        {toast.visible && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Question Paper Builder
          </h1>
          <p className="text-gray-600 text-lg">
            Create customized question papers with AI-powered generation
          </p>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{errors.general}</span>
            </div>
          </div>
        )}

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

        <DurationPickerModal
          isOpen={showDurationPicker}
          onClose={() => setShowDurationPicker(false)}
          selectedHour={selectedHour}
          selectedMinute={selectedMinute}
          onHourChange={setSelectedHour}
          onMinuteChange={setSelectedMinute}
        />

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

        <div className="flex gap-4 justify-center mt-8">
          <Button
            onClick={addQuestion}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Question
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
                <FileText className="w-4 h-4" /> Generate Paper
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
      </div>
    </div>
  );
}

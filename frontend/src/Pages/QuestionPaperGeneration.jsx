/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { bookAPI, fetchTeacherProfile, paperAPI } from "../utils/api";

// --- MUI Imports ---
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  AddCircleOutline,
  Description,
  AutoAwesome,
} from "@mui/icons-material";

// --- Custom MUI Components ---
import {
  PaperDetailsForm,
  QuestionsTable,
  DurationPickerModal,
} from "../components/question";

const initialQuestions = [
  {
    type: "", // e.g., "mcq"
    units: [],
    topics: [],
    difficulty: "medium",
    numQuestions: 10,
    marksPerQuestion: 1,
    subtopicsInput: "",
  },
];

const examTypeOptions = [
  { label: "Unit Test", value: "Unit Test" },
  { label: "Midterm", value: "Midterm" },
  { label: "Final", value: "Final" },
];

export default function QuestionPaperGeneration() {
  const navigate = useNavigate();

  // --- State ---
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedMainTopics, setSelectedMainTopics] = useState([]);
  const [numberOfPapers, setNumberOfPapers] = useState(1);

  const [selectedHour, setSelectedHour] = useState(1);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const [dynamicTopics, setDynamicTopics] = useState([]); // Chapters
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const [questions, setQuestions] = useState(initialQuestions);

  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [userBooks, setUserBooks] = useState([]);
  const [showNoBooksModal, setShowNoBooksModal] = useState(false);

  // UI Feedback
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [teacherProfile, setTeacherProfile] = useState(null);
  const [allAssignments, setAllAssignments] = useState([]);

  // --- Helpers ---
  const getSubjectTopics = useCallback(() => {
    if (dynamicTopics.length > 0) {
      const topics = {};
      dynamicTopics.forEach((t) => {
        topics[t.value] = [];
      });
      return topics;
    }
    return {};
  }, [dynamicTopics]);

  // --- Data Fetching ---
  const fetchChapters = useCallback(async (subject, classId) => {
    if (!subject || !classId) return;
    setIsLoadingTopics(true);
    try {
      const response = await bookAPI.getChapters(subject, classId);
      if (response.success && response.chapters?.length > 0) {
        setDynamicTopics(
          response.chapters.map((c) => ({
            topic: `${c.chapter_no}. ${c.chapter_title}`,
            value: `${c.chapter_no}. ${c.chapter_title}`,
          }))
        );
      } else {
        setDynamicTopics([]);
      }
    } catch (error) {
      setDynamicTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSubject && selectedClass) {
      const classObj = classOptions.find((c) => c.grade === selectedClass);
      if (classObj) fetchChapters(selectedSubject, selectedClass);
    } else {
      setDynamicTopics([]);
    }
  }, [selectedSubject, selectedClass, fetchChapters, classOptions]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) throw new Error("User not authenticated.");

        const profile = await fetchTeacherProfile();
        setTeacherProfile(profile);

        const [assignRes, booksRes] = await Promise.all([
          bookAPI.getTeacherAssignments(profile.schoolId, currentUser.email),
          bookAPI.getMyBooks(),
        ]);

        if (assignRes.data?.success) {
          const assignments = assignRes.data.data?.assignments || [];
          setAllAssignments(assignments);

          const uniqueMap = new Map();
          assignments.forEach((a) => {
            if (a.classId?._id)
              uniqueMap.set(a.classId._id, {
                _id: a.classId._id,
                grade: String(a.classId.grade),
                label: `Class ${a.classId.grade}`,
              });
          });
          setClassOptions(
            Array.from(uniqueMap.values()).sort(
              (a, b) => Number(a.grade) - Number(b.grade)
            )
          );

          if (assignments.length === 0) setShowNoBooksModal(true);
        }

        if (booksRes.success) setUserBooks(booksRes.data || []);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setSubjectOptions([]);
    setSelectedSubject("");
    if (selectedClass) {
      const classObj = classOptions.find((c) => c.grade === selectedClass);
      if (classObj) {
        const subs = new Set();
        allAssignments
          .filter((a) => a.classId?._id === classObj._id)
          .forEach((a) => {
            if (a.subjectId?.name) subs.add(a.subjectId.name);
          });
        setSubjectOptions(
          Array.from(subs)
            .sort()
            .map((s) => ({ label: s, value: s }))
        );
      }
    }
  }, [selectedClass, allAssignments, classOptions]);

  // --- Handlers ---
  const updateQuestion = useCallback((index, key, value) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  }, []);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        type: "",
        units: [],
        topics: [],
        difficulty: "medium",
        numQuestions: 1,
        marksPerQuestion: 1,
        subtopicsInput: "",
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1)
      setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedClass) newErrors.class = "Required";
    if (!selectedSubject) newErrors.subject = "Required";
    if (!selectedExamType) newErrors.examType = "Required";
    if (selectedMainTopics.length === 0)
      newErrors.topic = "At least one chapter required";
    questions.forEach((q, i) => {
      if (!q.type) newErrors[`question_${i}`] = { type: "Required" };
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateClick = async () => {
    if (!validateForm()) {
      setToast({
        open: true,
        message: "Please fill all required fields",
        severity: "error",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const selectedBook = userBooks.find(
        (b) =>
          String(b.classId?.grade) === String(selectedClass) &&
          (b.subject === selectedSubject || b.title === selectedSubject)
      );

      if (!selectedBook)
        throw new Error("No uploaded book found for this Class & Subject.");

      const payload = {
        bookId: selectedBook._id,
        totalMarks: questions.reduce(
          (sum, q) => sum + q.numQuestions * q.marksPerQuestion,
          0
        ),
        class: selectedClass,
        subject: selectedSubject,
        pdf_name: `QP_${Date.now()}`,
        examType: selectedExamType,
        topics: selectedMainTopics,
        numberOfPapers: Number(numberOfPapers),
        duration: { hours: selectedHour, minutes: selectedMinute },
        question_type: questions.map((q) => q.type),
        questions: questions.map((q) => ({
          type: q.type,
          topics: q.units.length > 0 ? q.units : selectedMainTopics,
          llm_note: q.subtopicsInput ? q.subtopicsInput.split(",") : [],
          difficulty: q.difficulty,
          numQuestions: q.numQuestions,
          marksPerQuestion: q.marksPerQuestion,
        })),
      };
      console.log(payload);
      const res = await paperAPI.generateQuestionPaper(payload);
      if (res.success) {
        sessionStorage.setItem(
          "paperBatchData",
          JSON.stringify(res.generated_papers)
        );
        setToast({
          open: true,
          message: "Paper Generated!",
          severity: "success",
        });
        navigate(`/paper/${res.generated_papers[0]._id}`);
      } else {
        throw new Error(res.message);
      }
    } catch (e) {
      setToast({ open: true, message: e.message, severity: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDER ---

  if (isLoading)
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  if (fetchError)
    return (
      <div className="text-red-500 text-center mt-10">Error: {fetchError}</div>
    );

  return (
    <Container maxWidth="lg" sx={{ py: 6, pb: 12 }}>
      {/* Title */}
      <Box textAlign="center" mb={5}>
        <Typography
          variant="h3"
          fontWeight="800"
          sx={{
            background: "linear-gradient(45deg, #3f51b5, #9c27b0)",
            backgroundClip: "text",
            color: "transparent",
            mb: 1,
          }}
        >
          Question Paper Builder
        </Typography>
        <Typography color="text.secondary">
          Create customized question papers with AI-powered generation
        </Typography>
      </Box>

      {/* Global Error */}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {errors.general}
        </Alert>
      )}

      {/* 1. Paper Details Form */}
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
        selectedHour={selectedHour}
        setSelectedHour={setSelectedHour}
        selectedMinute={selectedMinute}
        setSelectedMinute={setSelectedMinute}
        setShowDurationPicker={setShowDurationPicker}
        classOptions={classOptions}
        subjectOptions={subjectOptions}
        examTypeOptions={examTypeOptions}
        mainTopicOptions={dynamicTopics}
        isLoadingTopics={isLoadingTopics}
        errors={errors}
      />

      {/* 2. Questions List */}
      <QuestionsTable
        questions={questions}
        errors={errors}
        onUpdateQuestion={updateQuestion}
        onRemoveQuestion={removeQuestion}
        getSubjectTopics={getSubjectTopics}
        totalQuestions={questions.reduce((sum, q) => sum + q.numQuestions, 0)}
        totalMarks={questions.reduce(
          (sum, q) => sum + q.numQuestions * q.marksPerQuestion,
          0
        )}
      />

      {/* 3. Actions */}
      <Box display="flex" justifyContent="center" gap={3} mt={4}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<AddCircleOutline />}
          onClick={addQuestion}
          sx={{ borderStyle: "dashed", borderWidth: 2, px: 3 }}
        >
          Add Section
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleGenerateClick}
          disabled={isGenerating}
          startIcon={!isGenerating && <AutoAwesome />}
          sx={{
            px: 5,
            background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            boxShadow: 3,
          }}
        >
          {isGenerating ? "Generating..." : "Generate Paper"}
        </Button>
      </Box>

      {/* --- Modals & Overlays --- */}

      {/* Loading Overlay */}
      <Backdrop
        open={isGenerating}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">AI is crafting your exam paper...</Typography>
      </Backdrop>

      {/* Duration Modal */}
      <DurationPickerModal
        isOpen={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        selectedHour={selectedHour}
        onHourChange={setSelectedHour}
        selectedMinute={selectedMinute}
        onMinuteChange={setSelectedMinute}
      />

      {/* Feedback Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>

      {/* No Books Modal */}
      <Dialog
        open={showNoBooksModal}
        onClose={() => setShowNoBooksModal(false)}
      >
        <DialogTitle>No Books Found</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please upload books first to generate papers.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNoBooksModal(false)}>Cancel</Button>
          <Button onClick={() => navigate("/upload")} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

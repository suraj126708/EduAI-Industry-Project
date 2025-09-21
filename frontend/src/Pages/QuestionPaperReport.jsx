import React from "react";
import {
  Download,
  Award,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Target,
  BarChart3,
} from "lucide-react";

const ExamReport = () => {
  // Dummy data - replace with actual data from your backend
  const reportData = {
    student: {
      name: "Alex Johnson",
      rollNumber: "MT2024001",
      class: "Grade 10 - Mathematics",
      examDate: "2025-09-15",
    },
    exam: {
      title: "Unit Test - Algebra and Trigonometry",
      subject: "Mathematics",
      totalMarks: 25,
      duration: "90 minutes",
      examType: "Unit Test",
    },
    performance: {
      obtainedMarks: 18,
      percentage: 72,
      grade: "B+",
      rank: 5,
      totalStudents: 45,
    },
    questionAnalysis: [
      {
        qNo: 1,
        topic: "Linear Equations",
        maxMarks: 5,
        obtainedMarks: 5,
        userAnswer: "x = 3, y = 2",
        correctAnswer: "x = 3, y = 2",
        status: "correct",
        feedback:
          "Perfect solution with clear step-by-step approach. Excellent algebraic manipulation skills demonstrated.",
      },
      {
        qNo: 2,
        topic: "Quadratic Functions",
        maxMarks: 6,
        obtainedMarks: 4,
        userAnswer: "Roots: x = 2, x = -1, Vertex not calculated",
        correctAnswer: "Roots: x = 2, x = -1, Vertex: (-0.5, -2.25)",
        status: "partial",
        feedback:
          "Correctly found the roots using factorization method. However, missed calculating the vertex of the parabola. Need to practice vertex form conversions.",
      },
      {
        qNo: 3,
        topic: "Trigonometric Identities",
        maxMarks: 7,
        obtainedMarks: 5,
        userAnswer: "Used basic identities, calculation errors in final steps",
        correctAnswer: "sin²θ + cos²θ = 1, final answer: √3/2",
        status: "partial",
        feedback:
          "Good understanding of fundamental trigonometric identities. Minor computational errors in the final calculation steps. Practice more with fraction simplification.",
      },
      {
        qNo: 4,
        topic: "Logarithms",
        maxMarks: 4,
        obtainedMarks: 2,
        userAnswer: "Attempted using change of base, incomplete solution",
        correctAnswer: "log₂(8) = 3, using properties of logarithms",
        status: "needs_improvement",
        feedback:
          "Partial understanding of logarithmic properties. Struggled with change of base formula application. Recommend reviewing logarithm laws and practicing more examples.",
      },
      {
        qNo: 5,
        topic: "Probability",
        maxMarks: 3,
        obtainedMarks: 2,
        userAnswer: "P(A∩B) = 0.3, conditional probability not addressed",
        correctAnswer: "P(A∩B) = 0.3, P(A|B) = 0.6",
        status: "partial",
        feedback:
          "Correctly calculated joint probability. Need to work on conditional probability concepts and formulas.",
      },
    ],
    topicAnalysis: [
      {
        topic: "Linear Equations",
        strength: "strong",
        score: "100%",
        description:
          "Excellent mastery of linear equation solving. Strong algebraic manipulation skills and systematic approach to problem-solving.",
      },
      {
        topic: "Quadratic Functions",
        strength: "moderate",
        score: "67%",
        description:
          "Good grasp of basic quadratic concepts and root finding. Needs improvement in vertex calculations and graphical interpretations.",
      },
      {
        topic: "Trigonometric Identities",
        strength: "moderate",
        score: "71%",
        description:
          "Solid foundation in basic trigonometric identities. Minor computational errors affecting final results. Practice needed for complex identity manipulations.",
      },
      {
        topic: "Logarithms",
        strength: "weak",
        score: "50%",
        description:
          "Fundamental understanding present but application is inconsistent. Significant gaps in logarithmic properties and change of base formula usage.",
      },
      {
        topic: "Probability",
        strength: "moderate",
        score: "67%",
        description:
          "Basic probability concepts understood. Conditional probability requires additional focus and practice.",
      },
    ],
    recommendations: [
      "Focus on logarithmic properties and practice change of base formula applications",
      "Review conditional probability formulas and solve more word problems",
      "Practice vertex form conversions for quadratic functions",
      "Improve computational accuracy in trigonometric calculations",
      "Maintain strong performance in linear equations and apply similar systematic approaches to other topics",
    ],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "correct":
        return "text-green-600 bg-green-50";
      case "partial":
        return "text-yellow-600 bg-yellow-50";
      case "needs_improvement":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "correct":
        return <CheckCircle className="w-4 h-4" />;
      case "partial":
        return <AlertCircle className="w-4 h-4" />;
      case "needs_improvement":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case "strong":
        return "text-green-700 bg-green-100 border-green-200";
      case "moderate":
        return "text-blue-700 bg-blue-100 border-blue-200";
      case "weak":
        return "text-red-700 bg-red-100 border-red-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-4 print:bg-white">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-t-xl print:rounded-none">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                EDUAI Performance Report
              </h1>
              <p className="text-blue-100">
                Comprehensive Analysis & Evaluation
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors print:hidden"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">
                Student Information
              </h2>
              <div className="space-y-2 text-blue-100">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {reportData.student.name}
                </p>
                <p>
                  <span className="font-medium">Roll Number:</span>{" "}
                  {reportData.student.rollNumber}
                </p>
                <p>
                  <span className="font-medium">Class:</span>{" "}
                  {reportData.student.class}
                </p>
                <p>
                  <span className="font-medium">Exam Date:</span>{" "}
                  {reportData.student.examDate}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Exam Details</h2>
              <div className="space-y-2 text-blue-100">
                <p>
                  <span className="font-medium">Subject:</span>{" "}
                  {reportData.exam.subject}
                </p>
                <p>
                  <span className="font-medium">Test:</span>{" "}
                  {reportData.exam.title}
                </p>
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {reportData.exam.duration}
                </p>
                <p>
                  <span className="font-medium">Total Marks:</span>{" "}
                  {reportData.exam.totalMarks}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            Performance Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium">Score</p>
                  <p className="text-2xl font-bold text-green-700">
                    {reportData.performance.obtainedMarks}/
                    {reportData.exam.totalMarks}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium">Percentage</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {reportData.performance.percentage}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 font-medium">Grade</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {reportData.performance.grade}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 font-medium">Class Rank</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {reportData.performance.rank}/
                    {reportData.performance.totalStudents}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Question-wise Analysis */}
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Question-wise Analysis
          </h2>

          <div className="space-y-6">
            {reportData.questionAnalysis.map((q, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Question {q.qNo}: {q.topic}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Marks: {q.obtainedMarks}/{q.maxMarks}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      q.status
                    )}`}
                  >
                    {getStatusIcon(q.status)}
                    {q.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-medium text-gray-700 mb-2">
                      Your Answer:
                    </p>
                    <p className="text-gray-600 bg-white p-3 rounded-lg border">
                      {q.userAnswer}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-2">
                      Expected Answer:
                    </p>
                    <p className="text-gray-600 bg-white p-3 rounded-lg border">
                      {q.correctAnswer}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-2">
                    Feedback & Suggestions:
                  </p>
                  <p className="text-gray-600 leading-relaxed">{q.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic-wise Strength Analysis */}
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Topic-wise Strength Analysis
          </h2>

          <div className="space-y-4">
            {reportData.topicAnalysis.map((topic, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 border-2 ${getStrengthColor(
                  topic.strength
                )}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">{topic.topic}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{topic.score}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                        topic.strength === "strong"
                          ? "bg-green-200 text-green-800"
                          : topic.strength === "moderate"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {topic.strength}
                    </span>
                  </div>
                </div>
                <p className="leading-relaxed">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Recommendations for Improvement
          </h2>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <ul className="space-y-3">
              {reportData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{rec}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-6 rounded-b-xl print:rounded-none text-center text-sm text-gray-600">
          <p>
            Generated by EDUAI - Intelligent Assessment Platform | Report Date:{" "}
            {new Date().toLocaleDateString()}
          </p>
          <p className="mt-1">
            This report provides comprehensive analysis based on AI-powered
            evaluation of your answer sheet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamReport;

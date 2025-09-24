import React, { useState } from "react";

// Simple icon components to replace lucide-react icons
const Download = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Award = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const TrendingUp = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const AlertCircle = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircle = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Clock = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookOpen = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const Target = ({ className = "w-8 h-8" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
  </svg>
);

const BarChart3 = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// Dummy test data
const testRecords = [
  {
    class: "10",
    division: "A",
   
    students: [
      { name: "Alex Johnson", rollNumber: "3" },
      { name: "Sara Lee", rollNumber: "5" },
      { name: "Rahul Mehta", rollNumber: "8" },
    ],
  },
  {
    class: "10",
    division: "B",
    testType: "Mid Term",
    students: [
      { name: "Priya Singh", rollNumber: "7" },
      { name: "Rohan Gupta", rollNumber: "11" },
    ],
  },
  {
    class: "9",
    division: "A",
    testType: "Final",
    students: [
      { name: "Amit Patel", rollNumber: "13" },
      { name: "Neha Sharma", rollNumber: "14" },
    ],
  },
];

const students = [
  { name: "Alex Johnson", rollNumber: "3", class: "10", division: "A" },
  { name: "Sara Lee", rollNumber: "5", class: "10", division: "A" },
  { name: "Rahul Mehta", rollNumber: "8", class: "10", division: "A" },
  { name: "Priya Singh", rollNumber: "7", class: "10", division: "B" },
  { name: "Rohan Gupta", rollNumber: "11", class: "10", division: "B" },
  { name: "Amit Patel", rollNumber: "13", class: "9", division: "A" },
  { name: "Neha Sharma", rollNumber: "14", class: "9", division: "A" },
];

const classOptions = ["9", "10"];
const divisionOptions = ["A", "B"];
const subjectOptions = ["Science", "Math", "English"];
const reportTypeOptions = ["Subject Wise", "Mid Term", "Final"];

// Hardcoded reports for demonstration
const allSubjectsReport = {
  "Mid Term": [
    { subject: "Science", marks: 38, total: 50, grade: "B+" },
    { subject: "Math", marks: 42, total: 50, grade: "A" },
    { subject: "English", marks: 35, total: 50, grade: "B" },
  ],
  "Final": [
    { subject: "Science", marks: 45, total: 50, grade: "A+" },
    { subject: "Math", marks: 40, total: 50, grade: "A" },
    { subject: "English", marks: 39, total: 50, grade: "B+" },
  ],
};

const subjectWiseReports = {
  Science: {
    obtainedMarks: 45,
    totalMarks: 50,
    percentage: 90,
    grade: "A+",
    strengths: ["Excellent in Natural Phenomena", "Good in Living Things"],
    weaknesses: ["Needs work on Materials and Substances"],
    recommendations: [
      "Revise Materials and Substances chapter.",
      "Practice more scientific terminology.",
    ],
    topicAnalysis: [
      {
        topic: "Natural Phenomena",
        score: "9/10",
        strength: "strong",
        description: "Excellent grasp of concepts.",
      },
      {
        topic: "Living Things",
        score: "8/10",
        strength: "moderate",
        description: "Good understanding, can improve with more practice.",
      },
      {
        topic: "Materials and Substances",
        score: "5/10",
        strength: "weak",
        description: "Needs revision of key facts and properties.",
      },
    ],
  },
  Math: {
    obtainedMarks: 40,
    totalMarks: 50,
    percentage: 80,
    grade: "A",
    strengths: ["Strong in Algebra", "Good in Geometry"],
    weaknesses: ["Needs work on Statistics"],
    recommendations: [
      "Revise Statistics concepts.",
      "Solve more practice problems.",
    ],
    topicAnalysis: [
      {
        topic: "Algebra",
        score: "8/10",
        strength: "strong",
        description: "Consistently solves algebraic problems.",
      },
      {
        topic: "Geometry",
        score: "7/10",
        strength: "moderate",
        description: "Good spatial reasoning, can improve accuracy.",
      },
      {
        topic: "Statistics",
        score: "5/10",
        strength: "weak",
        description: "Needs more practice with data interpretation.",
      },
    ],
  },
  English: {
    obtainedMarks: 39,
    totalMarks: 50,
    percentage: 78,
    grade: "B+",
    strengths: ["Good in Grammar", "Strong in Reading Comprehension"],
    weaknesses: ["Needs work on Essay Writing"],
    recommendations: [
      "Practice essay writing.",
      "Expand vocabulary.",
    ],
    topicAnalysis: [
      {
        topic: "Grammar",
        score: "8/10",
        strength: "strong",
        description: "Grammar usage is accurate.",
      },
      {
        topic: "Reading Comprehension",
        score: "7/10",
        strength: "moderate",
        description: "Understands passages well, can improve speed.",
      },
      {
        topic: "Essay Writing",
        score: "4/10",
        strength: "weak",
        description: "Needs to organize ideas and use richer vocabulary.",
      },
    ],
  },
};

const getDummyReportData = (student, selectedClass, selectedDivision, selectedTestType) => ({
  student: {
    name: student.name,
    rollNumber: student.rollNumber,
    class: selectedClass,
    division: selectedDivision,
    examDate: "2025-09-22",
  },
  exam: {
    subject: "Science",
    title: selectedTestType,
    duration: "2 hr",
    totalMarks: 50,
  },
  performance: {
    obtainedMarks: 38,
    percentage: 76,
    grade: "B+",
    rank: 5,
    totalStudents: 30,
  },
  questionAnalysis: [
    {
      qNo: 1,
      topic: "Living Things",
      obtainedMarks: 2,
      maxMarks: 3,
      status: "good",
      userAnswer: "Plants make their own food.",
      correctAnswer: "Plants are autotrophs.",
      feedback: "Good understanding, but use scientific terms.",
    },
    {
      qNo: 2,
      topic: "Materials and Substances",
      obtainedMarks: 1,
      maxMarks: 2,
      status: "needs_work",
      userAnswer: "Water boils at 90°C.",
      correctAnswer: "Water boils at 100°C.",
      feedback: "Revise boiling points of substances.",
    },
    {
      qNo: 3,
      topic: "Natural Phenomena",
      obtainedMarks: 2,
      maxMarks: 2,
      status: "excellent",
      userAnswer: "Lightning is caused by electric discharge.",
      correctAnswer: "Lightning is caused by electric discharge.",
      feedback: "Excellent answer.",
    },
  ],
  topicAnalysis: [
    {
      topic: "Living Things",
      score: "7/10",
      strength: "moderate",
      description: "Basic concepts are clear. Practice scientific terminology for better scores.",
    },
    {
      topic: "Materials and Substances",
      score: "5/10",
      strength: "weak",
      description: "Needs revision of key facts and properties.",
    },
    {
      topic: "Natural Phenomena",
      score: "9/10",
      strength: "strong",
      description: "Excellent grasp of concepts.",
    },
  ],
  recommendations: [
    "Revise boiling points and physical properties of substances.",
    "Use more scientific terms in answers.",
    "Continue practicing Natural Phenomena topics.",
  ],
});

// Helper functions for styling
const getStatusColor = (status) => {
  switch (status) {
    case "excellent":
      return "bg-green-100 text-green-800 border-green-200";
    case "good":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "needs_work":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "excellent":
      return <CheckCircle className="w-4 h-4" />;
    case "good":
      return <Clock className="w-4 h-4" />;
    case "needs_work":
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

const getStrengthColor = (strength) => {
  switch (strength) {
    case "strong":
      return "bg-green-50 border-green-200 text-green-800";
    case "moderate":
      return "bg-blue-50 border-blue-200 text-blue-800";
    case "weak":
      return "bg-red-50 border-red-200 text-red-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800";
  }
};

export default function ExamReport() {
  // Selection states
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedReportType, setSelectedReportType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchRollNo, setSearchRollNo] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  // Filter students based on selection
  const filteredStudents = students.filter((s) =>
    (!selectedClass || s.class === selectedClass) &&
    (!selectedDivision || s.division === selectedDivision) &&
    (!searchRollNo || s.rollNumber.includes(searchRollNo)) &&
    (!searchName || s.name.toLowerCase().includes(searchName.toLowerCase()))
  );

  // Handle student selection
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  // Handle back to selection
  const handleBackToSelection = () => {
    setSelectedStudent(null);
    setSelectedSubject("");
    setSelectedReportType("");
  };

  // Handle download
  const handleDownload = () => {
    window.print();
  };

  // Selection page
  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Select Student for Report
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">All</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">All</option>
                {divisionOptions.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Report Type</label>
              <select
                value={selectedReportType}
                onChange={(e) => {
                  setSelectedReportType(e.target.value);
                  setSelectedSubject("");
                }}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select</option>
                {reportTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {selectedReportType === "Subject Wise" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                >
                  <option value="">Select</option>
                  {subjectOptions.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Roll No</label>
              <input
                type="text"
                value={searchRollNo}
                onChange={(e) => setSearchRollNo(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                placeholder="Roll Number"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                placeholder="Student Name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                min={2000}
                max={2100}
                placeholder="Year"
              />
            </div>
          </div>
          <div>
            {filteredStudents.length === 0 ? (
              <div className="text-gray-500 text-center">No students found.</div>
            ) : (
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Class</th>
                    <th className="p-2 border">Division</th>
                    <th className="p-2 border">Roll No</th>
                    <th className="p-2 border"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border">{s.name}</td>
                      <td className="p-2 border">{s.class}</td>
                      <td className="p-2 border">{s.division}</td>
                      <td className="p-2 border">{s.rollNumber}</td>
                      <td className="p-2 border">
                        <button
                          className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
                          onClick={() => handleSelectStudent(s)}
                          disabled={
                            !selectedReportType ||
                            (selectedReportType === "Subject Wise" && !selectedSubject)
                          }
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            * Please select report type (and subject if subject wise) before viewing report.
          </div>
        </div>
      </div>
    );
  }

  // Report page
  if (selectedReportType === "Subject Wise" && selectedSubject) {
    const report = subjectWiseReports[selectedSubject];
    return (
      <div className="min-h-screen bg-gray-50 p-8 print:p-4 print:bg-white">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg print:shadow-none print:rounded-none">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-t-xl print:rounded-none">
            <h1 className="text-2xl font-bold mb-2">Subject Wise Report</h1>
            <div className="mt-2">
              <span className="font-medium">Year:</span> {year} <br />
              <span className="font-medium">Student:</span> {selectedStudent.name} | 
              <span className="font-medium">Class:</span> {selectedStudent.class}-{selectedStudent.division} | 
              <span className="font-medium">Roll No:</span> {selectedStudent.rollNumber}
            </div>
            <div className="mt-2">
              <span className="font-medium">Subject:</span> {selectedSubject}
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <p className="text-blue-600 font-medium">Marks</p>
                <p className="text-2xl font-bold text-blue-700">{report.obtainedMarks}/{report.totalMarks}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <p className="text-green-600 font-medium">Percentage</p>
                <p className="text-2xl font-bold text-green-700">{report.percentage}%</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="font-semibold text-gray-700">Grade: <span className="text-lg text-indigo-700 font-bold">{report.grade}</span></p>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Strengths</h3>
              <ul className="list-disc ml-6 text-green-700">
                {report.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Weaknesses</h3>
              <ul className="list-disc ml-6 text-red-700">
                {report.weaknesses.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
              <ul className="list-disc ml-6 text-gray-700">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
          {/* Topic Wise Analysis */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4 text-indigo-700">Topic Wise Analysis</h3>
            <div className="space-y-4">
              {report.topicAnalysis.map((topic, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-4 border-2 ${getStrengthColor(topic.strength)}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{topic.topic}</span>
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
                  <div className="mt-2 text-gray-700">
                    <span className="font-semibold">Score:</span> {topic.score}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{topic.description}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-100 p-6 rounded-b-xl print:rounded-none text-center text-sm text-gray-600">
            <button
              onClick={handleBackToSelection}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors print:hidden mb-2"
            >
              ← Back to Selection
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors print:hidden"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
            <p className="mt-2">
              Generated by EDUAI | Subject Wise report format
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedReportType === "Mid Term" || selectedReportType === "Final") {
    const reportArr = allSubjectsReport[selectedReportType];
    return (
      <div className="min-h-screen bg-gray-50 p-8 print:p-4 print:bg-white">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg print:shadow-none print:rounded-none">
          <div className="bg-gradient-to-r from-green-600 to-blue-700 text-white p-8 rounded-t-xl print:rounded-none">
            <h1 className="text-2xl font-bold mb-2">{selectedReportType} Report</h1>
            <div className="mt-2">
              <span className="font-medium">Year:</span> {year} <br />
              <span className="font-medium">Student:</span> {selectedStudent.name} | 
              <span className="font-medium">Class:</span> {selectedStudent.class}-{selectedStudent.division} | 
              <span className="font-medium">Roll No:</span> {selectedStudent.rollNumber}
            </div>
          </div>
          <div className="p-8">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Subject Summary</h2>
            <table className="w-full border mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Subject</th>
                  <th className="p-2 border">Marks</th>
                  <th className="p-2 border">Grade</th>
                </tr>
              </thead>
              <tbody>
                {reportArr.map((r, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">{r.subject}</td>
                    <td className="p-2 border">{r.marks}/{r.total}</td>
                    <td className="p-2 border">{r.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <h3 className="text-lg font-semibold mb-2">General Recommendations</h3>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Revise weak subjects before next exam.</li>
                <li>Practice time management during tests.</li>
                <li>Consult teachers for doubts in difficult topics.</li>
              </ul>
            </div>
          </div>
          <div className="bg-gray-100 p-6 rounded-b-xl print:rounded-none text-center text-sm text-gray-600">
            <button
              onClick={handleBackToSelection}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors print:hidden mb-2"
            >
              ← Back to Selection
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors print:hidden"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
            <p className="mt-2">
              Generated by EDUAI | {selectedReportType} report format
            </p>
          </div>
        </div>
      </div>
    );
  }
}
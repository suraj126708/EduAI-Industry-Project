// Pages/ReportGeneration.jsx
import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4F46E5", "#F59E0B", "#10B981", "#EF4444"];

const classOptions = ["5", "6", "7", "8", "9", "10"];
const divisionOptions = ["A", "B", "C"];

// Dummy students data
const students = [
  { name: "John Doe", class: "10", division: "A", rollNo: "23" },
  { name: "Priya Singh", class: "9", division: "B", rollNo: "12" },
  { name: "Amit Patel", class: "8", division: "C", rollNo: "7" },
];

// Dummy reports data for each student
const studentReports = {
  "John Doe": [
    { subject: "Science", exam: "Mid Term", score: 78, total: 100 },
    { subject: "Math", exam: "Mid Term", score: 85, total: 100 },
    { subject: "English", exam: "Mid Term", score: 72, total: 100 },
    { subject: "Science", exam: "Final", score: 88, total: 100 },
    { subject: "Math", exam: "Final", score: 90, total: 100 },
    { subject: "English", exam: "Final", score: 80, total: 100 },
  ],
  "Priya Singh": [
    { subject: "Science", exam: "Mid Term", score: 65, total: 100 },
    { subject: "Math", exam: "Mid Term", score: 70, total: 100 },
    { subject: "English", exam: "Mid Term", score: 60, total: 100 },
    { subject: "Science", exam: "Final", score: 75, total: 100 },
    { subject: "Math", exam: "Final", score: 80, total: 100 },
    { subject: "English", exam: "Final", score: 68, total: 100 },
  ],
  "Amit Patel": [
    { subject: "Science", exam: "Mid Term", score: 55, total: 100 },
    { subject: "Math", exam: "Mid Term", score: 60, total: 100 },
    { subject: "English", exam: "Mid Term", score: 58, total: 100 },
    { subject: "Science", exam: "Final", score: 65, total: 100 },
    { subject: "Math", exam: "Final", score: 70, total: 100 },
    { subject: "English", exam: "Final", score: 62, total: 100 },
  ],
};

const ReportGeneration = () => {
  // Search page state
  const [searchClass, setSearchClass] = useState("");
  const [searchDivision, setSearchDivision] = useState("");
  const [searchRollNo, setSearchRollNo] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filteredStudents, setFilteredStudents] = useState(students);

  // Report page state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("overall");

  // Filter students when search fields change
  useEffect(() => {
    let filtered = students.filter((s) => {
      return (
        (!searchClass || s.class === searchClass) &&
        (!searchDivision || s.division === searchDivision) &&
        (!searchRollNo || s.rollNo === searchRollNo) &&
        (!searchName ||
          s.name.toLowerCase().includes(searchName.toLowerCase()))
      );
    });
    setFilteredStudents(filtered);
  }, [searchClass, searchDivision, searchRollNo, searchName]);

  // Get reports for selected student
  const reports = selectedStudent ? studentReports[selectedStudent.name] || [] : [];

  const averageScore =
    reports.length > 0
      ? (reports.reduce((acc, r) => acc + r.score, 0) / reports.length).toFixed(2)
      : 0;

  // Exams list for tabs
  const examNames = Array.from(new Set(reports.map((r) => r.exam)));

  // --- First: Student Search Page ---
  if (!selectedStudent) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Class</label>
            <select
              value={searchClass}
              onChange={(e) => setSearchClass(e.target.value)}
              className="border px-3 py-2 rounded w-24"
            >
              <option value="">Select</option>
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Division</label>
            <select
              value={searchDivision}
              onChange={(e) => setSearchDivision(e.target.value)}
              className="border px-3 py-2 rounded w-24"
            >
              <option value="">Select</option>
              {divisionOptions.map((div) => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Roll No</label>
            <input
              type="number"
              value={searchRollNo}
              onChange={(e) => setSearchRollNo(e.target.value)}
              className="border px-3 py-2 rounded w-24"
              placeholder="Roll No"
              min={1}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="border px-3 py-2 rounded w-32"
              placeholder="Student Name"
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Select Student</h2>
          {filteredStudents.length === 0 ? (
            <div className="text-gray-500">No students found.</div>
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
                    <td className="p-2 border">{s.rollNo}</td>
                    <td className="p-2 border">
                      <button
                        className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
                        onClick={() => setSelectedStudent(s)}
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
      </div>
    );
  }

  // --- Second: Student Report Page ---
  return (
    <div className="p-6">
      {/* Student Info Card */}
      <div className="bg-indigo-600 text-white rounded-xl p-6 mb-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Reports</h1>
          <p className="text-sm mt-2">
            Name: {selectedStudent.name} | Class: {selectedStudent.class} | Division: {selectedStudent.division} | Roll No: {selectedStudent.rollNo}
          </p>
        </div>
        <button
          className="bg-white text-indigo-600 px-4 py-2 rounded shadow hover:bg-gray-100"
          onClick={() => setSelectedStudent(null)}
        >
          Search Another Student
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {["overall", "subject", ...examNames].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {tab === "overall"
              ? "Overall Report"
              : tab === "subject"
              ? "Per Subject"
              : tab}
          </button>
        ))}
      </div>

      {/* Overall Report */}
      {activeTab === "overall" && (
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Overall Report
          </h2>
          <p>
            Total Exams: {reports.length} | Average Score: {averageScore}%
          </p>
          <div className="mt-6 space-y-4">
            {/* Group by subject */}
            {Array.from(new Set(reports.map(r => r.subject))).map(subject => {
              const subjectReports = reports.filter(r => r.subject === subject);
              const avg = subjectReports.length
                ? subjectReports.reduce((acc, r) => acc + r.score, 0) / subjectReports.length
                : 0;
              let status = "Good";
              let statusColor = "bg-green-100 text-green-800";
              if (avg < 60) {
                status = "Needs Work";
                statusColor = "bg-red-100 text-red-800";
              } else if (avg < 75) {
                status = "Average";
                statusColor = "bg-yellow-100 text-yellow-800";
              }
              return (
                <div key={subject} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between bg-gray-50">
                  <div>
                    <div className="text-lg font-bold text-indigo-700">{subject}</div>
                    <div className="text-sm text-gray-600">
                      Exams: {subjectReports.map(r => r.exam).join(", ")}
                    </div>
                    <div className="mt-2 text-gray-700">
                      Average Score: <span className="font-semibold">{avg.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className={`mt-3 md:mt-0 px-4 py-2 rounded-lg font-semibold ${statusColor}`}>
                    {status}
                  </div>
                  <div className="mt-2 md:mt-0 md:ml-6 text-sm text-gray-500">
                    {status === "Needs Work" && "Student should focus more on this subject and revise weak topics."}
                    {status === "Average" && "Performance is average. More practice can help improve."}
                    {status === "Good" && "Performance is good. Keep up the good work!"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per Subject Report */}
      {activeTab === "subject" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reports.map((r, idx) => (
            <div
              key={idx}
              className="bg-white border rounded-lg shadow-md p-4 hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold text-indigo-600">
                {r.subject} ({r.exam})
              </h3>
              <p>
                Score: {r.score}/{r.total}
              </p>
              <p>Percentage: {((r.score / r.total) * 100).toFixed(2)}%</p>
              <div className="h-40 mt-4">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Obtained", value: r.score },
                        { name: "Remaining", value: r.total - r.score },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {COLORS.map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per Exam Report (Mid, Final, etc) */}
      {examNames.includes(activeTab) && (
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {activeTab} Report
          </h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Marks</th>
                <th className="p-2 border">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {reports
                .filter((r) => r.exam === activeTab)
                .map((r, i) => (
                  <tr key={i}>
                    <td className="p-2 border">{r.subject}</td>
                    <td className="p-2 border">
                      {r.score}/{r.total}
                    </td>
                    <td className="p-2 border">
                      {((r.score / r.total) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportGeneration;

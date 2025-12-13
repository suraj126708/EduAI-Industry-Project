import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // To get ID from URL
import { evaluationAPI } from "../../utils/api"; // To fetch data
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
} from "recharts";
import {
  Download,
  Calendar,
  User,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Helper to color codes based on score
const getScoreColor = (score) => {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
};

const SemesterReport = () => {
  const { id } = useParams(); // 1. Get ID from URL
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 2. Fetch Data on Mount
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await evaluationAPI.getSemesterReportById(id);
        if (res.success) {
          setReportData(res.data);
        } else {
          setError(res.message || "Failed to load report");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading report data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReport();
  }, [id]);

  // 3. Loading & Error States
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600 font-medium">Generating Analytics...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800">Report Not Found</h3>
          <p className="text-gray-500 mt-2">
            {error || "The requested report could not be retrieved."}
          </p>
        </div>
      </div>
    );
  }

  // 4. Destructure Data (Mapping DB Model to UI)
  // Note: Adjusting variable names to match your DB Schema
  const { studentId: student, period, aiInsights, examHistory } = reportData;

  // Prepare Data for Charts
  const subjectData = aiInsights.subjectAnalysis;
  const skillData = aiInsights.skillAnalysis;

  // Trend Data for Line Chart
  // We reverse array if needed so trend goes left-to-right chronologically
  const trendData = [...examHistory].map((ev, index) => ({
    name: ev.subject, // Or `Exam ${index+1}`
    percentage: ev.percentage.toFixed(1),
    date: new Date(ev.date).toLocaleDateString(),
  }));

  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans print:bg-white print:p-0">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100 flex justify-between items-start print:shadow-none print:border-b-2 print:border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Student Semester Report
          </h1>
          <div className="flex gap-6 text-gray-600 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>
                Class {student.class} - {student.division || "A"} (Roll:{" "}
                {student.rollNo})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>
                {new Date(period.startDate).toLocaleDateString()} -{" "}
                {new Date(period.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">
            Overall Grade
          </div>
          <div className="text-4xl font-extrabold text-indigo-600">
            {aiInsights.overallGrade}
          </div>
          <button
            onClick={() => window.print()}
            className="mt-4 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition print:hidden shadow-sm text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border-l-4 border-indigo-600 print:shadow-none print:border print:border-gray-300">
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          Executive Summary
        </h2>
        <p className="text-gray-700 leading-relaxed text-lg italic">
          "{aiInsights.summary}"
        </p>
      </div>

      {/* Analytical Dashboard (Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:block print:space-y-8">
        {/* Subject Proficiency (Bar Chart) */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 print:break-inside-avoid">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Subject Proficiency
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectData}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  dataKey="subject"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [`${value}%`, "Score"]}
                />
                <Bar
                  dataKey="score"
                  fill="#4f46e5"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  name="Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Analysis (Radar Chart) */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 print:break-inside-avoid">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Skill Competency Analysis
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#4b5563", fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Student"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Subject Insights Table */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100 print:break-inside-avoid">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          Detailed Subject Insights
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-3 px-4 font-semibold text-gray-600 rounded-tl-lg">
                  Subject
                </th>
                <th className="py-3 px-4 font-semibold text-gray-600">
                  Performance
                </th>
                <th className="py-3 px-4 font-semibold text-gray-600">Level</th>
                <th className="py-3 px-4 font-semibold text-gray-600 w-1/2 rounded-tr-lg">
                  AI Insight
                </th>
              </tr>
            </thead>
            <tbody>
              {subjectData.map((sub, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4 font-medium text-gray-800">
                    {sub.subject}
                  </td>
                  <td
                    className={`py-4 px-4 font-bold ${getScoreColor(
                      sub.score
                    )}`}
                  >
                    {sub.score}%
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold 
                      ${
                        sub.proficiency === "Advanced" ||
                        sub.proficiency === "Expert"
                          ? "bg-green-100 text-green-700"
                          : sub.proficiency === "Intermediate"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {sub.proficiency}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-sm leading-relaxed">
                    {sub.insight}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Trend (Line Chart) */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100 print:break-inside-avoid">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          Performance Trajectory
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[0, 100]} stroke="#9ca3af" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#ec4899"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ec4899" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:block print:space-y-8">
        <div className="bg-green-50 rounded-xl p-8 border border-green-100 print:break-inside-avoid">
          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            🌟 Key Highlights
          </h3>
          <ul className="space-y-3">
            {aiInsights.highlights.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-green-800 text-sm"
              >
                <span className="mt-1.5 w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 rounded-xl p-8 border border-blue-100 print:break-inside-avoid">
          <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
            🚀 Action Plan for Improvement
          </h3>
          <ul className="space-y-3">
            {aiInsights.weaknesses.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-blue-800 text-sm"
              >
                <span className="mt-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400 text-xs border-t pt-6">
        Generated by EduAI Analytics Engine • {new Date().toLocaleDateString()}{" "}
        • {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SemesterReport;

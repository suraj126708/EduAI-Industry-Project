import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

const student = {
  name: "Alex Johnson",
  rollNumber: "3",
  class: "10",
  division: "A",
};

const year = 2025;
const subject = "History (SSC)";
const examDetails = {
  title: "Mid-Term Examination",
  date: "2025-09-22",
  duration: "2 hr",
  totalMarks: 50,
};

const performance = {
  obtainedMarks: 42,
  percentage: 84,
  grade: "A",
};

const chapters = [
  {
    chapter: "Historiography (West)",
    score: 7,
    strength: "Understands evolution of historical writing in Europe.",
    improvement: "Revise Enlightenment period contributions and key thinkers.",
  },
  {
    chapter: "Historiography (India)",
    score: 8,
    strength: "Explains Indian historiographical traditions clearly.",
    improvement: "Add more regional examples and Persian chroniclers.",
  },
  {
    chapter: "Applied History",
    score: 6,
    strength: "Understands the concept and can connect with social studies.",
    improvement: "Use real-world case studies like heritage conservation.",
  },
  {
    chapter: "History of Indian Arts",
    score: 9,
    strength: "Strong knowledge of art evolution from ancient to modern times.",
    improvement: "Include timeline references for better scoring.",
  },
  {
    chapter: "Mass Media and History",
    score: 5,
    strength: "Understands role of media in history.",
    improvement: "Add examples like 'Kesari' and 'Young India'.",
  },
  {
    chapter: "Entertainment and History",
    score: 7,
    strength: "Answers include cinema and theatre examples.",
    improvement: "Revise evolution timeline of Marathi theatre and cinema.",
  },
];

// Calculate statistics from chapter scores
const avgChapterScore = (chapters.reduce((sum, ch) => sum + ch.score, 0) / chapters.length).toFixed(1);
const highestChapter = chapters.reduce((prev, curr) => curr.score > prev.score ? curr : prev);
const lowestChapter = chapters.reduce((prev, curr) => curr.score < prev.score ? curr : prev);

const sectionMarks = [
  { name: "MCQ", value: 12, max: 15, percentage: 80 },
  { name: "Short Answer", value: 18, max: 20, percentage: 90 },
  { name: "Long Answer", value: 12, max: 15, percentage: 80 },
];

// Performance trend data (simulated chapter-wise cumulative)
const performanceTrend = chapters.map((ch, idx) => ({
  chapter: ch.chapter.split(' ').slice(0, 2).join(' '),
  score: ch.score,
  average: 7,
}));

const COLORS = ["#6366f1", "#22d3ee", "#f59e42"];

export default function ExamReport() {
  const [selected, setSelected] = useState(null);

  // Calculate total chapter score
  const totalChapterScore = chapters.reduce((sum, ch) => sum + ch.score, 0);

  return (
    <div
      style={{
        background: "#f8fafc",
        padding: "40px",
        maxWidth: 800,
        margin: "40px auto",
        fontFamily: "'Poppins', sans-serif",
        color: "#1e293b",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#1d4ed8" }}>
          📘 Subject Report: {subject}
        </h1>
        <p style={{ color: "#475569" }}>
          Academic Year {year} | {examDetails.title}
        </p>
      </header>

      {/* Exam & Student Info */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={cardStyle}>
          <h2 style={cardTitle}>🧾 Exam Details</h2>
          <p>Exam: {examDetails.title}</p>
          <p>Date: {examDetails.date}</p>
          <p>Duration: {examDetails.duration}</p>
          <p>Total Marks: {examDetails.totalMarks}</p>
        </div>
        <div style={cardStyle}>
          <h2 style={cardTitle}>👩‍🎓 Student Info</h2>
          <p>Name: {student.name}</p>
          <p>Class: {student.class}-{student.division}</p>
          <p>Roll No: {student.rollNumber}</p>
        </div>
      </section>

      {/* Performance & Visualization */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>📊 Performance Summary</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <div style={statBox}>
            <div style={statLabel}>Marks Obtained</div>
            <div style={statValue}>{performance.obtainedMarks}/{examDetails.totalMarks}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Percentage</div>
            <div style={statValue}>{performance.percentage}%</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Grade</div>
            <div style={statValue}>{performance.grade}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Avg Chapter Score</div>
            <div style={statValue}>{avgChapterScore}/10</div>
          </div>
        </div>

        <div style={{ margin: "20px 0" }}>
          <div style={{ fontSize: "0.98rem", marginBottom: 8, fontWeight: "600" }}>Overall Performance</div>
          <div style={{ background: "#e5e7eb", borderRadius: 8, height: 28, width: "100%", position: "relative" }}>
            <div
              style={{
                background: performance.percentage >= 75 ? "#22c55e" : performance.percentage >= 60 ? "#eab308" : "#ef4444",
                width: `${performance.percentage}%`,
                height: "100%",
                borderRadius: 8,
                transition: "width 0.8s ease-out",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: "translateX(-50%)",
                color: "#1e293b",
                fontWeight: 700,
                fontSize: "0.95rem",
                lineHeight: "28px",
              }}
            >
              {performance.percentage}%
            </span>
          </div>
        </div>
      </section>

      {/* Chapter-wise Performance */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>📚 Chapter-wise Analysis</h2>
        <div style={{ marginBottom: 16, padding: "12px", background: "#f1f5f9", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span><strong>Highest:</strong> {highestChapter.chapter} ({highestChapter.score}/10)</span>
            <span><strong>Lowest:</strong> {lowestChapter.chapter} ({lowestChapter.score}/10)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chapters}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="chapter" 
              tick={{ fontSize: 11 }} 
              interval={0} 
              angle={-25} 
              textAnchor="end"
              height={80}
            />
            <YAxis domain={[0, 10]} label={{ value: 'Score (out of 10)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
            <Tooltip 
              contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
            />
            <Bar
              dataKey="score"
              fill="#6366f1"
              radius={[8, 8, 0, 0]}
              onClick={(data, index) => setSelected(chapters[index])}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: "0.85rem", color: "#64748b", textAlign: "center", marginTop: "8px" }}>
          Click any bar to view detailed strengths & improvements
        </p>
      </section>

      {/* Section-wise Performance */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>📝 Section-wise Breakdown</h2>
        <div style={{ marginBottom: 20 }}>
          {sectionMarks.map((section, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.95rem" }}>
                <span><strong>{section.name}</strong></span>
                <span>{section.value}/{section.max} ({section.percentage}%)</span>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: 6, height: 20, width: "100%" }}>
                <div
                  style={{
                    background: COLORS[idx],
                    width: `${section.percentage}%`,
                    height: "100%",
                    borderRadius: 6,
                    transition: "width 0.6s ease-out",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
      </section>

      {/* Insights */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>💡 Key Insights & Recommendations</h2>
        <div style={{ fontSize: "0.95rem", color: "#334155", lineHeight: "1.7" }}>
          <div style={{ marginBottom: 16, padding: "12px", background: "#ecfdf5", borderLeft: "4px solid #22c55e", borderRadius: "6px" }}>
            <strong>✓ Strengths:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>Excellent performance in "History of Indian Arts" (9/10) showing deep understanding of art evolution</li>
              <li>Strong grasp of Indian historiographical traditions (8/10)</li>
              <li>Consistent performance across different question types with 90% in short answers</li>
            </ul>
          </div>
          <div style={{ marginBottom: 16, padding: "12px", background: "#fef3c7", borderLeft: "4px solid #eab308", borderRadius: "6px" }}>
            <strong>⚠ Areas for Improvement:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>"Mass Media and History" needs significant work (5/10) - focus on historical newspapers and their impact</li>
              <li>"Applied History" requires more real-world case studies and practical applications</li>
              <li>Add specific examples and dates to boost scores in weaker chapters</li>
            </ul>
          </div>
          <div style={{ padding: "12px", background: "#eff6ff", borderLeft: "4px solid #3b82f6", borderRadius: "6px" }}>
            <strong>📌 Action Plan:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>Dedicate extra study time to "Mass Media and History" with focus on Indian freedom struggle newspapers</li>
              <li>Create timeline charts for entertainment history and media evolution</li>
              <li>Practice more long-answer questions to improve from 80% to 90%+</li>
              <li>Maintain strong performance in art and historiography while strengthening application-based chapters</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Modal for chapter feedback */}
      {selected && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: "#1d4ed8", fontWeight: "600" }}>
              {selected.chapter}
            </h3>
            <p>
              <strong>Strength:</strong> {selected.strength}
            </p>
            <p>
              <strong>Needs Improvement:</strong> {selected.improvement}
            </p>
            <button
              style={closeButton}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <footer
        style={{
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.9rem",
          marginTop: 32,
        }}
      >
        Generated by <strong>EDUAI</strong>
      </footer>
    </div>
  );
}

// Shared styles
const cardStyle = {
  background: "#ffffff",
  padding: "16px 20px",
  borderRadius: "10px",
  flex: 1,
  minWidth: "260px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  marginBottom: "16px",
};

const cardTitle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  marginBottom: 8,
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContent = {
  background: "#fff",
  padding: "24px 30px",
  borderRadius: "12px",
  maxWidth: "400px",
  textAlign: "center",
  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
};

const closeButton = {
  marginTop: "16px",
  background: "#1d4ed8",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 20px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.95rem",
};

const statBox = {
  background: "#f8fafc",
  padding: "12px",
  borderRadius: "8px",
  textAlign: "center",
  border: "1px solid #e2e8f0",
};

const statLabel = {
  fontSize: "0.85rem",
  color: "#64748b",
  marginBottom: 4,
};

const statValue = {
  fontSize: "1.3rem",
  fontWeight: "700",
  color: "#1e293b",
};
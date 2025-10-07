import React from "react";

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

const strengths = [
  "Shows deep interest in historical events and their causes",
  "Good understanding of Indian freedom struggle chronology",
  "Writes coherent and structured long answers",
  "Uses appropriate historical terminology",
];

const weaknesses = [
  "Needs improvement in remembering dates of movements",
  "Tends to skip short factual answers",
  "Should improve map-based identification skills",
];

const recommendations = [
  "Revise all important years and leaders’ contributions from each chapter.",
  "Practice writing concise factual answers.",
  "Review map-based questions regularly.",
  "Prepare flashcards for key events and reformers.",
  "Engage in peer discussions to reinforce historical connections.",
];

const chapters = [
  {
    chapter: "1. Historiography: Development in the West",
    score: "7/10",
    understanding: "Good",
    description:
      "Understands the evolution of historical writing in Europe. Can explain key thinkers like Herodotus and Voltaire but sometimes confuses Renaissance and Enlightenment ideas.",
    improvement:
      "Revise Enlightenment period contributions and memorize historians' names and works.",
  },
  {
    chapter: "2. Historiography: Indian Tradition",
    score: "8/10",
    understanding: "Very Good",
    description:
      "Explains Indian historiographical traditions clearly, recognizes authors like Kalhana and Banabhatta. Answers show good analytical ability.",
    improvement:
      "Add more examples of regional historiography and mention Persian chroniclers.",
  },
  {
    chapter: "3. Applied History",
    score: "6/10",
    understanding: "Satisfactory",
    description:
      "Understands the concept of applied history but tends to give generic examples. Can connect history with social studies but needs to elaborate more.",
    improvement:
      "Use case studies like heritage conservation and museum studies in answers.",
  },
  {
    chapter: "4. History of Indian Arts",
    score: "9/10",
    understanding: "Excellent",
    description:
      "Shows strong knowledge of Indian art evolution from ancient to modern times. Answers are descriptive and well-structured.",
    improvement:
      "Maintain current standard and include timeline references for better scoring.",
  },
  {
    chapter: "5. Mass Media and History",
    score: "5/10",
    understanding: "Average",
    description:
      "Understands the role of mass media in history but lacks examples of newspapers and radio in the freedom movement.",
    improvement:
      "Revise case studies on newspapers like Kesari and Young India; practice writing concise points.",
  },
  {
    chapter: "6. Entertainment and History",
    score: "7/10",
    understanding: "Good",
    description:
      "Answers are clear and include examples from Indian cinema and theatre. Sometimes misses linkage to historical development.",
    improvement:
      "Revise the evolution timeline of Marathi theatre and Indian cinema.",
  },
];

export default function ExamReport() {
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
        <div
          style={{
            background: "#ffffff",
            padding: "16px 20px",
            borderRadius: "10px",
            flex: 1,
            minWidth: "260px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: 8 }}>
            🧾 Exam Details
          </h2>
          <p>Exam: {examDetails.title}</p>
          <p>Date: {examDetails.date}</p>
          <p>Duration: {examDetails.duration}</p>
          <p>Total Marks: {examDetails.totalMarks}</p>
        </div>
        <div
          style={{
            background: "#ffffff",
            padding: "16px 20px",
            borderRadius: "10px",
            flex: 1,
            minWidth: "260px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: 8 }}>
            👩‍🎓 Student Info
          </h2>
          <p>Name: {student.name}</p>
          <p>Class: {student.class}-{student.division}</p>
          <p>Roll No: {student.rollNumber}</p>
        </div>
      </section>

      {/* Performance */}
      <section
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: 8 }}>
          📊 Performance Summary
        </h2>
        <p>
          Marks Obtained:{" "}
          <strong>
            {performance.obtainedMarks}/{examDetails.totalMarks}
          </strong>
        </p>
        <p>Percentage: {performance.percentage}%</p>
        <p>Grade: {performance.grade}</p>
      </section>

      {/* Chapter-wise Table */}
      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: "#1d4ed8",
            marginBottom: 12,
          }}
        >
          📚 Chapter-wise Analysis
        </h2>
        <div
          style={{
            overflowX: "auto",
            background: "#ffffff",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.95rem",
            }}
          >
            <thead>
              <tr style={{ background: "#e0e7ff" }}>
                <th style={thStyle}>Chapter</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Understanding</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Improvement</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((ch, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "#f8fafc" : "#ffffff",
                  }}
                >
                  <td style={tdStyle}>{ch.chapter}</td>
                  <td style={tdStyle}>{ch.score}</td>
                  <td style={tdStyle}>{ch.understanding}</td>
                  <td style={tdStyle}>{ch.description}</td>
                  <td style={tdStyle}>{ch.improvement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strengths, Weaknesses, Recommendations */}
      <section style={listSectionStyle}>
        <h2 style={listTitle}>💪 Strengths</h2>
        <ul>{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </section>

      <section style={listSectionStyle}>
        <h2 style={listTitle}>⚠️ Weaknesses</h2>
        <ul>{weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
      </section>

      <section style={listSectionStyle}>
        <h2 style={listTitle}>📝 Recommendations</h2>
        <ul>{recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
      </section>

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
const thStyle = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "1px solid #cbd5e1",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top",
};

const listSectionStyle = {
  background: "#ffffff",
  padding: "16px 20px",
  borderRadius: "10px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  marginBottom: 20,
};

const listTitle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  marginBottom: 8,
};

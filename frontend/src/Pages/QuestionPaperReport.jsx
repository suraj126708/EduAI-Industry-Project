import React from "react";


const student = { name: "Alex Johnson", rollNumber: "3", class: "10", division: "A" };
const year = 2025;
const subject = "Science";
const examDetails = {
  title: "Unit Test",
  date: "2025-09-22",
  duration: "2 hr",
  totalMarks: 50,
};
const performance = {
  obtainedMarks: 45,
  percentage: 90,
  grade: "A+",
};
const strengths = [
  "Excellent in Natural Phenomena",
  "Good in Living Things",
  "Quick to grasp experimental concepts",
  "Strong observation and inference skills",
];
const weaknesses = [
  "Needs work on Materials and Substances",
  "Occasional factual errors in Ecology",
  "Tends to skip detailed explanations in Human Body topics",
];
const recommendations = [
  "Revise Materials and Substances chapter.",
  "Practice more scientific terminology.",
  "Write more detailed answers for Human Body questions.",
  "Review ecology concepts and terminology.",
  "Attempt additional practice papers and quizzes.",
  "Seek clarification from teachers on confusing topics.",
  "Participate in group discussions to enhance conceptual clarity.",
];
const chapters = [
  {
    chapter: "Living Things",
    score: "8/10",
    understanding: "Good",
    description:
      "Shows clear understanding of life processes and can differentiate between plant and animal cells. Needs to use more scientific terminology in explanations.",
    improvement:
      "Practice writing detailed answers and revise cell structure diagrams.",
  },
  {
    chapter: "Materials and Substances",
    score: "6/10",
    understanding: "Average",
    description:
      "Understands basic properties but confuses boiling/melting points. Needs to memorize key facts and relate them to real-world examples.",
    improvement:
      "Revise boiling/melting points and practice with everyday substances.",
  },
  {
    chapter: "Natural Phenomena",
    score: "10/10",
    understanding: "Excellent",
    description:
      "Explains causes and effects of phenomena like lightning and earthquakes with clarity. Answers are accurate and well-structured.",
    improvement:
      "Maintain current level and attempt higher-order thinking questions.",
  },
  {
    chapter: "Human Body",
    score: "7/10",
    understanding: "Good",
    description:
      "Knows main functions of organs but should elaborate answers and include diagrams where possible.",
    improvement:
      "Practice drawing and labeling organ systems.",
  },
  {
    chapter: "Ecology",
    score: "5/10",
    understanding: "Needs Improvement",
    description:
      "Basic understanding present, but needs to learn terminology and structure of food chains/webs.",
    improvement:
      "Review food chain/web concepts and use correct ecological terms.",
  },
];

export default function ExamReport() {
  return (
    <div style={{ background: "#fff", padding: "32px", maxWidth: 700, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: 8 }}>Subject Wise Report</h1>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>Paper Details</h2>
        <div>Year: {year}</div>
        <div>Subject: {subject}</div>
        <div>Exam: {examDetails.title}</div>
        <div>Date: {examDetails.date}</div>
        <div>Duration: {examDetails.duration}</div>
        <div>Total Marks: {examDetails.totalMarks}</div>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>Student Details</h2>
        <div>Name: {student.name}</div>
        <div>Class: {student.class}-{student.division}</div>
        <div>Roll No: {student.rollNumber}</div>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>Performance Summary</h2>
        <div>Marks: {performance.obtainedMarks} / {examDetails.totalMarks}</div>
        <div>Percentage: {performance.percentage}%</div>
        <div>Grade: {performance.grade}</div>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>Insights</h2>
        <p>
          The student demonstrates strengths in {strengths.join(", ")}. Weaknesses include {weaknesses.join(", ")}.
          The following chapter-wise analysis provides a deeper look at conceptual understanding and areas for improvement.
        </p>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>Chapter-wise Analysis</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: 6, textAlign: "left" }}>Chapter</th>
              <th style={{ border: "1px solid #ccc", padding: 6, textAlign: "left" }}>Score</th>
              <th style={{ border: "1px solid #ccc", padding: 6, textAlign: "left" }}>Understanding</th>
              <th style={{ border: "1px solid #ccc", padding: 6, textAlign: "left" }}>Description</th>
              <th style={{ border: "1px solid #ccc", padding: 6, textAlign: "left" }}>Improvement</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((ch, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #ccc", padding: 6 }}>{ch.chapter}</td>
                <td style={{ border: "1px solid #ccc", padding: 6 }}>{ch.score}</td>
                <td style={{ border: "1px solid #ccc", padding: 6 }}>{ch.understanding}</td>
                <td style={{ border: "1px solid #ccc", padding: 6 }}>{ch.description}</td>
                <td style={{ border: "1px solid #ccc", padding: 6 }}>{ch.improvement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>Strengths</h2>
        <ul>
          {strengths.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>Weaknesses</h2>
        <ul>
          {weaknesses.map((w, idx) => (
            <li key={idx}>{w}</li>
          ))}
        </ul>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>Recommendations</h2>
        <ul>
          {recommendations.map((rec, idx) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
      </section>
      <footer style={{ textAlign: "center", fontSize: "0.95rem", color: "#555" }}>
        Generated by EDUAI | Subject Wise report format
      </footer>
    </div>
  );
}
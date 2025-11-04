import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useParams } from "react-router-dom"; // To get ID from URL
import { evaluationAPI } from "../utils/api"; // Assuming you have this
import { Loader2, AlertCircle } from "lucide-react"; // For loading/error

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

// --- ADD THESE NEW STYLES for the detailed view ---
const sectionTitleStyle = {
  background: "#f1f5f9",
  padding: "10px 20px",
  fontSize: "1rem",
  fontWeight: "600",
  color: "#334155",
  borderTop: "1px solid #e2e8f0",
  borderBottom: "1px solid #e2e8f0",
};

const questionBoxStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid #e2e8f0",
};

const questionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
  gap: "16px",
};

const markStyle = {
  fontSize: "0.9rem",
  fontWeight: "700",
  border: "2px solid",
  padding: "2px 8px",
  borderRadius: "6px",
  whiteSpace: "nowrap",
};

const answerBoxStyle = {
  display: "flex",
  gap: "16px",
  background: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

const answerLabelStyle = (isCorrect) => ({
  fontSize: "0.8rem",
  fontWeight: "600",
  color: isCorrect ? "#166534" : "#991b1b",
  background: isCorrect ? "#f0fdf4" : "#fef2f2",
  padding: "8px 12px",
  borderBottom: "1px solid #e2e8f0",
});

const answerTextStyle = {
  margin: 0,
  padding: "8px 12px",
  fontSize: "0.9rem",
};

const remarksBoxStyle = {
  background: "#eff6ff",
  border: "1px solid #dbeafe",
  color: "#1e40af",
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "0.9rem",
  marginTop: "12px",
  lineHeight: "1.6",
};

const DetailedQuestionAnalysis = ({ sections }) => {
  if (!sections || sections.length === 0) {
    return <p>No detailed analysis available.</p>;
  }

  return (
    <div style={{ ...cardStyle, padding: 0 }}>
      {/* Use cardStyle but remove padding */}
      <h2 style={{ ...cardTitle, padding: "16px 20px 0" }}>
        🔍 Detailed Question Analysis
      </h2>
      {sections.map((section, sIdx) => (
        <div key={sIdx} style={{ marginBottom: "16px" }}>
          <h3 style={sectionTitleStyle}>
            Section: {section.sectionTitle.replace("_", " ")}
          </h3>
          {section.questions.map((q, qIdx) => {
            const isCorrect = q.awarded > 0;
            const markColor = isCorrect ? "#22c55e" : "#ef4444";

            return (
              <div key={qIdx} style={questionBoxStyle}>
                {/* Question Header */}
                <div style={questionHeaderStyle}>
                  <span>
                    <strong>Q{q.questionNo}.</strong> {q.question}
                  </span>
                  <span
                    style={{
                      ...markStyle,
                      color: markColor,
                      borderColor: markColor,
                    }}
                  >
                    {q.awarded} / {q.marks}
                  </span>
                </div>

                {/* Answers */}
                <div style={answerBoxStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={answerLabelStyle(false)}>Your Answer:</div>
                    <p style={answerTextStyle}>{q.studentAnswer}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={answerLabelStyle(true)}>Correct Answer:</div>
                    <p style={answerTextStyle}>{q.correctAnswer}</p>
                  </div>
                </div>

                {/* Remarks */}
                {q.remarks && (
                  <div style={remarksBoxStyle}>
                    <strong>Remark:</strong> {q.remarks}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// --- MAIN REPORT COMPONENT ---
export default function ExamReport() {
  const { id } = useParams(); // Get evaluation ID from URL
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) {
        setError("No evaluation ID provided.");
        setLoading(false);
        return;
      }
      try {
        // Use your API helper
        const res = await evaluationAPI.getReportById(id);
        if (res.success) {
          setEvaluation(res.data);
        } else {
          throw new Error(res.message || "Failed to fetch report.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  // --- DERIVE DATA FOR CHARTS ---
  // We use useMemo to prevent re-calculating on every render
  const reportData = useMemo(() => {
    if (!evaluation) return null;

    const {
      studentId,
      questionPaperId,
      evaluationResults,
      totalMarksObtained,
    } = evaluation;

    // 1. Basic Info
    const student = studentId;
    const subject = questionPaperId.subject;
    const examDate = new Date(evaluation.createdAt);
    const formattedDate = `${examDate.getDate()}/${
      examDate.getMonth() + 1
    }/${examDate.getFullYear()}`;
    const examDetails = {
      title: questionPaperId.examType,
      date: formattedDate,
      duration: questionPaperId.paper.duration || "N/A",
      totalMarks: evaluationResults.totalMarks,
    };

    // 2. Performance Stats
    const obtainedMarks = totalMarksObtained;
    const percentage =
      ((obtainedMarks / examDetails.totalMarks) * 100).toFixed(0) || 0;
    const grade =
      percentage >= 90
        ? "A+"
        : percentage >= 80
        ? "A"
        : percentage >= 70
        ? "B"
        : "C";
    const performance = { obtainedMarks, percentage, grade };

    // 3. Section Data (for charts)
    const sectionPerformanceData = evaluationResults.sections.map((section) => {
      const totalSectionMarks = section.questions.reduce(
        (sum, q) => sum + q.marks,
        0
      );
      const obtainedSectionMarks = section.questions.reduce(
        (sum, q) => sum + q.awarded,
        0
      );
      const sectionPercentage =
        ((obtainedSectionMarks / totalSectionMarks) * 100).toFixed(0) || 0;

      return {
        name: section.sectionTitle.replace("_", " "),
        value: obtainedSectionMarks,
        max: totalSectionMarks,
        percentage: sectionPercentage,
      };
    });

    return {
      student,
      subject,
      examDetails,
      performance,
      sectionPerformanceData,
      sections: evaluation.evaluationResults.sections,
    };
  }, [evaluation]);

  // --- RENDER LOGIC ---

  if (loading) {
    return (
      <div style={{ ...modalOverlay, background: "rgba(255,255,255,0.8)" }}>
        <Loader2 className="animate-spin" size={48} color="#1d4ed8" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={modalOverlay}>
        <div style={modalContent}>
          <AlertCircle color="red" size={40} />
          <h3 style={{ color: "#ef4444", fontWeight: "600" }}>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null; // Should be handled by error state
  } // Destructure dynamic data

  const {
    student,
    subject,
    examDetails,
    performance,
    sectionPerformanceData,
    sections,
  } = reportData;

  const COLORS = ["#6366f1", "#22d3ee", "#f59e42"]; // For progress bars

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
        <p style={{ color: "#475569" }}>{examDetails.title}</p>
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
          <p>
            Exam:{" "}
            <strong>
              <em>{examDetails.title}</em>
            </strong>
          </p>
          <p>
            Result Date:{" "}
            <strong>
              <em>{examDetails.date}</em>
            </strong>
          </p>
          <p>
            Duration:{" "}
            <strong>
              <em>{examDetails.duration}</em>
            </strong>
          </p>
          <p>
            Total Marks:{" "}
            <strong>
              <em>{examDetails.totalMarks}</em>
            </strong>
          </p>
        </div>
        <div style={cardStyle}>
          <h2 style={cardTitle}>👩‍🎓 Student Info</h2>
          <p>
            Name:{" "}
            <strong>
              <em>{student.name}</em>
            </strong>
          </p>
          <p>
            Class:{" "}
            <strong>
              <em>
                {student.class} {student.div}
              </em>
            </strong>
          </p>
          <p>
            Roll No:{" "}
            <strong>
              <em>{student.rollNo}</em>
            </strong>
          </p>
          <p>
            Subject:{" "}
            <strong>
              <em>{subject}</em>
            </strong>
          </p>
          <p>
            Marks Obtained:{" "}
            <strong>
              <em>{performance.obtainedMarks}</em>
            </strong>
          </p>
        </div>
      </section>

      {/* --- !!! NEW DETAILED ANALYSIS SECTION !!! --- */}
      <section>
        <DetailedQuestionAnalysis sections={sections} />
      </section>

      {/* Performance & Visualization */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>📊 Performance Summary</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={statBox}>
            <div style={statLabel}>Marks Obtained</div>
            <div style={statValue}>
              {performance.obtainedMarks}/{examDetails.totalMarks}
            </div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Percentage</div>
            <div style={statValue}>{performance.percentage}%</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Grade</div>
            <div style={statValue}>{performance.grade}</div>
          </div>
        </div>
        <div style={{ margin: "20px 0" }}>
          <div
            style={{ fontSize: "0.98rem", marginBottom: 8, fontWeight: "600" }}
          >
            Overall Performance
          </div>
          <div
            style={{
              background: "#e5e7eb",
              borderRadius: 8,
              height: 28,
              width: "100%",
              position: "relative",
            }}
          >
            <div
              style={{
                background:
                  performance.percentage >= 75
                    ? "#22c55e"
                    : performance.percentage >= 60
                    ? "#eab308"
                    : "#ef4444",
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

      {/* Section-wise Performance (Renamed from Chapter) */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>📚 Section-wise Analysis</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={sectionPerformanceData} // Use dynamic data
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name" // Use section name
              tick={{ fontSize: 11 }}
              interval={0}
              textAnchor="end"
            />
            <YAxis
              domain={[0, 100]}
              label={{
                value: "Score (%)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
              formatter={(value, name) => [
                value,
                name === "percentage" ? "Score" : name,
              ]}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey="percentage" // Chart the percentage
              fill="#6366f1"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Section-wise Breakdown (Progress Bars) */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>📝 Section-wise Breakdown</h2>
        <div style={{ marginBottom: 20 }}>
          {sectionPerformanceData.map(
            (
              section,
              idx // Use dynamic data
            ) => (
              <div key={idx} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    fontSize: "0.95rem",
                  }}
                >
                  <span>
                    <strong>{section.name}</strong>
                  </span>
                  <span>
                    {section.value}/{section.max} ({section.percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    background: "#e5e7eb",
                    borderRadius: 6,
                    height: 20,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      background: COLORS[idx % COLORS.length], // Use dynamic color
                      width: `${section.percentage}%`,
                      height: "100%",
                      borderRadius: 6,
                      transition: "width 0.6s ease-out",
                      // --- THIS IS WHERE THE ERROR WAS ---
                    }}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* TODO: The "Insights" section can be the next feature.
          You can create another AI prompt that takes the JSON evaluation as input and *generates* these text-based strengths, weaknesses, and action plans.
      */}

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

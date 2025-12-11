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
  Cell,
} from "recharts";
import { useParams } from "react-router-dom";
import { evaluationAPI, bookAPI } from "../utils/api";
import { Loader2 } from "lucide-react";

// --- STYLES ---

const containerStyle = {
  background: "#f8fafc",
  padding: "40px",
  maxWidth: "1200px",
  width: "95%",
  margin: "40px auto",
  fontFamily: "'Poppins', sans-serif",
  color: "#1e293b",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const cardStyle = {
  background: "#ffffff",
  padding: "24px",
  borderRadius: "12px",
  flex: 1,
  minWidth: "300px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
  border: "1px solid #f1f5f9",
};

const cardTitle = {
  fontSize: "1.2rem",
  fontWeight: "700",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const metadataCardStyle = {
  background: "#ffffff",
  padding: "20px 24px",
  borderRadius: "12px",
  flex: 1,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const metadataHeaderStyle = {
  fontSize: "1.2rem",
  fontWeight: "700",
  color: "#1e293b",
  marginBottom: "12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const metadataLineStyle = {
  fontSize: "1rem",
  color: "#334155",
  margin: 0,
  lineHeight: "1.6",
};

const sectionTitleStyle = {
  background: "#f8fafc",
  padding: "12px 24px",
  fontSize: "1.05rem",
  fontWeight: "600",
  color: "#334155",
  borderTop: "1px solid #e2e8f0",
  borderBottom: "1px solid #e2e8f0",
};

const questionBoxStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#fff",
};

const questionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
  gap: "16px",
};

const markStyle = {
  fontSize: "0.9rem",
  fontWeight: "700",
  border: "2px solid",
  padding: "4px 10px",
  borderRadius: "8px",
  whiteSpace: "nowrap",
};

const answerBoxStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  background: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

const answerRowStyle = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap",
};

const answerLabelStyle = (isCorrect) => ({
  fontSize: "0.8rem",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: isCorrect ? "#15803d" : "#b91c1c",
  background: isCorrect ? "#dcfce7" : "#fee2e2",
  padding: "8px 16px",
  borderBottom: "1px solid #e2e8f0",
});

const answerTextStyle = {
  margin: 0,
  padding: "12px 16px",
  fontSize: "0.95rem",
  lineHeight: "1.6",
  color: "#334155",
};

const remarksBoxStyle = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1e40af",
  padding: "12px 16px",
  borderRadius: "8px",
  fontSize: "0.95rem",
  marginTop: "16px",
  lineHeight: "1.6",
  display: "flex",
  alignItems: "start",
  gap: "8px",
};

const questionImageStyle = {
  maxWidth: "100%",
  maxHeight: "300px",
  marginTop: "16px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  padding: "4px",
  backgroundColor: "#fff",
  display: "block",
};

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label, chapterMap }) => {
  if (active && payload && payload.length) {
    const chapterName = chapterMap[label] || "";
    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          minWidth: "180px",
          zIndex: 100,
        }}
      >
        <p
          style={{
            fontWeight: "700",
            color: "#334155",
            marginBottom: "8px",
            fontSize: "0.95rem",
          }}
        >
          Chapter {label}
          {chapterName && (
            <span
              style={{
                display: "block",
                color: "#64748b",
                fontWeight: "500",
                marginTop: "2px",
                fontSize: "0.85rem",
              }}
            >
              {chapterName}
            </span>
          )}
        </p>
        {payload.map((entry, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: entry.color,
              }}
            ></div>
            <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
              {entry.name}:
            </span>
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- CHART COMPONENT ---
const ChapterPerformanceChart = ({ chapterData, chapterMap }) => {
  if (!chapterData || chapterData.length === 0) return null;

  return (
    <div
      style={{
        ...cardStyle,
        height: "450px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={cardTitle}>📊 Chapter-wise Performance</h2>
      <div style={{ flex: 1, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chapterData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="chapterNo"
              tick={{ fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
              height={50}
              label={{
                value: "Chapter Number",
                position: "insideBottom",
                offset: -10,
                fill: "#94a3b8",
                fontSize: 12,
              }}
            />
            <YAxis
              tick={{ fill: "#64748b" }}
              axisLine={false}
              label={{
                value: "Marks",
                angle: -90,
                position: "insideLeft",
                fill: "#94a3b8",
                offset: 10,
              }}
            />
            <Tooltip
              content={<CustomTooltip chapterMap={chapterMap} />}
              cursor={{ fill: "#f1f5f9" }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingBottom: "20px" }}
            />
            <Bar
              dataKey="totalMarks"
              name="Total Marks"
              fill="#cbd5e1"
              radius={[4, 4, 0, 0]}
              barSize={40}
              maxBarSize={60}
            />
            <Bar
              dataKey="obtainedMarks"
              name="Obtained Marks"
              radius={[4, 4, 0, 0]}
              barSize={40}
              maxBarSize={60}
            >
              {chapterData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.percentage >= 75
                      ? "#22c55e"
                      : entry.percentage >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- DETAILED ANALYSIS COMPONENT ---
const DetailedQuestionAnalysis = ({ sections }) => {
  if (!sections || sections.length === 0) return null;

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "24px 24px 0" }}>
        <h2 style={cardTitle}>🔍 Detailed Question Analysis</h2>
      </div>
      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          <h3 style={sectionTitleStyle}>
            Section: {section.sectionTitle.replace("_", " ")}
          </h3>
          {section.questions.map((q, qIdx) => {
            const isCorrect = q.awarded > 0;
            const markColor = isCorrect ? "#166534" : "#991b1b";
            const markBg = isCorrect ? "#dcfce7" : "#fee2e2";

            return (
              <div key={qIdx} style={questionBoxStyle}>
                <div style={questionHeaderStyle}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        color: "#1e293b",
                        lineHeight: "1.5",
                      }}
                    >
                      <strong style={{ color: "#475569", marginRight: "8px" }}>
                        Q{q.questionNo}.
                      </strong>
                      {q.question}
                    </div>
                    {q.imageUrl && (
                      <img
                        src={q.imageUrl}
                        alt={`Question ${q.questionNo}`}
                        style={questionImageStyle}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      ...markStyle,
                      color: markColor,
                      borderColor: "transparent",
                      backgroundColor: markBg,
                    }}
                  >
                    {q.awarded} / {q.marks} Marks
                  </span>
                </div>
                <div style={answerBoxStyle}>
                  <div style={answerRowStyle}>
                    <div style={{ flex: 1, minWidth: "250px" }}>
                      <div style={answerLabelStyle(false)}>Your Answer</div>
                      <p style={answerTextStyle}>
                        {q.studentAnswer || "No answer provided"}
                      </p>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: "250px",
                        borderLeft: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={answerLabelStyle(true)}>Correct Answer</div>
                      <p style={answerTextStyle}>{q.correctAnswer}</p>
                    </div>
                  </div>
                </div>
                {q.remarks && (
                  <div style={remarksBoxStyle}>
                    <span style={{ fontSize: "1.2rem" }}>💡</span>
                    <div>
                      <strong>Feedback:</strong> {q.remarks}
                    </div>
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
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [chapterMap, setChapterMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const res = await evaluationAPI.getReportById(id);
        if (res.success) {
          setEvaluation(res.data);
        } else {
          throw new Error(res.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!evaluation) return;
      const subjectName = evaluation.questionPaperId.subject;
      const classStr = evaluation.studentId.class || "";
      const classId = classStr.split(" ")[0];

      if (!subjectName || !classId) return;

      try {
        const res = await bookAPI.getChapters(subjectName, classId);
        if (res.success && res.chapters) {
          const map = {};
          res.chapters.forEach((ch) => {
            map[ch.chapter_no] = ch.chapter_title;
          });
          setChapterMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch chapter names:", err);
      }
    };
    fetchChapters();
  }, [evaluation]);

  const reportData = useMemo(() => {
    if (!evaluation) return null;
    const {
      studentId,
      questionPaperId,
      evaluationResults,
      totalMarksObtained,
    } = evaluation;
    const chapterSummary = evaluationResults.chapter_summary || {};

    return {
      student: studentId,
      subject: questionPaperId.subject,
      examDetails: {
        title: questionPaperId.examType,
        date: new Date(evaluation.createdAt).toLocaleDateString(),
        duration: questionPaperId.paper.duration || "N/A",
        totalMarks: evaluationResults.totalMarks,
      },
      performance: {
        obtainedMarks: totalMarksObtained,
        percentage: (
          (totalMarksObtained / evaluationResults.totalMarks) *
          100
        ).toFixed(0),
      },
      sections: evaluationResults.sections,
      chapters: chapterSummary.chapters || [],
      overallSummary: chapterSummary.overall_summary || {},
    };
  }, [evaluation]);

  if (loading)
    return (
      <div
        style={{ ...containerStyle, display: "flex", justifyContent: "center" }}
      >
        <Loader2 className="animate-spin" />
      </div>
    );
  if (error)
    return (
      <div style={containerStyle}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  if (!reportData) return null;

  const {
    student,
    subject,
    examDetails,
    performance,
    sections,
    chapters,
    overallSummary,
  } = reportData;

  return (
    <>
      {/* This style block handles the PRINT Layout. 
        It hides the navbar (by tag/class) and resets the report container
        to standard white paper format.
      */}
      <style>
        {`
          @media print {
            /* 1. HIDE NAVBAR & UI CHROME */
            nav, header, .navbar, .sidebar, button {
              display: none !important;
            }

            /* 2. RESET BODY BACKGROUND */
            body {
              background-color: white !important;
              -webkit-print-color-adjust: exact;
              margin: 0;
            }

            /* 3. CONFIGURE REPORT CONTAINER FOR A4/PDF */
            .report-container {
              margin: 0 !important;
              padding: 20px !important;
              max-width: 100% !important;
              width: 100% !important;
              box-shadow: none !important;
              background: white !important;
              border: none !important;
              border-radius: 0 !important;
            }

            /* 4. FORCE COLORS TO PRINT */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

      {/* Added class 'report-container' for the print styles to target */}
      <div style={containerStyle} className="report-container">
        <header style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "800",
              color: "#2563eb",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            📘 Subject Report: {subject}
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.2rem" }}>
            {examDetails.title}
          </p>
        </header>

        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div style={metadataCardStyle}>
            <h2 style={metadataHeaderStyle}>📄 Exam Details</h2>
            <p style={metadataLineStyle}>
              Exam:{" "}
              <strong>
                <em>{examDetails.title}</em>
              </strong>
            </p>
            <p style={metadataLineStyle}>
              Result Date:{" "}
              <strong>
                <em>{examDetails.date}</em>
              </strong>
            </p>
            <p style={metadataLineStyle}>
              Duration:{" "}
              <strong>
                <em>{examDetails.duration}</em>
              </strong>
            </p>
            <p style={metadataLineStyle}>
              Total Marks:{" "}
              <strong>
                <em>{examDetails.totalMarks}</em>
              </strong>
            </p>
          </div>

          <div style={metadataCardStyle}>
            <h2 style={metadataHeaderStyle}>👨‍🎓 Student Info</h2>
            <p style={metadataLineStyle}>
              Name:{" "}
              <strong>
                <em>{student.name}</em>
              </strong>
            </p>
            <p style={metadataLineStyle}>
              Class:{" "}
              <strong>
                <em>
                  {student.class} {student.div}
                </em>
              </strong>
            </p>
            <p style={metadataLineStyle}>
              Roll No:{" "}
              <strong>
                <em>{student.rollNo}</em>
              </strong>
            </p>
            <p style={metadataLineStyle}>
              Subject:{" "}
              <strong>
                <em>{subject}</em>
              </strong>
            </p>
            <p style={metadataLineStyle}>
              Marks Obtained:{" "}
              <strong>
                <em>{performance.obtainedMarks}</em>
              </strong>
            </p>
          </div>
        </section>

        <section>
          <DetailedQuestionAnalysis sections={sections} />
        </section>

        {chapters.length > 0 && (
          <section style={{ marginBottom: "32px" }}>
            <ChapterPerformanceChart
              chapterData={chapters}
              chapterMap={chapterMap}
            />
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div style={{ ...cardStyle, borderLeft: "6px solid #22c55e" }}>
              <h3 style={{ ...cardTitle, color: "#166534" }}>
                💪 Strong Chapters
              </h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {overallSummary.strong_chapters?.length > 0 ? (
                  overallSummary.strong_chapters.map((c) => (
                    <span
                      key={c}
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontWeight: "600",
                      }}
                    >
                      Chapter {c}
                      {chapterMap[c] ? `: ${chapterMap[c]}` : ""}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#64748b" }}>
                    No specific strong chapters detected.
                  </span>
                )}
              </div>
            </div>

            <div style={{ ...cardStyle, borderLeft: "6px solid #ef4444" }}>
              <h3 style={{ ...cardTitle, color: "#991b1b" }}>⚠️ Focus Areas</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {overallSummary.weak_chapters?.length > 0 ? (
                  overallSummary.weak_chapters.map((c) => (
                    <span
                      key={c}
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontWeight: "600",
                      }}
                    >
                      Chapter {c}
                      {chapterMap[c] ? `: ${chapterMap[c]}` : ""}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#64748b" }}>
                    Great job! No weak chapters detected.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              border: "1px solid #bae6fd",
              background: "#f0f9ff",
            }}
          >
            <h3 style={{ ...cardTitle, color: "#0369a1" }}>
              🗓️ Recommended Study Plan
            </h3>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#0c4a6e" }}>
              {overallSummary.study_plan?.map((plan, i) => (
                <li key={i} style={{ marginBottom: "12px", lineHeight: "1.5" }}>
                  {plan}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer
          style={{
            textAlign: "center",
            marginTop: "40px",
            color: "#94a3b8",
            fontSize: "0.9rem",
          }}
        >
          Generated by <strong>EDUAI</strong>
        </footer>
      </div>
    </>
  );
}

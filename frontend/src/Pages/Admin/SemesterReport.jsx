import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  Mail,
  School,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const SemesterReportCard = ({ studentData, onClose }) => {
  // State for Principal's Remark (Editable)
  const [principalRemark, setPrincipalRemark] = useState("");

  // --- MOCK DATA (If real data isn't fully structured yet) ---
  // In a real scenario, you would map 'studentData' props to this structure
  const report = {
    student: {
      name: studentData?.studentInfo?.name || "Aarav Patel",
      id: "2024-ST-098",
      class: "10-A",
      rollNo: studentData?.studentInfo?.rollNo || "14",
      dob: "12-May-2008",
      attendance: "95.5%",
      house: "Blue",
    },
    academic: [
      {
        subject: "Mathematics",
        unit: 18,
        mid: 72,
        total: 90,
        grade: "A1",
        avg: 78,
        remark: "Excellent",
      },
      {
        subject: "Physics",
        unit: 16,
        mid: 65,
        total: 81,
        grade: "A2",
        avg: 70,
        remark: "Good",
      },
      {
        subject: "Chemistry",
        unit: 19,
        mid: 70,
        total: 89,
        grade: "A1",
        avg: 75,
        remark: "Outstanding",
      },
      {
        subject: "English",
        unit: 15,
        mid: 60,
        total: 75,
        grade: "B1",
        avg: 80,
        remark: "Can improve",
      },
      {
        subject: "Computer Sci",
        unit: 20,
        mid: 78,
        total: 98,
        grade: "A1",
        avg: 85,
        remark: "Exceptional",
      },
      {
        subject: "Social Studies",
        unit: 14,
        mid: 55,
        total: 69,
        grade: "B2",
        avg: 72,
        remark: "Satisfactory",
      },
    ],
    coScholastic: [
      {
        activity: "Work Education",
        grade: "A",
        indicator: "Actively participates in group projects.",
      },
      {
        activity: "Art Education",
        grade: "B",
        indicator: "Good creativity; shows interest in sketching.",
      },
      {
        activity: "Health & Physical Ed",
        grade: "A",
        indicator: "Captain of the Junior Football team.",
      },
      {
        activity: "Discipline",
        grade: "A",
        indicator: "Respectful to teachers and peers.",
      },
    ],
    charts: {
      comparison: [
        { subject: "Math", Student: 90, ClassAvg: 78 },
        { subject: "Phy", Student: 81, ClassAvg: 70 },
        { subject: "Chem", Student: 89, ClassAvg: 75 },
        { subject: "Eng", Student: 75, ClassAvg: 80 },
        { subject: "Comp", Student: 98, ClassAvg: 85 },
      ],
      trend: [
        { exam: "Unit 1", score: 82 },
        { exam: "Unit 2", score: 85 },
        { exam: "Mid-Term", score: 88 },
      ],
    },
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-50 overflow-y-auto pt-10 pb-10 print:p-0 print:bg-white print:static">
      {/* --- Main Report Container (A4 Width) --- */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl rounded-xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
        {/* --- 1. Admin Actions (Hidden when printing) --- */}
        <div className="bg-gray-100 p-4 border-b flex justify-between items-center print:hidden">
          <div>
            <h2 className="font-bold text-gray-800">Report Preview</h2>
            <p className="text-xs text-gray-500">
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-gray-700">
              <Mail size={16} /> Email Parent
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-gray-700">
              <Download size={16} /> Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
            >
              <Printer size={16} /> Print Report
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* --- 2. The Actual Report Content --- */}
        <div className="p-8 print:p-0">
          {/* Header */}
          <div className="text-center border-b-2 border-indigo-900 pb-6 mb-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
                <School size={40} />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-extrabold text-indigo-900 tracking-wide uppercase">
                  Green Valley High School
                </h1>
                <p className="text-sm text-gray-600 tracking-widest uppercase">
                  Excellence in Education
                </p>
                <p className="text-xs text-gray-500">
                  123 Knowledge Park, Education City, Pune
                </p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mt-4 border-t border-gray-200 pt-2 inline-block">
              SEMESTER PROGRESS REPORT: 2024-2025
            </h2>
          </div>

          {/* Section A: Student Profile */}
          <div className="mb-8 border border-gray-300 rounded-lg p-4 bg-gray-50/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 text-sm">
              <div>
                <span className="text-gray-500 block text-xs uppercase">
                  Student Name
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {report.student.name}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase">
                  Class / Section
                </span>
                <span className="font-semibold text-gray-900">
                  {report.student.class}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase">
                  Roll No
                </span>
                <span className="font-semibold text-gray-900">
                  {report.student.rollNo}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase">
                  Attendance
                </span>
                <span className="font-bold text-green-700">
                  {report.student.attendance}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase">
                  Student ID
                </span>
                <span className="font-semibold text-gray-900">
                  {report.student.id}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase">
                  Date of Birth
                </span>
                <span className="font-semibold text-gray-900">
                  {report.student.dob}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase">
                  House
                </span>
                <span className="font-semibold text-gray-900">
                  {report.student.house}
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Scholastic Areas */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-indigo-900 uppercase mb-2 border-b border-gray-300 pb-1">
              Part A: Scholastic Performance
            </h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-indigo-50 text-indigo-900">
                  <th className="border border-gray-300 px-3 py-2 text-left">
                    Subject
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-16">
                    Unit (20)
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-16">
                    Mid (80)
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-16 bg-indigo-100 font-bold">
                    Total
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-16">
                    Grade
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-20 text-xs text-gray-500">
                    Class Avg
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.academic.map((sub, index) => (
                  <tr key={index} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {sub.subject}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-gray-600">
                      {sub.unit}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-gray-600">
                      {sub.mid}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold text-indigo-700 bg-indigo-50/50">
                      {sub.total}
                    </td>
                    <td
                      className={`border border-gray-300 px-2 py-2 text-center font-bold ${
                        sub.grade.startsWith("A")
                          ? "text-green-600"
                          : sub.grade.startsWith("B")
                          ? "text-blue-600"
                          : "text-orange-600"
                      }`}
                    >
                      {sub.grade}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-gray-400 text-xs">
                      {sub.avg}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs italic text-gray-600">
                      {sub.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section C: Visual Analytics (Hidden on small prints if needed, but keeping for now) */}
          <div className="mb-8 grid grid-cols-2 gap-6 print:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                Subject Performance vs Class Avg
              </h3>
              <div className="h-48 w-full border border-gray-200 rounded p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.charts.comparison}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="subject"
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis hide />
                    <Tooltip contentStyle={{ fontSize: "12px" }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                    <Bar
                      dataKey="Student"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="ClassAvg"
                      fill="#CBD5E1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                Semester Trajectory
              </h3>
              <div className="h-48 w-full border border-gray-200 rounded p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.charts.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section D: Co-Scholastic */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-indigo-900 uppercase mb-2 border-b border-gray-300 pb-1">
              Part B: Co-Scholastic Areas
            </h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left w-1/4">
                    Activity
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center w-16">
                    Grade
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left">
                    Descriptive Indicators
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.coScholastic.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {item.activity}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                      {item.grade}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs">
                      {item.indicator}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section E: Remarks & Signatures */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-12">
            <div className="mb-4">
              <span className="block font-bold text-sm text-indigo-900 mb-1">
                Class Teacher's Remark:
              </span>
              <p className="text-sm text-gray-700 italic border-b border-dashed border-gray-300 pb-2">
                "Aarav is a bright student but needs to focus more on language
                subjects to improve his overall aggregate."
              </p>
            </div>

            <div>
              <span className="font-bold text-sm text-indigo-900 mb-1 flex items-center gap-2">
                Principal's Remark:
                <span className="text-[10px] font-normal text-gray-400 uppercase print:hidden">
                  (Click to edit)
                </span>
              </span>
              <textarea
                className="w-full bg-transparent text-sm text-gray-800 italic resize-none outline-none border-b border-dashed border-gray-300 focus:border-indigo-500 focus:bg-white transition-colors p-1"
                rows={2}
                placeholder="Enter principal's note here..."
                value={principalRemark}
                onChange={(e) => setPrincipalRemark(e.target.value)}
              />
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8">
            <div className="text-center">
              <div className="border-t-2 border-gray-400 w-2/3 mx-auto mb-2"></div>
              <p className="font-bold text-sm text-gray-700">Class Teacher</p>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-gray-400 w-2/3 mx-auto mb-2"></div>
              <p className="font-bold text-sm text-gray-700">
                Parent / Guardian
              </p>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-gray-400 w-2/3 mx-auto mb-2"></div>
              <p className="font-bold text-sm text-gray-700">Principal</p>
              <div className="mt-2 w-16 h-16 mx-auto border border-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-400">
                School Seal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemesterReportCard;

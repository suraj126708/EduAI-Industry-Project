import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { evaluationAPI } from "../../utils/api";
import {
  FaSearch,
  FaFileAlt,
  FaSpinner,
  FaTimes,
  FaEye,
  FaBan,
} from "react-icons/fa";

// --- HELPER: Convert 0 -> Set A, 1 -> Set B ---
const getSetLabel = (index) => `Set ${String.fromCharCode(65 + index)}`;

// --- COMPONENT: Paper Selection Modal (Grouped by Batch) ---
const PaperSelectionModal = ({ isOpen, onClose, papers, onSelect }) => {
  if (!isOpen) return null;

  // --- 1. GROUPING LOGIC ---
  // Groups flat list of papers into "Exam Batches" based on Title or Time
  const batchRows = useMemo(() => {
    const groups = {};

    papers.forEach((paper) => {
      // Handle backend structure (group or flat)
      const rawSets =
        paper.papers && paper.papers.length > 0 ? paper.papers : [paper];

      rawSets.forEach((individualSet) => {
        // Create Group Key:
        // Use Title if available (e.g. "Science_Unit_Test_10"), else ExamType + Date(Minute)
        let groupKey;
        if (individualSet.title && individualSet.title.length > 5) {
          groupKey = individualSet.title;
        } else {
          const dateObj = new Date(individualSet.createdAt);
          const timeKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}_${dateObj.getHours()}:${dateObj.getMinutes()}`;
          groupKey = `${individualSet.examType}_${timeKey}`;
        }

        if (!groups[groupKey]) {
          groups[groupKey] = {
            id: groupKey,
            examType: individualSet.examType || "Exam",
            createdAt: individualSet.createdAt,
            sets: [],
          };
        }
        groups[groupKey].sets.push(individualSet);
      });
    });

    // Convert to array and Sort Batches by Date (Newest first) for display
    const sortedBatches = Object.values(groups).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return sortedBatches;
  }, [papers]);

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white">
          <h3 className="text-xl font-bold text-gray-800">
            Select a Question Paper
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto p-0">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  DATE
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  EXAM TYPE
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                  SETS
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {batchRows.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No question papers found.
                  </td>
                </tr>
              ) : (
                batchRows.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.examType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {/* Shows Total Sets (e.g. "2") */}
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                        {batch.sets.length}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => onSelect(batch)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-6 rounded-md shadow-sm transition-colors"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const AdminResults = () => {
  const { adminService } = useAuth();

  // State
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [classes, setClasses] = useState([]);
  const [rawClassData, setRawClassData] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allPapers, setAllPapers] = useState([]);
  const [students, setStudents] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState({});

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [rollNo, setRollNo] = useState("");

  // Selected Batch Context
  const [selectedBatchInfo, setSelectedBatchInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // 1. Fetch Metadata
  useEffect(() => {
    const fetchData = async () => {
      setLoadingMeta(true);
      try {
        const [classRes, subRes, paperRes] = await Promise.all([
          adminService.getClasses(),
          adminService.getSubjects(),
          adminService.getPapers(),
        ]);

        if (classRes.data?.success || classRes.data?.data) {
          const raw = classRes.data.data || classRes.data.classes || [];
          setRawClassData(raw);
          const uniqueGrades = [...new Set(raw.map((c) => c.grade))].sort(
            (a, b) => a - b
          );
          setClasses(uniqueGrades);
        }

        if (subRes.data?.success || subRes.data?.data) {
          setSubjects(subRes.data.data || subRes.data.subjects || []);
        }

        if (paperRes.success) {
          setAllPapers(paperRes.data.papers || []);
        }
      } catch (err) {
        console.error("Failed to load metadata", err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchData();
  }, [adminService]);

  // 2. Dynamic Divisions
  useEffect(() => {
    if (!selectedClass) {
      setDivisions([]);
      return;
    }
    const validDivs = rawClassData
      .filter((c) => c.grade == selectedClass)
      .map((c) => c.division)
      .sort();
    setDivisions(
      [...new Set(validDivs)].length > 0 ? [...new Set(validDivs)] : ["A"]
    );
    // keep selectedDivision as-is per request (do NOT reset it)
  }, [selectedClass, rawClassData]);

  // 2.a Auto-fetch students when class or division changes
  useEffect(() => {
    // Only auto-fetch when both class and division are selected
    if (!selectedClass || !selectedDivision) {
      setStudents([]);
      setShowTable(false);
      return;
    }
    // Trigger fetch (re-uses existing handler)
    handleFetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedDivision]);

  // 3. Filter Papers for Modal
  const filteredPapers = allPapers.filter((p) => {
    const classMatch = selectedClass ? p.classGrade == selectedClass : true;
    const subMatch = selectedSubject ? p.subject === selectedSubject : true;
    return classMatch && subMatch;
  });

  // 4. Fetch Logic
  const handleFetchStudents = async () => {
    if (!selectedClass || !selectedDivision) {
      alert("Please select Class and Division");
      return;
    }
    setLoadingStudents(true);
    setStudents([]);
    setShowTable(false);

    try {
      const res = await adminService.getStudents(
        selectedClass,
        selectedDivision,
        rollNo
      );
      if (res.success) {
        const list = res.data || [];
        setStudents(list);
        if (list.length === 0) alert("No students found.");
        else {
          await fetchEvaluations();
          setShowTable(true);
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error fetching students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const res = await evaluationAPI.getEvaluationsByClass(
        selectedClass,
        selectedDivision
      );
      if (res.success) setAllEvaluations(res.data || {});
    } catch (err) {
      console.error("Error loading marks:", err);
      setAllEvaluations({});
    }
  };

  // 5. Handle Batch Selection from Modal
  const handleBatchSelect = (batchGroup) => {
    // batchGroup.sets contains the individual paper objects.
    // IMPORTANT: Sort them by CreatedAt ASCENDING to ensure [Set A, Set B, Set C] order.
    const sortedSets = [...batchGroup.sets].sort((a, b) => {
      const timeDiff = new Date(a.createdAt) - new Date(b.createdAt);
      if (timeDiff !== 0) return timeDiff;
      return String(a._id).localeCompare(String(b._id));
    });

    const batchIds = sortedSets.map((p) => String(p._id)); // Store IDs for matching

    setSelectedBatchInfo({
      displayText: `${batchGroup.examType} (${new Date(
        batchGroup.createdAt
      ).toLocaleDateString()}) - Sets: ${sortedSets.length}`,
      batchIds: batchIds, // Array of Paper IDs in order [Set A ID, Set B ID]
      sortedSets: sortedSets,
    });
    setIsModalOpen(false);
  };

  const handleViewReport = (reportId) => {
    if (!reportId) return;
    window.open(`/reports/${reportId}`, "_blank");
  };

  // 6. Match Logic (Find which Set the student took)
  const getStudentEvaluationInfo = (studentId) => {
    if (!selectedBatchInfo) return null;

    const studentEvals = allEvaluations[studentId];
    if (!studentEvals || !Array.isArray(studentEvals)) return null;

    // Check if student has evaluated ANY paper from this selected batch
    // Iterate through the batchIds (which are sorted A, B, C)
    for (let i = 0; i < selectedBatchInfo.batchIds.length; i++) {
      const paperId = selectedBatchInfo.batchIds[i];

      // Find matching evaluation
      const match = studentEvals.find(
        (ev) => String(ev.questionPaperId) === paperId
      );

      if (match) {
        return {
          ...match,
          setLabel: getSetLabel(i), // i=0 -> Set A, i=1 -> Set B
        };
      }
    }
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PaperSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        papers={filteredPapers}
        onSelect={handleBatchSelect}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-3">
          Select Criteria to View Results
        </h2>

        {/* Top Row Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject(""); // clear subject immediately when class changes
              }}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              disabled={!selectedClass}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
            >
              <option value="">Select Division</option>
              {divisions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Roll No. (Optional)
            </label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Search by Roll No..."
              className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleFetchStudents}
              disabled={loadingStudents || !selectedClass || !selectedDivision}
              title="Fetch Students"
              className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStudents ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaSearch />
              )}
            </button>
          </div>
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Bottom Row Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedBatchInfo(null);
              }}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-8">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Question Paper
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                readOnly
                value={selectedBatchInfo ? selectedBatchInfo.displayText : ""}
                placeholder="No paper selected"
                className="flex-grow bg-gray-50 border border-gray-300 text-gray-600 py-2.5 px-3 rounded-lg focus:outline-none cursor-not-allowed"
              />
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={!selectedSubject || !selectedClass}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Results Table --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">View Results</h3>
        </div>

        {!showTable ? (
          <div className="p-12 text-center text-gray-500">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaFileAlt size={24} className="text-gray-400" />
            </div>
            <p>Fetch students to view the list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Roll No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Marks
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Evaluations
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const evalInfo = getStudentEvaluationInfo(student._id);
                  const isEvaluated =
                    evalInfo &&
                    (evalInfo.status === "evaluated" ||
                      evalInfo.status === "completed" ||
                      evalInfo.totalMarksObtained !== undefined);

                  return (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {student.rollNo}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {student.name}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEvaluated ? (
                          <span className="bg-green-100 text-green-800 py-1 px-3 rounded text-sm font-bold border border-green-200">
                            {evalInfo.totalMarksObtained} /{" "}
                            {evalInfo.evaluationResults?.totalMarks || 20}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isEvaluated ? (
                          <button
                            onClick={() => handleViewReport(evalInfo._id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition-colors flex items-center gap-2 ml-auto"
                          >
                            <FaEye /> View Report
                          </button>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-xs font-bold py-2 px-4 rounded border border-gray-200 flex items-center gap-2 ml-auto w-fit cursor-default">
                            <FaBan size={12} /> Not Evaluated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResults;

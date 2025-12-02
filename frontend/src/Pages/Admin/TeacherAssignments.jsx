import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Unauthorized from "../../components/Unauthorized";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserTie,
  FaChalkboardTeacher,
  FaSearch,
  FaTimes,
  FaFilter,
} from "react-icons/fa";

const TeacherAssignments = () => {
  const { adminService, isPrincipal } = useAuth();

  // Data States
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // UI States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form States
  const [formData, setFormData] = useState({
    teacherId: "",
    classId: "",
    subjectId: "",
  });

  // Helper states for the "Split" dropdowns
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(""); // For the Grade dropdown
  const [selectedDivision, setSelectedDivision] = useState(""); // For the Division dropdown

  // Filtered lists based on selection
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  // --- Initial Fetch ---
  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
    fetchClasses();
    fetchSubjects();
  }, []);

  // --- Notification Timeout ---
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // --- API Calls ---
  const fetchAssignments = async () => {
    try {
      const result = await adminService.getTeacherAssignmentsforAdmin();
      // Handle various response structures safely
      const data = Array.isArray(result)
        ? result
        : result?.data?.data
        ? result.data.data
        : result?.data
        ? result.data
        : [];
      setAssignments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch assignments");
    }
  };

  const fetchTeachers = async () => {
    try {
      const result = await adminService.getUsers({ role: "teacher" });
      setTeachers(result.data?.teachers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async () => {
    try {
      const result = await adminService.getClasses();
      setClasses(result.data?.classes || result.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const result = await adminService.getSubjects();
      setSubjects(result.data?.subjects || result.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Form Logic ---

  // 1. Handle Teacher Selection
  const handleTeacherChange = (e) => {
    const tId = e.target.value;
    const teacher = teachers.find((t) => t._id === tId);

    setSelectedTeacher(teacher);
    setFormData((prev) => ({
      ...prev,
      teacherId: tId,
      classId: "",
      subjectId: "",
    }));

    // Reset secondary dropdowns
    setSelectedGrade("");
    setSelectedDivision("");

    if (teacher && teacher.schoolId) {
      const sId = teacher.schoolId._id || teacher.schoolId;

      // Filter available options by School
      const validClasses = classes.filter(
        (c) => (c.schoolId?._id || c.schoolId) === sId
      );
      const validSubjects = subjects.filter(
        (s) => (s.schoolId?._id || s.schoolId) === sId
      );

      setFilteredClasses(validClasses);
      setFilteredSubjects(validSubjects);
    } else {
      setFilteredClasses([]);
      setFilteredSubjects([]);
    }
  };

  // 2. Handle Grade Selection (Step 1 of Class)
  const handleGradeChange = (e) => {
    const grade = e.target.value;
    setSelectedGrade(grade);
    setSelectedDivision(""); // Reset division when grade changes
    setFormData((prev) => ({ ...prev, classId: "" })); // Reset actual class ID
  };

  // 3. Handle Division Selection (Step 2 of Class)
  const handleDivisionChange = (e) => {
    const division = e.target.value;
    setSelectedDivision(division);

    // Find the actual Class ID based on Grade + Division
    const actualClass = filteredClasses.find(
      (c) => c.grade == selectedGrade && c.division === division
    );

    if (actualClass) {
      setFormData((prev) => ({ ...prev, classId: actualClass._id }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validation check
      if (!formData.classId) {
        setError("Please select a valid Grade and Division.");
        setLoading(false);
        return;
      }

      const result = await adminService.assignTeacher(formData);
      if (result.success) {
        setSuccess("Teacher assigned successfully!");
        // Reset Form
        setShowCreateForm(false);
        setFormData({ teacherId: "", classId: "", subjectId: "" });
        setSelectedTeacher(null);
        setSelectedGrade("");
        setSelectedDivision("");
        fetchAssignments();
      } else {
        setError(result.error || "Failed to assign teacher");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this assignment?")) {
      try {
        const res = await adminService.removeAssignment(id);
        if (res.success) {
          setSuccess("Removed successfully");
          setAssignments((prev) => prev.filter((a) => a._id !== id));
        } else {
          setError(res.error);
        }
      } catch (err) {
        setError("Failed to remove");
      }
    }
  };

  // --- Data Processing for UI ---

  // 1. Unique Grades for Dropdown
  const availableGrades = useMemo(() => {
    const grades = filteredClasses.map((c) => c.grade);
    return [...new Set(grades)].sort((a, b) => a - b);
  }, [filteredClasses]);

  // 2. Unique Divisions for selected Grade
  const availableDivisions = useMemo(() => {
    if (!selectedGrade) return [];
    return filteredClasses
      .filter((c) => c.grade == selectedGrade)
      .map((c) => c.division)
      .sort();
  }, [filteredClasses, selectedGrade]);

  // 3. Grouping Logic for Table
  const groupedAssignments = useMemo(() => {
    // A. Filter first
    const filtered = assignments.filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.teacherName?.toLowerCase().includes(q) ||
        item.className?.toLowerCase().includes(q) ||
        item.subjectName?.toLowerCase().includes(q)
      );
    });

    // B. Group by "className" (e.g., "Grade 10 - Division A")
    const groups = {};
    filtered.forEach((item) => {
      if (!groups[item.className]) {
        groups[item.className] = [];
      }
      groups[item.className].push(item);
    });

    // C. Convert to array and Sort keys (Grade 9 before Grade 10)
    return Object.keys(groups)
      .sort((a, b) => {
        // Extract numbers to sort "Grade 2" before "Grade 10"
        const numA = parseInt(a.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.replace(/\D/g, "")) || 0;
        if (numA === numB) return a.localeCompare(b);
        return numA - numB;
      })
      .map((key) => ({
        className: key,
        items: groups[key],
      }));
  }, [assignments, searchQuery]);

  if (!isPrincipal?.()) return <Unauthorized />;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaChalkboardTeacher className="mr-3 text-indigo-600 text-3xl" />
            Teacher Assignments
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-10">
            Manage subject allocations for classes
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`px-5 py-2.5 rounded-lg font-medium flex items-center transition-all ${
            showCreateForm
              ? "bg-gray-100 text-gray-600"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
          }`}
        >
          {showCreateForm ? (
            <>
              <FaTimes className="mr-2" /> Cancel
            </>
          ) : (
            <>
              <FaPlus className="mr-2" /> New Assignment
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6">
          {success}
        </div>
      )}

      {/* Search Bar */}
      {!showCreateForm && (
        <div className="mb-6 relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by teacher, class, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8 animate-fade-in">
          <h3 className="text-lg font-bold text-indigo-900 mb-6 flex items-center">
            <FaPlus className="mr-2 text-sm" /> Assign Teacher
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* 1. Teacher */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Teacher
                </label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleTeacherChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Class/Grade (Split) */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Grade
                </label>
                <select
                  value={selectedGrade}
                  onChange={handleGradeChange}
                  disabled={!selectedTeacher}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">-- Grade --</option>
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>
                      Class {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Division (Split) */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Division
                </label>
                <select
                  value={selectedDivision}
                  onChange={handleDivisionChange}
                  disabled={!selectedGrade}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">-- Div --</option>
                  {availableDivisions.map((d) => (
                    <option key={d} value={d}>
                      Division {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Subject */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Subject
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  disabled={!selectedTeacher}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">-- Subject --</option>
                  {filteredSubjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.subjectId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-indigo-100">
              <button
                type="submit"
                disabled={loading || !formData.classId || !formData.subjectId}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm"
              >
                {loading ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        {groupedAssignments.length === 0 ? (
          <div className="text-center py-16 bg-gray-50">
            <FaUserTie className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">
              No assignments found matching your criteria.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                  Class & Division
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                  Subject
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Assigned Teacher
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedAssignments.map((group, groupIdx) => (
                <React.Fragment key={group.className}>
                  {group.items.map((assignment, itemIdx) => (
                    <tr
                      key={assignment._id}
                      className={`hover:bg-opacity-75 transition-colors ${
                        groupIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {/* Only render the Class Name cell for the first item in the group */}
                      {itemIdx === 0 && (
                        <td
                          rowSpan={group.items.length}
                          className={`px-6 py-4 whitespace-nowrap align-top border-r border-gray-100 ${
                            groupIdx % 2 === 0
                              ? "bg-indigo-50/30"
                              : "bg-gray-100/50"
                          }`}
                        >
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800">
                            {group.className}
                          </span>
                        </td>
                      )}

                      {/* Subject Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">
                            {assignment.subjectName}
                          </span>
                          <span className="text-xs text-gray-500">
                            Code: {assignment.subjectCode}
                          </span>
                        </div>
                      </td>

                      {/* Teacher Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                            <FaUserTie size={14} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {assignment.teacherName}
                          </span>
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(assignment._id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                          title="Remove Assignment"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;

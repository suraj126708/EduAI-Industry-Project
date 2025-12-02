import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaPlus,
  FaTrash,
  FaGraduationCap,
  FaTimes,
  FaCheck,
} from "react-icons/fa";

const Classes = () => {
  const { adminService, userProfile } = useAuth();

  const [classes, setClasses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Feedback States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Available Divisions Constant
  const AVAILABLE_DIVISIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];

  const [formData, setFormData] = useState({
    schoolId: "",
    grade: "",
    divisions: [], // Changed from string to array for multi-select
  });

  // --- Auto-dismiss Notifications ---
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // --- Fetch Data ---
  const fetchSchools = async () => {
    try {
      const result = await adminService.getSchools();
      setSchools(Array.isArray(result.data.data) ? result.data.data : []);
    } catch (err) {
      setError("Failed to fetch schools.");
    }
  };

  const fetchClasses = async () => {
    try {
      const result = await adminService.getClasses();
      setClasses(Array.isArray(result.data.data) ? result.data.data : []);
    } catch (err) {
      setError("Failed to fetch classes.");
    }
  };

  useEffect(() => {
    if (userProfile?.role === "principal") {
      setFormData((prev) => ({ ...prev, schoolId: userProfile.schoolId?._id }));
    }
    if (userProfile?.role === "superadmin") {
      fetchSchools();
    }
    fetchClasses();
  }, [userProfile]);

  // --- Data Grouping Logic ---
  const groupedClasses = useMemo(() => {
    const groups = {};
    classes.forEach((cls) => {
      const sId =
        typeof cls.schoolId === "object" ? cls.schoolId._id : cls.schoolId;
      const uniqueKey = `${sId}-${cls.grade}`;

      if (!groups[uniqueKey]) {
        groups[uniqueKey] = {
          schoolId: cls.schoolId,
          grade: cls.grade,
          divisions: [],
        };
      }
      groups[uniqueKey].divisions.push({
        _id: cls._id,
        division: cls.division,
      });
    });

    return Object.values(groups).sort((a, b) => a.grade - b.grade);
  }, [classes]);

  // --- Form Handlers ---

  // Handle Grade/School changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Division Toggle (Multi-select)
  const toggleDivision = (div) => {
    setFormData((prev) => {
      const exists = prev.divisions.includes(div);
      if (exists) {
        return { ...prev, divisions: prev.divisions.filter((d) => d !== div) };
      } else {
        return { ...prev, divisions: [...prev.divisions, div] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.divisions.length === 0) {
      setError("Please select at least one division.");
      return;
    }
    if (!formData.grade) {
      setError("Please select a class grade.");
      return;
    }

    setLoading(true);

    try {
      // Create an array of API promises - one for each selected division
      // This allows the frontend to look like bulk-create while keeping the backend simple
      const apiPromises = formData.divisions.map((div) => {
        // Check locally if exists to avoid unnecessary API calls
        const exists = classes.some(
          (c) =>
            (c.schoolId?._id === formData.schoolId ||
              c.schoolId === formData.schoolId) &&
            c.grade == formData.grade &&
            c.division === div
        );

        if (exists) return Promise.resolve({ skipped: true, division: div });

        return adminService.createClass({
          schoolId: formData.schoolId,
          grade: formData.grade,
          division: div,
        });
      });

      await Promise.all(apiPromises);

      setSuccess(`Classes created for Grade ${formData.grade}!`);

      // Reset form but keep school
      setFormData((prev) => ({
        ...prev,
        grade: "",
        divisions: [],
      }));

      fetchClasses();
    } catch (err) {
      console.error(err);
      setError("Failed to create some classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDivision = async (classId) => {
    if (window.confirm("Delete this specific division?")) {
      try {
        const result = await adminService.deleteClass(classId);
        if (result.success) {
          setSuccess("Division deleted.");
          setClasses((prev) => prev.filter((cls) => cls._id !== classId));
        } else {
          setError("Failed to delete.");
        }
      } catch (err) {
        setError("Error deleting class.");
      }
    }
  };

  const handleDeleteGroup = async (group) => {
    if (window.confirm(`Delete Class ${group.grade} and ALL its divisions?`)) {
      try {
        const deletePromises = group.divisions.map((div) =>
          adminService.deleteClass(div._id)
        );
        await Promise.all(deletePromises);
        setSuccess(`Class ${group.grade} deleted successfully.`);
        fetchClasses();
      } catch (err) {
        setError("Failed to delete some classes.");
      }
    }
  };

  const getSchoolName = (schoolId) => {
    if (!schoolId) return "Unknown";
    if (typeof schoolId === "object") return schoolId.name || "Unknown";
    const school = schools.find((s) => s._id === schoolId);
    return school ? school.name : "Unknown";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaGraduationCap className="mr-3 text-indigo-600 text-3xl" />
            Class Management
          </h2>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`px-5 py-2.5 rounded-lg font-medium flex items-center transition-all shadow-sm ${
            showCreateForm
              ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {showCreateForm ? (
            <>
              <FaTimes className="mr-2" /> Cancel
            </>
          ) : (
            <>
              <FaPlus className="mr-2" /> Add Class
            </>
          )}
        </button>
      </div>

      {/* --- Notifications --- */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded mb-4 border-l-4 border-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded mb-4 border-l-4 border-green-500">
          {success}
        </div>
      )}

      {/* --- Create Form --- */}
      {showCreateForm && (
        <div className="bg-white p-8 rounded-xl border border-indigo-100 shadow-sm mb-8 animate-slide-down">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">
            Create New Class
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* 1. School Dropdown (Superadmin only) - Span 4 cols */}
              {userProfile?.role === "superadmin" && (
                <div className="md:col-span-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    School
                  </label>
                  <div className="relative">
                    <select
                      name="schoolId"
                      value={formData.schoolId}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-colors"
                    >
                      <option value="">Select School</option>
                      {schools.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Grade Dropdown - Span 4 cols */}
              <div
                className={
                  userProfile?.role === "superadmin"
                    ? "md:col-span-4"
                    : "md:col-span-6"
                }
              >
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Class Level
                </label>
                <div className="relative">
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-colors"
                  >
                    <option value="">Select Grade</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (grade) => (
                        <option key={grade} value={grade}>
                          {grade}th Grade
                        </option>
                      )
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 3. Multi-Select Divisions - Span Full row or partial based on design */}
              <div className="md:col-span-12">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Select Divisions{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (Click multiple)
                  </span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_DIVISIONS.map((div) => {
                    const isSelected = formData.divisions.includes(div);
                    return (
                      <button
                        type="button"
                        key={div}
                        onClick={() => toggleDivision(div)}
                        className={`
                                    w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all transform hover:scale-105
                                    ${
                                      isSelected
                                        ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 ring-offset-1"
                                        : "bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-500"
                                    }
                                `}
                      >
                        {div}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 h-6 text-sm text-indigo-600 font-medium">
                  {formData.divisions.length > 0 &&
                    `Selected: ${formData.divisions.sort().join(", ")}`}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t pt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transition-all flex items-center"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <FaCheck className="mr-2" /> Create Classes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- Data Table --- */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {groupedClasses.length === 0 ? (
          <div className="text-center py-16 bg-gray-50">
            <FaGraduationCap className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No classes found. Add one above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {userProfile?.role === "superadmin" && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                    School
                  </th>
                )}
                {/* Fixed widths ensure alignment */}
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Divisions
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groupedClasses.map((group, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-indigo-50/30 transition-colors group"
                >
                  {userProfile?.role === "superadmin" && (
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 align-middle">
                      {getSchoolName(group.schoolId)}
                    </td>
                  )}

                  <td className="px-6 py-4 align-middle">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200 font-bold text-sm">
                      Class {group.grade}
                    </div>
                  </td>

                  <td className="px-6 py-4 align-middle">
                    <div className="flex flex-wrap gap-2">
                      {group.divisions
                        .sort((a, b) => a.division.localeCompare(b.division))
                        .map((div) => (
                          <div
                            key={div._id}
                            className="group/tag inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            Div {div.division}
                            <button
                              onClick={() => handleDeleteDivision(div._id)}
                              className="ml-2 text-indigo-300 hover:text-red-500 focus:outline-none opacity-0 group-hover/tag:opacity-100 transition-opacity"
                            >
                              <FaTimes size={10} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right align-middle">
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded hover:bg-red-50"
                      title="Delete Grade"
                    >
                      <FaTrash size={14} />
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
};

export default Classes;

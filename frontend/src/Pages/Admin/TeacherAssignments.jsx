import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Unauthorized from "../../components/Unauthorized";
import { bookAPI } from "../../utils/api";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserTie,
  FaChalkboardTeacher,
} from "react-icons/fa";

const TeacherAssignments = () => {
  const { adminService, isPrincipal } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    teacherId: "",
    classId: "",
    subjectId: "",
  });

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchAssignments = async () => {
    try {
      const result = await adminService.getTeacherAssignmentsforAdmin();
      console.log("Teacher Assignment: ", result);
      const assignmentsArray = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.assignments)
        ? result.assignments
        : Array.isArray(result?.data?.data)
        ? result.data.data
        : [];

      if (Array.isArray(assignmentsArray)) {
        setAssignments(assignmentsArray);
      } else {
        console.error("Failed to fetch assignments:", result);
        setError("Failed to fetch assignments: Data not an array");
      }
    } catch (err) {
      console.error("Fetch assignments error:", err);
      setError("Failed to fetch assignments");
    }
  };

  const fetchTeachers = async () => {
    try {
      const result = await adminService.getUsers({ role: "teacher" });
      const teachersArray = result.data?.teachers; // This path was correct

      if (Array.isArray(teachersArray)) {
        setTeachers(teachersArray);
      } else {
        console.error("Failed to fetch teachers:", result.error);
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    }
  };

  const fetchClasses = async () => {
    try {
      const result = await adminService.getClasses();
      const classesArray = result.data?.classes || result.data?.data;

      if (Array.isArray(classesArray)) {
        setClasses(classesArray);
      } else {
        console.error("Failed to fetch classes:", result.error);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const result = await adminService.getSubjects();
      const subjectsArray = result.data?.subjects || result.data?.data; // Correct path

      if (Array.isArray(subjectsArray)) {
        setSubjects(subjectsArray);
      } else {
        console.error("Failed to fetch subjects:", result.error);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "teacherId") {
      // Find the selected teacher
      const teacher = teachers.find((t) => t._id === value);
      setSelectedTeacher(teacher);

      // Filter classes and subjects by teacher's school
      if (teacher && teacher.schoolId) {
        const teacherSchoolId = teacher.schoolId._id || teacher.schoolId;
        const filteredClassesBySchool = Array.isArray(classes)
          ? classes.filter(
              (c) => (c.schoolId?._id || c.schoolId) === teacherSchoolId
            )
          : [];
        const filteredSubjectsBySchool = Array.isArray(subjects)
          ? subjects.filter(
              (s) => (s.schoolId?._id || s.schoolId) === teacherSchoolId
            )
          : [];

        setFilteredClasses(filteredClassesBySchool);
        setFilteredSubjects(filteredSubjectsBySchool);
        console.log(
          "[Assignments] Selected teacher:",
          teacher?._id,
          "school:",
          teacherSchoolId
        );
        console.log(
          "[Assignments] Filtered classes count:",
          filteredClassesBySchool.length
        );
        console.log(
          "[Assignments] Filtered subjects count:",
          filteredSubjectsBySchool.length
        );
      } else {
        setFilteredClasses([]);
        setFilteredSubjects([]);
      }

      // Reset class and subject when teacher changes
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        classId: "",
        subjectId: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Client-side validation: ensure all belong to same school
      const teacherSchoolId =
        selectedTeacher?.schoolId?._id || selectedTeacher?.schoolId || null;
      const selectedClass = (
        Array.isArray(filteredClasses) ? filteredClasses : classes
      ).find((c) => c._id === formData.classId);
      const selectedSubject = (
        Array.isArray(filteredSubjects) ? filteredSubjects : subjects
      ).find((s) => s._id === formData.subjectId);
      const classSchoolId =
        selectedClass?.schoolId?._id || selectedClass?.schoolId || null;
      const subjectSchoolId =
        selectedSubject?.schoolId?._id || selectedSubject?.schoolId || null;

      console.log("[Assignments] teacherSchoolId:", teacherSchoolId);
      console.log(
        "[Assignments] classId:",
        formData.classId,
        "classSchoolId:",
        classSchoolId
      );
      console.log(
        "[Assignments] subjectId:",
        formData.subjectId,
        "subjectSchoolId:",
        subjectSchoolId
      );

      if (!teacherSchoolId || !classSchoolId || !subjectSchoolId) {
        setError(
          "Teacher, class, and subject must be associated with a school"
        );
        setLoading(false);
        return;
      }

      if (
        teacherSchoolId !== classSchoolId ||
        teacherSchoolId !== subjectSchoolId
      ) {
        setError(
          "Selected teacher, class, and subject must belong to the same school"
        );
        setLoading(false);
        return;
      }

      const result = await adminService.assignTeacher(formData);
      if (result.success) {
        setSuccess("Teacher assigned successfully!");
        setFormData({
          teacherId: "",
          classId: "",
          subjectId: "",
        });
        setSelectedTeacher(null);
        setFilteredClasses([]);
        setFilteredSubjects([]);
        setShowCreateForm(false);
        // Refresh assignments list
        fetchAssignments();
      } else {
        setError(result.error || "Failed to assign teacher");
      }
    } catch (err) {
      const backendMsg =
        err.response?.data?.error || err.response?.data?.message || err.message;
      console.error("[Assignments] Backend error:", err.response?.data || err);
      setError(backendMsg || "Failed to assign teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm("Are you sure you want to remove this assignment?")) {
      try {
        const result = await adminService.removeAssignment(assignmentId);
        if (result.success) {
          setSuccess("Assignment removed successfully!");
          setAssignments(
            assignments.filter((assignment) => assignment._id !== assignmentId)
          );
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to remove assignment");
      }
    }
  };

  // These functions are no longer needed since the backend returns transformed data
  // with readable names already included

  // Route guard: principals only
  if (!isPrincipal?.()) {
    return <Unauthorized />;
  }

  const canSubmit = !!(
    selectedTeacher &&
    formData.classId &&
    formData.subjectId &&
    !loading
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaChalkboardTeacher className="mr-2 text-indigo-600" />
          Teacher Assignments
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <FaPlus className="mr-2" />
          Assign Teacher
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Assign Teacher to Class & Subject
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher *
                </label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                  required
                  disabled={!selectedTeacher}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">
                    {selectedTeacher ? "Select Class" : "Select Teacher First"}
                  </option>
                  {filteredClasses.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      Grade {cls.grade} - Division {cls.division}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  required
                  disabled={!selectedTeacher}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">
                    {selectedTeacher
                      ? "Select Subject"
                      : "Select Teacher First"}
                  </option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectId} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Assigning..." : "Assign Teacher"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    teacherId: "",
                    classId: "",
                    subjectId: "",
                  });
                  setSelectedTeacher(null);
                  setFilteredClasses([]);
                  setFilteredSubjects([]);
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Current Assignments
          </h3>
        </div>
        <div className="p-6">
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaUserTie className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>
                No teacher assignments found. Create your first assignment to
                get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <FaUserTie className="h-4 w-4 text-indigo-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.teacherName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {assignment.className}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.subjectName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {assignment.subjectCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(assignment._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignments;

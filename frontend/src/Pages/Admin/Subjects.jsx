import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FaPlus, FaEdit, FaTrash, FaBook } from "react-icons/fa";

const Subjects = () => {
  // 1. Get userProfile to know the user's role and school name
  const { adminService, userProfile } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [schools, setSchools] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    schoolId: "",
    subjectId: "",
    name: "",
  });

  // Fetches the list of all schools (for super admin dropdown)
  const fetchSchools = async () => {
    try {
      const result = await adminService.getSchools();
      const schoolsArray = result.data?.data;
      if (result.success && Array.isArray(schoolsArray)) {
        setSchools(schoolsArray);
      } else {
        console.error("API did not return a valid array for schools:", result);
        setSchools([]);
      }
    } catch (err) {
      setError("Failed to fetch schools.");
      setSchools([]);
    }
  };

  // Fetches subjects based on the user's role
  const fetchSubjects = async () => {
    try {
      const result = await adminService.getSubjects();
      const subjectsArray = result.data?.data;
      if (result.success && Array.isArray(subjectsArray)) {
        setSubjects(subjectsArray);
      } else {
        console.error("API did not return a valid array for subjects:", result);
        setSubjects([]);
      }
    } catch (err) {
      setError("Failed to fetch subjects.");
      setSubjects([]);
    }
  };

  // Main data fetching effect
  useEffect(() => {
    // Set the schoolId in the form by default for principals
    if (userProfile?.role === "principal") {
      setFormData((prev) => ({ ...prev, schoolId: userProfile.schoolId?._id }));
    }
    // Only super admins need the full list of schools for the dropdown
    if (userProfile?.role === "superadmin") {
      fetchSchools();
    }
    fetchSubjects();
  }, [userProfile]); // Dependency ensures this runs when userProfile is loaded

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateSubjectId = (subjectName) => {
    if (!subjectName) return "";
    const cleanName = subjectName.toUpperCase().replace(/\s+/g, "");
    if (cleanName.length >= 2) {
      const prefix = cleanName.substring(0, Math.min(4, cleanName.length));
      return `${prefix}101`;
    }
    return "";
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: name,
      subjectId: generateSubjectId(name),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const subjectIdPattern = /^[A-Z]{2,4}\d{3}$/;
    if (!subjectIdPattern.test(formData.subjectId)) {
      setError(
        "Subject ID must be in format like CS101 (2-4 letters, 3 digits)"
      );
      setLoading(false);
      return;
    }

    try {
      const result = await adminService.createSubject(formData);
      if (result.success) {
        setSuccess("Subject created successfully!");
        setFormData({
          schoolId:
            userProfile?.role === "principal" ? userProfile.schoolId._id : "",
          subjectId: "",
          name: "",
        });
        setShowCreateForm(false);
        fetchSubjects(); // Refresh the list
      } else {
        setError(result.error || "An error occurred.");
      }
    } catch (err) {
      setError("Failed to create subject.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        const result = await adminService.deleteSubject(subjectId);
        if (result.success) {
          setSuccess("Subject deleted successfully!");
          setSubjects(subjects.filter((subject) => subject._id !== subjectId));
        } else {
          setError(result.error || "Failed to delete.");
        }
      } catch (err) {
        setError("Failed to delete subject.");
      }
    }
  };

  // Helper function only used by super admins to find school names
  const getSchoolName = (schoolId) => {
    const school = schools.find((s) => s._id === schoolId);
    return school ? school.name : "Unknown School";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaBook className="mr-2 text-indigo-600" />
          {/* 2. Title is now dynamic based on user role */}
          {userProfile?.role === "principal"
            ? `${
                userProfile.schoolId?.name || "My School"
              } - Subject Management`
            : "Subject Management"}
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Subject
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
          <h3 className="text-lg font-semibold mb-4">Create New Subject</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* School selection is now only shown to super admins */}
              {userProfile?.role === "superadmin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School *
                  </label>
                  <select
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select School</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  placeholder="e.g., Computer Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Subject ID Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject ID *
                </label>
                <input
                  type="text"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., CS101, MATH101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 2-4 letters followed by 3 digits (e.g., CS101,
                  MATH101)
                </p>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Subject"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
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
          <h3 className="text-lg font-semibold text-gray-800">Subjects List</h3>
        </div>
        <div className="p-6">
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaBook className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>
                No subjects found. Create your first subject to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* 4. The "School" column header is now conditional */}
                    {userProfile?.role === "superadmin" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjects.map((subject) => (
                    <tr key={subject._id} className="hover:bg-gray-50">
                      {/* 5. The "School" data cell is also conditional */}
                      {userProfile?.role === "superadmin" && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getSchoolName(subject.schoolId)}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {subject.subjectId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subject.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(subject._id)}
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

export default Subjects;

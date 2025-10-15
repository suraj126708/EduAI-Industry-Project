import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FaPlus, FaEdit, FaTrash, FaGraduationCap } from "react-icons/fa";

const Classes = () => {
  // Get user profile and API service from the authentication context
  const { adminService, userProfile } = useAuth();

  const [classes, setClasses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    schoolId: "",
    grade: "",
    division: "",
  });

  // Fetches the list of all schools (for super admin dropdown)
  const fetchSchools = async () => {
    try {
      const result = await adminService.getSchools();
      const schoolsArray = result.data;
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

  // Fetches classes based on the user's role
  const fetchClasses = async () => {
    try {
      const result = await adminService.getClasses();
      const classesArray = result.data;
      if (result.success && Array.isArray(classesArray)) {
        setClasses(classesArray);
      } else {
        console.error("API did not return a valid array for classes:", result);
        setClasses([]);
      }
    } catch (err) {
      setError("Failed to fetch classes.");
      setClasses([]);
    }
  };

  // Main data fetching effect
  useEffect(() => {
    // A principal's school ID is already in their profile, so we can set it in the form by default.
    if (userProfile?.role === "principal") {
      setFormData((prev) => ({ ...prev, schoolId: userProfile.schoolId?._id }));
    }
    // Only super admins need the list of all schools for the dropdown.
    if (userProfile?.role === "superadmin") {
      fetchSchools();
    }
    fetchClasses();
  }, [userProfile]); // Dependency ensures this runs when the user profile is loaded

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await adminService.createClass(formData);
      if (result.success) {
        setSuccess("Class created successfully!");
        setFormData({
          schoolId:
            userProfile?.role === "principal" ? userProfile.schoolId._id : "",
          grade: "",
          division: "",
        });
        setShowCreateForm(false);
        fetchClasses(); // Refresh the list
      } else {
        setError(result.error || "An error occurred.");
      }
    } catch (err) {
      setError("Failed to create class.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        const result = await adminService.deleteClass(classId);
        if (result.success) {
          setSuccess("Class deleted successfully!");
          setClasses(classes.filter((cls) => cls._id !== classId));
        } else {
          setError(result.error || "Failed to delete.");
        }
      } catch (err) {
        setError("Failed to delete class.");
      }
    }
  };

  // Helper function only used by super admins to find school names
  const getSchoolName = (schoolId) => {
    // Accept both an id string or an embedded school object
    if (!schoolId) return "Unknown School";
    if (typeof schoolId === "object") {
      return schoolId.name || "Unknown School";
    }
    const school = schools.find((s) => s._id === schoolId);
    return school ? school.name : "Unknown School";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaGraduationCap className="mr-2 text-indigo-600" />
          {/* Title is now dynamic based on user role */}
          {userProfile?.role === "principal"
            ? `${userProfile.schoolId?.name || "My School"} - Class Management`
            : "Class Management"}
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Class
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
          <h3 className="text-lg font-semibold mb-4">Create New Class</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Class</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <option key={grade} value={grade}>
                      Class {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division *
                </label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Division</option>
                  {["A", "B", "C", "D", "E", "F"].map((div) => (
                    <option key={div} value={div}>
                      Division {div}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Class"}
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
          <h3 className="text-lg font-semibold text-gray-800">Classes List</h3>
        </div>
        <div className="p-6">
          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaGraduationCap className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>No classes found. Create your first class to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* The "School" column header is now conditional */}
                    {userProfile?.role === "superadmin" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Division
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classes.map((cls) => (
                    <tr key={cls._id} className="hover:bg-gray-50">
                      {/* The "School" data cell is also conditional */}
                      {userProfile?.role === "superadmin" && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getSchoolName(cls.schoolId)}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Class {cls.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Division {cls.division}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(cls._id)}
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

export default Classes;

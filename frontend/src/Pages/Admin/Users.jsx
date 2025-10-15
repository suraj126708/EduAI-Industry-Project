import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaSearch,
  FaFilter,
  FaDownload,
} from "react-icons/fa";

const AdminUsers = () => {
  const { adminService, userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "teacher",
    status: "active",
    schoolId: "",
  });

  useEffect(() => {
    fetchUsers();
    // Only super admins need the full list of schools
    if (userProfile?.role === "superadmin") {
      fetchSchools();
    }
  }, [filters, userProfile]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await adminService.getUsers(filters);
      if (result.success) {
        setUsers(result.data.teachers || []);
        console.log(result.data.teachers);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const result = await adminService.getSchools();
      const schoolsArray = result.data?.data; // Access the nested array

      if (result.success && Array.isArray(schoolsArray)) {
        setSchools(schoolsArray);
      } else {
        console.error("Failed to fetch schools:", result.error);
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 2. SIMPLIFIED: This function now ONLY handles updating a user.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure we are in edit mode
    if (!editingUser) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // The logic for creating a new user has been removed.
      const result = await adminService.updateUser(editingUser._id, formData);
      if (result.success) {
        setSuccess("User updated successfully!");
        setEditingUser(null);
        setShowEditForm(false);
        fetchUsers(); // Refresh the list
      } else {
        setError(result.error || "Failed to update user.");
      }
    } catch (err) {
      setError("An error occurred while saving the user.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);

    let schoolIdToSet = user.schoolId?._id || "";
    if (userProfile?.role === "principal" && !user.schoolId) {
      schoolIdToSet = userProfile.schoolId?._id;
    }

    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "teacher",
      status: user.status || "active",
      schoolId: schoolIdToSet,
    });
    setShowEditForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const result = await adminService.deleteUser(userId);
        if (result.success) {
          setSuccess("User deleted successfully!");
          fetchUsers();
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to delete user");
      }
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const result = await adminService.updateUserStatus(userId, newStatus);
      if (result.success) {
        setSuccess("User status updated successfully!");
        fetchUsers();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to update user status");
    }
  };

  const handleExport = async () => {
    try {
      const result = await adminService.exportUsers(filters);
      if (result.success) {
        // Create and download CSV
        const csvData = result.data.teachers
          .map(
            (user) =>
              `${user.email},${user.name || ""},${user.role},${user.status}`
          )
          .join("\n");
        const csvContent = "Email,Name,Role,Status\n" + csvData;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "teachers-export.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to export users");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-800";
      case "principal":
        return "bg-blue-100 text-blue-800";
      case "teacher":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /*const getSchoolName = (schoolId) => {
    if (!schoolId) return "No School Assigned";
    const school = schools.find((s) => s._id === schoolId);
    return school ? school.name : "Unknown School";
  };*/

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "teacher",
      status: "active",
      schoolId: "",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUserPlus className="mr-2 text-indigo-600" />
          {/* ✨ IMPROVEMENT: Make title role-aware */}
          {userProfile?.role === "principal"
            ? `${
                userProfile.schoolId?.name || "My School"
              } - Teacher Management`
            : "Teacher Management"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
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

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="teacher">Teacher</option>
              <option value="principal">Principal</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: "", role: "", status: "" })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODIFIED: The form is now only for editing. */}
      {showEditForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Edit Teacher</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              {/* School dropdown is only for super admins */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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

              {/* Role and Status selects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Update Teacher"}
              </button>
              <button
                type="button"
                onClick={closeEditForm}
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
          <h3 className="text-lg font-semibold text-gray-800">Teachers List</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading teachers...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaUserPlus className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>
                No teachers found. New teachers who sign up will appear here.
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
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {user.name
                                  ? user.name.charAt(0).toUpperCase()
                                  : user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.schoolId?.name || "No School Assigned"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.status}
                          onChange={(e) =>
                            handleStatusChange(user._id, e.target.value)
                          }
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(
                            user.status
                          )}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
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

export default AdminUsers;

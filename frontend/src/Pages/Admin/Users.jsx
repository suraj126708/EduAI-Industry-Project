import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaSearch,
  FaTimes,
  FaChalkboardTeacher,
} from "react-icons/fa";

const AdminUsers = () => {
  const { adminService, userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher",
    status: "active",
    schoolId: "",
  });

  // --- Auto-dismiss Alerts ---
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    fetchUsers();
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
      const schoolsArray = result.data?.data;
      if (result.success && Array.isArray(schoolsArray)) {
        setSchools(schoolsArray);
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      // Sync password with email only during creation
      if (!editingUser && name === "email") {
        newFormData.password = value;
      }
      return newFormData;
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (editingUser) {
        const { password, ...updateData } = formData;
        result = await adminService.updateUser(editingUser._id, updateData);
      } else {
        result = await adminService.createUser(formData);
      }

      if (result.success) {
        setSuccess(editingUser ? "Teacher updated!" : "Teacher created!");
        closeForm();
        fetchUsers();
      } else {
        setError(result.message || result.error || "Operation failed.");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowCreateForm = () => {
    setEditingUser(null);
    const defaultSchoolId =
      userProfile?.role === "principal" ? userProfile.schoolId?._id || "" : "";

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "teacher",
      status: "active",
      schoolId: defaultSchoolId,
    });
    setShowForm(true);
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
      password: "",
    });
    setShowForm(true);
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
        setSuccess("Status updated");
        fetchUsers(); // Refresh to ensure UI stays synced
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "teacher",
      status: "active",
      schoolId: "",
    });
  };

  // --- Helper to get badge colors ---
  const getRoleBadge = (role) => {
    const styles = {
      superadmin: "bg-purple-100 text-purple-700 border-purple-200",
      principal: "bg-blue-100 text-blue-700 border-blue-200",
      teacher: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
    return styles[role] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 ring-green-600/20";
      case "inactive":
        return "bg-gray-100 text-gray-800 ring-gray-500/10";
      case "suspended":
        return "bg-red-50 text-red-700 ring-red-600/10";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          {/* Displays School Name directly as the main title */}
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {userProfile?.schoolId?.name || "School Administration"}
          </h1>
          <p className="text-gray-500 mt-1 text-lg flex items-center">
            <FaChalkboardTeacher className="mr-2" /> Teacher Directory
          </p>
        </div>

        <button
          onClick={handleShowCreateForm}
          className={`px-5 py-2.5 rounded-lg font-medium flex items-center transition-all shadow-sm ${
            showForm
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
          }`}
        >
          {showForm ? (
            <>
              <FaTimes className="mr-2" /> Cancel
            </>
          ) : (
            <>
              <FaUserPlus className="mr-2" /> Add Teacher
            </>
          )}
        </button>
      </div>

      {/* --- Notifications --- */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 animate-fade-in">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6 animate-fade-in">
          {success}
        </div>
      )}

      {/* --- Filters Bar --- */}
      <div className="bg-gray-50 p-5 rounded-xl mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search - Spans 5 columns */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Find by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            </div>
          </div>

          {/* Role Filter - Spans 3 columns */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Role
            </label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="teacher">Teacher</option>
              <option value="principal">Principal</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          {/* Status Filter - Spans 3 columns */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Clear Button - Spans 1 column */}
          <div className="md:col-span-1 flex items-end">
            <button
              onClick={() => setFilters({ search: "", role: "", status: "" })}
              className="w-full py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors text-sm font-medium"
              title="Clear Filters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* --- Create / Edit Form --- */}
      {showForm && (
        <div className="bg-white p-8 rounded-xl border border-indigo-100 shadow-lg mb-8 animate-slide-down relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            {editingUser ? "Edit Teacher Details" : "Onboard New Teacher"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  readOnly={!!editingUser}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                    editingUser
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "focus:ring-2 focus:ring-indigo-500"
                  }`}
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Initially set to match email address.
                  </p>
                </div>
              )}

              {userProfile?.role === "superadmin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign School
                  </label>
                  <select
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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

              {editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="teacher">Teacher</option>
                      <option value="principal">Principal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium shadow-md transition-all disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editingUser
                  ? "Update User"
                  : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- Table Section --- */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <FaChalkboardTeacher className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              No teachers found
            </h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
              No records matched your filters. Try adjusting your search or add
              a new teacher.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Teacher Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    {/* Name Column (No Email) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-700 font-bold text-sm shadow-sm">
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {user.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Separate Email Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-medium">
                        {user.email}
                      </span>
                    </td>

                    {/* Role Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.status}
                        onChange={(e) =>
                          handleStatusChange(user._id, e.target.value)
                        }
                        className={`text-xs font-bold rounded-full px-3 py-1 border-0 ring-1 focus:ring-2 cursor-pointer outline-none appearance-none ${getStatusColor(
                          user.status
                        )}`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Delete"
                        >
                          <FaTrash size={16} />
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
  );
};

export default AdminUsers;

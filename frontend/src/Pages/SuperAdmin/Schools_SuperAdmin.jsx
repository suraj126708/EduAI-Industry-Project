// src/Pages/SuperAdmin/Schools_SuperAdmin.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
// Import schoolAPI for the new verify function, keep adminService if it has other legacy methods
import { adminService, schoolAPI } from "../../utils/api";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSchool,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
} from "react-icons/fa";

const Schools = () => {
  const { isSuperAdmin } = useAuth();
  const [schools, setSchools] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  // Filter state for tabs
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'pending', 'verified'

  const [formData, setFormData] = useState({
    name: "",
    type: "public",
    establishedYear: "",
    address: "",
    contact: "",
    emailDomain: "",
    principalName: "",
    principalEmail: "",
    principalPassword: "",
  });

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      // Use schoolAPI.getSchools() which we defined to hit /api/superadmin/schools
      const result = await schoolAPI.getSchools();
      if (result.success) {
        setSchools(result.data);
      } else {
        throw new Error(result.message || "Could not fetch schools.");
      }
    } catch (err) {
      setError(err.message || "Failed to load schools");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchSchools();
    }
  }, [isSuperAdmin, fetchSchools]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- NEW: Handle Verification ---
  const handleVerify = async (schoolId) => {
    if (
      !window.confirm(
        "Are you sure you want to verify this school? This will activate the Principal's account."
      )
    )
      return;

    try {
      setLoading(true);
      const result = await schoolAPI.verifySchool(schoolId);
      if (result.success) {
        setSuccess("School verified successfully!");
        fetchSchools(); // Refresh list to show updated status
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify school");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Use schoolAPI.createSchool for manual creation
      const result = await schoolAPI.createSchool(formData);
      if (result.success) {
        setSuccess("School created successfully!");
        if (result.data?.temporaryPassword) {
          setTempPassword(result.data.temporaryPassword);
        }
        setFormData({
          name: "",
          type: "public",
          establishedYear: "",
          address: "",
          contact: "",
          emailDomain: "",
          principalName: "",
          principalEmail: "",
          principalPassword: "",
        });
        setShowCreateForm(false);
        fetchSchools();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create school");
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin()) return <div className="p-6">Access Denied.</div>;

  // Filter schools based on selected tab
  const filteredSchools = schools.filter((school) => {
    if (filterStatus === "all") return true;
    return school.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaSchool className="text-indigo-600" />
            School Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage registrations and verifications
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 font-medium"
        >
          <FaPlus /> {showCreateForm ? "Cancel" : "Add School Manually"}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6 shadow-sm">
          <p className="font-medium">{success}</p>
          {tempPassword && (
            <div className="mt-2 bg-white p-3 rounded border border-green-200">
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Principal's Temp Password:
              </span>
              <p className="font-mono text-lg font-bold text-gray-800 select-all">
                {tempPassword}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Creation Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8 animate-fadeIn">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2">
            Create New School
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* School Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Institution Details
                </h4>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  type="text"
                  name="name"
                  placeholder="School Name *"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="government">Government</option>
                  </select>
                  <input
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    type="number"
                    name="establishedYear"
                    placeholder="Est. Year"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                  />
                </div>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  type="tel"
                  name="contact"
                  placeholder="Contact Number *"
                  value={formData.contact}
                  onChange={handleInputChange}
                  required
                />
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  name="address"
                  placeholder="Address *"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  required
                />
              </div>

              {/* Principal Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Principal Account
                </h4>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  type="text"
                  name="principalName"
                  placeholder="Principal Name *"
                  value={formData.principalName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  type="email"
                  name="principalEmail"
                  placeholder="Principal Email *"
                  value={formData.principalEmail}
                  onChange={handleInputChange}
                  required
                />
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  type="password"
                  name="principalPassword"
                  placeholder="Initial Password *"
                  value={formData.principalPassword}
                  onChange={handleInputChange}
                  required
                />
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  type="text"
                  name="emailDomain"
                  placeholder="Email Domain (e.g. school.edu)"
                  value={formData.emailDomain}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg disabled:opacity-50 transition-all font-medium"
              >
                {loading ? "Creating..." : "Create School"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {["all", "pending", "verified"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`pb-3 px-4 font-medium transition-colors capitalize border-b-2 ${
              filterStatus === status
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {status}{" "}
            {status === "pending" &&
              schools.filter((s) => s.status === "pending").length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  {schools.filter((s) => s.status === "pending").length}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  School Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Principal
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <tr
                    key={school._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {school.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {school.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {school.type} • {school.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {school.principalId?.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {school.principalId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                          school.status === "verified"
                            ? "bg-green-100 text-green-800"
                            : school.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {school.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {school.status === "pending" && (
                        <button
                          onClick={() => handleVerify(school._id)}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 mr-3 inline-flex items-center gap-1 transition-colors text-xs"
                          disabled={loading}
                        >
                          <FaCheckCircle /> Verify
                        </button>
                      )}
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors">
                        <FaEdit size={16} />
                      </button>
                      <button className="text-red-400 hover:text-red-600 transition-colors">
                        <FaTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colspan="4"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FaSchool className="text-gray-300 text-4xl mb-3" />
                      <p>No schools found in this category.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Schools;

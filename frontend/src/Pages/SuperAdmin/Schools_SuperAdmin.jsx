// src/Pages/SuperAdmin/Schools_SuperAdmin.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { adminService } from "../../utils/api"; // Import your API service
import { FaPlus, FaEdit, FaTrash, FaSchool } from "react-icons/fa";

const Schools = () => {
  const { isSuperAdmin } = useAuth(); // Get the role check helper
  const [schools, setSchools] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "public",
    establishedYear: "",
    address: "",
    contact: "",
    emailDomain: "",
    // --- NEW FIELDS FOR PRINCIPAL CREATION ---
    principalName: "",
    principalEmail: "",
    principalPassword: "",
  });

  const fetchSchools = useCallback(async () => {
    try {
      const result = await adminService.getSchools(); // Your API call
      if (result.success) {
        setSchools(result.data);
      } else {
        throw new Error(result.message || "Could not fetch schools.");
      }
    } catch (err) {
      setError(err.message);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Use the API function that creates both school and principal
      const result = await adminService.createSchoolWithPrincipal(formData);
      if (result.success) {
        setSuccess("School and Principal account created successfully!");
        // Show temporary password if provided
        if (result.data?.temporaryPassword) {
          setTempPassword(result.data.temporaryPassword);
        }
        // Reset form data
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
        fetchSchools(); // Refresh the list
      } else {
        throw new Error(result.message || "Failed to create school");
      }
    } catch (err) {
      console.error("Error creating school:", err);
      setError(
        err.message || err.response?.data?.message || "Failed to create school"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ SECURITY: If the user is not a superadmin, don't render this component.
  if (!isSuperAdmin()) {
    return (
      <div className="p-6">
        Access Denied. This page is for Super Admins only.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaSchool className="mr-2 text-indigo-600" />
          School Management (Superadmin)
        </h2>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (showCreateForm) {
              setTempPassword("");
              setError("");
              setSuccess("");
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <FaPlus className="mr-2" />
          {showCreateForm ? "Cancel" : "Add School"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border-green-400 text-green-700 p-3 rounded mb-4">
          {success}
          {tempPassword && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-800">
                Temporary Password for Principal:
              </p>
              <p className="text-sm font-mono bg-yellow-100 p-1 rounded mt-1">
                {tempPassword}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Please share this password with the principal securely.
              </p>
            </div>
          )}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 shadow-inner">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            Create New School & Principal
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* --- School Details --- */}
            <fieldset className="border p-4 rounded-md">
              <legend className="text-lg font-medium px-2">
                School Information
              </legend>
              <div className="grid grid-cols-1  md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label>School Name *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label>School Type *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="government">Government</option>
                  </select>
                </div>
                <div>
                  <label>Established Year</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <label>Contact Number</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label>Email Domain (Optional)</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    name="emailDomain"
                    value={formData.emailDomain}
                    onChange={handleInputChange}
                    placeholder="e.g., school.edu"
                  />
                </div>
                <div className="md:col-span-2">
                  <label>Address</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* --- Principal Details --- */}
            <fieldset className="border p-4 rounded-md">
              <legend className="text-lg font-medium px-2">
                Principal Account Details
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label>Principal's Full Name *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    name="principalName"
                    value={formData.principalName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label>Principal's Email *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="email"
                    name="principalEmail"
                    value={formData.principalEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label>Initial Password *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="password"
                    name="principalPassword"
                    value={formData.principalPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create School"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* The school list table remains largely the same */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">
          Registered Schools
        </h3>
        {/* Your existing table structure to display schools */}
        <div className="p-4">
          {schools.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schools.map((school) => (
                  <tr key={school._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {school.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {school.principalId?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          school.status === "verified"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {school.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <FaEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No schools found. Click "Add School" to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// A helper for form inputs
const Label = ({ children }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}
  </label>
);
const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
);
const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
);

export default Schools;

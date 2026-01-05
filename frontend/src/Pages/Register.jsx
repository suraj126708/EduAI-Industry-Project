// src/components/Register.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { schoolAPI } from "../utils/api"; // Updated import to use the centralized API
import {
  FaEye,
  FaEyeSlash,
  FaSchool,
  FaUserTie,
  FaBuilding,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Combined State for Principal and School
  const [formData, setFormData] = useState({
    // Principal Details
    principalName: "",
    principalEmail: "",
    password: "",
    confirmPassword: "",

    // School Details
    schoolName: "",
    schoolType: "private", // Default
    schoolAddress: "",
    schoolContact: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep1 = () => {
    if (!formData.principalName.trim()) return "Full Name is required";
    if (!formData.principalEmail.trim()) return "Email is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    return null;
  };

  const validateStep2 = () => {
    if (!formData.schoolName.trim()) return "School Name is required";
    if (!formData.schoolAddress.trim()) return "Address is required";
    if (!formData.schoolContact.trim()) return "School Contact is required";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
    } else {
      setError("");
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Create User in Firebase Auth first
      const firebaseResult = await signUp(
        formData.principalEmail,
        formData.password,
        formData.principalName
      );

      if (!firebaseResult.success) {
        throw new Error(firebaseResult.error);
      }

      // 2. Prepare Payload for Backend
      const payload = {
        principalName: formData.principalName,
        principalEmail: formData.principalEmail,
        // password: formData.password, // Optional: backend doesn't strictly need this if relying on Firebase
        role: "principal",

        // School Info
        schoolName: formData.schoolName,
        type: formData.schoolType,
        address: formData.schoolAddress,
        contact: formData.schoolContact,
        addressDetails: {
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: "India",
        },
        // Pass the Firebase UID so backend can link it
        firebaseUid: firebaseResult.user.uid,
      };

      // 3. Call Backend API using the utility function
      const response = await schoolAPI.registerSchool(payload);

      if (response.success) {
        // Redirect to Login with success message
        navigate("/login", {
          state: {
            message:
              "Registration successful! Your school is pending verification by the Superadmin.",
          },
        });
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to register school.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg transform rotate-3">
            <FaSchool className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            School Registration
          </h1>
          <p className="text-gray-600">
            Register your institution as a Principal
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Progress Bar */}
          <div className="flex w-full h-1.5 bg-gray-100">
            <div
              className={`h-full bg-blue-600 transition-all duration-300 ${
                step === 1 ? "w-1/2" : "w-full"
              }`}
            ></div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-center">
                <span className="text-red-700 text-sm font-medium">
                  {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* --- STEP 1: PRINCIPAL DETAILS --- */}
              {step === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <FaUserTie className="text-blue-600" /> Principal
                    Information
                  </h2>

                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        name="principalName"
                        type="text"
                        required
                        value={formData.principalName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Dr. John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Official Email
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
                        <input
                          name="principalEmail"
                          type="email"
                          required
                          value={formData.principalEmail}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="principal@school.edu"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password
                        </label>
                        <input
                          name="confirmPassword"
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all mt-4"
                  >
                    Next: School Details
                  </button>
                </div>
              )}

              {/* --- STEP 2: SCHOOL DETAILS --- */}
              {step === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <FaBuilding className="text-blue-600" /> Institution Details
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name
                    </label>
                    <input
                      name="schoolName"
                      type="text"
                      required
                      value={formData.schoolName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: St. Mary's High School"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        School Type
                      </label>
                      <select
                        name="schoolType"
                        value={formData.schoolType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="private">Private</option>
                        <option value="government">Government</option>
                        <option value="public">Public</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-4 top-3.5 text-gray-400" />
                        <input
                          name="schoolContact"
                          type="tel"
                          required
                          value={formData.schoolContact}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Official Phone"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="schoolAddress"
                      required
                      rows="2"
                      value={formData.schoolAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Street Address, Area"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <input
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      name="state"
                      type="text"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      name="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Zip Code"
                      className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 px-4 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                      {loading ? (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        "Complete Registration"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Are you a teacher? Ask your Principal for login credentials. <br />
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Go to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

// src/components/Home.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaEdit,
  FaGraduationCap,
  FaBookOpen,
  FaClipboardList,
  FaChartBar,
  FaSchool,
} from "react-icons/fa";

const Home = () => {
  const { user, userProfile, signOut, refreshProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const result = await signOut();
      if (result.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <FaGraduationCap className="text-white text-sm" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  ExamFlow Platform
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin() && (
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="mr-2">👑</span>
                  Admin Panel
                </button>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaCog className="mr-2 h-4 w-4" />
                Settings
              </button>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                {loading ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {/* question paper generation */}
          <div
            onClick={() => navigate("/question-paper-generation")}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              question paper generation
            </h2>
          </div>

          {/* exam platform upload */}
          <div
            onClick={() => navigate("/upload")}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Exam Resource Upload
            </h2>
          </div>

          {/* admin panel */}
          <div
            onClick={() => navigate("/admin")}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer"
          >
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

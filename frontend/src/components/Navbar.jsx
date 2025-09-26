import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FaGraduationCap } from "react-icons/fa";

const navLinkBase =
  "px-3 py-2 rounded-md text-sm font-medium transition-colors";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, userProfile, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    const result = await signOut();
    if (result?.success) {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Link to="/home" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <FaGraduationCap className="text-white" />
              </span>
              <span className="text-lg font-bold tracking-tight text-gray-800">
                ExamFlow
              </span>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {user && (
              <>
                <NavLink
                  to="/home"
                  className={({ isActive }) =>
                    `${navLinkBase} ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                  end
                >
                  Home
                </NavLink>
                <NavLink
                  to="/upload"
                  className={({ isActive }) =>
                    `${navLinkBase} ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Upload
                </NavLink>
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `${navLinkBase} ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Reports
                </NavLink>
                {isAdmin() && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `${navLinkBase} ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                    end
                  >
                    Admin
                  </NavLink>
                )}
              </>
            )}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700 hidden sm:block">
                  {userProfile?.displayName || userProfile?.name || user?.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

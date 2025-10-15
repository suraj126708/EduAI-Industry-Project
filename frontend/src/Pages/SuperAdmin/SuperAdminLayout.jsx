// src/Pages/SuperAdmin/SuperAdminLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FaTachometerAlt, FaSchool } from "react-icons/fa";

const SuperAdminLayout = () => {
  const linkClass =
    "flex items-center p-3 my-1 rounded-lg text-gray-700 hover:bg-indigo-100 transition-colors";
  const activeLinkClass = "bg-indigo-100 text-indigo-700 font-semibold";

  return (
    <div className="flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white p-4 shadow-md rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Super Admin</h2>
        <nav>
          <NavLink
            to="/superadmin/dashboard"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeLinkClass : ""}`
            }
          >
            <FaTachometerAlt className="mr-3" />
            Dashboard
          </NavLink>
          <NavLink
            to="/superadmin/schools"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeLinkClass : ""}`
            }
          >
            <FaSchool className="mr-3" />
            Manage Schools
          </NavLink>
          {/* Add more superadmin links here */}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-6">
        <div className="bg-white p-6 rounded-lg shadow-md min-h-full">
          <Outlet />{" "}
          {/* This will render the nested route component (Dashboard or Schools) */}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;

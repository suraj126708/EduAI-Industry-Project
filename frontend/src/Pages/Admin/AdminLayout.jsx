import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaFileAlt,
  FaChartBar,
} from "react-icons/fa";

const navItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <FaTachometerAlt /> },
  { name: "Teachers", path: "/admin/teachers", icon: <FaUsers /> },
  { name: "Question Papers", path: "/admin/papers", icon: <FaFileAlt /> },
  { name: "Results", path: "/admin/stats", icon: <FaChartBar /> },
  { name: "Students", path: "/admin/students", icon: <FaUsers /> },
];

const AdminLayout = () => (
  <div className="flex min-h-screen bg-gradient-to-r from-indigo-50 via-white to-indigo-100">
    <aside className="w-64 bg-white border-r shadow-sm flex flex-col py-8 px-4">
      <span className="text-xl font-bold text-indigo-700 mb-8 tracking-tight">
        Admin Panel
      </span>
      <nav className="flex flex-col gap-3">
        {navItems.map((item) => (
          <NavLink
            to={item.name === "Dashboard" ? "/admin/dashboard" : item.path}
            key={item.name}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded hover:bg-indigo-50 ${
                isActive
                  ? "bg-indigo-100 text-indigo-700 font-semibold"
                  : "text-gray-700"
              }`
            }
            end
          >
            {item.icon}
            <span className="ml-2">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
    <main className="flex-1 p-10">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;

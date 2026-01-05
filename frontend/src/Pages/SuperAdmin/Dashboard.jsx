// src/components/admin/AdminDashboard.js

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { adminService } from "../../utils/api"; // Make sure your API service is imported

const DashboardCard = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
      {title}
    </h3>
    <p className="text-3xl font-bold text-gray-800 mt-2">{value ?? "0"}</p>
  </div>
);

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboardSuperAdmin();
        if (res.success) {
          setStats(res.data.statistics);
        } else {
          throw new Error("Failed to fetch dashboard data.");
        }
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading Dashboard...</div>;
  if (error)
    return (
      <div className="text-red-500 bg-red-100 p-4 rounded">Error: {error}</div>
    );
  if (!stats) return <div>No dashboard data available.</div>;

  return (
    <div className="container mx-auto p-4 mt-6">
      <h1 className="text-3xl font-bold mb-2">
        {userProfile?.role === "superadmin"
          ? "System Dashboard"
          : `${userProfile?.schoolId?.name || "School"} Dashboard`}
      </h1>
      <p className="text-gray-600 mb-6">Welcome back, {userProfile?.name}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Teachers" value={stats.totalTeachers} />
        <DashboardCard title="Active Teachers" value={stats.activeTeachers} />
        <DashboardCard title="Total Schools" value={stats.totalSchools} />
        <DashboardCard title="Total Classes" value={stats.totalClasses} />
        {/* Add more cards for totalSubjects, etc. as needed */}
      </div>
    </div>
  );
};

export default AdminDashboard;

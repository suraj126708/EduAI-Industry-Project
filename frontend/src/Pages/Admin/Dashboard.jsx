import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const AdminDashboard = () => {
  const { adminService } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminService.getDashboard()
      .then((res) => {
        if (res.success) setStats(res.data.statistics);
        else setStats(null);
      })
      .catch(() => setStats(null));
  }, [adminService]);
 
  if (stats === null) return <div>Unable to load dashboard. Please check your login status.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="Total Teachers" value={stats.totalTeachers} />
        <DashboardCard title="Active Teachers" value={stats.activeTeachers} />
        <DashboardCard title="Total Schools" value={stats.totalSchools} />
        <DashboardCard title="Total Exams" value={stats.totalExams} />
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value }) => (
  <div className="rounded bg-indigo-50 p-5 shadow">
    <div className="text-gray-600">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default AdminDashboard;

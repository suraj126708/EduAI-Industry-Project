import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  CheckCircle,
  School,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const AdminDashboard = () => {
  const { adminService, userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboard();
        if (res.success) {
          setStats(res.data.statistics);
        } else {
          setError("Failed to load dashboard data.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [adminService]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          Unable to load dashboard
        </h3>
        <p className="mt-1 text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Fallback if stats is still null for some reason
  if (!stats) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {userProfile?.name || "Admin"}. Here's what's happening
          today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={Users}
          color="blue"
          trend={stats.growthRate ? `${stats.growthRate}%` : null}
        />
        <DashboardCard
          title="Active Teachers"
          value={stats.activeTeachers}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          title="Total Students"
          value={stats.totalStudents}
          icon={School}
          color="purple"
        />
        <DashboardCard
          title="Total Subjects"
          value={stats.totalSubjects}
          icon={FileText}
          color="orange"
        />
      </div>

      {/* Additional Sections (Placeholder for future widgets like charts or recent activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="block font-medium text-indigo-600 group-hover:text-indigo-700">
                Add New Teacher
              </span>
              <span className="text-sm text-gray-500">
                Register a new staff member
              </span>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="block font-medium text-indigo-600 group-hover:text-indigo-700">
                View Reports
              </span>
              <span className="text-sm text-gray-500">
                Check system analytics
              </span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Server Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Connection</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Sync</span>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-lg ${
            colorClasses[color] || "bg-gray-50 text-gray-600"
          }`}
        >
          <Icon size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp size={14} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
    </div>
  );
};

export default AdminDashboard;

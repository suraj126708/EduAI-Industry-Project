import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./Pages/ProtectedRoute";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Home from "./Pages/Home";
import Unauthorized from "./components/Unauthorized";
import { Navbar } from "./components";
import QuestionPaperForm from "./Pages/QuestionPaperGeneration";
import ExamPlatformUpload from "./Pages/ExamPlatformUpload";
import AnswerSheetUpload from "./Pages/AnswerSheetUpload";
import PaperFormat from "./Pages/PaperFormat";
import ReportGeneration from "./Pages/Report";
import MyPapers from "./Pages/MyPapers";

// Admin imports
import AdminLayout from "./Pages/Admin/AdminLayout";
import AdminDashboard from "./Pages/Admin/Dashboard";
import AdminUsers from "./Pages/Admin/Users";
import AdminPapers from "./Pages/Admin/Papers";
import AdminResults from "./Pages/Admin/Results";
import AdminStudents from "./Pages/Admin/Students";
import Schools from "./Pages/Admin/Schools";
import Classes from "./Pages/Admin/Classes";
import Subjects from "./Pages/Admin/Subjects";
import TeacherAssignments from "./Pages/Admin/TeacherAssignments";
import Books from "./Pages/Admin/Books";
import SemesterReport from "./Pages/Admin/SemesterReport";

// --- Superadmin Only Imports ---
import SuperAdminLayout from "./Pages/SuperAdmin/SuperAdminLayout"; // We'll create this layout
import SuperAdminDashboard from "./Pages/SuperAdmin/Dashboard"; // The verification dashboard
import SchoolsSuperAdmin from "./Pages/SuperAdmin/Schools_SuperAdmin"; // The school management page is now superadmin-only

import { useAuth } from "./contexts/AuthContext";
const RootRedirect = () => {
  const { user, userProfile, loading } = useAuth();

  // 1. If authentication state is still loading, show nothing (or a spinner) to prevent premature redirects
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 2. If not logged in, redirect to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If logged in, redirect based on Role
  if (userProfile?.role === "principal") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (userProfile?.role === "superadmin") {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  // 4. Default for Teachers/Students
  return <Navigate to="/home" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes */}
            <Route
              path="/home"
              element={<ProtectedRoute>{<Home />}</ProtectedRoute>}
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>{<ExamPlatformUpload />}</ProtectedRoute>
              }
            />
            <Route
              path="/answer-sheet-upload"
              element={<ProtectedRoute>{<AnswerSheetUpload />}</ProtectedRoute>}
            />
            <Route
              path="/question-paper-generation"
              element={<ProtectedRoute>{<QuestionPaperForm />}</ProtectedRoute>}
            />
            <Route
              path="/reports/:id"
              element={<ProtectedRoute>{<ReportGeneration />}</ProtectedRoute>}
            />
            <Route
              path="/my-papers"
              element={<ProtectedRoute>{<MyPapers />}</ProtectedRoute>}
            />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRoles={["principal"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="schools" element={<Schools />} />
              <Route path="classes" element={<Classes />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="books" element={<Books />} />
              <Route path="teachers" element={<AdminUsers />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="papers" element={<AdminPapers />} />
              <Route path="stats" element={<AdminResults />} />
              <Route path="semester-report" element={<SemesterReport />} />
            </Route>

            {/* Redirect root to /home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="paper/:id" element={<PaperFormat />} />
            <Route path="*" element={<Navigate to="/home" replace />} />

            {/* --- Superadmin Panel (Superadmins ONLY) --- */}
            {/* This panel is for high-level tasks like verifying new schools and global management. */}
            <Route
              path="/superadmin/*"
              element={
                <ProtectedRoute requiredRoles={["superadmin"]}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="schools" element={<SchoolsSuperAdmin />} />
              {/* You can add more superadmin-only routes here */}
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

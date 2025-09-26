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
import QuestionPaperForm from "./Pages/QuestionPaperGeneration";
import ExamPlatformUpload from "./Pages/ExamPlatformUpload";
import AnswerSheetUpload from "./Pages/AnswerSheetUpload";
import PaperFormat from "./Pages/PaperFormat";
import ReportGeneration from "./Pages/QuestionPaperReport";

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

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/upload" element={<ExamPlatformUpload />} />
            <Route
              path="/answer-sheet-upload"
              element={<AnswerSheetUpload />}
            />
            <Route
              path="/question-paper-generation"
              element={<QuestionPaperForm />}
            />
            <Route path="/reports" element={<ReportGeneration />} />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="schools" element={<Schools />} />
              <Route path="classes" element={<Classes />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="teachers" element={<AdminUsers />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="papers" element={<AdminPapers />} />
              <Route path="stats" element={<AdminResults />} />
            </Route>

            {/* Redirect root to /home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="paper" element={<PaperFormat />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

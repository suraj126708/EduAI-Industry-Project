import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sparkles, Calendar, GraduationCap, ArrowRight } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { userProfile, isAnyAdmin, isSuperAdmin } = useAuth();

  // Greeting Logic
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // --- Dynamic Academic Session Logic ---
  const sessionInfo = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = Jan, 11 = Dec
    const currentYear = now.getFullYear();

    // Logic:
    // Semester 1: June (5) to December (11)
    // Semester 2: January (0) to May (4)
    const isSemester1 = currentMonth >= 5;

    // Calculate Academic Year
    // If Sem 1 (e.g. Dec 2025), start year is 2025 -> "2025 - 2026"
    // If Sem 2 (e.g. Feb 2026), start year is 2025 -> "2025 - 2026"
    const startYear = isSemester1 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;

    return {
      academicYear: `${startYear} - ${endYear}`,
      currentTerm: isSemester1 ? "Semester 1" : "Semester 2",
    };
  }, []);

  // Menu Configuration
  const menuGroups = useMemo(() => {
    // --- 1. Define Base Items with Images ---
    const baseAcademicItems = [
      {
        title: "Generate Question Paper",
        desc: "Create AI-powered exam papers in seconds aligned with your curriculum.",
        image:
          "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        route: "/question-paper-generation",
      },
      {
        title: "My Question Papers",
        desc: "Access, edit, and manage your previously saved question paper drafts.",
        image:
          "https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        route: "/my-papers",
      },
    ];

    const baseEvaluationItems = [
      {
        title: "Upload Resources",
        desc: "Add study materials, syllabus documents, and reference files.",
        image:
          "https://images.unsplash.com/photo-1544396821-4dd40b938ad3?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        route: "/upload",
      },
      {
        title: "Answer Sheet Upload",
        desc: "Digitize student answer sheets for automated or assisted grading.",
        image:
          "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        route: "/answer-sheet-upload",
      },
    ];

    // --- 2. Build Groups ---
    const groups = [
      {
        id: "academic",
        title: "Academic Tools",
        description: "Create and manage assessments efficiently.",
        items: baseAcademicItems,
      },
      {
        id: "evaluation",
        title: "Evaluation Hub",
        description: "Digitize grading and manage resources.",
        items: baseEvaluationItems,
      },
    ];

    // --- 3. Admin Group Logic ---
    const adminItems = [];
    if (isAnyAdmin()) {
      adminItems.push({
        title: "Principal Dashboard",
        desc: "Manage school settings, teachers, classes, and overall oversight.",
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        route: "/admin/dashboard",
      });
    }
    if (isSuperAdmin()) {
      adminItems.push({
        title: "Super Admin Panel",
        desc: "Global platform configurations, system-wide settings, and security.",
        image:
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        route: "/superadmin/dashboard",
      });
    }

    if (adminItems.length > 0) {
      groups.push({
        id: "admin",
        title: "Administration",
        description: "System and user management controls.",
        items: adminItems,
      });
    }

    return groups;
  }, [isAnyAdmin, isSuperAdmin]);

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      {/* --- Hero / Welcome Section --- */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
        {/* Subtle background pattern underneath text */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-50 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                    userProfile?.role === "principal"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  <Sparkles size={14} className="fill-current" />
                  {userProfile?.role === "principal"
                    ? "Principal Workspace"
                    : "Educator Workspace"}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                {greeting},{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {userProfile?.name || "Educator"}
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Your command center for AI-driven assessments and digital
                evaluation. Select a module below to begin.
              </p>
            </div>

            {/* Session Info Card */}
            <div className="hidden lg:flex items-center gap-6 bg-white/80 backdrop-blur-md border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Academic Year
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {sessionInfo.academicYear}
                  </p>
                </div>
              </div>
              <div className="h-10 w-px bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Current Term
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {sessionInfo.currentTerm}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {menuGroups.map((group) => (
          <section key={group.id} className="animate-fade-in-up">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {group.title}
                </h2>
                <p className="text-base text-gray-500 mt-2 max-w-xl leading-relaxed">
                  {group.description}
                </p>
              </div>
              <div className="h-px bg-gray-200 flex-1 ml-10 relative top-[-10px] hidden md:block opacity-70"></div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {group.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.route)}
                  className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-indigo-100 text-left overflow-hidden transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Image Banner with Zoom Effect */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity duration-300"></div>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                    {/* Title overlay on image */}
                    <h3 className="absolute bottom-4 left-6 right-6 text-xl font-bold text-white z-20 drop-shadow-md group-hover:text-indigo-50 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  {/* Content Body */}
                  <div className="p-6 flex flex-col flex-grow bg-white relative z-20">
                    <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-grow">
                      {item.desc}
                    </p>

                    {/* Hover Arrow CTA */}
                    <div className="mt-auto flex items-center text-sm font-bold text-indigo-600 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <span>Access Tool</span>
                      <ArrowRight size={18} className="ml-2" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Home;

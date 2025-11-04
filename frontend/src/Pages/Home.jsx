// src/pages/Home.js
import React, { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaBook,
  FaFileUpload,
  FaFileAlt,
  FaCogs,
  FaUserShield,
} from "react-icons/fa";
import { IoNewspaperOutline } from "react-icons/io5";

// Card Component for consistent styling
const HomeCard = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl border hover:border-indigo-300 transition-all aspect-square"
  >
    <div className="w-12 h-12 mb-3 flex items-center justify-center text-4xl">
      {icon}
    </div>
    <span className="mt-2 font-semibold text-lg text-center text-gray-700">
      {title}
    </span>
  </button>
);

const Home = () => {
  const navigate = useNavigate();
  const { userProfile, isAnyAdmin, isSuperAdmin } = useAuth();

  // --- IMPORTANT DEBUGGING STEP ---
  // This will show you the user profile in your browser's console.
  // Check if the 'role' property is 'principal' or 'superadmin'.
  useEffect(() => {
    console.log("Current User Profile:", userProfile);
  }, [userProfile]);

  const homeCards = useMemo(() => {
    // Base cards for all logged-in users
    const baseCards = [
      {
        title: "Question Paper Generation",
        icon: <FaFileAlt className="text-indigo-500" />,
        route: "/question-paper-generation",
      },
      {
        title: "Exam Resource Upload",
        icon: <FaFileUpload className="text-emerald-500" />,
        route: "/upload",
      },
      {
        title: "My Question Papers",
        icon: <IoNewspaperOutline className="text-blue-500" />,
        route: "/my-papers",
      },
      {
        title: "Answer Sheet Upload",
        icon: <FaBook className="text-yellow-500" />,
        route: "/answer-sheet-upload",
      },
      {
        title: "Reports",
        icon: <IoNewspaperOutline className="text-purple-500" />,
        route: "/reports/:id",
      },
      {
        title: "Question Paper Format",
        icon: <IoNewspaperOutline className="text-cyan-500" />,
        route: "/paper",
      },
    ];

    // Conditionally add the admin panels
    if (isAnyAdmin()) {
      baseCards.push({
        title: "Admin Panel",
        icon: <FaCogs className="text-pink-500" />,
        route: "/admin/classes",
      });
    }

    if (isSuperAdmin()) {
      baseCards.push({
        title: "Super Admin Panel",
        icon: <FaUserShield className="text-red-500" />,
        route: "/superadmin/dashboard", // Points directly to the superadmin dashboard
      });
    }

    return baseCards;
  }, [isAnyAdmin, isSuperAdmin]);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl text-center font-extrabold my-8 text-gray-800">
        EduAI Platform
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl my-10 mx-auto">
        {homeCards.map((card) => (
          <HomeCard
            key={card.title}
            title={card.title}
            icon={card.icon}
            onClick={() => navigate(card.route)}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;

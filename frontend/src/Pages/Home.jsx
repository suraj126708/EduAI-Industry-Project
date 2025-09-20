import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBook, FaFileUpload, FaFileAlt, FaCogs } from "react-icons/fa";

import { IoNewspaperOutline } from "react-icons/io5";

const homeCards = [
  {
    title: "Question Paper Generation",
    icon: <FaFileAlt className="text-indigo-500 w-8 h-8 mb-2" />,
    route: "/question-paper-generation",
  },
  {
    title: "Exam Resource Upload",
    icon: <FaFileUpload className="text-emerald-500 w-8 h-8 mb-2" />,
    route: "/upload",
  },
  {
    title: "Answer Sheet Upload",
    icon: <FaBook className="text-yellow-500 w-8 h-8 mb-2" />,
    route: "/answer-sheet-upload",
  },
  {
    title: "Admin Panel",
    icon: <FaCogs className="text-pink-500 w-8 h-8 mb-2" />,
    route: "/admin",
  },
  {
    title: "Reports",
    icon: <FaBook className="text-purple-500 w-8 h-8 mb-2" />,
    route: "/reports",
  },

  {
    title: "Question paper format",
    icon: <IoNewspaperOutline className="text-blue-500 w-8 h-8 mb-2" />,
    route: "/paper",
  },
];

const Home = () => {
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="text-4xl text-center font-extrabold mb-8 mt-8 text-indigo-800">
        EduAI Question Generation & Answer Evaluation Platform
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-15 max-w-2xl my-10 mx-auto">
        {homeCards.map((card) => (
          <button
            key={card.title}
            className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl border hover:border-indigo-300 transition-all"
            onClick={() => navigate(card.route)}
          >
            {card.icon}
            <span className="mt-2 font-semibold text-lg text-gray-700">
              {card.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;

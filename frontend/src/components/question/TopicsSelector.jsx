import React from "react";
import { ChevronDown, X } from "lucide-react";
import ErrorMessage from "../ErrorMessage";

const TopicsSelector = ({
  questionIndex,
  question,
  isOpen,
  onToggleDropdown,
  onToggleUnit,
  onToggleTopic,
  getSubjectTopics,
  error = null,
  dropdownRef,
}) => {
  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => onToggleDropdown(questionIndex)}
        className={`w-full px-3 h-12 border-2 rounded-lg cursor-pointer scrollbar-hide flex items-center justify-between hover:bg-gray-50 transition-all duration-200 bg-gray-50 ${
          error
            ? "border-red-300 hover:border-red-400"
            : "border-gray-200 hover:border-gray-400"
        }`}
      >
        <div className="flex-1 scrollbar-hide min-w-0">
          {question.units && question.units.length > 0 ? (
            <div className="flex items-center gap-1 whitespace-nowrap overflow-hidden pr-1">
              {question.units.map((unit, unitIdx) => (
                <span
                  key={`unit-${unitIdx}`}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md font-medium"
                >
                  {unit}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleUnit(questionIndex, unit);
                    }}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-sm truncate">
              Click to select topics
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>
      <ErrorMessage error={error} />

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {Object.keys(getSubjectTopics()).length > 0 ? (
            Object.entries(getSubjectTopics()).map(([unit, topics]) => (
              <div
                key={unit}
                className="p-4 border-b border-gray-100 last:border-b-0"
              >
                {/* Unit Header */}
                <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md">
                  <input
                    type="checkbox"
                    checked={question.units && question.units.includes(unit)}
                    onChange={() => onToggleUnit(questionIndex, unit)}
                    className="mr-3 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {unit}
                    </div>
                    {/* Subtopics hidden intentionally */}
                  </div>
                </label>
                {/* Sub-topic selection removed */}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              Please select a subject first
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicsSelector;

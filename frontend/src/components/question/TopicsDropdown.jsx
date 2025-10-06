import React, { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import CustomDropdown from "../CustomDropdown";
import ErrorMessage from "../ErrorMessage";

const TopicsDropdown = ({
  selectedMainTopics,
  isOpen,
  onToggle,
  onMainTopicToggle,
  getAllMainTopicsForSubject,
  isAllMainTopicsSelected,
  isLoadingTopics = false,
  error = null,
}) => {
  const containerRef = useRef(null);

  // Close when clicking outside of the dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        // Toggle to close
        onToggle();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);
  const displayValue =
    selectedMainTopics.length === 0
      ? null
      : `${selectedMainTopics.length} topic${
          selectedMainTopics.length !== 1 ? "s" : ""
        } selected`;

  return (
    <CustomDropdown
      ref={containerRef}
      value={displayValue}
      onClick={onToggle}
      placeholder="Select topics"
      error={error}
      isOpen={isOpen}
    >
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {/* Select All Option */}
          <div className="p-2 border-b border-gray-100">
            <button
              onClick={() => onMainTopicToggle("select-all")}
              className={`w-full px-3 py-2 text-left rounded-md transition-colors ${
                isAllMainTopicsSelected()
                  ? "bg-blue-100 text-blue-800 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAllMainTopicsSelected()}
                  onChange={() => {}}
                  className="text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-sm font-medium">
                  {isAllMainTopicsSelected() ? "Deselect All" : "Select All"}
                </span>
              </div>
            </button>
          </div>

          {/* Individual Main Topics */}
          {isLoadingTopics ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading topics...</span>
              </div>
            </div>
          ) : (
            getAllMainTopicsForSubject().map(({ topic, value }) => (
              <div key={value} className="px-2 py-1">
                <button
                  onClick={() => onMainTopicToggle(value)}
                  className={`w-full px-3 py-2 text-left rounded-md transition-colors ${
                    selectedMainTopics.includes(value)
                      ? "bg-blue-50 text-blue-800"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedMainTopics.includes(value)}
                      onChange={() => {}}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm">{topic}</span>
                  </div>
                </button>
              </div>
            ))
          )}
        </div>
      )}
      <ErrorMessage error={error} />
    </CustomDropdown>
  );
};

export default TopicsDropdown;

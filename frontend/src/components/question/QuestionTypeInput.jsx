import React from "react";
import { Search, ChevronDown, X } from "lucide-react";
import questionTypes from "../../assets/QuestionType.json";
import ErrorMessage from "../ErrorMessage";

const QuestionTypeInput = ({
  questionIndex,
  value,
  onChange,
  suggestions = [],
  onSelectType,
  error = null,
}) => {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(questionIndex, e.target.value)}
          placeholder="Type 'mc' for MCQ or enter custom type..."
          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 focus:bg-white transition-all duration-200 ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-gray-200 focus:border-blue-500"
          }`}
        />
      </div>
      <ErrorMessage error={error} />

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((type) => (
            <button
              key={type.value}
              onClick={() => onSelectType(questionIndex, type)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
            >
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionTypeInput;

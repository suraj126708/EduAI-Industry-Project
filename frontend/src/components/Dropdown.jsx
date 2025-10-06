import React from "react";
import { ChevronDown } from "lucide-react";

const Dropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  error = null,
  className = "",
  disabled = false,
  ...props
}) => {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`px-4 py-3 border-b-2 focus:outline-none bg-gray-50 text-gray-900 min-w-[140px] appearance-none cursor-pointer transition-all duration-200 ${
            error ? "border-red-300" : "border-gray-200"
          }`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option
              key={option._id || option}
              value={
                option.value !== undefined
                  ? option.value
                  : option.grade !== undefined
                  ? String(option.grade)
                  : option
              }
            >
              {option.label || option.grade || option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default Dropdown;

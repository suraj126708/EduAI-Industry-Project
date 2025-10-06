import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const CustomDropdown = forwardRef(
  (
    {
      value,
      onClick,
      placeholder = "Select option",
      error = null,
      className = "",
      isOpen = false,
      children,
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center gap-2 ${className}`}
      >
        <div className="relative min-w-[200px]">
          <div
            className={`px-4 py-3 border-b-2 focus:outline-none bg-gray-50 text-gray-900 cursor-pointer transition-all duration-200 min-h-[48px] flex items-center justify-between ${
              error ? "border-red-300" : "border-gray-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={disabled ? undefined : onClick}
            {...props}
          >
            <div className="flex-1">
              {value || <span className="text-gray-800">{placeholder}</span>}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
          {children}
        </div>
      </div>
    );
  }
);

export default CustomDropdown;

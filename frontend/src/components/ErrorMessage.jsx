import React from "react";
import { AlertCircle } from "lucide-react";

const ErrorMessage = ({ error, className = "" }) => {
  if (!error) return null;
  
  return (
    <div className={`flex items-center gap-2 text-red-600 text-sm mt-1 ${className}`}>
      <AlertCircle className="w-4 h-4" />
      <span>{error}</span>
    </div>
  );
};

export default ErrorMessage;

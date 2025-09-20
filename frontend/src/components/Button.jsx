import React from "react";

const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}) => {
  const baseClasses =
    "font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl",
    secondary:
      "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl",
    success:
      "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl",
    ghost: "text-gray-600 hover:text-gray-800 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-6 py-3 rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

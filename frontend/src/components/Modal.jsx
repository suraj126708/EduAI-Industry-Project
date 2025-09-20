import React from "react";
import { X } from "lucide-react";

const Modal = ({
  isOpen,
  onClose,
  children,
  className = "",
  overlayClassName = "bg-white/60 backdrop-blur-md",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${overlayClassName} flex items-center justify-center z-50`}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full mx-4 overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

const ModalHeader = ({ children, className = "" }) => (
  <div className={`px-8 py-6 text-white relative overflow-hidden ${className}`}>
    {children}
  </div>
);

const ModalContent = ({ children, className = "" }) => (
  <div className={`p-8 ${className}`}>{children}</div>
);

const ModalCloseButton = ({ onClose }) => (
  <button
    onClick={onClose}
    className="p-2 hover:bg-white/20 rounded-full transition-colors"
  >
    <X className="w-5 h-5" />
  </button>
);

export { Modal, ModalHeader, ModalContent, ModalCloseButton };

import React from "react";
import { CheckCircle, Eye, FileText, X } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalCloseButton } from "../Modal";
import Button from "../Button";

const SuccessModal = ({
  isOpen,
  onClose,
  onViewPaper,
  generatedPaperData,
  totalQuestions,
  totalMarks,
}) => {
  if (!generatedPaperData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      {/* Header with gradient */}
      <ModalHeader className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 px-8 py-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-teal-500/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Success!</h3>
                <p className="text-green-100 text-sm">
                  Paper generated successfully
                </p>
              </div>
            </div>
            <ModalCloseButton onClose={onClose} />
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
      </ModalHeader>

      <ModalContent>
        {/* Quick Summary Card */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 mb-6 border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {generatedPaperData.class}
              </div>
              <div className="text-sm text-gray-600">Class</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {generatedPaperData.subject}
              </div>
              <div className="text-sm text-gray-600">Subject</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {generatedPaperData.numberOfPapers}
              </div>
              <div className="text-sm text-gray-600">Papers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-600">
                {generatedPaperData.topics.length}
              </div>
              <div className="text-sm text-gray-600">
                {generatedPaperData.topics.length === 1 ? "Topic" : "Topics"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {totalMarks}
              </div>
              <div className="text-sm text-gray-600">Total Marks</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-xl font-bold text-teal-600">
              {generatedPaperData.duration.hours}h{" "}
              {generatedPaperData.duration.minutes}m
            </div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onViewPaper}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <Eye className="w-5 h-5" />
            View & Format Paper
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </Button>

          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            Continue Editing
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-3 h-3 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Next Steps:</div>
              <div className="text-blue-700">
                Your paper will open in the formatting tool where you can
                customize layout, add instructions, and export to PDF.
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default SuccessModal;

/* eslint-disable no-unused-vars */
import React from "react";
import { ChevronDown } from "lucide-react";
import Dropdown from "../Dropdown";
import TopicsDropdown from "./TopicsDropdown";
import ErrorMessage from "../ErrorMessage";

const PaperDetailsForm = ({
  selectedClass,
  setSelectedClass,
  selectedSubject,
  setSelectedSubject,
  selectedExamType,
  setSelectedExamType,
  selectedMainTopics,
  setSelectedMainTopics,
  numberOfPapers,
  setNumberOfPapers,
  showDurationPicker,
  setShowDurationPicker,
  classOptions,
  subjectOptions,
  examTypeOptions,
  mainTopicOptions,
  isAllMainTopicsSelected,
  selectedHour,
  selectedMinute,
  openDropdowns,
  setOpenDropdowns,
  handleMainTopicToggle,
  getAllMainTopicsForSubject,
  errors,
}) => {
  return (
    <div className="mb-8">
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-6 justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 font-medium">Class</div>
            <Dropdown
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={classOptions}
              placeholder="Select class"
              error={errors.class}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 font-medium">Subject</div>
            <Dropdown
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={subjectOptions}
              placeholder="Select subject"
              error={errors.subject}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 font-medium">Exam Type</div>
            <Dropdown
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              options={examTypeOptions}
              placeholder="Select exam"
              error={errors.examType}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 font-medium">Duration</div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDurationPicker(true)}
                className={`px-4 py-3 border-b-2 focus:outline-none bg-gray-50 text-gray-900 min-w-[160px] rounded transition-all duration-200 hover:bg-gray-100 ${
                  errors.duration ? "border-red-300" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium text-gray-800`}>
                    {selectedHour === 1 && selectedMinute === 0
                      ? "Set Duration"
                      : `${selectedHour}h ${selectedMinute}m`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </div>
            <ErrorMessage error={errors.duration} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 font-medium">Topics</div>
            <TopicsDropdown
              selectedMainTopics={selectedMainTopics}
              isOpen={openDropdowns.topics}
              onToggle={() =>
                setOpenDropdowns((prev) => ({ ...prev, topics: !prev.topics }))
              }
              onMainTopicToggle={handleMainTopicToggle}
              getAllMainTopicsForSubject={getAllMainTopicsForSubject}
              isAllMainTopicsSelected={() => isAllMainTopicsSelected}
              error={errors.topic}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 font-medium">Papers</div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="10"
                value={numberOfPapers}
                onChange={(e) =>
                  setNumberOfPapers(Math.max(1, parseInt(e.target.value) || 1))
                }
                className={`px-4 py-3 border-b-2 focus:outline-none bg-gray-50 text-gray-900 min-w-[160px] text-center transition-all duration-200 ${
                  errors.numberOfPapers ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="Papers to generate"
              />
            </div>
            <ErrorMessage error={errors.numberOfPapers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperDetailsForm;

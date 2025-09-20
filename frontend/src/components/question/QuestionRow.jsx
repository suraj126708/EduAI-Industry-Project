import React from "react";
import { X } from "lucide-react";
import QuestionTypeInput from "./QuestionTypeInput";
import TopicsSelector from "./TopicsSelector";
import ErrorMessage from "../ErrorMessage";

const QuestionRow = ({
  questionIndex,
  question,
  errors,
  onUpdateQuestion,
  onRemoveQuestion,
  onQuestionTypeInput,
  onSelectQuestionType,
  questionTypeInputs,
  questionTypeSuggestions,
  onToggleDropdown,
  onToggleUnit,
  onToggleTopic,
  getSubjectTopics,
  openDropdowns,
  dropdownRefs,
  questionsLength,
}) => {
  return (
    <div className="px-6 py-5 hover:bg-gray-50 transition-colors">
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Row Number */}
        <div className="col-span-1">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold rounded-full shadow-md">
            {questionIndex + 1}
          </span>
        </div>

        {/* Question Type */}
        <div className="col-span-3 relative">
          <QuestionTypeInput
            questionIndex={questionIndex}
            value={questionTypeInputs[questionIndex] || ""}
            onChange={onQuestionTypeInput}
            suggestions={questionTypeSuggestions[questionIndex]}
            onSelectType={onSelectQuestionType}
            error={errors[`question_${questionIndex}`]?.type}
          />
        </div>

        {/* Topics Selector */}
        <div className="col-span-4">
          <TopicsSelector
            questionIndex={questionIndex}
            question={question}
            isOpen={openDropdowns[questionIndex]}
            onToggleDropdown={onToggleDropdown}
            onToggleUnit={onToggleUnit}
            onToggleTopic={onToggleTopic}
            getSubjectTopics={getSubjectTopics}
            error={errors[`question_${questionIndex}`]?.topics}
            dropdownRef={(el) => (dropdownRefs.current[questionIndex] = el)}
          />
        </div>

        {/* Number of Questions */}
        <div className="col-span-2">
          <input
            type="number"
            min="1"
            value={question.numQuestions}
            onChange={(e) =>
              onUpdateQuestion(questionIndex, "numQuestions", +e.target.value)
            }
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm text-center ${
              errors[`question_${questionIndex}`]?.numQuestions
                ? "border-red-300 focus:border-red-500"
                : "border-gray-300 focus:border-transparent"
            }`}
          />
          <ErrorMessage
            error={errors[`question_${questionIndex}`]?.numQuestions}
          />
        </div>

        {/* Marks per Question */}
        <div className="col-span-1">
          <input
            type="number"
            min="1"
            value={question.marksPerQuestion}
            onChange={(e) =>
              onUpdateQuestion(
                questionIndex,
                "marksPerQuestion",
                +e.target.value
              )
            }
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm text-center ${
              errors[`question_${questionIndex}`]?.marksPerQuestion
                ? "border-red-300 focus:border-red-500"
                : "border-gray-300 focus:border-transparent"
            }`}
          />
          <ErrorMessage
            error={errors[`question_${questionIndex}`]?.marksPerQuestion}
          />
        </div>

        {/* Total Marks */}
        <div className="col-span-1 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-md">
              {question.numQuestions * question.marksPerQuestion}
            </span>
            {questionsLength > 1 && (
              <button
                onClick={() => onRemoveQuestion(questionIndex)}
                className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionRow;

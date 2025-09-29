import React from "react";
import { FileText, Search } from "lucide-react";
import QuestionRow from "./QuestionRow";

const QuestionsTable = ({
  questions,
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
  totalQuestions,
  totalMarks,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-visible mb-8">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-800">
          <div className="col-span-1 flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">#</span>
            </div>
          </div>
          <div className="col-span-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Question Type
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-green-500" />
            Topics
          </div>
          <div className="col-span-1 text-center">Difficulty</div>
          <div className="col-span-1 text-center">Questions</div>
          <div className="col-span-1 text-center">Marks</div>
          <div className="col-span-1 text-center">Note</div>
          <div className="col-span-2 text-center">Total</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100 overflow-visible">
        {questions.map((question, idx) => (
          <QuestionRow
            key={idx}
            questionIndex={idx}
            question={question}
            errors={errors}
            onUpdateQuestion={onUpdateQuestion}
            onRemoveQuestion={onRemoveQuestion}
            onQuestionTypeInput={onQuestionTypeInput}
            onSelectQuestionType={onSelectQuestionType}
            questionTypeInputs={questionTypeInputs}
            questionTypeSuggestions={questionTypeSuggestions}
            onToggleDropdown={onToggleDropdown}
            onToggleUnit={onToggleUnit}
            onToggleTopic={onToggleTopic}
            getSubjectTopics={getSubjectTopics}
            openDropdowns={openDropdowns}
            dropdownRefs={dropdownRefs}
            questionsLength={questions.length}
          />
        ))}
      </div>

      {/* Table Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-7 text-gray-700 font-medium">
            Total Summary
          </div>
          <div className="col-span-4 text-center">
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">
              {totalQuestions} Questions
            </span>
          </div>
          <div className="col-span-1 text-center">
            <span className="inline-flex items-center px-3 py-1 bg-gray-900 text-white text-sm font-medium rounded-md">
              {totalMarks} Marks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsTable;

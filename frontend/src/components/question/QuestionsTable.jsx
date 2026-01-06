import React from "react";
import { Box, Typography, Chip, Divider } from "@mui/material";
import QuestionRow from "./QuestionRow";

const QuestionsTable = ({
  questions,
  errors,
  // Handlers passed down
  onUpdateQuestion,
  onRemoveQuestion,
  onQuestionTypeInput, // Can be simplified now
  onSelectQuestionType, // Can be simplified now
  // Context data
  questionTypeSuggestions, // Not strictly needed with Autocomplete
  getSubjectTopics,
  totalQuestions,
  totalMarks,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight="700" color="text.primary">
          Question Sections
        </Typography>
        <Chip
          label={`Total Marks: ${totalMarks}`}
          color="secondary"
          variant="filled"
          sx={{ fontSize: "0.95rem", fontWeight: 600 }}
        />
      </Box>

      {/* Render Rows */}
      <Box display="flex" flexDirection="column" gap={2}>
        {questions.map((question, idx) => (
          <QuestionRow
            key={idx}
            index={idx}
            question={question}
            error={errors[`question_${idx}`]}
            onUpdate={onUpdateQuestion}
            onRemove={onRemoveQuestion}
            // Passing the raw data function for the row to use
            topicOptions={Object.keys(getSubjectTopics() || {}).map((t) => ({
              label: t,
              value: t,
            }))}
          />
        ))}
      </Box>
    </Box>
  );
};

export default QuestionsTable;

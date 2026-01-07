import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Autocomplete,
  IconButton,
  MenuItem,
  Box,
  Typography,
  Tooltip,
} from "@mui/material";
import { DeleteOutline, Bolt } from "@mui/icons-material";
import questionTypesData from "../../assets/QuestionType.json";

const QuestionRow = ({ index, question, onUpdate, onRemove, error }) => {
  // 1. Memoize unique options
  const uniqueQuestionTypes = useMemo(() => {
    const seen = new Set();
    return questionTypesData.filter((item) => {
      const label = typeof item === "string" ? item : item.label;
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });
  }, []);

  // 2. Find the selected object based on the stored 'value' string
  // This ensures the Autocomplete displays the 'Label' instead of the 'Value'
  const selectedTypeOption = useMemo(() => {
    if (!question.type) return null;
    return (
      uniqueQuestionTypes.find((t) => t.value === question.type) ||
      question.type
    );
  }, [question.type, uniqueQuestionTypes]);

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        overflow: "visible",
        borderColor: error ? "error.main" : "divider",
        mb: 2,
        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: "primary.main",
          borderTopLeftRadius: 4,
          borderBottomLeftRadius: 4,
        }}
      />

      <CardContent sx={{ pl: 2.5, pr: 1, py: "12px !important" }}>
        <Grid container spacing={1.5} alignItems="center">
          {/* Index */}
          <Grid size="auto">
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight={700}
              sx={{ width: 20 }}
            >
              {index + 1}.
            </Typography>
          </Grid>

          {/* Question Type */}
          <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
            <Autocomplete
              freeSolo
              options={uniqueQuestionTypes}
              // Tells MUI what text to display in the input box
              getOptionLabel={(option) => {
                // If it's a string (custom type), return it as is
                if (typeof option === "string") return option;
                // If it's an object, return the Label
                return option.label || "";
              }}
              // ✅ FIX: Pass the full object (if found) so MUI sees the label
              value={selectedTypeOption}
              onChange={(_, newValue) => {
                // If user selects an option from list, newValue is an object -> save .value
                // If user types a custom string, newValue is a string -> save string
                const val =
                  (typeof newValue === "string" ? newValue : newValue?.value) ||
                  "";
                onUpdate(index, "type", val);
              }}
              onInputChange={(_, newInputValue) => {
                // Only update if it's a manual type (clearing or typing new)
                // This prevents conflicts when selecting from dropdown
                if (
                  !uniqueQuestionTypes.find((t) => t.label === newInputValue)
                ) {
                  onUpdate(index, "type", newInputValue || "");
                }
              }}
              // Custom dropdown styling
              slotProps={{
                paper: {
                  sx: {
                    width: 320,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    mt: 1,
                  },
                },
              }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                const label =
                  typeof option === "string" ? option : option.label;
                return (
                  <Box
                    key={key}
                    component="li"
                    {...optionProps}
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "grey.100",
                      py: 1.5,
                      px: 2,
                      "&:last-child": { borderBottom: "none" },
                      "&:hover": { bgcolor: "grey.50" },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "normal", lineHeight: 1.5 }}
                    >
                      {label}
                    </Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Question Type"
                  placeholder="Choose the correct alternative"
                  size="small"
                  error={!!error?.type}
                />
              )}
            />
          </Grid>

          {/* Difficulty */}
          <Grid size={{ xs: 6, md: 2, lg: 1.5 }}>
            <TextField
              select
              fullWidth
              label="Level"
              value={question.difficulty || "medium"}
              onChange={(e) => onUpdate(index, "difficulty", e.target.value)}
              size="small"
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </TextField>
          </Grid>

          {/* Qty */}
          <Grid size={{ xs: 3, md: 1.5, lg: 1 }}>
            <TextField
              type="number"
              label="Qty"
              value={question.numQuestions}
              onChange={(e) => onUpdate(index, "numQuestions", e.target.value)}
              size="small"
            />
          </Grid>

          {/* Marks */}
          <Grid size={{ xs: 3, md: 1.5, lg: 1 }}>
            <TextField
              type="number"
              label="Marks"
              value={question.marksPerQuestion}
              onChange={(e) =>
                onUpdate(index, "marksPerQuestion", e.target.value)
              }
              size="small"
            />
          </Grid>

          {/* AI Instructions */}
          <Grid size={{ xs: 12, md: 3, lg: 4.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Instructions for AI (Optional)"
              value={question.subtopicsInput || ""}
              onChange={(e) =>
                onUpdate(index, "subtopicsInput", e.target.value)
              }
              InputProps={{
                startAdornment: (
                  <Bolt fontSize="small" sx={{ color: "orange", mr: 1 }} />
                ),
                style: { fontSize: "0.9rem" },
              }}
            />
          </Grid>

          {/* Delete */}
          <Grid size="auto" sx={{ ml: "auto" }}>
            <Tooltip title="Remove">
              <IconButton
                onClick={() => onRemove(index)}
                size="small"
                color="error"
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default QuestionRow;

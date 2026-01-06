import React from "react";
import {
  Paper,
  Grid,
  TextField,
  MenuItem,
  Autocomplete,
  Chip,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  School,
  Class,
  Subject,
  Assignment,
  Layers,
  AccessTime,
  Topic,
} from "@mui/icons-material";

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
  selectedHour,
  setSelectedHour,
  selectedMinute,
  setSelectedMinute,
  setShowDurationPicker,
  classOptions = [],
  subjectOptions = [],
  examTypeOptions = [],
  mainTopicOptions = [],
  isLoadingTopics,
  errors = {},
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "#fff",
      }}
    >
      <Box mb={2} display="flex" alignItems="center" gap={1.5}>
        <School color="primary" fontSize="medium" />
        <Typography variant="h6" color="text.primary" fontWeight={700}>
          Paper Configuration
        </Typography>
      </Box>

      {/* GRID SYSTEM UPDATE:
         xs = Mobile (1 col)
         sm = Tablet (2 cols)
         md = Small Laptop (Rows wrap for space)
         lg = Desktop (Single row)
      */}
      <Grid container spacing={2} alignItems="flex-start">
        {/* Class */}
        <Grid size={{ xs: 6, sm: 6, md: 2, lg: 1.5 }}>
          <TextField
            select
            fullWidth
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            size="small"
            error={!!errors.class}
          >
            {classOptions.map((opt) => (
              <MenuItem key={opt._id} value={opt.grade}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Subject */}
        <Grid size={{ xs: 6, sm: 6, md: 3, lg: 2 }}>
          <TextField
            select
            fullWidth
            label="Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedClass}
            size="small"
            error={!!errors.subject}
          >
            {subjectOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Exam Type */}
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
          <Autocomplete
            options={examTypeOptions}
            getOptionLabel={(option) => option.label || option}
            value={selectedExamType || null}
            onChange={(_, newValue) => {
              const val = newValue?.value || newValue || "";
              setSelectedExamType(val);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Exam Type"
                size="small"
                error={!!errors.examType}
              />
            )}
          />
        </Grid>

        {/* Sets */}
        <Grid size={{ xs: 6, sm: 3, md: 1.5, lg: 1 }}>
          <TextField
            fullWidth
            type="number"
            label="Sets"
            value={numberOfPapers}
            onChange={(e) => setNumberOfPapers(e.target.value)}
            size="small"
            InputProps={{ inputProps: { min: 1, max: 10 } }}
          />
        </Grid>

        {/* Topics */}
        <Grid size={{ xs: 12, sm: 12, md: 8, lg: 3.5 }}>
          <Autocomplete
            multiple
            limitTags={1}
            disableCloseOnSelect
            options={mainTopicOptions}
            getOptionLabel={(option) => option.topic || option.value || option}
            value={mainTopicOptions.filter((t) =>
              selectedMainTopics.includes(t.value)
            )}
            onChange={(_, newValue) => {
              setSelectedMainTopics(newValue.map((v) => v.value));
            }}
            loading={isLoadingTopics}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.topic || option.value}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Included Chapters"
                placeholder={selectedMainTopics.length > 0 ? "" : "Select..."}
                error={!!errors.topic}
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoadingTopics ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Duration */}
        <Grid size={{ xs: 6, sm: 3, md: 4, lg: 2 }}>
          <TextField
            fullWidth
            label="Time"
            value={`${selectedHour}h ${selectedMinute}m`}
            onClick={() => setShowDurationPicker(true)}
            size="small"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <AccessTime fontSize="small" color="action" />
                </InputAdornment>
              ),
              style: { cursor: "pointer" },
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PaperDetailsForm;

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useAnswerSheetUpload } from "../hooks/useAnswerSheetUpload";
import {
  SelectInput,
  PaperSelectionModal,
  StudentRow,
} from "../components/answerSheet";

const AnswerSheetUpload = () => {
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const {
    selectedGrade,
    setSelectedGrade,
    selectedDivision,
    setSelectedDivision,
    selectedSubject,
    setSelectedSubject,
    searchRollNo,
    setSearchRollNo,
    gradeOptions,
    divisionOptions,
    subjectOptions,
    students,
    allPaperGroups,
    selectedPaperGroup,
    paperSets,
    selectedSets,
    setSelectedSets,
    uploadedFiles,
    setUploadedFiles,
    uploadStatus,
    existingEvals,
    isLoading,
    error,
    isLoadingStudents,
    isLoadingPapers,
    studentFetchError,
    handleFetchStudents,
    handleSelectPaper,
    handleSubmit,
  } = useAnswerSheetUpload();

  const handleSetSelection = (studentId, paperSetId) => {
    setSelectedSets((prev) => ({ ...prev, [studentId]: paperSetId }));
  };

  const handleFileChange = (studentId, file) => {
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [studentId]: file }));
    }
  };

  const handleUpload = async (studentId) => {
    const result = await handleSubmit(studentId);
    if (!result.success) {
      setSnackbar({
        open: true,
        message: result.message || "Upload failed",
        severity: "error",
      });
    } else {
      setSnackbar({
        open: true,
        message: "Answer sheet uploaded and evaluated successfully!",
        severity: "success",
      });
    }
  };

  const getStudentStatus = (student) => {
    const liveStatus = uploadStatus[student._id] || {};
    const currentPaperSetIds = paperSets.map((p) => p._id);
    const studentEvals = existingEvals[student._id] || [];
    const existingEval = studentEvals.find((e) =>
      currentPaperSetIds.includes(e.questionPaperId)
    );

    let finalStatus = "pending";
    let evalData = null;

    if (liveStatus.status === "success") {
      finalStatus = "success";
      evalData = liveStatus.data;
    } else if (liveStatus.status === "loading") {
      finalStatus = "loading";
    } else if (liveStatus.status === "error") {
      finalStatus = "error";
    } else if (existingEval) {
      finalStatus = "completed";
      evalData = existingEval;
    }

    return {
      isEvaluated: finalStatus === "success" || finalStatus === "completed",
      isLoading: finalStatus === "loading",
      error: liveStatus.message,
      evalData,
    };
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: (theme) => alpha(theme.palette.grey[50], 0.5),
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            sx={{ mb: 1, color: "text.primary" }}
          >
            Answer Sheet Upload
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload and evaluate student answer sheets automatically
          </Typography>
        </Box>

        {/* Evaluation Criteria Section */}
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            p: { xs: 2.5, md: 4 },
            mb: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 3, color: "text.primary" }}
          >
            Evaluation Criteria
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 1.5 }}
              onClose={() => {}}
            >
              {error}
            </Alert>
          )}

          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          )}

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <SelectInput
                label="Class"
                value={selectedGrade}
                onChange={setSelectedGrade}
                options={gradeOptions}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SelectInput
                label="Division"
                value={selectedDivision}
                onChange={setSelectedDivision}
                options={divisionOptions}
                disabled={!selectedGrade}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Roll No. (Optional)"
                value={searchRollNo}
                onChange={(e) => setSearchRollNo(e.target.value)}
                placeholder="Search by Roll No..."
                disabled={!selectedDivision}
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={
                  isLoadingStudents ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SearchIcon />
                  )
                }
                onClick={handleFetchStudents}
                disabled={!selectedDivision || isLoadingStudents}
                sx={{
                  height: "56px",
                  textTransform: "none",
                  borderRadius: 1.5,
                  fontWeight: 500,
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  },
                }}
              >
                {isLoadingStudents ? "Loading..." : "Fetch Students"}
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3.5 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <SelectInput
                  label="Subject"
                  value={selectedSubject}
                  onChange={setSelectedSubject}
                  options={subjectOptions}
                  disabled={!selectedDivision}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                  <TextField
                    fullWidth
                    label="Question Paper"
                    value={
                      selectedPaperGroup
                        ? selectedPaperGroup.groupTitle || "Selected"
                        : ""
                    }
                    placeholder="Select a paper..."
                    InputProps={{
                      readOnly: true,
                    }}
                    disabled={!selectedSubject || isLoadingPapers}
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => setIsPaperModalOpen(true)}
                    disabled={!selectedSubject || isLoadingPapers}
                    sx={{
                      minWidth: 120,
                      height: "56px",
                      textTransform: "none",
                      borderRadius: 1.5,
                      fontWeight: 500,
                      boxShadow: "none",
                      "&:hover": {
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      },
                    }}
                    startIcon={
                      isLoadingPapers ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <UploadFileIcon />
                      )
                    }
                  >
                    {isLoadingPapers ? "Loading..." : "Select"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Students Table Section */}
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            p: { xs: 2.5, md: 4 },
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 3, color: "text.primary" }}
          >
            Upload Answer Sheets
          </Typography>

          {studentFetchError && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 1.5 }}
              onClose={() => {}}
            >
              {studentFetchError}
            </Alert>
          )}

          {isLoadingStudents ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                py: 8,
                gap: 2,
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary">
                Loading students...
              </Typography>
            </Box>
          ) : students.length > 0 ? (
            <TableContainer
              sx={{
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.04),
                    }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Student
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Paper Set
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Answer Sheet
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Marks
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Actions
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const status = getStudentStatus(student);
                    return (
                      <StudentRow
                        key={student._id}
                        student={student}
                        paperSets={paperSets}
                        selectedSetId={selectedSets[student._id]}
                        uploadedFile={uploadedFiles[student._id]}
                        onSetChange={(setId) =>
                          handleSetSelection(student._id, setId)
                        }
                        onFileChange={(file) =>
                          handleFileChange(student._id, file)
                        }
                        onUpload={() => handleUpload(student._id)}
                        isEvaluated={status.isEvaluated}
                        isLoading={status.isLoading}
                        evalData={status.evalData}
                        error={status.error}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            !isLoadingStudents && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Select a class and division, then click "Fetch Students" to
                  begin.
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Container>

      <PaperSelectionModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        paperGroups={allPaperGroups}
        onSelect={handleSelectPaper}
        isLoading={isLoadingPapers}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 1.5 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnswerSheetUpload;

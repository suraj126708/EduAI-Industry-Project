import React from "react";
import {
  TableRow,
  TableCell,
  Select,
  MenuItem,
  FormControl,
  Button,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { styled } from "@mui/material/styles";

const StyledFileInput = styled("input")(({ theme }) => ({
  display: "none",
}));

const StyledFileLabel = styled("label")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  cursor: "pointer",
  transition: "all 0.2s",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
  },
}));

export const StudentRow = ({
  student,
  paperSets,
  selectedSetId,
  uploadedFile,
  onSetChange,
  onFileChange,
  onUpload,
  isEvaluated,
  isLoading,
  evalData,
  error,
}) => {
  const getSetLabel = (setId) => {
    if (!setId) return "—";
    const setIndex = paperSets.findIndex((s) => s._id === setId);
    return setIndex >= 0 ? `Set ${String.fromCharCode(65 + setIndex)}` : "—";
  };

  const obtainedMarks = evalData?.totalMarksObtained;
  const paperTotalMarks = evalData?.evaluationResults?.totalMarks;

  return (
    <TableRow hover>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {student.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Roll: {student.rollNo}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        {isEvaluated ? (
          <Chip
            label={getSetLabel(evalData?.questionPaperId || selectedSetId)}
            color="success"
            size="small"
            variant="outlined"
          />
        ) : (
          <FormControl
            size="small"
            fullWidth
            disabled={paperSets.length === 0 || isLoading}
          >
            <Select
              value={selectedSetId || ""}
              onChange={(e) => onSetChange(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select set...</em>
              </MenuItem>
              {paperSets.map((set, index) => (
                <MenuItem key={set._id} value={set._id}>
                  Set {String.fromCharCode(65 + index)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </TableCell>

      <TableCell>
        {isEvaluated ? (
          <Chip
            icon={<CheckCircleIcon />}
            label="Evaluated"
            color="success"
            size="small"
            variant="outlined"
          />
        ) : (
          <StyledFileLabel
            sx={{
              opacity: isLoading ? 0.6 : 1,
              pointerEvents: isLoading ? "none" : "auto",
            }}
          >
            <DescriptionIcon sx={{ fontSize: 18, mr: 1 }} />
            <Typography variant="body2" component="span">
              {uploadedFile ? uploadedFile.name : "Choose File"}
            </Typography>
            <StyledFileInput
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => onFileChange(e.target.files?.[0])}
              disabled={isLoading}
            />
          </StyledFileLabel>
        )}
      </TableCell>

      <TableCell>
        {isEvaluated ? (
          <Chip
            label={`${obtainedMarks ?? "?"} / ${paperTotalMarks ?? "?"}`}
            color="success"
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <Typography variant="caption" color="text.disabled">
            N/A
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {isEvaluated ? (
            <Button
              variant="contained"
              color="success"
              size="small"
              href={`/reports/${evalData._id}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textTransform: "none" }}
            >
              View Report
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={
                isLoading ? <CircularProgress size={16} /> : <UploadIcon />
              }
              onClick={onUpload}
              disabled={!selectedSetId || !uploadedFile || isLoading}
              sx={{ textTransform: "none" }}
            >
              {isLoading ? "Evaluating..." : "Upload"}
            </Button>
          )}
          {error && (
            <Alert severity="error" sx={{ py: 0.5, mt: 0.5 }}>
              <Typography variant="caption">{error}</Typography>
            </Alert>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

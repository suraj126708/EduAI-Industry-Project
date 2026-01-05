import { Box, Typography, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import React from "react";

export const UploadSummary = ({ results }) => {
  if (!results || results.length === 0) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Upload Summary
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {results.map((res, index) => (
          <Alert
            key={index}
            severity={res.success ? "success" : "error"}
            icon={res.success ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
          >
            <Typography variant="body2" fontWeight={500}>
              {res.filename}
            </Typography>
            <Typography variant="body2">
              {res.success
                ? "was uploaded successfully."
                : `Failed: ${res.error}`}
            </Typography>
            {res.success && typeof res.chunks === "number" && (
              <Typography variant="caption" color="text.secondary">
                Chunks processed: {res.chunks}
              </Typography>
            )}
          </Alert>
        ))}
      </Box>
    </Box>
  );
};

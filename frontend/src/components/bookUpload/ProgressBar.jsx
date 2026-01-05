import { Box, LinearProgress, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import React from "react";

const getStageMessage = (message, progress) => {
  if (message) return message;
  if (progress <= 5) return "Uploading Book...";
  if (progress <= 33) return "Extracting Chapters...";
  if (progress <= 66) return "Elements Extracting (Images/Tables)...";
  if (progress <= 85) return "Storing Vectors in Database...";
  if (progress >= 100) return "Upload Complete! Redirecting...";
  return "Processing...";
};

const getColor = (status) => {
  if (status === "error") return "error";
  if (status === "processed") return "success";
  if (status === "processing") return "secondary";
  return "primary";
};

export const ProgressBar = ({ progress, status, message }) => {
  const stageMessage = getStageMessage(message, progress);
  const color = getColor(status);

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={color}
        sx={{ height: 8, borderRadius: 1 }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "text.secondary",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {status === "processed" && progress >= 100 && (
            <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
          )}
          <Typography variant="caption">{stageMessage}</Typography>
        </Box>
        <Typography variant="caption">{Math.round(progress)}%</Typography>
      </Box>
    </Box>
  );
};


import { Chip } from "@mui/material";
import React from "react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "default" },
  uploading: { label: "Uploading...", color: "info" },
  processing: { label: "AI Processing...", color: "secondary" },
  processed: { label: "Completed", color: "success" },
  error: { label: "Error", color: "error" },
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

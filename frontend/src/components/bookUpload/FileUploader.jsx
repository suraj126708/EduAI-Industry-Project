import React, { useState, useRef } from "react";
import { Box } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";

export const FileUploader = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (!disabled && e.target.files) {
      onFileSelect(e.target.files);
    }
  };

  return (
    <Box
      component="label"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: 44,
        px: 2,
        border: 2,
        borderStyle: "dashed",
        borderRadius: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        bgcolor: isDragging ? "primary.light" : "background.paper",
        borderColor: isDragging ? "primary.main" : "divider",
        opacity: disabled ? 0.6 : 1,
        "&:hover": disabled
          ? {}
          : {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "text.secondary",
          fontSize: "0.875rem",
        }}
      >
        <UploadIcon sx={{ fontSize: 18 }} />
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          Drag PDF or Click
        </Box>
        <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
          Select PDF
        </Box>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={disabled}
      />
    </Box>
  );
};

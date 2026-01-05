import React, { useState } from "react";

import {
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Alert,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { FileUploader } from "./FileUploader";

export const DocumentRow = ({
  row,
  uniqueClasses,
  onUpdate,
  onRemove,
  onFileSelect,
  onReset,
  canRemove,
  isUploading,
}) => {
  const isDisabled =
    row.status === "uploading" || row.status === "processing" || isUploading;

  const [classMenuWidth, setClassMenuWidth] = React.useState(undefined);
  const [subjectMenuWidth, setSubjectMenuWidth] = React.useState(undefined);
  const classFormControlRef = React.useRef(null);
  const subjectFormControlRef = React.useRef(null);

  const handleClassOpen = () => {
    if (classFormControlRef.current) {
      const width = classFormControlRef.current.offsetWidth;
      setClassMenuWidth(width);
    }
  };

  const handleSubjectOpen = () => {
    if (subjectFormControlRef.current) {
      const width = subjectFormControlRef.current.offsetWidth;
      setSubjectMenuWidth(width);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ mb: 2, transition: "all 0.2s", "&:hover": { boxShadow: 2 } }}
    >
      <CardContent>
        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={4} sx={{ width: "90px" }}>
            <FormControl
              ref={classFormControlRef}
              fullWidth
              size="medium"
              disabled={isDisabled}
            >
              <InputLabel>Class</InputLabel>
              <Select
                value={row.class}
                label="Class"
                onChange={(e) => onUpdate(row.id, "class", e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      width: 120,
                      "& .MuiMenuItem-root": {
                        whiteSpace: "nowrap",
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select Class</em>
                </MenuItem>
                {uniqueClasses.map((c) => (
                  <MenuItem key={c._id} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4} sx={{ width: "100px" }}>
            <FormControl
              ref={subjectFormControlRef}
              fullWidth
              size="medium"
              disabled={isDisabled}
            >
              <InputLabel>Subject</InputLabel>
              <Select
                value={row.subject}
                label="Subject"
                onChange={(e) => onUpdate(row.id, "subject", e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      width: 160,
                      "& .MuiMenuItem-root": {
                        whiteSpace: "nowrap",
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select Subject</em>
                </MenuItem>
                {row.filteredSubjects.map((s) => (
                  <MenuItem key={s._id} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            sx={{
              width: "200px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60px",
            }}
          >
            {row.file ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.2,
                  pl: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  minHeight: 44,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    overflow: "hidden",
                    flex: 1,
                  }}
                >
                  <TextSnippetOutlinedIcon
                    sx={{ color: "primary.main", fontSize: 20 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "text.primary",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: { xs: 200, sm: 300 },
                    }}
                  >
                    {row.file.name}
                  </Typography>
                </Box>
                {!isDisabled && (
                  <IconButton
                    size="medium"
                    onClick={() => onUpdate(row.id, "file", null)}
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "error.main" },
                    }}
                  >
                    <CloseIcon fontSize="medium" />
                  </IconButton>
                )}
              </Box>
            ) : (
              <FileUploader
                onFileSelect={(files) => onFileSelect(row.id, files)}
                disabled={isDisabled}
              />
            )}
          </Grid>

          <Grid
            item
            xs={12}
            md={2}
            sx={{ display: "flex", justifyContent: "flex-end" }}
          >
            <IconButton
              onClick={() => onRemove(row.id)}
              disabled={!canRemove || isDisabled}
              color="error"
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <StatusBadge status={row.status} />

          {(row.status === "uploading" ||
            row.status === "processing" ||
            row.status === "processed") && (
            <Box sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
              <ProgressBar
                progress={row.progress}
                status={row.status}
                message={row.progressMessage}
              />
            </Box>
          )}

          {row.error && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}
            >
              <Alert severity="error" sx={{ flex: 1, py: 0.5 }}>
                <Typography variant="caption">{row.error}</Typography>
              </Alert>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => onReset(row.id)}
                variant="text"
                sx={{ minWidth: "auto" }}
              >
                Retry
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

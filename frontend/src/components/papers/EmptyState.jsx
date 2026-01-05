import { Box, Typography } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import React from "react";
export const EmptyState = () => (
  <Box
    sx={{
      textAlign: "center",
      py: 10,
      px: 4,
      border: 2,
      borderStyle: "dashed",
      borderColor: "divider",
      borderRadius: 2,
    }}
  >
    <DescriptionIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
    <Typography variant="h6" fontWeight={500} gutterBottom>
      No Papers Found
    </Typography>
    <Typography variant="body2" color="text.secondary">
      You haven't created any question papers yet.
    </Typography>
  </Box>
);

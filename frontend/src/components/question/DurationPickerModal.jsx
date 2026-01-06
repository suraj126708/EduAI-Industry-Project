import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Box,
  Divider,
} from "@mui/material";

const DurationPickerModal = ({
  isOpen,
  onClose,
  selectedHour,
  selectedMinute,
  onHourChange,
  onMinuteChange,
}) => {
  const presets = [
    { label: "1 hr", h: 1, m: 0 },
    { label: "1.5 hrs", h: 1, m: 30 },
    { label: "2 hrs", h: 2, m: 0 },
    { label: "3 hrs", h: 3, m: 0 },
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        Set Duration
      </DialogTitle>

      <DialogContent>
        {/* Presets */}
        <Box
          display="flex"
          justifyContent="center"
          gap={1}
          mb={3}
          flexWrap="wrap"
        >
          {presets.map((p) => (
            <Chip
              key={p.label}
              label={p.label}
              onClick={() => {
                onHourChange(p.h);
                onMinuteChange(p.m);
              }}
              color="primary"
              variant="outlined"
              clickable
            />
          ))}
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2} justifyContent="center" alignItems="center">
          {/* Hours Scroll */}
          <Grid item xs={5}>
            <Typography align="center" variant="subtitle2" gutterBottom>
              Hours
            </Typography>
            <Box
              sx={{
                maxHeight: 150,
                overflowY: "auto",
                textAlign: "center",
                border: "1px solid #eee",
                borderRadius: 2,
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((h) => (
                <Box
                  key={h}
                  onClick={() => onHourChange(h)}
                  sx={{
                    p: 1,
                    cursor: "pointer",
                    bgcolor:
                      selectedHour === h ? "primary.main" : "transparent",
                    color: selectedHour === h ? "white" : "text.primary",
                    "&:hover": {
                      bgcolor: selectedHour === h ? "primary.dark" : "grey.100",
                    },
                  }}
                >
                  {h}
                </Box>
              ))}
            </Box>
          </Grid>

          <Grid item xs={1} textAlign="center">
            <Typography variant="h5">:</Typography>
          </Grid>

          {/* Minutes Scroll */}
          <Grid item xs={5}>
            <Typography align="center" variant="subtitle2" gutterBottom>
              Minutes
            </Typography>
            <Box
              sx={{
                maxHeight: 150,
                overflowY: "auto",
                textAlign: "center",
                border: "1px solid #eee",
                borderRadius: 2,
              }}
            >
              {[0, 15, 30, 45].map((m) => (
                <Box
                  key={m}
                  onClick={() => onMinuteChange(m)}
                  sx={{
                    p: 1,
                    cursor: "pointer",
                    bgcolor:
                      selectedMinute === m ? "primary.main" : "transparent",
                    color: selectedMinute === m ? "white" : "text.primary",
                    "&:hover": {
                      bgcolor:
                        selectedMinute === m ? "primary.dark" : "grey.100",
                    },
                  }}
                >
                  {m.toString().padStart(2, "0")}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onClose} variant="contained" disableElevation>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DurationPickerModal;

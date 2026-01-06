// src/theme.js
import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 }, // No all-caps buttons
  },
  palette: {
    primary: { main: "#6366f1" }, // Indigo (Modern SaaS look)
    secondary: { main: "#ec4899" }, // Pink (for highlights)
    background: { default: "#f8fafc", paper: "#ffffff" },
    text: { primary: "#1e293b", secondary: "#64748b" },
  },
  components: {
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
      styleOverrides: {
        root: { backgroundColor: "#fff" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
        elevation3: { boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
      },
    },
  },
});

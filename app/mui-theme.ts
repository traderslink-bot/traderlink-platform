"use client";

import { alpha, createTheme } from "@mui/material/styles";

const brandNavy = "#06265f";
const brandBlue = "#0b57d0";
const success = "#137333";
const danger = "#b3261e";

export const traderMaterialTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brandBlue,
      dark: brandNavy,
      light: "#4f83e3",
      contrastText: "#ffffff",
    },
    secondary: {
      main: brandNavy,
      contrastText: "#ffffff",
    },
    success: {
      main: success,
    },
    error: {
      main: danger,
    },
    warning: {
      main: "#8a4f00",
    },
    info: {
      main: "#00639b",
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#172033",
      secondary: "#5f6b7d",
      disabled: "#8a94a6",
    },
    divider: alpha(brandNavy, 0.12),
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
    h1: {
      fontSize: "1.75rem",
      fontWeight: 720,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "1.25rem",
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h3: {
      fontSize: "1rem",
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 650,
    },
    button: {
      fontWeight: 650,
      letterSpacing: 0,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 40,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${alpha(brandNavy, 0.1)}`,
          boxShadow: "0 1px 2px rgba(20, 38, 68, 0.04)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 650,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#f7f9fc",
          color: "#4f5d73",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.75rem",
        },
      },
    },
  },
});

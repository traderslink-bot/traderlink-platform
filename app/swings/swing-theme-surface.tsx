"use client";

import Box from "@mui/material/Box";
import type { ReactNode } from "react";

// Read the existing dashboard ThemeProvider, not nonexistent MUI CSS variables.
// Private content remains server-authorized children; this module imports no idea data.
export function SwingThemeSurface({ children }: { children: ReactNode }) {
  return <Box sx={(theme) => ({
    "--swing-text": theme.palette.text.primary,
    "--swing-secondary": theme.palette.text.secondary,
    "--swing-paper": theme.palette.background.paper,
    "--swing-background": theme.palette.background.default,
    "--swing-divider": theme.palette.divider,
    "--swing-link": theme.palette.mode === "dark" ? "#79aaf1" : theme.palette.primary.main,
    color: "text.primary",
    minWidth: 0,
  })}>{children}</Box>;
}

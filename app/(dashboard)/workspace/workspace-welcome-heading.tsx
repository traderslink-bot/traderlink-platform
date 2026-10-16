"use client";

import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

export function WorkspaceWelcomeHeading() {
  const theme = useTheme();
  return <Typography component="h1" variant="h4" style={{ color: theme.palette.text.primary }}>Workspace</Typography>;
}

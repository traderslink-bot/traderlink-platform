"use client";

import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

export function DashboardPageDescription({
  children,
  maxWidth,
  marginTop,
  variant,
}: {
  children: ReactNode;
  maxWidth?: number;
  marginTop?: number;
  variant?: "body2";
}) {
  const theme = useTheme();

  return (
    <Typography
      sx={{
        color: theme.palette.mode === "dark"
          ? theme.palette.text.primary
          : theme.palette.text.secondary,
        ...(maxWidth === undefined ? {} : { maxWidth }),
        ...(marginTop === undefined ? {} : { mt: marginTop }),
      }}
      variant={variant}
    >
      {children}
    </Typography>
  );
}

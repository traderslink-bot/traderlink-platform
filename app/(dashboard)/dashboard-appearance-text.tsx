"use client";

import Typography from "@mui/material/Typography";
import type { TypographyProps } from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

export function DashboardAppearanceText({
  lightColor,
  ...props
}: Omit<TypographyProps, "color"> & {
  lightColor: TypographyProps["color"];
}) {
  const theme = useTheme();

  return (
    <Typography
      {...props}
      color={theme.palette.mode === "dark" ? "text.primary" : lightColor}
    />
  );
}

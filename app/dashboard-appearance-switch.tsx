"use client";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { saveAppearance } from "./(dashboard)/account/appearance-actions";

export function DashboardAppearanceSwitch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const [working, startTransition] = useTransition();
  const dark = theme.palette.mode === "dark";
  const label = dark ? "Dark" : "Light";
  const nextLabel = dark ? "Light" : "Dark";
  const icon = dark ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />;

  function switchAppearance(): void {
    if (working) return;
    startTransition(async () => {
      const result = await saveAppearance(dark ? "light" : "dark");
      if (result.ok) router.refresh();
    });
  }

  const control = (
    <Button
      aria-label={`${label}. Switch to ${nextLabel} appearance`}
      disabled={working}
      onClick={switchAppearance}
      startIcon={compact ? undefined : icon}
      sx={(currentTheme) => ({
        "&:focus-visible": {
          outline: `2px solid ${currentTheme.palette.mode === "dark"
            ? currentTheme.palette.primary.light
            : currentTheme.palette.primary.main}`,
          outlineOffset: 2,
        },
        color: currentTheme.palette.mode === "dark"
          ? currentTheme.palette.text.primary
          : currentTheme.palette.primary.main,
        justifyContent: compact ? "center" : "flex-start",
        minHeight: 44,
        minWidth: 44,
        px: compact ? 1 : 1.25,
        width: "100%",
      })}
      variant="text"
    >
      {compact ? icon : label}
    </Button>
  );

  return compact ? <Tooltip title={label}><span>{control}</span></Tooltip> : control;
}

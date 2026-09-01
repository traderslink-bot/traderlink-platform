"use client";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { saveAppearance } from "./(dashboard)/account/appearance-actions";

export function DashboardAppearanceSwitch() {
  const router = useRouter();
  const theme = useTheme();
  const [working, startTransition] = useTransition();
  const dark = theme.palette.mode === "dark";
  const [selectedDark, setSelectedDark] = useState(dark);

  useEffect(() => setSelectedDark(dark), [dark]);

  function switchAppearance(nextDark: boolean): void {
    if (working) return;
    setSelectedDark(nextDark);
    startTransition(async () => {
      const result = await saveAppearance(nextDark ? "dark" : "light");
      if (result.ok) {
        router.refresh();
      } else {
        setSelectedDark(dark);
      }
    });
  }

  return (
    <Tooltip title={selectedDark ? "Dark" : "Light"}>
      <Box sx={{ height: 44, position: "relative", width: 44 }}>
        <LightModeRoundedIcon
          aria-hidden="true"
          sx={(currentTheme) => ({
            color: selectedDark
              ? currentTheme.palette.mode === "dark"
                ? currentTheme.palette.text.primary
                : currentTheme.palette.primary.main
              : currentTheme.palette.primary.contrastText,
            fontSize: 14,
            left: 5,
            pointerEvents: "none",
            position: "absolute",
            top: 15,
            zIndex: 2,
          })}
        />
        <DarkModeRoundedIcon
          aria-hidden="true"
          sx={(currentTheme) => ({
            color: selectedDark
              ? currentTheme.palette.primary.contrastText
              : currentTheme.palette.mode === "dark"
                ? currentTheme.palette.text.primary
                : currentTheme.palette.primary.main,
            fontSize: 14,
            pointerEvents: "none",
            position: "absolute",
            right: 5,
            top: 15,
            zIndex: 2,
          })}
        />
        <Switch
          checked={selectedDark}
          checkedIcon={<span />}
          disabled={working}
          icon={<span />}
          onChange={(_event, nextDark) => switchAppearance(nextDark)}
          slotProps={{
            input: {
              "aria-label": selectedDark
                ? "Dark appearance. Switch to Light appearance"
                : "Light appearance. Switch to Dark appearance",
            },
          }}
          sx={(currentTheme) => ({
            "& .MuiSwitch-switchBase": {
              minHeight: 44,
              minWidth: 44,
              p: "2px",
            },
            "& .MuiSwitch-switchBase.Mui-checked": { transform: "translateX(20px)" },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: currentTheme.palette.mode === "dark" ? "#52647d" : "#b8c6d9",
              opacity: 1,
            },
            "& .MuiSwitch-switchBase.Mui-focusVisible .MuiSwitch-thumb": {
              outline: `2px solid ${currentTheme.palette.mode === "dark"
                ? currentTheme.palette.primary.light
                : currentTheme.palette.primary.main}`,
              outlineOffset: 2,
            },
            "& .MuiSwitch-thumb": {
              backgroundColor: currentTheme.palette.primary.main,
              height: 20,
              width: 20,
            },
            "& .MuiSwitch-track": {
              backgroundColor: currentTheme.palette.mode === "dark" ? "#52647d" : "#b8c6d9",
              borderRadius: 11,
              height: 22,
              left: 0,
              opacity: 1,
              position: "absolute",
              top: 11,
              width: 44,
            },
            height: 44,
            left: 0,
            m: 0,
            p: 0,
            position: "absolute",
            top: 0,
            width: 44,
          })}
        />
      </Box>
    </Tooltip>
  );
}

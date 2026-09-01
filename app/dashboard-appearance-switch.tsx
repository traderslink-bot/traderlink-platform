"use client";

import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";
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
    <Box sx={{ height: 44, position: "relative", width: 44 }}>
      <Switch
          checked={selectedDark}
          disabled={working}
          onChange={(_event, nextDark) => switchAppearance(nextDark)}
          size="small"
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
              p: "6px",
            },
            "& .MuiSwitch-switchBase.Mui-focusVisible .MuiSwitch-thumb": {
              outline: `2px solid ${currentTheme.palette.mode === "dark"
                ? currentTheme.palette.primary.light
                : currentTheme.palette.primary.main}`,
              outlineOffset: 2,
            },
            "& .MuiSwitch-thumb": {
              height: 16,
              width: 16,
            },
            "& .MuiSwitch-track": {
              height: 16,
              left: 6,
              position: "absolute",
              top: 14,
              width: 32,
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
  );
}

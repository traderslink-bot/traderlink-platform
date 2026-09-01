"use client";

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { saveAppearance } from "./(dashboard)/account/appearance-actions";

export function DashboardAppearanceSwitch({ compact = false }: { compact?: boolean }) {
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
    <FormControlLabel
      control={(
        <Switch
          checked={selectedDark}
          disabled={working}
          onChange={(_event, nextDark) => switchAppearance(nextDark)}
          slotProps={{
            input: {
              "aria-label": selectedDark
                ? "Dark appearance. Switch to Light appearance"
                : "Light appearance. Switch to Dark appearance",
            },
          }}
        />
      )}
      label={selectedDark ? "Dark mode" : "Light mode"}
      labelPlacement={compact ? "bottom" : "end"}
      sx={{ m: 0, minHeight: 44 }}
    />
  );
}

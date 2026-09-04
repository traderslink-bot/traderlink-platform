"use client";

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useTransition } from "react";

import { saveAppearance } from "./(dashboard)/account/appearance-actions";
import { useDashboardAppearance } from "./mui-provider";

export function DashboardAppearanceSwitch({ compact = false }: { compact?: boolean }) {
  const { appearance, setAppearance } = useDashboardAppearance();
  const [working, startTransition] = useTransition();
  const selectedDark = appearance === "dark";

  function switchAppearance(nextDark: boolean): void {
    if (working) return;
    const previousAppearance = appearance;
    const nextAppearance = nextDark ? "dark" : "light";
    setAppearance(nextAppearance);
    startTransition(async () => {
      const result = await saveAppearance(nextAppearance);
      if (result.ok) {
        setAppearance(result.appearance);
      } else {
        setAppearance(previousAppearance);
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

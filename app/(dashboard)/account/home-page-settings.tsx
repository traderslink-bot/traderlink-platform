"use client";

import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition, type FormEvent } from "react";

import { DashboardPrimaryAction } from "@/app/dashboard-template";
import {
  isPlatformHomePage,
  PLATFORM_DEFAULT_HOME_PAGE,
  PLATFORM_HOME_PAGES,
  type PlatformHomePage,
} from "@/src/modules/platform/contracts/platform-home-page";
import { saveHomePage } from "./home-page-actions";

export function HomePageSettings({
  available,
  homePage,
}: {
  available: Readonly<Record<PlatformHomePage, boolean>>;
  homePage: PlatformHomePage;
}) {
  const [selected, setSelected] = useState(homePage);
  const [saved, setSaved] = useState(homePage);
  const [feedback, setFeedback] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const [working, startTransition] = useTransition();
  const canSave = (page: PlatformHomePage) =>
    available[page] && (available.welcome || page === "scanners" || page === "trading-workspace");
  const fallback = available.welcome ? PLATFORM_DEFAULT_HOME_PAGE : "journal-workspace";

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working || selected === saved || !canSave(selected)) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await saveHomePage(selected);
        if (result.ok) {
          setSaved(result.homePage);
          setFeedback({ message: "Home page saved.", severity: "success" });
        } else {
          setFeedback({ message: result.message, severity: "error" });
        }
      } catch {
        setFeedback({ message: "Your home page could not be saved. Try again.", severity: "error" });
      }
    });
  }

  return (
    <Stack component="form" onSubmit={save} spacing={1.5}>
      <Typography color="text.secondary" variant="body2">
        Choose where TraderLink opens on the web and in the installed app.
      </Typography>
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          disabled={working}
          id="platform-home-page"
          label="Open to"
          onChange={event => {
            if (isPlatformHomePage(event.target.value)) {
              setSelected(event.target.value);
              setFeedback(null);
            }
          }}
          select
          size="small"
          sx={{ maxWidth: "100%", width: 210 }}
          value={selected}
        >
          {Object.entries(PLATFORM_HOME_PAGES).map(([value, { label }]) => (
            <MenuItem disabled={!isPlatformHomePage(value) || !canSave(value)} key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <DashboardPrimaryAction disabled={working || selected === saved || !canSave(selected)} type="submit">
          {working ? "Saving…" : "Save"}
        </DashboardPrimaryAction>
      </Stack>
      {!available[saved] ? (
        <Typography color="text.secondary" variant="body2">
          {PLATFORM_HOME_PAGES[saved].label} is currently unavailable. TraderLink opens {PLATFORM_HOME_PAGES[fallback].label}.
        </Typography>
      ) : null}
      {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}
    </Stack>
  );
}

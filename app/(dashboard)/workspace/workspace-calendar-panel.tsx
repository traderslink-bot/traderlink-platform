"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Alert, Box, CircularProgress, Drawer, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

import { CalendarClient } from "../calendar/calendar-client";
import type { CalendarData, CalendarFilterInput, CalendarView, CalendarWeekOption } from "../calendar/calendar-types";

type CalendarPanelModel = Readonly<{
  availableMonths: readonly string[];
  availableWeekOptions: readonly CalendarWeekOption[];
  availableWeeks: readonly string[];
  currentWeek: string;
  initialData: CalendarData;
  initialFilters: CalendarFilterInput;
  initialView: CalendarView;
  selectedMonth: string;
  selectedWeek: string;
}>;

export function WorkspaceCalendarPanel({ onClose }: Readonly<{ onClose: () => void }>) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [model, setModel] = useState<CalendarPanelModel | null>(null);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<Readonly<{ month?: string; view: CalendarView; week?: string }>>({ view: "month" });
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ view: period.view });
    if (period.month) query.set("month", period.month); if (period.week) query.set("week", period.week);
    setError(false); setModel(null);
    void fetch(`/api/platform/journal/calendar/workspace-panel?${query}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ data?: CalendarPanelModel }> : Promise.reject(new Error("calendar_unavailable")))
      .then((payload) => setModel(payload.data ?? null))
      .catch((failure: unknown) => { if (!(failure instanceof DOMException && failure.name === "AbortError")) setError(true); });
    return () => controller.abort();
  }, [period]);
  const content = <Stack sx={{ height: "100%", minHeight: 0 }}>
      <Stack direction="row" sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", px: { xs: 2, sm: 3 }, py: 1.25 }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Calendar</Typography>
        <IconButton aria-label="Close Calendar" onClick={onClose} sx={{ minHeight: 44, minWidth: 44 }}><CloseRoundedIcon /></IconButton>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, sm: 3 } }}>
        {error ? <Alert severity="error">Calendar could not be loaded. Try again.</Alert> : model === null ? <Box sx={{ display: "grid", minHeight: 280, placeItems: "center" }}><CircularProgress aria-label="Loading Calendar" size={28} /></Box> : <CalendarClient {...model} onNavigatePeriod={(view, value) => setPeriod(view === "month" ? { month: value, view } : { view, week: value })} presentation="workspace-embedded" />}
      </Box>
    </Stack>;
  if (!desktop) {
    return <Drawer anchor="right" onClose={onClose} open slotProps={{ paper: { sx: { maxWidth: "100vw", width: "100%" } } }}>
      {content}
    </Drawer>;
  }
  return <Paper
    elevation={8}
    sx={{ bgcolor: "background.paper", height: "calc(100dvh - 64px)", inset: 0, overflow: "hidden", position: "absolute", zIndex: (currentTheme) => currentTheme.zIndex.drawer - 1 }}
  >
    {content}
  </Paper>;
}

"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Alert, Box, CircularProgress, Dialog, IconButton, Tooltip } from "@mui/material";
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
  return <Dialog aria-label="Trading Calendar" fullScreen onClose={() => onClose()} open PaperProps={{ sx: { bgcolor: "background.default" } }}>
    <Box sx={{ minHeight: "100%", p: { xs: 1.5, sm: 3 } }}>
      <Tooltip title="Close Calendar">
        <IconButton aria-label="Close Calendar" onClick={onClose} size="small" sx={{ float: "right", mt: -0.5 }}>
          <CloseRoundedIcon />
        </IconButton>
      </Tooltip>
      {error ? <Alert severity="error">Calendar could not be loaded. Try again.</Alert> : model === null ? <Box sx={{ display: "grid", minHeight: 280, placeItems: "center" }}><CircularProgress aria-label="Loading Calendar" size={28} /></Box> : <CalendarClient {...model} onNavigatePeriod={(view, value) => setPeriod(view === "month" ? { month: value, view } : { view, week: value })} presentation="workspace-overlay" />}
    </Box>
  </Dialog>;
}

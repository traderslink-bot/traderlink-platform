"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Alert, Box, CircularProgress, Drawer, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

import { CalendarAccessNotice } from "../calendar/calendar-access-notice";
import type { MembershipCalendarViews } from "@/src/modules/platform/contracts/membership-calendar-access";
import { isMembershipRequired } from "@/src/modules/platform/contracts/platform-membership-messages";
import { CalendarClient } from "../calendar/calendar-client";
import type { CalendarData, CalendarFilterInput, CalendarView, CalendarWeekOption } from "../calendar/calendar-types";

type CalendarPanelModel = Readonly<{
  permittedViews?: MembershipCalendarViews;
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
  type Period = Readonly<{ month?: string; view?: CalendarView; week?: string }>;
  const [period, setPeriod] = useState<Period>({});
  const [result, setResult] = useState<Readonly<{ period: Period; model: CalendarPanelModel | null; error: boolean; accessDenied: boolean }> | null>(null);
  const current = result?.period === period ? result : null;
  const model = current?.model ?? null;
  const error = current?.error === true;
  const accessDenied = current?.accessDenied === true;
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams();
    if (period.view) query.set("view", period.view);
    if (period.month) query.set("month", period.month); if (period.week) query.set("week", period.week);
    void fetch(`/api/platform/journal/calendar/workspace-panel?${query}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { data?: CalendarPanelModel; code?: string };
        if (controller.signal.aborted) return;
        if (!response.ok) {
          if (isMembershipRequired(payload)) { setResult({ period, model: null, error: false, accessDenied: true }); return; }
          throw new Error("calendar_unavailable");
        }
        setResult({ period, model: payload.data ?? null, error: false, accessDenied: false });
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted && !(failure instanceof DOMException && failure.name === "AbortError")) setResult({ period, model: null, error: true, accessDenied: false });
      });
    return () => controller.abort();
  }, [period]);
  const content = <Stack sx={{ height: "100%", minHeight: 0 }}>
      <Stack direction="row" sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", px: { xs: 2, sm: 3 }, py: 1.25 }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Calendar</Typography>
        <IconButton aria-label="Close Calendar" onClick={onClose} sx={{ minHeight: 44, minWidth: 44 }}><CloseRoundedIcon /></IconButton>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, sm: 3 } }}>
        {accessDenied ? <CalendarAccessNotice onSelectView={view => setPeriod({ view })} view={period.view ?? "month"} /> : error ? <Alert severity="error">Calendar could not be loaded. Try again.</Alert> : model === null ? <Box sx={{ display: "grid", minHeight: 280, placeItems: "center" }}><CircularProgress aria-label="Loading Calendar" size={28} /></Box> : <CalendarClient {...model} onNavigatePeriod={(view, value) => setPeriod(view === "month" ? { month: value, view } : { view, week: value })} presentation="workspace-embedded" />}
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

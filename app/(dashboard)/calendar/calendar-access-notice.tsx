"use client";

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import Link from "next/link";
import type { CalendarView } from "./calendar-types";

function calendarMessage(view: CalendarView): string {
  return `Review your trading in the ${view === "month" ? "monthly" : "weekly"} Calendar. Choose a plan that includes this view to unlock it.`;
}

export function CalendarAccessNotice({ view, onSelectView }: { view: CalendarView; onSelectView?: (view: CalendarView) => void }) {
  return <Stack spacing={2} sx={{ maxWidth: 560 }}>
    <ToggleButtonGroup exclusive size="small" value={view}>
      {(["month", "week"] as const).map(value => onSelectView
        ? <ToggleButton key={value} onClick={() => onSelectView(value)} value={value}>{value === "month" ? "Month" : "Week"}</ToggleButton>
        : <ToggleButton component={Link} prefetch={false} href={`/calendar?view=${value}`} key={value} value={value}>{value === "month" ? "Month" : "Week"}</ToggleButton>)}
    </ToggleButtonGroup>
    <Alert severity="info">{calendarMessage(view)}<Stack sx={{ mt: 1, alignItems: "flex-start" }}><Button href="/plans?feature=journal.calendar" variant="contained">Explore Calendar plans</Button></Stack></Alert>
  </Stack>;
}

export function CalendarUpgradeDialog({ view, onClose }: { view: CalendarView | null; onClose: () => void }) {
  return <Dialog aria-labelledby="calendar-upgrade-title" fullWidth maxWidth="xs" onClose={onClose} open={view !== null}>
    <DialogTitle id="calendar-upgrade-title">Trading Calendar</DialogTitle>
    <DialogContent><Typography>{calendarMessage(view ?? "month")}</Typography></DialogContent>
    <DialogActions><Button onClick={onClose}>Close</Button><Button href="/plans?feature=journal.calendar" variant="contained">Explore Calendar plans</Button></DialogActions>
  </Dialog>;
}

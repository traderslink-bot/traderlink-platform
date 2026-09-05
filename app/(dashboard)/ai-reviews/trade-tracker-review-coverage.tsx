"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

import type { CoachTradeTrackerReviewDayAvailabilityV2 } from
  "@/src/modules/coach/server/coach-ai-review-availability-service";

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function statusLabel(state: CoachTradeTrackerReviewDayAvailabilityV2["state"]): string {
  if (state === "completed") return "Marked complete";
  return "Not marked complete";
}

function statusColor(state: CoachTradeTrackerReviewDayAvailabilityV2["state"]) {
  if (state === "completed") return "success" as const;
  return "warning" as const;
}

function ReviewDayContent({ day }: { day: CoachTradeTrackerReviewDayAvailabilityV2 }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 750 }} variant="body2">
          {formatReviewDate(day.marketDate)}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          Open Trade Tracker
        </Typography>
      </Box>
      <Chip color={statusColor(day.state)} label={statusLabel(day.state)} size="small" />
    </Stack>
  );
}

function ReviewDayRow({ day }: { day: CoachTradeTrackerReviewDayAvailabilityV2 }) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={`/trade-tracker/${day.marketDate}`}
        sx={{ borderRadius: 1.25, px: 1.25, py: 1 }}
      >
        <ReviewDayContent day={day} />
        <ChevronRightRoundedIcon color="action" fontSize="small" sx={{ ml: 1 }} />
      </ListItemButton>
    </ListItem>
  );
}

function ReviewDayList({ days }: {
  days: readonly CoachTradeTrackerReviewDayAvailabilityV2[];
}) {
  return (
    <List disablePadding sx={{ mt: 0.75 }}>
      {days.map((day) => <ReviewDayRow day={day} key={day.marketDate} />)}
    </List>
  );
}

export function WeeklyTradeTrackerReviewCoverage({ days }: {
  days: readonly CoachTradeTrackerReviewDayAvailabilityV2[];
}) {
  if (days.length === 0) return null;
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography sx={{ fontWeight: 800 }} variant="body2">
        Session Tracker reviews
      </Typography>
      <ReviewDayList days={days} />
    </Box>
  );
}

export function MonthlyTradeTrackerReviewDrawer({
  days,
  periodLabel,
}: {
  days: readonly CoachTradeTrackerReviewDayAvailabilityV2[];
  periodLabel: string;
}) {
  const [open, setOpen] = useState(false);
  if (days.length === 0) return null;
  return (
    <>
      <Button
        aria-controls={open ? "monthly-trade-tracker-reviews" : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        sx={{ mt: 1.5 }}
        variant="outlined"
      >
        View this month&apos;s Trade Tracker reviews
      </Button>
      <Drawer
        anchor="right"
        onClose={() => setOpen(false)}
        open={open}
        sx={{ overflowX: "hidden" }}
        slotProps={{
          paper: {
            "aria-labelledby": "monthly-trade-tracker-reviews-title",
            "aria-modal": true,
            id: "monthly-trade-tracker-reviews",
            role: "dialog",
            sx: {
              maxWidth: "100%",
              width: { xs: "100%", sm: 460 },
            },
          },
        }}
      >
        <Box sx={{ minHeight: "100%" }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "flex-start",
              bgcolor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
              justifyContent: "space-between",
              p: 2.5,
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <Box>
              <Typography id="monthly-trade-tracker-reviews-title" variant="h2">
                This month&apos;s Trade Tracker reviews
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                {periodLabel}
              </Typography>
            </Box>
            <IconButton
              aria-label="Close monthly Trade Tracker reviews"
              onClick={() => setOpen(false)}
              sx={{ minHeight: 44, minWidth: 44 }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Box sx={{ px: 1.25, py: 1.5 }}>
            <ReviewDayList days={days} />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

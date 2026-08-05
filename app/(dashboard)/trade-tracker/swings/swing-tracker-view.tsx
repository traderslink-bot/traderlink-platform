"use client";

import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useState, type ReactNode } from "react";

import type { ReplacementSwingPositionDetail } from "../trade-tracker-platform-data";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  DashboardPage,
  DashboardPanel,
  DashboardSecondaryAction,
} from "../../../dashboard-template";
import { ManualExecutionEditDialog } from "../manual-execution-edit-dialog";
import { PositionStyleControl } from "../position-style-control";
import { SwingAnnotationEditor } from "./swing-annotation-editor";
import { SwingNoteEditor } from "./swing-note-editor";

function localDate(value: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const part = (type: "day" | "month" | "year") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function daysHeld(position: ReplacementSwingPositionDetail, reviewDate: string): number {
  const openedDate = localDate(position.openedAtUtc, position.timezone);
  const endDate = position.closedAtUtc
    ? localDate(position.closedAtUtc, position.timezone)
    : reviewDate;
  return Math.max(0, Math.round((
    Date.parse(`${endDate}T12:00:00.000Z`) -
    Date.parse(`${openedDate}T12:00:00.000Z`)
  ) / 86_400_000));
}

function timestamp(value: string, timezone: string): string {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  });
}

function decimal(value: string | null): string {
  return value === null ? "N/A" : formatJournalAnalyticsDecimal(value);
}

function price(value: string | null): string {
  if (value === null) return "N/A";
  const formatted = formatJournalAnalyticsDecimal(value);
  const negative = formatted.startsWith("-");
  const unsigned = negative ? formatted.slice(1) : formatted;
  const [whole, fraction = ""] = unsigned.split(".");
  return `${negative ? "-" : ""}$${whole}.${`${fraction}00`.slice(0, 2)}`;
}

function actionHref(
  position: ReplacementSwingPositionDetail,
  action: "record",
): string {
  const query = new URLSearchParams({
    action,
    direction: position.direction,
    symbol: position.symbol,
  });
  return `/trade-tracker/swings?${query.toString()}#swing-execution-entry`;
}

function SwingCard({
  expectedAccountSelectionRef,
  position,
  reviewDate,
}: {
  expectedAccountSelectionRef: string;
  position: ReplacementSwingPositionDetail;
  reviewDate: string;
}) {
  const active = position.projectionState === "legitimate_open";
  const [editingNoteDate, setEditingNoteDate] = useState<string | null>(null);
  const selectedNote = position.notes.find((note) =>
    note.reviewDate === editingNoteDate) ?? null;
  const held = daysHeld(position, reviewDate);

  return (
    <Card
      id={`swing-${position.positionRef}`}
      sx={{ borderColor: active ? "primary.light" : "divider", scrollMarginTop: 96 }}
      variant="outlined"
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
        }}
      >
        <Box
          sx={{
            bgcolor: active ? "rgba(1, 30, 86, 0.06)" : "action.hover",
            borderBottom: { xs: 1, md: 0 },
            borderColor: "divider",
            borderRight: { md: 1 },
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Typography color="primary.main" sx={{ display: "block", fontWeight: 850 }} variant="overline">
            {active ? "Active swing" : "Completed swing"}
          </Typography>
          <Typography component="h3" sx={{ fontWeight: 900 }} variant="h4">
            {position.symbol}
          </Typography>
          <Chip
            label={position.direction === "long" ? "Long" : "Short"}
            size="small"
            sx={{ mt: 1 }}
            variant="outlined"
          />
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
            Opened {timestamp(position.openedAtUtc, position.timezone)}
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(150px, 1fr))" },
            }}
          >
            <Box>
              <Typography color="text.secondary" variant="caption">Remaining shares</Typography>
              <Typography sx={{ fontWeight: 850 }} variant="h6">{decimal(position.remainingQuantityDecimal)}</Typography>
            </Box>
            <Box>
              <Typography color="text.secondary" variant="caption">Average entry</Typography>
              <Typography sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 850 }} variant="h6">
                {price(position.averageEntryPriceDecimal)}
              </Typography>
            </Box>
            <Box>
              <Typography color="text.secondary" variant="caption">Days held</Typography>
              <Typography sx={{ fontWeight: 850 }} variant="h6">{held}</Typography>
            </Box>
          </Box>

          {active ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
              <DashboardSecondaryAction href={actionHref(position, "record")}>Add execution</DashboardSecondaryAction>
              <PositionStyleControl
                closed={false}
                expectedAccountSelectionRef={expectedAccountSelectionRef}
                mode="mark-failed-swing"
                positionRef={position.positionRef}
                sourceUi="swing_trade_tracker"
                style={position.style}
              />
            </Stack>
          ) : null}

          <Divider sx={{ my: 2.5 }} />
          <Typography sx={{ fontWeight: 850 }} variant="subtitle2">Tags</Typography>
          <SwingAnnotationEditor
            availableTags={position.availableTags}
            expectedAccountSelectionRef={expectedAccountSelectionRef}
            positionRef={position.positionRef}
            rules={position.rules}
            showRules={false}
            tags={position.tags}
          />

          <Divider sx={{ my: 2.5 }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 850 }} variant="subtitle2">Saved notes</Typography>
            {active ? (
              <Button onClick={() => setEditingNoteDate(reviewDate)} size="small" variant="outlined">
                Add additional note
              </Button>
            ) : null}
          </Stack>
          {position.notes.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">No notes saved yet.</Typography>
          ) : (
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
              {position.notes.map((note) => (
                <Button key={`${note.reviewDate}:${note.revision}`} onClick={() => setEditingNoteDate(note.reviewDate)} size="small" variant="outlined">
                  {note.reviewDate}
                </Button>
              ))}
            </Stack>
          )}
          {editingNoteDate ? (
            <Box sx={{ mt: 1.5 }}>
              <SwingNoteEditor
                expectedAccountSelectionRef={expectedAccountSelectionRef}
                note={selectedNote}
                positionRef={position.positionRef}
                reviewDate={editingNoteDate}
              />
            </Box>
          ) : null}

          <Divider sx={{ my: 2.5 }} />
          <Typography sx={{ fontWeight: 850 }} variant="subtitle2">Executions</Typography>
          <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
            {position.executions.map((execution, index) => (
              <Box
                key={`${execution.executedAtUtc}:${index}`}
                sx={{ alignItems: { sm: "center" }, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", sm: "minmax(150px, 1.4fr) 72px 100px 90px 90px auto" }, py: 1.25 }}
              >
                <Typography color="text.secondary" variant="body2">{timestamp(execution.executedAtUtc, position.timezone)}</Typography>
                <Typography sx={{ textTransform: "capitalize" }} variant="body2">{execution.side}</Typography>
                <Typography variant="body2">{decimal(execution.quantityDecimal)} shares</Typography>
                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">{price(execution.priceDecimal)}</Typography>
                <Typography color="text.secondary" variant="body2">{execution.feesDecimal === null ? "No fees" : price(execution.feesDecimal)}</Typography>
                <ManualExecutionEditDialog
                  execution={{
                    manualEdit: execution.manualEdit,
                    price: execution.priceDecimal,
                    quantity: execution.quantityDecimal,
                    side: execution.side,
                    symbol: position.symbol,
                  }}
                  expectedAccountSelectionRef={expectedAccountSelectionRef}
                />
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 2.5 }} />
        </Box>
      </Box>
    </Card>
  );
}

export function SwingTrackerView({
  active,
  completed,
  expectedAccountSelectionRef,
  reviewDate,
  topContent,
}: {
  active: readonly ReplacementSwingPositionDetail[];
  completed: readonly ReplacementSwingPositionDetail[];
  expectedAccountSelectionRef: string;
  reviewDate: string;
  topContent: ReactNode;
}) {
  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Trade Tracker
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Swing Trade Tracker
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Chip label={`${active.length} active swing${active.length === 1 ? "" : "s"}`} size="small" variant="outlined" />
        <Chip label={`${completed.length} recently completed`} size="small" variant="outlined" />
      </Stack>

      {topContent}

      <DashboardPanel action={<Chip color="primary" label={`${active.length} active`} size="small" />} title="Active swing trades">
        {active.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No positions are currently confirmed as active swings. Enter a planned swing above or classify a confirmed open position.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {active.map((position) => <SwingCard expectedAccountSelectionRef={expectedAccountSelectionRef} key={position.positionRef} position={position} reviewDate={reviewDate} />)}
          </Stack>
        )}
      </DashboardPanel>

      <DashboardPanel action={<Chip label={`${completed.length} shown`} size="small" variant="outlined" />} title="Recently completed swings">
        {completed.length === 0 ? (
          <Typography color="text.secondary" variant="body2">Completed swing trades will remain here with their notes and execution history.</Typography>
        ) : (
          <Stack spacing={2}>
            {completed.map((position) => <SwingCard expectedAccountSelectionRef={expectedAccountSelectionRef} key={position.positionRef} position={position} reviewDate={reviewDate} />)}
          </Stack>
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}

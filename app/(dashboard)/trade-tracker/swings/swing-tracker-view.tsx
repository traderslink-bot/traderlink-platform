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
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";

import type { ReplacementSwingPositionDetail } from "../trade-tracker-platform-data";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  DashboardPage,
  DashboardPanel,
  DashboardSecondaryAction,
} from "../../../dashboard-template";
import { FeatureHelpLink } from "../../feature-help-link";
import { SwingPositionPlanEditor } from "../swing-position-plan-editor";

const ManualExecutionEditDialog = dynamic(() =>
  import("../manual-execution-edit-dialog").then((module) => module.ManualExecutionEditDialog));
const PositionStyleControl = dynamic(() =>
  import("../position-style-control").then((module) => module.PositionStyleControl));
const SwingAnnotationEditor = dynamic(() =>
  import("./swing-annotation-editor").then((module) => module.SwingAnnotationEditor));
const SwingNoteEditor = dynamic(() =>
  import("./swing-note-editor").then((module) => module.SwingNoteEditor));

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

function savedViewTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function decimal(value: string | null): string {
  return value === null ? "N/A" : formatJournalAnalyticsDecimal(value);
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
  offline,
  position,
  reviewDate,
}: {
  expectedAccountSelectionRef: string;
  offline: boolean;
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
          <Typography color="text.secondary" sx={{ mt: 2 }} variant="caption">Average entry</Typography>
          <Typography sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 850, mt: 0.25 }} variant="body1">
            {formatJournalAnalyticsMoney(position.averageEntryPriceDecimal, position.currency)}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="caption">Opened</Typography>
          <Typography sx={{ fontWeight: 750, mt: 0.25 }} variant="body2">
            {timestamp(position.openedAtUtc, position.timezone)}
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(2, minmax(150px, 1fr))" },
            }}
          >
            <Box>
              <Typography color="text.secondary" variant="caption">Remaining shares</Typography>
              <Typography sx={{ fontWeight: 850 }} variant="h6">{decimal(position.remainingQuantityDecimal)}</Typography>
            </Box>
            <Box>
              <Typography color="text.secondary" variant="caption">Days held</Typography>
              <Typography sx={{ fontWeight: 850 }} variant="h6">{held}</Typography>
            </Box>
          </Box>

          {active && position.style ? (
            <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.035)", borderRadius: 1.5, mt: 2, p: 1.5 }}>
              <Typography color="text.secondary" variant="caption">Swing plan</Typography>
              <Box sx={{ mt: 0.75 }}>
                <SwingPositionPlanEditor
                  expectedAccountSelectionRef={expectedAccountSelectionRef}
                  plan={position.style.swingPlan}
                  positionRef={position.positionRef}
                  revision={position.style.revision}
                  sourceUi="swing_trade_tracker"
                />
              </Box>
            </Box>
          ) : null}

          {active && !offline ? (
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
          ) : active ? (
            <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
              Use the offline execution form above to record activity. Reconnect to change this swing classification.
            </Typography>
          ) : null}

          <Divider sx={{ my: 2.5 }} />
          <Typography sx={{ fontWeight: 850 }} variant="subtitle2">Tags</Typography>
          {offline ? (
            position.tags.length > 0 ? (
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                {position.tags.map((tag) => (
                  <Chip key={tag.tagId} label={tag.name} size="small" variant="outlined" />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">No tags saved.</Typography>
            )
          ) : (
            <SwingAnnotationEditor
              availableTags={position.availableTags}
              expectedAccountSelectionRef={expectedAccountSelectionRef}
              positionRef={position.positionRef}
              rules={position.rules}
              showRules={false}
              tags={position.tags}
            />
          )}

          <Divider sx={{ my: 2.5 }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 850 }} variant="subtitle2">Saved notes</Typography>
            {active && !offline ? (
              <Button onClick={() => setEditingNoteDate(reviewDate)} size="small" sx={{ minHeight: { xs: 44, sm: 36 } }} variant="outlined">
                Add additional note
              </Button>
            ) : null}
          </Stack>
          {position.notes.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">No notes saved yet.</Typography>
          ) : offline ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {position.notes.map((note) => (
                <Box key={`${note.reviewDate}:${note.revision}`} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }} variant="body2">{note.reviewDate}</Typography>
                  <Typography sx={{ mt: 0.75, whiteSpace: "pre-wrap" }} variant="body2">{note.note}</Typography>
                  {note.nextSessionPlan ? (
                    <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }} variant="body2">
                      Next session: {note.nextSessionPlan}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Stack>
          ) : (
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
              {position.notes.map((note) => (
                <Button key={`${note.reviewDate}:${note.revision}`} onClick={() => setEditingNoteDate(note.reviewDate)} size="small" sx={{ minHeight: { xs: 44, sm: 36 } }} variant="outlined">
                  {note.reviewDate}
                </Button>
              ))}
            </Stack>
          )}
          {!offline && editingNoteDate ? (
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
                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">{formatJournalAnalyticsMoney(execution.reportingPriceDecimal, position.currency)}</Typography>
                <Typography color="text.secondary" variant="body2">{execution.reportingFeesDecimal === null ? "No fees" : formatJournalAnalyticsMoney(execution.reportingFeesDecimal, position.currency)}</Typography>
                {!offline ? (
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
                ) : null}
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
  offlineSavedAtUtc,
  reviewDate,
  topContent,
}: {
  active: readonly ReplacementSwingPositionDetail[];
  completed: readonly ReplacementSwingPositionDetail[];
  expectedAccountSelectionRef: string;
  offlineSavedAtUtc?: string;
  reviewDate: string;
  topContent: ReactNode;
}) {
  return (
    <DashboardPage>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
            Trade Tracker
          </Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
            Swing Trade Tracker
          </Typography>
        </Box>
        <FeatureHelpLink href="/help/swing-trade-tracker" label="Swing Trade Tracker" size="medium" />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {offlineSavedAtUtc ? (
          <Chip color="primary" label={`Offline · Last updated ${savedViewTime(offlineSavedAtUtc)}`} size="small" variant="outlined" />
        ) : null}
        <Chip label={`${active.length} active swing${active.length === 1 ? "" : "s"}`} size="small" variant="outlined" />
        <Chip label={`${completed.length} recently completed`} size="small" variant="outlined" />
      </Stack>

      {topContent}

      <DashboardPanel action={<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}><FeatureHelpLink href="/help/swing-trade-tracker/review-and-journal" label="active swing trades" /><Chip color="primary" label={`${active.length} active`} size="small" /></Stack>} title="Active swing trades">
        {active.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No positions are currently confirmed as active swings. Enter a planned swing above or classify a confirmed open position.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {active.map((position) => <SwingCard expectedAccountSelectionRef={expectedAccountSelectionRef} key={position.positionRef} offline={Boolean(offlineSavedAtUtc)} position={position} reviewDate={reviewDate} />)}
          </Stack>
        )}
      </DashboardPanel>

      <DashboardPanel action={<Chip label={`${completed.length} shown`} size="small" variant="outlined" />} title="Recently completed swings">
        {completed.length === 0 ? (
          <Typography color="text.secondary" variant="body2">Completed swing trades will remain here with their notes and execution history.</Typography>
        ) : (
          <Stack spacing={2}>
            {completed.map((position) => <SwingCard expectedAccountSelectionRef={expectedAccountSelectionRef} key={position.positionRef} offline={Boolean(offlineSavedAtUtc)} position={position} reviewDate={reviewDate} />)}
          </Stack>
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}

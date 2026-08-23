"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { Alert, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { JournalSwingPositionPlan } from "@/src/modules/journal/contracts/journal-trade-style-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import { DashboardPrimaryAction } from "../../dashboard-template";
import { useTradeTrackerUnsavedChanges } from "./trade-tracker-unsaved-changes";

const HOLD_DAY_OPTIONS = Object.freeze([
  ...Array.from({ length: 30 }, (_, index) => index + 1),
  45,
  60,
  90,
  120,
  180,
  252,
]);

function failureMessage(code?: string): string {
  if (code === "TRADERLINK_TRADE_STYLE_CONFLICT") {
    return "This swing changed while you were reviewing it. Refresh the page and try again.";
  }
  return "The swing plan could not be saved. Your entries are still here.";
}

export function SwingPositionPlanEditor({
  expectedAccountSelectionRef,
  plan,
  positionRef,
  revision,
  sourceUi,
}: Readonly<{
  expectedAccountSelectionRef: string;
  plan: JournalSwingPositionPlan | null;
  positionRef: string;
  revision: number;
  sourceUi: "day_trade_tracker" | "swing_trade_tracker";
}>) {
  const router = useRouter();
  const [entryReason, setEntryReason] = useState(plan?.entryReason ?? "");
  const [hasUpcomingCatalyst, setHasUpcomingCatalyst] = useState(plan?.hasUpcomingCatalyst ?? false);
  const [catalystDetails, setCatalystDetails] = useState(plan?.catalystDetails ?? "");
  const [plannedHoldTradingDays, setPlannedHoldTradingDays] = useState(
    String(plan?.plannedHoldTradingDays ?? 5),
  );
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const original = JSON.stringify(plan);
  const draft = JSON.stringify({
    entryReason: entryReason.trim(),
    hasUpcomingCatalyst,
    catalystDetails: hasUpcomingCatalyst ? catalystDetails.trim() || null : null,
    plannedHoldTradingDays: Number(plannedHoldTradingDays),
  });
  useTradeTrackerUnsavedChanges(
    `swing-position-plan:${positionRef}`,
    state.kind !== "saved" && (plan === null
      ? entryReason.trim().length > 0 || hasUpcomingCatalyst || catalystDetails.trim().length > 0 || Number(plannedHoldTradingDays) !== 5
      : draft !== original),
  );
  const canSave = entryReason.trim().length > 0 &&
    (!hasUpcomingCatalyst || catalystDetails.trim().length > 0) &&
    HOLD_DAY_OPTIONS.includes(Number(plannedHoldTradingDays));

  async function save(): Promise<void> {
    if (!canSave || state.kind === "saving") return;
    setState({ kind: "saving" });
    try {
      const response = await fetch(
        `/api/platform/journal/trade-style/${encodeURIComponent(positionRef)}/plan`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            expectedRevision: revision,
            entryReason,
            hasUpcomingCatalyst,
            catalystDetails: hasUpcomingCatalyst ? catalystDetails : null,
            plannedHoldTradingDays: Number(plannedHoldTradingDays),
            sourceUi,
            idempotencyKey: crypto.randomUUID(),
          }),
          headers: {
            "content-type": "application/json",
            [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
          },
          method: "POST",
        },
      );
      const body = await response.json() as { code?: string; status?: string };
      if (!response.ok || body.status !== "ready") {
        setState({ kind: "error", message: failureMessage(body.code) });
        return;
      }
      setState({ kind: "saved" });
      router.refresh();
    } catch {
      setState({ kind: "error", message: failureMessage() });
    }
  }

  return (
    <Stack spacing={1.25}>
      <Typography color="text.secondary" variant="body2">
        Save the reason for this position and how long you expect to hold it.
      </Typography>
      <TextField
        label="Why I entered"
        minRows={3}
        multiline
        onChange={(event) => {
          setEntryReason(event.target.value);
          setState({ kind: "idle" });
        }}
        placeholder="What made this trade worth taking?"
        value={entryReason}
      />
      <TextField
        label="Upcoming catalyst"
        onChange={(event) => {
          setHasUpcomingCatalyst(event.target.value === "yes");
          setState({ kind: "idle" });
        }}
        select
        size="small"
        value={hasUpcomingCatalyst ? "yes" : "no"}
      >
        <MenuItem value="no">No planned catalyst</MenuItem>
        <MenuItem value="yes">Yes</MenuItem>
      </TextField>
      {hasUpcomingCatalyst ? (
        <TextField
          label="Catalyst details"
          minRows={2}
          multiline
          onChange={(event) => {
            setCatalystDetails(event.target.value);
            setState({ kind: "idle" });
          }}
          placeholder="For example: earnings, product launch or FDA decision"
          value={catalystDetails}
        />
      ) : null}
      <TextField
        label="Planned hold (trading days)"
        onChange={(event) => {
          setPlannedHoldTradingDays(event.target.value);
          setState({ kind: "idle" });
        }}
        select
        size="small"
        value={plannedHoldTradingDays}
      >
        {HOLD_DAY_OPTIONS.map((days) => (
          <MenuItem key={days} value={String(days)}>
            {days} trading day{days === 1 ? "" : "s"}
          </MenuItem>
        ))}
      </TextField>
      <DashboardPrimaryAction
        disabled={!canSave || state.kind === "saving"}
        onClick={() => void save()}
        startIcon={state.kind === "saved" ? <CheckCircleOutlineRoundedIcon /> : undefined}
      >
        {state.kind === "saving" ? "Saving..." : state.kind === "saved" ? "Swing plan saved" : "Save swing plan"}
      </DashboardPrimaryAction>
      {state.kind === "error" ? <Alert severity="error">{state.message}</Alert> : null}
    </Stack>
  );
}

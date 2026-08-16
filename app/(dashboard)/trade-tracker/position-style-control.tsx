"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  JournalOpenPositionStatus,
  JournalTradeStyle,
} from "@/src/modules/journal/contracts/journal-trade-style-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import {
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";
import type { PositionStyleDisplay } from "./position-style-labels";
import { useTradeTrackerUnsavedChanges } from "./trade-tracker-unsaved-changes";

type OpenClassification = Exclude<JournalOpenPositionStatus, "closed">;
type Selection = OpenClassification | JournalTradeStyle;
type PositionStyleControlProps = Readonly<{
  closed: boolean;
  expectedAccountSelectionRef: string;
  mode?: "full" | "mark-failed-swing";
  positionRef: string;
  sourceUi: "day_trade_tracker" | "swing_trade_tracker" | "open_positions";
  style: PositionStyleDisplay | null;
}>;

function initialSelection(
  style: PositionStyleDisplay | null,
  closed: boolean,
): Selection {
  if (closed) return style?.tradeStyle ?? "other";
  return style?.openStatus === "closed"
    ? "unclassified"
    : style?.openStatus ?? "unclassified";
}

function changeForSelection(
  selection: Selection,
  closed: boolean,
): Readonly<{
  tradeStyle: JournalTradeStyle;
  openStatus: OpenClassification;
  reason: "planned_from_entry" | "reclassified" | "unplanned_hold" | "other";
}> {
  if (closed) {
    if (selection === "day_trade") {
      return { tradeStyle: "day_trade", openStatus: "day_trade_still_open", reason: "reclassified" };
    }
    if (selection === "swing") {
      return { tradeStyle: "swing", openStatus: "swing", reason: "reclassified" };
    }
    return { tradeStyle: "other", openStatus: "other", reason: "other" };
  }
  if (selection === "swing") {
    return { tradeStyle: "swing", openStatus: "swing", reason: "reclassified" };
  }
  if (selection === "day_trade_still_open") {
    return {
      tradeStyle: "day_trade",
      openStatus: "day_trade_still_open",
      reason: "reclassified",
    };
  }
  if (selection === "unplanned_hold") {
    return { tradeStyle: "other", openStatus: "unplanned_hold", reason: "unplanned_hold" };
  }
  return {
    tradeStyle: "other",
    openStatus: selection === "unclassified" ? "unclassified" : "other",
    reason: "other",
  };
}

function failureMessage(code?: string): string {
  if (code === "TRADERLINK_TRADE_STYLE_CONFLICT") {
    return "This trade changed while you were reviewing it. Refresh the page and choose again.";
  }
  return "The trade type could not be saved. Your current selection has not changed.";
}

function PositionStyleControlForm({
  closed,
  expectedAccountSelectionRef,
  mode = "full",
  positionRef,
  sourceUi,
  style,
}: PositionStyleControlProps) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(style, closed));
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "saved" } |
    { kind: "error"; message: string }
  >({ kind: "idle" });
  useTradeTrackerUnsavedChanges(
    `daily-trade-tracker:position-style:${positionRef}`,
    mode === "full" &&
      state.kind !== "saved" &&
      selection !== initialSelection(style, closed),
  );

  async function save() {
    if (state.kind === "saving") return;
    setState({ kind: "saving" });
    const change = mode === "mark-failed-swing"
      ? {
          openStatus: "unplanned_hold" as const,
          reason: "unplanned_hold" as const,
          tradeStyle: "other" as const,
        }
      : changeForSelection(selection, closed);
    try {
      const response = await fetch(
        `/api/platform/journal/trade-style/${encodeURIComponent(positionRef)}`,
        {
          body: JSON.stringify({
            ...change,
            claimedEffectiveAtUtc: new Date().toISOString(),
            expectedAccountSelectionRef,
            expectedRevision: style?.revision ?? null,
            idempotencyKey: crypto.randomUUID(),
            plannedFromEntry: false,
            reason: change.reason,
            sourceUi,
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
      setConfirmationOpen(false);
      setState({ kind: "saved" });
      router.refresh();
    } catch {
      setState({ kind: "error", message: failureMessage() });
    }
  }

  if (mode === "mark-failed-swing") {
    return (
      <Stack spacing={1}>
        <DashboardSecondaryAction
          disabled={state.kind === "saving"}
          onClick={() => {
            setState({ kind: "idle" });
            setConfirmationOpen(true);
          }}
          startIcon={state.kind === "saved" ? <CheckCircleOutlineRoundedIcon /> : undefined}
        >
          {state.kind === "saving" ? "Saving..." : state.kind === "saved" ? "Marked failed swing" : "Mark failed swing"}
        </DashboardSecondaryAction>
        {state.kind === "error" ? <Alert severity="error">{state.message}</Alert> : null}
        <Dialog
          aria-describedby="mark-failed-swing-description"
          aria-labelledby="mark-failed-swing-title"
          fullWidth
          maxWidth="xs"
          onClose={() => {
            if (state.kind !== "saving") setConfirmationOpen(false);
          }}
          open={confirmationOpen}
          slotProps={{
            paper: {
              sx: {
                m: { xs: 2, sm: 4 },
                width: { xs: "calc(100% - 32px)", sm: "100%" },
              },
            },
          }}
        >
          <DialogTitle id="mark-failed-swing-title">
            Mark this swing as failed?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="mark-failed-swing-description">
              This changes the position from Active swing to Unplanned hold
              (bag hold) everywhere it appears. It does not change any saved
              executions.
            </DialogContentText>
            {state.kind === "error" ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {state.message}
              </Alert>
            ) : null}
          </DialogContent>
          <DialogActions
            sx={{
              alignItems: "stretch",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              px: 3,
              pb: 3,
              "& .MuiButton-root": {
                minHeight: 44,
                ml: "0 !important",
                width: { xs: "100%", sm: "auto" },
              },
            }}
          >
            <DashboardSecondaryAction
              disabled={state.kind === "saving"}
              onClick={() => setConfirmationOpen(false)}
            >
              Keep as active swing
            </DashboardSecondaryAction>
            <DashboardPrimaryAction
              disabled={state.kind === "saving"}
              onClick={() => void save()}
            >
              {state.kind === "saving" ? "Saving..." : "Mark failed swing"}
            </DashboardPrimaryAction>
          </DialogActions>
        </Dialog>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "minmax(220px, 1fr) auto" },
        }}
      >
        <TextField
          label={closed ? "Trade type" : "How are you managing this position?"}
          onChange={(event) => {
            setSelection(event.target.value as Selection);
            setState({ kind: "idle" });
          }}
          select
          size="small"
          value={selection}
        >
          {closed ? [
            <MenuItem key="day_trade" value="day_trade">Day trade</MenuItem>,
            <MenuItem key="swing" value="swing">Swing trade</MenuItem>,
            <MenuItem key="other" value="other">Other</MenuItem>,
          ] : [
            <MenuItem key="unclassified" value="unclassified">Not classified</MenuItem>,
            <MenuItem key="swing" value="swing">Active swing</MenuItem>,
            <MenuItem key="day_trade_still_open" value="day_trade_still_open">Day trade still open</MenuItem>,
            <MenuItem key="unplanned_hold" value="unplanned_hold">Unplanned hold (bag hold)</MenuItem>,
            <MenuItem key="other" value="other">Long-term hold</MenuItem>,
          ]}
        </TextField>
        <DashboardPrimaryAction
          disabled={state.kind === "saving"}
          onClick={() => void save()}
          startIcon={state.kind === "saved" ? <CheckCircleOutlineRoundedIcon /> : undefined}
        >
          {state.kind === "saving" ? "Saving..." : state.kind === "saved" ? "Saved" : "Save trade type"}
        </DashboardPrimaryAction>
      </Box>
      {state.kind === "error" ? <Alert severity="error">{state.message}</Alert> : null}
    </Stack>
  );
}

export function PositionStyleControl(props: PositionStyleControlProps) {
  return (
    <PositionStyleControlForm
      {...props}
      key={`${props.positionRef}:${props.closed}:${props.style?.revision ?? "new"}`}
    />
  );
}

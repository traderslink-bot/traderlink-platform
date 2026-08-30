"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { useTradeTrackerUnsavedChanges } from "./trade-tracker-unsaved-changes";

export type EditableManualExecutionView = Readonly<{
  deleteRef?: string | null;
  editRef: string;
  fees: string | null;
  localDate: string;
  localTime: string;
  sourceTimezone: string;
  sourcePrice?: string | null;
  tradeCurrency: string;
}>;

export type ManualExecutionEditView = Readonly<{
  manualEdit: EditableManualExecutionView | null;
  price: string | null;
  quantity: string;
  side: "buy" | "sell";
  symbol: string;
}>;

type ManualExecutionEditDraft = {
  fees: string;
  localDate: string;
  localTime: string;
  price: string;
  quantity: string;
  side: "buy" | "sell";
  sourceTimezone: string;
  symbol: string;
  tradeCurrency: string;
};

function draftsMatch(
  left: ManualExecutionEditDraft,
  right: ManualExecutionEditDraft,
): boolean {
  return Object.keys(left).every((key) =>
    left[key as keyof ManualExecutionEditDraft] ===
      right[key as keyof ManualExecutionEditDraft]);
}

function displayTime(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/u);
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = match[2];
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

export function ManualExecutionEditDialog({
  execution,
  expectedAccountSelectionRef,
}: {
  execution: ManualExecutionEditView;
  expectedAccountSelectionRef: string;
}) {
  const router = useRouter();
  const editable = execution.manualEdit;
  const initialDraft = (): ManualExecutionEditDraft => ({
    fees: editable?.fees ?? "",
    localDate: editable?.localDate ?? "",
    localTime: editable?.localTime ?? "",
    price: editable?.sourcePrice ?? execution.price ?? "",
    quantity: execution.quantity,
    side: execution.side,
    sourceTimezone: editable?.sourceTimezone ?? "",
    symbol: execution.symbol,
    tradeCurrency: editable?.tradeCurrency ?? "",
  });
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  useTradeTrackerUnsavedChanges(
    `daily-trade-tracker:manual-execution-edit:${editable?.editRef ?? "unavailable"}`,
    Boolean(editable) && open && !draftsMatch(draft, initialDraft()),
  );

  if (!editable) return null;
  const editRef = editable.editRef;

  const update = <Key extends keyof ManualExecutionEditDraft>(
    field: Key,
    value: ManualExecutionEditDraft[Key],
  ) => setDraft((current) => ({ ...current, [field]: value }));

  const openEditor = () => {
    setDraft(initialDraft());
    setError(null);
    setOpen(true);
  };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/platform/journal/manual-executions/${editRef}`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            feesDecimal: draft.fees.trim() || null,
            idempotencyKey: crypto.randomUUID(),
            localDate: draft.localDate,
            localTime: draft.localTime,
            normalizedSymbol: draft.symbol,
            priceDecimal: draft.price,
            quantityDecimal: draft.quantity,
            side: draft.side,
            sourceTimezone: draft.sourceTimezone,
            tradeCurrency: draft.tradeCurrency,
          }),
          headers: {
            "Content-Type": "application/json",
            [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
          },
          method: "POST",
        },
      );
      const packet = await response.json() as {
        code?: string;
        result?: {
          analysisRefresh?: { queuedTradeCount?: number };
        };
      };
      if (!response.ok) {
        if (packet.code === "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION") {
          throw new Error("This execution is being compared with broker data. Review that match in Data Decisions before editing it here.");
        }
        if (packet.code === "TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT") {
          throw new Error("This execution changed since the page opened. Refresh the page and try again.");
        }
        throw new Error("Check the execution details and try again.");
      }
      setConfirmation(
        (packet.result?.analysisRefresh?.queuedTradeCount ?? 0) > 0
          ? "Execution updated. Analysis is updating with the latest executions."
          : "Execution updated.",
      );
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The execution could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExecution() {
    const deleteRef = editable?.deleteRef;
    if (!deleteRef) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/platform/journal/manual-executions/${deleteRef}`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            idempotencyKey: crypto.randomUUID(),
          }),
          headers: {
            "Content-Type": "application/json",
            [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
          },
          method: "DELETE",
        },
      );
      const packet = await response.json() as { code?: string; result?: { analysisRefresh?: { queuedTradeCount?: number } } };
      if (!response.ok) {
        if (packet.code === "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION") {
          throw new Error("This execution is being compared with broker data. Review that match in Data Decisions before deleting it here.");
        }
        if (packet.code === "TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT") {
          throw new Error("This execution changed since the page opened. Refresh the page and try again.");
        }
        throw new Error("The execution could not be deleted. Refresh the page and try again.");
      }
      setConfirmation(
        (packet.result?.analysisRefresh?.queuedTradeCount ?? 0) > 0
          ? "Execution deleted. Trade Analyzer is updating the affected trade."
          : "Execution deleted.",
      );
      setDeleteOpen(false);
      window.setTimeout(() => router.refresh(), 1200);
    } catch (cause) {
      setError(cause instanceof Error
        ? cause.message
        : "The execution could not be deleted. Refresh the page and try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Stack direction="row" spacing={0.75}>
        <Button onClick={openEditor} size="small" sx={{ lineHeight: 1.2, minHeight: { xs: 44, sm: 36 }, minWidth: 56, px: 1, py: 0.5 }} variant="outlined">Edit</Button>
        {editable.deleteRef ? <Button color="error" onClick={() => { setError(null); setDeleteOpen(true); }} size="small" sx={{ lineHeight: 1.2, minHeight: { xs: 44, sm: 36 }, minWidth: 64, px: 1, py: 0.5 }} variant="outlined">Delete</Button> : null}
      </Stack>
      <Dialog fullWidth maxWidth="md" onClose={() => setOpen(false)} open={open}>
        <DialogTitle>Edit manual execution</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              Use the exact details shown by your broker. Trade replay and analysis use the execution time to match the correct chart candle. Saving refreshes the affected trades while keeping the earlier entry in its history.
            </Typography>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField label="Date" onChange={(event) => update("localDate", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.localDate} />
              <TextField
                label="Time"
                onChange={(event) => update("localTime", event.target.value)}
                slotProps={{
                  htmlInput: { step: 1 },
                  inputLabel: { shrink: true },
                }}
                type="time"
                value={draft.localTime}
              />
              <TextField label="Timezone" onChange={(event) => update("sourceTimezone", event.target.value)} value={draft.sourceTimezone} />
              <TextField label="Ticker" onChange={(event) => update("symbol", event.target.value.toUpperCase())} value={draft.symbol} />
              <TextField label="Currency" onChange={(event) => update("tradeCurrency", event.target.value.toUpperCase())} value={draft.tradeCurrency} />
              <TextField label="Side" onChange={(event) => update("side", event.target.value as ManualExecutionEditDraft["side"])} select value={draft.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
              <TextField label="Quantity" onChange={(event) => update("quantity", event.target.value)} value={draft.quantity} />
              <TextField label="Price" onChange={(event) => update("price", event.target.value)} value={draft.price} />
              <TextField helperText="Leave blank if your broker did not report fees." label="Fees" onChange={(event) => update("fees", event.target.value)} value={draft.fees} />
            </Box>
            {error ? (
              <Alert
                action={error.includes("Data Decisions") ? <Button color="inherit" component={Link} href="/data-decisions" size="small">Open Data Decisions</Button> : undefined}
                severity="error"
              >
                {error}
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={saving} onClick={() => void save()} variant="contained">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog fullWidth maxWidth="sm" onClose={() => { if (!deleting) setDeleteOpen(false); }} open={deleteOpen}>
        <DialogTitle>Delete this execution?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Typography variant="body2">Delete {execution.side === "buy" ? "Buy" : "Sell"} {formatJournalAnalyticsDecimal(execution.quantity)} {execution.symbol} at {displayTime(editable.localTime)}? This removes it from the active Trade Tracker history and recalculates the affected trade. The original Journal record is kept in history.</Typography>
            <Typography color="text.secondary" variant="body2">This may change whether the position is open or closed.</Typography>
            {error ? <Alert action={error.includes("Data Decisions") ? <Button color="inherit" component={Link} href="/data-decisions" size="small">Open Data Decisions</Button> : undefined} severity="error">{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" disabled={deleting} onClick={() => void deleteExecution()} variant="contained">{deleting ? "Deleting..." : "Delete execution"}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        autoHideDuration={5000}
        onClose={() => setConfirmation(null)}
        open={confirmation !== null}
      >
        <Alert
          onClose={() => setConfirmation(null)}
          severity="success"
          variant="filled"
        >
          {confirmation}
        </Alert>
      </Snackbar>
    </>
  );
}

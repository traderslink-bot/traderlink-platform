"use client";

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRef, useState } from "react";
import type { JournalManualTradeEntry, JournalManualTradePreview } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { commitManualTradeOnline, ManualTradeNeedsReviewError, previewManualTradeOnline, queueManualTradeSubmission, type ManualTradeSubmission, type ManualTradeSubmitResult } from "@/src/modules/platform/client/pwa/manual-trade-outbox";
import { ManualTradePostEntryReview, type PreviewLogicalTradeMerge } from "../trade-tracker/manual-trade-post-entry-review";

export type ChartExecutionDraft = Readonly<{ date: string; time: string; side?: "buy" | "sell"; positionRef?: string }>;

function positiveDecimalInput(value: string): boolean {
  return /^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value) && /[1-9]/u.test(value);
}

export function normalizeLeadingDecimal(value: string): string {
  return /^\.(\d+)$/u.test(value) ? `0${value}` : value;
}

function workspaceDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: timezone, year: "numeric" }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function manualTradePreviewMessage(code: string | undefined): string {
  if (code === "TRADERLINK_MANUAL_TRADE_SINGLE_DAY_REQUIRED") return "All executions in a Day Trade must use the same date.";
  if (code === "TRADERLINK_MANUAL_TRADE_RECENT_ENTRY_REQUIRED") return "An execution date or time is later than the current time. Check the date and broker time.";
  if (code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT") return "The selected account changed. Refresh and try again.";
  if (code === "TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT") return "Review the executions and try again.";
  return "The trade could not be saved. Your entries are still here.";
}

function workspaceSubmissionSummary(preview: JournalManualTradePreview): string {
  const completed = preview.groups.filter((group) => group.state === "complete_trade").length;
  const open = preview.groups.filter((group) => group.state === "open_trade").length;
  const existingClosed = preview.groups.filter((group) => group.state === "existing_position_closed").length;
  const existingChanged = preview.groups.filter((group) => group.state === "existing_position_changed").length;
  const parts = [
    completed > 0 ? `save ${completed} closed trade${completed === 1 ? "" : "s"}` : null,
    open > 0 ? `leave ${open} position${open === 1 ? "" : "s"} open` : null,
    existingClosed > 0 ? `close ${existingClosed} tracked position${existingClosed === 1 ? "" : "s"}` : null,
    existingChanged > 0 ? `change ${existingChanged} tracked position${existingChanged === 1 ? "" : "s"}` : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 1
    ? `These executions will ${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}.`
    : `These executions will ${parts[0] ?? "save a trade"}.`;
}

export function AddTradePanel({ accountCurrency, accountTimezone, chartDraft, embedded = false, expectedAccountSelectionRef, fixedSymbol, initialWorkspaceStyle = "day_trade", offlineScopeRef, onClose, onSaved, onWorkingChange }: Readonly<{ accountCurrency: string; accountTimezone: string; chartDraft?: ChartExecutionDraft; embedded?: boolean; expectedAccountSelectionRef: string; fixedSymbol?: string; initialWorkspaceStyle?: "day_trade" | "swing"; offlineScopeRef: string; onClose: () => void; onWorkingChange?: (working: boolean) => void; onSaved?: (result: ManualTradeSubmitResult | null) => void | Promise<void> }>) {
  const today = chartDraft?.date ?? workspaceDateInTimezone(accountTimezone);
  const makeRow = (id: number) => ({ date: today, fees: "", id, price: "", quantity: "", side: chartDraft?.side ?? "buy", time: id === 1 ? chartDraft?.time ?? "" : "" });
  const [symbol, setSymbol] = useState(fixedSymbol ?? "");
  const [workspaceStyle, setWorkspaceStyle] = useState<"day_trade" | "swing">(initialWorkspaceStyle);
  const [rows, setRows] = useState(() => [makeRow(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionConfirmation, setSubmissionConfirmation] = useState<Readonly<{
    preview: JournalManualTradePreview;
    submission: ManualTradeSubmission;
  }> | null>(null);
  const [logicalTradeMerges, setLogicalTradeMerges] = useState<readonly PreviewLogicalTradeMerge[]>([]);
  const idempotencyKey = useRef<string | null>(null);
  const update = (id: number, key: "date" | "fees" | "price" | "quantity" | "side" | "time", value: string) => { setError(null); setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } as typeof row : row)); };
  const save = async () => {
    const missing: string[] = []; if (!symbol.trim()) missing.push("Ticker is required."); for (const [index, row] of rows.entries()) { const execution = `Execution ${index + 1}`; if (!row.date) missing.push(`${execution}: Date is required.`); if (!row.time) missing.push(`${execution}: Time is required.`); if (!row.side) missing.push(`${execution}: Buy/Sell is required.`); if (!positiveDecimalInput(row.quantity)) missing.push(`${execution}: Shares must be greater than 0.`); if (!positiveDecimalInput(row.price)) missing.push(`${execution}: Price must be greater than 0.`); } if (missing.length > 0) { setError(missing.join(" ")); return; }
    const entries = rows.map((row): JournalManualTradeEntry => Object.freeze({ clientRowRef: `workspace-${row.id}`, feesDecimal: row.fees.trim() || null, localDate: row.date, localTime: row.time.length === 5 ? `${row.time}:00` : row.time, normalizedSymbol: symbol.trim().toUpperCase(), priceDecimal: row.price, quantityDecimal: row.quantity, side: row.side, sourceTimezone: accountTimezone, tradeCurrency: accountCurrency }));
    setSaving(true); onWorkingChange?.(true); setError(null);
    try {
      const submission = Object.freeze({ entries, expectedAccountSelectionRef, idempotencyKey: idempotencyKey.current ?? crypto.randomUUID(), tracker: "workspace" as const, workspaceStyle }); idempotencyKey.current = submission.idempotencyKey;
      if (!navigator.onLine) {
        if (chartDraft?.positionRef) {
          setError("Reconnect to confirm this fill belongs to the selected open trade.");
          return;
        }
        await queueManualTradeSubmission({ offlineScopeRef, submission });
        onSaved?.(null);
      } else {
        const preview = await previewManualTradeOnline(submission);
        if (chartDraft?.positionRef && !preview.groups.some((group) => group.existingPosition?.positionRef === chartDraft.positionRef)) {
          setError("This execution does not match the selected open trade. Check the broker time, side and shares.");
          return;
        }
        setLogicalTradeMerges([]);
        setSubmissionConfirmation({ preview, submission });
      }
    } catch (cause) { setError(cause instanceof ManualTradeNeedsReviewError ? manualTradePreviewMessage(cause.code) : cause instanceof Error ? cause.message : "The trade could not be saved. Your entries are still here."); } finally { setSaving(false); onWorkingChange?.(false); }
  };
  const confirmSubmission = async () => {
    if (!submissionConfirmation) return;
    setSaving(true); onWorkingChange?.(true); setError(null);
    try {
      const result = await commitManualTradeOnline(
        submissionConfirmation.submission,
        submissionConfirmation.preview,
        { logicalTradeMerges },
      );
      await onSaved?.(result);
      setSubmissionConfirmation(null);
    } catch (cause) { setError(cause instanceof ManualTradeNeedsReviewError ? manualTradePreviewMessage(cause.code) : cause instanceof Error ? cause.message : "The trade could not be saved. Your entries are still here."); } finally { setSaving(false); onWorkingChange?.(false); }
  };
  return <Stack sx={{ height: "100%" }}>
      {embedded ? null : <Stack direction="row" sx={{ borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Add trade</Typography>
        <Button onClick={onClose}>Close</Button>
      </Stack>}
      <Stack spacing={1.25} sx={{ p: embedded ? 0 : 2 }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>{fixedSymbol ? <TextField disabled label="Ticker" size="small" sx={{ width: { xs: 150, sm: 180 } }} value={symbol} /> : <TextField label="Ticker" onChange={(event) => { setError(null); setSymbol(event.target.value.toUpperCase()); }} size="small" sx={{ width: { xs: 150, sm: 180 } }} value={symbol} />}<TextField label="Day Trade/Swing" onChange={(event) => { setError(null); setWorkspaceStyle(event.target.value as "day_trade" | "swing"); }} select size="small" sx={{ width: 154 }} value={workspaceStyle}><MenuItem value="day_trade">Day Trade</MenuItem><MenuItem value="swing">Swing</MenuItem></TextField></Stack>
        {chartDraft ? <Typography color="text.secondary" variant="body2">
          Confirm the exact broker time ({accountTimezone === "America/New_York" ? "ET" : accountTimezone}), price and shares.
        </Typography> : <>
          <Typography color="text.secondary" variant="body2">Times use Eastern Time.</Typography>
          <Typography color="text.secondary" variant="body2">Entering the correct execution time keeps your trades in order. Trade Analyzer uses 1-minute candles, so you can enter the time from the matching chart candle when you do not have the broker timestamp.</Typography>
          <Typography color="text.secondary" variant="body2">Entering multiple trades? <Typography color="primary" component={Link} href="/trade-tracker" sx={{ fontWeight: 750, textDecoration: "none" }} variant="inherit">Use Trade Tracker to review your day.</Typography></Typography>
        </>}
        {rows.map((row, index) => <Box key={row.id} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontWeight: 750 }} variant="body2">Execution {index + 1}</Typography>
            {rows.length > 1 ? <Button color="inherit" onClick={() => { setError(null); setRows((current) => current.filter((entry) => entry.id !== row.id)); }} size="small">Remove</Button> : null}
          </Box>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: chartDraft ? "repeat(2, minmax(0, 1fr))" : { xs: "repeat(2, minmax(0, 1fr))", md: "164px 132px 110px 96px 104px 88px" } }}>
            <TextField label="Date" onChange={(event) => update(row.id, "date", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={row.date} />
            <TextField label="Time" onChange={(event) => update(row.id, "time", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true }, htmlInput: chartDraft ? { step: 1 } : undefined }} type="time" value={row.time} />
            <TextField label="Buy/Sell" onChange={(event) => update(row.id, "side", event.target.value)} select size="small" value={row.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
            <TextField label="Shares" onChange={(event) => update(row.id, "quantity", event.target.value)} size="small" value={row.quantity} />
            <TextField label="Price" onChange={(event) => update(row.id, "price", normalizeLeadingDecimal(event.target.value))} size="small" value={row.price} />
            <TextField label="Fee" onChange={(event) => update(row.id, "fees", normalizeLeadingDecimal(event.target.value))} size="small" value={row.fees} />
          </Box>
        </Box>)}
        <Button onClick={() => { setError(null); setRows((current) => [...current, makeRow(Math.max(...current.map((row) => row.id)) + 1)]); }} sx={{ alignSelf: "flex-start" }}>Add execution</Button>
        {error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}
        <Stack direction="row" spacing={1} sx={{ alignSelf: "flex-end" }}><Button disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={() => void save()} variant="contained">{saving ? "Saving…" : chartDraft ? "Review execution" : "Save"}</Button></Stack>
      </Stack>
      <Dialog fullWidth maxWidth="sm" onClose={saving ? undefined : () => setSubmissionConfirmation(null)} open={submissionConfirmation !== null}>
        <DialogTitle>Confirm trade entries</DialogTitle>
        <DialogContent><Stack spacing={1.5}><Typography>{submissionConfirmation ? workspaceSubmissionSummary(submissionConfirmation.preview) : ""}</Typography>
          {submissionConfirmation ? <ManualTradePostEntryReview analyzerGroupRefs={[]} analyzerUses={null} groups={submissionConfirmation.preview.groups} merges={logicalTradeMerges} onAnalyzerGroupRefsChange={() => undefined} onError={setError} onMergesChange={setLogicalTradeMerges} /> : null}
          {error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}
        </Stack></DialogContent>
        <DialogActions><Button disabled={saving} onClick={() => setSubmissionConfirmation(null)}>Cancel</Button><Button disabled={saving} onClick={() => void confirmSubmission()} variant="contained">{saving ? "Saving…" : chartDraft ? "Save execution" : "Confirm trades"}</Button></DialogActions>
      </Dialog>
  </Stack>;
}

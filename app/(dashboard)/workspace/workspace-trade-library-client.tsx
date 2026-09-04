"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CandlestickChartIcon from "@mui/icons-material/CandlestickChart";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Alert, Box, Button, Checkbox, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, FormControlLabel, IconButton, MenuItem, Stack, TableSortLabel, TextField, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { financialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import { formatJournalAnalyticsDecimal, formatJournalAnalyticsDuration, formatJournalAnalyticsMoney } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { JournalManualTradeEntry, JournalManualTradePreview } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { commitManualTradeOnline, ManualTradeNeedsReviewError, previewManualTradeOnline, queueManualTradeSubmission, type ManualTradeSubmission, type ManualTradeSubmitResult } from "@/src/modules/platform/client/pwa/manual-trade-outbox";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

import { loadWorkspaceTradeLibraryPage } from "./workspace-trade-library-actions";
import { WorkspaceAtomicTradeEditDrawer } from "./workspace-atomic-trade-edit-drawer";
import { useDashboardChart } from "../dashboard-chart-tool";
import { TradeDetailsDrawer } from "../trades/trade-details-drawer";
import { TradeExplorerReviewEditor } from "../analytics/trade-explorer/trade-review-editor";
import type { TradeExplorerReviewTarget } from "../analytics/trade-explorer/trade-review-model";
import type { WorkspaceTradeLibraryFilter, WorkspaceTradeLibraryModel, WorkspaceTradeLibraryRow, WorkspaceTradeLibrarySort } from "./workspace-trade-library";
import { ManualTradePostEntryReview, type PreviewLogicalTradeMerge } from "../trade-tracker/manual-trade-post-entry-review";

type TradeStateFilter = WorkspaceTradeLibraryFilter;
type TradeSort = WorkspaceTradeLibrarySort;
type TradeGroup = "none" | "day" | "ticker";

type TradeTableColumn = Readonly<{ ascending: TradeSort; descending: TradeSort; label: string }>;

const TRADE_TABLE_COLUMNS: readonly TradeTableColumn[] = Object.freeze([
  { ascending: "oldest", descending: "newest", label: "Date" },
  { ascending: "ticker_asc", descending: "ticker_desc", label: "Ticker" },
  { ascending: "direction_asc", descending: "direction_desc", label: "Side" },
  { ascending: "status_asc", descending: "status_desc", label: "Status" },
  { ascending: "buy_quantity_asc", descending: "buy_quantity", label: "Shares" },
  { ascending: "position_asc", descending: "position", label: "POS" },
  { ascending: "entry_asc", descending: "entry", label: "Entry" },
  { ascending: "exit_asc", descending: "exit", label: "Exit" },
  { ascending: "entry_value_asc", descending: "entry_value", label: "Entry value" },
  { ascending: "hold_asc", descending: "hold", label: "Hold" },
  { ascending: "pnl_low", descending: "pnl_high", label: "Gain/Loss" },
]);
function tradeMoney(row: WorkspaceTradeLibraryRow): string {
  return row.gainLossDecimal === null ? "—" : formatJournalAnalyticsMoney(row.gainLossDecimal, row.tradeCurrency, { showPositiveSign: true });
}

function shortDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "—";
}

function positiveDecimalInput(value: string): boolean {
  return /^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value) && /[1-9]/u.test(value);
}

function normalizeLeadingDecimal(value: string): string {
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

function deleteFailureMessage(code: unknown): string {
  if (code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT") {
    return "The selected account changed. Refresh and try again.";
  }
  if (code === "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION") {
    return "This execution is no longer available for deletion. Refresh to see its current status.";
  }
  if (code === "TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT") {
    return "This execution changed before it could be deleted. Refresh to see its current status.";
  }
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" || code === "TRADERLINK_ACCOUNT_ACCESS_DENIED") {
    return "Your access changed. Refresh and try again.";
  }
  if (code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED") {
    return "The journal could not validate this deletion. Refresh and try again.";
  }
  if (code === "TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID") {
    return "The delete request could not be verified. Refresh and try again.";
  }
  return "The execution could not be deleted. Refresh the page and try again.";
}

function ActionButton({ children, color = "text.primary", desktopOnly = false, label, onClick }: Readonly<{ children: ReactNode; color?: string; desktopOnly?: boolean; label: string; onClick: () => void }>) {
  return <Tooltip title={label}><IconButton aria-label={label} onClick={(event) => { event.stopPropagation(); onClick(); }} size="small" sx={{ color, display: desktopOnly ? { xs: "none", md: "inline-flex" } : "inline-flex" }}>{children}</IconButton></Tooltip>;
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

function AddTradePanel({ accountCurrency, accountTimezone, embedded = false, expectedAccountSelectionRef, fixedSymbol, initialWorkspaceStyle = "day_trade", offlineScopeRef, onClose, onSaved }: Readonly<{ accountCurrency: string; accountTimezone: string; embedded?: boolean; expectedAccountSelectionRef: string; fixedSymbol?: string; initialWorkspaceStyle?: "day_trade" | "swing"; offlineScopeRef: string; onClose: () => void; onSaved?: (result: ManualTradeSubmitResult | null) => void | Promise<void> }>) {
  const today = workspaceDateInTimezone(accountTimezone);
  const makeRow = (id: number) => ({ date: today, fees: "", id, price: "", quantity: "", side: "buy" as const, time: "" });
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
    const entries = rows.map((row): JournalManualTradeEntry => Object.freeze({ clientRowRef: `workspace-${row.id}`, feesDecimal: row.fees.trim() || null, localDate: row.date, localTime: `${row.time}:00`, normalizedSymbol: symbol.trim().toUpperCase(), priceDecimal: row.price, quantityDecimal: row.quantity, side: row.side, sourceTimezone: accountTimezone, tradeCurrency: accountCurrency }));
    setSaving(true); setError(null);
    try {
      const submission = Object.freeze({ entries, expectedAccountSelectionRef, idempotencyKey: idempotencyKey.current ?? crypto.randomUUID(), tracker: "workspace" as const, workspaceStyle }); idempotencyKey.current = submission.idempotencyKey;
      if (!navigator.onLine) {
        await queueManualTradeSubmission({ offlineScopeRef, submission });
        onSaved?.(null);
      } else {
        const preview = await previewManualTradeOnline(submission);
        setLogicalTradeMerges([]);
        setSubmissionConfirmation({ preview, submission });
      }
    } catch (cause) { setError(cause instanceof ManualTradeNeedsReviewError ? manualTradePreviewMessage(cause.code) : cause instanceof Error ? cause.message : "The trade could not be saved. Your entries are still here."); } finally { setSaving(false); }
  };
  const confirmSubmission = async () => {
    if (!submissionConfirmation) return;
    setSaving(true); setError(null);
    try {
      const result = await commitManualTradeOnline(
        submissionConfirmation.submission,
        submissionConfirmation.preview,
        { logicalTradeMerges },
      );
      await onSaved?.(result);
      setSubmissionConfirmation(null);
    } catch (cause) { setError(cause instanceof ManualTradeNeedsReviewError ? manualTradePreviewMessage(cause.code) : cause instanceof Error ? cause.message : "The trade could not be saved. Your entries are still here."); } finally { setSaving(false); }
  };
  return <Stack sx={{ height: "100%" }}>
      {embedded ? null : <Stack direction="row" sx={{ borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Add trade</Typography>
        <Button onClick={onClose}>Close</Button>
      </Stack>}
      <Stack spacing={1.25} sx={{ p: embedded ? 0 : 2 }}>
        <Stack direction="row" spacing={1}>{fixedSymbol ? <TextField disabled label="Ticker" size="small" sx={{ width: { xs: 150, sm: 180 } }} value={symbol} /> : <TextField label="Ticker" onChange={(event) => { setError(null); setSymbol(event.target.value.toUpperCase()); }} size="small" sx={{ width: { xs: 150, sm: 180 } }} value={symbol} />}<TextField label="Day Trade/Swing" onChange={(event) => { setError(null); setWorkspaceStyle(event.target.value as "day_trade" | "swing"); }} select size="small" sx={{ width: 154 }} value={workspaceStyle}><MenuItem value="day_trade">Day Trade</MenuItem><MenuItem value="swing">Swing</MenuItem></TextField></Stack>
        <Typography color="text.secondary" variant="body2">Times use Eastern Time.</Typography>
        <Typography color="text.secondary" variant="body2">Entering the correct execution time keeps your trades in order. Trade Analyzer uses 1-minute candles, so you can enter the time from the matching chart candle when you do not have the broker timestamp.</Typography>
        <Typography color="text.secondary" variant="body2">Entering multiple trades? <Typography color="primary" component={Link} href="/trade-tracker" sx={{ fontWeight: 750, textDecoration: "none" }} variant="inherit">Use Trade Tracker to review your day.</Typography></Typography>
        {rows.map((row, index) => <Box key={row.id} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontWeight: 750 }} variant="body2">Execution {index + 1}</Typography>
            {rows.length > 1 ? <Button color="inherit" onClick={() => { setError(null); setRows((current) => current.filter((entry) => entry.id !== row.id)); }} size="small">Remove</Button> : null}
          </Box>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "164px 132px 110px 96px 104px 88px" } }}>
            <TextField label="Date" onChange={(event) => update(row.id, "date", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={row.date} />
            <TextField label="Time" onChange={(event) => update(row.id, "time", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="time" value={row.time} />
            <TextField label="Buy/Sell" onChange={(event) => update(row.id, "side", event.target.value)} select size="small" value={row.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
            <TextField label="Shares" onChange={(event) => update(row.id, "quantity", event.target.value)} size="small" value={row.quantity} />
            <TextField label="Price" onChange={(event) => update(row.id, "price", normalizeLeadingDecimal(event.target.value))} size="small" value={row.price} />
            <TextField label="Fee" onChange={(event) => update(row.id, "fees", normalizeLeadingDecimal(event.target.value))} size="small" value={row.fees} />
          </Box>
        </Box>)}
        <Button onClick={() => { setError(null); setRows((current) => [...current, makeRow(Math.max(...current.map((row) => row.id)) + 1)]); }} sx={{ alignSelf: "flex-start" }}>Add execution</Button>
        {error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}
        <Stack direction="row" spacing={1} sx={{ alignSelf: "flex-end" }}><Button disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={() => void save()} variant="contained">{saving ? "Saving…" : "Save"}</Button></Stack>
      </Stack>
      <Dialog fullWidth maxWidth="sm" onClose={saving ? undefined : () => setSubmissionConfirmation(null)} open={submissionConfirmation !== null}>
        <DialogTitle>Confirm trade entries</DialogTitle>
        <DialogContent><Stack spacing={1.5}><Typography>{submissionConfirmation ? workspaceSubmissionSummary(submissionConfirmation.preview) : ""}</Typography>
          {submissionConfirmation ? <ManualTradePostEntryReview analyzerGroupRefs={[]} analyzerUses={null} groups={submissionConfirmation.preview.groups} merges={logicalTradeMerges} onAnalyzerGroupRefsChange={() => undefined} onError={setError} onMergesChange={setLogicalTradeMerges} /> : null}
          {error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}
        </Stack></DialogContent>
        <DialogActions><Button disabled={saving} onClick={() => setSubmissionConfirmation(null)}>Cancel</Button><Button disabled={saving} onClick={() => void confirmSubmission()} variant="contained">{saving ? "Saving..." : "Confirm trades"}</Button></DialogActions>
      </Dialog>
  </Stack>;
}

function WorkspaceExecutionEditForm({
  currentAccountStillMatches,
  execution,
  expectedAccountSelectionRef,
  onDeleted,
  symbol,
}: Readonly<{
  currentAccountStillMatches: () => Promise<boolean>;
  execution: WorkspaceTradeLibraryRow["editableExecutions"][number];
  expectedAccountSelectionRef: string;
  onDeleted: () => void;
  symbol: string;
}>) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => ({
    date: execution.localDate,
    fees: execution.fees ?? "",
    price: execution.price ?? "",
    quantity: execution.quantity,
    side: execution.side,
    time: execution.localTime,
  }));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = <Field extends keyof typeof draft>(field: Field, value: (typeof draft)[Field]) => setDraft((current) => ({ ...current, [field]: value }));

  async function save(): Promise<void> {
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/manual-executions/${execution.editRef}`, {
        body: JSON.stringify({
          expectedAccountSelectionRef,
          feesDecimal: draft.fees.trim() || null,
          idempotencyKey: crypto.randomUUID(),
          localDate: draft.date,
          localTime: draft.time,
          normalizedSymbol: symbol,
          priceDecimal: draft.price,
          quantityDecimal: draft.quantity,
          side: draft.side,
          sourceTimezone: execution.sourceTimezone,
          tradeCurrency: execution.tradeCurrency,
        }),
        headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        method: "POST",
      });
      if (!response.ok) throw new Error("Check the execution details and try again.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The execution could not be updated.");
    } finally { setSaving(false); }
  }

  async function deleteExecution(): Promise<void> {
    if (!execution.deleteRef || !(await currentAccountStillMatches())) return;
    setDeleting(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/manual-executions/${execution.deleteRef}`, {
        body: JSON.stringify({ expectedAccountSelectionRef, idempotencyKey: crypto.randomUUID() }),
        headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        method: "DELETE",
      });
      const result = await response.json().catch(() => null) as Readonly<{ code?: unknown }> | null;
      if (!response.ok) { setError(deleteFailureMessage(result?.code)); return; }
      setDeleteOpen(false);
      onDeleted();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The execution could not be deleted. Refresh the page and try again.");
    } finally { setDeleting(false); }
  }

  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "164px 132px 110px 96px 104px 88px" } }}>
      <TextField label="Date" onChange={(event) => update("date", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.date} />
      <TextField label="Time" onChange={(event) => update("time", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="time" value={draft.time} />
      <TextField label="Buy/Sell" onChange={(event) => update("side", event.target.value as "buy" | "sell")} select size="small" value={draft.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
      <TextField label="Shares" onChange={(event) => update("quantity", event.target.value)} size="small" value={draft.quantity} />
      <TextField label="Price" onChange={(event) => update("price", normalizeLeadingDecimal(event.target.value))} size="small" value={draft.price} />
      <TextField label="Fee" onChange={(event) => update("fees", normalizeLeadingDecimal(event.target.value))} size="small" value={draft.fees} />
    </Box>
    {error ? <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert> : null}
    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 1 }}>
      {execution.deleteRef ? <Button color="error" onClick={() => void currentAccountStillMatches().then((matches) => { if (matches) setDeleteOpen(true); })} variant="outlined">Delete execution</Button> : null}
      <Button disabled={saving} onClick={() => void save()} variant="contained">{saving ? "Saving..." : "Save changes"}</Button>
    </Stack>
    <Dialog fullWidth maxWidth="sm" onClose={() => { if (!deleting) setDeleteOpen(false); }} open={deleteOpen}>
      <DialogTitle>Delete this execution?</DialogTitle>
      <DialogContent><Typography>This may change whether the position is open or closed.</Typography></DialogContent>
      <DialogActions><Button disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" disabled={deleting} onClick={() => void deleteExecution()} variant="contained">{deleting ? "Deleting..." : "Delete execution"}</Button></DialogActions>
    </Dialog>
  </Box>;
}

export function WorkspaceTradeDrawer({ accountCurrency, accountTimezone, addOpen, addTradeOpen, expectedAccountSelectionRef, offlineScopeRef, onAddTradeSaved, onClose }: Readonly<{ accountCurrency: string; accountTimezone: string; addOpen?: boolean; addTradeOpen?: boolean; currentAccountStillMatches?: () => Promise<boolean>; detail?: unknown; expectedAccountSelectionRef: string; offlineScopeRef: string; onAddTradeSaved?: () => void; onClose: () => void; startingTab?: number }>) {
  const tradeEntryOpen = addOpen ?? addTradeOpen ?? false;
  const [savedTrades, setSavedTrades] = useState<readonly WorkspaceTradeLibraryRow[]>([]);
  const [savedReviewComplete, setSavedReviewComplete] = useState(false);
  const [savedReviewError, setSavedReviewError] = useState<string | null>(null);
  const [analyzerUses, setAnalyzerUses] = useState<Readonly<{
    enabled: boolean; dailyAvailable: number; periodAvailable: number; selectableAvailable: number; daysUntilReset: number;
  }> | null>(null);
  const [analyzerUsesStatus, setAnalyzerUsesStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);
  const [analyzerSuccess, setAnalyzerSuccess] = useState<string | null>(null);
  const [analyzerSelection, setAnalyzerSelection] = useState<readonly string[]>([]);
  const [expandedJournalTradeId, setExpandedJournalTradeId] = useState<string | null>(null);
  const [sendingAnalyses, setSendingAnalyses] = useState(false);
  const [journalSaving, setJournalSaving] = useState(false);
  const [discardJournalOpen, setDiscardJournalOpen] = useState(false);
  const journalDirtyRef = useRef(false);
  const pendingReviewActionRef = useRef<(() => void) | null>(null);
  const analyzerUsesRequestRef = useRef(0);
  const handleJournalDirtyChange = useCallback((dirty: boolean) => {
    journalDirtyRef.current = dirty;
  }, []);
  const handleJournalSavingChange = useCallback((saving: boolean) => {
    setJournalSaving(saving);
  }, []);
  const loadAnalyzerUses = useCallback(async () => {
    const requestNumber = analyzerUsesRequestRef.current + 1;
    analyzerUsesRequestRef.current = requestNumber;
    setAnalyzerUsesStatus("loading");
    try {
      const response = await fetch("/api/platform/daily-trade-analyzer/allowance", { cache: "no-store" });
      const result = await response.json() as { availability?: typeof analyzerUses };
      if (analyzerUsesRequestRef.current === requestNumber) {
        const availability = response.ok ? result.availability ?? null : null;
        setAnalyzerUses(availability);
        setAnalyzerUsesStatus(response.ok && availability ? "ready" : "unavailable");
      }
    } catch {
      if (analyzerUsesRequestRef.current === requestNumber) {
        setAnalyzerUses(null);
        setAnalyzerUsesStatus("unavailable");
      }
    }
  }, []);
  const savedReviewTargets: readonly TradeExplorerReviewTarget[] = useMemo(() =>
    savedTrades.map((trade) => Object.freeze({
      closeLocalDate: trade.exitDate,
      closedAtUtc: null,
      direction: trade.direction,
      displayedSymbol: trade.symbol,
      roundTripId: trade.roundTripId,
    })), [savedTrades]);
  useEffect(() => {
    if (!tradeEntryOpen) {
      setAnalyzerError(null);
      setAnalyzerSuccess(null);
      setAnalyzerSelection([]);
      setExpandedJournalTradeId(null);
      setSavedTrades([]);
      setSavedReviewComplete(false);
      setSavedReviewError(null);
      return;
    }
    void loadAnalyzerUses();
  }, [loadAnalyzerUses, tradeEntryOpen]);
  if (!tradeEntryOpen) return null;
  const requestReviewAction = (action: () => void) => {
    if (journalSaving) return;
    if (!journalDirtyRef.current) {
      action();
      return;
    }
    pendingReviewActionRef.current = action;
    setDiscardJournalOpen(true);
  };
  const closeTradeDrawer = () => {
    if (sendingAnalyses) return;
    requestReviewAction(onClose);
  };
  const handleNewTradeSaved = async (result: ManualTradeSubmitResult | null) => {
    if (result) {
      const responseTrades = result.savedTrades as readonly WorkspaceTradeLibraryRow[];
      const savedRoundTripIds = new Set(responseTrades.flatMap((trade) =>
        trade.underlyingRoundTripIds.length > 0 ? trade.underlyingRoundTripIds : [trade.roundTripId]));
      const affectedDates = [...result.affectedDates].sort();
      const refreshed = affectedDates.length > 0
        ? await loadWorkspaceTradeLibraryPage({
          afterCursor: null,
          endDate: affectedDates.at(-1) ?? null,
          filter: "all",
          followDashboardPeriod: false,
          group: "none",
          searchTicker: "",
          sort: "newest",
          startDate: affectedDates[0] ?? null,
        }).catch(() => null)
        : null;
      const refreshedSavedTrades = refreshed?.ok &&
        refreshed.accountSelectionRef === expectedAccountSelectionRef
        ? refreshed.model.rows.filter((trade) => trade.underlyingRoundTripIds.some((roundTripId) =>
          savedRoundTripIds.has(roundTripId)))
        : [];
      const nextSavedTrades = Object.freeze([
        ...refreshedSavedTrades,
        ...responseTrades.filter((responseTrade) => !refreshedSavedTrades.some((refreshedTrade) =>
          refreshedTrade.underlyingRoundTripIds.some((roundTripId) =>
            responseTrade.underlyingRoundTripIds.includes(roundTripId)))),
      ].sort((left, right) =>
        `${left.entryDate}T${left.entryTime}`.localeCompare(`${right.entryDate}T${right.entryTime}`) ||
        left.roundTripId.localeCompare(right.roundTripId)));
      setSavedTrades(nextSavedTrades);
      setSavedReviewComplete(true);
      setSavedReviewError(nextSavedTrades.length === 0
        ? "The trade was saved, but its review could not be loaded. Close and reopen the trade to review it."
        : null);
      setAnalyzerSelection([]);
      setExpandedJournalTradeId(null);
      await loadAnalyzerUses();
      onAddTradeSaved?.();
      return;
    }
    onAddTradeSaved?.();
    onClose();
  };
  const toggleAnalysis = (trade: WorkspaceTradeLibraryRow, checked: boolean) => {
    if (checked && (!analyzerUses || analyzerUses.selectableAvailable <= analyzerSelection.length)) {
      setAnalyzerError("You have used all available Trade Analyzer uses.");
      return;
    }
    setAnalyzerError(null);
    setAnalyzerSuccess(null);
    setAnalyzerSelection((current) => checked
      ? [...current, trade.roundTripId]
      : current.filter((roundTripId) => roundTripId !== trade.roundTripId));
  };
  const sendSelectedAnalyses = async () => {
    if (analyzerSelection.length === 0 || sendingAnalyses) return;
    const selectedCount = analyzerSelection.length;
    setSendingAnalyses(true);
    setAnalyzerError(null);
    setAnalyzerSuccess(null);
    try {
      for (const roundTripId of analyzerSelection) {
        const response = await fetch("/api/platform/trade-analyzer/trade/request", {
          body: JSON.stringify({ roundTripId }),
          headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
          method: "POST",
        });
        const result = await response.json().catch(() => null) as Readonly<{
          availability?: typeof analyzerUses;
          outcome?: string;
        }> | null;
        if (!response.ok || (result?.outcome !== "queued" && result?.outcome !== "already_requested")) {
          setAnalyzerError("The selected trade could not be sent to Trade Analyzer. Try again.");
          return;
        }
        setAnalyzerSelection((current) => current.filter((id) => id !== roundTripId));
        setAnalyzerUses(result.availability ?? null);
      }
      setAnalyzerSuccess(selectedCount === 1
        ? "Trade sent to Trade Analyzer."
        : "Selected trades sent to Trade Analyzer.");
    } catch {
      setAnalyzerError("The selected trade could not be sent to Trade Analyzer. Try again.");
    } finally {
      setSendingAnalyses(false);
    }
  };
  return <Drawer anchor="right" onClose={closeTradeDrawer} open slotProps={{ paper: { sx: { width: { xs: "100vw", md: 880 } } } }}>
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", p: 2 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography component="h2" variant="h6">{savedReviewComplete ? "Review saved trades" : "Add trade"}</Typography>
          <Button disabled={journalSaving || sendingAnalyses} onClick={closeTradeDrawer}>Close</Button>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
        {!savedReviewComplete ? <AddTradePanel accountCurrency={accountCurrency} accountTimezone={accountTimezone} embedded expectedAccountSelectionRef={expectedAccountSelectionRef} offlineScopeRef={offlineScopeRef} onClose={onClose} onSaved={handleNewTradeSaved} /> : <Stack spacing={1.5}>
          {savedReviewError ? <Alert severity="warning">{savedReviewError}</Alert> : null}
          {savedTrades.map((trade) => {
            const outcomeColor = financialOutcomeColor(trade.gainLossDecimal);
            const outcomeTone = trade.status === "Open" || trade.status === "Open swing"
              ? "warning"
              : outcomeColor === "success.main" ? "success" : outcomeColor === "error.main" ? "error" : null;
            const analyzable = analyzerUses?.enabled === true &&
              trade.status === "Closed" &&
              trade.entryDate === trade.exitDate;
            const journalOpen = expandedJournalTradeId === trade.roundTripId;
            return <Box key={trade.roundTripId} sx={(theme) => ({
              bgcolor: theme.palette.mode === "dark" && outcomeTone
                ? alpha(theme.palette[outcomeTone].main, 0.08)
                : "background.paper",
              border: 1,
              borderColor: theme.palette.mode === "dark" || !outcomeTone ? "divider" : `${outcomeTone}.main`,
              borderRadius: 2,
              overflow: "hidden",
            })}>
              <Box sx={(theme) => ({
                bgcolor: theme.palette.mode === "dark" && outcomeTone
                  ? alpha(theme.palette[outcomeTone].main, 0.18)
                  : outcomeTone ? `${outcomeTone}.main` : "action.hover",
                color: outcomeTone ? "common.white" : "text.primary",
                p: 1.5,
              })}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                  <Box><Typography sx={{ fontWeight: 850 }}>{trade.symbol} · {trade.direction === "long" ? "Long" : "Short"}</Typography><Typography color="inherit" variant="body2">{trade.executionCount} executions · {formatJournalAnalyticsDecimal(trade.entryQuantityDecimal)} shares</Typography></Box>
                  <Typography color="inherit" sx={{ fontWeight: 850 }}>{tradeMoney(trade)}</Typography>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mt: 1 }}>
                  {analyzable ? <FormControlLabel control={<Checkbox checked={analyzerSelection.includes(trade.roundTripId)} onChange={(event) => toggleAnalysis(trade, event.target.checked)} sx={{ color: "common.white", "&.Mui-checked": { color: "common.white" } }} />} label="Analyze" sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: "0.875rem", fontWeight: 800 } }} /> : <Box />}
                  <Button color="inherit" disabled={journalSaving} endIcon={journalOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />} onClick={() => requestReviewAction(() => setExpandedJournalTradeId((current) => current === trade.roundTripId ? null : trade.roundTripId))} sx={{ color: "inherit", fontWeight: 800 }}>Journal</Button>
                </Stack>
              </Box>
              <Collapse in={journalOpen} timeout="auto" unmountOnExit><Box sx={{ borderTop: 1, borderColor: "divider" }}><TradeExplorerReviewEditor embedded expectedAccountSelectionRef={expectedAccountSelectionRef} onClose={() => setExpandedJournalTradeId(null)} onDirtyChange={handleJournalDirtyChange} onSavingChange={handleJournalSavingChange} onSelectTrade={() => undefined} open selectedRoundTripId={trade.roundTripId} showTagSelectionCount={false} showTradeNavigation={false} trades={savedReviewTargets} /></Box></Collapse>
            </Box>;
          })}
          {analyzerError ? <Typography color="error.main" variant="body2">{analyzerError}</Typography> : null}
          {analyzerSuccess ? <Alert severity="success">{analyzerSuccess}</Alert> : null}
          <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
            <Typography sx={{ fontWeight: 800 }} variant="body2">Analyzer uses</Typography>
            {analyzerUsesStatus === "loading" ? <Typography color="text.secondary" variant="body2">Loading…</Typography> : null}
            {analyzerUsesStatus === "ready" && analyzerUses?.enabled ? <>
              <Typography color="text.secondary" variant="body2">{Math.max(0, analyzerUses.dailyAvailable - analyzerSelection.length)} available today</Typography>
              <Typography color="text.secondary" variant="body2">{Math.max(0, analyzerUses.periodAvailable - analyzerSelection.length)} available in 30 days · resets in {analyzerUses.daysUntilReset} days</Typography>
            </> : null}
            {analyzerUsesStatus === "unavailable" ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography color="error.main" variant="body2">Analyzer usage could not be loaded.</Typography>
              <Button onClick={() => void loadAnalyzerUses()} size="small">Try again</Button>
            </Stack> : null}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}><Button disabled={journalSaving || sendingAnalyses} onClick={() => requestReviewAction(() => { setSavedTrades([]); setSavedReviewComplete(false); setSavedReviewError(null); })} variant="outlined">Add another trade</Button>{analyzerUses?.enabled && savedTrades.length > 0 ? <Button disabled={analyzerSelection.length === 0 || sendingAnalyses} onClick={() => void sendSelectedAnalyses()} variant="contained">{sendingAnalyses ? "Sending…" : "Send selected analyses"}</Button> : null}</Stack>
        </Stack>}
      </Box>
    </Stack>
    <Dialog onClose={() => { pendingReviewActionRef.current = null; setDiscardJournalOpen(false); }} open={discardJournalOpen}>
      <DialogTitle>Discard unsaved journal changes?</DialogTitle>
      <DialogContent><Typography>Your unsaved note, tags, or rule changes will be lost.</Typography></DialogContent>
      <DialogActions><Button onClick={() => { pendingReviewActionRef.current = null; setDiscardJournalOpen(false); }}>Keep editing</Button><Button color="error" onClick={() => {
        journalDirtyRef.current = false;
        setDiscardJournalOpen(false);
        const action = pendingReviewActionRef.current;
        pendingReviewActionRef.current = null;
        action?.();
      }}>Discard changes</Button></DialogActions>
    </Dialog>
  </Drawer>;
}

export function WorkspaceTradeLibrary({ accountCurrency, accountTimezone, addTradeOpen, customEndDate, customStartDate, expectedAccountSelectionRef, offlineScopeRef, onAddTradeClose, periodEndDate, periodStartDate, trades }: Readonly<{ accountCurrency: string; accountTimezone: string; addTradeOpen: boolean; customEndDate: string | null; customStartDate: string | null; expectedAccountSelectionRef: string; offlineScopeRef: string; onAddTradeClose: () => void; periodEndDate: string | null; periodStartDate: string | null; trades: WorkspaceTradeLibraryModel }>) {
  const router = useRouter(); const { openChart } = useDashboardChart(); const [model, setModel] = useState(trades); const [detailsTrade, setDetailsTrade] = useState<WorkspaceTradeLibraryRow | null>(null); const [detailsTab, setDetailsTab] = useState<"details" | "analyzer">("details"); const [atomicEditTrade, setAtomicEditTrade] = useState<WorkspaceTradeLibraryRow | null>(null); const [atomicEditTab, setAtomicEditTab] = useState<"trade" | "journal">("trade"); const [ticker, setTicker] = useState(trades.query.searchTicker); const [filter, setFilter] = useState<TradeStateFilter>(trades.query.filter); const [startDate, setStartDate] = useState(customStartDate ?? ""); const [endDate, setEndDate] = useState(customEndDate ?? ""); const [sort, setSort] = useState<TradeSort>(trades.query.sort); const [group, setGroup] = useState<TradeGroup>(trades.query.group); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [tableDelete, setTableDelete] = useState<Readonly<{ deleteRef: string; executionCount: number; roundTripId: string; symbol: string }> | null>(null); const [deletingTableExecution, setDeletingTableExecution] = useState(false); const [tableDeleteError, setTableDeleteError] = useState<string | null>(null);
  useEffect(() => { setModel(trades); setTicker(trades.query.searchTicker); setFilter(trades.query.filter); setStartDate(customStartDate ?? ""); setEndDate(customEndDate ?? ""); setSort(trades.query.sort); setGroup(trades.query.group); }, [customEndDate, customStartDate, trades]);
  const query = (afterCursor: string | null) => { const dates = startDate && endDate ? { endDate, startDate } : { endDate: periodEndDate, startDate: periodStartDate }; return { afterCursor, ...dates, filter, followDashboardPeriod: false, group, searchTicker: ticker, sort } as const; };
  const currentAccountStillMatches = async () => { const result = await loadWorkspaceTradeLibraryPage(query(null)); if (!result.ok || result.accountSelectionRef !== expectedAccountSelectionRef) { setAtomicEditTrade(null); setDetailsTrade(null); setTableDelete(null); router.refresh(); return false; } return true; };
  const load = async (afterCursor: string | null, append: boolean) => { setLoading(true); const result = await loadWorkspaceTradeLibraryPage(query(afterCursor)); if (result.ok) { if (result.accountSelectionRef !== expectedAccountSelectionRef) { setAtomicEditTrade(null); setDetailsTrade(null); setTableDelete(null); router.refresh(); } else { setModel((current) => append ? { ...result.model, rows: [...current.rows, ...result.model.rows] } : result.model); setError(null); } } else setError(result.message); setLoading(false); };
  useEffect(() => { const handle = window.setTimeout(() => { void load(null, false); }, 180); return () => window.clearTimeout(handle); }, [ticker, filter, startDate, endDate, sort, group, periodEndDate, periodStartDate]);
  const grouped = useMemo(() => model.rows.map((row, index) => ({ row, heading: group === "none" ? null : index === 0 || (group === "day" ? model.rows[index - 1]?.date !== row.date : model.rows[index - 1]?.symbol !== row.symbol) ? group === "day" ? shortDate(row.date) : row.symbol : null })), [group, model.rows]);
  const activeFilterCount = Number(Boolean(ticker.trim())) + Number(filter !== "all") + Number(Boolean(startDate)) + Number(Boolean(endDate)) + Number(sort !== "newest") + Number(group !== "none");
  const prepareTableDelete = async (row: WorkspaceTradeLibraryRow, deleteRef: string) => { if (!(await currentAccountStillMatches())) return; setTableDelete({ deleteRef, executionCount: row.executionCount, roundTripId: row.roundTripId, symbol: row.symbol }); setTableDeleteError(null); };
  const closeAtomicEdit = () => setAtomicEditTrade(null);
  const actionButtons = (row: WorkspaceTradeLibraryRow) => <Stack direction="row" spacing={0.25}><ActionButton label={`Open chart for ${row.symbol}`} onClick={() => openChart(row.symbol)}><CandlestickChartIcon fontSize="small" /></ActionButton><ActionButton label={`Open details for ${row.symbol}`} onClick={() => { setDetailsTab("details"); setDetailsTrade(row); }}><DescriptionOutlinedIcon fontSize="small" /></ActionButton><ActionButton label="Edit trade" onClick={() => { setAtomicEditTab("trade"); setAtomicEditTrade(row); }}><EditRoundedIcon fontSize="small" /></ActionButton>{row.tradeDeleteRef ? <ActionButton desktopOnly label="Delete trade" onClick={() => void prepareTableDelete(row, row.tradeDeleteRef!)}><DeleteOutlineRoundedIcon fontSize="small" /></ActionButton> : null}<ActionButton color={row.hasCurrentAnalyzerResult ? "warning.main" : undefined} label={row.hasCurrentAnalyzerResult ? "Open saved Trade Analyzer" : "Open Trade Analyzer"} onClick={() => { setDetailsTab("analyzer"); setDetailsTrade(row); }}><InsightsRoundedIcon fontSize="small" /></ActionButton></Stack>;
  const deleteFromTable = async () => { if (!tableDelete || !(await currentAccountStillMatches())) return; setDeletingTableExecution(true); setTableDeleteError(null); try { const response = await fetch(`/api/platform/journal/workspace-trades/${tableDelete.deleteRef}`, { body: JSON.stringify({ expectedAccountSelectionRef, idempotencyKey: crypto.randomUUID(), roundTripId: tableDelete.roundTripId }), headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" }, method: "DELETE" }); const result = await response.json().catch(() => null) as Readonly<{ code?: unknown }> | null; if (!response.ok) { setTableDeleteError(deleteFailureMessage(result?.code)); return; } setDetailsTrade(null); setAtomicEditTrade(null); setTableDelete(null); window.location.reload(); } catch { setTableDeleteError("The trade could not be deleted. Refresh the page and try again."); } finally { setDeletingTableExecution(false); } };
  const emptyState = model.projectionState === "unavailable"
    ? "Your existing trades are not available in Workspace yet."
    : activeFilterCount > 0 ? "No trades match these filters."
      : "No trades recorded yet.";
  const desktopColumns = "minmax(96px, 1fr) minmax(64px, .75fr) minmax(52px, .6fr) minmax(82px, .8fr) minmax(58px, .65fr) minmax(62px, .7fr) minmax(76px, .8fr) minmax(76px, .8fr) minmax(92px, 1fr) minmax(64px, .7fr) minmax(88px, .9fr) 208px";
  const changeSort = (column: TradeTableColumn) => setSort((current) => current === column.ascending ? column.descending : column.ascending);
  return <>
    {error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, mt: 1, overflow: "hidden" }}>
      <Box sx={{ bgcolor: "action.hover", display: { xs: "none", md: "grid" }, gap: 1, gridTemplateColumns: desktopColumns, px: 1, py: 0.75 }}>
        {TRADE_TABLE_COLUMNS.map((column) => <TableSortLabel active={sort === column.ascending || sort === column.descending} direction={sort === column.ascending ? "asc" : "desc"} hideSortIcon={false} key={column.label} onClick={() => changeSort(column)} sx={{ fontSize: "0.9rem", fontWeight: 850, justifyContent: "flex-start", textAlign: "left" }}>{column.label}</TableSortLabel>)}
        <Typography sx={{ fontSize: "0.9rem", fontWeight: 850 }} variant="caption">Actions</Typography>
      </Box>
      {model.projectionState !== "ready" || model.rows.length === 0 ? <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">{emptyState}</Typography> : grouped.map(({ row, heading }) => <Box key={row.roundTripId}>
        {heading ? <Typography sx={{ bgcolor: "action.hover", fontWeight: 800, px: 1.5, py: 0.5 }} variant="caption">{heading}</Typography> : null}
        <Box sx={{ borderTop: 1, borderColor: "divider" }}>
          <Box sx={{ alignItems: "center", display: { xs: "none", md: "grid" }, gap: 1, gridTemplateColumns: desktopColumns, minHeight: 46, px: 1, py: 0.25 }}>
            <Typography variant="body2">{shortDate(row.date)}</Typography><Typography sx={{ fontWeight: 800 }} variant="body2">{row.symbol}</Typography><Typography variant="body2">{row.direction === "long" ? "Long" : "Short"}</Typography><Typography variant="body2">{row.status}</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(row.entryQuantityDecimal)}</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(row.positionDecimal)}</Typography><Typography variant="body2">{row.entryPriceDecimal ? formatJournalAnalyticsMoney(row.entryPriceDecimal, row.tradeCurrency) : "—"}</Typography><Typography variant="body2">{row.exitPriceDecimal ? formatJournalAnalyticsMoney(row.exitPriceDecimal, row.tradeCurrency) : "—"}</Typography><Typography variant="body2">{row.entryValueDecimal ? formatJournalAnalyticsMoney(row.entryValueDecimal, row.tradeCurrency) : "—"}</Typography><Typography variant="body2">{row.holdDurationSeconds === null ? "N/A" : formatJournalAnalyticsDuration(row.holdDurationSeconds * 1000)}</Typography><Typography color={financialOutcomeColor(row.gainLossDecimal)} sx={{ fontWeight: 800 }} variant="body2">{tradeMoney(row)}</Typography>{actionButtons(row)}
          </Box>
          <Box sx={{ display: { md: "none" }, p: 1.25 }}>
            <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}><Box><Typography sx={{ fontWeight: 800 }}>{row.symbol}</Typography><Typography variant="caption">{shortDate(row.date)} · {row.direction === "long" ? "Long" : "Short"} · {row.status}</Typography></Box><Typography color={financialOutcomeColor(row.gainLossDecimal)} sx={{ fontWeight: 800 }}>{tradeMoney(row)}</Typography></Stack>
            <Stack spacing={0.25}><Typography variant="caption">Shares {formatJournalAnalyticsDecimal(row.entryQuantityDecimal)} · POS {formatJournalAnalyticsDecimal(row.positionDecimal)}</Typography><Typography variant="caption">Entry {row.entryPriceDecimal ? formatJournalAnalyticsMoney(row.entryPriceDecimal, row.tradeCurrency) : "—"} · Exit {row.exitPriceDecimal ? formatJournalAnalyticsMoney(row.exitPriceDecimal, row.tradeCurrency) : "—"}</Typography></Stack>{actionButtons(row)}
          </Box>
        </Box>
      </Box>)}
    </Box>
    {model.continuationCursor ? <Stack sx={{ alignItems: "center", mt: 1 }}><Button disabled={loading} onClick={() => void load(model.continuationCursor, true)} variant="outlined">{loading ? "Loading…" : "Load more"}</Button></Stack> : null}
    <TradeDetailsDrawer analyzer={detailsTrade ? { currency: detailsTrade.tradeCurrency, direction: detailsTrade.direction, executionCount: detailsTrade.executionCount, gainLossDecimal: detailsTrade.gainLossDecimal, symbol: detailsTrade.symbol, timezone: accountTimezone } : null} initialTab={detailsTab} onClose={() => setDetailsTrade(null)} open={detailsTrade !== null} roundTripId={detailsTrade?.roundTripId ?? null} />
    <WorkspaceTradeDrawer accountCurrency={accountCurrency} accountTimezone={accountTimezone} addTradeOpen={addTradeOpen} expectedAccountSelectionRef={expectedAccountSelectionRef} offlineScopeRef={offlineScopeRef} onClose={() => { onAddTradeClose(); window.location.reload(); }} />
    <WorkspaceAtomicTradeEditDrawer expectedAccountSelectionRef={expectedAccountSelectionRef} journalTarget={atomicEditTrade ? { closeLocalDate: atomicEditTrade.exitDate, closedAtUtc: null, direction: atomicEditTrade.direction, displayedSymbol: atomicEditTrade.symbol, roundTripId: atomicEditTrade.roundTripId } : null} onClose={closeAtomicEdit} onSaved={() => { closeAtomicEdit(); router.refresh(); }} open={atomicEditTrade !== null} roundTripId={atomicEditTrade?.roundTripId ?? null} startingTab={atomicEditTab} />
    <Dialog fullWidth maxWidth="xs" onClose={() => { if (!deletingTableExecution) setTableDelete(null); }} open={tableDelete !== null}><DialogTitle>Delete this trade?</DialogTitle><DialogContent><Typography>This deletes the whole {tableDelete?.symbol} trade and all {tableDelete?.executionCount} of its executions. The original Journal records are kept in history.</Typography>{tableDeleteError ? <Alert severity="error" sx={{ mt: 1 }}>{tableDeleteError}</Alert> : null}</DialogContent><DialogActions><Button disabled={deletingTableExecution} onClick={() => setTableDelete(null)}>Cancel</Button><Button color="error" disabled={deletingTableExecution} onClick={() => void deleteFromTable()} variant="contained">{deletingTableExecution ? "Deleting…" : "Delete trade"}</Button></DialogActions></Dialog>
  </>;
}

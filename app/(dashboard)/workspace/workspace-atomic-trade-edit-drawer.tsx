"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CallMergeRoundedIcon from "@mui/icons-material/CallMergeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Alert, Box, Button, Checkbox, Drawer, FormControlLabel, IconButton, MenuItem, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

import { TradeExplorerReviewEditor } from "../analytics/trade-explorer/trade-review-editor";
import type { TradeExplorerReviewTarget } from "../analytics/trade-explorer/trade-review-model";

type TradeStyle = "day_trade" | "swing" | "other";
type Side = "buy" | "sell";
type EditTab = "trade" | "journal";
type MergeCandidate = Readonly<{
  candidateRef: string; symbol: string; tradeStyle: "day" | "swing";
  openedAtUtc: string; closedAtUtc: string; memberCount: number;
}>;
type MergeView = Readonly<{
  revision: number; isMerged: boolean; current: MergeCandidate;
  sameDay: readonly MergeCandidate[]; otherDates: readonly MergeCandidate[];
}>;
type Execution = Readonly<{
  editRef: string; localDate: string; localTime: string; sourceTimezone: string;
  normalizedSymbol: string; tradeCurrency: string; side: Side; quantityDecimal: string;
  priceDecimal: string | null; feesDecimal: string | null;
  manualFeeInputState: "not_entered" | "entered" | null;
}>;
type Snapshot = Readonly<{
  executionCount: number; executions: readonly Execution[]; snapshotRef: string;
  tradeCurrency: string; tradeStyle: TradeStyle | null;
}>;
type DraftRow = {
  kind: "existing" | "new"; executionRef?: string; clientRowRef: string; removed: boolean;
  localDate: string; localTime: string; sourceTimezone: string; normalizedSymbol: string;
  tradeCurrency: string; side: Side; quantityDecimal: string; priceDecimal: string; feesDecimal: string;
};

function canonicalTime(value: string): string { return value.length === 5 ? `${value}:00` : value; }
function failureMessage(code: unknown): string {
  if (code === "TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT") return "This trade changed before it could be saved. Your entries are still here.";
  if (code === "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION") return "This trade needs review before it can be changed. Your entries are still here.";
  return "The trade could not be saved. Your entries are still here.";
}
function rowFromExecution(execution: Execution, index: number): DraftRow {
  return { kind: "existing", executionRef: execution.editRef, clientRowRef: `trade-row-${index + 1}`,
    removed: false, localDate: execution.localDate, localTime: execution.localTime,
    sourceTimezone: execution.sourceTimezone, normalizedSymbol: execution.normalizedSymbol,
    tradeCurrency: execution.tradeCurrency, side: execution.side, quantityDecimal: execution.quantityDecimal,
    priceDecimal: execution.priceDecimal === null
      ? ""
      : formatJournalAnalyticsDecimal(execution.priceDecimal, 2, true), feesDecimal: execution.manualFeeInputState === "not_entered" ? "" : execution.feesDecimal ?? "" };
}

export function WorkspaceAtomicTradeEditDrawer({ expectedAccountSelectionRef, journalTarget, open, roundTripId, onClose, onSaved, startingTab = "trade" }: Readonly<{
  expectedAccountSelectionRef: string;
  journalTarget: TradeExplorerReviewTarget | null;
  open: boolean;
  roundTripId: string | null;
  onClose: () => void;
  onSaved?: () => void;
  startingTab?: EditTab;
}>) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [tradeStyle, setTradeStyle] = useState<TradeStyle | null>(null);
  const [preview, setPreview] = useState<Readonly<{ previewRef: string; consequenceCopy: string }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [tab, setTab] = useState<EditTab>(startingTab);
  const [mergeView, setMergeView] = useState<MergeView | null>(null);
  const [selectedMergeRefs, setSelectedMergeRefs] = useState<readonly string[]>([]);
  const [mergeStyle, setMergeStyle] = useState<"day" | "swing">("day");
  const nextRow = useRef(100);

  useEffect(() => {
    if (!open || !roundTripId) return;
    let active = true;
    setSnapshot(null); setRows([]); setTradeStyle(null); setPreview(null); setError(null); setTab(startingTab);
    setMergeView(null); setSelectedMergeRefs([]);
    void fetch(`/api/platform/journal/workspace-trades/${roundTripId}/edit`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { snapshot?: Snapshot; code?: unknown };
        if (!response.ok || !result.snapshot) throw new Error(failureMessage(result.code));
        return result.snapshot;
      })
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        setRows(result.executions.map(rowFromExecution));
        setTradeStyle(result.tradeStyle);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : failureMessage(null)); });
    return () => { active = false; };
  }, [open, roundTripId, startingTab]);

  const activeRows = useMemo(() => rows.filter((row) => !row.removed), [rows]);
  const hasUnsavedExecutionChanges = useMemo(() => {
    if (!snapshot || rows.length !== snapshot.executions.length || tradeStyle !== snapshot.tradeStyle) return true;
    return rows.some((row, index) => {
      const saved = snapshot.executions[index];
      const baseline = saved ? rowFromExecution(saved, index) : null;
      return !saved || row.kind !== "existing" || row.removed || row.executionRef !== saved.editRef ||
        !baseline || row.localDate !== baseline.localDate ||
        canonicalTime(row.localTime) !== canonicalTime(baseline.localTime) ||
        row.sourceTimezone !== baseline.sourceTimezone ||
        row.normalizedSymbol !== baseline.normalizedSymbol ||
        row.tradeCurrency !== baseline.tradeCurrency || row.side !== baseline.side ||
        row.quantityDecimal !== baseline.quantityDecimal ||
        row.priceDecimal !== baseline.priceDecimal || row.feesDecimal !== baseline.feesDecimal;
    });
  }, [rows, snapshot, tradeStyle]);
  const update = <K extends keyof DraftRow>(clientRowRef: string, key: K, value: DraftRow[K]) => {
    setPreview(null);
    setRows((current) => current.map((row) => row.clientRowRef === clientRowRef ? { ...row, [key]: value } : row));
  };
  const payload = () => ({
    snapshotRef: snapshot?.snapshotRef,
    tradeStyle,
    rows: rows.map((row) => row.kind === "existing" ? {
      kind: "existing", executionRef: row.executionRef, removed: row.removed,
      ...(row.removed ? {} : { entry: { clientRowRef: row.clientRowRef, localDate: row.localDate,
        localTime: canonicalTime(row.localTime), sourceTimezone: row.sourceTimezone,
        normalizedSymbol: row.normalizedSymbol, tradeCurrency: row.tradeCurrency, side: row.side,
        quantityDecimal: row.quantityDecimal, priceDecimal: row.priceDecimal, feesDecimal: row.feesDecimal } }),
    } : { kind: "new", entry: { clientRowRef: row.clientRowRef, localDate: row.localDate,
      localTime: canonicalTime(row.localTime), sourceTimezone: row.sourceTimezone,
      normalizedSymbol: row.normalizedSymbol, tradeCurrency: row.tradeCurrency, side: row.side,
      quantityDecimal: row.quantityDecimal, priceDecimal: row.priceDecimal, feesDecimal: row.feesDecimal } }),
  });
  const requestPreview = async () => {
    if (!roundTripId || !snapshot) return;
    setWorking(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/workspace-trades/${roundTripId}/edit/preview`, {
        method: "POST", headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" }, body: JSON.stringify(payload()),
      });
      const result = await response.json() as { preview?: { previewRef: string; consequenceCopy: string }; code?: unknown };
      if (!response.ok || !result.preview) { setError(failureMessage(result.code)); return; }
      setPreview(result.preview);
    } catch { setError(failureMessage(null)); } finally { setWorking(false); }
  };
  const commit = async () => {
    if (!roundTripId || !preview) return;
    setWorking(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/workspace-trades/${roundTripId}/edit/commit`, {
        method: "POST", headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify({ ...payload(), previewRef: preview.previewRef, idempotencyKey: crypto.randomUUID() }),
      });
      const result = await response.json() as { code?: unknown };
      if (!response.ok) { setError(failureMessage(result.code)); return; }
      window.dispatchEvent(new CustomEvent("traderlink:workspace-trade-edited"));
      onSaved?.(); onClose();
    } catch { setError(failureMessage(null)); } finally { setWorking(false); }
  };
  const addExecution = () => {
    const basis = activeRows[0]; if (!basis) return;
    const id = nextRow.current++;
    setPreview(null);
    setRows((current) => [...current, { ...basis, kind: "new", executionRef: undefined,
      clientRowRef: `trade-row-${id}`, removed: false }]);
  };
  const openMerge = async () => {
    if (!roundTripId) return;
    if (hasUnsavedExecutionChanges) {
      setError("Save or discard the execution changes before merging trades.");
      return;
    }
    setWorking(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/workspace-trades/${roundTripId}/edit/merge`, { cache: "no-store" });
      const result = await response.json() as { view?: MergeView };
      if (!response.ok || !result.view) throw new Error("The merge choices changed. Review the current trades again.");
      setMergeView(result.view); setSelectedMergeRefs([]);
      setMergeStyle(result.view.current.tradeStyle);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The merge choices could not be loaded.");
    } finally { setWorking(false); }
  };
  const saveMerge = async (action: "merge" | "unmerge") => {
    if (!roundTripId || !mergeView) return;
    setWorking(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/workspace-trades/${roundTripId}/edit/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify(action === "merge"
          ? { action, expectedCurrentRevision: mergeView.revision, candidateRefs: selectedMergeRefs, tradeStyle: mergeStyle }
          : { action, expectedCurrentRevision: mergeView.revision }),
      });
      const result = await response.json() as { view?: MergeView; code?: string };
      if (!response.ok || !result.view) {
        throw new Error(result.code === "TRADERLINK_LOGICAL_TRADE_INVALID"
          ? "Selected trades must be compatible and consecutive."
          : "The trades changed. Review the current trades again.");
      }
      window.dispatchEvent(new CustomEvent("traderlink:workspace-trade-edited"));
      onSaved?.(); onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The trade grouping could not be saved.");
    } finally { setWorking(false); }
  };

  const candidate = (item: MergeCandidate, otherDate: boolean) => <FormControlLabel
    control={<Checkbox checked={selectedMergeRefs.includes(item.candidateRef)} onChange={(event) => {
      setSelectedMergeRefs((current) => event.target.checked
        ? [...current, item.candidateRef]
        : current.filter((ref) => ref !== item.candidateRef));
      if (otherDate && event.target.checked) setMergeStyle("swing");
    }} />}
    key={item.candidateRef}
    label={<Stack><Typography sx={{ fontWeight: 750 }}>{item.symbol}</Typography><Typography color="text.secondary" variant="body2">{new Date(item.openedAtUtc).toLocaleString()} – {new Date(item.closedAtUtc).toLocaleString()}</Typography></Stack>}
    sx={{ alignItems: "flex-start", border: 1, borderColor: "divider", borderRadius: 1.5, m: 0, p: 1 }}
  />;

  return <Drawer anchor="right" onClose={working ? undefined : onClose} open={open} slotProps={{ paper: { sx: { width: { xs: "100%", md: 820 } } } }}>
    <Stack sx={{ height: "100%", minHeight: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25 }}>
          <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">{mergeView ? "Merge trade" : "Edit trade"}</Typography>
          <IconButton aria-label="Close" disabled={working} onClick={onClose}><CloseRoundedIcon /></IconButton>
        </Stack>
        {!mergeView ? <Tabs aria-label="Edit trade sections" onChange={(_event, value: EditTab) => setTab(value)} value={tab} variant="fullWidth">
          <Tab label="Trade" value="trade" />
          <Tab label="Journal" value="journal" />
        </Tabs> : null}
      </Box>
      {mergeView ? <Stack spacing={2} sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
        <Button onClick={() => { setMergeView(null); setSelectedMergeRefs([]); setError(null); }} startIcon={<ArrowBackRoundedIcon />} sx={{ alignSelf: "flex-start" }}>Back</Button>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.25 }}>
          <Typography sx={{ fontWeight: 800 }}>{mergeView.current.symbol}</Typography>
          <Typography color="text.secondary" variant="body2">{mergeView.current.memberCount} round trip{mergeView.current.memberCount === 1 ? "" : "s"}</Typography>
        </Box>
        {mergeView.isMerged ? <Button color="error" disabled={working} onClick={() => void saveMerge("unmerge")} variant="outlined">Unmerge Trade</Button> : <>
          {mergeView.sameDay.length > 0 ? <Stack spacing={1}><Typography sx={{ fontWeight: 800 }}>Same day</Typography>{mergeView.sameDay.map((item) => candidate(item, false))}</Stack> : null}
          {mergeView.otherDates.length > 0 ? <Stack spacing={1}><Typography sx={{ fontWeight: 800 }}>Other dates</Typography>{mergeView.otherDates.map((item) => candidate(item, true))}</Stack> : null}
          <TextField label="Trade type" onChange={(event) => setMergeStyle(event.target.value as "day" | "swing")} select size="small" value={mergeStyle}><MenuItem value="day">Day Trade</MenuItem><MenuItem value="swing">Swing</MenuItem></TextField>
          <Typography color="text.secondary" variant="body2">Result: 1 trade from {selectedMergeRefs.length + 1} selected trades</Typography>
          <Button disabled={working || selectedMergeRefs.length === 0} onClick={() => void saveMerge("merge")} variant="contained">Merge Trades</Button>
        </>}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack> : tab === "trade" ? <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
        {snapshot ? <>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <TextField label="Ticker" onChange={(event) => { const value = event.target.value.toUpperCase(); setPreview(null); setRows((current) => current.map((row) => ({ ...row, normalizedSymbol: value }))); }} size="small" sx={{ width: "9ch" }} value={activeRows[0]?.normalizedSymbol ?? ""} />
            <TextField label="Trade type" onChange={(event) => { setPreview(null); setTradeStyle(event.target.value as TradeStyle); }} select size="small" sx={{ width: "20ch" }} value={tradeStyle ?? ""}>
              <MenuItem value="day_trade">Day trade</MenuItem><MenuItem value="swing">Swing</MenuItem><MenuItem value="other">Other</MenuItem>
            </TextField>
          </Box>
          {rows.map((row, index) => <Box key={row.clientRowRef} sx={{ border: 1, borderColor: row.removed ? "divider" : "divider", borderRadius: 1.5, opacity: row.removed ? 0.58 : 1, p: 1.25 }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ fontWeight: 700 }} variant="body2">Execution {index + 1}</Typography>
              <Button color={row.removed ? "inherit" : "error"} disabled={working} onClick={() => { setPreview(null); setRows((current) => current.map((item) => item.clientRowRef === row.clientRowRef ? { ...item, removed: !item.removed } : item)); }} size="small" startIcon={row.removed ? undefined : <DeleteOutlineRoundedIcon />}>{row.removed ? "Undo" : "Remove"}</Button>
            </Stack>
            {!row.removed ? <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "164px 132px 110px 96px 104px 88px" } }}>
              <TextField label="Date" onChange={(event) => update(row.clientRowRef, "localDate", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={row.localDate} />
              <TextField label="Time" onChange={(event) => update(row.clientRowRef, "localTime", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} sx={{ "& input": { pr: 4 } }} type="time" value={row.localTime} />
              <TextField label="Side" onChange={(event) => update(row.clientRowRef, "side", event.target.value as Side)} select size="small" value={row.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
              <TextField label="Shares" onChange={(event) => update(row.clientRowRef, "quantityDecimal", event.target.value)} size="small" value={row.quantityDecimal} />
              <TextField label="Price" onChange={(event) => update(row.clientRowRef, "priceDecimal", event.target.value)} size="small" value={row.priceDecimal} />
              <TextField label="Fee" onChange={(event) => update(row.clientRowRef, "feesDecimal", event.target.value)} size="small" value={row.feesDecimal} />
            </Box> : null}
          </Box>)}
          <Button disabled={working || activeRows.length === 0} onClick={addExecution} startIcon={<AddRoundedIcon />} sx={{ alignSelf: "flex-start" }}>Add execution</Button>
          <Button disabled={working} onClick={() => void openMerge()} startIcon={<CallMergeRoundedIcon />} sx={{ alignSelf: "flex-start" }}>Merge Trade</Button>
          {preview ? <Alert severity="info">{preview.consequenceCopy}</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
        </> : error ? <Alert severity="error">{error}</Alert> : <Typography color="text.secondary">Loading</Typography>}
      </Stack> : journalTarget ? <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <TradeExplorerReviewEditor embedded expectedAccountSelectionRef={expectedAccountSelectionRef} onClose={() => setTab("trade")} onSelectTrade={() => undefined} open selectedRoundTripId={journalTarget.roundTripId} showTagSelectionCount={false} showTradeNavigation={false} trades={[journalTarget]} />
      </Box> : <Box sx={{ flex: 1, p: 2 }}><Alert severity="info">Journal review is unavailable for this trade.</Alert></Box>}
      {!mergeView && tab === "trade" ? <Stack direction="row" spacing={1} sx={{ borderTop: 1, borderColor: "divider", justifyContent: "flex-end", p: 2 }}>
        {preview ? <Button disabled={working} onClick={() => setPreview(null)}>Cancel</Button> : null}
        <Button disabled={!snapshot || working} onClick={() => void (preview ? commit() : requestPreview())} variant="contained">{working ? "Saving…" : preview ? "Confirm changes" : "Review changes"}</Button>
      </Stack> : null}
    </Stack>
  </Drawer>;
}

"use client";

import { Alert, Box, Button, MenuItem, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { isSameAnalyzerMarketDay, type SharedAnalyzerAvailability } from "@/src/modules/level-analysis/contracts/shared-analyzer-beta-contracts";
import {
  commitManualTradeOnline,
  ManualTradeNeedsReviewError,
  ManualTradeNetworkError,
  previewManualTradeOnline,
  readManualTradeCommitStatus,
  type ManualTradeSubmission,
} from "@/src/modules/platform/client/pwa/manual-trade-outbox";
import { TradeAnalyzerAllowanceSummary } from "../trade-analyzer-allowance-summary";
import {
  ExecutionEntryCard,
  manualTradeEntry,
  type ExecutionDraft,
  type ExecutionSaveResult,
} from "../trade-tracker/execution-entry-card";
import { TradeAnalyzerResult } from "../workspace/workspace-trade-analyzer-panel";
import { ANALYZED_TRADES_HREF, type AnalyzerTrade } from "./analyzer-trade";

type Batch = Readonly<{
  trades: readonly AnalyzerTrade[];
  acceptedCount: number;
  queuingMessage: string | null;
  pendingDecisions: number;
}>;

type Props = Readonly<{
  accountCurrency: string;
  accountTimezone: string;
  availability: SharedAnalyzerAvailability | null;
  canEnter: boolean;
  defaultDate: string;
  demo: boolean;
  expectedAccountSelectionRef: string;
  list: readonly AnalyzerTrade[];
  listAvailable: boolean;
  continuationCursor: string | null;
  firstPage: boolean;
  initialView: "entry" | "list";
  initialTrade: AnalyzerTrade | null;
  missingRequestedTrade: boolean;
  initialInterval: "1m" | "5m";
  initialBasis?: "gross" | "net";
  selectedEventId: string | null;
}>;

function tradeLabel(trade: AnalyzerTrade, includeDate: boolean) {
  const when = includeDate ? `${trade.entryDate} · ${trade.entryTime.slice(0, 8)}` : trade.entryTime.slice(0, 8);
  return `${trade.symbol} · ${when}`;
}

function fillPrice(price: string | null) {
  return price === null ? "Price unavailable" : formatJournalAnalyticsDecimal(price, 2, true);
}

export function TradeAnalyzerHome({
  accountCurrency, accountTimezone, availability, canEnter, defaultDate, demo,
  expectedAccountSelectionRef, list, listAvailable, continuationCursor, firstPage, initialView,
  initialTrade, missingRequestedTrade, initialInterval, initialBasis, selectedEventId,
}: Props) {
  const router = useRouter();
  const uncertainSubmission = useRef<ManualTradeSubmission | null>(null);
  const batchHeading = useRef<HTMLHeadingElement>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [batchTradeId, setBatchTradeId] = useState<string | null>(null);
  const [listTradeId, setListTradeId] = useState<string | null>(null);
  const [showBatch, setShowBatch] = useState(false);
  const entryOpen = !demo && !showBatch && initialView === "entry" && !initialTrade && !missingRequestedTrade;
  const currentListTrade = list.find((trade) => trade.id === listTradeId) ??
    initialTrade ?? list[0] ?? null;
  const selected = showBatch
    ? batch?.trades.find((trade) => trade.id === batchTradeId) ?? batch?.trades[0] ?? null
    : entryOpen && !demo ? null : currentListTrade;
  const selectorTrades = showBatch ? batch?.trades ?? [] : list;
  const initialDetailOpen = !showBatch && !entryOpen && (initialTrade !== null || missingRequestedTrade);
  const listHref = demo ? "/trade-analyzer" : "/trade-analyzer?view=to-analyze";
  const moreHref = continuationCursor ? `${listHref}${demo ? "?" : "&"}cursor=${encodeURIComponent(continuationCursor)}` : null;
  const timezoneLabel = accountTimezone === "America/New_York" || accountTimezone === "America/Toronto"
    ? "Eastern Time" : accountTimezone.replaceAll("_", " ");

  useEffect(() => {
    if (showBatch && batch) batchHeading.current?.focus();
  }, [batch, showBatch]);

  function showSavedBatch(nextBatch: Batch) {
    setBatch(nextBatch);
    setBatchTradeId(null);
    setShowBatch(true);
  }

  async function save(executions: readonly ExecutionDraft[]): Promise<ExecutionSaveResult> {
    const entries = executions.map((execution) => manualTradeEntry(execution, accountCurrency, accountTimezone));
    const previous = uncertainSubmission.current;
    if (previous) {
      const status = await readManualTradeCommitStatus(previous).catch(() => {
        throw new Error("Reconnect and select Analyze trades again to check whether your previous submission was saved.");
      });
      uncertainSubmission.current = null;
      if (status.committed) {
        const sameEntries = JSON.stringify(previous.entries) === JSON.stringify(entries);
        if (!sameEntries) throw new Error("Your previous submission was saved. Check To analyze or Your analyzed trades before submitting these edited executions.");
        showSavedBatch({
          trades: [],
          acceptedCount: status.acceptedExecutionCount,
          pendingDecisions: status.pendingDecisionCount,
          queuingMessage: "Your submission was saved. Open To analyze or Your analyzed trades to find its trades.",
        });
        return { status: "saved", ...status };
      }
    }

    const submission: ManualTradeSubmission = {
      entries,
      expectedAccountSelectionRef,
      idempotencyKey: crypto.randomUUID(),
      tracker: "day",
    };
    try {
      const preview = await previewManualTradeOnline(submission);
      const analyzerGroupRefs = preview.groups
        .filter((group) => (group.state === "complete_trade" || group.state === "existing_position_closed") &&
          isSameAnalyzerMarketDay(group.openedAtUtc, group.lastExecutionAtUtc))
        .map((group) => group.groupRef);
      const result = await commitManualTradeOnline(submission, preview, { analyzerGroupRefs, includeAnalyzerTrades: true });
      const trades = result.savedTrades as readonly AnalyzerTrade[];
      const noUses = result.analyzerSelectionOutcomes.some(({ outcome }) => outcome === "usage_exhausted");
      const skipped = result.analyzerSelectionOutcomes.some(({ outcome }) => outcome !== "queued" && outcome !== "already_requested");
      showSavedBatch({
        trades,
        acceptedCount: result.acceptedExecutionCount,
        pendingDecisions: result.pendingDecisionCount,
        queuingMessage: noUses
          ? "Some trades could not start analysis because no uses remain for new market data."
          : skipped ? "Some trades could not start analysis. Select a trade to see its status."
          : analyzerGroupRefs.length === 0 ? "Analyzer needs a completed trade within one market day."
          : trades.length === 0 ? "Open To analyze or Your analyzed trades to find the saved trades."
          : null,
      });
      return { status: "saved", ...result };
    } catch (error) {
      if (error instanceof ManualTradeNetworkError) {
        if (error.stage === "commit") uncertainSubmission.current = submission;
        throw new Error(error.stage === "commit"
          ? "The connection dropped while submitting. Select Analyze trades again to check whether your executions were saved."
          : "Trade Analyzer needs a connection. Check your connection and try again.");
      }
      if (error instanceof ManualTradeNeedsReviewError) {
        if (error.code === "TRADERLINK_MANUAL_TRADE_RECENT_ENTRY_REQUIRED") {
          throw new Error("Check the trading date and execution times. Future executions cannot be saved.");
        }
        if (error.code?.includes("CONFLICT")) {
          throw new Error("The selected account or an existing trade changed. Check your executions and try again.");
        }
        throw new Error("Check the ticker, time, quantity, price, and fees for each execution. Your entries are still in the form.");
      }
      throw error;
    }
  }

  function openList() {
    setShowBatch(false);
    setListTradeId(null);
    if (initialView !== "list" || initialTrade || missingRequestedTrade) router.push(listHref);
    else router.refresh();
  }

  function openEntry() {
    setShowBatch(false);
    if (initialView !== "entry" || initialTrade || missingRequestedTrade) router.replace("/trade-analyzer", { scroll: false });
  }

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      {!demo ? (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Button variant={entryOpen ? "contained" : "outlined"} aria-pressed={entryOpen} onClick={openEntry}>Enter trades</Button>
          <Button variant={!entryOpen && !showBatch && !initialDetailOpen ? "contained" : "outlined"} aria-pressed={!entryOpen && !showBatch && !initialDetailOpen} onClick={openList}>To analyze</Button>
          {batch ? (
            <Button variant={showBatch ? "contained" : "outlined"} aria-pressed={showBatch} onClick={() => setShowBatch(true)}>
              Latest batch
            </Button>
          ) : null}
        </Stack>
      ) : null}
      {canEnter ? (
        <Box hidden={!entryOpen}>
          <Stack spacing={1.25}>
            {availability?.enabled ? <TradeAnalyzerAllowanceSummary availability={availability} selected={0} /> :
              <Alert severity="info">New analysis is currently unavailable.</Alert>}
            <ExecutionEntryCard
              collapsed={false}
              entryMode="analyzer"
              onCollapsedChange={() => {}}
              onSave={save}
              onSubmitted={() => {}}
              savingEnabled={availability?.enabled === true}
              sessionDate={defaultDate}
              submittedCount={null}
              timeZoneLabel={timezoneLabel}
            />
          </Stack>
        </Box>
      ) : entryOpen && !demo ? (
        <DashboardPanel title="Manual trade entry">
          <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
            <Typography color="text.secondary" variant="body2">Your current plan does not include manual entry. You can select saved trades in To analyze.</Typography>
            <DashboardSecondaryAction href="/plans?feature=journal.manual_entry">See plans</DashboardSecondaryAction>
          </Stack>
        </DashboardPanel>
      ) : null}
      {!entryOpen || demo ? (
        <DashboardPanel title={showBatch ? undefined : demo ? "Demo analyzed trades" : initialDetailOpen ? undefined : "To analyze"}>
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            {showBatch && batch ? (
              <Box>
                <Typography ref={batchHeading} component="h2" tabIndex={-1} variant="h6">
                  {batch.trades.length ? `${batch.trades.length} ${batch.trades.length === 1 ? "trade" : "trades"} saved` : "Executions saved"}
                </Typography>
                <Typography color="text.secondary" variant="body2">{batch.acceptedCount} executions saved to your trading account.</Typography>
                {batch.queuingMessage ? <Alert severity="info" sx={{ mt: 1 }}>{batch.queuingMessage}</Alert> : null}
                {batch.pendingDecisions > 0 ? (
                  <Alert severity="warning" sx={{ mt: 1 }} action={<Button href="/data-decisions">Open Data Decisions</Button>}>
                    Some executions need your input before they can be used.
                  </Alert>
                ) : null}
              </Box>
            ) : null}
            {missingRequestedTrade && !showBatch ? (
              <Alert severity="info">The requested trade is unavailable in the selected account.</Alert>
            ) : null}
            {selected && selectorTrades.length > 1 ? (
              showBatch && selectorTrades.length <= 6 ? (
                <Tabs
                  aria-label="Trades in the latest batch"
                  onChange={(_, id: string) => setBatchTradeId(id)}
                  value={selected.id}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                >
                  {selectorTrades.map((trade) => <Tab aria-controls="analyzer-selected-trade" id={`analyzer-tab-${trade.id}`} key={trade.id} label={tradeLabel(trade, false)} value={trade.id} />)}
                </Tabs>
              ) : (
                <TextField
                  label={demo ? "Choose a demo trade" : "Choose a trade"}
                  onChange={(event) => showBatch ? setBatchTradeId(event.target.value) : setListTradeId(event.target.value)}
                  select
                  size="small"
                  value={selectorTrades.some((trade) => trade.id === selected.id) ? selected.id : ""}
                  sx={{ alignSelf: "flex-start", width: "min(100%, 330px)" }}
                >
                  {selectorTrades.map((trade) => <MenuItem key={trade.id} value={trade.id}>{tradeLabel(trade, !showBatch)}</MenuItem>)}
                </TextField>
              )
            ) : null}
            {!showBatch && (moreHref || !firstPage) ? (
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                {!firstPage ? <Button href={listHref}>First page</Button> : null}
                {moreHref ? <Button href={moreHref}>More {demo ? "demo " : ""}trades</Button> : null}
              </Stack>
            ) : null}
            {!selected && !showBatch && !missingRequestedTrade ? (
              <Typography color="text.secondary" variant="body2">
                {demo ? "There are no saved demo analyses for this account." :
                  listAvailable ? "There are no saved day trades waiting for analysis." : "Your saved trades are temporarily unavailable."}
              </Typography>
            ) : null}
            {!selected && showBatch ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Button onClick={openList}>To analyze</Button>
                <Button href={ANALYZED_TRADES_HREF}>Your analyzed trades</Button>
              </Stack>
            ) : null}
            {selected ? (
              <Box
                id="analyzer-selected-trade"
                role={showBatch && selectorTrades.length > 1 && selectorTrades.length <= 6 ? "tabpanel" : undefined}
                aria-labelledby={showBatch && selectorTrades.length > 1 && selectorTrades.length <= 6 ? `analyzer-tab-${selected.id}` : undefined}
                sx={{ minWidth: 0 }}
              >
                <Typography component="h2" variant="h6" sx={{ mb: 0.5 }}>{selected.symbol} · {selected.direction === "long" ? "Long" : "Short"}</Typography>
                <Typography color="text.secondary" variant="body2">{selected.entryDate} at {selected.entryTime.slice(0, 5)} · {timezoneLabel}</Typography>
                {selected.executions.length ? (
                  <Box component="details" sx={{ mt: 1, "& > summary": { cursor: "pointer", color: "primary.main" } }}>
                    <summary>{selected.executions.length} saved executions</summary>
                    <Stack component="ul" spacing={0.5} sx={{ pl: 2, my: 1 }}>
                      {selected.executions.map((fill, index) => (
                        <Typography component="li" variant="body2" key={index}>
                          {fill.side === "buy" ? "Buy" : "Sell"} {formatJournalAnalyticsDecimal(fill.quantity)} · {fillPrice(fill.price)} {fill.price === null ? "" : selected.currency} · {fill.localDate} {fill.localTime} ({fill.sourceTimezone})
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                ) : null}
                {selected.canAnalyze ? (
                  <TradeAnalyzerResult
                    key={selected.id}
                    inline
                    open
                    readOnly={demo}
                    currency={selected.currency}
                    direction={selected.direction}
                    expectedAccountSelectionRef={expectedAccountSelectionRef}
                    gainLossDecimal={null}
                    basis={selected.id === initialTrade?.id ? initialBasis : undefined}
                    initialInterval={selected.id === initialTrade?.id ? initialInterval : "1m"}
                    selectedEventId={selected.id === initialTrade?.id ? selectedEventId : null}
                    roundTripId={selected.id}
                    symbol={selected.symbol}
                    timezone={accountTimezone}
                  />
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {selected.closed ? "Trade Analyzer currently covers trades that open and close on the same market day." :
                      "This trade is still open. Add its closing executions before it can be analyzed."}
                  </Alert>
                )}
              </Box>
            ) : null}
          </Stack>
        </DashboardPanel>
      ) : null}
    </Stack>
  );
}

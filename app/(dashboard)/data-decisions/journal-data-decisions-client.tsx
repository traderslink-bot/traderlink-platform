"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { JournalDecisionAction } from "@/src/modules/journal/contracts/journal-decision-contracts";
import type {
  JournalDataDecisionItem,
  JournalDataDecisionsReadModel,
} from "@/src/modules/journal/contracts/journal-product-read-models";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { DashboardPage, DashboardPanel } from "../../dashboard-template";

const ENDPOINT = "/api/platform/journal/data-decisions";

const ACTION_LABELS: Readonly<Partial<Record<JournalDecisionAction, string>>> = {
  correct_execution_fact: "Correct this execution",
  set_execution_order: "Set same-time execution order",
  exclude_execution: "Exclude this execution",
  restore_execution: "Restore this execution",
  merge_supported_duplicate: "Merge a supported duplicate",
  keep_distinct: "Keep both executions",
  correct_position_fact: "Correct a position fact",
  add_missing_execution: "Add the missing execution",
  supply_opening_inventory: "Set opening inventory",
  supply_position_fact: "Enter the current position",
  supply_coverage_fact: "Confirm day coverage",
  accept_source_limitation: "Accept source limitation",
  confirm_legitimate_open_position: "Confirm position is intentionally open",
};

const SINGLE_EXECUTION_ACTIONS = Object.freeze([
  "correct_execution_fact",
  "set_execution_order",
  "exclude_execution",
  "restore_execution",
  "keep_distinct",
] as const);

type Draft = Readonly<{
  action: JournalDecisionAction | "";
  executionId: string;
  retainedExecutionId: string;
  sameTimestampSequence: string;
  positionFactId: string;
  factKind: "opening_balance" | "closing_balance" | "open_position" | "current_position";
  timePrecision: "date" | "day_start" | "day_end" | "exact";
  quantityDecimal: string;
  effectiveLocalDate: string;
  sourceTimezone: string;
  coverageKind: "complete" | "partial";
  date: string;
  time: string;
  symbol: string;
  currency: string;
  side: "buy" | "sell";
  priceDecimal: string;
  feesDecimal: string;
  feeSignConvention: "broker_reported_signed" | "cash_effect";
  reasonText: string;
}>;

function sourceDateTime(
  sourceTimestampText: string | undefined,
  executedAtUtc: string | undefined,
): Readonly<{ date: string; time: string }> {
  const match = sourceTimestampText?.match(
    /(\d{4}-\d{2}-\d{2})[^\d]+(\d{2}:\d{2}(?::\d{2})?)/u,
  );
  if (match?.[1] && match[2]) {
    return Object.freeze({
      date: match[1],
      time: match[2].length === 5 ? `${match[2]}:00` : match[2],
    });
  }
  return Object.freeze({
    date: executedAtUtc?.slice(0, 10) ?? "",
    time: executedAtUtc?.slice(11, 19) ?? "09:30:00",
  });
}

function initialDraft(item: JournalDataDecisionItem): Draft {
  const firstPosition = item.positionFacts[0] ?? null;
  const firstExecution = item.executions[0] ?? null;
  const firstExecutionTime = sourceDateTime(
    firstExecution?.sourceTimestampText,
    firstExecution?.executedAtUtc,
  );
  const effectiveDate = item.effectiveAtUtc?.slice(0, 10) ??
    firstPosition?.effectiveLocalDate ?? "";
  const action = item.allowedActions.find((candidate) =>
    candidate in ACTION_LABELS) ?? "";
  const beginsWithExecution = SINGLE_EXECUTION_ACTIONS.includes(
    action as (typeof SINGLE_EXECUTION_ACTIONS)[number],
  ) || action === "merge_supported_duplicate";
  return Object.freeze({
    action,
    executionId: firstExecution?.executionId ?? "",
    retainedExecutionId: item.executions[1]?.executionId ?? firstExecution?.executionId ?? "",
    sameTimestampSequence: "1",
    positionFactId: firstPosition?.positionFactId ?? "",
    factKind: firstPosition?.factKind ?? "closing_balance",
    timePrecision: "date",
    quantityDecimal: beginsWithExecution
      ? firstExecution?.quantityDecimal ?? "0"
      : firstPosition?.quantityDecimal ?? "0",
    effectiveLocalDate: effectiveDate,
    sourceTimezone: firstPosition?.sourceTimezone ?? firstExecution?.sourceTimezone ?? "America/New_York",
    coverageKind: "partial",
    date: firstExecutionTime.date || effectiveDate,
    time: firstExecutionTime.time,
    symbol: item.symbol ?? firstExecution?.symbol ?? "",
    currency: item.currency ?? firstExecution?.currency ?? "USD",
    side: firstExecution?.side ?? "buy",
    priceDecimal: firstExecution?.priceDecimal ?? "",
    feesDecimal: firstExecution?.feesDecimal ?? "",
    feeSignConvention: firstExecution?.feeSignConvention === "cash_effect"
      ? "cash_effect"
      : "broker_reported_signed",
    reasonText: "",
  });
}

function issueTitle(issueCode: string): string {
  const known: Readonly<Record<string, string>> = {
    conflicting_position_facts: "The statement contains conflicting position totals",
    position_fact_mismatch: "Executions and the statement position do not agree",
    opening_inventory_required: "An opening position is needed",
    manual_trading_day_coverage_unconfirmed: "Manual entries do not prove the full trading day",
  };
  return known[issueCode] ?? issueCode.replaceAll("_", " ").replace(/^./u, (letter) => letter.toUpperCase());
}

function effectText(effectCode: string): string {
  const known: Readonly<Record<string, string>> = {
    position_chain_unavailable: "This trade chain is withheld from confirmed round trips until you decide.",
    price_metrics_unavailable: "Price-dependent analytics are withheld until you decide.",
    net_metrics_unavailable: "Net results are withheld until you decide how fees should be handled.",
    source_review_required: "The source evidence needs your confirmation.",
  };
  return known[effectCode] ?? effectCode.replaceAll("_", " ");
}

function affectedTradeHref(item: JournalDataDecisionItem): string | null {
  if (!item.instrumentRef || !item.currency) return null;
  return `/trades/roundtrips?currency=${encodeURIComponent(item.currency)}&instrumentId=${encodeURIComponent(item.instrumentRef)}`;
}

function affectedTradingDayHref(item: JournalDataDecisionItem): string | null {
  const date = item.suggestedCoverage?.localStartDate ??
    item.positionFacts[0]?.effectiveLocalDate ??
    sourceDateTime(
      item.executions[0]?.sourceTimestampText,
      item.executions[0]?.executedAtUtc,
    ).date;
  return /^\d{4}-\d{2}-\d{2}$/u.test(date) ? `/trade-tracker/${date}` : null;
}

function afterDecisionText(
  item: JournalDataDecisionItem,
  action: Draft["action"],
): string {
  if (!action) {
    return "After: no facts change until you choose and save a decision.";
  }
  if (action === "accept_source_limitation") {
    return "After: the source evidence stays unchanged, this decision is recorded, and dependent results remain explicitly limited.";
  }
  const chain = item.symbol
    ? `${item.symbol}${item.currency ? ` / ${item.currency}` : ""}`
    : "the affected account scope";
  return `After: TraderLink records the selected factual change and rebuilds only ${chain}. Round Trips, Trade Tracker, Calendar and Analytics then read the rebuilt result; exact values are shown after the save, never guessed in advance.`;
}

function displayDecimal(value: string | null): string {
  return value === null ? "Unavailable" : formatJournalAnalyticsDecimal(value);
}

function DecisionCard({
  expectedAccountSelectionRef,
  item,
  onResolved,
}: {
  expectedAccountSelectionRef: string;
  item: JournalDataDecisionItem;
  onResolved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((current) => Object.freeze({ ...current, [field]: value }));
  }

  function chooseAction(action: Draft["action"]) {
    const defaults = initialDraft(Object.freeze({
      ...item,
      allowedActions: action ? Object.freeze([action]) : Object.freeze([]),
    }));
    setDraft((current) => Object.freeze({
      ...defaults,
      action,
      reasonText: current.reasonText,
    }));
  }

  function chooseExecution(executionId: string) {
    const selected = item.executions.find((execution) =>
      execution.executionId === executionId);
    if (!selected) {
      update("executionId", executionId);
      return;
    }
    const selectedTime = sourceDateTime(
      selected.sourceTimestampText,
      selected.executedAtUtc,
    );
    setDraft((current) => Object.freeze({
      ...current,
      executionId,
      date: selectedTime.date,
      time: selectedTime.time,
      sourceTimezone: selected.sourceTimezone,
      symbol: selected.symbol,
      currency: selected.currency,
      side: selected.side,
      quantityDecimal: selected.quantityDecimal,
      priceDecimal: selected.priceDecimal ?? "",
      feesDecimal: selected.feesDecimal ?? "",
      feeSignConvention: selected.feeSignConvention === "cash_effect"
        ? "cash_effect"
        : "broker_reported_signed",
    }));
  }

  async function save() {
    if (!draft.action || saving) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        action: draft.action,
        decisionId: item.decisionId,
        expectedAccountSelectionRef,
        expectedRevision: item.revision,
        reasonText: draft.reasonText.trim() || null,
      };
      if (draft.action === "correct_position_fact" || draft.action === "confirm_legitimate_open_position") {
        body.positionFactId = draft.positionFactId;
      }
      if (draft.action === "correct_position_fact") body.quantityDecimal = draft.quantityDecimal;
      if (SINGLE_EXECUTION_ACTIONS.includes(
        draft.action as (typeof SINGLE_EXECUTION_ACTIONS)[number],
      )) {
        body.executionId = draft.executionId;
      }
      if (draft.action === "correct_execution_fact") {
        Object.assign(body, {
          sourceTimestampText: `${draft.date}, ${draft.time}`,
          sourceTimezone: draft.sourceTimezone,
          side: draft.side,
          quantityDecimal: draft.quantityDecimal,
          priceDecimal: draft.priceDecimal || null,
          feesDecimal: draft.feesDecimal || null,
          feeCurrency: draft.feesDecimal ? draft.currency : null,
          feeSignConvention: draft.feeSignConvention,
        });
      }
      if (draft.action === "set_execution_order") {
        body.sameTimestampSequence = Number(draft.sameTimestampSequence);
      }
      if (draft.action === "merge_supported_duplicate") {
        body.duplicateExecutionId = draft.executionId;
        body.retainedExecutionId = draft.retainedExecutionId;
      }
      if (draft.action === "supply_opening_inventory") {
        Object.assign(body, {
          effectiveLocalDate: draft.effectiveLocalDate,
          sourceTimezone: draft.sourceTimezone,
          quantityDecimal: draft.quantityDecimal,
        });
      }
      if (draft.action === "supply_position_fact") {
        Object.assign(body, {
          factKind: draft.factKind,
          effectiveLocalDate: draft.effectiveLocalDate,
          timePrecision: draft.timePrecision,
          sourceTimeText: draft.time,
          sourceTimezone: draft.sourceTimezone,
          quantityDecimal: draft.quantityDecimal,
        });
      }
      if (draft.action === "supply_coverage_fact") body.coverageKind = draft.coverageKind;
      if (draft.action === "add_missing_execution") {
        body.execution = {
          sourceTimestampText: `${draft.date}, ${draft.time}`,
          sourceTimezone: draft.sourceTimezone,
          normalizedSymbol: draft.symbol,
          tradeCurrency: draft.currency,
          side: draft.side,
          quantityDecimal: draft.quantityDecimal,
          priceDecimal: draft.priceDecimal || null,
          feesDecimal: draft.feesDecimal || null,
          feeCurrency: draft.feesDecimal ? draft.currency : null,
        };
      }
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const packet = await response.json() as { code?: string };
      if (!response.ok) throw new Error(packet.code ?? "The decision could not be saved.");
      await onResolved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The decision could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const exposedActions = item.allowedActions.filter((action) => action in ACTION_LABELS);
  const selectedExecution = item.executions.find((execution) =>
    execution.executionId === draft.executionId) ?? null;
  const tradeHref = affectedTradeHref(item);
  const tradingDayHref = affectedTradingDayHref(item);
  return (
    <Box id={`decision-${item.decisionId}`} sx={{ scrollMarginTop: 96 }}>
    <DashboardPanel title={issueTitle(item.issueCode)}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
          <Chip color="warning" label="Needs your decision" size="small" />
          {item.symbol ? <Chip label={`${item.symbol}${item.currency ? ` · ${item.currency}` : ""}`} size="small" variant="outlined" /> : null}
          {item.sourceRowNumber ? <Chip label={`Statement row ${item.sourceRowNumber}`} size="small" variant="outlined" /> : null}
        </Stack>
        <Typography color="text.secondary" variant="body2">{effectText(item.effectCode)}</Typography>

        <Alert severity="info">
          Before: {item.executions.length} execution record{item.executions.length === 1 ? "" : "s"} and {item.positionFacts.length} position fact{item.positionFacts.length === 1 ? "" : "s"} are in this evidence scope. {afterDecisionText(item, draft.action)}
        </Alert>

        {item.positionFacts.length > 0 ? (
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }} variant="subtitle2">Position facts on record</Typography>
            <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Fact</TableCell><TableCell>Source</TableCell><TableCell align="right">Quantity</TableCell></TableRow></TableHead><TableBody>{item.positionFacts.map((fact) => (
              <TableRow key={fact.positionFactId}><TableCell>{fact.effectiveLocalDate}</TableCell><TableCell>{fact.factKind.replaceAll("_", " ")}</TableCell><TableCell>{fact.source}</TableCell><TableCell align="right">{displayDecimal(fact.quantityDecimal)}</TableCell></TableRow>
            ))}</TableBody></Table></TableContainer>
          </Box>
        ) : null}

        {item.executions.length > 0 ? (
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }} variant="subtitle2">Executions used by this chain</Typography>
            <TableContainer sx={{ maxHeight: 280 }}><Table size="small" stickyHeader><TableHead><TableRow><TableCell>Executed</TableCell><TableCell>Side</TableCell><TableCell align="right">Quantity</TableCell><TableCell align="right">Price</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{item.executions.map((execution) => (
              <TableRow key={execution.executionId}><TableCell>{execution.executedAtUtc.replace("T", " ").replace(".000Z", " UTC")}</TableCell><TableCell>{execution.side}</TableCell><TableCell align="right">{displayDecimal(execution.quantityDecimal)}</TableCell><TableCell align="right">{displayDecimal(execution.priceDecimal)}</TableCell><TableCell>{execution.currentState.replaceAll("_", " ")}</TableCell></TableRow>
            ))}</TableBody></Table></TableContainer>
          </Box>
        ) : null}

        <Divider />
        <Typography variant="body2">Choose the correction that matches your actual broker statement or account.</Typography>
        <TextField
          label="Decision"
          onChange={(event) => chooseAction(event.target.value as Draft["action"])}
          select
          value={draft.action}
        >
          {exposedActions.map((action) => <MenuItem key={action} value={action}>{ACTION_LABELS[action]}</MenuItem>)}
        </TextField>

        {SINGLE_EXECUTION_ACTIONS.includes(
          draft.action as (typeof SINGLE_EXECUTION_ACTIONS)[number],
        ) ? (
          <TextField
            label="Execution"
            onChange={(event) => chooseExecution(event.target.value)}
            select
            value={draft.executionId}
          >
            {item.executions.map((execution) => (
              <MenuItem key={execution.executionId} value={execution.executionId}>
                {execution.symbol} · {execution.executedAtUtc.replace("T", " ").replace(".000Z", " UTC")} · {execution.side} {displayDecimal(execution.quantityDecimal)} @ {displayDecimal(execution.priceDecimal)}
              </MenuItem>
            ))}
          </TextField>
        ) : null}

        {draft.action === "merge_supported_duplicate" ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField fullWidth label="Duplicate execution to supersede" onChange={(event) => chooseExecution(event.target.value)} select value={draft.executionId}>
              {item.executions.map((execution) => <MenuItem key={execution.executionId} value={execution.executionId}>{execution.symbol} · {execution.executedAtUtc} · {execution.side} {displayDecimal(execution.quantityDecimal)}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Execution to keep" onChange={(event) => update("retainedExecutionId", event.target.value)} select value={draft.retainedExecutionId}>
              {item.executions.map((execution) => <MenuItem key={execution.executionId} value={execution.executionId}>{execution.symbol} · {execution.executedAtUtc} · {execution.side} {displayDecimal(execution.quantityDecimal)}</MenuItem>)}
            </TextField>
          </Stack>
        ) : null}

        {draft.action === "correct_execution_fact" ? (
          <Stack spacing={1.5}>
            <Alert severity="info">
              Current: {selectedExecution ? `${selectedExecution.side} ${displayDecimal(selectedExecution.quantityDecimal)} @ ${displayDecimal(selectedExecution.priceDecimal)}` : "Unavailable"}. Corrected: {draft.side} {draft.quantityDecimal || "Unavailable"} @ {draft.priceDecimal || "Unavailable"}.
            </Alert>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
              <TextField label="Date" onChange={(event) => update("date", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.date} />
              <TextField label="Time" onChange={(event) => update("time", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="time" value={draft.time} />
              <TextField label="Timezone" onChange={(event) => update("sourceTimezone", event.target.value)} value={draft.sourceTimezone} />
              <TextField label="Side" onChange={(event) => update("side", event.target.value as Draft["side"])} select value={draft.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
              <TextField label="Correct quantity" onChange={(event) => update("quantityDecimal", event.target.value)} value={draft.quantityDecimal} />
              <TextField label="Correct price" onChange={(event) => update("priceDecimal", event.target.value)} value={draft.priceDecimal} />
              <TextField label="Correct fees (optional)" onChange={(event) => update("feesDecimal", event.target.value)} value={draft.feesDecimal} />
              <TextField label="Fee sign" onChange={(event) => update("feeSignConvention", event.target.value as Draft["feeSignConvention"])} select value={draft.feeSignConvention}><MenuItem value="broker_reported_signed">Broker-reported sign</MenuItem><MenuItem value="cash_effect">Cash effect</MenuItem></TextField>
            </Box>
            <Typography color="text.secondary" variant="caption">Symbol and currency stay on the original chain. If either is wrong, exclude this execution and add the correct missing execution.</Typography>
          </Stack>
        ) : null}

        {draft.action === "set_execution_order" ? (
          <TextField helperText="Use 1 for the first execution at this timestamp, 2 for the second, and so on." label="Order at the same timestamp" onChange={(event) => update("sameTimestampSequence", event.target.value)} slotProps={{ htmlInput: { min: 1, step: 1 } }} type="number" value={draft.sameTimestampSequence} />
        ) : null}

        {draft.action === "exclude_execution" ? (
          <Alert severity="warning">The original execution remains in history but is excluded from active trade reconstruction after you save.</Alert>
        ) : null}

        {draft.action === "keep_distinct" ? (
          <Alert severity="info">Keep this execution as a separate real occurrence only when the broker statement shows both fills.</Alert>
        ) : null}

        {draft.action === "correct_position_fact" || draft.action === "confirm_legitimate_open_position" ? (
          <TextField label="Position fact" onChange={(event) => {
            const selected = item.positionFacts.find((fact) => fact.positionFactId === event.target.value);
            update("positionFactId", event.target.value);
            if (selected) update("quantityDecimal", selected.quantityDecimal);
          }} select value={draft.positionFactId}>
            {item.positionFacts.map((fact) => <MenuItem key={fact.positionFactId} value={fact.positionFactId}>{fact.effectiveLocalDate} · {fact.factKind.replaceAll("_", " ")} · {displayDecimal(fact.quantityDecimal)}</MenuItem>)}
          </TextField>
        ) : null}

        {draft.action === "correct_position_fact" || draft.action === "supply_opening_inventory" || draft.action === "supply_position_fact" ? (
          <TextField helperText="Enter the exact quantity shown by the broker. It is stored without display rounding." label="Correct quantity" onChange={(event) => update("quantityDecimal", event.target.value)} value={draft.quantityDecimal} />
        ) : null}

        {draft.action === "supply_opening_inventory" || draft.action === "supply_position_fact" ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField label="Effective date" onChange={(event) => update("effectiveLocalDate", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.effectiveLocalDate} />
            <TextField label="Timezone" onChange={(event) => update("sourceTimezone", event.target.value)} value={draft.sourceTimezone} />
          </Stack>
        ) : null}

        {draft.action === "supply_position_fact" ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField fullWidth label="Position fact" onChange={(event) => update("factKind", event.target.value as Draft["factKind"])} select value={draft.factKind}>
              <MenuItem value="opening_balance">Opening balance</MenuItem>
              <MenuItem value="closing_balance">Closing balance</MenuItem>
              <MenuItem value="open_position">Open position</MenuItem>
              <MenuItem value="current_position">Current position</MenuItem>
            </TextField>
            <TextField fullWidth label="Time precision" onChange={(event) => update("timePrecision", event.target.value as Draft["timePrecision"])} select value={draft.timePrecision}>
              <MenuItem value="date">Date only</MenuItem>
              <MenuItem value="day_start">Start of day</MenuItem>
              <MenuItem value="day_end">End of day</MenuItem>
              <MenuItem value="exact">Exact time</MenuItem>
            </TextField>
            {draft.timePrecision === "exact" ? <TextField fullWidth label="Exact time" onChange={(event) => update("time", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="time" value={draft.time} /> : null}
          </Stack>
        ) : null}

        {draft.action === "supply_coverage_fact" ? (
          <TextField label="How complete is this trading day?" onChange={(event) => update("coverageKind", event.target.value as Draft["coverageKind"])} select value={draft.coverageKind}>
            <MenuItem value="partial">These are only some executions from the day</MenuItem>
            <MenuItem value="complete">These are all stock executions from the day</MenuItem>
          </TextField>
        ) : null}

        {draft.action === "add_missing_execution" ? (
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
            <TextField label="Date" onChange={(event) => update("date", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.date} />
            <TextField label="Time" onChange={(event) => update("time", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="time" value={draft.time} />
            <TextField label="Timezone" onChange={(event) => update("sourceTimezone", event.target.value)} value={draft.sourceTimezone} />
            <TextField label="Symbol" onChange={(event) => update("symbol", event.target.value.toUpperCase())} value={draft.symbol} />
            <TextField label="Side" onChange={(event) => update("side", event.target.value as Draft["side"])} select value={draft.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
            <TextField label="Quantity" onChange={(event) => update("quantityDecimal", event.target.value)} value={draft.quantityDecimal} />
            <TextField label="Price" onChange={(event) => update("priceDecimal", event.target.value)} value={draft.priceDecimal} />
            <TextField label="Fees (optional)" onChange={(event) => update("feesDecimal", event.target.value)} value={draft.feesDecimal} />
          </Box>
        ) : null}

        {draft.action === "accept_source_limitation" ? (
          <Alert severity="warning">Use this only when the source truly cannot provide the missing fact. The affected analytics will remain limited.</Alert>
        ) : null}

        <TextField label="Why you made this decision (optional)" multiline onChange={(event) => update("reasonText", event.target.value)} rows={2} value={draft.reasonText} />
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Button disabled={!draft.action || saving} onClick={() => void save()} variant="contained">{saving ? "Saving decision..." : "Save decision and rebuild"}</Button>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {tradeHref ? <Button href={tradeHref} variant="outlined">Review affected trades</Button> : null}
          {tradingDayHref ? <Button href={tradingDayHref} variant="outlined">Review affected trading day</Button> : null}
          <Button href="/analytics" variant="outlined">Review account analytics</Button>
        </Stack>
      </Stack>
    </DashboardPanel>
    </Box>
  );
}

export function JournalDataDecisionsClient({
  expectedAccountSelectionRef,
  initial,
  selectedImportBatchId,
}: {
  expectedAccountSelectionRef: string;
  initial: JournalDataDecisionsReadModel;
  selectedImportBatchId: string | null;
}) {
  const [model, setModel] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const pending = selectedImportBatchId
    ? model.pending.filter((item) => item.importBatchIds.includes(selectedImportBatchId))
    : model.pending;
  const resolved = selectedImportBatchId
    ? model.resolved.filter((item) => item.importBatchIds.includes(selectedImportBatchId))
    : model.resolved;

  async function refresh() {
    const response = await fetch(ENDPOINT, { cache: "no-store" });
    const packet = await response.json() as { decisions?: JournalDataDecisionsReadModel };
    if (response.ok && packet.decisions) {
      setModel(packet.decisions);
      setNotice("Decision saved. TraderLink rebuilt the affected account facts.");
    }
  }

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Journal</Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Data Decisions</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
          TraderLink identifies uncertainty, shows the exact execution and position evidence it affects, and lets you decide. Unrelated verified trades remain available throughout.
        </Typography>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Chip color={pending.length > 0 ? "warning" : "success"} label={`${pending.length} pending`} size="small" />
        <Chip label={`${resolved.length} resolved`} size="small" variant="outlined" />
      </Stack>
      {selectedImportBatchId ? (
        <Alert action={<Button color="inherit" href="/data-decisions" size="small">Show all decisions</Button>} severity="info">
          Showing only decisions connected to the selected import. The import identifier remains private and is not displayed.
        </Alert>
      ) : null}
      {notice ? <Alert severity="success">{notice}</Alert> : null}
      {pending.length === 0 ? (
        <Alert severity="success">{selectedImportBatchId ? "No decisions from this import are waiting." : "No data decisions are waiting. Confirmed Journal facts can flow to the dashboard."}</Alert>
      ) : pending.map((item) => (
        <DecisionCard
          expectedAccountSelectionRef={expectedAccountSelectionRef}
          item={item}
          key={item.decisionId}
          onResolved={refresh}
        />
      ))}
      {resolved.length > 0 ? (
        <DashboardPanel title="Resolved decisions">
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Issue</TableCell><TableCell>Ticker</TableCell><TableCell>Resolved state</TableCell><TableCell>Updated</TableCell><TableCell>Result</TableCell></TableRow></TableHead><TableBody>{resolved.slice(0, 100).map((item) => (
            <TableRow key={item.decisionId}><TableCell>{issueTitle(item.issueCode)}</TableCell><TableCell>{item.symbol ?? "Account-wide"}</TableCell><TableCell>Resolved by trader</TableCell><TableCell>{item.updatedAtUtc.replace("T", " ").replace(".000Z", " UTC")}</TableCell><TableCell>{affectedTradeHref(item) ? <Button href={affectedTradeHref(item) ?? "/trades/roundtrips"} size="small">Review trades</Button> : <Button href="/analytics" size="small">Review analytics</Button>}</TableCell></TableRow>
          ))}</TableBody></Table></TableContainer>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}

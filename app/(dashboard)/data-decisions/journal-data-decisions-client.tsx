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
import { useEffect, useState } from "react";

import type { JournalDecisionAction } from "@/src/modules/journal/contracts/journal-decision-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import type {
  JournalDataDecisionItem,
  JournalDataDecisionStatementReadModel,
  JournalDataDecisionsReadModel,
  JournalImportHistoryItem,
} from "@/src/modules/journal/contracts/journal-product-read-models";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { DashboardPage, DashboardPanel } from "../../dashboard-template";

const ENDPOINT = "/api/platform/journal/data-decisions";

const ACTION_LABELS: Readonly<Partial<Record<JournalDecisionAction, string>>> = {
  correct_execution_fact: "Fix this row",
  set_execution_order: "Set execution order",
  exclude_execution: "Do not use this as a trade execution",
  restore_execution: "Restore this execution",
  merge_supported_duplicate: "Match this to the broker execution",
  reconcile_grouped_fills: "Match this to the broker fills",
  keep_distinct: "These are separate executions",
  correct_position_fact: "Correct the statement position",
  add_missing_execution: "Fix this row",
  supply_opening_inventory: "Add earlier executions",
  supply_position_fact: "Add the statement position",
  supply_coverage_fact: "Confirm the statement period",
  accept_source_limitation: "Keep this out of your trade results",
  confirm_legitimate_open_position: "Confirm the open position",
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
  const confirmation = item.openPositionConfirmation ?? null;
  const firstPosition = confirmation
    ? item.positionFacts.find((fact) =>
        fact.positionFactId === confirmation.contradictoryPositionFactId) ?? item.positionFacts[0] ?? null
    : item.positionFacts[0] ?? null;
  const firstExecution = item.executions[0] ?? null;
  const manualExecution = item.executions.find((execution) =>
    execution.sourceLabel === "Manual entry") ?? null;
  const brokerExecution = item.executions.find((execution) =>
    execution.sourceLabel === "Broker statement") ?? null;
  const firstExecutionTime = sourceDateTime(
    firstExecution?.sourceTimestampText,
    firstExecution?.executedAtUtc,
  );
  const effectiveDate = item.effectiveAtUtc?.slice(0, 10) ??
    firstPosition?.effectiveLocalDate ?? "";
  const action = confirmation ? "confirm_legitimate_open_position" as const : item.allowedActions.find((candidate) =>
    candidate in ACTION_LABELS) ?? "";
  const beginsWithExecution = SINGLE_EXECUTION_ACTIONS.includes(
    action as (typeof SINGLE_EXECUTION_ACTIONS)[number],
  ) || action === "merge_supported_duplicate";
  return Object.freeze({
    action,
    executionId: action === "correct_execution_fact"
      ? manualExecution?.executionId ?? firstExecution?.executionId ?? ""
      : brokerExecution?.executionId ?? firstExecution?.executionId ?? "",
    retainedExecutionId: manualExecution?.executionId ??
      item.executions[1]?.executionId ?? firstExecution?.executionId ?? "",
    sameTimestampSequence: "1",
      positionFactId: confirmation?.supportedPositionFactId ?? firstPosition?.positionFactId ?? "",
    factKind: firstPosition?.factKind ?? "closing_balance",
    timePrecision: "date",
    quantityDecimal: confirmation?.supportedQuantityDecimal ?? (beginsWithExecution
      ? firstExecution?.quantityDecimal ?? "0"
      : firstPosition?.quantityDecimal ?? "0"),
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
  });
}

function issueTitle(issueCode: string): string {
  const known: Readonly<Record<string, string>> = {
    conflicting_position_facts: "The statement contains conflicting position totals",
    position_fact_mismatch: "Executions and the statement position do not agree",
    opening_inventory_required: "An opening position is needed",
    manual_trading_day_coverage_unconfirmed: "Manual entries do not prove the full trading day",
    manual_broker_possible_duplicate: "A broker execution may match a manual entry",
    manual_broker_grouped_fill_candidate: "Broker fills may match a manual entry",
  };
  return known[issueCode] ?? issueCode.replaceAll("_", " ").replace(/^./u, (letter) => letter.toUpperCase());
}

function actionLabel(
  item: JournalDataDecisionItem,
  action: JournalDecisionAction,
): string | undefined {
  if (item.targetKind === "overlap_set" && action === "correct_execution_fact") {
    return "Correct the manual entry";
  }
  return ACTION_LABELS[action];
}

function displayDecimal(value: string | null): string {
  return value === null ? "N/A" : formatJournalAnalyticsDecimal(value);
}

function executionOptionLabel(
  execution: JournalDataDecisionItem["executions"][number],
): string {
  const source = execution.sourceLabel ?? "Execution";
  const executed = execution.executedAtUtc
    .replace("T", " ")
    .replace(".000Z", " UTC");
  return `${source} · ${execution.symbol} · ${executed} · ${execution.side} ${displayDecimal(execution.quantityDecimal)} @ ${displayDecimal(execution.priceDecimal)}`;
}

type DataDecisionsView = "trades" | "statement-issues" | "statement-details";
type ConfirmedOpenPosition = Readonly<{
  expectedRevision: number | null;
  positionRef: string;
}>;
type OpenPositionClassification = "swing" | "long_term_hold" | "bag_hold";

function OpenPositionClassificationCard({
  expectedAccountSelectionRef,
  onSaved,
  position,
}: {
  expectedAccountSelectionRef: string;
  onSaved: () => void;
  position: ConfirmedOpenPosition;
}) {
  const [classification, setClassification] = useState<OpenPositionClassification>("swing");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const change = classification === "swing"
      ? { tradeStyle: "swing", openStatus: "swing", reason: "reclassified" }
      : classification === "bag_hold"
        ? { tradeStyle: "other", openStatus: "unplanned_hold", reason: "unplanned_hold" }
        : { tradeStyle: "other", openStatus: "other", reason: "other" };
    try {
      const response = await fetch(
        `/api/platform/journal/trade-style/${encodeURIComponent(position.positionRef)}`,
        {
          body: JSON.stringify({
            ...change,
            claimedEffectiveAtUtc: new Date().toISOString(),
            expectedAccountSelectionRef,
            expectedRevision: position.expectedRevision,
            idempotencyKey: crypto.randomUUID(),
            plannedFromEntry: false,
            sourceUi: "data_decisions",
          }),
          headers: {
            "content-type": "application/json",
            [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
          },
          method: "POST",
        },
      );
      const body = await response.json() as { status?: string };
      if (!response.ok || body.status !== "ready") {
        throw new Error("classification_save_failed");
      }
      onSaved();
    } catch {
      setError("This trade type could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardPanel title="Open position">
      <Stack spacing={1.5}>
        <Typography>How would you like to classify this open position?</Typography>
        <TextField
          label="Trade type"
          onChange={(event) => setClassification(event.target.value as OpenPositionClassification)}
          select
          value={classification}
        >
          <MenuItem value="swing">Active swing</MenuItem>
          <MenuItem value="long_term_hold">Long-term hold</MenuItem>
          <MenuItem value="bag_hold">Bag hold</MenuItem>
        </TextField>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Button disabled={saving} onClick={() => void save()} sx={{ alignSelf: "flex-start" }} variant="contained">
          {saving ? "Saving..." : "Save trade type"}
        </Button>
      </Stack>
    </DashboardPanel>
  );
}

function statementClassificationLabel(
  value: JournalDataDecisionStatementReadModel["rows"][number]["initialClassification"],
): string {
  const labels: Readonly<Record<typeof value, string>> = {
    mapped_execution: "Execution",
    mapped_position_fact: "Position record",
    mapped_coverage_fact: "Statement coverage",
    automatic_non_execution: "Other statement row",
    unsupported: "Not used for trading data",
    needs_correction: "Needs a look",
  };
  return labels[value];
}

function StatementRows({
  imports,
  onImportChange,
  onReviewRow,
  onlyIssues,
  selectedImportBatchId,
  statement,
}: {
  imports: readonly JournalImportHistoryItem[];
  onImportChange: (importBatchId: string) => void;
  onReviewRow: (recordOrdinal: number) => void;
  onlyIssues: boolean;
  selectedImportBatchId: string;
  statement: JournalDataDecisionStatementReadModel | null;
}) {
  const rows = statement?.rows.filter((row) =>
    !onlyIssues || row.issues.length > 0 || row.initialClassification === "needs_correction") ?? [];
  const title = onlyIssues ? "Statement issues" : "Statement details";
  return (
    <DashboardPanel title={title}>
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="Statement"
          onChange={(event) => onImportChange(event.target.value)}
          select
          size="small"
          value={selectedImportBatchId}
        >
          {imports.map((item) => (
            <MenuItem key={item.importBatchId} value={item.importBatchId}>
              {item.sourceDisplayLabel}
            </MenuItem>
          ))}
        </TextField>
        {!statement ? <Typography color="text.secondary">Loading statement rows...</Typography> : null}
        {statement && rows.length === 0 ? (
          <Alert severity="success">This statement has no rows waiting for a decision.</Alert>
        ) : null}
        {rows.length > 0 ? (
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Imported details</TableCell>
                <TableCell>Review</TableCell>
              </TableRow></TableHead>
              <TableBody>{rows.map((row) => (
                <TableRow key={row.recordOrdinal}>
                  <TableCell>{row.recordOrdinal}</TableCell>
                  <TableCell>{row.sectionName ?? statementClassificationLabel(row.initialClassification)}</TableCell>
                  <TableCell sx={{ maxWidth: 620, whiteSpace: "normal" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{row.fields.join(" · ") || "The imported values could not be read."}</Typography>
                      {row.issues.map((issue, index) => (
                        <Chip color={issue.severity === "error" ? "error" : "warning"} key={`${row.recordOrdinal}-${index}`} label={issue.message} size="small" sx={{ alignSelf: "flex-start" }} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {row.issues.length > 0 || row.initialClassification === "needs_correction" ? (
                      <Button onClick={() => onReviewRow(row.recordOrdinal)} size="small">Review this row</Button>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Stack>
    </DashboardPanel>
  );
}

function DecisionCard({
  cardNumber,
  expectedAccountSelectionRef,
  item,
  onOpenPositionConfirmed,
  onResolved,
  shouldFocus,
}: {
  cardNumber: number;
  expectedAccountSelectionRef: string;
  item: JournalDataDecisionItem;
  onOpenPositionConfirmed: (position: ConfirmedOpenPosition) => void;
  onResolved: () => Promise<void>;
  shouldFocus: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(item));
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFocus) return;
    setExpanded(true);
    document.getElementById(`data-decision-card-${cardNumber}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [cardNumber, shouldFocus]);

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((current) => Object.freeze({ ...current, [field]: value }));
  }

  function chooseAction(action: Draft["action"]) {
    const defaults = initialDraft(Object.freeze({
      ...item,
      allowedActions: action ? Object.freeze([action]) : Object.freeze([]),
    }));
    setDraft(() => Object.freeze({
      ...defaults,
      action,
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

  async function save(submittedDraft: Draft = draft): Promise<ConfirmedOpenPosition | null> {
    if (!submittedDraft.action || saving) return null;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        action: submittedDraft.action,
        decisionId: item.decisionId,
        expectedAccountSelectionRef,
        expectedRevision: item.revision,
      };
      if (submittedDraft.action === "correct_position_fact" || submittedDraft.action === "confirm_legitimate_open_position") {
        body.positionFactId = submittedDraft.positionFactId;
      }
      if (submittedDraft.action === "correct_position_fact") body.quantityDecimal = submittedDraft.quantityDecimal;
      if (SINGLE_EXECUTION_ACTIONS.includes(
        submittedDraft.action as (typeof SINGLE_EXECUTION_ACTIONS)[number],
      )) {
        body.executionId = submittedDraft.executionId;
      }
      if (submittedDraft.action === "correct_execution_fact") {
        Object.assign(body, {
          sourceTimestampText: `${submittedDraft.date}, ${submittedDraft.time}`,
          sourceTimezone: submittedDraft.sourceTimezone,
          side: submittedDraft.side,
          quantityDecimal: submittedDraft.quantityDecimal,
          priceDecimal: submittedDraft.priceDecimal || null,
          feesDecimal: submittedDraft.feesDecimal || null,
          feeCurrency: submittedDraft.feesDecimal ? submittedDraft.currency : null,
          feeSignConvention: submittedDraft.feeSignConvention,
        });
      }
      if (submittedDraft.action === "set_execution_order") {
        body.sameTimestampSequence = Number(submittedDraft.sameTimestampSequence);
      }
      if (submittedDraft.action === "merge_supported_duplicate") {
        body.duplicateExecutionId = submittedDraft.executionId;
        body.retainedExecutionId = submittedDraft.retainedExecutionId;
      }
      if (submittedDraft.action === "supply_opening_inventory") {
        Object.assign(body, {
          effectiveLocalDate: submittedDraft.effectiveLocalDate,
          sourceTimezone: submittedDraft.sourceTimezone,
          quantityDecimal: submittedDraft.quantityDecimal,
        });
      }
      if (submittedDraft.action === "supply_position_fact") {
        Object.assign(body, {
          factKind: submittedDraft.factKind,
          effectiveLocalDate: submittedDraft.effectiveLocalDate,
          timePrecision: submittedDraft.timePrecision,
          sourceTimeText: submittedDraft.time,
          sourceTimezone: submittedDraft.sourceTimezone,
          quantityDecimal: submittedDraft.quantityDecimal,
        });
      }
      if (submittedDraft.action === "supply_coverage_fact") body.coverageKind = submittedDraft.coverageKind;
      if (submittedDraft.action === "add_missing_execution") {
        body.execution = {
          sourceTimestampText: `${submittedDraft.date}, ${submittedDraft.time}`,
          sourceTimezone: submittedDraft.sourceTimezone,
          normalizedSymbol: submittedDraft.symbol,
          tradeCurrency: submittedDraft.currency,
          side: submittedDraft.side,
          quantityDecimal: submittedDraft.quantityDecimal,
          priceDecimal: submittedDraft.priceDecimal || null,
          feesDecimal: submittedDraft.feesDecimal || null,
          feeCurrency: submittedDraft.feesDecimal ? submittedDraft.currency : null,
        };
      }
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify(body),
      });
      const packet = await response.json() as {
        code?: string;
        result?: Readonly<{ openPosition?: ConfirmedOpenPosition | null }>;
      };
      if (!response.ok) throw new Error(packet.code ?? "The decision could not be saved.");
      await onResolved();
      return packet.result?.openPosition ?? null;
    } catch {
      setError("This change could not be saved. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  const exposedActions = item.allowedActions.filter((action) => action in ACTION_LABELS);
  const selectedExecution = item.executions.find((execution) =>
    execution.executionId === draft.executionId) ?? null;
  const manualExecutions = item.executions.filter((execution) =>
    execution.sourceLabel === "Manual entry");
  const brokerExecutions = item.executions.filter((execution) =>
    execution.sourceLabel === "Broker statement");
  const correctionExecutions = item.targetKind === "overlap_set" && manualExecutions.length > 0
    ? manualExecutions
    : item.executions;
  const duplicateExecutions = item.targetKind === "overlap_set" && brokerExecutions.length > 0
    ? brokerExecutions
    : item.executions;
  const retainedExecutions = item.targetKind === "overlap_set" && manualExecutions.length > 0
    ? manualExecutions
    : item.executions;
  const openPositionConfirmation = item.openPositionConfirmation ?? null;
  const confirmSupportedOpenPosition = () => {
    if (!openPositionConfirmation) return;
    const confirmationDraft = Object.freeze({
      ...draft,
      action: "confirm_legitimate_open_position" as const,
      positionFactId: openPositionConfirmation.supportedPositionFactId,
    });
    void save(confirmationDraft).then((position) => {
      if (position) onOpenPositionConfirmed(position);
    });
  };
  return (
    <Box id={`data-decision-card-${cardNumber}`} sx={{ scrollMarginTop: 96 }}>
    <DashboardPanel title={issueTitle(item.issueCode)}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
          <Chip color="warning" label="Needs your decision" size="small" />
          {item.symbol ? <Chip label={`${item.symbol}${item.currency ? ` · ${item.currency}` : ""}`} size="small" variant="outlined" /> : null}
          {item.sourceRowNumber ? <Chip label={`Statement row ${item.sourceRowNumber}`} size="small" variant="outlined" /> : null}
        </Stack>
        <Typography sx={{ fontWeight: 800 }} variant="body1">{item.question}</Typography>
        <Typography color="text.secondary" variant="body2">{item.impactSummary}</Typography>
        {openPositionConfirmation ? (
          <Stack spacing={1}>
            <Alert severity="info">
              The later purchases and the statement&apos;s Open Positions section support {displayDecimal(openPositionConfirmation.supportedQuantityDecimal)} shares. The earlier completed trade is separate.
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button disabled={saving} onClick={confirmSupportedOpenPosition} variant="contained">
                {saving ? "Saving..." : `Yes — ${displayDecimal(openPositionConfirmation.supportedQuantityDecimal)} shares are still open`}
              </Button>
              <Button onClick={() => setExpanded(true)} variant="outlined">
                No — review statement details
              </Button>
            </Stack>
          </Stack>
        ) : null}
        <Button
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          sx={{ alignSelf: "flex-start" }}
          variant="outlined"
        >
          {expanded ? "Hide details" : openPositionConfirmation ? "Review statement details" : "Review and decide"}
        </Button>

        {expanded ? (
        <Stack spacing={2}>

        {item.executions.length > 0 ? (
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }} variant="subtitle2">Executions used by this trade</Typography>
            <TableContainer sx={{ maxHeight: 280 }}><Table size="small" stickyHeader><TableHead><TableRow><TableCell>Source</TableCell><TableCell>Executed</TableCell><TableCell>Side</TableCell><TableCell align="right">Shares</TableCell><TableCell align="right">Price</TableCell></TableRow></TableHead><TableBody>{item.executions.map((execution) => (
              <TableRow key={execution.executionId}><TableCell>{execution.sourceLabel ?? "Execution"}</TableCell><TableCell>{execution.executedAtUtc.replace("T", " ").replace(".000Z", " UTC")}</TableCell><TableCell>{execution.side}</TableCell><TableCell align="right">{displayDecimal(execution.quantityDecimal)}</TableCell><TableCell align="right">{displayDecimal(execution.priceDecimal)}</TableCell></TableRow>
            ))}</TableBody></Table></TableContainer>
          </Box>
        ) : null}

        {item.flaggedStatementRow ? (
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }} variant="subtitle2">Statement row needing attention</Typography>
            <Box sx={{ bgcolor: "action.hover", borderRadius: 1, px: 1.5, py: 1 }}>
              <Typography variant="body2">
                Row {item.flaggedStatementRow.recordOrdinal}
                {item.flaggedStatementRow.sectionName ? ` · ${item.flaggedStatementRow.sectionName}` : ""}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {item.flaggedStatementRow.fields.join(" · ") || "The imported values could not be read."}
              </Typography>
            </Box>
          </Box>
        ) : null}

        <Divider />
        <Typography variant="body2">Choose the option that matches your broker statement.</Typography>
        {!openPositionConfirmation ? <TextField
          label="How would you like to resolve this?"
          onChange={(event) => chooseAction(event.target.value as Draft["action"])}
          select
          value={draft.action}
        >
          {exposedActions.map((action) => <MenuItem key={action} value={action}>{actionLabel(item, action)}</MenuItem>)}
        </TextField> : null}

        {SINGLE_EXECUTION_ACTIONS.includes(
          draft.action as (typeof SINGLE_EXECUTION_ACTIONS)[number],
        ) && !(item.targetKind === "overlap_set" && draft.action === "keep_distinct") ? (
          <TextField
            label="Execution"
            onChange={(event) => chooseExecution(event.target.value)}
            select
            value={draft.executionId}
          >
            {(draft.action === "correct_execution_fact"
              ? correctionExecutions
              : item.executions).map((execution) => (
              <MenuItem key={execution.executionId} value={execution.executionId}>
                {executionOptionLabel(execution)}
              </MenuItem>
            ))}
          </TextField>
        ) : null}

        {draft.action === "merge_supported_duplicate" ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField fullWidth label={item.targetKind === "overlap_set" ? "Broker execution to match" : "Duplicate execution"} onChange={(event) => chooseExecution(event.target.value)} select value={draft.executionId}>
              {duplicateExecutions.map((execution) => <MenuItem key={execution.executionId} value={execution.executionId}>{executionOptionLabel(execution)}</MenuItem>)}
            </TextField>
            <TextField fullWidth label={item.targetKind === "overlap_set" ? "Manual entry to keep" : "Execution to keep"} onChange={(event) => update("retainedExecutionId", event.target.value)} select value={draft.retainedExecutionId}>
              {retainedExecutions.map((execution) => <MenuItem key={execution.executionId} value={execution.executionId}>{executionOptionLabel(execution)}</MenuItem>)}
            </TextField>
          </Stack>
        ) : null}

        {draft.action === "correct_execution_fact" ? (
          <Stack spacing={1.5}>
            <Alert severity="info">
              Current: {selectedExecution ? `${selectedExecution.side} ${displayDecimal(selectedExecution.quantityDecimal)} @ ${displayDecimal(selectedExecution.priceDecimal)}` : "N/A"}. Corrected: {draft.side} {displayDecimal(draft.quantityDecimal || null)} @ {displayDecimal(draft.priceDecimal || null)}.
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
            <Typography color="text.secondary" variant="caption">Ticker and currency stay on the original chain. If either is wrong, exclude this execution and add the correct missing execution.</Typography>
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

        {!openPositionConfirmation && (draft.action === "correct_position_fact" || draft.action === "confirm_legitimate_open_position") ? (
          <TextField label="Statement position" onChange={(event) => {
            const selected = item.positionFacts.find((fact) => fact.positionFactId === event.target.value);
            update("positionFactId", event.target.value);
            if (selected) update("quantityDecimal", selected.quantityDecimal);
          }} select value={draft.positionFactId}>
            {item.positionFacts.map((fact) => <MenuItem key={fact.positionFactId} value={fact.positionFactId}>{fact.effectiveLocalDate} · {fact.factKind.replaceAll("_", " ")} · {displayDecimal(fact.quantityDecimal)}</MenuItem>)}
          </TextField>
        ) : null}

        {draft.action === "correct_position_fact" || draft.action === "supply_opening_inventory" || draft.action === "supply_position_fact" ? (
          <TextField helperText="Enter the exact number of shares shown by your broker." label="Shares" onChange={(event) => update("quantityDecimal", event.target.value)} value={draft.quantityDecimal} />
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
            <TextField label="Ticker" onChange={(event) => update("symbol", event.target.value.toUpperCase())} value={draft.symbol} />
            <TextField label="Side" onChange={(event) => update("side", event.target.value as Draft["side"])} select value={draft.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
            <TextField label="Shares" onChange={(event) => update("quantityDecimal", event.target.value)} value={draft.quantityDecimal} />
            <TextField label="Price" onChange={(event) => update("priceDecimal", event.target.value)} value={draft.priceDecimal} />
            <TextField label="Fees (optional)" onChange={(event) => update("feesDecimal", event.target.value)} value={draft.feesDecimal} />
          </Box>
        ) : null}

        {draft.action === "accept_source_limitation" ? (
          <Alert severity="warning">Use this only when the source truly cannot provide the missing fact. The affected analytics will remain limited.</Alert>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}
        <Button disabled={!draft.action || saving} onClick={() => void save()} variant="contained">{saving ? "Saving..." : "Save changes"}</Button>
        </Stack>
        ) : null}
      </Stack>
    </DashboardPanel>
    </Box>
  );
}

export function JournalDataDecisionsClient({
  expectedAccountSelectionRef,
  imports,
  initial,
  selectedImportBatchId,
}: {
  expectedAccountSelectionRef: string;
  imports: readonly JournalImportHistoryItem[];
  initial: JournalDataDecisionsReadModel;
  selectedImportBatchId: string | null;
}) {
  const [model, setModel] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<DataDecisionsView>("trades");
  const [focusedDecisionIndex, setFocusedDecisionIndex] = useState<number | null>(null);
  const [openPositionToClassify, setOpenPositionToClassify] = useState<ConfirmedOpenPosition | null>(null);
  const [statement, setStatement] = useState<JournalDataDecisionStatementReadModel | null>(null);
  const [statementImportBatchId, setStatementImportBatchId] = useState(() =>
    selectedImportBatchId ?? imports.find((item) => item.issueCount > 0)?.importBatchId ?? imports[0]?.importBatchId ?? "");
  const pending = selectedImportBatchId
    ? model.pending.filter((item) => item.importBatchIds.includes(selectedImportBatchId))
    : model.pending;
  const resolved = selectedImportBatchId
    ? model.resolved.filter((item) => item.importBatchIds.includes(selectedImportBatchId))
    : model.resolved;

  useEffect(() => {
    if (!statementImportBatchId) return;
    let cancelled = false;
    void fetch(`${ENDPOINT}?importBatchId=${encodeURIComponent(statementImportBatchId)}`, {
      cache: "no-store",
    }).then(async (response) => {
      const packet = await response.json() as {
        decisions?: JournalDataDecisionsReadModel;
        statement?: JournalDataDecisionStatementReadModel | null;
      };
      if (cancelled || !response.ok) return;
      if (packet.decisions) setModel(packet.decisions);
      setStatement(packet.statement ?? null);
    }).catch(() => {
      if (!cancelled) setStatement(null);
    });
    return () => { cancelled = true; };
  }, [statementImportBatchId]);

  const selectedStatement = statement?.importBatchId === statementImportBatchId
    ? statement
    : null;

  async function refresh() {
    const response = await fetch(ENDPOINT, { cache: "no-store" });
    const packet = await response.json() as { decisions?: JournalDataDecisionsReadModel };
    if (response.ok && packet.decisions) {
      setModel(packet.decisions);
      setNotice("Decision saved. TraderLink rebuilt the affected account facts.");
    }
  }

  function reviewStatementRow(recordOrdinal: number) {
    const index = pending.findIndex((item) =>
      item.sourceRowNumber === recordOrdinal &&
      item.importBatchIds.includes(statementImportBatchId));
    if (index < 0) return;
    setFocusedDecisionIndex(index);
    setView("trades");
  }

  return (
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">Data Decisions</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
          Review your imported statement rows and decide how flagged trades should be handled.
        </Typography>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button onClick={() => setView("trades")} variant={view === "trades" ? "contained" : "outlined"}>Trades needing a decision</Button>
        <Button onClick={() => setView("statement-issues")} variant={view === "statement-issues" ? "contained" : "outlined"}>Statement issues</Button>
        <Button onClick={() => setView("statement-details")} variant={view === "statement-details" ? "contained" : "outlined"}>Statement details</Button>
      </Stack>
      {notice ? <Alert severity="success">{notice}</Alert> : null}
      {openPositionToClassify ? (
        <OpenPositionClassificationCard
          expectedAccountSelectionRef={expectedAccountSelectionRef}
          onSaved={() => {
            setOpenPositionToClassify(null);
            void refresh();
          }}
          position={openPositionToClassify}
        />
      ) : null}
      {view === "trades" && pending.length === 0 ? (
        <Alert severity="success">There are no trades waiting for a decision.</Alert>
      ) : null}
      {view === "trades" ? pending.map((item, index) => (
        <DecisionCard
          cardNumber={index + 1}
          expectedAccountSelectionRef={expectedAccountSelectionRef}
          item={item}
          key={item.decisionId}
          onOpenPositionConfirmed={setOpenPositionToClassify}
          onResolved={refresh}
          shouldFocus={focusedDecisionIndex === index}
        />
      )) : null}
      {view === "statement-issues" || view === "statement-details" ? (
        <StatementRows
          imports={imports}
          onImportChange={(importBatchId) => {
            setStatementImportBatchId(importBatchId);
            setFocusedDecisionIndex(null);
          }}
          onReviewRow={reviewStatementRow}
          onlyIssues={view === "statement-issues"}
          selectedImportBatchId={statementImportBatchId}
          statement={selectedStatement}
        />
      ) : null}
      {view === "trades" && resolved.length > 0 ? (
        <DashboardPanel title="Resolved decisions">
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Issue</TableCell><TableCell>Ticker</TableCell><TableCell>Updated</TableCell></TableRow></TableHead><TableBody>{resolved.slice(0, 100).map((item) => (
            <TableRow key={item.decisionId}><TableCell>{issueTitle(item.issueCode)}</TableCell><TableCell>{item.symbol ?? "Account-wide"}</TableCell><TableCell>{item.updatedAtUtc.replace("T", " ").replace(".000Z", " UTC")}</TableCell></TableRow>
          ))}</TableBody></Table></TableContainer>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}

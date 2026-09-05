"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  CoachAiManualEntryDraft,
  CoachAiManualExecutionExtractionRow,
} from "@/src/modules/coach/contracts/ai-manual-entry-draft-contracts";
import type {
  JournalManualTrackerKind,
  JournalManualTradeGroupConfirmation,
  JournalManualTradePreview,
  JournalManualTradeRelationship,
  JournalTradeStyle,
} from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

type PreviewResponse = Readonly<{
  status?: string;
  code?: string;
  draft?: CoachAiManualEntryDraft;
  preview?: JournalManualTradePreview;
}>;

type CommitResponse = Readonly<{
  status?: string;
  code?: string;
  draft?: CoachAiManualEntryDraft;
  result?: Readonly<{
    acceptedExecutionCount: number;
    pendingDecisionCount: number;
    affectedDates: readonly string[];
  }> | null;
}>;

function relationshipLabel(value: JournalManualTradeRelationship): string {
  if (value === "start_new_trade") return "Start a new trade";
  if (value === "continue_tracked_position") return "Add to the open trade";
  if (value === "close_tracked_position") return "Close the open trade";
  return "More executions are needed";
}

function styleLabel(value: JournalTradeStyle): string {
  if (value === "day_trade") return "Day trade";
  if (value === "swing") return "Swing trade";
  return "Other open position";
}

function friendlyError(code?: string): string {
  if (code === "conflict") {
    return "The account or an open trade changed. Review the executions again.";
  }
  if (code === "invalid_request") {
    return "Check every execution and fill in the required details.";
  }
  return "This draft could not be updated right now. Your entries are still here.";
}

function editableRows(draft: CoachAiManualEntryDraft): CoachAiManualExecutionExtractionRow[] {
  return draft.rows.map((row) => ({
    clientRowRef: row.clientRowRef,
    localDate: row.localDate,
    localTime: row.localTime,
    normalizedSymbol: row.normalizedSymbol,
    side: row.side,
    quantityDecimal: row.quantityDecimal,
    priceDecimal: row.priceDecimal,
    feesDecimal: row.feesDecimal,
  }));
}

export function AiChatManualEntryCard({
  conversationId,
  draft,
  onDraftChange,
}: Readonly<{
  conversationId: string;
  draft: CoachAiManualEntryDraft;
  onDraftChange: (draft: CoachAiManualEntryDraft) => void;
}>) {
  const commitRequestId = useRef<string | null>(null);
  const [rows, setRows] = useState<CoachAiManualExecutionExtractionRow[]>(() => editableRows(draft));
  const [tracker, setTracker] = useState<JournalManualTrackerKind>("quick");
  const [preview, setPreview] = useState<JournalManualTradePreview | null>(null);
  const [confirmations, setConfirmations] = useState<readonly JournalManualTradeGroupConfirmation[]>([]);
  const [completeSetConfirmed, setCompleteSetConfirmed] = useState(false);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeSeverity, setNoticeSeverity] = useState<"info" | "success">("info");

  useEffect(() => {
    setRows(editableRows(draft));
    if (draft.state !== "ready_for_confirmation") {
      setPreview(null);
      setConfirmations([]);
      setCompleteSetConfirmed(false);
    }
  }, [draft]);

  const complete = useMemo(() => rows.every((row) =>
    row.localDate && row.localTime && row.normalizedSymbol && row.side &&
    row.quantityDecimal && row.priceDecimal), [rows]);

  function updateRow(
    clientRowRef: string,
    field: Exclude<keyof CoachAiManualExecutionExtractionRow, "clientRowRef">,
    value: string,
  ): void {
    setRows((current) => current.map((row) => row.clientRowRef === clientRowRef
      ? { ...row, [field]: value.trim().length === 0 ? null : value }
      : row));
    setPreview(null);
    setConfirmations([]);
    setCompleteSetConfirmed(false);
    commitRequestId.current = null;
    setNoticeSeverity("info");
    setNotice(null);
  }

  function addRow(): void {
    const next = rows.reduce((maximum, row) => {
      const value = Number(row.clientRowRef.replace(/^row-/u, ""));
      return Number.isSafeInteger(value) ? Math.max(maximum, value) : maximum;
    }, 0) + 1;
    setRows((current) => [...current, {
      clientRowRef: `row-${next}`,
      localDate: current.at(-1)?.localDate ?? null,
      localTime: null,
      normalizedSymbol: current.at(-1)?.normalizedSymbol ?? null,
      side: null,
      quantityDecimal: null,
      priceDecimal: null,
      feesDecimal: null,
    }]);
    setPreview(null);
    setConfirmations([]);
    setCompleteSetConfirmed(false);
  }

  async function reviewExecutions(): Promise<void> {
    if (!complete || working) return;
    setWorking(true);
    setNoticeSeverity("info");
    setNotice(null);
    try {
      const response = await fetch(`/api/coach/chat/conversations/${conversationId}/manual-entry-drafts/${draft.draftId}/preview`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({ tracker, rows }),
      });
      const body = await response.json() as PreviewResponse;
      if (!response.ok || body.status !== "ready" || !body.preview || !body.draft) {
        throw new Error(friendlyError(body.code));
      }
      const nextConfirmations = body.preview.groups.map((group) => {
        const relationships = group.allowedRelationships.filter((value) => value !== "not_finished");
        return Object.freeze({
          groupRef: group.groupRef,
          relationship: relationships[0] ?? "not_finished",
          style: group.suggestedStyle,
          existingPositionRef: group.existingPosition?.positionRef ?? null,
          completeExecutionSetConfirmed: false,
        });
      });
      setPreview(body.preview);
      setConfirmations(Object.freeze(nextConfirmations));
      setCompleteSetConfirmed(false);
      onDraftChange(body.draft);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : friendlyError());
    } finally {
      setWorking(false);
    }
  }

  function updateConfirmation(
    groupRef: string,
    field: "relationship" | "style",
    value: string,
  ): void {
    setConfirmations((current) => current.map((confirmation) =>
      confirmation.groupRef === groupRef
        ? { ...confirmation, [field]: value }
        : confirmation) as readonly JournalManualTradeGroupConfirmation[]);
    commitRequestId.current = null;
  }

  async function saveExecutions(): Promise<void> {
    if (!preview || !completeSetConfirmed || working ||
        confirmations.some((item) => item.relationship === "not_finished")) return;
    setWorking(true);
    setNoticeSeverity("info");
    setNotice(null);
    const clientRequestId = commitRequestId.current ?? crypto.randomUUID();
    commitRequestId.current = clientRequestId;
    try {
      const response = await fetch(`/api/coach/chat/conversations/${conversationId}/manual-entry-drafts/${draft.draftId}/commit`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({
          tracker,
          previewRef: preview.previewRef,
          clientRequestId,
          confirmations,
        }),
      });
      const body = await response.json() as CommitResponse;
      if (!response.ok || body.status !== "ready" || !body.draft) {
        throw new Error(friendlyError(body.code));
      }
      onDraftChange(body.draft);
      commitRequestId.current = null;
      setNoticeSeverity("success");
      setNotice(body.result && body.result.pendingDecisionCount > 0
        ? `Executions saved. ${body.result.pendingDecisionCount} item${body.result.pendingDecisionCount === 1 ? "" : "s"} can be reviewed in Data Decisions.`
        : "Executions saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : friendlyError());
    } finally {
      setWorking(false);
    }
  }

  const expired = draft.state === "expired" ||
    (draft.expiresAtUtc !== null && Date.parse(draft.expiresAtUtc) <= Date.now());

  if (draft.state === "committed") {
    return <Alert severity="success">These executions are saved in your Trade Tracker.</Alert>;
  }
  if (expired) {
    return <Alert severity="info">This execution draft expired. Start trade entry again to create a fresh draft.</Alert>;
  }

  return (
    <Paper sx={{ bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "#F7FAFF", borderColor: (theme) => theme.palette.mode === "dark" ? theme.palette.divider : "#B9CFF1", p: { xs: 1.5, sm: 2 } }} variant="outlined">
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 850 }} variant="h3">Execution draft</Typography>
        <Typography color="text.secondary" variant="body2">
          Review every row before saving. Exact broker dates, Eastern times, prices and quantities make later statement matching more reliable.
        </Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ mt: 2 }}>
        {rows.map((row, index) => (
          <Box
            key={row.clientRowRef}
            sx={{
              alignItems: { md: "center" },
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "1fr 1fr",
                md: "70px 138px 108px 92px 112px 100px 100px 90px 36px",
              },
            }}
          >
            <Typography color="text.secondary" sx={{ fontWeight: 750, gridColumn: { xs: "1 / -1", md: "auto" } }} variant="caption">
              Execution {index + 1}
            </Typography>
            <TextField label="Date" onChange={(event) => updateRow(row.clientRowRef, "localDate", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={row.localDate ?? ""} />
            <TextField label="Time (Eastern)" onChange={(event) => updateRow(row.clientRowRef, "localTime", event.target.value)} size="small" slotProps={{ htmlInput: { step: 1 }, inputLabel: { shrink: true } }} type="time" value={row.localTime ?? ""} />
            <TextField label="Ticker" onChange={(event) => updateRow(row.clientRowRef, "normalizedSymbol", event.target.value.toUpperCase())} size="small" value={row.normalizedSymbol ?? ""} />
            <TextField label="Side" onChange={(event) => updateRow(row.clientRowRef, "side", event.target.value)} select size="small" value={row.side ?? ""}>
              <MenuItem value="buy">Buy</MenuItem>
              <MenuItem value="sell">Sell</MenuItem>
            </TextField>
            <TextField label="Quantity" onChange={(event) => updateRow(row.clientRowRef, "quantityDecimal", event.target.value)} size="small" value={row.quantityDecimal ?? ""} />
            <TextField label="Price" onChange={(event) => updateRow(row.clientRowRef, "priceDecimal", event.target.value)} size="small" value={row.priceDecimal ?? ""} />
            <TextField label="Fees" onChange={(event) => updateRow(row.clientRowRef, "feesDecimal", event.target.value)} placeholder="Optional" size="small" value={row.feesDecimal ?? ""} />
            <IconButton aria-label={`Remove execution ${index + 1}`} disabled={rows.length === 1} onClick={() => {
              setRows((current) => current.filter((item) => item.clientRowRef !== row.clientRowRef));
              setPreview(null);
              setConfirmations([]);
              setCompleteSetConfirmed(false);
            }} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
          </Box>
        ))}
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, mt: 1.5 }}>
        <Button disabled={rows.length >= 20 || working} onClick={addRow} startIcon={<AddRoundedIcon />} variant="text">Add execution</Button>
        <TextField label="Entry type" onChange={(event) => {
          setTracker(event.target.value as JournalManualTrackerKind);
          setPreview(null);
          setConfirmations([]);
          setCompleteSetConfirmed(false);
        }} select size="small" sx={{ minWidth: { xs: 0, sm: 190 }, width: { xs: "100%", sm: "auto" } }} value={tracker}>
          <MenuItem value="quick">Quick trade entry</MenuItem>
          <MenuItem value="swing">Swing trade</MenuItem>
          <MenuItem value="day">Session Tracker</MenuItem>
        </TextField>
        <Button disabled={!complete || working} onClick={() => void reviewExecutions()} variant="contained">
          {working && !preview ? "Reviewing..." : "Review executions"}
        </Button>
      </Stack>
      {tracker === "day" ? (
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
          Session Tracker entries must all use the same trading date.
        </Typography>
      ) : null}

      {preview ? (
        <Stack spacing={1.25} sx={{ borderTop: 1, borderColor: "divider", mt: 2, pt: 2 }}>
          <Typography sx={{ fontWeight: 800 }}>Confirm how these executions fit together</Typography>
          {preview.groups.map((group) => {
            const confirmation = confirmations.find((item) => item.groupRef === group.groupRef);
            const relationships = group.allowedRelationships.filter((value) => value !== "not_finished");
            return (
              <Box key={group.groupRef} sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "minmax(120px, 1fr) minmax(180px, 1fr) minmax(150px, .8fr)" } }}>
                <Typography sx={{ alignSelf: "center", fontWeight: 800 }}>{group.symbol}</Typography>
                <TextField label="Trade relationship" onChange={(event) => updateConfirmation(group.groupRef, "relationship", event.target.value)} select size="small" value={confirmation?.relationship ?? "not_finished"}>
                  {relationships.map((value) => <MenuItem key={value} value={value}>{relationshipLabel(value)}</MenuItem>)}
                  {relationships.length === 0 ? <MenuItem value="not_finished">More executions are needed</MenuItem> : null}
                </TextField>
                <TextField label="Trade type" onChange={(event) => updateConfirmation(group.groupRef, "style", event.target.value)} select size="small" value={confirmation?.style ?? group.suggestedStyle}>
                  {group.allowedStyles.map((value) => <MenuItem key={value} value={value}>{styleLabel(value)}</MenuItem>)}
                </TextField>
              </Box>
            );
          })}
          <FormControlLabel
            control={<Checkbox
              checked={completeSetConfirmed}
              onChange={(event) => {
                const checked = event.target.checked;
                setCompleteSetConfirmed(checked);
                setConfirmations((current) => current.map((confirmation) => ({
                  ...confirmation,
                  completeExecutionSetConfirmed: checked,
                })));
                commitRequestId.current = null;
              }}
            />}
            label="I included every execution for each trade shown above."
          />
          <Button disabled={working || !completeSetConfirmed || confirmations.some((item) => item.relationship === "not_finished")} onClick={() => void saveExecutions()} sx={{ alignSelf: "flex-start" }} variant="contained">
            {working ? "Saving..." : "Save executions"}
          </Button>
        </Stack>
      ) : null}
      {notice ? <Alert severity={noticeSeverity} sx={{ mt: 1.5 }}>{notice}</Alert> : null}
    </Paper>
  );
}

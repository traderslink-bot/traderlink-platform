"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
  Box,
  Card,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import NextLink from "next/link";

import {
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";
import { FeatureHelpLink } from "../feature-help-link";

export type ExecutionDraft = {
  date: string;
  fees: string;
  id: number;
  price: string;
  quantity: string;
  side: "BUY" | "SELL";
  symbol: string;
  time: string;
};

export type ExecutionSaveResult =
  Readonly<{
    status: "saved";
    acceptedExecutionCount: number;
    pendingDecisionCount: number;
  }>;

function newExecution(
  id: number,
  side: "BUY" | "SELL",
  date: string,
): ExecutionDraft {
  return {
    date,
    fees: "",
    id,
    price: "",
    quantity: "",
    side,
    symbol: "",
    time: "",
  };
}

function normalizedDecimal(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith(".")) return `0${trimmed}`;
  if (trimmed.startsWith("-.")) return `-0${trimmed.slice(1)}`;
  return trimmed;
}

export function ExecutionEntryCard({
  collapsed,
  initialExecutions = [],
  onCollapsedChange,
  onDirtyChange,
  onSave,
  onStartAnother,
  onSubmitted,
  allowMultipleTradingDates = false,
  entryMode = "day",
  savingEnabled = true,
  sessionDate,
  submittedCount,
}: {
  collapsed: boolean;
  initialExecutions?: ExecutionDraft[];
  onCollapsedChange: (collapsed: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSave?: (
    executions: readonly ExecutionDraft[],
  ) => Promise<ExecutionSaveResult>;
  onStartAnother?: () => void;
  onSubmitted: (count: number, executions: ExecutionDraft[]) => void;
  allowMultipleTradingDates?: boolean;
  entryMode?: "day" | "quick" | "swing";
  savingEnabled?: boolean;
  sessionDate: string;
  submittedCount: number | null;
}) {
  const [nextId, setNextId] = useState(() =>
    initialExecutions.length > 0
      ? Math.max(...initialExecutions.map((execution) => execution.id)) + 1
      : 3,
  );
  const [rows, setRows] = useState<ExecutionDraft[]>(() =>
    initialExecutions.length > 0
      ? initialExecutions
      : [
          newExecution(1, "BUY", sessionDate),
          newExecution(2, "SELL", sessionDate),
        ],
  );
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | {
        kind: "saved";
        count: number;
        candleReviewKeys: readonly string[];
        candleReviewMessage: string | null;
      }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const hasDraftContent = state.kind !== "saved" && rows.some((row) =>
    row.symbol.trim().length > 0 ||
    row.time.length > 0 ||
    row.quantity.trim().length > 0 ||
    row.price.trim().length > 0 ||
    row.fees.trim().length > 0
  );

  useEffect(() => {
    onDirtyChange?.(hasDraftContent);
    return () => onDirtyChange?.(false);
  }, [hasDraftContent, onDirtyChange]);

  function update(
    id: number,
    field: keyof Omit<ExecutionDraft, "id">,
    value: string,
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
    setState({ kind: "idle" });
  }

  function addExecution() {
    setRows((current) => [
      ...current,
      newExecution(nextId, "BUY", current.at(-1)?.date ?? sessionDate),
    ]);
    setNextId((current) => current + 1);
    setState({ kind: "idle" });
  }

  function removeExecution(id: number) {
    setRows((current) =>
      current.length === 1
        ? current
        : current.filter((row) => row.id !== id),
    );
    setState({ kind: "idle" });
  }

  const complete = rows.every(
    (row) =>
      row.symbol.trim() &&
      /^\d{4}-\d{2}-\d{2}$/u.test(row.date) &&
      row.time &&
      Number(row.quantity) > 0 &&
      Number(row.price) > 0 &&
      (row.fees === "" || Number(row.fees) >= 0),
  );

  async function saveExecutions() {
    if (!savingEnabled || !complete || state.kind === "saving") return;
    if (!allowMultipleTradingDates && new Set(rows.map((row) => row.date)).size !== 1) {
      setState({
        kind: "error",
        message: "Enter executions for one trading day at a time.",
      });
      return;
    }
    setState({ kind: "saving" });
    try {
      const normalizedRows = rows.map((row) => ({
        ...row,
        fees: normalizedDecimal(row.fees),
        price: normalizedDecimal(row.price),
        quantity: normalizedDecimal(row.quantity),
        symbol: row.symbol.trim().toUpperCase(),
      }));
      const saveResult = onSave
        ? await onSave(normalizedRows)
        : null;
      const recordedCount = saveResult?.acceptedExecutionCount ?? rows.length;
      setState({
        kind: "saved",
        candleReviewKeys: [],
        candleReviewMessage: saveResult && saveResult.pendingDecisionCount > 0
          ? `${saveResult.pendingDecisionCount} item${saveResult.pendingDecisionCount === 1 ? "" : "s"} need review in Data Decisions.`
          : null,
        count: recordedCount,
      });
      onSubmitted(recordedCount, normalizedRows);
      onCollapsedChange(true);
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "The executions could not be saved.",
      });
    }
  }

  function startAnotherTrade() {
    setRows([
      newExecution(nextId, "BUY", sessionDate),
      newExecution(nextId + 1, "SELL", sessionDate),
    ]);
    setNextId((current) => current + 2);
    setState({ kind: "idle" });
    onStartAnother?.();
    onCollapsedChange(false);
  }

  if (collapsed && submittedCount !== null) {
    return (
      <Card variant="outlined">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 850 }} variant="body1">
              Executions
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {submittedCount} execution{submittedCount === 1 ? "" : "s"}{" "}
              recorded
            </Typography>
            {state.kind === "saved" && state.candleReviewMessage ? (
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
                {state.candleReviewMessage}
              </Typography>
            ) : null}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {state.kind === "saved"
              ? state.candleReviewKeys.map((key, index) => (
                  <DashboardSecondaryAction
                    href={`/trades/candle-review?trade=${encodeURIComponent(key)}`}
                    key={key}
                  >
                    View candle review{state.candleReviewKeys.length > 1 ? ` ${index + 1}` : ""}
                  </DashboardSecondaryAction>
                ))
              : null}
            <DashboardSecondaryAction
              onClick={startAnotherTrade}
              startIcon={<EditRoundedIcon />}
            >
              Enter another trade
            </DashboardSecondaryAction>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <DashboardPanel
      action={<FeatureHelpLink href={entryMode === "quick" ? "/help/quick-trade-entry/enter-executions" : "/help/daily-trade-tracker/add-edit-trades#enter-executions"} label="manual execution entry" />}
      eyebrow="Manual execution entry"
      title="Enter trades"
    >
      <Typography sx={{ fontWeight: 800 }} variant="body2">
        Times use Eastern Time.
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
        Enter the exact execution time shown by your broker. Trade replay and analysis use this time to match each execution to the correct chart candle.
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
        {entryMode === "quick" ? (
          <>
            Enter trade executions for any date. Skip the notes, tags and rules flow of the {" "}
            <NextLink href="/trade-tracker">Daily Trade Tracker</NextLink>.
          </>
        ) : entryMode === "swing"
          ? "Enter the executions that make up this swing trade. Opening and closing executions can have different trading dates."
          : "Enter all day trade executions for one trading day and save your executions. All of your trades for the day will display below, organized by ticker."}
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 2.5 }}>
        {rows.map((row, index) => (
          <Box
            key={row.id}
            sx={{
              alignItems: { md: "center" },
              bgcolor: "action.hover",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: {
                xs: "1fr 1fr",
                md: "80px minmax(132px, .9fr) minmax(95px, .7fr) 88px minmax(105px, .7fr) minmax(90px, .6fr) minmax(90px, .6fr) minmax(80px, .5fr) 40px",
              },
              p: 1.5,
            }}
          >
            <Typography
              color="text.secondary"
              sx={{
                fontWeight: 700,
                gridColumn: { xs: "1 / -1", md: "auto" },
              }}
              variant="caption"
            >
              Execution {index + 1}
            </Typography>
            <TextField
              label="Trading date"
              onChange={(event) => update(row.id, "date", event.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={row.date}
            />
            <TextField
              label="Ticker"
              onChange={(event) =>
                update(row.id, "symbol", event.target.value.toUpperCase())
              }
              placeholder="NVDA"
              size="small"
              value={row.symbol}
            />
            <TextField
              label="Side"
              onChange={(event) =>
                update(row.id, "side", event.target.value)
              }
              select
              size="small"
              value={row.side}
            >
              <MenuItem value="BUY">Buy</MenuItem>
              <MenuItem value="SELL">Sell</MenuItem>
            </TextField>
            <TextField
              label="Time (Eastern Time)"
              onChange={(event) => update(row.id, "time", event.target.value)}
              size="small"
              slotProps={{
                htmlInput: { step: 1 },
                inputLabel: { shrink: true },
              }}
              type="time"
              value={row.time}
            />
            <TextField
              label="Quantity"
              onChange={(event) =>
                update(row.id, "quantity", event.target.value)
              }
              size="small"
              slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }}
              value={row.quantity}
            />
            <TextField
              label="Price"
              onChange={(event) => update(row.id, "price", event.target.value)}
              size="small"
              slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }}
              value={row.price}
            />
            <TextField
              label="Fees"
              onChange={(event) => update(row.id, "fees", event.target.value)}
              placeholder="Optional"
              size="small"
              slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }}
              value={row.fees}
            />
            <IconButton
              aria-label={`Remove execution ${index + 1}`}
              disabled={rows.length === 1}
              onClick={() => removeExecution(row.id)}
              size="small"
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <DashboardSecondaryAction
        fullWidth
        onClick={addExecution}
        startIcon={<AddRoundedIcon />}
        sx={{ justifyContent: "flex-start", mt: 1.5 }}
      >
        Add execution
      </DashboardSecondaryAction>

      <Box
        sx={{
          alignItems: { sm: "center" },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          justifyContent: "space-between",
          mt: 2.5,
        }}
      >
        <Stack direction="row" spacing={1}>
          {submittedCount !== null ? (
            <DashboardSecondaryAction onClick={() => onCollapsedChange(true)}>
              Close
            </DashboardSecondaryAction>
          ) : null}
          <DashboardPrimaryAction
            disabled={!savingEnabled || !complete || state.kind === "saving"}
            onClick={() => void saveExecutions()}
          >
            {state.kind === "saving"
              ? "Saving executions..."
              : !savingEnabled
              ? "Saving not connected yet"
              : "Save executions"}
          </DashboardPrimaryAction>
        </Stack>
      </Box>
      {!savingEnabled ? (
        <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="caption">
          This preview does not save executions.
        </Typography>
      ) : null}
      {state.kind === "error" ? (
        <Typography color="error.main" sx={{ mt: 1.5 }} variant="body2">
          {state.message}
        </Typography>
      ) : null}
    </DashboardPanel>
  );
}

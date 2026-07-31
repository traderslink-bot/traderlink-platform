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

import {
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";

export type ExecutionDraft = {
  fees: string;
  id: number;
  price: string;
  quantity: string;
  side: "BUY" | "SELL";
  symbol: string;
  time: string;
};

function newExecution(id: number, side: "BUY" | "SELL"): ExecutionDraft {
  return {
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
  onSubmitted,
  persist = false,
  sessionDate,
  submittedCount,
}: {
  collapsed: boolean;
  initialExecutions?: ExecutionDraft[];
  onCollapsedChange: (collapsed: boolean) => void;
  onSubmitted: (count: number, executions: ExecutionDraft[]) => void;
  persist?: boolean;
  sessionDate: string;
  submittedCount: number | null;
}) {
  const [nextId, setNextId] = useState(3);
  const [rows, setRows] = useState<ExecutionDraft[]>(() =>
    initialExecutions.length > 0
      ? initialExecutions
      : [newExecution(1, "BUY"), newExecution(2, "SELL")],
  );
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; count: number; candleReviewMessage: string | null }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    if (initialExecutions.length === 0) return;
    setRows(initialExecutions);
    setNextId(
      Math.max(...initialExecutions.map((execution) => execution.id)) + 1,
    );
  }, [initialExecutions]);

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
    setRows((current) => [...current, newExecution(nextId, "BUY")]);
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
      row.time &&
      Number(row.quantity) > 0 &&
      Number(row.price) > 0 &&
      (row.fees === "" || Number(row.fees) >= 0),
  );

  async function saveExecutions() {
    if (!complete || state.kind === "saving") return;
    setState({ kind: "saving" });
    try {
      let candleReviews: {
        completedTradeCount?: number;
        noCoverageCount?: number;
        providerUnavailableCount?: number;
        saveFailedCount?: number;
        savedCount?: number;
      } | undefined;
      if (persist) {
        const response = await fetch(
          "/api/intelligence/day-session-executions/v1",
          {
            body: JSON.stringify({
              date: sessionDate,
              executions: rows.map((row) => ({
                fees: normalizedDecimal(row.fees),
                price: normalizedDecimal(row.price),
                quantity: normalizedDecimal(row.quantity),
                side: row.side,
                symbol: row.symbol.trim().toUpperCase(),
                time: row.time,
              })),
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          },
        );
        const result = (await response.json()) as {
          acceptedExecutionCount?: number;
          candleReviews?: {
            completedTradeCount?: number;
            noCoverageCount?: number;
            providerUnavailableCount?: number;
            saveFailedCount?: number;
            savedCount?: number;
          };
          error?: { message?: string };
        };
        if (!response.ok || result.acceptedExecutionCount === undefined) {
          throw new Error(
            result.error?.message ?? "The executions could not be saved.",
          );
        }
        candleReviews = result.candleReviews;
      }
      const recordedCount = rows.length;
      const review = candleReviews;
      const candleReviewMessage = review === undefined
        ? null
        : review.completedTradeCount === 0
          ? "No completed round trip was created yet, so no Yahoo candle review was requested."
          : `${review.savedCount ?? 0} completed trade${review.savedCount === 1 ? "" : "s"} analyzed automatically${(review.noCoverageCount ?? 0) > 0 ? `; ${review.noCoverageCount} had no usable candle coverage` : ""}${(review.providerUnavailableCount ?? 0) > 0 ? `; Yahoo was unavailable for ${review.providerUnavailableCount}` : ""}${(review.saveFailedCount ?? 0) > 0 ? `; ${review.saveFailedCount} could not be saved` : ""}.`;
      setState({ kind: "saved", count: recordedCount, candleReviewMessage });
      onSubmitted(
        recordedCount,
        rows.map((row) => ({
          ...row,
          fees: normalizedDecimal(row.fees),
          price: normalizedDecimal(row.price),
          quantity: normalizedDecimal(row.quantity),
          symbol: row.symbol.trim().toUpperCase(),
        })),
      );
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
          <DashboardSecondaryAction
            onClick={() => onCollapsedChange(false)}
            startIcon={<EditRoundedIcon />}
          >
            Add or correct executions
          </DashboardSecondaryAction>
        </Stack>
      </Card>
    );
  }

  return (
    <DashboardPanel
      eyebrow={sessionDate}
      title="Enter trades"
    >
      <Typography color="text.secondary" variant="body2">
        Completed trades and P/L are reconstructed after saving.
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
                md: "80px minmax(110px, .8fr) 110px minmax(110px, .7fr) minmax(100px, .65fr) minmax(100px, .65fr) minmax(90px, .55fr) 40px",
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
              label="Symbol"
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
              label="Time"
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
        <Typography color="text.secondary" variant="body2">
          Times use Eastern Time.
        </Typography>
        <Stack direction="row" spacing={1}>
          {submittedCount !== null ? (
            <DashboardSecondaryAction onClick={() => onCollapsedChange(true)}>
              Close
            </DashboardSecondaryAction>
          ) : null}
          <DashboardPrimaryAction
            disabled={!complete || state.kind === "saving"}
            onClick={() => void saveExecutions()}
          >
            {submittedCount === null ? "Submit executions" : "Update executions"}
          </DashboardPrimaryAction>
        </Stack>
      </Box>
      {state.kind === "error" ? (
        <Typography color="error.main" sx={{ mt: 1.5 }} variant="body2">
          {state.message}
        </Typography>
      ) : null}
    </DashboardPanel>
  );
}

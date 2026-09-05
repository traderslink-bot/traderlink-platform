"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

import { DashboardSecondaryAction } from "../dashboard-template";
import {
  listManualTradeOutbox,
  MANUAL_TRADE_OUTBOX_CHANGED_EVENT,
  manualTradeOutboxIssueMessage,
  removeManualTradeOutboxRecord,
  syncManualTradeOutboxRecord,
  type ManualTradeOutboxRecord,
  type ManualTradeOutboxState,
} from "@/src/modules/platform/client/pwa/manual-trade-outbox";

function stateLabel(state: ManualTradeOutboxState): string {
  if (state === "saved_on_device") return "Saved on this device";
  if (state === "syncing") return "Syncing";
  if (state === "saved_to_traderlink") return "Saved to TraderLink";
  return "Needs your review";
}

function stateColor(state: ManualTradeOutboxState) {
  if (state === "saved_to_traderlink") return "success" as const;
  if (state === "needs_review") return "warning" as const;
  return "default" as const;
}

function trackerLabel(record: ManualTradeOutboxRecord): string {
  if (record.tracker === "swing") return "Swing Trade Tracker";
  if (record.tracker === "quick") return "Quick Trade Entry";
  return "Session Tracker";
}

function executionCount(record: ManualTradeOutboxRecord): number {
  return record.entries?.length ?? record.result?.acceptedExecutionCount ?? 0;
}

function savedTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function subscribeToConnectionChange(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function browserOnlineSnapshot(): boolean {
  return navigator.onLine;
}

function serverOnlineSnapshot(): boolean {
  return true;
}

export function TradeOutboxStatus({
  accountSelectionRef,
  offlineScopeRef,
}: {
  accountSelectionRef: string;
  offlineScopeRef: string;
}) {
  const router = useRouter();
  const detailsId = useId();
  const online = useSyncExternalStore(
    subscribeToConnectionChange,
    browserOnlineSnapshot,
    serverOnlineSnapshot,
  );
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [records, setRecords] = useState<readonly ManualTradeOutboxRecord[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRecords(await listManualTradeOutbox({
        accountSelectionRef,
        offlineScopeRef,
      }));
    } catch {
      setRecords([]);
    }
  }, [accountSelectionRef, offlineScopeRef]);

  useEffect(() => {
    const onChanged = () => void refresh();
    const initialRefresh = window.setTimeout(onChanged, 0);
    window.addEventListener(MANUAL_TRADE_OUTBOX_CHANGED_EVENT, onChanged);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener(MANUAL_TRADE_OUTBOX_CHANGED_EVENT, onChanged);
    };
  }, [refresh]);

  async function retry(record: ManualTradeOutboxRecord) {
    const result = await syncManualTradeOutboxRecord(record.ref, { force: true });
    if (result?.state === "saved_to_traderlink") router.refresh();
    await refresh();
  }

  async function remove(record: ManualTradeOutboxRecord) {
    const unsynced = record.state !== "saved_to_traderlink";
    if (
      unsynced &&
      !window.confirm(
        "Remove this saved trade from this device? It has not been confirmed as saved to TraderLink.",
      )
    ) {
      return;
    }
    await removeManualTradeOutboxRecord({
      ref: record.ref,
      accountSelectionRef,
      offlineScopeRef,
    });
    await refresh();
  }

  async function alreadyEntered(record: ManualTradeOutboxRecord) {
    if (
      !window.confirm(
        "Remove this device copy because these executions were already entered on the website?",
      )
    ) {
      return;
    }
    await removeManualTradeOutboxRecord({
      ref: record.ref,
      accountSelectionRef,
      offlineScopeRef,
    });
    await refresh();
  }

  async function saveSeparately(record: ManualTradeOutboxRecord) {
    if (
      !window.confirm(
        "Save another set of these executions? Choose this only when both entries really happened.",
      )
    ) {
      return;
    }
    const result = await syncManualTradeOutboxRecord(record.ref, {
      duplicateResolution: "save_separately",
      force: true,
    });
    if (result?.state === "saved_to_traderlink") router.refresh();
    await refresh();
  }

  if (records.length === 0) return null;

  const waitingCount = records.filter(
    (record) => record.state !== "saved_to_traderlink",
  ).length;
  const reviewCount = records.filter(
    (record) => record.state === "needs_review",
  ).length;
  const syncingCount = records.filter(
    (record) => record.state === "syncing",
  ).length;
  const statusLabel = reviewCount > 0
    ? `${reviewCount} to review`
    : syncingCount > 0
      ? `${syncingCount} syncing`
      : waitingCount > 0
        ? `${waitingCount} waiting`
        : "Up to date";
  const statusDescription = reviewCount > 0
    ? `${reviewCount} saved trade ${reviewCount === 1 ? "batch needs" : "batches need"} your decision before TraderLink can add ${reviewCount === 1 ? "it" : "them"}.`
    : waitingCount > 0
      ? online
        ? `${waitingCount} saved trade ${waitingCount === 1 ? "batch is" : "batches are"} waiting for TraderLink confirmation.`
        : `${waitingCount} saved trade ${waitingCount === 1 ? "batch will" : "batches will"} sync automatically after you reconnect.`
      : "Recent device saves are confirmed in TraderLink.";

  return (
    <Box
      aria-label="Trade sync"
      component="section"
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: reviewCount > 0 ? "warning.light" : "divider",
        borderRadius: 1.5,
        mb: 2,
        px: { xs: 1.5, sm: 2 },
        py: 1.25,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={{ fontWeight: 850 }} variant="body2">
            Trade sync
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="caption">
            {statusDescription}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          <Chip
            color={reviewCount > 0
              ? "warning"
              : waitingCount > 0
                ? "default"
                : "success"}
            label={statusLabel}
            size="small"
            variant={waitingCount > 0 && reviewCount === 0 ? "outlined" : "filled"}
          />
          <DashboardSecondaryAction
            aria-controls={detailsId}
            aria-expanded={statusOpen}
            onClick={() => setStatusOpen((current) => !current)}
            startIcon={statusOpen
              ? <ExpandLessRoundedIcon />
              : <ExpandMoreRoundedIcon />}
          >
            {statusOpen
              ? "Hide"
              : reviewCount > 0
                ? "Review saved trades"
                : "View saved trades"}
          </DashboardSecondaryAction>
        </Stack>
      </Stack>
      <Collapse in={statusOpen}>
        <Divider sx={{ mt: 1.25 }} />
        <Stack divider={<Divider flexItem />} id={detailsId}>
          {records.map((record) => {
            const expanded = expandedRef === record.ref;
            return (
              <Box key={record.ref} sx={{ py: 1.5 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    alignItems: { sm: "center" },
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", flexWrap: "wrap" }}
                    >
                      <Chip
                        color={stateColor(record.state)}
                        label={stateLabel(record.state)}
                        size="small"
                        variant={record.state === "saved_on_device"
                          ? "outlined"
                          : "filled"}
                      />
                      <Typography sx={{ fontWeight: 750 }} variant="body2">
                        {trackerLabel(record)}
                      </Typography>
                    </Stack>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.75 }}
                      variant="caption"
                    >
                      {executionCount(record)} execution
                      {executionCount(record) === 1 ? "" : "s"}
                      {" · "}{savedTime(record.updatedAtUtc)}
                    </Typography>
                    {record.state === "needs_review" ? (
                      <Typography
                        color="warning.dark"
                        sx={{ display: "block", mt: 0.75 }}
                        variant="caption"
                      >
                        {manualTradeOutboxIssueMessage(record.issue)}
                      </Typography>
                    ) : null}
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {record.entries ? (
                      <DashboardSecondaryAction
                        onClick={() => setExpandedRef(
                          expanded ? null : record.ref,
                        )}
                        startIcon={expanded
                          ? <ExpandLessRoundedIcon />
                          : <ExpandMoreRoundedIcon />}
                      >
                        {expanded ? "Hide details" : "Review"}
                      </DashboardSecondaryAction>
                    ) : null}
                    {record.issue === "possible_duplicate" ? (
                      <>
                        <DashboardSecondaryAction
                          onClick={() => void alreadyEntered(record)}
                          startIcon={<DoneRoundedIcon />}
                        >
                          Already entered
                        </DashboardSecondaryAction>
                        <DashboardSecondaryAction
                          disabled={!online}
                          onClick={() => void saveSeparately(record)}
                          startIcon={<SyncRoundedIcon />}
                        >
                          Save as separate
                        </DashboardSecondaryAction>
                      </>
                    ) : record.state === "saved_on_device" ||
                      record.state === "needs_review" ? (
                      <DashboardSecondaryAction
                        disabled={!online}
                        onClick={() => void retry(record)}
                        startIcon={<SyncRoundedIcon />}
                      >
                        Sync now
                      </DashboardSecondaryAction>
                    ) : null}
                    {record.state !== "syncing" &&
                    record.issue !== "possible_duplicate" ? (
                      <DashboardSecondaryAction
                        onClick={() => void remove(record)}
                        startIcon={<DeleteOutlineRoundedIcon />}
                      >
                        Remove
                      </DashboardSecondaryAction>
                    ) : null}
                  </Stack>
                </Stack>
                {expanded && record.entries ? (
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {record.entries.map((entry) => (
                      <Box
                        key={entry.clientRowRef}
                        sx={{
                          bgcolor: "action.hover",
                          borderRadius: 1,
                          display: "grid",
                          gap: 0.5,
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(4, 1fr)",
                          },
                          p: 1.25,
                        }}
                      >
                        <Typography sx={{ fontWeight: 750 }} variant="body2">
                          {entry.normalizedSymbol} ·{" "}
                          {entry.side === "buy" ? "Buy" : "Sell"}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {entry.localDate} · {entry.localTime.slice(0, 5)}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Quantity {entry.quantityDecimal}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Price {entry.priceDecimal} {entry.tradeCurrency}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      </Collapse>
    </Box>
  );
}

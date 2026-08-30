"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ManualExecutionEntry } from "../trade-tracker/manual-execution-entry";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { financialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import type { WorkspaceTradeLibraryModel, WorkspaceTradeLibraryRow } from "./workspace-trade-library";

type ExecutionDetail = Readonly<{
  executed_at_utc: string;
  price_decimal: string | null;
  quantity_decimal: string;
  side: "buy" | "sell";
}>;

function tradeMoney(row: WorkspaceTradeLibraryRow): string {
  return row.netPnlDecimal === null
    ? "—"
    : formatJournalAnalyticsMoney(row.netPnlDecimal, row.tradeCurrency, {
      showPositiveSign: true,
    });
}

function sideLabel(direction: WorkspaceTradeLibraryRow["direction"]): string {
  return direction === "long" ? "Long" : "Short";
}

function ActionButton({
  children,
  disabled = false,
  label,
  onClick,
}: Readonly<{
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}>) {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton aria-label={label} disabled={disabled} onClick={onClick} size="small">
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function ExecutionDisclosure({ row }: Readonly<{ row: WorkspaceTradeLibraryRow }>) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [executions, setExecutions] = useState<readonly ExecutionDetail[]>([]);

  async function load() {
    if (state === "ready") return;
    setState("loading");
    try {
      const response = await fetch(
        `/api/platform/journal/calendar/ticker-details?roundTripIds=${encodeURIComponent(row.roundTripId)}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("execution_details_unavailable");
      const payload = await response.json() as Readonly<{
        trades?: readonly Readonly<{ executions?: readonly ExecutionDetail[] }>[];
      }>;
      setExecutions(payload.trades?.[0]?.executions ?? []);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  return (
    <Box sx={{ borderTop: 1, borderColor: "divider", px: { xs: 1.5, md: 2 }, py: 1.25 }}>
      {state === "idle" ? (
        <Button onClick={() => void load()} size="small" startIcon={<ChevronRightRoundedIcon />}>
          Show executions
        </Button>
      ) : null}
      {state === "loading" ? <CircularProgress size={20} /> : null}
      {state === "error" ? <Typography color="error.main" variant="body2">Executions could not be loaded.</Typography> : null}
      {state === "ready" ? (
        <Stack spacing={0.5}>
          {executions.length === 0 ? <Typography color="text.secondary" variant="body2">No executions are available.</Typography> : null}
          {executions.map((execution, index) => (
            <Typography key={`${execution.executed_at_utc}:${index}`} variant="body2">
              {execution.side === "buy" ? "Buy" : "Sell"} {formatJournalAnalyticsDecimal(execution.quantity_decimal)} @ {execution.price_decimal ?? "Not recorded"}
            </Typography>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function AddTradeDrawer({
  accountCurrency,
  accountTimezone,
  expectedAccountSelectionRef,
  offlineScopeRef,
  onClose,
  open,
}: Readonly<{
  accountCurrency: string;
  accountTimezone: string;
  expectedAccountSelectionRef: string;
  offlineScopeRef: string;
  onClose: () => void;
  open: boolean;
}>) {
  const [tracker, setTracker] = useState<"day" | "swing">("day");
  const [tab, setTab] = useState(0);
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: accountTimezone,
    year: "numeric",
  }).formatToParts(new Date());
  const today = `${todayParts.find((part) => part.type === "year")?.value ?? ""}-${todayParts.find((part) => part.type === "month")?.value ?? ""}-${todayParts.find((part) => part.type === "day")?.value ?? ""}`;

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { height: "100dvh", width: { xs: "100vw", md: 580 } } } }}
    >
      <Stack sx={{ height: "100%", minHeight: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Add trade</Typography>
            <Button onClick={onClose} size="small">Close</Button>
          </Stack>
          <Tabs onChange={(_event, value) => setTab(value)} value={tab} variant="fullWidth">
            <Tab label="Trade" />
            <Tab disabled label="Journal" />
            <Tab disabled label="Analyzer" />
          </Tabs>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 1.5, sm: 2 } }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Chip color={tracker === "day" ? "primary" : "default"} label="Day" onClick={() => setTracker("day")} variant={tracker === "day" ? "filled" : "outlined"} />
            <Chip color={tracker === "swing" ? "primary" : "default"} label="Swing" onClick={() => setTracker("swing")} variant={tracker === "swing" ? "filled" : "outlined"} />
          </Stack>
          {tab === 0 ? (
            <ManualExecutionEntry
              accountCurrency={accountCurrency}
              accountTimezone={accountTimezone}
              defaultSessionDate={today}
              expectedAccountSelectionRef={expectedAccountSelectionRef}
              initialRowCount={1}
              key={`workspace-add:${tracker}`}
              offlineScopeRef={offlineScopeRef}
              onSaved={onClose}
              tracker={tracker}
            />
          ) : null}
        </Box>
      </Stack>
    </Drawer>
  );
}

function SavedTradeDrawer({
  onClose,
  open,
  row,
  startingTab,
}: Readonly<{
  onClose: () => void;
  open: boolean;
  row: WorkspaceTradeLibraryRow | null;
  startingTab: number;
}>) {
  const router = useRouter();
  const [tab, setTab] = useState(startingTab);
  useEffect(() => setTab(startingTab), [startingTab, row?.roundTripId]);
  if (!row) return null;
  return (
    <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { height: "100dvh", width: { xs: "100vw", md: 620 } } } }}>
      <Stack sx={{ height: "100%", minHeight: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Box><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{row.symbol}</Typography><Typography color="text.secondary" variant="body2">{row.date} · {sideLabel(row.direction)} · {row.status}</Typography></Box>
            <Button onClick={onClose} size="small">Close</Button>
          </Stack>
          <Tabs onChange={(_event, value) => setTab(value)} value={tab} variant="fullWidth">
            <Tab label="Trade" />
            <Tab label="Journal" />
            <Tab label="Analyzer" />
          </Tabs>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
          {tab === 0 ? <Stack spacing={1.25}><Typography color={financialOutcomeColor(row.netPnlDecimal)} sx={{ fontWeight: 850 }} variant="h5">{tradeMoney(row)}</Typography><Typography color="text.secondary" variant="body2">{row.executionCount} execution{row.executionCount === 1 ? "" : "s"}</Typography><ExecutionDisclosure row={row} /></Stack> : null}
          {tab === 1 ? <Stack spacing={1.25}><Typography variant="body2">Notes, tags, and rules stay with the completed trade review.</Typography><Button onClick={() => router.push("/trades")} sx={{ alignSelf: "flex-start" }} variant="outlined">Open review</Button></Stack> : null}
          {tab === 2 ? <Stack spacing={1.25}><Typography variant="body2">Saved Analyzer detail is available from Trade Analyzer. Workspace does not load charts or candle data.</Typography><Button onClick={() => router.push("/analytics/trade-analyzer/day/trades")} sx={{ alignSelf: "flex-start" }} variant="outlined">Open Trade Analyzer</Button></Stack> : null}
        </Box>
      </Stack>
    </Drawer>
  );
}

export function WorkspaceTradeLibrary({
  accountCurrency,
  accountTimezone,
  expectedAccountSelectionRef,
  offlineScopeRef,
  trades,
}: Readonly<{
  accountCurrency: string;
  accountTimezone: string;
  expectedAccountSelectionRef: string;
  offlineScopeRef: string;
  trades: WorkspaceTradeLibraryModel;
}>) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkspaceTradeLibraryRow | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  function openTracker(row: WorkspaceTradeLibraryRow) {
    router.push(`/trade-tracker/${encodeURIComponent(row.date)}`);
  }
  function openDetail(row: WorkspaceTradeLibraryRow, tab: number) {
    setDetail(row);
    setDetailTab(tab);
  }

  const actions = (row: WorkspaceTradeLibraryRow) => (
    <Stack direction="row" spacing={0.25} sx={{ justifyContent: "flex-end" }}>
      <ActionButton label="Review trade" onClick={() => openDetail(row, 1)}> <FactCheckOutlinedIcon fontSize="small" /> </ActionButton>
      <ActionButton label="Edit trade" onClick={() => openTracker(row)}> <EditRoundedIcon fontSize="small" /> </ActionButton>
      <ActionButton disabled label="Delete trade requires an eligible execution"> <DeleteOutlineRoundedIcon fontSize="small" /> </ActionButton>
      <ActionButton label="Open Trade Analyzer" onClick={() => openDetail(row, 2)}> <InsightsRoundedIcon fontSize="small" /> </ActionButton>
    </Stack>
  );

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h5">Trades</Typography>
        <Button onClick={() => setAddOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Add trade</Button>
      </Stack>
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "minmax(150px, 1fr) minmax(100px, .7fr) 90px 120px minmax(110px, .7fr) 176px", gap: 1, px: 2, py: 1, bgcolor: "action.hover" }}>
          {["Date", "Ticker", "Side", "Status", "P/L", "Actions"].map((label) => <Typography color="text.secondary" key={label} sx={{ fontWeight: 800 }} variant="caption">{label}</Typography>)}
        </Box>
        {trades.rows.length === 0 ? <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">Your trades will appear here after they are saved or imported.</Typography> : null}
        {trades.rows.map((row) => {
          const isExpanded = expanded === row.roundTripId;
          return (
            <Box key={row.roundTripId} sx={{ borderTop: 1, borderColor: "divider" }}>
              <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "minmax(150px, 1fr) minmax(100px, .7fr) 90px 120px minmax(110px, .7fr) 176px", gap: 1, alignItems: "center", px: 2, py: 1.25 }}>
                <Button aria-expanded={isExpanded} endIcon={<ExpandMoreRoundedIcon sx={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />} onClick={() => setExpanded(isExpanded ? null : row.roundTripId)} sx={{ justifyContent: "flex-start", textAlign: "left" }}>{row.date}</Button>
                <Typography sx={{ fontWeight: 800 }}>{row.symbol}</Typography>
                <Typography>{sideLabel(row.direction)}</Typography>
                <Chip label={row.status} size="small" variant="outlined" />
                <Typography color={financialOutcomeColor(row.netPnlDecimal)} sx={{ fontWeight: 800 }}>{tradeMoney(row)}</Typography>
                {actions(row)}
              </Box>
              <Box sx={{ display: { md: "none" }, p: 1.25 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Button aria-expanded={isExpanded} endIcon={<ExpandMoreRoundedIcon sx={{ transform: isExpanded ? "rotate(180deg)" : "none" }} />} onClick={() => setExpanded(isExpanded ? null : row.roundTripId)} sx={{ minWidth: 0, px: 0 }}>{row.date}</Button>
                  <Typography sx={{ fontWeight: 850 }}>{row.symbol}</Typography>
                  <Typography color={financialOutcomeColor(row.netPnlDecimal)} sx={{ fontWeight: 850 }}>{tradeMoney(row)}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", justifyContent: "space-between", mt: 0.75 }}>
                  <Stack direction="row" spacing={0.5}><Chip label={sideLabel(row.direction)} size="small" variant="outlined" /><Chip label={row.status} size="small" variant="outlined" /></Stack>
                  {actions(row)}
                </Stack>
              </Box>
              {isExpanded ? <ExecutionDisclosure row={row} /> : null}
            </Box>
          );
        })}
      </Box>
      <AddTradeDrawer
        accountCurrency={accountCurrency}
        accountTimezone={accountTimezone}
        expectedAccountSelectionRef={expectedAccountSelectionRef}
        offlineScopeRef={offlineScopeRef}
        onClose={() => { setAddOpen(false); router.refresh(); }}
        open={addOpen}
      />
      <SavedTradeDrawer
        onClose={() => setDetail(null)}
        open={detail !== null}
        row={detail}
        startingTab={detailTab}
      />
    </>
  );
}

"use client";

import { useState } from "react";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";

type ExportSession = Readonly<{ date: string; symbol: string }>;
type ExportStatus =
  | Readonly<{ state: "idle" }>
  | Readonly<{ state: "requesting" }>
  | Readonly<{ bars: number; pages: number; state: "complete" }>
  | Readonly<{ message: string; state: "failed" }>;

type ExportPayload = Readonly<{
  checksums?: Readonly<{
    normalizedBarsSha256?: unknown;
    rawPagesSha256?: unknown;
  }>;
  contract?: unknown;
  request?: Readonly<{ date?: unknown; symbol?: unknown }>;
  session?: Readonly<{ bars?: unknown; pageCount?: unknown }>;
}>;

type VerifiedExportPayload = ExportPayload & Readonly<{
  checksums: Readonly<{
    normalizedBarsSha256: string;
    rawPagesSha256: string;
  }>;
  request: Readonly<{ date: string; symbol: string }>;
  session: Readonly<{ bars: readonly unknown[]; pageCount: number }>;
}>;

const EXPORT_ENDPOINT = "/api/admin/journal/demo-daily-tracker-market-data/export";

const SESSIONS: readonly ExportSession[] = Object.freeze([
  { date: "2026-08-31", symbol: "AEHL" },
  { date: "2026-08-31", symbol: "NCRA" },
  { date: "2026-08-31", symbol: "GPRO" },
  { date: "2026-08-28", symbol: "FTFT" },
  { date: "2026-08-28", symbol: "FNGR" },
  { date: "2026-08-28", symbol: "PSQL" },
  { date: "2026-08-28", symbol: "CHAI" },
  { date: "2026-08-14", symbol: "WETO" },
  { date: "2026-08-14", symbol: "MDXH" },
  { date: "2026-08-14", symbol: "CAPR" },
  { date: "2026-08-14", symbol: "BANL" },
  { date: "2026-08-13", symbol: "XHG" },
  { date: "2026-08-13", symbol: "FGI" },
  { date: "2026-08-12", symbol: "BOXL" },
  { date: "2026-08-12", symbol: "RMCF" },
  { date: "2026-08-12", symbol: "OFAL" },
  { date: "2026-08-12", symbol: "ADTX" },
  { date: "2026-08-11", symbol: "GLMD" },
  { date: "2026-08-11", symbol: "PFSA" },
  { date: "2026-08-11", symbol: "WXM" },
  { date: "2026-08-10", symbol: "NXTT" },
  { date: "2026-08-10", symbol: "SXTC" },
  { date: "2026-08-10", symbol: "ONFO" },
  { date: "2026-08-10", symbol: "TNON" },
  { date: "2026-08-07", symbol: "VSTD" },
  { date: "2026-08-07", symbol: "YJ" },
  { date: "2026-08-07", symbol: "MB" },
  { date: "2026-08-07", symbol: "MNST" },
  { date: "2026-08-06", symbol: "THH" },
  { date: "2026-08-06", symbol: "GLMD" },
  { date: "2026-08-06", symbol: "MBAI" },
  { date: "2026-08-06", symbol: "PFSA" },
  { date: "2026-08-05", symbol: "YXT" },
  { date: "2026-08-05", symbol: "INLF" },
  { date: "2026-08-04", symbol: "AMIX" },
  { date: "2026-08-04", symbol: "QNME" },
  { date: "2026-08-04", symbol: "LSH" },
  { date: "2026-08-03", symbol: "RITR" },
  { date: "2026-08-03", symbol: "HYFM" },
  { date: "2026-08-03", symbol: "DFNS" },
  { date: "2026-08-03", symbol: "UPC" },
]);

const EMPTY_STATUS: ExportStatus = Object.freeze({ state: "idle" });

function sessionKey(session: ExportSession): string {
  return `${session.date}:${session.symbol}`;
}

function validExportPayload(payload: ExportPayload, session: ExportSession): payload is VerifiedExportPayload {
  return payload.contract === "traderlink_temporary_owner_daily_tracker_market_export_v1" &&
    payload.request?.date === session.date &&
    payload.request?.symbol === session.symbol &&
    Array.isArray(payload.session?.bars) &&
    Number.isInteger(payload.session?.pageCount) &&
    typeof payload.checksums?.normalizedBarsSha256 === "string" &&
    typeof payload.checksums?.rawPagesSha256 === "string";
}

function downloadEvidence(text: string, session: ExportSession): void {
  const objectUrl = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${session.date}-${session.symbol}-demo-candles.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

function renderStatus(status: ExportStatus) {
  if (status.state === "requesting") {
    return <Chip color="primary" label="Requesting" size="small" />;
  }
  if (status.state === "complete") {
    return (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <CheckCircleRoundedIcon color="success" fontSize="small" />
        <Typography variant="body2">{status.bars} bars · {status.pages} pages</Typography>
      </Stack>
    );
  }
  if (status.state === "failed") {
    return (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <ErrorOutlineRoundedIcon color="error" fontSize="small" />
        <Typography color="error" variant="body2">{status.message}</Typography>
      </Stack>
    );
  }
  return <Chip label="Pending" size="small" variant="outlined" />;
}

export function DemoCandleExportClient() {
  const [statuses, setStatuses] = useState<Record<string, ExportStatus>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  let completed = 0;
  let failed = 0;
  for (const session of SESSIONS) {
    const state = statuses[sessionKey(session)]?.state;
    if (state === "complete") completed += 1;
    if (state === "failed") failed += 1;
  }
  const nextPending = SESSIONS.find((session) => statuses[sessionKey(session)]?.state !== "complete") ?? null;

  async function exportSession(session: ExportSession): Promise<void> {
    const key = sessionKey(session);
    if (activeKey) return;
    setActiveKey(key);
    setStatuses((current) => ({ ...current, [key]: { state: "requesting" } }));
    try {
      const response = await fetch(EXPORT_ENDPOINT, {
        body: JSON.stringify(session),
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-TraderLink-Platform-Mutation": "1",
        },
        method: "POST",
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} — exporter unavailable`);
      }
      let payload: ExportPayload;
      try {
        payload = JSON.parse(text) as ExportPayload;
      } catch {
        throw new Error("The exporter returned invalid JSON.");
      }
      if (!validExportPayload(payload, session)) {
        throw new Error("The exporter response did not match the requested session.");
      }
      downloadEvidence(text, session);
      setStatuses((current) => ({
        ...current,
        [key]: {
          bars: payload.session.bars.length,
          pages: payload.session.pageCount,
          state: "complete",
        },
      }));
    } catch (error) {
      setStatuses((current) => ({
        ...current,
        [key]: {
          message: error instanceof Error ? error.message : "Export failed.",
          state: "failed",
        },
      }));
    } finally {
      setActiveKey(null);
    }
  }

  return (
    <>
      <Typography component="h1" variant="h1">Demo Candle Exports</Typography>
      <DashboardPanel
        action={nextPending ? (
          <DashboardPrimaryAction
            disabled={activeKey !== null}
            onClick={() => void exportSession(nextPending)}
            startIcon={activeKey ? <CircularProgress color="inherit" size={16} /> : <DownloadRoundedIcon />}
          >
            Export next pending
          </DashboardPrimaryAction>
        ) : null}
        title="August market-data sessions"
      >
        <Stack spacing={2}>
          <Typography color="text.secondary" variant="body2">
            Export one session at a time in reverse date order. Each successful response downloads its own
            sanitized JSON evidence file with normalized bars and checksums.
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip color="success" label={`${completed} complete`} variant={completed ? "filled" : "outlined"} />
            <Chip color="error" label={`${failed} failed`} variant={failed ? "filled" : "outlined"} />
            <Chip label={`${SESSIONS.length - completed} remaining`} variant="outlined" />
          </Stack>
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Table aria-label="Approved August candle export sessions" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SESSIONS.map((session) => {
                  const key = sessionKey(session);
                  const status = statuses[key] ?? EMPTY_STATUS;
                  return (
                    <TableRow key={key}>
                      <TableCell>{session.date}</TableCell>
                      <TableCell><Typography fontWeight={700}>{session.symbol}</Typography></TableCell>
                      <TableCell>{renderStatus(status)}</TableCell>
                      <TableCell align="right">
                        <Button
                          aria-label={`Export ${session.symbol} for ${session.date}`}
                          disabled={activeKey !== null || status.state === "complete"}
                          onClick={() => void exportSession(session)}
                          size="small"
                          startIcon={status.state === "requesting"
                            ? <CircularProgress color="inherit" size={14} />
                            : <DownloadRoundedIcon />}
                          variant="outlined"
                        >
                          {status.state === "complete" ? "Complete" : "Export"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DashboardPanel>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { reverseSplitCheckedAt, reverseSplitClose, reverseSplitDate, reverseSplitQuantity, type ReverseSplitRow, type WatchlistReverseSplits } from "@/src/modules/news/contracts/reverse-split-dashboard-contracts";

type SplitMap = Readonly<Record<string, ReverseSplitRow>>;
const EMPTY: SplitMap = Object.freeze({});

export function useWatchlistReverseSplits(symbols: readonly string[]): SplitMap {
  const key = [...new Set(symbols.map((symbol) => symbol.toUpperCase()).filter((symbol) => /^[A-Z][A-Z0-9.-]{0,3}$/u.test(symbol)))].sort().slice(0, 100).join(",");
  const [snapshot, setSnapshot] = useState<{ key: string; items: SplitMap }>({ key: "", items: EMPTY });
  useEffect(() => {
    if (!key) return;
    let disposed = false;
    let controller: AbortController | null = null;
    let timeout: number | null = null;
    let receivedAt = 0;
    const selected = new Set(key.split(","));
    const refresh = async () => {
      if (disposed || document.visibilityState !== "visible" || controller) return;
      controller = new AbortController();
      timeout = window.setTimeout(() => controller?.abort(), 10_000);
      try {
        const response = await fetch(`/api/live-watchlist/reverse-splits?tickers=${encodeURIComponent(key)}`, {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("reverse_split_status_unavailable");
        const payload = await response.json() as WatchlistReverseSplits;
        if (!Array.isArray(payload.items) || payload.items.length > 100 || !Number.isFinite(Date.parse(payload.generatedAt))) throw new Error("reverse_split_status_invalid");
        const items: Record<string, ReverseSplitRow> = {};
        for (const item of payload.items) {
          if (selected.has(item.ticker) && (item.watchlistLabel === "Reverse split approved" || item.watchlistLabel === "Reverse split announced")) items[item.ticker] = item;
        }
        if (!disposed) { receivedAt = Date.now(); setSnapshot({ key, items }); }
      } catch {
        if (!disposed) setSnapshot({ key, items: EMPTY });
      } finally {
        if (timeout !== null) window.clearTimeout(timeout);
        timeout = null;
        controller = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - receivedAt > 90_000) setSnapshot({ key, items: EMPTY });
        void refresh();
      }
      else controller?.abort();
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      controller?.abort();
      if (timeout !== null) window.clearTimeout(timeout);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [key]);
  return snapshot.key === key ? snapshot.items : EMPTY;
}

export function WatchlistReverseSplitBadge({ item }: { item?: ReverseSplitRow }) {
  if (!item?.watchlistLabel) return null;
  return <Chip component="span" label={item.watchlistLabel} size="small" variant="outlined"
    color={item.watchlistLabel === "Reverse split approved" ? "warning" : "info"}
    sx={{ maxWidth: "100%", height: "auto", width: "fit-content", "& .MuiChip-label": { whiteSpace: "normal", py: 0.4 } }} />;
}

export function WatchlistReverseSplitDetails({ item }: { item?: ReverseSplitRow }) {
  if (!item?.watchlistLabel) return null;
  const fields = [
    ...(item.approvalDate ? [["Shareholder approval", reverseSplitDate(item.approvalDate)]] : []),
    ...(item.approvedRatio ? [["Approved ratio / range", item.approvedRatio]] : []),
    ...(item.approvalExpiresDate ? [["Approval expires", reverseSplitDate(item.approvalExpiresDate)]] : []),
    ...(item.ratio ? [["Final ratio", `1-for-${item.ratio}`]] : []),
    ...(item.tradingDate ? [["Trading date", reverseSplitDate(item.tradingDate)]] : []),
    ["Float", reverseSplitQuantity(item.float)],
    ...(item.floatRetrievedAt ? [["Float retrieved", reverseSplitCheckedAt(item.floatRetrievedAt)]] : []),
    ...(item.estimatedPostSplitFloat !== null ? [["Estimated post-split float*", reverseSplitQuantity(item.estimatedPostSplitFloat)]] : []),
    ["Regular-session close", `${reverseSplitClose(item.close)}${item.closeDate ? ` (${reverseSplitDate(item.closeDate)})` : ""}`],
  ];
  return <DashboardPanel title="Reverse Split" action={<DashboardSecondaryAction component={Link} href={`/reverse-splits?ticker=${encodeURIComponent(item.ticker)}`}>View list</DashboardSecondaryAction>}>
    <Stack spacing={2}>
      <WatchlistReverseSplitBadge item={item} />
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2, m: 0 }}>
        {fields.map(([label, value]) => <Box key={label}><Typography component="dt" variant="caption" color="text.secondary">{label}</Typography><Typography component="dd" variant="body2" sx={{ m: 0 }}>{value}</Typography></Box>)}
      </Box>
      {item.estimatedPostSplitFloat !== null ? <Typography variant="caption" color="text.secondary">*Assumes the reported float is pre-split. Provider figures can lag; this is an estimate, not shares outstanding.</Typography> : null}
      <Typography component="a" href={item.sourceUrl} target="_blank" rel="noopener noreferrer" color="primary" variant="body2" sx={{ textDecoration: "underline", width: "fit-content" }}>
        {item.sourceKind === "sec" ? "SEC filing" : "Nasdaq notice"} — {reverseSplitDate(item.sourcePublishedDate)} (opens in a new tab)
      </Typography>
    </Stack>
  </DashboardPanel>;
}

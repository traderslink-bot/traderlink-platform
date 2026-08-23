"use client";

import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

import type {
  CommunityWatchlistDetail,
  CommunityWatchlistSummary,
} from "@/src/modules/community/contracts/community-watchlist-contracts";
import { DashboardPanel } from "../../../dashboard-template";

function tags(values: readonly string[]) {
  return values.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />);
}

function postedLabel(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Posted"
    : `Posted ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(date)} ET`;
}

export function CommunityWatchlistSummaryCard({ item }: { item: CommunityWatchlistSummary }) {
  return (
    <DashboardPanel
      action={<Chip color={item.status === "published" ? "success" : "default"} label={item.status === "published" ? "Published" : "Draft"} size="small" variant="outlined" />}
      title={item.title}
    >
      <Stack spacing={1.5}>
        {item.description ? <Typography color="text.secondary" variant="body2">{item.description}</Typography> : null}
        {item.tags.length ? <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>{tags(item.tags)}</Stack> : null}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
          <Typography color="text.secondary" variant="caption">@{item.authorHandle} · {item.symbolCount} {item.symbolCount === 1 ? "symbol" : "symbols"}</Typography>
          {item.status === "published" ? <Link href={item.href} style={{ textDecoration: "none" }}><Button component="span" endIcon={<LaunchRoundedIcon />} size="small">Open watchlist</Button></Link> : null}
        </Stack>
      </Stack>
    </DashboardPanel>
  );
}

function tickerCue(ticker: CommunityWatchlistDetail["tickers"][number]): string {
  return ticker.whyWatching || ticker.plan || ticker.catalyst || "Ticker added to this watchlist.";
}

function detailCount(ticker: CommunityWatchlistDetail["tickers"][number]): number {
  return [ticker.whyWatching, ticker.plan, ticker.personalTarget, ticker.catalyst, ticker.postedReferencePrice].filter(Boolean).length;
}

export function CommunityWatchlistTickerBoard({ detail }: { detail: CommunityWatchlistDetail }) {
  const [selectedSymbol, setSelectedSymbol] = useState(detail.tickers[0]?.symbol ?? "");
  const selectedTicker = detail.tickers.find((ticker) => ticker.symbol === selectedSymbol) ?? detail.tickers[0];
  const facts = selectedTicker ? [
    { label: "Why I&apos;m watching", value: selectedTicker.whyWatching },
    { label: "My plan", value: selectedTicker.plan },
    { label: "Personal target", value: selectedTicker.personalTarget },
    { label: "Catalyst", value: [selectedTicker.catalyst, selectedTicker.catalystDate].filter(Boolean).join(selectedTicker.catalyst && selectedTicker.catalystDate ? " · " : "") },
    { label: "Posted reference", value: selectedTicker.postedReferencePrice },
  ].filter((fact) => Boolean(fact.value)) : [];

  return <Stack spacing={1.25}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
      <Typography sx={{ fontWeight: 850 }} variant="body2">Tickers</Typography>
      {selectedTicker ? <Typography color="text.secondary" variant="caption">{postedLabel(selectedTicker.postedAtUtc)}</Typography> : null}
    </Stack>
    <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
      {detail.tickers.map((ticker) => {
        const active = ticker.symbol === selectedTicker?.symbol;
        const count = detailCount(ticker);
        return <Button key={ticker.symbol} onClick={() => setSelectedSymbol(ticker.symbol)} sx={{ alignItems: "stretch", border: 1, borderColor: active ? "primary.main" : "divider", borderRadius: 1.5, color: "text.primary", display: "block", minHeight: 74, p: 1.1, textAlign: "left", textTransform: "none" }} variant="text">
          <Stack spacing={0.45}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography sx={{ color: "#082b73", fontWeight: 900 }} variant="body2">{ticker.symbol}</Typography><Typography color="text.secondary" sx={{ fontSize: "0.68rem" }}>{count ? `${count} note${count === 1 ? "" : "s"}` : "No notes"}</Typography></Stack>
            {ticker.tags.length ? <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>{ticker.tags.slice(0, 2).map((tag) => <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#edf3ff", color: "#082b73", fontSize: "0.64rem", fontWeight: 700, height: 20 }} />)}</Stack> : null}
            <Typography color="text.secondary" sx={{ WebkitBoxOrient: "vertical", WebkitLineClamp: 1, display: "-webkit-box", fontSize: "0.77rem", lineHeight: 1.35, overflow: "hidden" }} variant="body2">{tickerCue(ticker)}</Typography>
          </Stack>
        </Button>;
      })}
    </Box>
    {selectedTicker ? <Paper elevation={0} sx={{ bgcolor: "#fbfcff", border: 1, borderColor: "#d7e2f8", borderRadius: 1.75, p: { xs: 1.25, sm: 1.5 } }}>
      <Stack spacing={1.1}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Typography sx={{ color: "#082b73", fontWeight: 900 }} variant="body2">{selectedTicker.symbol}</Typography><Typography color="text.secondary" variant="caption">Ticker details</Typography></Stack>
        {facts.length ? <Box sx={{ display: "grid", gap: 0, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "1.15fr 1.15fr .8fr 1.1fr .9fr" } }}>{facts.map((fact) => <Box key={fact.label} sx={{ borderColor: "divider", borderLeft: { xs: 0, sm: 1 }, borderTop: { xs: 1, sm: 0 }, minWidth: 0, px: { xs: 0, sm: 1.15 }, py: { xs: 0.9, sm: 0 }, "&:first-of-type": { borderLeft: { sm: 0 }, borderTop: 0, pl: { sm: 0 } } }}><Typography color="text.secondary" sx={{ fontWeight: 750 }} variant="caption">{fact.label}</Typography><Typography sx={{ WebkitBoxOrient: "vertical", WebkitLineClamp: 3, display: "-webkit-box", fontSize: "0.82rem", fontWeight: 650, lineHeight: 1.45, overflow: "hidden" }} variant="body2">{fact.value}</Typography></Box>)}</Box> : <Typography color="text.secondary" variant="body2">No extra notes were added for this ticker yet.</Typography>}
      </Stack>
    </Paper> : null}
  </Stack>;
}

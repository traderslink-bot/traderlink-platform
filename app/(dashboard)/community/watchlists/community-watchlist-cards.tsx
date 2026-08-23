"use client";

import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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
  return ticker.whyWatching || ticker.plan || ticker.catalyst || "Research details have not been added yet.";
}

function detailCount(ticker: CommunityWatchlistDetail["tickers"][number]): number {
  return [ticker.whyWatching, ticker.plan, ticker.personalTarget, ticker.catalyst, ticker.postedReferencePrice].filter(Boolean).length;
}

export function CommunityWatchlistTickerBoard({ detail }: { detail: CommunityWatchlistDetail }) {
  const [selectedSymbol, setSelectedSymbol] = useState(detail.tickers[0]?.symbol ?? "");
  const selectedTicker = detail.tickers.find((ticker) => ticker.symbol === selectedSymbol);

  return <Stack spacing={1.25}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
      <Box><Typography sx={{ fontWeight: 850 }} variant="body2">Ticker research</Typography><Typography color="text.secondary" variant="caption">Select a ticker to read the trader&apos;s notes.</Typography></Box>
      {selectedTicker ? <Typography color="text.secondary" variant="caption">{postedLabel(selectedTicker.postedAtUtc)}</Typography> : null}
    </Stack>
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.75, overflow: "hidden" }}>
      <Box sx={{ bgcolor: "#f7f9fd", borderBottom: 1, borderColor: "divider", display: { xs: "none", sm: "grid" }, gridTemplateColumns: "minmax(118px, .7fr) minmax(0, 1.55fr) minmax(150px, .85fr)", px: 1.5, py: 0.75 }}>
        <Typography color="text.secondary" sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>Ticker</Typography><Typography color="text.secondary" sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>Research focus</Typography><Typography color="text.secondary" sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>Watch for</Typography>
      </Box>
      {detail.tickers.map((ticker, index) => {
        const active = ticker.symbol === selectedTicker?.symbol;
        const count = detailCount(ticker);
        const watchFor = ticker.catalystDate || ticker.catalyst || ticker.personalTarget || "Research added";
        const factRows = [
          { label: "Personal target", value: ticker.personalTarget },
          { label: "Catalyst", value: ticker.catalyst },
          { label: "Catalyst date", value: ticker.catalystDate },
          { label: "Posted reference", value: ticker.postedReferencePrice },
        ].filter((fact) => Boolean(fact.value));
        return <Box key={ticker.symbol}>
          <Button aria-expanded={active} onClick={() => setSelectedSymbol((current) => current === ticker.symbol ? "" : ticker.symbol)} sx={{ bgcolor: active ? "#f2f6ff" : "background.paper", borderRadius: 0, borderTop: index ? 1 : 0, borderColor: "divider", boxShadow: active ? "inset 3px 0 0 #082b73" : "none", color: "text.primary", display: "grid", gap: { xs: 0.6, sm: 1.1 }, gridTemplateColumns: { xs: "1fr auto", sm: "minmax(118px, .7fr) minmax(0, 1.55fr) minmax(150px, .85fr)" }, minHeight: { xs: 82, sm: 68 }, px: { xs: 1.25, sm: 1.5 }, py: { xs: 1, sm: 0.85 }, textAlign: "left", textTransform: "none", width: "100%", "&:hover": { bgcolor: "#f5f8ff" } }} variant="text">
            <Stack spacing={0.35} sx={{ minWidth: 0 }}><Stack direction="row" spacing={0.6} sx={{ alignItems: "center" }}><Typography sx={{ color: "#082b73", fontWeight: 900 }} variant="body2">{ticker.symbol}</Typography><KeyboardArrowDownRoundedIcon sx={{ color: active ? "#082b73" : "text.secondary", fontSize: 18, transform: active ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} /></Stack><Typography color="text.secondary" sx={{ fontSize: "0.69rem" }}>{count ? `${count} research detail${count === 1 ? "" : "s"}` : "No extra details"}</Typography></Stack>
            <Box sx={{ minWidth: 0 }}><Typography color="text.secondary" sx={{ WebkitBoxOrient: "vertical", WebkitLineClamp: { xs: 2, sm: 1 }, display: "-webkit-box", fontSize: "0.8rem", lineHeight: 1.45, overflow: "hidden" }} variant="body2">{tickerCue(ticker)}</Typography>{ticker.tags.length ? <Stack direction="row" spacing={0.45} sx={{ display: { xs: "flex", sm: "none" }, flexWrap: "wrap", mt: 0.65, rowGap: 0.45 }}>{ticker.tags.slice(0, 3).map((tag) => <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#eaf1ff", color: "#082b73", fontSize: "0.64rem", fontWeight: 700, height: 20 }} />)}</Stack> : null}</Box>
            <Stack spacing={0.5} sx={{ alignItems: { xs: "flex-end", sm: "flex-start" }, minWidth: 0 }}><Typography color="text.secondary" sx={{ WebkitBoxOrient: "vertical", WebkitLineClamp: 2, display: "-webkit-box", fontSize: "0.73rem", fontWeight: 700, lineHeight: 1.35, overflow: "hidden" }}>{watchFor}</Typography>{ticker.tags.length ? <Stack direction="row" spacing={0.4} sx={{ display: { xs: "none", sm: "flex" }, flexWrap: "wrap", rowGap: 0.4 }}>{ticker.tags.slice(0, 2).map((tag) => <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#eaf1ff", color: "#082b73", fontSize: "0.61rem", fontWeight: 700, height: 19 }} />)}</Stack> : null}</Stack>
          </Button>
          {active ? <Box sx={{ bgcolor: "#f8faff", borderTop: 1, borderColor: "#c9daf7", boxShadow: "inset 3px 0 0 #082b73", p: { xs: 1.25, sm: 1.5 } }}><Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr) minmax(180px, .8fr)" } }}><Box sx={{ minWidth: 0 }}><Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">Why I&apos;m watching</Typography><Typography sx={{ fontSize: "0.88rem", lineHeight: 1.55, mt: 0.45 }} variant="body2">{ticker.whyWatching || "No notes added yet."}</Typography></Box><Box sx={{ borderColor: "divider", borderLeft: { xs: 0, md: 1 }, borderTop: { xs: 1, md: 0 }, minWidth: 0, pl: { xs: 0, md: 1.5 }, pt: { xs: 1.25, md: 0 } }}><Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">My plan</Typography><Typography sx={{ fontSize: "0.88rem", lineHeight: 1.55, mt: 0.45 }} variant="body2">{ticker.plan || "No plan added yet."}</Typography></Box><Stack spacing={0.95} sx={{ borderColor: "divider", borderLeft: { xs: 0, md: 1 }, borderTop: { xs: 1, md: 0 }, minWidth: 0, pl: { xs: 0, md: 1.5 }, pt: { xs: 1.25, md: 0 } }}>{factRows.length ? factRows.map((fact) => <Box key={fact.label}><Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">{fact.label}</Typography><Typography sx={{ fontSize: "0.86rem", fontWeight: 700, lineHeight: 1.4 }} variant="body2">{fact.value}</Typography></Box>) : <Typography color="text.secondary" variant="body2">No price target, catalyst, or reference was added.</Typography>}</Stack></Box></Box> : null}
        </Box>;
      })}
    </Box>
  </Stack>;
}

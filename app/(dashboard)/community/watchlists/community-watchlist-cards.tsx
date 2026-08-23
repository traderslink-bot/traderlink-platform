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

export function CommunityWatchlistTickerBoard({ detail }: { detail: CommunityWatchlistDetail }) {
  const [selectedSymbol, setSelectedSymbol] = useState(detail.tickers[0]?.symbol ?? "");

  return <Stack spacing={1.25}>
    <Stack spacing={0.85}>
      {detail.tickers.map((ticker) => {
        const active = ticker.symbol === selectedSymbol;
        const note = [ticker.whyWatching, ticker.plan].filter(Boolean).join("\n\n");
        const cardFact = ticker.personalTarget
          ? { label: "Personal target", value: ticker.personalTarget }
          : ticker.catalystDate
            ? { label: "Catalyst date", value: ticker.catalystDate }
            : ticker.catalyst
              ? { label: "Catalyst", value: ticker.catalyst }
              : null;
        const factRows = [
          { label: "Personal target", value: ticker.personalTarget },
          { label: "Catalyst", value: [ticker.catalyst, ticker.catalystDate].filter(Boolean).join(ticker.catalyst && ticker.catalystDate ? " · " : "") },
          { label: "Posted reference", value: ticker.postedReferencePrice },
        ].filter((fact) => Boolean(fact.value));
        return <Box key={ticker.symbol}>
          <Button aria-expanded={active} onClick={() => setSelectedSymbol((current) => current === ticker.symbol ? "" : ticker.symbol)} sx={{ bgcolor: "#edf4ff", border: 1, borderColor: active ? "#9fbee9" : "#d5e3fb", borderRadius: 1.75, boxShadow: "inset 3px 0 0 #082b73", color: "text.primary", display: "grid", gap: { xs: 0.75, sm: 1.2 }, gridTemplateColumns: { xs: "minmax(0, 1fr) auto", sm: "minmax(130px, .7fr) minmax(0, 1.35fr) minmax(126px, .7fr)" }, minHeight: { xs: 88, sm: 76 }, px: { xs: 1.25, sm: 1.5 }, py: 1.05, textAlign: "left", textTransform: "none", width: "100%", "&:hover": { bgcolor: "#e7f0ff" } }} variant="text">
            <Stack spacing={0.6} sx={{ minWidth: 0 }}><Stack direction="row" spacing={0.6} sx={{ alignItems: "center" }}><Typography sx={{ color: "#082b73", fontWeight: 900 }} variant="body2">{ticker.symbol}</Typography><KeyboardArrowDownRoundedIcon sx={{ color: "#082b73", fontSize: 18, transform: active ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} /></Stack>{ticker.tags.length ? <Stack direction="row" spacing={0.4} sx={{ flexWrap: "wrap", rowGap: 0.4 }}>{ticker.tags.slice(0, 2).map((tag) => <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#fff", color: "#082b73", fontSize: "0.61rem", fontWeight: 700, height: 19 }} />)}</Stack> : null}</Stack>
            <Box sx={{ alignSelf: "center", minWidth: 0 }}><Typography color="text.secondary" sx={{ WebkitBoxOrient: "vertical", WebkitLineClamp: { xs: 2, sm: 2 }, display: "-webkit-box", fontSize: "0.8rem", lineHeight: 1.45, overflow: "hidden" }} variant="body2">{tickerCue(ticker)}</Typography></Box>
            <Stack spacing={0.35} sx={{ alignItems: { xs: "flex-end", sm: "flex-start" }, minWidth: 0 }}>{cardFact ? <><Typography color="text.secondary" sx={{ fontSize: "0.68rem", fontWeight: 800 }}>{cardFact.label}</Typography><Typography sx={{ fontSize: "0.8rem", fontWeight: 800, lineHeight: 1.3 }}>{cardFact.value}</Typography></> : <Typography color="text.secondary" sx={{ fontSize: "0.74rem" }}>Open notes</Typography>}</Stack>
          </Button>
          {active ? <Box sx={{ bgcolor: "#fbfcff", border: 1, borderColor: "#c9daf7", borderRadius: "0 0 10px 10px", borderTop: 0, boxShadow: "inset 3px 0 0 #082b73", mt: -0.85, p: { xs: 1.5, sm: 1.75 }, pt: { xs: 2.2, sm: 2.35 } }}><Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.55fr) minmax(190px, .65fr)" } }}><Box sx={{ minWidth: 0 }}><Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">Notes</Typography><Typography sx={{ fontSize: "0.9rem", lineHeight: 1.65, mt: 0.55, whiteSpace: "pre-wrap" }} variant="body2">{note || "No notes were added for this ticker yet."}</Typography></Box><Stack spacing={1.1} sx={{ alignSelf: "start", borderColor: "divider", borderLeft: { xs: 0, md: 1 }, borderTop: { xs: 1, md: 0 }, minWidth: 0, pl: { xs: 0, md: 1.75 }, pt: { xs: 1.25, md: 0 } }}>{factRows.length ? factRows.map((fact) => <Box key={fact.label}><Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">{fact.label}</Typography><Typography sx={{ fontSize: "0.88rem", fontWeight: 700, lineHeight: 1.45 }} variant="body2">{fact.value}</Typography></Box>) : <Typography color="text.secondary" variant="body2">No target, catalyst, or reference was added.</Typography>}</Stack></Box></Box> : null}
        </Box>;
      })}
    </Stack>
  </Stack>;
}

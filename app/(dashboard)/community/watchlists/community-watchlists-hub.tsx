"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { useState } from "react";

import type { CommunityWatchlistSummary } from "@/src/modules/community/contracts/community-watchlist-contracts";
import { DashboardPage, DashboardPrimaryAction } from "../../../dashboard-template";
import { CommunityWatchlistSummaryCard } from "./community-watchlist-cards";

function avatarLetters(handle: string): string {
  return handle.replace(/[^a-z0-9]/giu, "").slice(0, 2).toUpperCase() || "TL";
}

function tagTone(index: number, dark: boolean) {
  if (dark) {
    return [
      { bgcolor: "#24344a", color: "#79aaf1" },
      { bgcolor: "#24344a", color: "#56d487" },
      { bgcolor: "#24344a", color: "#ffc76b" },
      { bgcolor: "#24344a", color: "#ff7373" },
    ][index % 4];
  }
  return [
    { bgcolor: "#e8f0ff", color: "#082b73" },
    { bgcolor: "#e9f7ef", color: "#14663c" },
    { bgcolor: "#f1ebff", color: "#5d3697" },
    { bgcolor: "#fff0e8", color: "#9c421e" },
  ][index % 4];
}

function TickerStrip({ item }: { item: CommunityWatchlistSummary }) {
  const dark = useTheme().palette.mode === "dark";
  const shownSymbols = item.symbols.slice(0, 4);
  if (!shownSymbols.length) return null;
  return <Stack spacing={0.65}>
    <Typography color="text.secondary" sx={{ fontWeight: 750 }} variant="caption">Symbols</Typography>
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "stretch", flexWrap: "wrap", rowGap: 0.75 }}>
      {shownSymbols.map((symbol, index) => {
        const ticker = item.tickerPreviews.find((candidate) => candidate.symbol === symbol);
        const isPreview = index === 0 && Boolean(ticker);
        const cue = ticker?.tags[0];
        return <Box key={symbol} sx={{ bgcolor: dark ? isPreview ? "action.selected" : "background.paper" : isPreview ? "#edf3ff" : "#fafbfe", border: 1, borderColor: dark ? isPreview ? "primary.light" : "divider" : isPreview ? "#b9cdf7" : "divider", borderRadius: 1.5, minWidth: { xs: 68, sm: 76 }, px: 1, py: 0.75 }}>
          <Typography sx={{ color: dark ? "primary.light" : "#082b73", fontSize: "0.82rem", fontWeight: 850, lineHeight: 1.1 }}>{symbol}</Typography>
          <Typography color="text.secondary" sx={{ display: "block", fontSize: "0.67rem", lineHeight: 1.35, maxWidth: 78, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {cue || "On this list"}
          </Typography>
        </Box>;
      })}
      {item.symbolCount > shownSymbols.length ? <Box sx={{ alignItems: "center", bgcolor: dark ? "background.paper" : "#fafbfe", border: 1, borderColor: "divider", borderRadius: 1.5, display: "flex", fontSize: "0.78rem", fontWeight: 800, justifyContent: "center", minWidth: 62, px: 1 }}>+{item.symbolCount - shownSymbols.length}</Box> : null}
    </Stack>
  </Stack>;
}

function TickerResearchPreview({ ticker }: { ticker: CommunityWatchlistSummary["tickerPreviews"][number] }) {
  const dark = useTheme().palette.mode === "dark";
  const facts = [
    { label: "Why I&apos;m watching", value: ticker.whyWatching },
    { label: "My plan", value: ticker.plan },
    { label: "Personal target", value: ticker.personalTarget },
    { label: "Catalyst", value: [ticker.catalyst, ticker.catalystDate].filter(Boolean).join(ticker.catalyst && ticker.catalystDate ? " · " : "") },
  ].filter((fact) => Boolean(fact.value));
  return <Box sx={{ bgcolor: dark ? "background.paper" : "#fbfcff", border: 1, borderColor: dark ? "divider" : "#d7e2f8", borderRadius: 1.75, px: { xs: 1.25, md: 1.5 }, py: 1.25 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: facts.length ? 1.25 : 0 }}>
      <Stack direction="row" spacing={0.8} sx={{ alignItems: "center", minWidth: 0 }}>
        <Typography sx={{ color: dark ? "primary.light" : "#082b73", fontWeight: 900 }} variant="body2">{ticker.symbol}</Typography>
        <Typography color="text.secondary" variant="caption">Ticker preview</Typography>
        {ticker.tags.slice(0, 2).map((tag, index) => <Chip key={tag} label={tag} size="small" sx={{ ...tagTone(index, dark), fontSize: "0.69rem", fontWeight: 700, height: 22 }} />)}
      </Stack>
    </Stack>
    {facts.length ? <Box sx={{ display: "grid", gap: 0, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "1.15fr 1.15fr .8fr 1.1fr .8fr" } }}>
      {facts.map((fact) => <Box key={fact.label} sx={{ borderLeft: { xs: 0, sm: 1 }, borderTop: { xs: 1, sm: 0 }, borderColor: "divider", minWidth: 0, px: { xs: 0, sm: 1.25 }, py: { xs: 1, sm: 0 }, "&:first-of-type": { borderLeft: { sm: 0 }, borderTop: 0, pl: { sm: 0 } } }}>
        <Typography color="text.secondary" sx={{ fontWeight: 750 }} variant="caption">{fact.label}</Typography>
        <Typography sx={{ display: "-webkit-box", fontSize: "0.82rem", fontWeight: 650, lineHeight: 1.45, overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 3 }} variant="body2">{fact.value}</Typography>
      </Box>)}
    </Box> : <Typography color="text.secondary" variant="body2">No extra notes were added for this ticker yet.</Typography>}
  </Box>;
}

function TickerBoard({ item }: { item: CommunityWatchlistSummary }) {
  const dark = useTheme().palette.mode === "dark";
  const [activeSymbol, setActiveSymbol] = useState(item.tickerPreviews[0]?.symbol ?? "");
  const activeTicker = item.tickerPreviews.find((ticker) => ticker.symbol === activeSymbol) ?? item.tickerPreviews[0];
  return <Box sx={{ px: { xs: 1.75, md: 2 }, py: 1.5 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 1.15 }}>
      <Typography sx={{ fontWeight: 850 }} variant="body2">Tickers in this watchlist</Typography>
      <Button component={Link} endIcon={<ArrowForwardRoundedIcon />} href={item.href} size="small">View full watchlist</Button>
    </Stack>
    {activeTicker ? <Box sx={{ mb: 1.15 }}><TickerResearchPreview ticker={activeTicker} /></Box> : null}
    <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
      {item.tickerPreviews.map((ticker) => {
        const detailCount = [ticker.whyWatching, ticker.plan, ticker.personalTarget, ticker.catalyst].filter(Boolean).length;
        const cue = ticker.whyWatching || ticker.plan || ticker.catalyst || "Ticker added to this watchlist.";
        const active = activeTicker?.symbol === ticker.symbol;
        return <Button key={ticker.symbol} onClick={() => setActiveSymbol(ticker.symbol)} sx={{ alignItems: "stretch", border: 1, borderColor: active ? "primary.main" : "divider", borderRadius: 1.5, color: "text.primary", display: "block", minHeight: 68, p: 1, textAlign: "left", textTransform: "none" }} variant="text">
          <Stack spacing={0.35}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography sx={{ color: dark ? "primary.light" : "#082b73", fontWeight: 900 }} variant="body2">{ticker.symbol}</Typography><Typography color="text.secondary" sx={{ fontSize: "0.68rem" }}>{detailCount ? `${detailCount} note${detailCount === 1 ? "" : "s"}` : "No notes"}</Typography></Stack>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>{ticker.tags.slice(0, 2).map((tag, index) => <Chip key={tag} label={tag} size="small" sx={{ ...tagTone(index, dark), fontSize: "0.64rem", fontWeight: 700, height: 20 }} />)}</Stack>
            <Typography color="text.secondary" sx={{ display: "-webkit-box", fontSize: "0.76rem", lineHeight: 1.35, overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 1 }} variant="body2">{cue}</Typography>
          </Stack>
        </Button>;
      })}
    </Box>
  </Box>;
}

function CommunityFeedCard({ item, selected, onOpen, onClose }: { item: CommunityWatchlistSummary; selected: boolean; onOpen: () => void; onClose: () => void }) {
  const dark = useTheme().palette.mode === "dark";
  const toggle = () => selected ? onClose() : onOpen();
  return <Paper elevation={0} onClick={(event) => { if (!(event.target as HTMLElement).closest("button, a")) toggle(); }} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !(event.target as HTMLElement).closest("button, a")) { event.preventDefault(); toggle(); } }} role="button" sx={{ border: 1, borderColor: selected ? "primary.main" : "divider", borderRadius: 2.5, cursor: "pointer", overflow: "hidden", transition: "border-color 160ms ease", "&:hover": { borderColor: "primary.main" } }} tabIndex={0}>
    <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr", md: "144px minmax(0, 1fr) 150px" }, p: { xs: 1.75, md: 2 } }}>
      <Stack direction={{ xs: "row", md: "column" }} spacing={0.85} sx={{ alignItems: { xs: "center", md: "flex-start" } }}>
        <Avatar sx={{ bgcolor: dark ? "primary.main" : "#102b69", fontSize: "0.8rem", fontWeight: 850, height: 40, width: 40 }}>{avatarLetters(item.authorHandle)}</Avatar>
        <Box><Typography sx={{ fontWeight: 820 }} variant="body2">@{item.authorHandle}</Typography><Typography color="text.secondary" variant="caption">Shared watchlist</Typography></Box>
      </Stack>
      <Stack spacing={1} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography component="h2" sx={{ fontSize: "1.05rem", fontWeight: 850 }}>{item.title}</Typography><Typography sx={{ display: { md: "none" }, fontWeight: 800, whiteSpace: "nowrap" }} variant="body2">{item.symbolCount} symbols</Typography></Stack>
        {item.description ? <Typography color="text.secondary" sx={{ WebkitBoxOrient: "vertical", WebkitLineClamp: 2, display: "-webkit-box", overflow: "hidden" }} variant="body2">{item.description}</Typography> : null}
        <TickerStrip item={item} />
      </Stack>
      <Stack spacing={0.9} sx={{ alignItems: { xs: "flex-start", md: "flex-end" }, justifyContent: "space-between" }}>
        <Typography sx={{ display: { xs: "none", md: "block" }, fontWeight: 800 }} variant="body2">{item.symbolCount} symbols</Typography>
        <Stack direction="row" spacing={0.55} sx={{ flexWrap: "wrap", justifyContent: { md: "flex-end" }, rowGap: 0.55 }}>{item.tags.slice(0, 3).map((tag, index) => <Chip key={tag} label={tag} size="small" sx={{ ...tagTone(index, dark), fontSize: "0.69rem", fontWeight: 700, height: 22 }} />)}</Stack>
        <KeyboardArrowDownRoundedIcon aria-hidden="true" sx={{ color: dark ? "primary.light" : "#082b73", fontSize: 25, transform: selected ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
      </Stack>
    </Box>
    {selected ? <><Divider /><TickerBoard item={item} key={item.href} /></> : null}
  </Paper>;
}

function SelectedTraderCard({ item }: { item: CommunityWatchlistSummary }) {
  const dark = useTheme().palette.mode === "dark";
  return <Paper elevation={0} sx={{ alignSelf: "start", border: 1, borderColor: "divider", borderRadius: 2.5, p: 2.5, textAlign: "center" }}><Stack spacing={1.3} sx={{ alignItems: "center" }}><Avatar sx={{ bgcolor: dark ? "primary.main" : "#102b69", fontSize: "1.05rem", fontWeight: 850, height: 76, width: 76 }}>{avatarLetters(item.authorHandle)}</Avatar><Box><Typography sx={{ fontWeight: 850 }} variant="h3">@{item.authorHandle}</Typography><Typography color="text.secondary" variant="body2">Community trader</Typography></Box><Typography color="text.secondary" variant="body2">Sharing small-cap research and watchlist ideas.</Typography><Button component={Link} href={`/community/${item.authorHandle}`} variant="outlined">View profile</Button></Stack></Paper>;
}

export function CommunityWatchlistsHub({ mine, shared }: { mine: readonly CommunityWatchlistSummary[]; shared: readonly CommunityWatchlistSummary[] }) {
  const [tab, setTab] = useState<"mine" | "shared">("mine");
  const [selectedHref, setSelectedHref] = useState<string | null>(null);
  const items = tab === "mine" ? mine : shared;
  const selected = shared.find((item) => item.href === selectedHref) ?? null;
  return (
    <DashboardPage>
      <Box sx={{ display: "flex", gap: 1, alignItems: { sm: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" } }}>
        <Typography component="h1" variant="h1">Community Watchlists</Typography>
        <Stack direction="row" spacing={1}><Button component={Link} href="/community/watchlists/share" variant="outlined">Share with a server</Button><DashboardPrimaryAction component={Link} href="/community/watchlists/new" startIcon={<AddRoundedIcon />}>Create watchlist</DashboardPrimaryAction></Stack>
      </Box>
      <Tabs aria-label="Community Watchlists" onChange={(_, value) => setTab(value)} value={tab}>
        <Tab label="My Watchlists" value="mine" />
        <Tab label="Shared Watchlists" value="shared" />
      </Tabs>
      {tab === "mine" && items.length ? <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" } }}>{items.map((item) => <CommunityWatchlistSummaryCard item={item} key={`${item.authorHandle}-${item.href}`} />)}</Box> : null}
      {tab === "shared" && items.length ? <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 760px) 224px" }, maxWidth: 1010 }}><Stack spacing={1.5}>{items.map((item) => <CommunityFeedCard item={item} key={`${item.authorHandle}-${item.href}`} onClose={() => setSelectedHref(null)} onOpen={() => setSelectedHref(item.href)} selected={selected?.href === item.href} />)}</Stack>{selected ? <SelectedTraderCard item={selected} /> : null}</Box> : null}
      {!items.length ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, px: 2.5, py: 3.25 }}><Typography sx={{ fontWeight: 820 }}>{tab === "mine" ? "Your watchlists will appear here." : "No shared watchlists yet."}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{tab === "mine" ? "Create a private draft when you are ready to organize a research list." : "Published trader research will appear here as traders begin sharing."}</Typography></Box> : null}
    </DashboardPage>
  );
}

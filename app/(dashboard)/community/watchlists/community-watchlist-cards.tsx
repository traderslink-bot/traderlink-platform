"use client";

import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  CommunityWatchlistDetail,
  CommunityWatchlistSummary,
} from "@/src/modules/community/contracts/community-watchlist-contracts";
import { COMMUNITY_WATCHLIST_TAGS } from "@/src/modules/community/contracts/community-watchlist-contracts";
import { DashboardPanel } from "../../../dashboard-template";
import { replaceCommunityWatchlistTicker, updateCommunityWatchlistTickerTags } from "./community-watchlist-actions";

export type CommunityTickerCompanyFacts = {
  country: string | null;
  industry: string | null;
  marketCap: string | null;
  sharesOutstanding: string | null;
};

function tags(values: readonly string[]) {
  return values.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />);
}

function sameTags(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((tag, index) => tag === right[index]);
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

export function CommunityWatchlistTickerBoard({
  detail,
  tickerFacts,
  editable,
  watchlistSlug,
}: {
  detail: CommunityWatchlistDetail;
  tickerFacts: Readonly<Record<string, CommunityTickerCompanyFacts | null>>;
  editable: boolean;
  watchlistSlug: string;
}) {
  const [selectedSymbol, setSelectedSymbol] = useState(detail.tickers[0]?.symbol ?? "");
  const [tickerEdit, setTickerEdit] = useState("");
  const [pendingTickerTags, setPendingTickerTags] = useState<Readonly<Record<string, readonly string[]>>>({});
  const [newTickerTag, setNewTickerTag] = useState("");
  const [tickerMessage, setTickerMessage] = useState<string | null>(null);
  const [savingTicker, setSavingTicker] = useState(false);
  const router = useRouter();

  const factColumns = {
    xs: "repeat(2, minmax(0, 1fr))",
    sm: "124px 62px 150px 76px 78px minmax(0, 1fr)",
  };

  function addCustomTickerTag(symbol: string, selectedTags: readonly string[]): void {
    const tag = newTickerTag.trim().replace(/\s+/gu, " ");
    if (!tag || selectedTags.length >= 20 || selectedTags.some((item) => item.localeCompare(tag, undefined, { sensitivity: "accent" }) === 0)) return;
    setPendingTickerTags((current) => ({ ...current, [symbol]: [...selectedTags, tag.slice(0, 48)] }));
    setNewTickerTag("");
  }

  return <Stack spacing={1.25}>
    <Box aria-hidden="true" sx={{ border: 1, borderColor: "transparent", boxSizing: "border-box", columnGap: 0.65, display: { xs: "none", sm: "grid" }, gridTemplateColumns: factColumns.sm, justifyItems: "start", px: 1.5 }}>
      <Box />
      {['Ctry', 'Ind.', 'M/C', 'O/S'].map((label) => <Typography color="text.secondary" key={label} sx={{ fontSize: "0.72rem", fontWeight: 900, letterSpacing: ".03em" }}>{label}</Typography>)}
      <Box />
    </Box>
    <Stack spacing={0.7}>
      {detail.tickers.map((ticker) => {
        const active = ticker.symbol === selectedSymbol;
        const selectedTags = pendingTickerTags[ticker.symbol] ?? ticker.tags;
        const tagChoices = [...new Set([...COMMUNITY_WATCHLIST_TAGS, ...selectedTags])];
        const note = [ticker.whyWatching, ticker.plan].filter(Boolean).join("\n\n");
        const companyFacts = tickerFacts[ticker.symbol] ?? null;
        const facts = companyFacts ? [
          { label: "Ctry", value: companyFacts.country },
          { label: "Ind.", value: companyFacts.industry },
          { label: "M/C", value: companyFacts.marketCap },
          { label: "O/S", value: companyFacts.sharesOutstanding },
        ] : [];
        const factRows = [
          { label: "Personal target", value: ticker.personalTarget },
          { label: "Catalyst", value: [ticker.catalyst, ticker.catalystDate].filter(Boolean).join(ticker.catalyst && ticker.catalystDate ? " · " : "") },
        ].filter((fact) => Boolean(fact.value));
        return <Box key={ticker.symbol}>
          <Button aria-expanded={active} onClick={() => setSelectedSymbol((current) => current === ticker.symbol ? "" : ticker.symbol)} sx={{ alignItems: "center", bgcolor: "#edf4ff", border: 1, borderColor: active ? "#9fbee9" : "#d5e3fb", borderRadius: 1.75, boxShadow: "inset 3px 0 0 #082b73", boxSizing: "border-box", color: "text.primary", columnGap: { xs: 0.75, sm: 0.65 }, display: "grid", gridTemplateColumns: factColumns, justifyItems: "start", minHeight: { xs: 78, sm: 58 }, px: { xs: 1.25, sm: 1.5 }, py: { xs: 1, sm: 0.85 }, textAlign: "left", textTransform: "none", width: "100%", "&:hover": { bgcolor: "#e7f0ff" } }} variant="text">
            <Stack spacing={0.45} sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, minWidth: 0 }}>
              <Stack direction="row" spacing={0.55} sx={{ alignItems: "center" }}>
                <Typography sx={{ color: "#082b73", fontSize: "1rem", fontWeight: 900, letterSpacing: ".01em", lineHeight: 1.1 }}>{ticker.symbol}</Typography>
                <KeyboardArrowDownRoundedIcon sx={{ color: "#082b73", display: { xs: "block", sm: "none" }, fontSize: 19, transform: active ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} />
              </Stack>
            </Stack>
            {facts.length ? facts.map((fact) => <Box key={fact.label} sx={{ minWidth: 0 }}>
              <Typography color="text.secondary" sx={{ display: { xs: "block", sm: "none" }, fontSize: "0.62rem", fontWeight: 900 }}>{fact.label}</Typography>
              <Typography noWrap sx={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.3, maxWidth: "100%" }}>{fact.value ?? "—"}</Typography>
            </Box>) : <Typography color="text.secondary" sx={{ fontSize: "0.73rem", gridColumn: { xs: "1 / -1", sm: "2 / span 4" } }}>Company facts not reported</Typography>}
            <Stack aria-hidden="true" direction="row" spacing={0.2} sx={{ alignItems: "center", display: { xs: "none", sm: "flex" }, justifySelf: "end", whiteSpace: "nowrap" }}>
              <Typography sx={{ color: "#082b73", fontSize: "0.7rem", fontWeight: 800 }}>Trader&apos;s take</Typography>
              <KeyboardArrowDownRoundedIcon sx={{ color: "#082b73", fontSize: 22, transform: active ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} />
            </Stack>
          </Button>
          {active ? <Box sx={{ bgcolor: "#fbfcff", border: 1, borderColor: "#c9daf7", borderRadius: "0 0 10px 10px", borderTop: 0, boxShadow: "inset 3px 0 0 #082b73", mt: -0.85, p: { xs: 1.5, sm: 1.75 }, pt: { xs: 2.2, sm: 2.35 } }}>
            <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.55fr) minmax(190px, .65fr)" } }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">Trader&apos;s take</Typography>
                <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.65, mt: 0.55, whiteSpace: "pre-wrap" }} variant="body2">{note || "No trader&apos;s take was added for this ticker yet."}</Typography>
                {editable ? <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ alignItems: { sm: "center" }, mt: 1.5 }}>
                  <input aria-label={`Replace ${ticker.symbol} with a ticker`} onChange={(event) => setTickerEdit(event.target.value.toUpperCase())} placeholder="New ticker" style={{ border: "1px solid #bac8e0", borderRadius: 6, font: "inherit", minHeight: 34, padding: "6px 9px", textTransform: "uppercase", width: 130 }} value={tickerEdit} />
                  <Button disabled={savingTicker || !tickerEdit.trim()} onClick={async () => { setSavingTicker(true); setTickerMessage(null); const result = await replaceCommunityWatchlistTicker({ handle: detail.authorHandle, watchlistSlug, currentSymbol: ticker.symbol, nextSymbol: tickerEdit }); setSavingTicker(false); setTickerMessage(result.message); if (result.ok) { setTickerEdit(""); router.refresh(); } }} size="small" variant="outlined">{savingTicker ? "Saving..." : "Change ticker"}</Button>
                </Stack> : null}
              </Box>
              <Stack spacing={1.1} sx={{ alignSelf: "start", borderColor: "divider", borderLeft: { xs: 0, md: 1 }, borderTop: { xs: 1.25, md: 0 }, minWidth: 0, pl: { xs: 0, md: 1.75 }, pt: { xs: 1.25, md: 0 } }}>
                {factRows.length ? factRows.map((fact) => <Box key={fact.label}><Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">{fact.label}</Typography><Typography sx={{ fontSize: "0.88rem", fontWeight: 700, lineHeight: 1.45 }} variant="body2">{fact.value}</Typography></Box>) : <Typography color="text.secondary" variant="body2">No target or catalyst was added.</Typography>}
              </Stack>
            </Box>
            {editable ? <Box sx={{ borderColor: "divider", borderTop: 1, mt: 1.5, pt: 1.25, width: "100%" }}>
              <Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">Ticker tags</Typography>
              <Stack direction="row" spacing={0.55} sx={{ flexWrap: "wrap", mt: 0.65, rowGap: 0.55, width: "100%" }}>{tagChoices.map((tag) => <Chip color={selectedTags.includes(tag) ? "primary" : "default"} key={tag} label={tag} onClick={() => setPendingTickerTags((current) => ({ ...current, [ticker.symbol]: selectedTags.includes(tag) ? selectedTags.filter((item) => item !== tag) : [...selectedTags, tag] }))} size="small" variant={selectedTags.includes(tag) ? "filled" : "outlined"} />)}</Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ alignItems: { sm: "center" }, mt: 0.9 }}><TextField label="New tag" onChange={(event) => setNewTickerTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomTickerTag(ticker.symbol, selectedTags); } }} size="small" slotProps={{ htmlInput: { maxLength: 48 } }} value={newTickerTag} /><Button disabled={savingTicker || !newTickerTag.trim() || selectedTags.length >= 20} onClick={() => addCustomTickerTag(ticker.symbol, selectedTags)} size="small" variant="outlined">Add</Button><Button disabled={savingTicker || sameTags(selectedTags, ticker.tags)} onClick={async () => { setSavingTicker(true); setTickerMessage(null); const result = await updateCommunityWatchlistTickerTags({ handle: detail.authorHandle, watchlistSlug, symbol: ticker.symbol, tags: selectedTags }); setSavingTicker(false); setTickerMessage(result.message); if (result.ok) { setPendingTickerTags((current) => ({ ...current, [ticker.symbol]: selectedTags })); setNewTickerTag(""); router.refresh(); } }} size="small" variant="outlined">{savingTicker ? "Saving..." : "Save tags"}</Button></Stack>
              {tickerMessage ? <Typography color="text.secondary" variant="caption">{tickerMessage}</Typography> : null}
            </Box> : ticker.tags.length ? <Stack direction="row" spacing={0.55} sx={{ borderColor: "divider", borderTop: 1, flexWrap: "wrap", mt: 1.5, pt: 1.25, rowGap: 0.55, width: "100%" }}>{ticker.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}</Stack> : null}
          </Box> : null}
        </Box>;
      })}
    </Stack>
  </Stack>;
}

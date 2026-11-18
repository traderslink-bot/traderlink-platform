"use client";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { CommunityWatchlistResearch, CommunityTickerResearch } from "@/src/modules/communities/contracts/community-watchlist-research";

export function CommunityWatchlistResearchFields({ initialSymbols = [], initialResearch = {} }: {
  initialSymbols?: readonly string[]; initialResearch?: CommunityWatchlistResearch;
}) {
  const [symbolsText, setSymbolsText] = useState(initialSymbols.join(", "));
  const [research, setResearch] = useState<CommunityWatchlistResearch>(initialResearch);
  const symbols = [...new Set(symbolsText.normalize("NFKC").toUpperCase().split(/[\s,]+/u).filter(Boolean))];
  function update(symbol: string, field: keyof CommunityTickerResearch, value: string) {
    setResearch(current => ({ ...current, [symbol]: { ...(current[symbol] ?? { notes: "", research: "", sources: [] }), [field]: field === "sources" || field === "supportLevels" ? value.split("\n") : value } }));
  }
  return <Stack spacing={2}>
    <TextField label="Tickers" name="symbols" placeholder="NVDA, TSLA, SPY" value={symbolsText} onChange={event => setSymbolsText(event.target.value)}/>
    <input type="hidden" name="tickerResearch" value={JSON.stringify(Object.fromEntries(symbols.map(symbol => [symbol, research[symbol] ?? { notes: "", research: "", sources: [] }])))} />
    {symbols.map(symbol => <Accordion key={symbol} disableGutters>
      <AccordionSummary aria-controls={`research-${symbol}`} id={`ticker-${symbol}`}><Typography sx={{ fontWeight: 700 }}>{symbol} — Notes and DD research</Typography></AccordionSummary>
      <AccordionDetails id={`research-${symbol}`}><Stack spacing={2}>
        <TextField label="Notes" multiline minRows={2} value={research[symbol]?.notes ?? ""} onChange={event => update(symbol, "notes", event.target.value)}/>
        <TextField label="DD research" multiline minRows={4} value={research[symbol]?.research ?? ""} onChange={event => update(symbol, "research", event.target.value)}/>
        <TextField label="Source links" helperText="One http or https link per line." multiline minRows={2} value={research[symbol]?.sources.join("\n") ?? ""} onChange={event => update(symbol, "sources", event.target.value)}/>
        <TextField label="Price target" value={research[symbol]?.priceTarget??""} onChange={event=>update(symbol,"priceTarget",event.target.value)}/>
        <TextField label="Support levels" helperText="One level per line." multiline minRows={2} value={research[symbol]?.supportLevels?.join("\n")??""} onChange={event=>update(symbol,"supportLevels",event.target.value)}/>
        <TextField label="Stop loss" value={research[symbol]?.stopLoss??""} onChange={event=>update(symbol,"stopLoss",event.target.value)}/>
        <TextField label="Publisher take" multiline minRows={2} value={research[symbol]?.publisherTake??""} onChange={event=>update(symbol,"publisherTake",event.target.value)}/>
      </Stack></AccordionDetails>
    </Accordion>)}
  </Stack>;
}

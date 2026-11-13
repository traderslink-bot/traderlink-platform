"use client";

import { scannerPrice as price } from "./scanner-price";

import { scannerGainColor } from "./scanner-gain-color";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DashboardPrimaryAction } from "@/app/dashboard-template";
import { isStockLevelsMap, type StockLevelsMap, type StockLevelsResult } from "@/src/modules/stock-levels/stock-levels-contract";
import { buildWatchlistV2LevelRows, formatWatchlistV2LevelPrice } from "@/src/lib/live-watchlist/watchlist-v2-levels";
import { formatLevelMarketDataProvenance } from "@/src/lib/live-watchlist/live-watchlist-level-provenance";
import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import type { LiveScannerRow, ScannerNewsItem } from "@/src/modules/scanner/live/contracts";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const stamp = (n: number | string) => new Date(n).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET";

export function ScannerTickerDetails({ symbol, stock, quote, postMarket, actionTarget, active=true, onGenerate }: {
  symbol: string; stock: LiveScannerRow | undefined; quote?: {price:number;changePercent:number|null}; postMarket?: boolean;
  actionTarget?:HTMLElement|null;active?:boolean;onGenerate?:()=>void;
}) {
  const [map, setMap] = useState<StockLevelsMap | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  const newsPending = useRef<AbortController | null>(null);
  const [selectedNews, setSelectedNews] = useState<string | null>(null);
  const [article, setArticle] = useState<PressReleaseArticle | null>(null);
  const [articleStatus, setArticleStatus] = useState<"loading" | "ready" | "unavailable">("ready");
  useEffect(() => () => { pending.current?.abort(); newsPending.current?.abort(); }, []);
  async function openArticle(item: ScannerNewsItem) {
    newsPending.current?.abort(); setArticle(null);
    if (selectedNews === item.id) { setSelectedNews(null); return; }
    const controller = new AbortController(); newsPending.current = controller;
    setSelectedNews(item.id); setArticleStatus("loading");
    try {
      const response = await fetch(`/api/platform/news/workspace-scanner?articleId=${encodeURIComponent(item.id)}`, { cache: "no-store", signal: controller.signal });
      const body = await response.json() as { article?: PressReleaseArticle };
      if (controller.signal.aborted) return;
      if (response.ok && body.article?.id === item.id && body.article.ticker === symbol) { setArticle(body.article); setArticleStatus("ready"); }
      else setArticleStatus("unavailable");
    } catch { if (!controller.signal.aborted) setArticleStatus("unavailable"); }
  }
  async function generate() {
    if (pending.current) return;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/levels", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ symbol }), signal: controller.signal });
      const result = await response.json() as StockLevelsResult;
      if (controller.signal.aborted) return;
      if (response.ok && result.state === "ready" && isStockLevelsMap(result.map) && result.map.symbol === symbol) {
        setMap(result.map);
      } else setError(result.state === "unavailable" ? result.message : "Levels could not be generated. Try again.");
    } catch { if (!controller.signal.aborted) setError("Levels could not be generated. Try again."); }
    finally { if (!controller.signal.aborted) { pending.current = null; setBusy(false); } }
  }
  const levelAction=<DashboardPrimaryAction sx={{whiteSpace:"nowrap",flexShrink:0,fontSize:"0.65rem",px:1,py:0,minHeight:26,height:26}} disabled={busy} onClick={() => {onGenerate?.();void generate();}}>{busy ? "Generating…" : "Generate Levels"}</DashboardPrimaryAction>;
  const rows = buildWatchlistV2LevelRows(map?.levelMap);
  const postOnly = stock?.gainBasis === "today_regular_close";
  const dayGain = stock ? (postOnly ? undefined : stock.sessionGain) : postMarket ? undefined : quote?.changePercent;
  const postGain = stock ? (postOnly ? stock.sessionGain : stock.postMarketGain) : postMarket ? quote?.changePercent : undefined;
  const currentPrice = stock?.price ?? quote?.price;
  const priceGain = dayGain === undefined ? postGain : dayGain;
  const changeFact = (label: string, change: number | null): [string, string, string] =>
    [label, change == null ? "—" : `${change.toFixed(0)}%`, scannerGainColor(change)];
  const facts: [string, string, string?][] = currentPrice === undefined ? [] : [
    ["Price", price(currentPrice), scannerGainColor(priceGain)],
    ...(dayGain === undefined ? [] : [changeFact("Day change", dayGain)]),
    ...(postGain === undefined ? [] : [changeFact("Post-market change", postGain)]),
    ...(stock ? [
      ["Vol", stock.volume == null ? "—" : compact.format(stock.volume)],
      ["Float", stock.float == null ? "—" : compact.format(stock.float)],
      ["Market cap", stock.marketCap == null ? "—" : `$${compact.format(stock.marketCap)}`],
      ["RVOL", stock.relativeVolume == null ? "—" : `${stock.relativeVolume.toFixed(1)}×`],
    ] as [string, string][] : []),
  ];
  return <Stack component="section" aria-label={`${symbol} stock details`} spacing={1} sx={{minWidth:0,p:0.5,containerType:"inline-size"}}>
    <Box data-stock-technicals sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"minmax(0,1fr) minmax(0,2fr)"},gap:1.5,alignItems:"start"}}>
      {facts.length ? <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 1, m: 0,"@container (max-width: 550px)":{gridTemplateColumns:"repeat(2,minmax(0,1fr))"} }}>
        {facts.map(([label, content, color]) => <Box key={label}><Typography component="dt" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{label}</Typography><Typography component="dd" sx={{ m: 0, fontSize: "0.8rem", fontWeight: 750, color }}>{content}</Typography></Box>)}
      </Box> : null}
    <Box sx={{minWidth:0,gridColumn:facts.length?undefined:"1 / -1"}}>
      {actionTarget===undefined?levelAction:active&&actionTarget?createPortal(levelAction,actionTarget):null}
      {map?<Typography data-level-reference sx={{color:"text.secondary",fontSize:"0.65rem",lineHeight:1.3,textAlign:"left",mb:1}}>Reference {price(map.referencePrice)} · {stamp(map.referencePriceAsOf)}</Typography>:null}
      {error ? <Alert severity="warning" sx={{ mb: 1 }}>{error}</Alert> : null}
      {!map && !busy ? <Typography sx={{ color: "text.secondary", fontSize: "0.75rem" }}>Generate a map for this ticker.</Typography> : null}
      {map ? <>
        <Box data-level-columns sx={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:1,minWidth:0}}>
        {([['Resistance', rows.resistance], ['Support', rows.support]] as const).map(([title, levels]) => <Box key={title} sx={{ mb: 1.5 }}>
          <Typography component="h4" sx={{ fontSize: "0.7rem", fontWeight: 800, color: title === "Resistance" ? "error.main" : "success.main" }}>{title}</Typography>
          {levels.length ? levels.map((level, index) => <Box key={`${level.price}-${index}`} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 800 }}>{formatWatchlistV2LevelPrice(level)}</Typography>
            </Stack>
            <Typography sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{[level.isNearest ? "Nearest" : null, level.strengthLabel, level.sourceLabel].filter(Boolean).join(" · ")}</Typography>
            {formatLevelMarketDataProvenance(level) ? <Typography sx={{ fontSize: "0.6rem", color: "text.secondary" }}>{formatLevelMarketDataProvenance(level)}</Typography> : null}
          </Box>) : <Typography sx={{ color: "text.secondary", fontSize: "0.7rem" }}>No mapped {title.toLowerCase()}.</Typography>}
        </Box>)}
        </Box>
        {map.fullLadderCard ? <Box component="details"><Typography component="summary" sx={{ cursor: "pointer", fontSize: "0.75rem", fontWeight: 750 }}>Full ladder</Typography><Box component="pre" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "0.7rem", fontFamily: "inherit" }}>{map.fullLadderCard.body}</Box></Box> : null}
      </> : null}
    </Box>
    </Box>
    <Divider/>
    <Box>
      <Typography component="h3" sx={{fontSize:"0.8rem",fontWeight:800,mb:0.75}}>Recent News</Typography>
      {stock?.news.length ? <Stack spacing={0.75}>{stock.news.map(item => <Box key={item.id}>
        <Typography sx={{ color: "text.secondary", fontSize: "0.6rem", lineHeight: 1.2, mb: "2px" }}>{stamp(item.createdAt)} · {item.typeLabel}</Typography>
        <Button aria-expanded={selectedNews === item.id} onClick={() => void openArticle(item)} sx={{ p: 0, minWidth: 0, minHeight: 0, textAlign: "left", justifyContent: "flex-start", textTransform: "none", fontSize: "0.75rem", lineHeight: 1.3 }}>{item.headline}</Button>
        {selectedNews === item.id ? <Box sx={{ mt: 0.75, fontSize: "0.75rem" }}>
          {articleStatus === "loading" ? "Loading article…" : articleStatus === "unavailable" ? "Article details are unavailable." : <>
            {article?.summary ? <Typography sx={{ fontSize: "0.75rem", lineHeight: 1.5 }}>{article.summary}</Typography> : null}
            {article?.articleText ? <Box component="details" sx={{ mt: 0.75 }}><summary>Read article</summary><Typography sx={{ fontSize: "0.75rem", whiteSpace: "pre-wrap", mt: 0.75 }}>{article.articleText}</Typography></Box> : null}
          </>}
        </Box> : null}
      </Box>)}</Stack> : <Typography sx={{ color: "text.secondary", fontSize: "0.75rem" }}>No news saved in the last five market days.</Typography>}
    </Box>
  </Stack>;
}

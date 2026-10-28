"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import { DashboardPage, DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { EMPTY_GENERAL_NEWS, type GeneralNewsArticle, type GeneralNewsFeed, type GeneralNewsRow } from "@/src/modules/news/contracts/general-market-news-contracts";

function time(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(value)) + " ET" : "Publication time unavailable";
}
export function GeneralMarketNewsFeed() {
  const [feed, setFeed] = useState<GeneralNewsFeed>(EMPTY_GENERAL_NEWS);
  const [query, setQuery] = useState({ search: "", ticker: "", from: "", to: "" });
  const [error, setError] = useState<string | null>(null), [working, setWorking] = useState(false);
  const [selected, setSelected] = useState<GeneralNewsArticle | null>(null);
  const [articleLoading, setArticleLoading] = useState(false), [articleError, setArticleError] = useState<string | null>(null);
  const [open, setOpen] = useState(false), [pending, setPending] = useState<GeneralNewsFeed | null>(null);
  const listController = useRef<AbortController | null>(null), detailController = useRef<AbortController | null>(null);
  const generation = useRef(0), selectedTrigger = useRef<HTMLButtonElement | null>(null);
  const currentQuery = useRef(query);
  const load = useCallback(async (cursor?: string, background = false) => {
    if (background && document.visibilityState !== "visible") return;
    listController.current?.abort(); const controller = new AbortController(); listController.current = controller;
    const ticket = ++generation.current;
    if (!background) setWorking(true);
    const params = new URLSearchParams();
    Object.entries(currentQuery.current).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
    if (cursor) params.set("cursor", cursor);
    try {
      const response = await fetch(`/api/market-news/general?${params}`, { cache: "no-store", signal: controller.signal });
      if (response.status === 403) { setFeed(EMPTY_GENERAL_NEWS); setSelected(null); setOpen(false); setPending(null); }
      if (!response.ok) throw new Error(response.status === 400 ? "Check the news filters." : response.status === 403 ? "Personal test access is no longer available." : "News is temporarily unavailable. Showing the last loaded articles.");
      const data = await response.json() as GeneralNewsFeed;
      if (ticket !== generation.current) return;
      if (background) setPending(data);
      else { setPending(null); setFeed(previous => cursor ? { ...data, articles: [...previous.articles, ...data.articles.filter(a => !previous.articles.some(b => b.id === a.id))].slice(0, 200) } : data); }
      setError(null);
    } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "News is unavailable."); }
    finally { if (ticket === generation.current) setWorking(false); }
  }, []);
  const select = useCallback(async (id: string) => {
    detailController.current?.abort(); const controller = new AbortController(); detailController.current = controller;
    setOpen(true); setSelected(null); setArticleError(null); setArticleLoading(true);
    const url = new URL(window.location.href); url.searchParams.set("article", id); window.history.replaceState(null, "", url);
    try {
      const response = await fetch(`/api/market-news/general/articles/${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal });
      if (response.status === 403) { setFeed(EMPTY_GENERAL_NEWS); setPending(null); }
      if (!response.ok) throw new Error(response.status === 404 ? "This article is no longer available." : "The article could not be loaded.");
      const data = await response.json() as { article: GeneralNewsArticle }; if (!controller.signal.aborted) setSelected(data.article);
    } catch (failure) { if (!controller.signal.aborted) setArticleError(failure instanceof Error ? failure.message : "The article could not be loaded."); }
    finally { if (!controller.signal.aborted) setArticleLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const id = new URL(window.location.href).searchParams.get("article"); if (id && /^[a-f0-9]{64}$/.test(id)) void select(id);
    const timer = window.setInterval(() => void load(undefined, true), 60_000);
    const clear = () => { listController.current?.abort(); detailController.current?.abort(); setFeed(EMPTY_GENERAL_NEWS); setSelected(null); setPending(null); setOpen(false); };
    window.addEventListener("pagehide", clear);
    return () => { window.clearInterval(timer); window.removeEventListener("pagehide", clear); listController.current?.abort(); detailController.current?.abort(); };
  }, [load, select]);
  const close = () => {
    detailController.current?.abort(); setOpen(false); setSelected(null); setArticleError(null);
    const url = new URL(window.location.href); url.searchParams.delete("article"); window.history.replaceState(null, "", url);
    selectedTrigger.current?.focus();
  };
  const showSymbols = (article: GeneralNewsRow) => article.symbols.slice(0, 3).map(symbol => <Chip key={symbol} size="small" label={symbol.replace(/\.US$/, "")} variant="outlined" />);
  const newCount = pending?.articles.filter(a => !feed.articles.some(b => b.id === a.id)).length ?? 0;
  const stale = !feed.status.collectedAt || Date.now() - Date.parse(feed.status.collectedAt) > 5 * 60_000;
  return <DashboardPage><DashboardPanel title="General Market News">
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}><Chip label="Personal test" size="small" /><Typography variant="caption" color="text.secondary">Updated {feed.status.deliveredAt ? time(feed.status.deliveredAt) : "—"}</Typography></Stack>
      <Box component="form" onSubmit={event => { event.preventDefault(); currentQuery.current = query; void load(); }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <TextField size="small" label="Search headlines" value={query.search} slotProps={{ htmlInput: { maxLength: 120 } }} onChange={e => setQuery({ ...query, search: e.target.value })} />
          <TextField size="small" label="Ticker (e.g. AAPL.US)" value={query.ticker} slotProps={{ htmlInput: { maxLength: 40 } }} onChange={e => setQuery({ ...query, ticker: e.target.value.toUpperCase() })} />
          <TextField size="small" type="date" label="From (UTC)" slotProps={{ inputLabel: { shrink: true } }} value={query.from} onChange={e => setQuery({ ...query, from: e.target.value })} />
          <TextField size="small" type="date" label="To (UTC)" slotProps={{ inputLabel: { shrink: true } }} value={query.to} onChange={e => setQuery({ ...query, to: e.target.value })} />
          <DashboardSecondaryAction type="submit" disabled={working}>Apply filters</DashboardSecondaryAction>
        </Stack>
      </Box>
      <Typography variant="caption" color="text.secondary">All news includes every collected general-feed story. A ticker filter also includes collected ticker supplements. No symbols means none were supplied. Source publication may precede collection.</Typography>
      {error ? <Alert severity="warning">{error}</Alert> : null}
      {feed.status.state !== "fresh" || stale ? <Alert severity="info">{feed.status.state === "paused" ? "Collection is paused. Saved articles remain available." : feed.status.state === "partial" ? "Recent news is still catching up. Coverage may be incomplete." : stale && feed.articles.length ? "Updates are delayed. Showing saved news." : "Waiting for the first news delivery."}</Alert> : null}
      {pending ? <Button onClick={() => { setFeed(pending); setPending(null); }}>{newCount ? `${newCount} new articles` : "Refresh saved news"}</Button> : null}
      {working && !feed.articles.length ? <CircularProgress size={24} aria-label="Loading news" /> : null}
      {!working && !feed.articles.length ? <Typography color="text.secondary">No articles available for these filters.</Typography> : null}
      <Box>{feed.articles.map(article => <Box component="button" key={article.id} onClick={event => { selectedTrigger.current = event.currentTarget; void select(article.id); }} aria-label={`Open article: ${article.headline}`} sx={{ width: "100%", minHeight: 56, p: 1.5, textAlign: "left", border: 0, borderBottom: 1, borderColor: "divider", bgcolor: "transparent", color: "text.primary", cursor: "pointer", font: "inherit", "&:hover": { bgcolor: "action.hover" }, "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: -3 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" } }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130 }}>{time(article.publishedAt)}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130, overflowWrap: "anywhere" }}>{article.source ?? "Source unavailable"}</Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>{showSymbols(article)}{article.symbols.length > 3 ? <Chip size="small" label={`+${article.symbols.length - 3}`} /> : null}</Stack>
          <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{article.headline}</Typography>
        </Stack>
      </Box>)}</Box>
      {feed.nextCursor && feed.articles.length < 200 ? <DashboardSecondaryAction disabled={working} onClick={() => void load(feed.nextCursor ?? undefined)}>Load more</DashboardSecondaryAction> : null}
      {feed.articles.length >= 200 ? <Typography variant="caption" color="text.secondary">Showing 200 articles. Narrow the date or ticker filters to browse more.</Typography> : null}
    </Stack>
  </DashboardPanel>
    <Drawer anchor="right" open={open} onClose={close} slotProps={{ paper: { sx: { maxWidth: "100%", width: { xs: "100%", sm: 620 } } } }}>
      <Stack spacing={2.25} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography variant="subtitle2">Article</Typography><IconButton aria-label="Close article" onClick={close}><CloseRoundedIcon /></IconButton></Stack>
        {articleLoading ? <CircularProgress size={24} aria-label="Loading article" /> : null}
        {articleError ? <Alert severity="warning">{articleError}</Alert> : null}
        {selected ? <><Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>{selected.symbols.map(s => <Chip key={s} label={s} size="small" variant="outlined" />)}</Stack>
          <Typography variant="caption" color="text.secondary">{time(selected.publishedAt)} · {selected.source ?? "Source unavailable"}</Typography>
          <Typography component="h2" variant="h2">{selected.headline}</Typography><Divider />
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selected.body ?? "Article text is unavailable. Read the original source."}</Typography>
          {selected.bodyTruncated ? <Alert severity="info">This saved article was shortened. Read the original source for the complete text.</Alert> : null}
          {selected.sourceUrl ? <Button href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" variant="contained" endIcon={<LaunchRoundedIcon />}>Read original source</Button> : null}
        </> : null}
      </Stack>
    </Drawer>
  </DashboardPage>;
}

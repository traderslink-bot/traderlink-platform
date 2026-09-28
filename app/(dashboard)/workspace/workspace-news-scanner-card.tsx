"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { DashboardPanel } from "../../dashboard-template";
import { markPressReleaseRead } from "../press-releases/press-release-actions";

const PressReleaseArticleDrawer = dynamic(() => import("../press-releases/press-release-article-drawer").then((module) => module.PressReleaseArticleDrawer));
type ScannerHeadline = Pick<PressReleaseArticle, "id" | "ticker" | "headline" | "isRead">;
type ScannerResponse = Readonly<{ articles?: readonly ScannerHeadline[] }>;

export function WorkspaceNewsScannerCard({ onViewMore }: Readonly<{ onViewMore: () => void }>) {
  const [articles, setArticles] = useState<readonly ScannerHeadline[] | null>(null);
  const [selected, setSelected] = useState<PressReleaseArticle | null>(null);
  const [opening, setOpening] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const articleRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    let stream: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pendingChange = false;
    let retryMs = 5_000;
    const visible = () => active && document.visibilityState === "visible" && navigator.onLine;
    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(load, delay);
    };
    const load = () => {
      if (!visible()) return;
      if (controller) { pendingChange = true; return; }
      clearTimeout(timer);
      timer = undefined;
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => request.abort(), 12_000);
      void fetch("/api/platform/news/workspace-scanner?view=summary", { cache: "no-store", signal: request.signal })
        .then(async (response) => response.ok ? response.json() as Promise<ScannerResponse> : Promise.reject(new Error("scanner_unavailable")))
        .then((result) => {
          if (active && !request.signal.aborted) {
            setArticles(result.articles ?? []);
            setRefreshFailed(false);
            retryMs = 5_000;
            if (stream?.readyState !== EventSource.OPEN) schedule(30_000);
          }
        })
        .catch(() => {
          // Keep the last successful headlines during a temporary failure.
          if (visible()) {
            setRefreshFailed(true);
            schedule(retryMs);
            retryMs = Math.min(60_000, retryMs * 2);
          }
        })
        .finally(() => {
          clearTimeout(timeout);
          if (controller === request) controller = null;
          if (pendingChange && visible()) { pendingChange = false; load(); }
        });
    };
    const connect = () => {
      if (!visible()) {
        stream?.close(); stream = null;
        controller?.abort();
        clearTimeout(timer);
        timer = undefined;
        pendingChange = false;
        return;
      }
      if (stream) return;
      // The ready event starts the initial fetch after subscribing, avoiding
      // both a duplicate startup request and a gap in change notifications.
      stream = new EventSource("/api/platform/news/workspace-scanner/stream");
      stream.addEventListener("ready", load);
      stream.addEventListener("scanner_articles_changed", load);
      stream.addEventListener("error", () => { if (visible() && timer === undefined) schedule(retryMs); });
      // Still show headlines if a proxy stalls the streaming connection.
      schedule(2_000);
    };
    connect();
    document.addEventListener("visibilitychange", connect);
    window.addEventListener("online", connect);
    window.addEventListener("offline", connect);
    window.addEventListener("pageshow", connect);
    return () => {
      active = false;
      controller?.abort();
      articleRequest.current?.abort();
      articleRequest.current = null;
      stream?.close();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", connect);
      window.removeEventListener("online", connect);
      window.removeEventListener("offline", connect);
      window.removeEventListener("pageshow", connect);
    };
  }, []);

  async function selectArticle(headline: ScannerHeadline): Promise<void> {
    articleRequest.current?.abort();
    const request = new AbortController();
    articleRequest.current = request;
    setOpening(true);
    setArticleError(null);
    const timeout = setTimeout(() => request.abort(), 12_000);
    try {
      const response = await fetch(`/api/platform/news/workspace-scanner?articleId=${encodeURIComponent(headline.id)}`, { cache: "no-store", signal: request.signal });
      if (!response.ok) throw new Error("article_unavailable");
      const result = await response.json() as { article?: PressReleaseArticle };
      if (!result.article) throw new Error("article_unavailable");
      if (articleRequest.current !== request || request.signal.aborted) return;
      setSelected(result.article);
      if (!result.article.isRead) {
        setArticles((current) => current?.map((candidate) => candidate.id === headline.id ? { ...candidate, isRead: true } : candidate) ?? current);
        void markPressReleaseRead(headline.id);
      }
    } catch {
      if (articleRequest.current === request) setArticleError("Could not open this article. Select it to try again.");
    } finally {
      clearTimeout(timeout);
      if (articleRequest.current === request) setOpening(false);
    }
  }

  return <>
    <DashboardPanel title="PR Scanner">
      <Stack spacing={0.15} sx={{ height: "100%", minHeight: 0 }}>
        {articles === null ? refreshFailed ? <Typography role="status" color="text.secondary" variant="body2">News could not be loaded. Retrying…</Typography> : <Box sx={{ display: "grid", flex: 1, placeItems: "center" }}><CircularProgress aria-label="Loading PR Scanner" size={22} /></Box> : articles.length ? articles.slice(0, 6).map((article) => <Button aria-label={`Open ${article.ticker} article: ${article.headline}`} key={article.id} onClick={() => selectArticle(article)} sx={{ display: "block", lineHeight: 1.3, minHeight: 0, minWidth: 0, overflow: "hidden", p: 0, textAlign: "left", textOverflow: "ellipsis", textTransform: "none", whiteSpace: "nowrap", width: "100%" }} title={`${article.ticker} ${article.headline}`}>
          <Box component="span" sx={{ color: "warning.main", fontSize: "0.95rem", fontWeight: article.isRead ? 800 : 900, letterSpacing: "0.02em", mr: 0.6 }}>{article.ticker}</Box>{article.headline}
        </Button>) : <Typography color="text.secondary" variant="body2">No recent scanner articles.</Typography>}
        <Box sx={{ mt: "auto", pt: 0.5 }}><Button onClick={onViewMore} size="small">Open scanner</Button></Box>
        {opening ? <Typography role="status" variant="body2">Opening article…</Typography> : null}
        {articleError ? <Typography role="alert" color="error" variant="body2">{articleError}</Typography> : null}
      </Stack>
    </DashboardPanel>
    {selected ? <PressReleaseArticleDrawer article={selected} onClose={() => setSelected(null)} /> : null}
  </>;
}

"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { DashboardPanel } from "../../dashboard-template";
import { PressReleaseArticleDrawer } from "../press-releases/press-release-article-drawer";
import { markPressReleaseRead } from "../press-releases/press-release-actions";

type ScannerResponse = Readonly<{ articles?: readonly PressReleaseArticle[] }>;

export function WorkspaceNewsScannerCard({ onViewMore }: Readonly<{ onViewMore: () => void }>) {
  const [articles, setArticles] = useState<readonly PressReleaseArticle[] | null>(null);
  const [selected, setSelected] = useState<PressReleaseArticle | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/platform/news/workspace-scanner", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<ScannerResponse> : Promise.reject(new Error("scanner_unavailable")))
      .then((result) => setArticles(result.articles ?? []))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setArticles([]); });
    return () => controller.abort();
  }, []);

  function selectArticle(article: PressReleaseArticle): void {
    setSelected(article);
    if (article.isRead) return;
    setArticles((current) => current?.map((candidate) => candidate.id === article.id ? Object.freeze({ ...candidate, isRead: true }) : candidate) ?? current);
    void markPressReleaseRead(article.id);
  }

  return <>
    <DashboardPanel title="PR Scanner">
      <Stack spacing={0.15} sx={{ height: "100%", minHeight: 0 }}>
        {articles === null ? <Box sx={{ display: "grid", flex: 1, placeItems: "center" }}><CircularProgress aria-label="Loading PR Scanner" size={22} /></Box> : articles.length ? articles.slice(0, 6).map((article) => <Button aria-label={`Open ${article.ticker} article: ${article.headline}`} key={article.id} onClick={() => selectArticle(article)} sx={{ display: "block", lineHeight: 1.3, minHeight: 0, minWidth: 0, overflow: "hidden", p: 0, textAlign: "left", textOverflow: "ellipsis", textTransform: "none", whiteSpace: "nowrap", width: "100%" }} title={`${article.ticker} ${article.headline}`}>
          <Box component="span" sx={{ color: "secondary.main", fontSize: "0.9rem", fontWeight: article.isRead ? 750 : 900, mr: 0.6 }}>{article.ticker}</Box>{article.headline}
        </Button>) : <Typography color="text.secondary" variant="body2">No recent scanner articles.</Typography>}
        <Box sx={{ mt: "auto", pt: 0.5 }}><Button onClick={onViewMore} size="small">Open scanner</Button></Box>
      </Stack>
    </DashboardPanel>
    <PressReleaseArticleDrawer article={selected} onClose={() => setSelected(null)} />
  </>;
}

"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { PressReleaseArticleDrawer, pressReleaseEasternTime } from "../press-releases/press-release-article-drawer";
import { markPressReleaseRead } from "../press-releases/press-release-actions";

type ScannerResponse = Readonly<{ articles?: readonly PressReleaseArticle[] }>;

export function WorkspaceNewsScannerPanel({ onClose }: Readonly<{ onClose: () => void }>) {
  const [articles, setArticles] = useState<readonly PressReleaseArticle[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<PressReleaseArticle | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/platform/news/workspace-scanner?view=expanded", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<ScannerResponse> : Promise.reject(new Error("scanner_unavailable")))
      .then((result) => setArticles(result.articles ?? []))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true); });
    return () => controller.abort();
  }, []);

  function selectArticle(article: PressReleaseArticle): void {
    setSelected(article);
    if (article.isRead) return;
    setArticles((current) => current?.map((candidate) => candidate.id === article.id ? Object.freeze({ ...candidate, isRead: true }) : candidate) ?? current);
    void markPressReleaseRead(article.id);
  }

  return <Slide appear direction="left" in><Box sx={{ minHeight: { xs: "70vh", md: "calc(100vh - 180px)" } }}>
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
      <Typography component="h2" variant="h2">News Scanner</Typography>
      <Button onClick={onClose} size="small" startIcon={<CloseRoundedIcon />}>Close News Scanner</Button>
    </Stack>
    {failed ? <Alert severity="error">News Scanner could not be loaded. Try again.</Alert> : articles === null ? <Box sx={{ display: "grid", minHeight: 280, placeItems: "center" }}><CircularProgress aria-label="Loading News Scanner" size={28} /></Box> : articles.length ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>{articles.map((article) => <Button aria-label={`Open ${article.ticker} article: ${article.headline}`} fullWidth key={article.id} onClick={() => selectArticle(article)} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "grid", gap: 1, gridTemplateColumns: { xs: "64px minmax(0, 1fr)", sm: "76px minmax(0, 1fr)" }, justifyContent: "initial", minHeight: 52, px: 1.5, py: 1, textAlign: "left", textTransform: "none" }}>
      <Typography noWrap sx={{ fontWeight: article.isRead ? 700 : 850 }} variant="body2">{article.ticker}</Typography>
      <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ display: "block", fontWeight: article.isRead ? 500 : 720 }} variant="body2">{article.headline}</Typography><Typography color="text.secondary" variant="caption">{pressReleaseEasternTime(article.publishedAt)}</Typography></Box>
    </Button>)}</Box> : <Alert severity="info">No recent scanner articles.</Alert>}
    <PressReleaseArticleDrawer article={selected} onClose={() => setSelected(null)} />
  </Box></Slide>;
}

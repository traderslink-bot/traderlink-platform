"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Alert, Box, Button, CircularProgress, Drawer, FormControlLabel, IconButton, Stack, Switch, Typography } from "@mui/material";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { markPressReleaseRead } from "../press-releases/press-release-actions";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

const PressReleaseArticleDrawer = dynamic(() => import("../press-releases/press-release-article-drawer").then((module) => module.PressReleaseArticleDrawer));

const scannerPublishedTime = new Intl.DateTimeFormat("en-US", {
  day: "numeric", hour: "numeric", hour12: true, minute: "2-digit",
  month: "short", timeZone: "America/New_York",
});
type ScannerHeadline = Pick<PressReleaseArticle, "id" | "ticker" | "headline" | "isRead" | "publishedAt">;
type ScannerResponse = Readonly<{ articles?: readonly ScannerHeadline[] }>;
type Preference = Readonly<{ revision: number | null; showInWorkspace: boolean }>;

export function WorkspaceNewsScannerPanel({ expectedAccountSelectionRef, initialPreference, onClose, onPreferenceSaved }: Readonly<{
  expectedAccountSelectionRef: string;
  initialPreference: Preference;
  onClose: () => void;
  onPreferenceSaved: (preference: Preference) => void;
}>) {
  const [articles, setArticles] = useState<readonly ScannerHeadline[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<PressReleaseArticle | null>(null);
  const [opening, setOpening] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const articleRequest = useRef<AbortController | null>(null);
  const [preference, setPreference] = useState(initialPreference);
  const [preferenceError, setPreferenceError] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let active = true;
    void fetch("/api/platform/news/workspace-scanner?view=expanded-summary", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<ScannerResponse> : Promise.reject(new Error("scanner_unavailable")))
      .then((result) => { if (active) setArticles(result.articles ?? []); })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false; controller.abort(); clearTimeout(timeout);
      articleRequest.current?.abort(); articleRequest.current = null;
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

  async function savePreference(showInWorkspace: boolean): Promise<void> {
    setPreferenceError(false); setSavingPreference(true);
    try {
      const response = await fetch("/api/platform/news/workspace-scanner/card-preference", {
        body: JSON.stringify({
          expectedAccountSelectionRef,
          expectedRevision: preference.revision,
          showInWorkspace,
        }),
        credentials: "same-origin",
        headers: { "content-type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
        method: "PUT",
      });
      const payload = await response.json() as Readonly<{ preference?: Preference }>;
      if (!response.ok || !payload.preference) throw new Error("preference_unavailable");
      setPreference(payload.preference);
      onPreferenceSaved(payload.preference);
    } catch {
      setPreferenceError(true);
    } finally {
      setSavingPreference(false);
    }
  }

  return <Drawer
    anchor="right"
    onClose={onClose}
    open
    slotProps={{ paper: { sx: { maxWidth: "100vw", width: { xs: "100%", md: 1040 } } } }}
  >
    <Stack sx={{ height: "100%", minHeight: 0 }}>
      <Stack direction="row" sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", px: { xs: 2, sm: 3 }, py: 1.25 }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">PR Scanner</Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Button color="inherit" component={Link} href="/press-releases" size="small">All press releases</Button>
          <IconButton aria-label="Close PR Scanner" onClick={onClose} sx={{ minHeight: 44, minWidth: 44 }}><CloseRoundedIcon /></IconButton>
        </Stack>
      </Stack>
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 2, sm: 3 }, py: 0.5 }}>
        <FormControlLabel control={<Switch checked={preference.showInWorkspace} disabled={savingPreference} onChange={(event) => void savePreference(event.target.checked)} />} label="Display PR Scanner card in Workspace" />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, sm: 3 } }}>
        {opening ? <Typography role="status">Opening article…</Typography> : null}
        {articleError ? <Alert severity="error">{articleError}</Alert> : null}
        {preferenceError ? <Alert severity="error" sx={{ mb: 1 }}>The Workspace card setting could not be saved. Try again.</Alert> : null}
        {failed ? <Alert severity="error">PR Scanner could not be loaded. Close and reopen it to try again.</Alert> : articles === null ? <Box sx={{ display: "grid", minHeight: 280, placeItems: "center" }}><CircularProgress aria-label="Loading PR Scanner" size={28} /></Box> : articles.length ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>{articles.map((article) => <Button aria-label={`Open ${article.ticker} article: ${article.headline}`} color="inherit" fullWidth key={article.id} onClick={() => selectArticle(article)} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "grid", gap: 1, gridTemplateColumns: { xs: "72px minmax(0, 1fr)", sm: "88px minmax(0, 1fr)" }, justifyContent: "initial", minHeight: 52, px: 1.5, py: 1, textAlign: "left", textTransform: "none" }}>
          <Typography noWrap sx={{ color: "warning.main", fontSize: "0.95rem", fontWeight: article.isRead ? 800 : 900, letterSpacing: "0.025em" }} variant="body2">{article.ticker}</Typography>
          <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "inherit", display: "block", fontWeight: article.isRead ? 550 : 750 }} variant="body2">{article.headline}</Typography><Typography sx={{ color: (theme) => theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.74)" : "text.secondary" }} variant="caption">{scannerPublishedTime.format(new Date(article.publishedAt))}</Typography></Box>
        </Button>)}</Box> : <Alert severity="info">No recent scanner articles.</Alert>}
      </Box>
      {selected ? <PressReleaseArticleDrawer article={selected} onClose={() => setSelected(null)} /> : null}
    </Stack>
  </Drawer>;
}

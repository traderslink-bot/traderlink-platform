"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Alert, Box, Button, CircularProgress, FormControlLabel, Slide, Stack, Switch, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { PressReleaseArticleDrawer, pressReleaseEasternTime } from "../press-releases/press-release-article-drawer";
import { markPressReleaseRead } from "../press-releases/press-release-actions";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

type ScannerResponse = Readonly<{ articles?: readonly PressReleaseArticle[] }>;
type Preference = Readonly<{ revision: number | null; showInWorkspace: boolean }>;

export function WorkspaceNewsScannerPanel({ expectedAccountSelectionRef, initialPreference, onClose, onPreferenceSaved }: Readonly<{
  expectedAccountSelectionRef: string;
  initialPreference: Preference;
  onClose: () => void;
  onPreferenceSaved: (preference: Preference) => void;
}>) {
  const [articles, setArticles] = useState<readonly PressReleaseArticle[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<PressReleaseArticle | null>(null);
  const [preference, setPreference] = useState(initialPreference);
  const [preferenceError, setPreferenceError] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);

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

  return <Slide appear direction="left" in><Box sx={{ color: (theme) => theme.palette.mode === "dark" ? theme.palette.common.white : "text.primary", minHeight: { xs: "70vh", md: "calc(100vh - 180px)" } }}>
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
      <Typography component="h2" variant="h2">PR Scanner</Typography>
      <Stack direction="row" spacing={0.5}><Button color="inherit" component={Link} href="/press-releases" size="small">All press releases</Button><Button color="inherit" onClick={onClose} size="small" startIcon={<CloseRoundedIcon />}>Close PR Scanner</Button></Stack>
    </Stack>
    <FormControlLabel control={<Switch checked={preference.showInWorkspace} disabled={savingPreference} onChange={(event) => void savePreference(event.target.checked)} />} label="Display PR Scanner card in Workspace" sx={{ color: "inherit", mb: 1 }} />
    {preferenceError ? <Alert severity="error" sx={{ mb: 1 }}>The Workspace card setting could not be saved. Try again.</Alert> : null}
    {failed ? <Alert severity="error">PR Scanner could not be loaded. Try again.</Alert> : articles === null ? <Box sx={{ display: "grid", minHeight: 280, placeItems: "center" }}><CircularProgress aria-label="Loading PR Scanner" size={28} /></Box> : articles.length ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>{articles.map((article) => <Button aria-label={`Open ${article.ticker} article: ${article.headline}`} color="inherit" fullWidth key={article.id} onClick={() => selectArticle(article)} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "grid", gap: 1, gridTemplateColumns: { xs: "72px minmax(0, 1fr)", sm: "88px minmax(0, 1fr)" }, justifyContent: "initial", minHeight: 52, px: 1.5, py: 1, textAlign: "left", textTransform: "none" }}>
      <Typography noWrap sx={{ color: "warning.main", fontSize: "0.95rem", fontWeight: article.isRead ? 800 : 900, letterSpacing: "0.025em" }} variant="body2">{article.ticker}</Typography>
      <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "inherit", display: "block", fontWeight: article.isRead ? 550 : 750 }} variant="body2">{article.headline}</Typography><Typography sx={{ color: (theme) => theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.74)" : "text.secondary" }} variant="caption">{pressReleaseEasternTime(article.publishedAt)}</Typography></Box>
    </Button>)}</Box> : <Alert severity="info">No recent scanner articles.</Alert>}
    <PressReleaseArticleDrawer article={selected} onClose={() => setSelected(null)} />
  </Box></Slide>;
}

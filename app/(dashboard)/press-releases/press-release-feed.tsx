"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  pressReleaseChannelDefinition,
  type PressReleaseArticle,
  type PressReleaseChannel,
} from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import { loadPressReleaseFeed, markPressReleaseChannelRead, markPressReleaseRead } from "./press-release-actions";
import { PressReleaseArticleDrawer, pressReleaseEasternTime, pressReleaseType } from "./press-release-article-drawer";

import { DEFAULT_NEWS_FILTERS, parseNewsFilters, type NewsFilters } from "@/src/modules/news/contracts/press-release-filters";
import type { SavedNewsView } from "@/src/modules/news/contracts/press-release-saved-views";
import { PressReleaseSavedViews } from "./press-release-saved-views";
import { retrySavingPressReleasePreference } from "./press-release-view-actions";
import { PressReleaseFilterControls } from "./press-release-filter-controls";

export function PressReleaseFeed({
  channel,
  initialArticles,
  initialSelectedArticle,
  initialPage, preferenceKey, initialFilters = DEFAULT_NEWS_FILTERS, initialPreferenceExists = false, initialSavedViews = [], initialSelectedViewId = "", initialFiltersOpen = false, alertsAllowed = true,
}: {
  initialFilters?: NewsFilters; initialPreferenceExists?: boolean; initialSavedViews?: readonly SavedNewsView[]; initialSelectedViewId?: string; initialFiltersOpen?: boolean; alertsAllowed?: boolean;
  initialPage: { more: boolean; nextOffset: number; asOf: string; filtersAllowed: boolean };
  preferenceKey: string;
  channel: PressReleaseChannel;
  initialArticles: readonly PressReleaseArticle[];
  initialSelectedArticle: PressReleaseArticle | null;
}) {
  const router = useRouter();
  const definition = pressReleaseChannelDefinition(channel);
  const [articles, setArticles] = useState<readonly PressReleaseArticle[]>(initialArticles);
  const [selected, setSelected] = useState<PressReleaseArticle | null>(initialSelectedArticle);
  const [filters, setFilters] = useState<NewsFilters>({ ...initialFilters });
  const [page, setPage] = useState(initialPage);
  const [preferenceSaved,setPreferenceSaved] = useState(true);
  const [savingPreference,startSavingPreference] = useTransition();
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);
  const [message, setMessage] = useState<string | null>(null);

  const fetchFeed = useCallback(async (next: NewsFilters, offset = 0, asOf?: string) => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      next = parseNewsFilters(next);
      const result = await loadPressReleaseFeed({ filters: next, offset, asOf, channel: channel === "news_filtered" ? "news_filtered" : "all" });
      if (version !== requestVersion.current) return;
      if (!result.ok) { setMessage(result.message); return; }
      const applied = result.page.filtersAllowed ? result.page.filters ?? next : { ...DEFAULT_NEWS_FILTERS };
      if (!offset && !asOf && result.page.filtersAllowed) setPreferenceSaved(result.preferenceSaved !== false);
      setFilters(applied); setPage(result.page); setMessage(null);
      setArticles(current => result.page.offset ? [...current, ...result.page.articles.filter(article => !current.some(existing => existing.id === article.id))] : result.page.articles);
      try { localStorage.setItem(`traderlink:news-view:v1:${preferenceKey}`, JSON.stringify(applied)); } catch { /* Browsing works without browser storage. */ }
    } catch { if (version === requestVersion.current) setMessage("News could not be loaded. Please try again."); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [preferenceKey, channel]);
  const invalidateRequests = useCallback(() => { requestVersion.current++; }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`traderlink:news-view:v1:${preferenceKey}`);
      if (saved && !initialPreferenceExists && initialPage.filtersAllowed) void fetchFeed(parseNewsFilters(JSON.parse(saved)));
    } catch { /* Ignore unavailable or obsolete preferences. */ }
    return invalidateRequests;
  }, [fetchFeed, initialPage.filtersAllowed, initialPreferenceExists, preferenceKey, invalidateRequests]);
  const [working, startTransition] = useTransition();
  const initialSelectedArticleId = initialSelectedArticle?.id ?? null;
  const initialSelectedArticleWasRead = initialSelectedArticle?.isRead ?? true;

  useEffect(() => {
    if (!initialSelectedArticleId || initialSelectedArticleWasRead) return;
    startTransition(async () => {
      const result = await markPressReleaseRead(initialSelectedArticleId);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setArticles((current) => current.map((article) =>
        article.id === initialSelectedArticleId
          ? Object.freeze({ ...article, isRead: true })
          : article));
      setSelected((current) => current?.id === initialSelectedArticleId
        ? Object.freeze({ ...current, isRead: true })
        : current);
      router.refresh();
    });
  }, [initialSelectedArticleId, initialSelectedArticleWasRead, router]);

  const visible = articles;

  function replaceArticleRead(articleId: string): void {
    setArticles((current) => current.map((article) =>
      article.id === articleId ? Object.freeze({ ...article, isRead: true }) : article));
    setSelected((current) => current?.id === articleId
      ? Object.freeze({ ...current, isRead: true })
      : current);
  }

  function selectArticle(article: PressReleaseArticle): void {
    setSelected(article);
    const url = new URL(window.location.href);
    url.searchParams.set("article", article.id);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
    if (article.isRead) return;
    replaceArticleRead(article.id);
    startTransition(async () => {
      const result = await markPressReleaseRead(article.id);
      if (!result.ok) setMessage(result.message);
      router.refresh();
    });
  }

  function closeDrawer(): void {
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("article");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }

  function markChannelRead(): void {
    startTransition(async () => {
      const result = await markPressReleaseChannelRead(channel);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setArticles((current) => current.map((article) => Object.freeze({ ...article, isRead: true })));
      setSelected((current) => current ? Object.freeze({ ...current, isRead: true }) : null);
      setMessage("All press releases are marked as read.");
      if (filters.read !== "all") void fetchFeed(filters);
      router.refresh();
    });
  }

  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { md: "flex-start" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography component="h1" variant="h1">{channel === "news_filtered" ? "PR Scanner" : definition.label}</Typography>

        </Box>
        <Button
          component={NextLink}
          href="/account/preferences#push-notifications"
          startIcon={<NotificationsActiveRoundedIcon />}
          sx={{ alignSelf: "flex-start", display: { xs: "inline-flex", md: "none" }, whiteSpace: "nowrap" }}
          variant="outlined"
        >
          Manage press release alerts
        </Button>
      </Stack>

      {!preferenceSaved?<Alert severity="warning" action={<Button disabled={savingPreference} onClick={()=>startSavingPreference(async()=>{const result=await retrySavingPressReleasePreference(filters);setPreferenceSaved(result.ok);})}>Retry saving</Button>}>Your news loaded, but this view could not be saved to your account.</Alert>:null}
      {message ? (
        <Alert onClose={() => setMessage(null)} severity={message.includes("marked") ? "success" : "error"}>
          {message}
        </Alert>
      ) : null}

      {page.filtersAllowed?<PressReleaseSavedViews initialViews={initialSavedViews} currentFilters={filters} initialSelectedId={initialSelectedViewId} onApply={next=>void fetchFeed(next)} alertsAllowed={alertsAllowed}/>:null}
      <DashboardPanel hideHeader>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {page.filtersAllowed ? <PressReleaseFilterControls value={filters} onApply={next => void fetchFeed(next)} disabled={loading} initialOpen={initialFiltersOpen} /> : null}
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Button
              component={NextLink}
              href="/account/preferences#push-notifications"
              startIcon={<NotificationsActiveRoundedIcon />}
              sx={{ display: { xs: "none", md: "inline-flex" }, whiteSpace: "nowrap" }}
              variant="outlined"
            >
              Manage press release alerts
            </Button>
            <Button disabled={working || articles.every((article) => article.isRead)} onClick={markChannelRead} startIcon={<CheckRoundedIcon />}>
              Mark all read
            </Button>
          </Stack>
        </Stack>

        <Box aria-busy={loading} sx={{ mt: 2 }}>
          {loading ? <Typography variant="body2" role="status">Loading news…</Typography> : null}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              color: "text.secondary",
              display: { xs: "none", md: "grid" },
              fontSize: 11,
              fontWeight: 800,
              gap: 1.5,
              gridTemplateColumns: "12px 74px 72px 106px 112px minmax(260px, 1fr)",
              letterSpacing: "0.04em",
              px: 1.25,
              py: 1,
              textTransform: "uppercase",
            }}
          >
            <span />
            <span>Published ET</span>
            <span>Ticker</span>
            <span>Market cap</span>
            <span>Type</span>
            <span>Headline</span>
          </Box>
          {visible.length === 0 ? (
            <Stack sx={{ alignItems: "center", minHeight: 180, justifyContent: "center", textAlign: "center" }}>
              <Typography sx={{ fontWeight: 700 }}>No matching press releases</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                {JSON.stringify(filters) !== JSON.stringify(DEFAULT_NEWS_FILTERS)
                  ? "Try a different search or show all articles."
                  : "New eligible press releases will appear here as they are published."}
              </Typography>
            </Stack>
          ) : visible.map((article) => (
            <Box
              aria-label={`Open ${article.ticker} press release: ${article.headline}`}
              component="button"
              key={article.id}
              onClick={() => selectArticle(article)}
              sx={{
                alignItems: { md: "center" },
                appearance: "none",
                background: (theme) => article.isRead ? "transparent" : theme.palette.mode === "dark" ? theme.palette.action.selected : "rgba(1, 30, 86, 0.035)",
                border: 0,
                borderBottom: 1,
                borderColor: "divider",
                color: "text.primary",
                cursor: "pointer",
                display: { xs: "block", md: "grid" },
                font: "inherit",
                gap: { md: 1.5 },
                gridTemplateColumns: { md: "12px 74px 72px 106px 112px minmax(260px, 1fr)" },
                minHeight: { xs: 76, md: 56 },
                p: { xs: 1.5, md: 1.25 },
                textAlign: "left",
                width: "100%",
                "&:hover": { bgcolor: "action.hover" },
                "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: -3 },
              }}
            >
              <Box
                sx={{
                  display: { xs: "flex", md: "none" },
                  gap: 1,
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <Box aria-hidden sx={{ bgcolor: article.isRead ? "transparent" : "primary.main", borderRadius: "50%", flex: "0 0 auto", height: 8, mt: 0.75, width: 8 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography noWrap sx={{ fontWeight: article.isRead ? 700 : 850 }} variant="body2">{article.ticker}</Typography>
                    <Typography color="text.secondary" noWrap variant="caption">{pressReleaseEasternTime(article.publishedAt, true)}</Typography>
                    {article.marketCap ? <Typography color="text.secondary" noWrap variant="caption">{article.marketCap}</Typography> : null}
                  </Stack>
                  <Typography
                    sx={{ fontWeight: article.isRead ? 500 : 720, mt: 0.35, overflowWrap: "anywhere" }}
                    variant="body2"
                  >
                    {article.headline}
                  </Typography>
                </Box>
              </Box>
              <Box aria-hidden sx={{ bgcolor: article.isRead ? "transparent" : "primary.main", borderRadius: "50%", display: { xs: "none", md: "block" }, height: 8, width: 8 }} />
              <Box sx={{ display: { xs: "none", md: "block" } }}><Typography color="text.secondary" variant="caption" component="div">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(article.publishedAt))}</Typography><Typography color="text.secondary" noWrap variant="caption">{pressReleaseEasternTime(article.publishedAt)}</Typography></Box>
              <Typography noWrap sx={{ display: { xs: "none", md: "block" }, fontWeight: article.isRead ? 700 : 850 }} variant="body2">{article.ticker}</Typography>
              <Typography color="text.secondary" noWrap sx={{ display: { xs: "none", md: "block" } }} variant="caption">{article.marketCap ?? "Unknown"}</Typography>
              <Typography color="text.secondary" noWrap sx={{ display: { xs: "none", md: "block" }, textTransform: "capitalize" }} variant="caption">{pressReleaseType(article)}</Typography>
              <Typography
                noWrap
                sx={{ display: { xs: "none", md: "block" }, fontWeight: article.isRead ? 500 : 720, minWidth: 0 }}
                variant="body2"
              >
                {article.headline}
              </Typography>
            </Box>
          ))}
        </Box>
        {page.more ? <Button disabled={loading} onClick={() => void fetchFeed(filters, page.nextOffset, page.asOf)}>Load more</Button> : null}
      </DashboardPanel>

      <PressReleaseArticleDrawer article={selected} onClose={closeDrawer} />
    </DashboardPage>
  );
}

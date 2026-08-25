"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  pressReleaseChannelDefinition,
  type PressReleaseArticle,
  type PressReleaseChannel,
} from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import { markPressReleaseChannelRead, markPressReleaseRead } from "./press-release-actions";

function easternTime(value: string, includeDate = false): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    day: includeDate ? "numeric" : undefined,
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    month: includeDate ? "short" : undefined,
    timeZone: "America/New_York",
  }).format(date);
}

function releaseType(article: PressReleaseArticle): string {
  if (article.routeTag === "default" || article.routeTag === "spike") return "News Scanner";
  if (article.routeTag === "market_cap_under_30m") return "Under $30M";
  if (article.routeTag === "market_cap_30m_to_50m") return "$30M–$50M";
  if (article.routeTag === "market_cap_50m_to_100m") return "$50M–$100M";
  const value = article.eventType?.replace(/[_-]+/gu, " ").trim();
  if (value) return value.replace(/\b\w/gu, (letter) => letter.toUpperCase());
  return "News";
}

function DetailSection({ items, title }: { items: readonly string[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <Box>
      <Typography component="h3" sx={{ fontWeight: 800 }} variant="subtitle2">{title}</Typography>
      <Stack component="ul" spacing={0.75} sx={{ mb: 0, mt: 1, pl: 2.5 }}>
        {items.map((item, index) => (
          <Typography component="li" key={`${title}-${index}`} variant="body2">{item}</Typography>
        ))}
      </Stack>
    </Box>
  );
}

export function PressReleaseFeed({
  channel,
  initialArticles,
  initialSelectedArticle,
}: {
  channel: PressReleaseChannel;
  initialArticles: readonly PressReleaseArticle[];
  initialSelectedArticle: PressReleaseArticle | null;
}) {
  const router = useRouter();
  const definition = pressReleaseChannelDefinition(channel);
  const [articles, setArticles] = useState<readonly PressReleaseArticle[]>(initialArticles);
  const [selected, setSelected] = useState<PressReleaseArticle | null>(initialSelectedArticle);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "unread">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();
  const initialSelectedArticleId = initialSelectedArticle?.id ?? null;
  const initialSelectedArticleWasRead = initialSelectedArticle?.isRead ?? true;
  const pageDescription = channel === "news_filtered"
    ? "Scans the market for small cap stocks with recent press releases, that show signs of momentum."
    : "AI-summarized press releases help you understand the news fast—so you can look beyond the headline before making a trading decision.";

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

  const visible = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    return articles.filter((article) => {
      if (view === "unread" && article.isRead) return false;
      if (!normalized) return true;
      return `${article.ticker} ${article.headline} ${article.summary ?? ""}`.toUpperCase().includes(normalized);
    });
  }, [articles, query, view]);

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
      setMessage("This channel is marked as read.");
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
          <Typography component="h1" variant="h1">{definition.label}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
            {pageDescription}
          </Typography>
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

      {message ? (
        <Alert onClose={() => setMessage(null)} severity={message.includes("marked") ? "success" : "error"}>
          {message}
        </Alert>
      ) : null}

      <DashboardPanel hideHeader>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
        >
          <TextField
            fullWidth
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ticker or headline"
            size="small"
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
              },
            }}
            sx={{ maxWidth: { md: 420 } }}
            value={query}
          />
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
            <ToggleButtonGroup
              exclusive
              onChange={(_, value: "all" | "unread" | null) => value && setView(value)}
              size="small"
              value={view}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="unread">Unread</ToggleButton>
            </ToggleButtonGroup>
            <Button disabled={working || articles.every((article) => article.isRead)} onClick={markChannelRead} startIcon={<CheckRoundedIcon />}>
              Mark channel read
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ mt: 2 }}>
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
            <span>Time ET</span>
            <span>Ticker</span>
            <span>Market cap</span>
            <span>Type</span>
            <span>Headline</span>
          </Box>
          {visible.length === 0 ? (
            <Stack sx={{ alignItems: "center", minHeight: 180, justifyContent: "center", textAlign: "center" }}>
              <Typography sx={{ fontWeight: 700 }}>No matching press releases</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                {query.trim() || view === "unread"
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
                background: article.isRead ? "transparent" : "rgba(1, 30, 86, 0.035)",
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
                    <Typography color="text.secondary" noWrap variant="caption">{easternTime(article.publishedAt)}</Typography>
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
              <Typography color="text.secondary" noWrap sx={{ display: { xs: "none", md: "block" } }} variant="caption">{easternTime(article.publishedAt)}</Typography>
              <Typography noWrap sx={{ display: { xs: "none", md: "block" }, fontWeight: article.isRead ? 700 : 850 }} variant="body2">{article.ticker}</Typography>
              <Typography color="text.secondary" noWrap sx={{ display: { xs: "none", md: "block" } }} variant="caption">{article.marketCap ?? ""}</Typography>
              <Typography color="text.secondary" noWrap sx={{ display: { xs: "none", md: "block" }, textTransform: "capitalize" }} variant="caption">{releaseType(article)}</Typography>
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
      </DashboardPanel>

      <Drawer
        anchor="right"
        onClose={closeDrawer}
        open={selected !== null}
        slotProps={{ paper: { sx: { maxWidth: "100%", width: { xs: "100%", sm: 620 } } } }}
      >
        {selected ? (
          <Stack spacing={2.25} sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography color="primary" sx={{ fontSize: { xs: "1.35rem", sm: "1.5rem" }, fontWeight: 900, lineHeight: 1.15 }}>
                  {selected.ticker}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.75 }}>
                  {selected.marketCap ? <Chip label={selected.marketCap} size="small" variant="outlined" /> : null}
                  <Chip label={releaseType(selected)} size="small" variant="outlined" />
                  <Typography color="text.secondary" variant="caption">
                    {easternTime(selected.publishedAt, true)} ET
                  </Typography>
                </Stack>
              </Box>
              <Tooltip title="Close article">
                <IconButton aria-label="Close article" onClick={closeDrawer}><CloseRoundedIcon /></IconButton>
              </Tooltip>
            </Stack>
            <Typography component="h2" variant="h2">{selected.headline}</Typography>
            {selected.summary ? (
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }} variant="subtitle2">AI summary</Typography>
                <Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }} variant="body2">{selected.summary}</Typography>
              </Box>
            ) : null}
            <Divider />
            <DetailSection items={selected.positives} title="Positives" />
            <DetailSection items={selected.negatives} title="Negatives" />
            <DetailSection items={selected.riskFlags} title="Risk flags" />
            <DetailSection items={selected.supportResistanceLevels} title="Support and resistance" />
            <Divider />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button component={NextLink} endIcon={<LaunchRoundedIcon />} href={selected.publicPath} variant="contained">
                Open article page
              </Button>
              <Button component={NextLink} href="/account/trading#pwa-app" variant="outlined">
                Set up the TradersLink app
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Drawer>
    </DashboardPage>
  );
}

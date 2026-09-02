"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";

export function pressReleaseEasternTime(value: string, includeDate = false): string {
  return new Intl.DateTimeFormat("en-US", {
    day: includeDate ? "numeric" : undefined,
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    month: includeDate ? "short" : undefined,
    timeZone: "America/New_York",
  }).format(new Date(value));
}

export function pressReleaseType(article: PressReleaseArticle): string {
  if (article.routeTag === "default" || article.routeTag === "spike") return "News Scanner";
  if (article.routeTag === "market_cap_under_30m") return "Under $30M";
  if (article.routeTag === "market_cap_30m_to_50m") return "$30M–$50M";
  if (article.routeTag === "market_cap_50m_to_100m") return "$50M–$100M";
  const value = article.eventType?.replace(/[_-]+/gu, " ").trim();
  return value ? value.replace(/\b\w/gu, (letter) => letter.toUpperCase()) : "News";
}

function DetailSection({ items, title }: Readonly<{ items: readonly string[]; title: string }>) {
  if (items.length === 0) return null;
  return <Box>
    <Typography component="h3" sx={{ fontWeight: 800 }} variant="subtitle2">{title}</Typography>
    <Stack component="ul" spacing={0.75} sx={{ mb: 0, mt: 1, pl: 2.5 }}>
      {items.map((item, index) => <Typography component="li" key={`${title}-${index}`} variant="body2">{item}</Typography>)}
    </Stack>
  </Box>;
}

export function PressReleaseArticleDrawer({ article, onClose }: Readonly<{
  article: PressReleaseArticle | null;
  onClose: () => void;
}>) {
  return <Drawer anchor="right" onClose={onClose} open={article !== null} slotProps={{ paper: { sx: { maxWidth: "100%", width: { xs: "100%", sm: 620 } } } }}>
    {article ? <Stack spacing={2.25} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography color="primary" sx={{ fontSize: { xs: "1.35rem", sm: "1.5rem" }, fontWeight: 900, lineHeight: 1.15 }}>{article.ticker}</Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.75 }}>
            {article.marketCap ? <Chip label={article.marketCap} size="small" variant="outlined" /> : null}
            <Chip label={pressReleaseType(article)} size="small" variant="outlined" />
            <Typography color="text.secondary" variant="caption">{pressReleaseEasternTime(article.publishedAt, true)} ET</Typography>
          </Stack>
        </Box>
        <Tooltip title="Close article"><IconButton aria-label="Close article" onClick={onClose}><CloseRoundedIcon /></IconButton></Tooltip>
      </Stack>
      <Typography component="h2" variant="h2">{article.headline}</Typography>
      {article.summary ? <Box><Typography component="h3" sx={{ fontWeight: 800 }} variant="subtitle2">AI summary</Typography><Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }} variant="body2">{article.summary}</Typography></Box> : null}
      <Divider />
      <DetailSection items={article.positives} title="Positives" />
      <DetailSection items={article.negatives} title="Negatives" />
      <DetailSection items={article.riskFlags} title="Risk flags" />
      <DetailSection items={article.supportResistanceLevels} title="Support and resistance" />
      <Divider />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button component={NextLink} endIcon={<LaunchRoundedIcon />} href={article.publicPath} variant="contained">Open article page</Button>
        <Button component={NextLink} href="/account/trading#pwa-app" variant="outlined">Set up the TradersLink app</Button>
      </Stack>
    </Stack> : null}
  </Drawer>;
}

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ANALYZED_TRADES_HREF } from "../trade-analyzer/analyzer-trade";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-template";
import { pressReleaseChannelDefinition } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { PLATFORM_HOME_PAGES } from "@/src/modules/platform/contracts/platform-home-page";
import { hasGeneralMarketNewsAccess } from "@/src/modules/news/server/general-market-news-access";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { loginReturnTo } from "@/src/modules/platform/server/authentication/platform-login-http";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { readPlatformHomeAccess } from "@/src/modules/platform/server/identity/platform-home-page-access";
import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";

export const metadata: Metadata = {
  title: `${PLATFORM_HOME_PAGES.welcome.label} | TraderLink Platform`,
  robots: { index: false, follow: false },
};

export default async function HomePage() {
  const requestHeaders = await headers();
  let identity;
  try {
    identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(requestHeaders);
  } catch (error) {
    if (isTraderLinkPlatformError(error) && (
      error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ||
      error.code === "TRADERLINK_AUTH_SESSION_INVALID"
    )) {
      const returnTo = loginReturnTo(requestHeaders.get("x-traderlink-page-return-to"), PLATFORM_HOME_PAGES.welcome.href);
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    throw error;
  }
  const { dashboard, homePages, journal, weekAhead, sessionTracker } = withReadonlyPlatformDatabase({}, database => {
    const access = readPlatformHomeAccess(database, identity, requestHeaders);
    if (!access.homePages.welcome) redirect(PLATFORM_HOME_PAGES["journal-workspace"].href);

    const hasFeature = (feature: string) => identity.mode === "local_development" ||
      evaluateMembershipFeature(database, identity.scope.userId, feature).allowed;

    return {
      ...access,
      weekAhead: access.dashboard && hasFeature("news.week_ahead"),
      sessionTracker: access.dashboard && access.journal && hasFeature("journal.session_tracker"),
    };
  });

  const tradingLinks = [
    ...(homePages["trading-workspace"] ? [PLATFORM_HOME_PAGES["trading-workspace"]] : []),
    ...(homePages.scanners ? [PLATFORM_HOME_PAGES.scanners] : []),
    ...(homePages.screeners ? [PLATFORM_HOME_PAGES.screeners] : []),
    ...(dashboard ? [{ href: "/charts", label: "Market Charts" }] : [{ href: "/plans", label: "Explore Trading Tools plans" }]),
  ];
  const pressReleaseLinks = dashboard && hasPressReleaseDashboardAccess(identity)
    ? ([
        "news_filtered",
        "market_cap_under_30m",
        "market_cap_30m_to_50m",
        "market_cap_50m_to_100m",
      ] as const).map(pressReleaseChannelDefinition)
    : [];
  const newsLinks = [
    ...(weekAhead ? [{ href: "/market-news/week-ahead", label: "The Week Ahead" }] : []),
    ...(dashboard && hasGeneralMarketNewsAccess(identity) ? [{ href: "/market-news/general", label: "General Market News" }] : []),
    ...pressReleaseLinks,
  ];
  const journalLinks = [
    ...(journal ? [PLATFORM_HOME_PAGES["journal-workspace"]] : [{ href: "/plans?feature=journal.access", label: "Explore Trading Journal plans" }]),
    ...(sessionTracker ? [{ href: "/trade-tracker", label: "Session Tracker" }] : []),
  ];
  const cards = [
    {
      title: "Trading Tools",
      description: "Scan for trading opportunities, filter stocks by your criteria, and check price action on charts.",
      links: tradingLinks,
    },
    {
      title: "Market News",
      description: "Follow market events and find company announcements that could move a stock.",
      links: newsLinks.length > 0 ? newsLinks : [{ href: "/news", label: "Read Market News" }],
    },
    {
      title: "Trade Analyzer",
      description: "Enter your executions and see the trade on a chart with entry and exit markers and a breakdown of the trade.",
      links: [
        { href: "/trade-analyzer", label: "Open Trade Analyzer" },
        { href: ANALYZED_TRADES_HREF, label: "Your analyzed trades" },
      ],
    },
    {
      title: "Trading Journal",
      description: "Log your trades, review your sessions, and track your performance.",
      links: journalLinks,
    },
  ];

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">{PLATFORM_HOME_PAGES.welcome.label}</Typography>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" } }}>
        {cards.map(({ title, description, links }) => (
          <DashboardPanel key={title} title={title}>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>{description}</Typography>
            <Stack component="ul" spacing={0.25} sx={{ listStyle: "none", m: 0, p: 0 }}>
              {links.map(({ href, label }) => (
                <Box component="li" key={href}>
                  <Button
                    endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
                    href={href}
                    sx={{ justifyContent: "space-between", minHeight: 44, textAlign: "left", width: "100%" }}
                  >
                    {label}
                  </Button>
                </Box>
              ))}
            </Stack>
          </DashboardPanel>
        ))}
      </Box>
    </DashboardPage>
  );
}

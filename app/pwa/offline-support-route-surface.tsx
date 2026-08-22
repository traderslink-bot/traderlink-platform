"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountSettingsLayout, type AccountSettingsSection } from "@/app/(dashboard)/account/account-settings-layout";
import { OfflineDataSettings } from "@/app/(dashboard)/account/offline-data-settings";
import { HelpArticle } from "@/app/(dashboard)/help/help-article";
import { HelpCollectionOverview } from "@/app/(dashboard)/help/help-collection-overview";
import { HelpSearch } from "@/app/(dashboard)/help/help-search";
import { NotificationList } from "@/app/(dashboard)/notifications/notification-list";
import { DashboardPage, DashboardPanel, DashboardUnavailableState } from "@/app/dashboard-ui";
import { AI_CHAT_HELP_GUIDES } from "@/src/modules/help/ai-chat-guides";
import { AI_REVIEWS_HELP_GUIDES } from "@/src/modules/help/ai-reviews-guides";
import { CALENDAR_HELP_GUIDES } from "@/src/modules/help/calendar-guides";
import { CANDLE_REVIEW_HELP_GUIDES } from "@/src/modules/help/candle-review-guides";
import { CORE_ANALYTICS_HELP_GUIDES } from "@/src/modules/help/core-analytics-guides";
import { DAILY_TRADE_TRACKER_HELP_GUIDES } from "@/src/modules/help/daily-trade-tracker-guides";
import { DATA_DECISIONS_HELP_GUIDES } from "@/src/modules/help/data-decisions-guides";
import { HELP_NAVIGATION_ITEMS, HELP_SEARCH_RECORDS } from "@/src/modules/help/help-content-registry";
import type { HelpGuide } from "@/src/modules/help/help-guide-types";
import { NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES } from "@/src/modules/help/notifications-and-imports-guides";
import { OPEN_POSITIONS_HELP_GUIDES } from "@/src/modules/help/open-positions-guides";
import { PAID_PLAN_HELP_GUIDES } from "@/src/modules/help/paid-plan-guides";
import { QUICK_TRADE_ENTRY_HELP_GUIDES } from "@/src/modules/help/quick-trade-entry-guides";
import { SWING_TRADE_TRACKER_HELP_GUIDES } from "@/src/modules/help/swing-trade-tracker-guides";
import { TRADE_ANALYZER_HELP_GUIDES } from "@/src/modules/help/trade-analyzer-guides";
import { TRADE_EXPLORER_HELP_GUIDES } from "@/src/modules/help/trade-explorer-guides";
import { TRADE_TAGS_HELP_GUIDES } from "@/src/modules/help/trade-tags-guides";
import { TRADING_RULES_HELP_GUIDES } from "@/src/modules/help/trading-rules-guides";
import { TRADERSLINK_APP_HELP_GUIDES } from "@/src/modules/help/traderslink-app-guides";
import { TOOLS_HELP_GUIDES } from "@/src/modules/help/tools-guides";
import { readPlatformOfflineView } from "@/src/modules/platform/client/pwa/offline-projection-store";
import {
  isPlatformOfflineNotificationsViewModel,
  PLATFORM_OFFLINE_NOTIFICATIONS_VIEW_KEY,
  PLATFORM_OFFLINE_SUPPORT_VIEW_VERSION,
  type PlatformOfflineNotificationsViewModel,
} from "@/src/modules/platform/contracts/platform-offline-support-view-contracts";
import { PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

import { OfflineSavedViewStatus } from "./offline-saved-view-status";
import { OfflineAiReviewsSurface } from "./offline-ai-reviews-surface";
import { AiComingSoonPage } from "../(dashboard)/ai-coming-soon";
import { areTraderLinkPlatformAiFeaturesEnabled } from
  "@/src/modules/platform/contracts/platform-ai-launch-state";

export type OfflineSupportRouteKind =
  | "account"
  | "ai-chat"
  | "ai-reviews"
  | "charts"
  | "data-decisions"
  | "help"
  | "imports"
  | "notifications";

type HelpCollection = Readonly<{
  description: string;
  guides: readonly HelpGuide[];
  href: string;
  title: string;
}>;

const HELP_COLLECTIONS: readonly HelpCollection[] = Object.freeze([
  { description: "Ask about saved trading facts and understand what Links can prepare.", guides: AI_CHAT_HELP_GUIDES, href: "/help/ai-chat", title: "Links AI Chat" },
  { description: "Schedule, prepare, read and troubleshoot AI Reviews.", guides: AI_REVIEWS_HELP_GUIDES, href: "/help/ai-reviews", title: "AI Reviews" },
  { description: "Read completed Trade Tracker results by week or month.", guides: CALENDAR_HELP_GUIDES, href: "/help/calendar", title: "Calendar" },
  { description: "Request and read optional market context for eligible trades.", guides: CANDLE_REVIEW_HELP_GUIDES, href: "/help/candle-review", title: "Candle Review" },
  { description: "Read Analytics and compare results by ticker, timing and execution.", guides: CORE_ANALYTICS_HELP_GUIDES, href: "/help/core-analytics", title: "Analytics" },
  { description: "Record executions, review trades and complete each trading day.", guides: DAILY_TRADE_TRACKER_HELP_GUIDES, href: "/help/daily-trade-tracker", title: "Daily Trade Tracker" },
  { description: "Answer Journal questions using the broker evidence you trust.", guides: DATA_DECISIONS_HELP_GUIDES, href: "/help/data-decisions", title: "Data Decisions" },
  { description: "Find updates, choose notification delivery and finish imports.", guides: NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES, href: "/help/notifications-and-imports", title: "Notifications and imports" },
  { description: "Learn how to use TraderLink tools such as Halt Alerts.", guides: TOOLS_HELP_GUIDES, href: "/help/tools", title: "Tools" },
  { description: "See confirmed positions and their trader-defined status.", guides: OPEN_POSITIONS_HELP_GUIDES, href: "/help/open-positions", title: "Open Positions" },
  { description: "Understand paid access, billing and account connection.", guides: PAID_PLAN_HELP_GUIDES, href: "/help/paid-plan", title: "Paid plan and billing" },
  { description: "Enter completed executions across past trading dates.", guides: QUICK_TRADE_ENTRY_HELP_GUIDES, href: "/help/quick-trade-entry", title: "Quick Trade Entry" },
  { description: "Use intentional swing positions, notes and completed history.", guides: SWING_TRADE_TRACKER_HELP_GUIDES, href: "/help/swing-trade-tracker", title: "Swing Trade Tracker" },
  { description: "Understand entry, exit, MFE, MAE and saved candle evidence.", guides: TRADE_ANALYZER_HELP_GUIDES, href: "/help/trade-analyzer", title: "Trade Analyzer" },
  { description: "Inspect individual trades and compare saved result groups.", guides: TRADE_EXPLORER_HELP_GUIDES, href: "/help/trade-explorer", title: "Trade Explorer" },
  { description: "Label trades with preset or custom observations.", guides: TRADE_TAGS_HELP_GUIDES, href: "/help/trade-tags", title: "Trade Tags" },
  { description: "Choose rules and understand the evidence behind each result.", guides: TRADING_RULES_HELP_GUIDES, href: "/help/trading-rules", title: "Trading Rules" },
  { description: "Install TradersLink, use saved pages and trade entry offline, manage device storage and choose push alerts.", guides: TRADERSLINK_APP_HELP_GUIDES, href: "/help/traderslink-app", title: "TradersLink app" },
]);

const ONLINE_REQUIRED: Readonly<Record<Exclude<OfflineSupportRouteKind, "account" | "ai-reviews" | "help" | "notifications">, Readonly<{ description: string; title: string }>>> = Object.freeze({
  "ai-chat": { description: "Your conversations stay account-scoped. Reconnect to load saved chats, ask Links a question, or prepare a Journal draft.", title: "Connect to use Links AI Chat" },
  charts: { description: "Market Charts needs a live market-data connection and does not save provider charts to this device.", title: "Connect to load Market Charts" },
  "data-decisions": { description: "Data Decisions can change official Journal facts. Reconnect so every choice is checked against the latest broker evidence.", title: "Connect to review Data Decisions" },
  imports: { description: "Trade imports require the current account, source evidence and server duplicate checks. No statement or broker file is staged while offline.", title: "Connect to import trades" },
});

export function offlineSupportRouteKind(pathname: string): OfflineSupportRouteKind | null {
  if (pathname === "/notifications") return "notifications";
  if (pathname === "/account" || pathname.startsWith("/account/")) return "account";
  if (pathname === "/help" || pathname.startsWith("/help/")) return "help";
  if (pathname === "/ai-chat" || pathname.startsWith("/ai-chat/")) return "ai-chat";
  if (pathname === "/ai-reviews" || pathname.startsWith("/ai-reviews/")) return "ai-reviews";
  if (pathname === "/imports") return "imports";
  if (pathname === "/charts") return "charts";
  if (pathname === "/data-decisions") return "data-decisions";
  return null;
}

function accountSection(pathname: string): AccountSettingsSection {
  if (pathname.startsWith("/account/trading")) return "trading";
  if (pathname.startsWith("/account/ai")) return "ai";
  if (pathname.startsWith("/account/profile")) return "profile";
  if (pathname.startsWith("/account/privacy")) return "privacy";
  return "preferences";
}

function OfflineAccount({ accountSelectionRef, offlineScopeRef, pathname }: {
  accountSelectionRef: string;
  offlineScopeRef: string;
  pathname: string;
}) {
  const activeSection = accountSection(pathname);
  const title = activeSection === "preferences" ? "Notifications"
    : activeSection === "trading" ? "General"
      : activeSection === "ai" ? "AI & plan"
        : activeSection === "profile" ? "Profile"
          : "Delete Account";
  return (
    <AccountSettingsLayout activeSection={activeSection} description="Manage this device offline. Reconnect for account, security, broker, reporting and delivery changes." title={title}>
      {activeSection === "trading" ? (
        <DashboardPanel title="Mobile and Desktop PWA App">
          <OfflineDataSettings accountSelectionRef={accountSelectionRef} offlineScopeRef={offlineScopeRef} />
        </DashboardPanel>
      ) : null}
      <DashboardPanel title={`${title} changes`}>
        <DashboardUnavailableState compact description="Reconnect to load the latest account information and make changes safely." title="Connection required" />
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}

function OfflineHelp({ pathname }: { pathname: string }) {
  if (pathname === "/help") {
    const collections = HELP_NAVIGATION_ITEMS.filter((item) => item.depth !== 1 && item.href !== "/help");
    return (
      <DashboardPage>
        <Box>
          <Typography component="h1" variant="h1">Help Center</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Find clear answers and learn how TraderLink features work.</Typography>
        </Box>
        <Alert severity="info">TraderLink&apos;s first-party guides are included with the installed app and remain available offline.</Alert>
        <HelpSearch records={HELP_SEARCH_RECORDS} />
        <DashboardPanel title="Help topics">
          <Stack spacing={0.5}>
            {collections.map((item) => <Button component={Link} href={item.href} key={item.href} sx={{ justifyContent: "flex-start" }} variant="text">{item.label}</Button>)}
          </Stack>
        </DashboardPanel>
      </DashboardPage>
    );
  }
  const collection = HELP_COLLECTIONS.find((candidate) => pathname === candidate.href || pathname.startsWith(`${candidate.href}/`));
  if (!collection) return <DashboardPage><DashboardUnavailableState compact description="This help page is not included in the current installed version." title="Help page unavailable" /></DashboardPage>;
  if (pathname === collection.href) {
    return <HelpCollectionOverview actions={[]} description={collection.description} guides={collection.guides} highlights={["These guides are included with the installed app.", "Actions that change account or Journal data still require a connection."]} href={collection.href} steps={[{ description: "Choose the guide that matches what you are trying to do.", title: "Choose a guide" }, { description: "Follow the same instructions used by the website app.", title: "Read the steps" }, { description: "Reconnect before completing an action that changes saved data.", title: "Make changes safely" }]} title={collection.title} />;
  }
  const slug = pathname.slice(collection.href.length + 1).split("/")[0] ?? "";
  const guide = collection.guides.find((candidate) => candidate.slug === slug);
  return guide
    ? <HelpArticle collectionHref={collection.href} collectionTitle={collection.title} guide={guide} guides={collection.guides} />
    : <DashboardPage><DashboardUnavailableState compact description="This help article is not included in the current installed version." title="Help article unavailable" /></DashboardPage>;
}

function OfflineNotifications({ partitionKey }: { partitionKey: string }) {
  const [state, setState] = useState<Readonly<{ model?: PlatformOfflineNotificationsViewModel; savedAtUtc?: string; status: "loading" | "ready" | "unavailable" }>>({ status: "loading" });
  useEffect(() => {
    let active = true;
    void readPlatformOfflineView(partitionKey, PLATFORM_OFFLINE_NOTIFICATIONS_VIEW_KEY).then((view) => {
      if (!active) return;
      if (view?.schemaVersion !== PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION || view.pathname !== "/notifications" || view.routeViewVersion !== PLATFORM_OFFLINE_SUPPORT_VIEW_VERSION || !isPlatformOfflineNotificationsViewModel(view.model)) {
        setState({ status: "unavailable" });
        return;
      }
      setState({ model: view.model, savedAtUtc: view.savedAtUtc, status: "ready" });
    }).catch(() => { if (active) setState({ status: "unavailable" }); });
    return () => { active = false; };
  }, [partitionKey]);
  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Notifications</Typography>
      {state.status === "loading" ? <Stack role="status" sx={{ alignItems: "center", minHeight: 260, justifyContent: "center" }}><CircularProgress size={28} /></Stack> : null}
      {state.status === "unavailable" ? <DashboardUnavailableState compact description="Open Notifications once while connected so TraderLink can save its latest privacy-safe updates on this device." title="No saved notifications are available" /> : null}
      {state.status === "ready" && state.model && state.savedAtUtc ? <><OfflineSavedViewStatus savedAtUtc={state.savedAtUtc} message="Saved notifications are available offline. Reconnect to mark them read, dismiss them, or change delivery preferences." /><DashboardPanel title="All notifications"><NotificationList notifications={state.model.notifications} offline /></DashboardPanel></> : null}
    </DashboardPage>
  );
}

export function OfflineSupportRouteSurface({ accountSelectionRef, kind, offlineScopeRef, partitionKey, pathname }: {
  accountSelectionRef: string;
  kind: OfflineSupportRouteKind;
  offlineScopeRef: string;
  partitionKey: string;
  pathname: string;
}) {
  if (!areTraderLinkPlatformAiFeaturesEnabled() && (kind === "ai-chat" || kind === "ai-reviews")) {
    return (
      <AiComingSoonPage
        description={kind === "ai-chat"
          ? "Links is being prepared for a later beta update."
          : "AI Reviews are being prepared for a later beta update."}
        title={kind === "ai-chat" ? "Links AI Chat" : "AI Reviews"}
      />
    );
  }
  if (kind === "account") return <OfflineAccount accountSelectionRef={accountSelectionRef} offlineScopeRef={offlineScopeRef} pathname={pathname} />;
  if (kind === "ai-reviews") return <OfflineAiReviewsSurface partitionKey={partitionKey} pathname={pathname} />;
  if (kind === "help") return <OfflineHelp pathname={pathname} />;
  if (kind === "notifications") return <OfflineNotifications partitionKey={partitionKey} />;
  const copy = ONLINE_REQUIRED[kind];
  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">TraderLink Platform</Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">{kind === "ai-chat" ? "Links AI Chat" : kind === "imports" ? "Import Trades" : kind === "charts" ? "Market Charts" : "Data Decisions"}</Typography>
      </Box>
      <DashboardUnavailableState compact description={copy.description} title={copy.title} />
    </DashboardPage>
  );
}

import { redirect } from "next/navigation";
import type { Metadata } from "next";

import {
  pressReleaseChannelDefinition,
  type PressReleaseChannel,
} from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import {
  hasPressReleaseDashboardAccess,
} from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { DashboardPage, DashboardPanel, DashboardUnavailableState } from "../../../dashboard-template";
import { DEFAULT_NEWS_FILTERS } from "@/src/modules/news/contracts/press-release-filters";
import { PressReleaseSavedViewRepository } from "@/src/modules/news/server/press-release-saved-view-repository";
import { canReceiveMembershipNotification } from "@/src/modules/platform/server/membership/membership-notification-access";
import { PressReleaseFeed } from "../press-release-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = Readonly<{
  params: Promise<{ channel?: string[] }>;
  searchParams: Promise<{ article?: string | string[]; view?: string | string[]; customAlert?: string | string[] }>;
}>;

function resolveChannel(segments: readonly string[] | undefined): PressReleaseChannel | null {
  const path = segments?.join("/") ?? "";
  switch (path) {
    case "": return "all";
    case "news-filtered": return "news_filtered";
    case "market-cap": return "market_cap_all";
    case "market-cap/under-30m": return "market_cap_under_30m";
    case "market-cap/30m-50m": return "market_cap_30m_to_50m";
    case "market-cap/100m-300m": return "market_cap_all";
    case "market-cap/300m-500m": return "market_cap_all";
    case "market-cap/50m-100m": return "market_cap_50m_to_100m";
    default: return null;
  }
}
export async function generateMetadata(): Promise<Metadata> {
  const title = "Press Releases";
  return {
    description: "Read TradersLink press releases and AI summaries in the dashboard.",
    title: `${title} | TraderLink Platform`,
  };
}

export default async function PressReleaseChannelPage({ params, searchParams }: PageProps) {
  const channel = resolveChannel((await params).channel);
  if (!channel) {
    return (
      <DashboardPage>
        <DashboardPanel title="Press Releases">
          <DashboardUnavailableState
            actionHref="/press-releases"
            actionLabel="Open all press releases"
            description="This press release channel does not exist."
            title="Channel not found"
          />
        </DashboardPanel>
      </DashboardPage>
    );
  }

  if (channel !== "all") {
    const requested = (await searchParams).article;
    redirect("/press-releases" + (typeof requested === "string" && requested.length <= 64 ? `?article=${encodeURIComponent(requested)}` : ""));
  }
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasPressReleaseDashboardAccess(identity)) {
    return (
      <DashboardPage>
        <DashboardPanel title={pressReleaseChannelDefinition(channel).label}>
          <DashboardUnavailableState
            actionHref="/plans?feature=news.access"
            actionLabel="Unlock Stock Press Releases"
            description="Follow market-moving announcements with Stock Press Releases. Choose a plan that includes this feature to start reading."
            title="Stock Press Releases"
          />
        </DashboardPanel>
      </DashboardPage>
    );
  }

  const requestedArticle = (await searchParams).article;
  const articleId = typeof requestedArticle === "string" && requestedArticle.length <= 64
    ? requestedArticle
    : null;
  const requestedView = (await searchParams).view;
  const customAlert = (await searchParams).customAlert === "1";
  const { page, selectedArticle, preference, savedViews, selectedViewId, alertsAllowed } = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new PressReleaseDashboardRepository(database);
    const views = new PressReleaseSavedViewRepository(database);
    const preference = views.readPreference(identity.scope.userId);
    const savedViews = views.list(identity.scope.userId);
    const selectedView = typeof requestedView === "string" ? savedViews.find(view => view.id === requestedView) : null;
    return Object.freeze({
      preference, savedViews, selectedViewId: selectedView?.id ?? "", alertsAllowed: canReceiveMembershipNotification(database,identity.scope.userId,"press_release"),
      page: repository.listPage({ channel: "all", limit: 100, scope: identity.scope, filters: selectedView?.filters ?? preference?.filters ?? DEFAULT_NEWS_FILTERS }),
      selectedArticle: articleId
        ? repository.find({ articleId, channel, scope: identity.scope })
        : null,
    });
  });

  return (
    <PressReleaseFeed
      key={identity.scope.userId}
      channel={channel}
      initialArticles={page.articles}
      initialPage={page}
      preferenceKey={identity.scope.userId}
      initialFilters={page.filters}
      initialPreferenceExists={preference !== null}
      initialSavedViews={savedViews}
      initialSelectedViewId={selectedViewId}
      initialFiltersOpen={customAlert}
      alertsAllowed={alertsAllowed}
      initialSelectedArticle={selectedArticle}
    />
  );
}

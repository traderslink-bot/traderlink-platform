import type { Metadata } from "next";

import {
  pressReleaseChannelDefinition,
  type PressReleaseChannel,
} from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { DashboardPage, DashboardPanel, DashboardUnavailableState } from "../../../dashboard-template";
import { PressReleaseFeed } from "../press-release-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = Readonly<{
  params: Promise<{ channel?: string[] }>;
  searchParams: Promise<{ article?: string | string[] }>;
}>;

function resolveChannel(segments: readonly string[] | undefined): PressReleaseChannel | null {
  const path = segments?.join("/") ?? "";
  switch (path) {
    case "": return "all";
    case "news-filtered": return "news_filtered";
    case "market-cap": return "market_cap_all";
    case "market-cap/under-30m": return "market_cap_under_30m";
    case "market-cap/30m-50m": return "market_cap_30m_to_50m";
    case "market-cap/50m-100m": return "market_cap_50m_to_100m";
    default: return null;
  }
}
export async function generateMetadata({ params }: Pick<PageProps, "params">): Promise<Metadata> {
  const channel = resolveChannel((await params).channel);
  const title = channel ? pressReleaseChannelDefinition(channel).label : "Press Releases";
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

  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasPressReleaseDashboardAccess(identity)) {
    return (
      <DashboardPage>
        <DashboardPanel title={pressReleaseChannelDefinition(channel).label}>
          <DashboardUnavailableState
            actionHref="/account"
            actionLabel="View account"
            description="Press Releases are available to TradersLink Premium members."
            title="Premium access required"
          />
        </DashboardPanel>
      </DashboardPage>
    );
  }

  const requestedArticle = (await searchParams).article;
  const articleId = typeof requestedArticle === "string" && requestedArticle.length <= 64
    ? requestedArticle
    : null;
  const { articles, selectedArticle } = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new PressReleaseDashboardRepository(database);
    return Object.freeze({
      articles: repository.list({ channel, limit: 150, scope: identity.scope }),
      selectedArticle: articleId
        ? repository.find({ articleId, channel, scope: identity.scope })
        : null,
    });
  });

  return (
    <PressReleaseFeed
      channel={channel}
      initialArticles={articles}
      initialSelectedArticle={selectedArticle}
    />
  );
}

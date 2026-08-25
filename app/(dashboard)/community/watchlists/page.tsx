import type { Metadata } from "next";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { CommunityWatchlistsHub } from "./community-watchlists-hub";

export const metadata: Metadata = {
  title: "Community Watchlists | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommunityWatchlistsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const data = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new CommunityWatchlistRepository(database);
    return Object.freeze({ mine: repository.listMine(scope.userId), shared: repository.listShared() });
  });
  return <CommunityWatchlistsHub mine={data.mine} shared={data.shared} />;
}

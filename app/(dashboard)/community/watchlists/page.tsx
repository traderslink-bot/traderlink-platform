import type { Metadata } from "next";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { CommunityWatchlistsHub } from "./community-watchlists-hub";

export const metadata: Metadata = {
  title: "Community Watchlists | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommunityWatchlistsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const data = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new CommunityWatchlistRepository(database);
    const mine = repository.listMineDetails(scope.userId);
    const shared = repository.listSharedDetails();
    const following = repository.listFollowedDetails(scope.userId);
    const toItem = (detail: typeof mine[number], editable: boolean, isFollowing: boolean) => Object.freeze({
      detail,
      editable,
      following: isFollowing,
    });
    return Object.freeze({
      mine: Object.freeze(mine.map((detail) => toItem(detail, true, false))),
      shared: Object.freeze(shared.map((detail) => toItem(
        detail,
        repository.ownsPublished(scope.userId, detail.authorHandle, detail.slug),
        repository.isFollowingPublished(scope.userId, detail.authorHandle, detail.slug),
      ))),
      following: Object.freeze(following.map((detail) => toItem(detail, false, true))),
    });
  });
  return <CommunityWatchlistsHub following={data.following} mine={data.mine} shared={data.shared} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { DashboardPage } from "../../../dashboard-template";
import { CommunityProfilePageClient } from "./community-profile-page-client";

export const metadata: Metadata = {
  title: "Community profile | TradersLink Platform",
};

export default async function CommunityProfilePage({
  params,
}: {
  params: Promise<{ userName: string }>;
}) {
  const { userName } = await params;
  const scope = await requireTraderLinkPlatformPageScope();
  const profile = withReadonlyPlatformDatabase({}, (database) =>
    new CommunityWatchlistRepository(database).findProfile(userName, scope.userId),
  );
  if (!profile) notFound();
  const isOwner = withReadonlyPlatformDatabase({}, (database) =>
    new CommunityWatchlistRepository(database).ownsProfile(scope.userId, userName),
  );
  return <DashboardPage><CommunityProfilePageClient isOwner={isOwner} profile={profile} /></DashboardPage>;
}

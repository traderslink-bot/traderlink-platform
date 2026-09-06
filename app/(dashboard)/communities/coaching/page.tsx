import { redirect } from "next/navigation";

import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export default async function CommunityCoachingIndexPage() {
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  const destination = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new TraderLinkCommunityRepository(database);
    const community = repository.listForUser(identity.scope.userId).find((item) => {
      const capabilities = repository.resolveAccess(item.communityId, identity.scope.userId).capabilities;
      return capabilities.includes("community.coaching.view") ||
        capabilities.includes("community.coaching.offer");
    });
    return community ? `/communities/${community.slug}/coaching` : "/communities";
  });

  redirect(destination);
}

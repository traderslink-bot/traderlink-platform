import { redirect } from "next/navigation";

import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export default async function CommunityCoachingIndexPage() {
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  const destination = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new TraderLinkCommunityRepository(database);
    let studentDestination: string | undefined;
    let directoryDestination: string | undefined;
    for (const community of repository.listForUser(identity.scope.userId)) {
      const capabilities = repository.resolveAccess(community.communityId, identity.scope.userId).capabilities;
      const basePath = `/communities/${community.slug}`;
      if (capabilities.includes("community.coaching.offer") ||
          capabilities.includes("community.coaching.students")) {
        return `${basePath}/workspace`;
      }
      if (capabilities.includes("community.coaching.view") || capabilities.includes("community.coaching.manage_all")) directoryDestination ??= `${basePath}/coaches`;
      const relationship = database.prepare(`SELECT 1
FROM traderlink_community_coaching_relationships
WHERE community_id = ? AND student_user_id = ?
LIMIT 1`).get(community.communityId, identity.scope.userId);
      if (relationship) studentDestination ??= `${basePath}/coaching`;
    }
    return studentDestination ?? directoryDestination ?? "/communities";
  });

  redirect(destination);
}

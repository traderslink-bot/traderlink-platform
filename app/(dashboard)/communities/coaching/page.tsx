import { redirect } from "next/navigation";

import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export default async function CommunityCoachingIndexPage() {
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  const destination = withReadonlyPlatformDatabase({}, (database) => {
    const repository = new TraderLinkCommunityRepository(database);
    for (const item of repository.listForUser(identity.scope.userId)) {
      const capabilities = repository.resolveAccess(item.communityId, identity.scope.userId).capabilities;
      const ownRelationship = database.prepare(`SELECT 1
FROM traderlink_community_coaching_relationships
WHERE community_id = ? AND student_user_id = ?
LIMIT 1`).get(item.communityId, identity.scope.userId);
      if (ownRelationship) return `/communities/${item.slug}/coaching`;
      if (capabilities.includes("community.coaching.offer") ||
          capabilities.includes("community.coaching.students")) {
        return `/communities/${item.slug}/workspace`;
      }
      if (capabilities.includes("community.coaching.view") ||
          capabilities.includes("community.coaching.manage_all")) {
        return `/communities/${item.slug}/coaches`;
      }
    }
    return "/communities";
  });

  redirect(destination);
}

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
    const history=database.prepare(`SELECT c.slug,r.student_user_id FROM traderlink_community_coaching_relationships r JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.status IN ('active','ended') AND (r.student_user_id=? OR r.coach_user_id=?) ORDER BY r.requested_at_utc DESC LIMIT 1`).get(identity.scope.userId,identity.scope.userId) as {slug:string;student_user_id:string}|undefined;
    if(history)return `/communities/${history.slug}/${history.student_user_id===identity.scope.userId?"coaching":"workspace/students"}`;
    return "/communities";
  });

  redirect(destination);
}

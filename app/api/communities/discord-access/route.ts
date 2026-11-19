import { NextRequest } from "next/server";

import { requireCommunityOwnerReviewRequestIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import {
  observeCommunityDiscordAccess,
  readCommunityDiscordRefreshGuildIds,
  syncCommunityDiscordAccessEvidence,
} from "@/src/modules/communities/server/community-discord-access-sync";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import {
  resolveCommunityMemberLifecycleConfiguration,
  withAdmittedCommunityMemberRequest,
} from "@/src/modules/platform/server/privacy/platform-community-member-lifecycle-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const initialIdentity = requireCommunityOwnerReviewRequestIdentity(request.headers);
    const target = withReadonlyPlatformDatabase({}, database => {
      const identity = database.prepare(`SELECT auth_subject FROM platform_auth_identities
        WHERE user_id=? AND auth_provider='discord' AND status='active'`)
        .get(initialIdentity.scope.userId) as { auth_subject: string } | undefined;
      if (!identity) throw new Error("Community Discord identity unavailable.");
      return Object.freeze({
        authSubject: identity.auth_subject,
        guildIds: readCommunityDiscordRefreshGuildIds(database),
      });
    });
    if (target.guildIds.length === 0) return Response.json({ message: "No invited or connected community is available to refresh." });

    // Provider I/O finishes before the admitted writer and its transaction exist.
    const observation = await observeCommunityDiscordAccess({
      authSubject: target.authSubject,
      botToken: process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? "",
      guildIds: target.guildIds,
    });
    if (observation.memberships.length === 0) return Response.json(
      { message: "Discord could not verify access to an invited or connected community." },
      { status: 409 },
    );

    const database = openPlatformDatabase({ mode: "runtime" });
    try {
      const configuration = resolveCommunityMemberLifecycleConfiguration(database, process.env);
      const result = withAdmittedCommunityMemberRequest({
        database,
        request,
        environment: process.env,
        policyRef: configuration.policyRef,
        profileRef: configuration.profileRef,
        mode: "ensure",
        operation: ({ userId, database: admittedDatabase }) => {
          if (userId !== initialIdentity.scope.userId) throw new Error("Community identity changed.");
          const current = admittedDatabase.prepare(`SELECT auth_subject FROM platform_auth_identities
            WHERE user_id=? AND auth_provider='discord' AND status='active'`)
            .get(userId) as { auth_subject: string } | undefined;
          if (current?.auth_subject !== target.authSubject
            || JSON.stringify(readCommunityDiscordRefreshGuildIds(admittedDatabase)) !== JSON.stringify(target.guildIds)) {
            throw new Error("Community access changed during refresh.");
          }
          return syncCommunityDiscordAccessEvidence(admittedDatabase, {
            userId,
            guilds: observation.guilds,
            memberships: observation.memberships,
            verifiedAtUtc: observation.observedAtUtc,
          });
        },
      });
      return Response.json({
        message: result.memberships > 0 ? "Community access refreshed." : "Discord access refreshed. No connected community membership changed.",
      });
    } finally {
      database.close();
    }
  } catch {
    return Response.json({ message: "Community access is temporarily unavailable." }, { status: 503 });
  }
}

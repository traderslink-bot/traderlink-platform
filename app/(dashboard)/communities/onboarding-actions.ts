"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { isApprovedCommunityGuild } from "@/src/modules/communities/server/community-launch-policy";
import { onboardApprovedCommunity, verifyCommunityOwner } from "@/src/modules/communities/server/community-onboarding-service";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  if (typeof item !== "string" || !item.trim()) throw new Error("Required field missing.");
  return item.trim();
}

export async function onboardDiscordCommunityAction(formData: FormData): Promise<void> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const discordGuildId = value(formData, "discordGuildId");
  if (!isApprovedCommunityGuild(discordGuildId)) throw new Error("This server has not been approved for onboarding.");
  const linked = withPlatformDatabase({ mode: "runtime" }, database => database.prepare(
    "SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'",
  ).get(identity.scope.userId) as { auth_subject: string } | undefined);
  if (!linked) throw new Error("Discord account connection required.");
  // No SQLite write transaction is held while calling Discord.
  const evidence = await verifyCommunityOwner(discordGuildId, linked.auth_subject, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? "");
  const community = withPlatformDatabase({ mode: "runtime" }, database => onboardApprovedCommunity(database, {
    userId: identity.scope.userId,
    evidence, atUtc: createCanonicalUtcTimestamp(),
  }));
  revalidatePath("/communities");
  redirect(`/communities/${community.slug}/manage`);
}

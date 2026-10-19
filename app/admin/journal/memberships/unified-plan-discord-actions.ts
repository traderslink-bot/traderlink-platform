"use server";

import { headers } from "next/headers";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { readMembershipDiscordChoices, type MembershipDiscordChoices } from "@/src/modules/platform/server/membership/membership-discord-editor-choices";

export async function loadPlanDiscordChoices(input: { guildId?: string; after?: string }): Promise<{ value?: MembershipDiscordChoices; error?: string }> {
  try {
    withJournalAdminDatabase(await headers(), () => true);
  } catch { return { error: "Owner access is required to load Discord settings." }; }
  try { return { value: await readMembershipDiscordChoices(input) }; }
  catch { return { error: "Discord discovery is unavailable. Check the Platform bot connection. Your current selections are unchanged." }; }
}

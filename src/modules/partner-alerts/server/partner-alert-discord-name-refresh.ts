import type Database from "better-sqlite3";
import type { PartnerAlertDiscordSourceCatalog } from "./partner-alert-discord-channel-catalog";

type VerifiedSourceNames = Pick<PartnerAlertDiscordSourceCatalog, "guildName" | "channels">;

export function refreshPartnerAlertDiscordNames(database: Database.Database,
  current: Readonly<{ communityId: string; sourceGuildId: string }>, source: VerifiedSourceNames): void {
  if (!database.inTransaction) throw new Error("Discord name refresh requires an admitted transaction");
  const partner = database.prepare(
    "UPDATE partner_alert_partners SET display_name=? WHERE community_id=? AND source_guild_id=? AND display_name<>?",
  ).run(source.guildName, current.communityId, current.sourceGuildId, source.guildName);
  const rename = database.prepare(`UPDATE partner_alert_mappings SET display_name=?
    WHERE community_id=? AND source_guild_id=? AND source_channel_id=? AND display_name<>?`);
  let changed = partner.changes > 0;
  for (const channel of source.channels) {
    if (rename.run(channel.name, current.communityId, current.sourceGuildId, channel.channelId, channel.name).changes) changed = true;
  }
  if (changed) database.prepare("UPDATE partner_alert_partners SET revision=revision+1 WHERE community_id=?")
    .run(current.communityId);
}

export async function refreshPartnerAlertDiscordNamesPage(
  database: Database.Database,
  admission: Pick<import("../../platform/server/privacy/platform-erasure-admission").PlatformErasureAdmission, "runForUsers">,
  catalog: (guildId: string, signal: AbortSignal) => Promise<VerifiedSourceNames>,
  afterCommunityId: string | null,
  signal: AbortSignal,
): Promise<string | null> {
  const select = `SELECT p.community_id AS communityId, p.source_guild_id AS sourceGuildId,
    p.owner_user_id AS ownerUserId, p.revision
    FROM partner_alert_partners p JOIN traderlink_communities c
      ON c.community_id=p.community_id AND c.discord_guild_id=p.source_guild_id AND c.owner_user_id=p.owner_user_id
    WHERE p.status NOT IN ('suspended','ended') AND c.status<>'suspended'
    AND NOT EXISTS (SELECT 1 FROM traderlink_community_lifecycle l
      WHERE l.community_id=p.community_id AND l.removed_at_utc IS NOT NULL)`;
  type Partner = {
    communityId: string; sourceGuildId: string; ownerUserId: string; revision: number;
  };
  const page = database.prepare<[string], Partner>(
    `${select} AND p.community_id>? ORDER BY p.community_id LIMIT 10`,
  ).all(afterCommunityId ?? "");
  const readCurrent = database.prepare<[string], Partner>(`${select} AND p.community_id=?`);
  for (const partner of page) {
    signal.throwIfAborted();
    try {
      const source = await catalog(partner.sourceGuildId, signal);
      signal.throwIfAborted();
      admission.runForUsers([partner.ownerUserId], () => {
        const current = readCurrent.get(partner.communityId);
        if (current?.communityId !== partner.communityId || current.sourceGuildId !== partner.sourceGuildId
          || current.ownerUserId !== partner.ownerUserId || current.revision !== partner.revision) return;
        refreshPartnerAlertDiscordNames(database, partner, source);
      });
    } catch {
      signal.throwIfAborted();
    }
  }
  return page.length === 10 ? page.at(-1)!.communityId : null;
}

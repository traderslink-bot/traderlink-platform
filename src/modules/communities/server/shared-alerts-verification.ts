import { SharedAlertError } from "./shared-alerts-errors";
import { SharedAlertsDiscord } from "./shared-alerts-discord";
import { SharedAlertsRepository, type SharedAlertOwnerContext } from "./shared-alerts-repository";

export async function verifySharedAlertOwner(repository: SharedAlertsRepository, discord: SharedAlertsDiscord, owner: SharedAlertOwnerContext): Promise<void> {
  if (repository.ownerIsFresh(owner)) return;
  let matches: boolean;
  try { matches = await discord.verifyOwner(owner.guildId, owner.discordUserId); }
  catch { repository.recordOwnerCheck(owner, "unavailable"); throw new SharedAlertError("discord_unavailable"); }
  repository.recordOwnerCheck(owner, matches ? "verified" : "changed");
  if (!matches) throw new SharedAlertError("not_owner");
}

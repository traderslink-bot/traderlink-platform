import "server-only";
import { partnerAlertSnowflake, partnerAlertText } from "../contracts/partner-alert-validation";
import { readPartnerAlertDiscordJson } from "./partner-alert-discord-channel-catalog";

export type PartnerAlertInspectionContact = Readonly<{ discordUserId: string; displayName: string; profileUrl: string }>;

/** Public identity only for the already native-selected human. No invite, DM or grant. */
export async function readPartnerAlertInspectionContact(input: Readonly<{
  discordUserId: string; botToken: string; signal: AbortSignal;
  transport: (url: string, init: RequestInit) => Promise<Response>;
}>): Promise<PartnerAlertInspectionContact> {
  const id = partnerAlertSnowflake(input.discordUserId, "reviewerDiscordUserId");
  if (input.signal.aborted) throw Error("Inspection contact unavailable.");
  const response = await input.transport(`https://discord.com/api/v10/users/${id}`, {
    method: "GET", redirect: "manual", cache: "no-store", signal: input.signal,
    headers: { authorization: `Bot ${input.botToken}`, accept: "application/json" },
  });
  if (response.status !== 200) { void response.body?.cancel().catch(() => undefined); throw Error("Inspection contact unavailable."); }
  const user = await readPartnerAlertDiscordJson(response, input.signal) as Record<string, unknown>;
  if (input.signal.aborted || !user || user.id !== id || user.bot === true || user.system === true
    || typeof user.username !== "string") throw Error("Inspection contact unavailable.");
  const displayName = partnerAlertText(typeof user.global_name === "string" && user.global_name.trim()
    ? user.global_name : user.username, "reviewerName", 100);
  return Object.freeze({ discordUserId: id, displayName, profileUrl: `https://discord.com/users/${id}` });
}

import { partitionDiscordAlertText } from "../contracts/discord-alert-message-parts";
import type Database from "better-sqlite3";

function escapedName(value: string): string { return value.replace(/[\r\n\t]/gu, " ").replace(/([\\*_`~|\[\]<>])/gu, "\\$1").slice(0, 220); }

export function communityAlertDiscordAuthor(database: Database.Database, alertId: string): string {
  const author = database.prepare("SELECT discord_user_id,display_name,username FROM community_alert_discord_authors WHERE alert_id=?").get(alertId) as { discord_user_id: string | null; display_name: string | null; username: string | null } | undefined;
  return author?.discord_user_id && author.username
    ? `${escapedName(author.display_name || author.username)} (@${escapedName(author.username)})`
    : "Discord author unavailable";
}

function attribution(database: Database.Database, input: { alertId: string; communityName: string; showCommunityName: boolean }): string {
  const identity = communityAlertDiscordAuthor(database, input.alertId);
  return `Published by ${identity}${input.showCommunityName ? ` · ${escapedName(input.communityName)}` : ""}`;
}

export function appendCommunityAlertAttribution(database: Database.Database, input: { alertId: string; communityName: string; showCommunityName: boolean }, content: string): string {
  return `${content}\n\n${attribution(database, input)}`;
}

export function communityAlertDiscordContent(database: Database.Database, input: { alertId: string; title: string; symbol: string | null; body: string; communityName: string; showCommunityName: boolean; sourceUrl?: string }) {
  const lead = input.symbol ? `**${input.symbol} — ${input.title}**` : `**${input.title}**`;
  const tail = `\n\n${attribution(database, input)}${input.sourceUrl ? `\nOpen in TraderLink: ${input.sourceUrl}` : ""}`;
  // Existing delivery validates the complete result and rejects oversize text.
  // Never silently omit the end of an alert or its author attribution.
  return { content: `${lead}\n${input.body}${tail}`, allowed_mentions: { parse: [] as string[], replied_user: false } };
}

/** Same frozen payload for the receiver's review and the Discord worker. */
export function sharedAlertDiscordContent(database: Database.Database, input: { alertId:string; title:string; symbol:string|null; body:string; communityName:string; showCommunityName:boolean; kind:"publication"|"correction"|"withdrawal"; originalUrl:string|null }) {
  const base=communityAlertDiscordContent(database,{...input,body:input.kind==="withdrawal"?"This alert has been withdrawn. Do not rely on the original alert.":input.body});
  return input.kind==="publication"?base:{...base,content:`**${input.kind==="correction"?"CORRECTION":"WITHDRAWN"}**\n${base.content}${input.originalUrl?`\nOriginal alert: ${input.originalUrl}`:""}`};
}

/** Short alerts are unchanged; every long part carries identity and numbering. */
export function sharedAlertDiscordParts(database: Database.Database, input: Parameters<typeof sharedAlertDiscordContent>[1]): readonly string[] {
  const single = sharedAlertDiscordContent(database, input).content;
  if (single.length <= 2000) return [single];
  const body = input.kind === "withdrawal" ? "This alert has been withdrawn. Do not rely on the original alert." : input.body;
  const kind = input.kind === "publication" ? "" : `**${input.kind === "correction" ? "CORRECTION" : "WITHDRAWN"}**\n`;
  const lead = input.symbol ? `**${input.symbol} — ${input.title}**` : `**${input.title}**`;
  const tail = `\n\n${attribution(database, input)}${input.originalUrl ? `\nOriginal alert: ${input.originalUrl}` : ""}`;
  const header = (part: number, total: number) => `${kind}${lead}\nPart ${part} of ${total}\n`;
  return partitionDiscordAlertText({single,body,header,footer:tail});
}

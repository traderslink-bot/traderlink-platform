import { assertCommunityReviewDiscordGuild } from "@/src/modules/communities/server/community-review-discord-guild";
import { randomUUID } from "node:crypto";
import { partnerAlertRecord, partnerAlertSnowflake } from "../contracts/partner-alert-validation";

type GuildConfiguration = Readonly<{
  guildId: string; memberId: string; botToken: string; managedRoleCount?: 1 | 2; unrelatedMemberId?: string;
}>;

function sameRoles(actual: readonly string[], expected: readonly string[]) {
  return actual.length === expected.length && JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

/** Explicit QA helper. Exposes no deployment or application entry point. */
export async function createPartnerAlertStripeDiscordTestGuild(configuration: GuildConfiguration) {
  const guildId = partnerAlertSnowflake(configuration.guildId, "testGuildId");
  assertCommunityReviewDiscordGuild(guildId);
  const memberId = partnerAlertSnowflake(configuration.memberId, "testMemberId");
  const unrelated = configuration.unrelatedMemberId === undefined ? null
    : partnerAlertSnowflake(configuration.unrelatedMemberId,"unrelatedTestMemberId");
  const token = configuration.botToken;
  if (!/^[A-Za-z0-9_.-]{20,512}$/u.test(token)) throw new Error("Discord test bot credential was not bound.");
  const base = `/guilds/${guildId}`;
  async function discord(method: string, path: string, body?: object) {
    const response = await fetch(`https://discord.com/api/v10${path}`, { method, redirect: "error",
      signal: AbortSignal.timeout(12_000), cache: "no-store",
      headers: { authorization: `Bot ${token}`, "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Discord test guild ${method} failed with HTTP ${response.status}.`);
    }
    return response.status === 204 ? null : response.json() as Promise<unknown>;
  }
  const who = partnerAlertRecord(await discord("GET", "/users/@me"), "bot");
  const botId = partnerAlertSnowflake(who.id, "botId");
  const guild = partnerAlertRecord(await discord("GET", base), "testGuild");
  if (who.bot !== true || guild.id !== guildId || botId === memberId
    || unrelated === botId || unrelated === memberId) throw new Error("Discord test target did not match.");
  const memberPath = `${base}/members/${memberId}`;
  async function snapshot(subject = memberId) {
    const member = partnerAlertRecord(await discord("GET", `${base}/members/${subject}`), "testMember");
    if (partnerAlertRecord(member.user, "user").id !== subject || !Array.isArray(member.roles)) {
      throw new Error("Discord test member could not be verified.");
    }
    return member.roles.map(id => partnerAlertSnowflake(id, "role"));
  }
  const baseline = await snapshot();
  const unrelatedBaseline = unrelated ? await snapshot(unrelated) : [];
  const label = `partner-stripe-qa-${randomUUID().slice(0, 8)}`;
  const temporaryRoles: string[] = [];
  async function cleanup() {
    const failures: unknown[] = [];
    for (const role of [...temporaryRoles].reverse()) {
      try {
        await discord("DELETE", `${base}/roles/${role}`);
        temporaryRoles.splice(temporaryRoles.indexOf(role), 1);
      } catch (error) { failures.push(error); }
    }
    if (!sameRoles(await snapshot(), baseline)) failures.push(new Error("Discord member role baseline was not restored."));
    if (unrelated && !sameRoles(await snapshot(unrelated),unrelatedBaseline)) {
      failures.push(new Error("Unrelated Discord member role baseline was not restored."));
    }
    if (failures.length) throw new AggregateError(failures, "Discord fixture cleanup needs review.");
  }
  try {
    for (const purpose of configuration.managedRoleCount === 2 ? ["channel-one", "channel-two", "sentinel"] : ["channel", "sentinel"]) {
      const created = partnerAlertRecord(await discord("POST", `${base}/roles`, {
        name: `${label}-${purpose}`, permissions: "0", mentionable: false, hoist: false,
      }), "testRole");
      const id = partnerAlertSnowflake(created.id, "testRoleId");
      temporaryRoles.push(id);
      if (created.managed !== false || created.permissions !== "0") throw new Error("Discord test role did not match.");
    }
    const managedRoleIds = Object.freeze(temporaryRoles.slice(0, -1));
    const roleId = managedRoleIds[0]!;
    const sentinelRoleId = temporaryRoles.at(-1)!;
    // Read an existing test channel for the managed-role transport's scope
    // check. The fixture changes role membership only.
    const channels = await discord("GET", `${base}/channels`);
    if (!Array.isArray(channels)) throw new Error("Discord test channels could not be verified.");
    const channel = channels.map(value => partnerAlertRecord(value, "testChannel"))
      .find(value => value.guild_id === guildId && value.type === 0);
    const fixedChannelId = partnerAlertSnowflake(channel?.id, "testChannelId");
    await discord("PUT", `${memberPath}/roles/${sentinelRoleId}`);
    if (unrelated) await discord("PUT", `${base}/members/${unrelated}/roles/${roleId}`);
    async function prepare() {
      await discord("PUT", `${memberPath}/roles/${roleId}`);
      const roles = await snapshot();
      if (!sameRoles(roles, [...baseline, sentinelRoleId, roleId])) throw new Error("Unexpected Discord fixture role set.");
      return roles;
    }
    async function verifyManagedRoles(expected: readonly string[]) {
      if (expected.some(id => !managedRoleIds.includes(id))
        || !sameRoles(await snapshot(), [...baseline, sentinelRoleId, ...expected])) {
        throw new Error("Discord member roles differ from the expected exact role set.");
      }
      if (unrelated && !sameRoles(await snapshot(unrelated),[...unrelatedBaseline,roleId])) {
        throw new Error("Unrelated Discord member did not retain the same role.");
      }
    }
    async function verify(present: boolean) { return verifyManagedRoles(present ? [roleId] : []); }
    return { guildId, memberId, botId, roleId, channelId: fixedChannelId, sentinelRoleId, managedRoleIds,
      token, prepare, verify, verifyManagedRoles, cleanup } as const;
  } catch (error) {
    try { await cleanup(); }
    catch (cleanupError) { throw new AggregateError([error, cleanupError], "Discord fixture setup and cleanup need review."); }
    throw error;
  }
}

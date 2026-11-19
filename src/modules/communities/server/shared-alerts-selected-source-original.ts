import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import { SharedAlertError } from "./shared-alerts-errors";
import { isSharedAlertReviewTarget } from "./shared-alerts-review-targets";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertsSourcePolicy } from "./shared-alerts-source-policy";
import { sharedAlertAwareDiscordRequest } from "./shared-alerts-rate-limits";
import { sharedAlertsStorageReady } from "./shared-alerts-storage-readiness";
import { confirmedSourceParts, sharedAlertsSourceOriginalDelivery, sourceAlertNonce, sourceAlertParts } from "./shared-alerts-source-original-delivery";
import { sharedAlertsSourceTrackerBinding } from "./shared-alerts-source-tracker";

const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const refused = (): never => { throw new SharedAlertError("changed"); };
type Row = Record<string, unknown>;

function binding(database: Database.Database, deliveryId: string) {
  const job = database.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=? AND object_type='alert'").get(deliveryId) as Row | undefined;
  if (!job) return refused();
  const community = database.prepare("SELECT community_id,discord_guild_id,owner_user_id,display_name,slug,status FROM traderlink_communities WHERE community_id=?").get(job.community_id) as Row | undefined;
  const destination = database.prepare("SELECT destination_id,community_id,discord_channel_id,content_type,status,updated_at_utc FROM traderlink_community_discord_destinations WHERE community_id=? AND destination_id=?").get(job.community_id, job.destination_id) as Row | undefined;
  const alert = database.prepare("SELECT * FROM traderlink_community_alerts WHERE community_id=? AND alert_id=?").get(job.community_id, job.object_id) as Row | undefined;
  const revision = database.prepare("SELECT revision_id,content_json,content_hash FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type='alert' AND object_id=? AND evidence_kind='original' ORDER BY rowid LIMIT 1").get(job.community_id, job.object_id) as { revision_id: string; content_json: string; content_hash: string } | undefined;
  const distribution = database.prepare("SELECT * FROM traderlink_community_publication_distribution WHERE community_id=? AND object_type='alert' AND object_id=?").get(job.community_id, job.object_id) as Row | undefined;
  const author = database.prepare("SELECT * FROM community_alert_discord_authors WHERE alert_id=?").get(job.object_id);
  if (!community || community.status !== "active" || !destination || destination.status !== "active" || destination.content_type !== "alerts"
    || !isSharedAlertReviewTarget(community.discord_guild_id, destination.discord_channel_id) || !alert || alert.status !== "published" || !revision
    || createHash("sha256").update(revision.content_json).digest("hex") !== revision.content_hash || !distribution || distribution.distribution !== "discord") return refused();
  const destinations: unknown = JSON.parse(String(distribution.destination_ids_json));
  if (!Array.isArray(destinations) || !destinations.includes(job.destination_id)) return refused();
  const immutableJob = Object.fromEntries(["delivery_id", "community_id", "object_type", "object_id", "destination_id", "publisher_user_id", "requested_at_utc"].map(key => [key, job[key]]));
  return { job, community, destination, alert, revision, distribution,
    fingerprint: digest({ job: immutableJob, community, destination, alert, revision, distribution, author }) };
}

function excludedQueues(database: Database.Database, selectedId: string): string {
  const rows = (table: string, order: string) => {
    const result = database.prepare(`SELECT * FROM ${table} ORDER BY ${order} LIMIT 10001`).all() as Row[];
    if (result.length > 10000) return refused();
    return result;
  };
  return digest({
    common: rows("traderlink_community_content_deliveries", "delivery_id").filter(row => row.delivery_id !== selectedId),
    actions: rows("traderlink_community_publication_actions", "action_id"),
    shared: rows("community_shared_alert_deliveries", "delivery_id"),
    parts: rows("community_shared_alert_delivery_parts", "delivery_id,content_revision,part_number"),
  });
}

/** Read-only selection witness. It grants no session, runtime or delivery authority. */
export function readSelectedSharedAlertSourceOriginal(database: Database.Database, deliveryId: string) {
  assertCanonicalUuidV4(deliveryId, "deliveryId");
  const current = binding(database, deliveryId);
  return Object.freeze({ deliveryId, jobSha256: digest(current.job), bindingSha256: current.fingerprint,
    communityId: String(current.community.community_id), ownerUserId: String(current.community.owner_user_id),
    guildId: String(current.community.discord_guild_id), channelId: String(current.destination.discord_channel_id),
    alertId: String(current.alert.alert_id), publisherUserId: String(current.job.publisher_user_id), requestedAtUtc: String(current.job.requested_at_utc) });
}

/** One initial source job, under the caller's CURRENT normal native worker
 * admission. No HTTP route, installer, global flag, interval, partner pass or
 * staging capability is created here. Root qualifies the runtime and actor.
 * Interrupted/uncertain jobs and retries require a separate reconciled case. */
export async function runSelectedSharedAlertSourceOriginalDelivery(database: Database.Database, input: Readonly<{
  selection: ReturnType<typeof readSelectedSharedAlertSourceOriginal>;
  botToken: string; botId: string; publicOrigin: string; deadlineUtc: string; postBudget: number; metadataBudget: number;
  /** Injected by the real current native runtime on this exact Database.
   * Implement with core.runForUsers; callbacks must remain synchronous. */
  withCurrentWriter: <T>(userIds: readonly string[], operation: () => T) => T;
  /** Revalidate the ORIGINAL finite effect admission, never mint/renew it. */
  assertEffectCurrent: (phase: "claim" | "send" | "settlement") => void;
}>, transport: typeof fetch = fetch) {
  const selected = input.selection, now = createCanonicalUtcTimestamp;
  const deadline = Date.parse(input.deadlineUtc), started = Date.now();
  const configuredOrigin = process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN?.trim();
  if (typeof input.withCurrentWriter !== "function" || typeof input.assertEffectCurrent !== "function"
    || process.env.NODE_ENV !== "production" || !configuredOrigin || input.publicOrigin !== configuredOrigin
    || new URL(input.publicOrigin).origin !== input.publicOrigin || new URL(input.publicOrigin).protocol !== "https:"
    || !sharedAlertsStorageReady(database) || !input.botToken.trim() || !/^[0-9]{1,32}$/u.test(input.botId)
    || !Number.isFinite(deadline) || deadline <= started || deadline - started > 300000
    || !Number.isSafeInteger(input.postBudget) || input.postBudget < 1 || input.postBudget > 10
    || !Number.isSafeInteger(input.metadataBudget) || input.metadataBudget < 1 || input.metadataBudget > 100) return refused();
  const initial = binding(database, selected.deliveryId);
  if (digest(initial.job) !== selected.jobSha256 || initial.fingerprint !== selected.bindingSha256
    || initial.job.status !== "pending" || initial.job.delivery_outcome !== "pending" || initial.job.attempt_count !== 0
    || initial.job.discord_message_id !== null
    || database.prepare("SELECT 1 FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? LIMIT 1").get(selected.deliveryId)
    || database.prepare("SELECT 1 FROM traderlink_community_publication_receipts WHERE community_id=? AND request_id=?").get(selected.communityId, `shared-source-original:${selected.deliveryId}`)) return refused();
  const canonical = readSelectedSharedAlertSourceOriginal(database, selected.deliveryId);
  if (digest(canonical) !== digest(selected)) return refused();
  const tracked = sharedAlertsSourceTrackerBinding(input.publicOrigin);
  const content = JSON.parse(initial.revision.content_json);
  const texts = sourceAlertParts(database, selected.alertId, content, content.publishingMode === "tracked_page" ? tracked.url(String(initial.community.slug), selected.alertId) : "");
  if (texts.length !== input.postBudget) return refused();
  const policy = new SharedAlertsSourcePolicy(database);
  const principals = [...new Set([selected.ownerUserId, selected.publisherUserId, String(initial.alert.author_user_id)])];
  const withCurrentWriter = <T>(operation: () => T): T => input.withCurrentWriter(principals, () => {
    input.assertEffectCurrent("settlement");
    for (const userId of principals) requirePlatformErasureWriter(database, userId).assertLivePrincipal(userId);
    if (binding(database, selected.deliveryId).fingerprint !== selected.bindingSha256) return refused();
    const result = operation();
    if (result !== null && (typeof result === "object" || typeof result === "function") && "then" in result) return refused();
    if (binding(database, selected.deliveryId).fingerprint !== selected.bindingSha256) return refused();
    input.assertEffectCurrent("settlement");
    for (const userId of principals) requirePlatformErasureWriter(database, userId).assertLivePrincipal(userId);
    return result;
  });
  const assertCurrent = (phase: "claim" | "send") => {
    if (Date.now() >= deadline) return refused();
    input.assertEffectCurrent(phase);
    for (const userId of principals) requirePlatformErasureWriter(database, userId).assertLivePrincipal(userId);
    const current = binding(database, selected.deliveryId);
    if (current.fingerprint !== selected.bindingSha256 || (phase === "claim" ? digest(current.job) !== selected.jobSha256 : current.job.status !== "sending")) return refused();
    const repository = new SharedAlertsRepository(database, now), owner = repository.ownerContext(selected.communityId);
    if (owner.ownerUserId !== selected.ownerUserId || owner.guildId !== selected.guildId || !repository.ownerIsFresh(owner)) return refused();
    for (const userId of [selected.publisherUserId, String(initial.alert.author_user_id)]) policy.assertDelivery(selected.communityId, userId, String(initial.job.destination_id), "alerts", now());
  };
  withCurrentWriter(() => assertCurrent("claim"));
  const before = excludedQueues(database, selected.deliveryId);
  const subjects = principals.map(userId => {
    const identity = database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").get(userId) as { auth_subject: string } | undefined;
    if (!identity || !/^[0-9]{1,32}$/u.test(identity.auth_subject)) return refused();
    return identity.auth_subject;
  });
  const metadataPaths = new Set(["/users/@me", `/guilds/${selected.guildId}`, `/guilds/${selected.guildId}/channels`, `/guilds/${selected.guildId}/roles`, ...[...subjects, input.botId].map(id => `/guilds/${selected.guildId}/members/${id}`)]);
  const attempts: { method: string; path: string; status?: number; outcome?: string; payloadSha256?: string }[] = [];
  let writes = 0, reads = 0;
  const request: typeof fetch = async (resource, options) => {
    const url = new URL(typeof resource === "string" ? resource : resource instanceof URL ? resource.href : resource.url);
    const method = (options?.method ?? (resource instanceof Request ? resource.method : "GET")).toUpperCase();
    if (url.origin !== "https://discord.com" || url.username || url.password || !url.pathname.startsWith("/api/v10/")
      || url.search || url.hash || Date.now() >= deadline) return refused();
    const providerPath = url.pathname.replace(/^\/api\/v10/u, "");
    const attempt: typeof attempts[number] = { method, path: providerPath };
    if (method === "GET") {
      if (!metadataPaths.has(providerPath) || ++reads > input.metadataBudget) return refused();
    } else {
      withCurrentWriter(() => assertCurrent("send"));
      if (method !== "POST" || providerPath !== `/channels/${selected.channelId}/messages` || writes >= input.postBudget || typeof options?.body !== "string") return refused();
      const payload = JSON.parse(options.body), number = writes + 1;
      if (payload.content !== texts[writes] || payload.nonce !== sourceAlertNonce(`source-alert:${selected.deliveryId}:${number}`)
        || payload.enforce_nonce !== true || digest(payload.allowed_mentions) !== digest({ parse: [], replied_user: false })
        || Object.keys(payload).some(key => !["content", "nonce", "enforce_nonce", "allowed_mentions", "message_reference"].includes(key))) return refused();
      if (number > 1) {
        const first = confirmedSourceParts(database, selected.deliveryId)[0];
        if (!first || digest(payload.message_reference) !== digest({ message_id: first.messageId, channel_id: selected.channelId, guild_id: selected.guildId, fail_if_not_exists: true })) return refused();
      } else if (payload.message_reference) return refused();
      writes++; attempt.payloadSha256 = createHash("sha256").update(options.body).digest("hex");
    }
    attempts.push(attempt);
    try {
      const signal = AbortSignal.timeout(Math.max(1, deadline - Date.now()));
      const response = await transport(resource, { ...options, redirect: "error", signal: options?.signal ? AbortSignal.any([options.signal, signal]) : signal });
      attempt.status = response.status; return response;
    } catch (error) { attempt.outcome = "unconfirmed"; throw error; }
  };
  const counts = await sharedAlertsSourceOriginalDelivery.run({ database, policy, request: sharedAlertAwareDiscordRequest(request, operation => withCurrentWriter(() => operation(database))),
    now, botToken: input.botToken, limit: input.postBudget, notBeforeUtc: selected.requestedAtUtc, trackedPageUrl: tracked.url,
    selectedOriginal: { deliveryId: selected.deliveryId, assertCurrent, withCurrentWriter,
      commitObservation: (affectedUserIds, operation) => {
        if (affectedUserIds.some(userId => !principals.includes(userId))) return refused();
        return withCurrentWriter(operation);
      } } });
  const after = database.prepare("SELECT status,delivery_outcome,discord_message_id,attempt_count,last_error FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(selected.deliveryId);
  return Object.freeze({ counts, selectedDeliveryId: selected.deliveryId, result: after, receipts: confirmedSourceParts(database, selected.deliveryId), attempts,
    posts: writes, metadataReads: reads, excludedQueuesUnchanged: excludedQueues(database, selected.deliveryId) === before,
    readback: "Caller must GET each confirmed provider message and compare frozen text/channel/bot, then verify fresh normal UI. No readback PASS is inferred here." });
}

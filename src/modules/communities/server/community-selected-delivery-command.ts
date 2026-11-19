import "server-only";
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, openSync, readFileSync } from "node:fs";
import type Database from "better-sqlite3";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { readAppliedPlatformMigrations } from "../../platform/server/database/platform-migration-registry";
import { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { readSelectedSharedAlertSourceOriginal, runSelectedSharedAlertSourceOriginalDelivery } from "./shared-alerts-selected-source-original";
import { readSelectedCommunityPlanDelivery, runSelectedCommunityPlanDelivery } from "./community-selected-plan-delivery";
import { isSharedAlertReviewTarget } from "./shared-alerts-review-targets";
import { assertSelectedCommunityInitialDelivery, readSelectedCommunityDeliveryDomain } from "./community-selected-delivery-domain";

const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const bytesSha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const denied = (): never => { throw new Error("Selected delivery runtime or original case is no longer current."); };
type Row = Record<string, unknown>;
export type SelectedCommunityDeliveryCase = Readonly<{
  version: "community_selected_initial_delivery_v1";
  kind: "source_alert" | "coaching_plan";
  issuedAtUtc: string; expiresAtUtc: string;
  runtime: Readonly<{ commitSha: string; deploymentId: string; schemaSha256: string; ledgerSha256: string;
    profileCatalogSha256: string; profileRef: string; profileGeneration: number }>;
  selection: ReturnType<typeof readSelectedSharedAlertSourceOriginal> | ReturnType<typeof readSelectedCommunityPlanDelivery>;
  originalPrincipals: readonly Readonly<{ userId: string; lifecycleSha256: string; profileSha256: string; identitySha256: string; membershipSha256: string }>[];
  botId: string; publicOrigin: string; metadataBudget: number;
  expectedMessageContentSha256s: readonly string[];
}>;

/** Read-only original-fence projection for Root's qualified case preparation.
 * This does not bind Core, create an admission, renew a ticket or authorize effects. */
export function selectedCommunityDeliveryPrincipalWitness(database: Database.Database, userId: string, communityId: string) {
  const life = database.prepare("SELECT * FROM platform_erasure_lifecycles WHERE user_id=?").get(userId) as Row | undefined;
  const profile = life && database.prepare("SELECT * FROM platform_erasure_profiles WHERE profile_ref=?").get(life.profile_ref);
  const identity = database.prepare("SELECT user_id,auth_provider,auth_subject,status,linked_by_user_id FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").get(userId);
  const membership = database.prepare("SELECT community_id,user_id,status FROM traderlink_community_memberships WHERE community_id=? AND user_id=? AND status='active'").get(communityId, userId);
  if (!life || !profile || !identity || !membership) return denied();
  return { userId, lifecycleSha256: sha(life), profileSha256: sha(profile), identitySha256: sha(identity), membershipSha256: sha(membership) };
}

/** Normal runtime command entry. All writer callbacks are constructed here from
 * real Core on the SAME database, never accepted from case JSON or staging code. */
export async function runSelectedCommunityDeliveryCommand(input: SelectedCommunityDeliveryCase, transport: typeof fetch = fetch) {
  const env = process.env, began = performance.now(), start = Date.now();
  const originalCaseSha256 = sha(input);
  const issued = Date.parse(input.issuedAtUtc), expiry = Date.parse(input.expiresAtUtc);
  const hex = /^[a-f0-9]{64}$/u;
  if (input.version !== "community_selected_initial_delivery_v1" || !["source_alert", "coaching_plan"].includes(input.kind)
    || env.NODE_ENV !== "production" || env.RAILWAY_GIT_COMMIT_SHA !== input.runtime.commitSha
    || !/^[a-f0-9]{40}$/u.test(input.runtime.commitSha) || !input.runtime.deploymentId
    || env.RAILWAY_DEPLOYMENT_ID !== input.runtime.deploymentId
    || input.runtime.profileRef !== "community_account_erasure_210_v1" || input.runtime.profileGeneration !== 1
    || [input.runtime.schemaSha256,input.runtime.ledgerSha256,input.runtime.profileCatalogSha256].some(value => !hex.test(value))
    || input.runtime.profileCatalogSha256 !== env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256
    || !Number.isFinite(issued) || !Number.isFinite(expiry) || issued > start || expiry <= start || expiry - issued > 300000
    || new Date(issued).toISOString() !== input.issuedAtUtc || new Date(expiry).toISOString() !== input.expiresAtUtc
    || input.publicOrigin !== env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN?.trim() || new URL(input.publicOrigin).origin !== input.publicOrigin
    || new URL(input.publicOrigin).protocol !== "https:" || !/^[0-9]{1,32}$/u.test(input.botId)
    || !env.TRADERLINK_DISCORD_BOT_TOKEN?.trim() || !isSharedAlertReviewTarget(input.selection.guildId, input.selection.channelId)
    || !Number.isSafeInteger(input.metadataBudget) || input.metadataBudget < 1 || input.metadataBudget > 100
    || !Array.isArray(input.expectedMessageContentSha256s) || !input.expectedMessageContentSha256s.length || input.expectedMessageContentSha256s.length > 10
    || input.expectedMessageContentSha256s.some(value => !hex.test(value)) || input.kind === "coaching_plan" && input.expectedMessageContentSha256s.length !== 1) return denied();
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const token = env.TRADERLINK_DISCORD_BOT_TOKEN.trim();
    const migrations = readAppliedPlatformMigrations(database);
    if (migrations.length !== 210 || migrations.at(-1)?.post_schema_sha256 !== input.runtime.schemaSha256 || sha(migrations) !== input.runtime.ledgerSha256) return denied();
    const core = PlatformErasureAdmission.bind(database, { nowUtc: () => new Date().toISOString(), maximumAdmissionMs: 30000,
      participantStatements: [], profileCatalogSha256: input.runtime.profileCatalogSha256 });
    const selection = input.kind === "source_alert" ? readSelectedSharedAlertSourceOriginal(database, input.selection.deliveryId)
      : readSelectedCommunityPlanDelivery(database, input.selection.deliveryId);
    if (sha(selection) !== sha(input.selection) || core.schemaSha256 !== input.runtime.schemaSha256
      || !Number.isFinite(Date.parse(selection.requestedAtUtc)) || Date.parse(selection.requestedAtUtc) > start) return denied();
    const source = input.kind === "source_alert" ? selection as ReturnType<typeof readSelectedSharedAlertSourceOriginal> : null;
    const alert = source && database.prepare("SELECT author_user_id FROM traderlink_community_alerts WHERE alert_id=? AND community_id=?").get(source.alertId, source.communityId) as { author_user_id: string } | undefined;
    const principals = source ? [...new Set([source.ownerUserId, source.publisherUserId, alert?.author_user_id ?? ""])].sort()
      : (selection as ReturnType<typeof readSelectedCommunityPlanDelivery>).principalUserIds;
    if (!Array.isArray(input.originalPrincipals) || !principals.length || sha([...input.originalPrincipals.map(p => p.userId)].sort()) !== sha(principals)) return denied();
    const assertOriginalNativeCase = () => {
      if (sha(input) !== originalCaseSha256 || Date.now() < issued || Date.now() >= expiry || performance.now() - began >= expiry - start
        || env.RAILWAY_GIT_COMMIT_SHA !== input.runtime.commitSha || env.RAILWAY_DEPLOYMENT_ID !== input.runtime.deploymentId
        || env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN?.trim() !== input.publicOrigin
        || env.TRADERLINK_DISCORD_BOT_TOKEN?.trim() !== token
        || env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256 !== input.runtime.profileCatalogSha256) return denied();
      for (const principal of input.originalPrincipals) {
        const life = core.lifecycle(principal.userId);
        const profile = core.profile(life.profile_ref);
        if (life.phase !== "live" || life.profile_ref !== input.runtime.profileRef || life.profile_generation !== input.runtime.profileGeneration
          || !profile || Date.parse(profile.valid_until_utc) < expiry || Date.parse(life.valid_until_utc) < expiry
          || sha(selectedCommunityDeliveryPrincipalWitness(database, principal.userId, selection.communityId)) !== sha(principal)) return denied();
        core.assertLivePrincipal(principal.userId);
      }
    };
    const domainInput = { kind: input.kind, deliveryId: selection.deliveryId, communityId: selection.communityId,
      guildId: selection.guildId, ownerUserId: selection.ownerUserId, principalUserIds: principals };
    // First genuine effect admission is captured only for the exact initial
    // unattempted job, under actual native AND normal domain authorization.
    const originalDomain = core.runForUsers(principals, () => {
      assertOriginalNativeCase();
      assertSelectedCommunityInitialDelivery(database, selection.deliveryId);
      const domain = readSelectedCommunityDeliveryDomain(database, { ...domainInput, atUtc: new Date().toISOString() });
      if (Date.parse(domain.validUntilUtc) < expiry) return denied();
      assertOriginalNativeCase();
      return Object.freeze(domain);
    });
    const assertEffectCurrent: (phase: "claim" | "send" | "settlement") => void = () => {
      assertOriginalNativeCase();
      const currentDomain = readSelectedCommunityDeliveryDomain(database, { ...domainInput, atUtc: new Date().toISOString() });
      if (currentDomain.sha256 !== originalDomain.sha256 || Date.now() >= Date.parse(originalDomain.validUntilUtc)) return denied();
    };
    const withCurrentWriter = <T>(userIds: readonly string[], operation: () => T): T => {
      if (userIds.some(userId => !principals.includes(userId))) return denied();
      return core.runForUsers(principals, () => { assertEffectCurrent("settlement"); const result = operation(); assertEffectCurrent("settlement"); return result; });
    };
    withCurrentWriter(principals, () => assertEffectCurrent("claim"));
    let metadata = 0, posts = 0;
    const outbound: { contentSha256: string; path: string }[] = [];
    const request: typeof fetch = async (resource, options) => {
      const url = new URL(typeof resource === "string" ? resource : resource instanceof URL ? resource.href : resource.url);
      const method = (options?.method ?? (resource instanceof Request ? resource.method : "GET")).toUpperCase();
      withCurrentWriter(principals, () => assertEffectCurrent(method === "POST" ? "send" : "claim"));
      if (url.origin !== "https://discord.com" || url.username || url.password || url.search || url.hash || !url.pathname.startsWith("/api/v10/")) return denied();
      const path = url.pathname.slice("/api/v10/".length);
      if (method === "GET") {
        const identities = input.originalPrincipals.map(p => (database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").get(p.userId) as { auth_subject: string }).auth_subject);
        const paths = ["users/@me", `guilds/${selection.guildId}`, `guilds/${selection.guildId}/channels`, `guilds/${selection.guildId}/roles`, ...[input.botId,...identities].map(id => `guilds/${selection.guildId}/members/${id}`)];
        if (!paths.includes(path) || ++metadata > input.metadataBudget) return denied();
      } else {
        if (method !== "POST" || path !== `channels/${selection.channelId}/messages` || typeof options?.body !== "string" || posts >= input.expectedMessageContentSha256s.length) return denied();
        const payload = JSON.parse(options.body);
        if (typeof payload.content !== "string" || bytesSha(payload.content) !== input.expectedMessageContentSha256s[posts]
          || !payload.enforce_nonce || !payload.nonce || !Array.isArray(payload.allowed_mentions?.parse) || payload.allowed_mentions.parse.length !== 0) return denied();
        outbound.push({ contentSha256: bytesSha(payload.content), path }); posts++;
      }
      const response = await transport(url, { ...options, headers: { Authorization: `Bot ${token}`, ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
        redirect: "error", signal: options?.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(Math.max(1, expiry - Date.now()))]) : AbortSignal.timeout(Math.max(1, expiry - Date.now())) });
      withCurrentWriter(principals, () => assertEffectCurrent("settlement"));
      return response;
    };
    const result = source ? await runSelectedSharedAlertSourceOriginalDelivery(database, { selection: source, botToken: token, botId: input.botId,
      publicOrigin: input.publicOrigin, deadlineUtc: input.expiresAtUtc, postBudget: input.expectedMessageContentSha256s.length, metadataBudget: input.metadataBudget,
      withCurrentWriter, assertEffectCurrent }, request)
      : await runSelectedCommunityPlanDelivery(database, { selection: selection as ReturnType<typeof readSelectedCommunityPlanDelivery>, botToken: token, publicOrigin: input.publicOrigin, withCurrentWriter, assertEffectCurrent }, request);
    return { result, posts, metadataReads: metadata, outbound,
      originalEffect: { caseSha256: originalCaseSha256, selectedDeliveryId: selection.deliveryId, principalUserIds: principals,
        domainSha256: originalDomain.sha256, originalDomainValidUntilUtc: originalDomain.validUntilUtc,
        issuedAtUtc: input.issuedAtUtc, expiresAtUtc: input.expiresAtUtc },
      providerReadbackRequired: true, normalUiReadbackRequired: true };
  } finally { database.close(); }
}

/** Used by the compiled CLI; the operator supplies a separately frozen case hash. */
export function readSelectedCommunityDeliveryCase(path: string, expectedSha256: string): SelectedCommunityDeliveryCase {
  if (!/^[a-f0-9]{64}$/u.test(expectedSha256)) return denied();
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd);
    if (!before.isFile() || before.size > 65536 || before.size < 2 || (before.mode & 0o022) !== 0) return denied();
    const bytes = readFileSync(fd), after = fstatSync(fd);
    if (bytes.length !== before.size || before.ino !== after.ino || before.dev !== after.dev
      || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || bytesSha(bytes) !== expectedSha256) return denied();
    return JSON.parse(bytes.toString("utf8")) as SelectedCommunityDeliveryCase;
  } finally { closeSync(fd); }
}

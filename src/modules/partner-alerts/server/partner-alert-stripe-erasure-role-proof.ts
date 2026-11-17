import { createHash, randomUUID, sign, type KeyObject } from "node:crypto";
import type Database from "better-sqlite3";
import { createPartnerAlertDiscordRoleObserver,
  type PartnerAlertDiscordChannelCatalogConfiguration } from "./partner-alert-discord-channel-catalog";
import { createPartnerAlertDiscordRoleRest } from "./partner-alert-discord-role-rest";
import { readPartnerAlertStripeErasureRoleScopes, type StripeErasureRoleScope } from "./database/partner-alert-stripe-connect-lifecycle";

export const stripeErasureRoleProofDomain = "traderlink:stripe-erasure-role-disposition:v1";
export type StripeErasureRoleProofScope = Readonly<{
  operationRef: string; userId: string; workspaceId: string; lifecycleRef: string; erasureGeneration: number;
  catalogSha256: string; schemaSha256: string; appliedLedgerSha256: string;
}> & (Readonly<{ mode: "root"; writerFenceRef: string; writerFenceGeneration: number }> |
  Readonly<{ mode: "restore"; snapshotSha256: string; tombstoneRef: string;
    tombstoneLedgerGeneration: number; tombstoneLedgerSha256: string; restoreKeyringSha256: string }>);

export type StripeErasureRoleFacts = Readonly<{
  scope: StripeErasureRoleScope; guildId: string; roleId: string;
  stripeAuthoritySha256: string; whopAuthoritySha256: string; mappingSha256: string;
}>;
export type StripeErasureTransportClosure = Readonly<{
  guildId: string; discordUserId: string; roleId: string;
  settledTransportSha256: string; settledAtUtc: string; validUntilUtc: string;
}>;
type RoleObservation = Readonly<{
  guildId: string; discordUserId: string; roleId: string; present: boolean; observedAtUtc: string;
}>;
export type StripeErasureRoleProofEntry = StripeErasureRoleFacts & Readonly<{
  discordUserId: string; settledTransportSha256: string; desiredPresent: boolean; observedPresent: boolean; observedAtUtc: string;
}>;
export type StripeErasureRoleProof = Readonly<{
  keyId: string; receiptId: string; issuedAtUtc: string; expiresAtUtc: string;
  scope: StripeErasureRoleProofScope; affectedSourceSha256: string;
  entries: readonly StripeErasureRoleProofEntry[];
}>;

const sha256 = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const hex64 = /^[a-f0-9]{64}$/u;
const snowflake = /^[1-9][0-9]{0,19}$/u;
const canonicalUtc = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
};

export function encodePartnerAlertStripeErasureRoleProof(proof: StripeErasureRoleProof): Buffer {
  const { scope } = proof;
  return Buffer.from(JSON.stringify([
    stripeErasureRoleProofDomain, proof.keyId, proof.receiptId, proof.issuedAtUtc, proof.expiresAtUtc,
    scope.mode, scope.operationRef, scope.userId, scope.lifecycleRef, scope.erasureGeneration,
    scope.catalogSha256, scope.schemaSha256, scope.appliedLedgerSha256, scope.workspaceId,
    scope.mode === "root" ? scope.writerFenceRef : null, scope.mode === "root" ? scope.writerFenceGeneration : null,
    scope.mode === "restore" ? scope.snapshotSha256 : null, scope.mode === "restore" ? scope.tombstoneRef : null,
    scope.mode === "restore" ? scope.tombstoneLedgerGeneration : null, scope.mode === "restore" ? scope.tombstoneLedgerSha256 : null,
    scope.mode === "restore" ? scope.restoreKeyringSha256 : null, proof.affectedSourceSha256,
    proof.entries.map(entry => [
      entry.scope.community_id, entry.scope.buyer_user_id, entry.scope.mapping_id, entry.guildId, entry.discordUserId, entry.roleId,
      entry.stripeAuthoritySha256, entry.whopAuthoritySha256, entry.mappingSha256, entry.settledTransportSha256,
      entry.desiredPresent, entry.observedPresent, entry.observedAtUtc,
    ]),
  ]), "utf8");
}

export function readPartnerAlertStripeErasureRoleFacts(db: Database.Database, userId: string) {
  const scopes = readPartnerAlertStripeErasureRoleScopes(db, userId);
  const claims = db.prepare(`SELECT c.*,s.state,s.owner_user_id,s.updated_at_ms
    FROM partner_alert_stripe_checkout_claims c JOIN partner_alert_stripe_sellers s ON s.seller_id=c.seller_id
    WHERE c.buyer_user_id=? OR s.owner_user_id=? ORDER BY c.claim_id`).raw().all(userId, userId);
  const allIntents = db.prepare(`SELECT r.* FROM partner_alert_stripe_role_reconciliations r
    JOIN partner_alert_stripe_checkout_claims c ON c.claim_id=r.claim_id
    JOIN partner_alert_stripe_sellers s ON s.seller_id=c.seller_id
    WHERE c.buyer_user_id=? OR s.owner_user_id=? ORDER BY r.operation_id`).raw().all(userId, userId);
  const mapRow = db.prepare(`SELECT destination_guild_id,destination_role_id,destination_channel_id,revision,
    approved_revision,review_state,delivery_state FROM partner_alert_mappings WHERE community_id=? AND mapping_id=?`);
  const stripeRows = db.prepare(`SELECT c.claim_id,c.buyer_user_id,c.environment,c.stripe_account_id,c.stripe_subscription_id,
      c.offer_id,c.offer_version,s.state,s.updated_at_ms,s.owner_user_id,community.owner_user_id,community.status,
      partner.status,partner.owner_user_id,o.review_state,o.offer_json,p.stripe_price_id,p.amount_minor,p.currency,p.withdrawn_at_ms,
      t.invoice_id,t.invoice_payment_id,t.payment_intent_id,t.source_event_id,t.starts_at_ms,t.ends_at_ms,t.amount_minor,t.currency
    FROM partner_alert_stripe_checkout_claims c
    JOIN partner_alert_stripe_sellers s ON s.seller_id=c.seller_id
    JOIN traderlink_communities community ON community.community_id=c.community_id
    JOIN partner_alert_partners partner ON partner.community_id=c.community_id
    JOIN partner_alert_offers o ON o.community_id=c.community_id AND o.offer_id=c.offer_id AND o.version=c.offer_version
    JOIN partner_alert_stripe_prices p ON p.seller_id=c.seller_id AND p.offer_id=c.offer_id AND p.offer_version=c.offer_version
    JOIN partner_alert_offer_channels m ON m.community_id=c.community_id AND m.offer_id=c.offer_id AND m.offer_version=c.offer_version
    LEFT JOIN partner_alert_stripe_paid_terms t ON t.claim_id=c.claim_id
    WHERE c.community_id=? AND c.buyer_user_id=? AND m.mapping_id=?
    ORDER BY c.claim_id,t.invoice_id`).raw();
  const stripeEventRows = db.prepare(`SELECT e.event_id,e.kind,e.resource_id,e.body_sha256,e.status,e.received_at_ms,
      r.affected_paid_invoice_id,r.disposition,r.decision,r.reviewed_at_ms,r.reviewer_erased_at_ms
    FROM partner_alert_stripe_events e
    JOIN partner_alert_stripe_checkout_claims c ON c.claim_id=e.claim_id
    JOIN partner_alert_offer_channels m ON m.community_id=c.community_id AND m.offer_id=c.offer_id AND m.offer_version=c.offer_version
    LEFT JOIN partner_alert_stripe_review_decisions r ON r.environment=e.environment AND r.stripe_account_id=e.stripe_account_id
      AND r.event_id=e.event_id AND r.claim_id=e.claim_id
    WHERE c.community_id=? AND c.buyer_user_id=? AND m.mapping_id=?
    ORDER BY c.claim_id,e.event_id`).raw();
  const whopRows = db.prepare(`SELECT o.offer_id,o.version,o.review_state,o.offer_json,
      x.status,x.verified_at_utc,x.valid_until_utc,j.status,j.verified_at_utc,d.*,
      i.membership_id,i.starts_at_utc,i.ends_at_utc,w.state,w.basis,w.starts_at_utc,w.observed_at_utc,w.valid_until_utc
    FROM partner_alert_offer_channels m
    JOIN partner_alert_offers o ON o.community_id=m.community_id AND o.offer_id=m.offer_id AND o.version=m.offer_version
    LEFT JOIN partner_alert_whop_connections x ON x.community_id=o.community_id
      AND x.environment=o.whop_environment AND x.whop_account_id=o.whop_account_id
    LEFT JOIN partner_alert_whop_identities j ON j.user_id=? AND j.environment=o.whop_environment
    LEFT JOIN partner_alert_whop_discovery d ON d.community_id=o.community_id AND d.offer_id=o.offer_id AND d.offer_version=o.version
      AND d.user_id=j.user_id AND d.environment=o.whop_environment AND d.whop_account_id=o.whop_account_id
    LEFT JOIN partner_alert_memberships w ON w.community_id=o.community_id AND w.offer_id=o.offer_id AND w.offer_version=o.version
      AND w.user_id=j.user_id AND w.environment=o.whop_environment AND w.whop_account_id=o.whop_account_id
    LEFT JOIN partner_alert_whop_paid_intervals i ON i.community_id=w.community_id AND i.user_id=w.user_id
      AND i.offer_id=w.offer_id AND i.offer_version=w.offer_version AND i.environment=w.environment AND i.whop_account_id=w.whop_account_id
      AND i.membership_id=w.membership_id
    WHERE m.community_id=? AND m.mapping_id=?
    ORDER BY o.offer_id,o.version,w.membership_id`).raw();
  const entries = scopes.map((scope): StripeErasureRoleFacts => {
    const map = mapRow.get(scope.community_id, scope.mapping_id) as
      { destination_guild_id: string; destination_role_id: string; destination_channel_id: string } | undefined;
    if (!map || ![map.destination_guild_id, map.destination_role_id, map.destination_channel_id].every(id => snowflake.test(id))) {
      throw new Error("Stripe erasure Discord mapping unavailable.");
    }
    const args = [scope.community_id, scope.buyer_user_id, scope.mapping_id];
    return Object.freeze({ scope: Object.freeze(scope), guildId: map.destination_guild_id, roleId: map.destination_role_id,
      stripeAuthoritySha256: sha256([stripeRows.all(...args),stripeEventRows.all(...args)]),
      whopAuthoritySha256: sha256(whopRows.all(scope.buyer_user_id,scope.community_id,scope.mapping_id)),
      mappingSha256: sha256(map) });
  });
  return Object.freeze({ affectedSourceSha256: sha256([claims, allIntents]), entries: Object.freeze(entries) });
}

export function createPartnerAlertStripeErasureDiscordObserver(configuration: PartnerAlertDiscordChannelCatalogConfiguration,
  nowUtc: () => string) {
  const observe = createPartnerAlertDiscordRoleObserver(configuration, nowUtc);
  return async (target: Readonly<{ guildId: string; discordUserId: string; roleId: string }>): Promise<RoleObservation | null> => {
    const result = await observe(target);
    if (!result) {
      // A verified Discord Unknown Member response establishes absence. A
      // missing guild, denied read or ambiguous failure leaves the role held.
      try {
        const rest = createPartnerAlertDiscordRoleRest(configuration,target);
        const bot = await rest.request({method:"GET",path:"/users/@me"});
        if (bot.status !== 200 || !bot.body || typeof bot.body !== "object"
          || !("id" in bot.body) || bot.body.id !== configuration.botUserId || !("bot" in bot.body) || bot.body.bot !== true) return null;
        const member = await rest.request({method:"GET",path:`/guilds/${target.guildId}/members/${target.discordUserId}`});
        return member.status === 404 && member.body !== null && typeof member.body === "object"
          && "code" in member.body && member.body.code === 10007
          ? {...target,present:false,observedAtUtc:nowUtc()} : null;
      } catch { return null; }
    }
    if (result.guildId !== target.guildId || result.discordUserId !== target.discordUserId) return null;
    return { guildId: result.guildId, discordUserId: result.discordUserId, roleId: target.roleId,
      present: result.roleIds.includes(target.roleId), observedAtUtc: result.observedAtUtc };
  };
}

/** Paid preflight runs outside the Core write transaction. Ports must supply
 * a current settled fence, independent authority, and actual Discord reads. */
export async function issuePartnerAlertStripeErasureRoleProof(input: Readonly<{
  database: Database.Database; scope: Extract<StripeErasureRoleProofScope, { mode: "root" }>;
  keyId: string; privateKey: KeyObject; nowUtc: () => string; maximumLifetimeMs: number;
  inRootWriter?: <T>(operation: () => T) => T;
  readFence: () => Readonly<{ ref: string; generation: number }> | null;
  readSettledTransport: (facts: StripeErasureRoleFacts, discordUserId: string) => StripeErasureTransportClosure | null;
  resolveAuthority: (facts: StripeErasureRoleFacts) => Promise<Readonly<{
    discordUserId: string; stripe: "qualified" | "absent" | "unknown"; whop: "qualified" | "absent" | "unknown";
    stripeAuthoritySha256: string; whopAuthoritySha256: string; mappingSha256: string; validUntilUtc: string;
  }> | null>;
  observeDiscord: (target: Readonly<{ guildId: string; discordUserId: string; roleId: string }>) => Promise<RoleObservation | null>;
}>) {
  if (input.database.inTransaction || input.privateKey.asymmetricKeyType !== "ed25519" || input.privateKey.type !== "private"
    || !/^[A-Za-z0-9_-]{1,128}$/u.test(input.keyId) || !Number.isSafeInteger(input.maximumLifetimeMs) || input.maximumLifetimeMs <= 0
    || ![input.scope.operationRef,input.scope.userId,input.scope.workspaceId,input.scope.lifecycleRef,input.scope.writerFenceRef]
      .every(value => typeof value === "string" && value.length >= 1 && value.length <= 160)
    || ![input.scope.erasureGeneration,input.scope.writerFenceGeneration].every(value => Number.isSafeInteger(value) && value > 0)
    || ![input.scope.catalogSha256,input.scope.schemaSha256,input.scope.appliedLedgerSha256].every(digest => hex64.test(digest))) {
    throw new Error("Stripe erasure proof configuration unavailable.");
  }
  const assertFence = () => {
    if (!input.database.inTransaction) throw new Error("Stripe erasure proof writer is unavailable.");
    const fence = input.readFence();
    if (fence?.ref !== input.scope.writerFenceRef || fence.generation !== input.scope.writerFenceGeneration) {
      throw new Error("Stripe erasure role work has not settled.");
    }
  };
  const capture = () => {
    assertFence();
    return readPartnerAlertStripeErasureRoleFacts(input.database, input.scope.userId);
  };
  const transportForRole = (facts: StripeErasureRoleFacts, discordUserId: string) => {
    const transport = input.readSettledTransport(facts, discordUserId);
    if (!transport || transport.guildId !== facts.guildId || transport.discordUserId !== discordUserId
      || transport.roleId !== facts.roleId || !hex64.test(transport.settledTransportSha256)
      || !canonicalUtc(transport.settledAtUtc) || !canonicalUtc(transport.validUntilUtc)
      || transport.settledAtUtc >= transport.validUntilUtc) {
      throw new Error("Stripe erasure role work has not settled.");
    }
    return { digest: transport.settledTransportSha256, settledAtUtc: transport.settledAtUtc, validUntilUtc: transport.validUntilUtc };
  };
  const read = input.inRootWriter ?? (<T>(operation: () => T) => input.database.transaction(operation).immediate());
  const readTransport = (facts: StripeErasureRoleFacts, discordUserId: string) => read(() => {
    assertFence();
    return transportForRole(facts, discordUserId);
  });
  const start = read(capture);
  const entries: StripeErasureRoleProofEntry[] = [];
  const authorityDeadlines: number[] = [];
  const transports: ReturnType<typeof transportForRole>[] = [];
  for (const facts of start.entries) {
    const authority = await input.resolveAuthority(facts);
    if (!authority || !snowflake.test(authority.discordUserId) || !canonicalUtc(authority.validUntilUtc)
      || authority.stripeAuthoritySha256 !== facts.stripeAuthoritySha256
      || authority.whopAuthoritySha256 !== facts.whopAuthoritySha256 || authority.mappingSha256 !== facts.mappingSha256) {
      throw new Error("Stripe erasure surviving authority is unverified.");
    }
    authorityDeadlines.push(Date.parse(authority.validUntilUtc));
    const desiredPresent = authority.stripe === "qualified" || authority.whop === "qualified";
    if (!desiredPresent && (authority.stripe !== "absent" || authority.whop !== "absent")) {
      throw new Error("Stripe erasure surviving authority is incomplete.");
    }
    const target = { guildId: facts.guildId, discordUserId: authority.discordUserId, roleId: facts.roleId };
    const transport = readTransport(facts, target.discordUserId);
    transports.push(transport);
    authorityDeadlines.push(Date.parse(transport.validUntilUtc));
    const observation = await input.observeDiscord(target);
    if (!observation || observation.guildId !== target.guildId || observation.discordUserId !== target.discordUserId
      || observation.roleId !== target.roleId || observation.present !== desiredPresent || !canonicalUtc(observation.observedAtUtc)
      || observation.observedAtUtc < transport.settledAtUtc) throw new Error("Stripe erasure role observation did not confirm disposition.");
    entries.push(Object.freeze({ ...facts, discordUserId: target.discordUserId, settledTransportSha256: transport.digest,
      desiredPresent, observedPresent: observation.present, observedAtUtc: observation.observedAtUtc }));
  }
  read(() => {
    if (JSON.stringify(capture()) !== JSON.stringify(start) || entries.some((entry,index) =>
      JSON.stringify(transportForRole(start.entries[index]!,entry.discordUserId)) !== JSON.stringify(transports[index]))) {
      throw new Error("Stripe erasure role evidence changed.");
    }
  });
  const issuedAtUtc = input.nowUtc();
  if (!canonicalUtc(issuedAtUtc) || entries.some(entry => entry.observedAtUtc > issuedAtUtc
    || Date.parse(issuedAtUtc) - Date.parse(entry.observedAtUtc) >= input.maximumLifetimeMs)) {
    throw new Error("Stripe erasure role evidence expired.");
  }
  const oldestObservation = entries.reduce((oldest, entry) => Math.min(oldest, Date.parse(entry.observedAtUtc)), Date.parse(issuedAtUtc));
  const expiresAtMs = Math.min(oldestObservation + input.maximumLifetimeMs, ...authorityDeadlines);
  if (expiresAtMs <= Date.parse(issuedAtUtc)) throw new Error("Stripe erasure authority has expired.");
  const proof: StripeErasureRoleProof = Object.freeze({ keyId: input.keyId, receiptId: randomUUID(), issuedAtUtc,
    expiresAtUtc: new Date(expiresAtMs).toISOString(), scope: Object.freeze({ ...input.scope }),
    affectedSourceSha256: start.affectedSourceSha256, entries: Object.freeze(entries) });
  return Object.freeze({ proof, signature: sign(null,encodePartnerAlertStripeErasureRoleProof(proof), input.privateKey).toString("base64url") });
}

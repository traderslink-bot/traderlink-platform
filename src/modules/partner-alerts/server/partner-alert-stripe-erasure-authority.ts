import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { readAppliedPlatformMigrations } from "../../platform/server/database/platform-migration-registry";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import type { StripeErasureRoleFacts, StripeErasureRoleProofScope, StripeErasureTransportClosure } from "./partner-alert-stripe-erasure-role-proof";
import type { StripeErasureSettlement } from "./partner-alert-stripe-erasure-settlement";

export type StripeErasureAuthorityQuery = Readonly<{
  scope: StripeErasureRoleProofScope;
  facts: StripeErasureRoleFacts;
  discordUserId: string;
  atUtc: string;
}>;

type Coverage = Readonly<{
  kind: "qualified" | "absent" | "unknown";
  authoritySha256: string;
  validUntilUtc: string;
}>;

export type StripeErasureAuthoritySources = Readonly<{
  /** Local reads of independently qualified evidence on this same connection.
   * These readers may not consult the disposition receipt under verification. */
  readStripeSurvivor: (db: Database.Database, query: StripeErasureAuthorityQuery) => Coverage | null;
  readWhopSurvivor: (db: Database.Database, query: StripeErasureAuthorityQuery) => Coverage | null;
  readSettledTransport: (db: Database.Database, query: StripeErasureAuthorityQuery, desiredPresent: boolean) => StripeErasureTransportClosure | null;
  /** Validates independently authenticated restore inputs for the same image. */
  verifyRestoreAuthority?: (db: Database.Database, scope: Extract<StripeErasureRoleProofScope, { mode: "restore" }>) => boolean;
}>;

export type StripeErasureRoleIntent = Readonly<{
  query: StripeErasureAuthorityQuery;
  desiredPresent: boolean;
  validUntilUtc: string;
  stripe: Coverage["kind"];
  whop: Coverage["kind"];
}>;

const snowflake = /^[1-9][0-9]{0,19}$/u;
const sha = /^[a-f0-9]{64}$/u;
function canonicalUtc(value: string) {
  const at = Date.parse(value);
  return Number.isFinite(at) && new Date(at).toISOString() === value;
}

/** The same admitted decision is available before a Discord write and when
 * Core verifies the finished outcome. */
export function createPartnerAlertStripeErasureIntentReader(db: Database.Database,
  sources: Pick<StripeErasureAuthoritySources,"readStripeSurvivor"|"readWhopSurvivor"|"verifyRestoreAuthority">) {
  const linked = db.prepare(`SELECT auth_subject FROM platform_auth_identities
    WHERE user_id=? AND auth_provider='discord' AND status='active' LIMIT 2`);
  return (scope: StripeErasureRoleProofScope, facts: StripeErasureRoleFacts, atUtc: string): StripeErasureRoleIntent | null => {
    try {
      // Root subjects are settling. The ordinary per-user writer check is
      // intentionally live-only, so use the distinct Core root command.
      const core = requirePlatformErasureWriter(db);
      const currentAt = core.now();
      if (core.rootCommand(scope.userId) !== scope.operationRef || !canonicalUtc(atUtc)
        || !canonicalUtc(currentAt) || atUtc > currentAt) return null;
      const receipt = core.qualificationReceipt();
      if (receipt.schemaSha256 !== scope.schemaSha256 || receipt.profileCatalogSha256 !== scope.catalogSha256) return null;
      const ledger = readAppliedPlatformMigrations(db);
      if (!ledger.length || createHash("sha256").update(JSON.stringify(ledger)).digest("hex") !== scope.appliedLedgerSha256) return null;
      const lifecycle = core.lifecycle(scope.userId);
      const operation = core.operation(scope.operationRef);
      if (lifecycle.phase !== "settling" || lifecycle.lifecycle_ref !== scope.lifecycleRef || lifecycle.erasure_generation !== scope.erasureGeneration
        || lifecycle.operation_ref !== scope.operationRef || lifecycle.profile_ref !== operation.profile_ref
        || lifecycle.profile_generation !== operation.profile_generation
        || operation.lifecycle_ref !== scope.lifecycleRef || operation.workspace_id !== scope.workspaceId
        || operation.phase !== "ready" || !operation.quiescence_ref
        || lifecycle.valid_until_utc <= currentAt || operation.valid_until_utc <= currentAt) return null;
      if (scope.mode === "root" && (operation.quiescence_ref !== scope.writerFenceRef
        || lifecycle.generation !== scope.writerFenceGeneration)) return null;
      if (scope.mode === "restore" && sources.verifyRestoreAuthority?.(db,scope) !== true) return null;

      const identities = linked.pluck().all(facts.scope.buyer_user_id) as unknown[];
      const discordUserId = identities[0];
      if (identities.length !== 1 || typeof discordUserId !== "string" || !snowflake.test(discordUserId)) return null;
      const query = Object.freeze({ scope, facts, discordUserId, atUtc: currentAt });
      const stripe = sources.readStripeSurvivor(db,query);
      const whop = sources.readWhopSurvivor(db,query);
      if (!stripe || !whop || stripe.authoritySha256 !== facts.stripeAuthoritySha256
        || whop.authoritySha256 !== facts.whopAuthoritySha256
        || ![stripe.validUntilUtc,whop.validUntilUtc].every(deadline => canonicalUtc(deadline) && deadline > currentAt)) return null;
      const desiredPresent = stripe.kind === "qualified" || whop.kind === "qualified";
      if (!desiredPresent && (stripe.kind !== "absent" || whop.kind !== "absent")) return null;
      const validUntilUtc = [stripe.validUntilUtc,whop.validUntilUtc,lifecycle.valid_until_utc,operation.valid_until_utc].sort()[0]!;
      return Object.freeze({ query, desiredPresent, validUntilUtc, stripe:stripe.kind, whop:whop.kind });
    } catch { return null; }
  };
}

export function createPartnerAlertStripeErasureAuthorityReader(db: Database.Database, sources: StripeErasureAuthoritySources) {
  const readIntent = createPartnerAlertStripeErasureIntentReader(db,sources);
  return (scope: StripeErasureRoleProofScope, facts: StripeErasureRoleFacts, atUtc: string): StripeErasureSettlement | null => {
    try {
      const intent = readIntent(scope,facts,atUtc);
      if (!intent) return null;
      const { query: { discordUserId, atUtc: currentAt }, desiredPresent } = intent;
      const transport = sources.readSettledTransport(db,intent.query,desiredPresent);
      if (!transport || transport.guildId !== facts.guildId || transport.discordUserId !== discordUserId || transport.roleId !== facts.roleId
        || !sha.test(transport.settledTransportSha256) || !canonicalUtc(transport.settledAtUtc)
        || transport.settledAtUtc > currentAt || !canonicalUtc(transport.validUntilUtc) || transport.validUntilUtc <= currentAt) return null;
      return Object.freeze({ discordUserId, settledTransportSha256: transport.settledTransportSha256,
        settledAtUtc: transport.settledAtUtc, desiredPresent });
    } catch { return null; }
  };
}

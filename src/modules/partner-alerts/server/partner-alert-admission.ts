import type Database from "better-sqlite3";
import { currentPlatformErasureAdmission, requirePlatformErasureWriter,
  type PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS } from "../../platform/server/membership/platform-premium-role-current-access-schema";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS, PartnerAlertCurrentContext } from "./partner-alert-current-context";
import { PartnerAlertValidationError, type PartnerAlertAccessTicket } from "../contracts/partner-alert-contracts";
import { partnerAlertId } from "../contracts/partner-alert-validation";
import { premiumTicket, type PlatformPremiumTicket } from "../../platform/contracts/platform-premium-access";
import { parsePlatformPremiumEligibilityEvent } from "../../platform/server/membership/platform-premium-eligibility-event";

export type PartnerAlertCommunityFence = Readonly<{ communityId: string; ownerUserId: string;
  admissionRef: string; erasureGeneration: number; revision: number; providerGeneration: number;
  policyGeneration: number; configurationRef: string; validUntilUtc: string }>;

const bound = new WeakMap<Database.Database, PartnerAlertAdmission>();
/** Private connection binding, not enabled runtime composition. Constructor and
 * import open no connections, load no credentials and perform no provider I/O. */
export class PartnerAlertAdmission {
  private constructor(private readonly database: Database.Database, private readonly core: PlatformErasureAdmission) {}
  static bind(database: Database.Database): PartnerAlertAdmission {
    const core = currentPlatformErasureAdmission(database);
    if (!core || bound.has(database)) throw new PartnerAlertValidationError("admissionUnbound");
    core.qualifyAdditionalStatements([...PARTNER_ALERT_SCHEMA_STATEMENTS, ...PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS,
      ...PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS]);
    const admission = new PartnerAlertAdmission(database, core); bound.set(database, admission); return admission;
  }
  private ownerId(communityId: string): string {
    partnerAlertId(communityId, "communityId");
    const row = this.database.prepare("SELECT owner_user_id FROM partner_alert_partners WHERE community_id=?").get(communityId) as { owner_user_id: string } | undefined;
    if (!row) throw new PartnerAlertValidationError("communityAdmission"); return row.owner_user_id;
  }
  /** Actual Core owns the transaction; the union is re-read while holding it. */
  runCommunity<T>(communityId: string, userIds: readonly string[], operation: () => T): T {
    const owner = this.ownerId(communityId), ids = [...new Set([owner,...userIds])];
    return this.core.runForUsers(ids, () => {
      if (this.ownerId(communityId) !== owner) throw new PartnerAlertValidationError("communityChanged");
      this.assertCommunity(communityId); return operation();
    });
  }
  assertCommunity(communityId: string): void {
    if (bound.get(this.database) !== this) throw new PartnerAlertValidationError("admissionUnbound");
    requirePlatformErasureWriter(this.database).assertLivePrincipal(this.ownerId(communityId));
    if (!this.database.prepare("SELECT 1 FROM partner_alert_context_epochs WHERE community_id=?").get(communityId)) {
      throw new PartnerAlertValidationError("communityContextUnbound");
    }
  }
  isCurrent(original: PartnerAlertAccessTicket): boolean { return new PartnerAlertCurrentContext(this.database).isCurrent(original); }
  captureCommunityFence(communityId: string): PartnerAlertCommunityFence {
    this.assertCommunity(communityId); const owner = this.ownerId(communityId), life = this.core.lifecycle(owner);
    const context = this.database.prepare("SELECT * FROM partner_alert_context_epochs WHERE community_id=?").get(communityId) as
      { revision: number; provider_generation: number; policy_generation: number; configuration_ref: string };
    return Object.freeze({ communityId, ownerUserId: owner, admissionRef: life.admission_ref,
      erasureGeneration: life.erasure_generation, revision: context.revision, providerGeneration: context.provider_generation,
      policyGeneration: context.policy_generation, configurationRef: context.configuration_ref, validUntilUtc: life.valid_until_utc });
  }
  assertCommunityFence(original: PartnerAlertCommunityFence): void {
    const current = this.captureCommunityFence(original.communityId);
    if (JSON.stringify(current) !== JSON.stringify(original) || this.core.now() >= original.validUntilUtc) {
      throw new PartnerAlertValidationError("communityFenceChanged");
    }
  }
  communityFenceCurrent(original: PartnerAlertCommunityFence): boolean {
    try { return this.runCommunity(original.communityId, [], () => { this.assertCommunityFence(original); return true; }); }
    catch { return false; }
  }
  /** Refresh-only admission for an already persisted immutable original event.
   * Expiry is allowed here; this method can never authorize role/payment effects. */
  admitStoredRefresh(original: PlatformPremiumTicket): boolean {
    try {
      if (!this.core.admittedUserIds().includes(original.scope.userId)) return false;
      this.core.assertCurrent(original.scope.userId);
      const life = this.core.lifecycle(original.scope.userId);
      const row = this.database.prepare(`SELECT a.*,p.generation policy_generation,p.guild_id FROM platform_premium_authorities a
        JOIN platform_premium_authority_policies p USING(policy_ref) WHERE a.authority_key=? AND a.user_id=? AND a.phase='live' AND p.state='active'`)
        .get(original.scope.authorityKey, original.scope.userId) as Record<string, unknown> | undefined;
      if (!row || row.authority_revision !== original.authorityRevision || row.whop_generation !== original.whopGeneration
        || row.identity_generation !== original.scope.identityGeneration || row.entitlement_generation !== original.scope.entitlementGeneration
        || row.erasure_generation !== original.scope.erasureGeneration || row.policy_generation !== original.scope.policyGeneration
        || row.guild_id !== original.scope.guildId || life.admission_ref !== original.admissionRef) return false;
      const sources = this.database.prepare(`SELECT event_json FROM platform_premium_paid_events WHERE authority_key=?
        UNION ALL SELECT event_json FROM partner_alert_premium_refresh_events WHERE authority_key=? LIMIT 10001`)
        .all(original.scope.authorityKey,original.scope.authorityKey) as { event_json: string }[];
      const originalText = JSON.stringify(premiumTicket(original));
      return sources.length <= 10_000 && sources.some(source =>
        source.event_json.length <= 262144
        && JSON.stringify(parsePlatformPremiumEligibilityEvent(JSON.parse(source.event_json)).ticket) === originalText);
    } catch { return false; }
  }
  writerForUsers(userIds: readonly string[]) {
    const ids = Object.freeze([...new Set(userIds)]);
    return Object.freeze({ run: <T>(operation: () => T): T => this.core.runForUsers(ids, operation),
      isCurrentWriter: (): boolean => {
        try { for (const id of ids) requirePlatformErasureWriter(this.database, id); return ids.length > 0; }
        catch { return false; }
      } });
  }
  /** Explicit operator configuration event. No lazy generation-1 read. */
  onboardCommunity(communityId: string, configurationRef: string): void {
    this.core.requirePlatformOwner(); this.ownerId(communityId);
    if (!/^[A-Za-z0-9_:-]{1,160}$/u.test(configurationRef)) throw new PartnerAlertValidationError("configurationRef");
    this.database.prepare("INSERT INTO partner_alert_context_epochs VALUES(?,1,1,1,?)").run(communityId, configurationRef);
  }
  changeConfiguration(communityId: string, expectedGeneration: number, configurationRef: string): void {
    this.core.requirePlatformOwner();
    if (!/^[A-Za-z0-9_:-]{1,160}$/u.test(configurationRef)) throw new PartnerAlertValidationError("configurationRef");
    const changed = this.database.prepare(`UPDATE partner_alert_context_epochs SET policy_generation=policy_generation+1,
      revision=revision+1,configuration_ref=? WHERE community_id=? AND policy_generation=?`)
      .run(configurationRef, communityId, expectedGeneration).changes;
    if (changed !== 1) throw new PartnerAlertValidationError("configurationChanged");
  }
}
export function requirePartnerAlertAdmission(database: Database.Database): PartnerAlertAdmission {
  const admission = bound.get(database); if (!admission) throw new PartnerAlertValidationError("admissionUnbound");
  return admission;
}

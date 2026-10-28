import { PlatformPremiumError, evaluatePlatformPremium, premiumFresh, premiumInteger, premiumRef, premiumScope, premiumSnowflake, premiumUtc,
  type PlatformPremiumDecision, type PlatformPremiumTicket, type PlatformPremiumSnapshot } from "../../contracts/platform-premium-access";
import { PlatformPremiumDiscoveryRepository, PlatformPremiumRoleRepository,
  type PlatformPremiumDiscoveryCandidate, type PlatformPremiumDiscoveryPage, type PlatformPremiumDiscoverySource,
  type PlatformPremiumRoleIntent, type PlatformPremiumRoleOutcome, type PlatformPremiumRoleTarget } from "./platform-premium-role-repository";
import type { PlatformPremiumDiscordClient } from "./platform-premium-discord-client";

export const PLATFORM_PREMIUM_UNBOUND_DEPENDENCIES = Object.freeze([
  "current_identity_subject_generation_and_erasure_fence",
  "premium_offer_scope_and_native_whop_paid_coverage",
  "owner_complimentary_grants_and_historical_assignment_review",
  "durable_store_and_erasure_surviving_cleanup",
  "transactional_paid_eligibility_partner_fanout",
  "complete_resumable_role_paid_grant_and_retired_subject_discovery",
  "qualified_discord_configuration_hierarchy_and_exclusive_writer",
] as const);
/** No implementation is supplied by this slice. Existing findCurrent(user,guild),
 * readEffectiveAccess, owner_grant or a caller-supplied role list cannot implement
 * this authority without the missing subject/generation/payment bindings. */
export interface PlatformPremiumAuthority {
  loadCurrent(authorityKey: string): Promise<Readonly<{ kind: "unbound" }>
    | Readonly<{ kind: "snapshot"; snapshot: PlatformPremiumSnapshot }>>;
  /** Current writer-transaction view, including unlink/erasure and all generations. */
  isCurrent(ticket: PlatformPremiumTicket): boolean;
  /** Actual same-connection admitted IMMEDIATE writer; absent means unbound.
   * Reuse an existing admission; never network I/O inside this callback. */
  inCurrentWriter?<T>(operation: () => T): T;
}
export interface PlatformPremiumRoleTransport {
  setRole(target: PlatformPremiumRoleTarget, present: boolean, operationRef: string,
    stillCurrent: () => boolean): Promise<PlatformPremiumRoleOutcome>;
}
/** Implemented discovery must UNION actual configured-role holders, current paid
 * purchases, explicit owner grants and retained retired-subject cleanup. Pages
 * require durable epoch/cursor/lease checkpoints, permissions and bounded budgets.
 * A partial page is never proof that an unknown manual holder is unpaid. */
export interface PlatformPremiumCandidateSource {
  readPage(input: Readonly<{ epochRef: string; source: PlatformPremiumDiscoverySource; guildId: string; paidRoleId: string;
    cursor: string | null; maximum: number }>): Promise<Readonly<{ kind: "page"; page: PlatformPremiumDiscoveryPage }>
      | Readonly<{ kind: "retry"; delayMs: number }> | Readonly<{ kind: "unbound" }> | Readonly<{ kind: "held" }>>;
}
/** Missing current-identity mapper is a synchronous read dependency, never
 * username/email matching. A mapping only queues fresh authority evaluation. */
export interface PlatformPremiumHolderIdentityReader {
  resolve(input: Readonly<{ guildId: string; discordUserId: string }>):
    Readonly<{ kind: "linked"; authorityKey: string }> | Readonly<{ kind: "unlinked" | "ambiguous" }>;
}
export class PlatformPremiumDiscordCandidateSource implements PlatformPremiumCandidateSource {
  private readonly scope: Readonly<{ guildId: string; paidRoleId: string }>;
  constructor(private readonly discord: Pick<PlatformPremiumDiscordClient, "readPaidRoleMembersPage">,
    private readonly identities: PlatformPremiumHolderIdentityReader,
    scope: Readonly<{ guildId: string; paidRoleId: string }>) {
    premiumSnowflake(scope.guildId); premiumSnowflake(scope.paidRoleId);
    if (scope.guildId === scope.paidRoleId) throw new PlatformPremiumError("invalid");
    this.scope = Object.freeze({ ...scope });
  }
  async readPage(input: Parameters<PlatformPremiumCandidateSource["readPage"]>[0]): ReturnType<PlatformPremiumCandidateSource["readPage"]> {
    if (input.source !== "discord_paid_role" || input.guildId !== this.scope.guildId || input.paidRoleId !== this.scope.paidRoleId) {
      return { kind: "held" };
    }
    const result = await this.discord.readPaidRoleMembersPage({ after: input.cursor, maximum: input.maximum });
    if (result.kind === "disabled") return { kind: "unbound" };
    if (result.kind === "held") return { kind: "held" };
    if (result.kind === "retry") return { kind: "retry", delayMs: result.delayMs };
    if (!Array.isArray(result.roleHolderIds) || result.roleHolderIds.length > input.maximum
      || premiumInteger(result.scannedCount, 0, input.maximum) < result.roleHolderIds.length) throw new PlatformPremiumError("invalid");
    const candidates: PlatformPremiumDiscoveryCandidate[] = [];
    for (const id of result.roleHolderIds) {
      premiumSnowflake(id);
      const identity = this.identities.resolve({ guildId: input.guildId, discordUserId: id });
      candidates.push(identity.kind === "linked" ? { kind: "principal", authorityKey: premiumRef(identity.authorityKey) }
        : { kind: "unresolved_role_holder", discordUserId: id });
    }
    return { kind: "page", page: Object.freeze({ source: input.source, cursor: input.cursor, nextCursor: result.nextCursor,
      exhausted: result.exhausted, scannedCount: result.scannedCount, candidates: Object.freeze(candidates) }) };
  }
}
export type PlatformPremiumRefreshResult = Readonly<{
  state: "disabled" | "unbound" | "held" | "staged";
  decision: PlatformPremiumDecision | null;
}>;
type PremiumAttention = "authority_unbound" | "discovery_required" | "refresh_required" | "discord_permission"
  | "rate_limit_unqualified" | "outcome_unknown" | "retry_exhausted";

/** Explicit-call dormant orchestration: no loop/timer, route, webhook, automatic census,
 * database creation, migration, actual provider call or runtime registration.
 * No ordinary complimentary role is ever assigned/removed by this reconciler. */
export class PlatformPremiumRoleReconciliation {
  constructor(private readonly authority: PlatformPremiumAuthority,
    private readonly repository: PlatformPremiumRoleRepository,
    private readonly transport: PlatformPremiumRoleTransport,
    private readonly configuration: Readonly<{
      enabled: boolean; discoveryEnabled?: boolean; guildId: string; paidRoleId: string; complimentaryRoleId: string | null;
      nowUtc: () => string; createOperationRef: () => string;
      attention: (reason: PremiumAttention) => void;
    }>, private readonly discovery: Readonly<{
      repository: PlatformPremiumDiscoveryRepository;
      sources: Readonly<Record<PlatformPremiumDiscoverySource, PlatformPremiumCandidateSource>>;
    }> | null = null) {
    [configuration.guildId, configuration.paidRoleId].forEach(premiumSnowflake);
    if (configuration.complimentaryRoleId !== null) premiumSnowflake(configuration.complimentaryRoleId);
    if ([configuration.guildId, configuration.complimentaryRoleId].includes(configuration.paidRoleId)) {
      throw new Error("Premium role configuration requires verification.");
    }
    this.configuration = Object.freeze({ ...configuration });
  }
  private notify(reason: PremiumAttention): void {
    try { this.configuration.attention(reason); } catch { /* Queue state remains authoritative. */ }
  }

  beginDiscovery(): string | null {
    if (this.configuration.enabled !== true || this.configuration.discoveryEnabled !== true) return null;
    if (!this.discovery) { this.notify("discovery_required"); return null; }
    const epoch = this.discovery.repository.start({ epochRef: premiumRef(this.configuration.createOperationRef()),
      guildId: this.configuration.guildId, paidRoleId: this.configuration.paidRoleId,
      nowUtc: premiumUtc(this.configuration.nowUtc()) });
    return epoch.epochRef;
  }

  /** One read page per call. No role writes, automatic startup or absence cleanup.
   * Source adapters map native holder IDs to verified principal candidates or
   * unresolved owner-review rows; they never fabricate a free/paid classification. */
  async discoverOnce(epochRef: string): Promise<"disabled" | "unbound" | "idle" | "committed" | "retry" | "held" | "superseded"> {
    if (this.configuration.enabled !== true || this.configuration.discoveryEnabled !== true) return "disabled";
    const discovery = this.discovery;
    if (!discovery) { this.notify("discovery_required"); return "unbound"; }
    const claim = discovery.repository.claim(premiumRef(epochRef), premiumUtc(this.configuration.nowUtc()),
      premiumRef(this.configuration.createOperationRef()));
    if (!claim) return "idle";
    const fail = (reason: "source_unavailable" | "source_invalid", delay: number | null): void => {
      try { discovery.repository.fail(claim, premiumUtc(this.configuration.nowUtc()), reason, delay); }
      catch { /* Durable cursor/lease remains pending; never claim it advanced. */ }
      this.notify("discovery_required");
    };
    try {
      if (claim.epoch.guildId !== this.configuration.guildId || claim.epoch.paidRoleId !== this.configuration.paidRoleId) {
        fail("source_invalid", null); return "held";
      }
      const result = await discovery.sources[claim.source].readPage({ epochRef: claim.epoch.epochRef,
        source: claim.source, guildId: claim.epoch.guildId, paidRoleId: claim.epoch.paidRoleId,
        cursor: claim.epoch.cursor, maximum: claim.maximum });
      if (result.kind === "unbound" || result.kind === "held") { fail("source_unavailable", null); return "held"; }
      if (result.kind === "retry") {
        const delay = premiumInteger(result.delayMs, 1, 86_400_000); fail("source_unavailable", delay); return "retry";
      }
      return discovery.repository.finish(claim, result.page, premiumUtc(this.configuration.nowUtc())) ? "committed" : "superseded";
    } catch (error) {
      const invalid = error instanceof PlatformPremiumError;
      fail(invalid ? "source_invalid" : "source_unavailable", invalid ? null : 5000);
      return invalid ? "held" : "retry";
    }
  }

  async refresh(authorityKey: string): Promise<PlatformPremiumRefreshResult> {
    if (this.configuration.enabled !== true) return { state: "disabled", decision: null };
    premiumRef(authorityKey);
    try {
      const loaded = await this.authority.loadCurrent(authorityKey);
      if (loaded.kind !== "snapshot") { this.notify("authority_unbound"); return { state: "unbound", decision: null }; }
      // Detach mutable adapter objects before any deferred use. No raw native body is stored.
      const snapshot: PlatformPremiumSnapshot = structuredClone(loaded.snapshot);
      const scope = premiumScope(snapshot.scope); premiumInteger(snapshot.authorityRevision);
      const at = premiumUtc(this.configuration.nowUtc());
      if (scope.authorityKey !== authorityKey || scope.guildId !== this.configuration.guildId
        || snapshot.paidRoleId !== this.configuration.paidRoleId
        || snapshot.complimentaryRoleId !== this.configuration.complimentaryRoleId
        || !premiumFresh(snapshot.observedAtUtc, snapshot.validUntilUtc, at)
        || !Array.isArray(snapshot.retiredSubjects) || snapshot.retiredSubjects.length > 100
        || !this.authority.inCurrentWriter) return { state: "held", decision: null };
      const decision = evaluatePlatformPremium(snapshot, at);
      const intents: PlatformPremiumRoleIntent[] = [];
      if (scope.discordUserId) intents.push({ ticket: snapshot.ticket, managedAssignmentRef: null, target: { authorityKey, guildId: scope.guildId,
        discordUserId: scope.discordUserId, roleId: snapshot.paidRoleId }, scope,
        authorityRevision: snapshot.authorityRevision, desired: decision.paidRole,
        validUntilUtc: decision.paidRole === "hold" ? null : decision.validUntilUtc,
        atUtc: at, reason: decision.reason });
      const retired = new Set<string>();
      for (const subject of snapshot.retiredSubjects) {
        premiumSnowflake(subject.discordUserId); premiumRef(subject.priorManagedAssignmentRef);
        if (retired.has(subject.discordUserId) || subject.discordUserId === scope.discordUserId) return { state: "held", decision: null };
        retired.add(subject.discordUserId);
        intents.push({ ticket: snapshot.ticket, managedAssignmentRef: subject.priorManagedAssignmentRef,
          target: { authorityKey, guildId: scope.guildId, discordUserId: subject.discordUserId,
          roleId: snapshot.paidRoleId }, scope, authorityRevision: snapshot.authorityRevision,
          desired: "absent", validUntilUtc: snapshot.validUntilUtc, atUtc: at, reason: "retired_managed_subject" });
      }
      const staged = this.authority.inCurrentWriter(() => this.repository.stage(intents, {
        ticket: snapshot.ticket, authorityKey, authorityRevision: snapshot.authorityRevision,
        scope, paidEligible: decision.partnerPaidEligible,
        paidThroughUtc: decision.partnerPaidEligible ? decision.paidThroughUtc : null,
        validUntilUtc: decision.partnerPaidEligible ? decision.validUntilUtc : null, observedAtUtc: at }));
      if (!staged) this.notify("refresh_required");
      return { state: staged ? "staged" : "held", decision };
    } catch {
      // No role removals inferred from an adapter exception or missing identity.
      // Independent verified paid deadlines must be scheduled by the authority adapter.
      this.notify("refresh_required"); return { state: "held", decision: null };
    }
  }

  async runOnce(): Promise<boolean> {
    if (this.configuration.enabled !== true) return false;
    if (!this.authority.inCurrentWriter) { this.notify("authority_unbound"); return false; }
    const key = this.repository.nextDueAuthority(premiumUtc(this.configuration.nowUtc()));
    if (!key) return false;
    const refreshed = await this.refresh(key);
    if (refreshed.state !== "staged") return false;
    const claim = this.authority.inCurrentWriter(() => this.repository.claim(premiumUtc(this.configuration.nowUtc()), premiumRef(this.configuration.createOperationRef()), key));
    if (!claim) return false;
    let result: PlatformPremiumRoleOutcome;
    let attempted = false;
    try {
      if (!this.authority.inCurrentWriter(() => this.repository.canApply(claim, premiumUtc(this.configuration.nowUtc())))) {
        result = { kind: "not_written", reason: "authority_changed" };
      } else {
        attempted = true;
        result = await this.transport.setRole(claim.job.intent.target, claim.job.lease!.present, claim.token,
          () => this.authority.inCurrentWriter!(() => this.repository.canApply(claim, premiumUtc(this.configuration.nowUtc()))));
      }
    } catch { result = attempted ? { kind: "uncertain" } : { kind: "retry", reason: "temporary", delayMs: 5000 }; }
    this.authority.inCurrentWriter(() => this.repository.finish(claim, result, premiumUtc(this.configuration.nowUtc())));
    if (result.kind === "uncertain") this.notify("outcome_unknown");
    else if (result.kind === "not_written") this.notify("refresh_required");
    else if (result.kind === "rejected") this.notify(result.reason === "permission" ? "discord_permission" : "rate_limit_unqualified");
    else if (result.kind === "retry" && claim.job.attempts >= 8) this.notify("retry_exhausted");
    return true;
  }
}

import { PlatformPremiumError, premiumInteger, premiumRef, premiumScope, premiumSnowflake, premiumUtc, samePremiumScope,
  premiumTicket, samePremiumTicket, type PlatformPremiumScope, type PlatformPremiumTicket } from "../../contracts/platform-premium-access";

export type PlatformPremiumRoleTarget = Readonly<{
  authorityKey: string; guildId: string; discordUserId: string; roleId: string;
}>;
export type PlatformPremiumRoleIntent = Readonly<{
  ticket: PlatformPremiumTicket;
  /** Required for a retired subject; actual confirmed own assignment, never native history alone. */
  managedAssignmentRef: string | null;
  target: PlatformPremiumRoleTarget;
  scope: PlatformPremiumScope;
  authorityRevision: number;
  desired: "present" | "absent" | "hold";
  validUntilUtc: string | null;
  atUtc: string;
  reason: string;
}>;
export type PlatformPremiumRoleJob = Readonly<{
  intent: PlatformPremiumRoleIntent;
  version: number;
  state: "pending" | "retry" | "applying" | "uncertain" | "confirmed" | "held";
  actualPresent: boolean | null;
  attempts: number;
  nextAttemptAtUtc: string;
  /** Original claimed intent survives restaging and restart, including its ticket. */
  lease: Readonly<{ token: string; untilUtc: string; version: number; present: boolean; intent: PlatformPremiumRoleIntent }> | null;
  managedAssignment: Readonly<{ assignmentRef: string; confirmedAtUtc: string; ticket: PlatformPremiumTicket }> | null;
  lastOutcome: Readonly<{ token: string; intent: PlatformPremiumRoleIntent; kind: PlatformPremiumRoleOutcome["kind"];
    actualPresent: boolean | null; receivedAtUtc: string }> | null;
  error: "temporary" | "rate_limited" | "permission" | "rate_limit_unqualified" | "unknown_outcome" | "authority_changed" | null;
}>;
export type PlatformPremiumEligibilityEvent = Readonly<{
  ticket: PlatformPremiumTicket;
  authorityKey: string;
  authorityRevision: number;
  scope: PlatformPremiumScope;
  paidEligible: boolean;
  validUntilUtc: string | null;
  /** Exact paid-period endpoint, distinct from observation/admission freshness. */
  paidThroughUtc: string | null;
  observedAtUtc: string;
}>;
/** No schema/table/migration is allocated here. This port MUST be a durable
 * single-writer transactional implementation, not an in-memory job queue.
 * Target uniqueness is (guild,Discord subject,role), ACROSS Platform identities.
 * Cleanup rows/leases survive erasure; canonical erasure closure/recovery must
 * explicitly qualify that retention. Omitting a user FK alone is insufficient. */
export interface PlatformPremiumRoleTransaction {
  findTarget(target: PlatformPremiumRoleTarget): PlatformPremiumRoleJob | null;
  put(job: PlatformPremiumRoleJob): void;
  /** Bounded pending/retry due rows, expired applying leases, and confirmed
   * positive intents at validUntilUtc (independent expiry wakeup); never uncertain. */
  due(atUtc: string, maximum: number): readonly PlatformPremiumRoleJob[];
  /** Deduplicate by authorityKey/revision/observedAtUtc; reject conflicting same-key data.
   * Durable Partner fanout is in the SAME transaction as ordinary role intents. */
  appendEligibility(event: PlatformPremiumEligibilityEvent): void;
  cooldownUntilUtc(): string | null;
  extendCooldown(untilUtc: string): void;
}
export interface PlatformPremiumRoleStore {
  /** Synchronous immediate writer transaction. Callback must never perform network I/O. */
  transaction<T>(operation: (tx: PlatformPremiumRoleTransaction) => T): T;
}
export type PlatformPremiumRoleOutcome = Readonly<{
  kind: "confirmed"; target: PlatformPremiumRoleTarget; present: boolean;
}> | Readonly<{ kind: "retry"; reason: "temporary" | "rate_limited"; delayMs: number }>
  | Readonly<{ kind: "rejected"; reason: "permission" | "rate_limit_unqualified" }>
  | Readonly<{ kind: "not_written"; reason: "authority_changed" | "disabled" | "member_absent" }>
  | Readonly<{ kind: "uncertain" }>;
export type PlatformPremiumRoleClaim = Readonly<{ job: PlatformPremiumRoleJob; token: string }>;

export function samePremiumRoleTarget(a: PlatformPremiumRoleTarget, b: PlatformPremiumRoleTarget): boolean {
  return a.authorityKey === b.authorityKey && a.guildId === b.guildId
    && a.discordUserId === b.discordUserId && a.roleId === b.roleId;
}
function validateTarget(target: PlatformPremiumRoleTarget): void {
  premiumRef(target.authorityKey); [target.guildId, target.discordUserId, target.roleId].forEach(premiumSnowflake);
  if (target.guildId === target.roleId) throw new PlatformPremiumError("invalid");
}
function sameIntent(a: PlatformPremiumRoleIntent, b: PlatformPremiumRoleIntent): boolean {
  return samePremiumRoleTarget(a.target, b.target) && samePremiumTicket(a.ticket, b.ticket)
    && a.desired === b.desired && a.validUntilUtc === b.validUntilUtc && a.atUtc === b.atUtc
    && a.reason === b.reason && a.managedAssignmentRef === b.managedAssignmentRef;
}

/** Dormant queue business rules over an UNIMPLEMENTED durable store port.
 * No DB opener/SQL, registration, schedule or current-authority implementation. */
export class PlatformPremiumRoleRepository {
  constructor(private readonly store: PlatformPremiumRoleStore,
    private readonly current: (ticket: PlatformPremiumTicket) => boolean) {}

  stage(intents: readonly PlatformPremiumRoleIntent[], eligibility: PlatformPremiumEligibilityEvent): boolean {
    if (intents.length > 101) throw new PlatformPremiumError("invalid");
    premiumScope(eligibility.scope); premiumInteger(eligibility.authorityRevision); premiumUtc(eligibility.observedAtUtc);
    const ticket = premiumTicket(eligibility.ticket);
    if (!samePremiumScope(ticket.scope, eligibility.scope) || ticket.authorityRevision !== eligibility.authorityRevision
      || eligibility.observedAtUtc < ticket.observedAtUtc
      || eligibility.observedAtUtc >= ticket.validUntilUtc
      || (eligibility.validUntilUtc !== null && eligibility.validUntilUtc > ticket.validUntilUtc)
      || (eligibility.paidEligible ? eligibility.paidThroughUtc === null
        || premiumUtc(eligibility.paidThroughUtc) <= eligibility.observedAtUtc : eligibility.paidThroughUtc !== null)) throw new PlatformPremiumError("invalid");
    if (eligibility.authorityKey !== eligibility.scope.authorityKey || (eligibility.paidEligible
      && (eligibility.validUntilUtc === null || premiumUtc(eligibility.validUntilUtc) <= eligibility.observedAtUtc))) {
      throw new PlatformPremiumError("invalid");
    }
    const keys = new Set<string>();
    for (const intent of intents) {
      validateTarget(intent.target); premiumScope(intent.scope); premiumUtc(intent.atUtc); premiumRef(intent.reason);
      premiumInteger(intent.authorityRevision);
      if (intent.managedAssignmentRef !== null) premiumRef(intent.managedAssignmentRef);
      if (intent.target.discordUserId !== intent.scope.discordUserId
        && (intent.desired !== "absent" || intent.managedAssignmentRef === null)) throw new PlatformPremiumError("invalid");
      if (!samePremiumTicket(premiumTicket(intent.ticket), ticket)
        || (intent.validUntilUtc !== null && intent.validUntilUtc > ticket.validUntilUtc)) throw new PlatformPremiumError("invalid");
      if (!["present", "absent", "hold"].includes(intent.desired)
        || intent.target.authorityKey !== eligibility.authorityKey || intent.scope.authorityKey !== eligibility.authorityKey
        || intent.target.guildId !== eligibility.scope.guildId || intent.authorityRevision !== eligibility.authorityRevision
        || !samePremiumScope(intent.scope, eligibility.scope)
        || intent.atUtc !== eligibility.observedAtUtc || (intent.desired !== "hold"
          && (intent.validUntilUtc === null || premiumUtc(intent.validUntilUtc) <= intent.atUtc))) throw new PlatformPremiumError("invalid");
      const key = `${intent.target.guildId}:${intent.target.discordUserId}:${intent.target.roleId}`;
      if (keys.has(key)) throw new PlatformPremiumError("invalid"); keys.add(key);
    }
    return this.store.transaction(tx => {
      if (!this.current(ticket)) return false;
      // Preflight every target before changing any. A different principal's
      // outstanding/unknown write cannot be overwritten during a relink.
      for (const intent of intents) {
        const old = tx.findTarget(intent.target);
        if (intent.managedAssignmentRef !== null && (!old?.managedAssignment
          || old.managedAssignment.assignmentRef !== intent.managedAssignmentRef
          || old.intent.target.authorityKey !== intent.target.authorityKey)) return false;
        if (old && old.intent.target.authorityKey === intent.target.authorityKey
          && (old.intent.authorityRevision > intent.authorityRevision
            || (old.intent.authorityRevision === intent.authorityRevision && old.intent.atUtc > intent.atUtc))) return false;
        if (old && old.intent.target.authorityKey !== intent.target.authorityKey
          && (old.state !== "confirmed" || old.actualPresent !== false || old.lease !== null)) return false;
      }
      for (const input of intents) {
        const intent = Object.freeze({ ...input, ticket: premiumTicket(input.ticket), target: Object.freeze({ ...input.target }), scope: premiumScope(input.scope) });
        const old = tx.findTarget(intent.target);
        if (old && old.intent.authorityRevision === intent.authorityRevision && old.intent.atUtc === intent.atUtc
          && samePremiumRoleTarget(old.intent.target, intent.target)) {
          if (old.intent.desired !== intent.desired || old.intent.validUntilUtc !== intent.validUntilUtc
            || !samePremiumScope(old.intent.scope, intent.scope) || !samePremiumTicket(old.intent.ticket, intent.ticket)
            || old.intent.managedAssignmentRef !== intent.managedAssignmentRef || old.intent.reason !== intent.reason) throw new PlatformPremiumError("conflict");
          continue;
        }
        const inFlight = old?.state === "applying" || old?.state === "uncertain";
        const sameDesired = Boolean(old && old.intent.desired === intent.desired && samePremiumRoleTarget(old.intent.target, intent.target));
        const permissionHold = Boolean(old && old.state === "held" && ["permission", "rate_limit_unqualified"].includes(old.error ?? "")
          && old.intent.scope.policyGeneration === intent.scope.policyGeneration);
        const samePrincipal = old?.intent.target.authorityKey === intent.target.authorityKey;
        const next: PlatformPremiumRoleJob = { intent, version: premiumInteger((old?.version ?? 0) + 1),
          state: inFlight ? old!.state : intent.desired === "hold" || permissionHold ? "held" : sameDesired && old?.state === "retry" ? "retry" : "pending",
          actualPresent: old?.actualPresent ?? null, managedAssignment: samePrincipal ? old?.managedAssignment ?? null : null,
          lastOutcome: samePrincipal ? old?.lastOutcome ?? null : null,
          attempts: inFlight || sameDesired ? old!.attempts : 0,
          nextAttemptAtUtc: sameDesired && old!.nextAttemptAtUtc > intent.atUtc ? old!.nextAttemptAtUtc : intent.atUtc,
          lease: inFlight ? old!.lease : null, error: inFlight || permissionHold ? old!.error : null };
        tx.put(Object.freeze(next));
      }
      tx.appendEligibility(Object.freeze({ ...eligibility, ticket, scope: premiumScope(eligibility.scope) }));
      return true;
    });
  }

  nextDueAuthority(nowUtc: string): string | null {
    const at = premiumUtc(nowUtc);
    return this.store.transaction(tx => {
      const cooldown = tx.cooldownUntilUtc(); if (cooldown !== null && premiumUtc(cooldown) > at) return null;
      return tx.due(at, 20).find(job => job.state === "applying"
        || (job.state === "confirmed" && job.intent.desired === "present" && job.intent.validUntilUtc !== null && job.intent.validUntilUtc <= at)
        || (["pending", "retry"].includes(job.state)
        && job.attempts < 8 && job.nextAttemptAtUtc <= at))?.intent.target.authorityKey ?? null;
    });
  }

  claim(nowUtc: string, token: string, onlyAuthorityKey: string): PlatformPremiumRoleClaim | null {
    const at = premiumUtc(nowUtc); premiumRef(token);
    premiumRef(onlyAuthorityKey);
    return this.store.transaction(tx => {
      const cooldown = tx.cooldownUntilUtc(); if (cooldown !== null && premiumUtc(cooldown) > at) return null;
      for (const job of tx.due(at, 20)) {
        if (job.intent.target.authorityKey !== onlyAuthorityKey) continue;
        if (job.state === "applying" && job.lease && job.lease.untilUtc <= at) {
          tx.put({ ...job, state: "uncertain", error: "unknown_outcome" }); continue;
        }
        if (!["pending", "retry"].includes(job.state) || job.nextAttemptAtUtc > at || job.attempts >= 8 || job.intent.desired === "hold") continue;
        if (!job.intent.validUntilUtc || job.intent.validUntilUtc <= at || !this.current(job.intent.ticket)) {
          // Freshness expiry is not proof of nonpayment; schedule authority refresh externally.
          tx.put({ ...job, state: "held", error: "authority_changed" }); continue;
        }
        const lease = Object.freeze({ token, untilUtc: new Date(Date.parse(at) + 60_000).toISOString(),
          version: job.version, present: job.intent.desired === "present", intent: job.intent });
        const applying: PlatformPremiumRoleJob = Object.freeze({ ...job, state: "applying", lease, attempts: job.attempts + 1 });
        tx.put(applying); return Object.freeze({ job: applying, token });
      }
      return null;
    });
  }

  /** Rechecked synchronously after native reads and immediately before external I/O. */
  canApply(claim: PlatformPremiumRoleClaim, nowUtc: string): boolean {
    const at = premiumUtc(nowUtc);
    return this.store.transaction(tx => {
      const job = tx.findTarget(claim.job.intent.target);
      return Boolean(job && job.state === "applying" && job.lease?.token === claim.token
        && job.lease.untilUtc > at && job.lease.version === claim.job.version
        && job.version === claim.job.version && job.intent.validUntilUtc
        && sameIntent(job.lease.intent, claim.job.intent)
        && sameIntent(job.intent, job.lease.intent)
        && job.intent.validUntilUtc > at && this.current(job.lease.intent.ticket));
    });
  }

  finish(claim: PlatformPremiumRoleClaim, received: PlatformPremiumRoleOutcome, nowUtc: string): void {
    const at = premiumUtc(nowUtc);
    this.store.transaction(tx => {
      const job = tx.findTarget(claim.job.intent.target);
      if (!job || job.lease?.token !== claim.token || !["applying", "uncertain"].includes(job.state)
        || job.lease.version !== claim.job.lease?.version || !sameIntent(job.lease.intent, claim.job.intent)) return;
      let outcome = received;
      if (outcome.kind === "confirmed" && (!samePremiumRoleTarget(outcome.target, claim.job.intent.target)
        || outcome.present !== claim.job.lease!.present)) outcome = { kind: "uncertain" };
      const lastOutcome = Object.freeze({ token: claim.token, intent: job.lease.intent, kind: outcome.kind,
        actualPresent: outcome.kind === "confirmed" ? outcome.present : null, receivedAtUtc: at });
      if (outcome.kind === "uncertain") {
        tx.put({ ...job, lastOutcome, state: "uncertain", error: "unknown_outcome" }); return;
      }
      const newer = job.version !== claim.job.version;
      if (outcome.kind === "confirmed") {
        const matches = job.intent.desired !== "hold" && outcome.present === (job.intent.desired === "present");
        const current = job.intent.validUntilUtc !== null && job.intent.validUntilUtc > at
          && this.current(job.intent.ticket);
        tx.put({ ...job, lastOutcome, state: matches && current ? "confirmed" : job.intent.desired === "hold" || !current ? "held" : "pending",
          actualPresent: outcome.present,
          managedAssignment: outcome.present ? Object.freeze({ assignmentRef: claim.token, confirmedAtUtc: at,
            ticket: job.lease.intent.ticket }) : job.managedAssignment,
          lease: null, attempts: newer ? 0 : job.attempts,
          nextAttemptAtUtc: at, error: current ? null : "authority_changed" }); return;
      }
      if (outcome.kind === "rejected") {
        tx.put({ ...job, lastOutcome, state: "held", lease: null, error: outcome.reason }); return;
      }
      if (outcome.kind === "not_written") {
        tx.put({ ...job, lastOutcome, state: "held", lease: null, error: "authority_changed" }); return;
      }
      const delay = premiumInteger(outcome.delayMs, 1, 86_400_000);
      const next = new Date(Date.parse(at) + delay).toISOString();
      if (outcome.reason === "rate_limited") tx.extendCooldown(next);
      tx.put({ ...job, lastOutcome, state: "retry", lease: null, error: outcome.reason, nextAttemptAtUtc: next });
    });
  }
  // Uncertain outcomes are deliberately not reclaimed. A recovery adapter must
  // establish writer quiescence and native readback before releasing any lease.
}

export const PLATFORM_PREMIUM_DISCOVERY_SOURCES = Object.freeze([
  "discord_paid_role", "paid_purchases", "owner_grants", "retired_subjects",
] as const);
export type PlatformPremiumDiscoverySource = typeof PLATFORM_PREMIUM_DISCOVERY_SOURCES[number];
export type PlatformPremiumDiscoveryCandidate = Readonly<{ kind: "principal"; authorityKey: string }>
  | Readonly<{ kind: "unresolved_role_holder"; discordUserId: string }>;
export type PlatformPremiumDiscoveryPage = Readonly<{
  source: PlatformPremiumDiscoverySource;
  cursor: string | null;
  nextCursor: string | null;
  exhausted: boolean;
  scannedCount: number;
  candidates: readonly PlatformPremiumDiscoveryCandidate[];
}>;
export type PlatformPremiumDiscoveryEpoch = Readonly<{
  epochRef: string;
  guildId: string;
  paidRoleId: string;
  startedAtUtc: string;
  deadlineUtc: string;
  nextAttemptAtUtc: string;
  state: "active" | "traversed" | "held";
  sourceIndex: number;
  cursor: string | null;
  seenCursors: readonly string[];
  pages: number;
  attempts: number;
  scannedCount: number;
  version: number;
  lease: Readonly<{ token: string; untilUtc: string }> | null;
  reason: "budget" | "source_unavailable" | "source_invalid" | null;
}>;
export interface PlatformPremiumDiscoveryTransaction {
  /** Unique current epoch per guild/paid role; old epochs are retained as receipts. */
  current(guildId: string, paidRoleId: string): PlatformPremiumDiscoveryEpoch | null;
  find(epochRef: string): PlatformPremiumDiscoveryEpoch | null;
  put(epoch: PlatformPremiumDiscoveryEpoch): void;
  cooldownUntilUtc(guildId: string, paidRoleId: string): string | null;
  /** Monotonic maximum, survives epoch replacement/restart. Actual transport
   * must also coordinate provider/global limits with other feature readers. */
  extendCooldown(guildId: string, paidRoleId: string, untilUtc: string): void;
  /** Unique by epoch/principal. Queue an authority refresh, NOT a role mutation. */
  enqueueCandidate(epochRef: string, authorityKey: string, observedAtUtc: string): void;
  /** Unique by guild/Discord subject; retain manual/unknown provenance for owner review.
   * No Whop identity, nonpayment, free grant or deletion is inferred. */
  recordUnresolvedHolder(input: Readonly<{ epochRef: string; guildId: string; discordUserId: string; observedAtUtc: string }>): void;
}
export interface PlatformPremiumDiscoveryStore {
  /** Same durable single-writer/erasure/retention obligations as the role store.
   * No concrete schema or in-memory fallback is provided. */
  transaction<T>(operation: (tx: PlatformPremiumDiscoveryTransaction) => T): T;
}
export type PlatformPremiumDiscoveryClaim = Readonly<{
  epoch: PlatformPremiumDiscoveryEpoch;
  source: PlatformPremiumDiscoverySource;
  token: string;
  maximum: number;
}>;
function discoveryCursor(value: string | null): string | null {
  if (value !== null && (typeof value !== "string" || !value || value.length > 1024
    || /[\u0000-\u001f\u007f]/u.test(value))) throw new PlatformPremiumError("invalid");
  return value;
}

/** Read-page leases are safe to reissue after expiry because sources are GET-only.
 * A late page cannot commit after another worker owns its cursor. Traversed means
 * all four sources reached an end, NOT an atomic census or proof of nonpayment. */
export class PlatformPremiumDiscoveryRepository {
  private readonly limits: Readonly<{ pageSize: number; pages: number; scanned: number; lifetimeMs: number }>;
  constructor(private readonly store: PlatformPremiumDiscoveryStore,
    limits: Readonly<{ pageSize: number; pages: number; scanned: number; lifetimeMs: number }>) {
    this.limits = Object.freeze({ pageSize: premiumInteger(limits.pageSize, 1, 1000),
      pages: premiumInteger(limits.pages, 4, 1000), scanned: premiumInteger(limits.scanned, 1, 1_000_000),
      lifetimeMs: premiumInteger(limits.lifetimeMs, 1000, 3_600_000) });
  }
  start(input: Readonly<{ epochRef: string; guildId: string; paidRoleId: string; nowUtc: string }>): PlatformPremiumDiscoveryEpoch {
    premiumRef(input.epochRef); premiumSnowflake(input.guildId); premiumSnowflake(input.paidRoleId);
    if (input.guildId === input.paidRoleId) throw new PlatformPremiumError("invalid");
    const at = premiumUtc(input.nowUtc);
    return this.store.transaction(tx => {
      const old = tx.current(input.guildId, input.paidRoleId);
      if (old?.state === "active" && old.deadlineUtc > at) return old;
      if (tx.find(input.epochRef)) throw new PlatformPremiumError("conflict");
      if (old?.state === "active") tx.put({ ...old, state: "held", reason: "budget", lease: null, version: old.version + 1 });
      const epoch: PlatformPremiumDiscoveryEpoch = Object.freeze({ epochRef: input.epochRef, guildId: input.guildId,
        paidRoleId: input.paidRoleId, startedAtUtc: at, deadlineUtc: new Date(Date.parse(at) + this.limits.lifetimeMs).toISOString(),
        nextAttemptAtUtc: at, state: "active", sourceIndex: 0, cursor: null, seenCursors: Object.freeze([]),
        pages: 0, attempts: 0, scannedCount: 0, version: 1, lease: null, reason: null });
      tx.put(epoch); return epoch;
    });
  }
  claim(epochRef: string, nowUtc: string, token: string): PlatformPremiumDiscoveryClaim | null {
    premiumRef(epochRef); premiumRef(token); const at = premiumUtc(nowUtc);
    return this.store.transaction(tx => {
      const epoch = tx.find(epochRef);
      if (!epoch || epoch.state !== "active" || epoch.nextAttemptAtUtc > at || (epoch.lease && epoch.lease.untilUtc > at)) return null;
      const cooldown = tx.cooldownUntilUtc(epoch.guildId, epoch.paidRoleId);
      if (cooldown !== null && premiumUtc(cooldown) > at) return null;
      if (epoch.startedAtUtc > at) return null;
      if (epoch.deadlineUtc <= at || epoch.pages >= this.limits.pages || epoch.attempts >= this.limits.pages * 3
        || epoch.scannedCount >= this.limits.scanned) {
        tx.put({ ...epoch, state: "held", reason: "budget", lease: null, version: epoch.version + 1 }); return null;
      }
      const source = PLATFORM_PREMIUM_DISCOVERY_SOURCES[epoch.sourceIndex];
      if (!source) throw new PlatformPremiumError("invalid");
      const claimed: PlatformPremiumDiscoveryEpoch = Object.freeze({ ...epoch, version: epoch.version + 1, attempts: epoch.attempts + 1,
        lease: Object.freeze({ token, untilUtc: [epoch.deadlineUtc, new Date(Date.parse(at) + 60_000).toISOString()].sort()[0]! }) });
      tx.put(claimed);
      return Object.freeze({ epoch: claimed, source, token, maximum: Math.min(this.limits.pageSize, this.limits.scanned - epoch.scannedCount) });
    });
  }
  finish(claim: PlatformPremiumDiscoveryClaim, page: PlatformPremiumDiscoveryPage, nowUtc: string): boolean {
    const at = premiumUtc(nowUtc);
    discoveryCursor(page.nextCursor);
    if (page.source !== claim.source || discoveryCursor(page.cursor) !== claim.epoch.cursor
      || typeof page.exhausted !== "boolean" || !Array.isArray(page.candidates) || page.candidates.length > claim.maximum
      || premiumInteger(page.scannedCount, 0, claim.maximum) < page.candidates.length
      || (page.exhausted ? page.nextCursor !== null : page.nextCursor === null
        || page.nextCursor === page.cursor || claim.epoch.seenCursors.includes(page.nextCursor))) throw new PlatformPremiumError("invalid");
    const candidates: PlatformPremiumDiscoveryCandidate[] = [];
    const seen = new Set<string>();
    for (const candidate of page.candidates) {
      let key: string;
      if (candidate.kind === "principal") key = `p:${premiumRef(candidate.authorityKey)}`;
      else if (candidate.kind === "unresolved_role_holder" && claim.source === "discord_paid_role") key = `d:${premiumSnowflake(candidate.discordUserId)}`;
      else throw new PlatformPremiumError("invalid");
      if (!seen.has(key)) { seen.add(key); candidates.push(Object.freeze({ ...candidate })); }
    }
    return this.store.transaction(tx => {
      const epoch = tx.find(claim.epoch.epochRef);
      if (!epoch || epoch.state !== "active" || epoch.version !== claim.epoch.version
        || epoch.lease?.token !== claim.token || epoch.lease.untilUtc <= at || epoch.deadlineUtc <= at || epoch.startedAtUtc > at) return false;
      for (const candidate of candidates) {
        if (candidate.kind === "principal") tx.enqueueCandidate(epoch.epochRef, candidate.authorityKey, at);
        else tx.recordUnresolvedHolder({ epochRef: epoch.epochRef, guildId: epoch.guildId,
          discordUserId: candidate.discordUserId, observedAtUtc: at });
      }
      const sourceIndex = epoch.sourceIndex + (page.exhausted ? 1 : 0);
      const done = sourceIndex === PLATFORM_PREMIUM_DISCOVERY_SOURCES.length;
      tx.put(Object.freeze({ ...epoch, sourceIndex, cursor: page.nextCursor, version: epoch.version + 1,
        seenCursors: Object.freeze(page.exhausted ? [] : [...epoch.seenCursors, page.nextCursor!]),
        pages: epoch.pages + 1, scannedCount: epoch.scannedCount + page.scannedCount,
        state: done ? "traversed" : "active", lease: null, reason: null, nextAttemptAtUtc: at }));
      return true;
    });
  }
  fail(claim: PlatformPremiumDiscoveryClaim, nowUtc: string, reason: "source_unavailable" | "source_invalid",
    retryAfterMs: number | null): void {
    const at = premiumUtc(nowUtc);
    if (retryAfterMs !== null) premiumInteger(retryAfterMs, 1, 86_400_000);
    this.store.transaction(tx => {
      const retryAt = retryAfterMs === null ? null : new Date(Date.parse(at) + retryAfterMs).toISOString();
      // A stale read can still observe a genuine provider limit. Preserve that
      // cooldown without permitting it to advance a newer cursor/lease.
      if (retryAt !== null) tx.extendCooldown(claim.epoch.guildId, claim.epoch.paidRoleId, retryAt);
      const epoch = tx.find(claim.epoch.epochRef);
      if (!epoch || epoch.state !== "active" || epoch.version !== claim.epoch.version || epoch.lease?.token !== claim.token) return;
      tx.put({ ...epoch, version: epoch.version + 1, lease: null, reason,
        state: retryAfterMs === null || epoch.deadlineUtc <= at ? "held" : "active",
        nextAttemptAtUtc: retryAt ?? at });
    });
  }
}

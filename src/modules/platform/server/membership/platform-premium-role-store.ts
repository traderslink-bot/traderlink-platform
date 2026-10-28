import type Database from "better-sqlite3";
import { PlatformPremiumError, premiumInteger, premiumRef, premiumScope, premiumSnowflake, premiumUtc,
  premiumTicket, samePremiumScope, type PlatformPremiumTicket, type PlatformPremiumScope } from "../../contracts/platform-premium-access";
import { PLATFORM_PREMIUM_DISCOVERY_SOURCES, type PlatformPremiumDiscoveryEpoch,
  type PlatformPremiumDiscoveryStore, type PlatformPremiumDiscoveryTransaction, type PlatformPremiumEligibilityEvent,
  samePremiumRoleTarget, type PlatformPremiumRoleIntent, type PlatformPremiumRoleJob, type PlatformPremiumRoleStore, type PlatformPremiumRoleTarget,
  type PlatformPremiumRoleTransaction } from "./platform-premium-role-repository";

type Configuration = Readonly<{ enabled: boolean; guildId: string; paidRoleId: string }>;
type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PlatformPremiumError("invalid");
  return value as RecordValue;
}
function choice<T extends string>(value: unknown, choices: readonly T[]): T {
  if (typeof value !== "string" || !choices.includes(value as T)) throw new PlatformPremiumError("invalid");
  return value as T;
}
function nullableUtc(value: unknown): string | null { return value === null ? null : premiumUtc(value as string); }
function nullableBoolean(value: unknown): boolean | null {
  if (value !== null && typeof value !== "boolean") throw new PlatformPremiumError("invalid");
  return value as boolean | null;
}
function scope(value: unknown): PlatformPremiumScope {
  const r = record(value);
  const s = premiumScope({ authorityKey: r.authorityKey as string, userId: r.userId as string,
    discordUserId: r.discordUserId as string | null, guildId: r.guildId as string,
    identityGeneration: r.identityGeneration as number, entitlementGeneration: r.entitlementGeneration as number,
    erasureGeneration: r.erasureGeneration as number, policyGeneration: r.policyGeneration as number });
  // Do not persist extra adapter/native fields hidden in an otherwise valid scope.
  return Object.freeze({ authorityKey: s.authorityKey, userId: s.userId, discordUserId: s.discordUserId,
    guildId: s.guildId, identityGeneration: s.identityGeneration, entitlementGeneration: s.entitlementGeneration,
    erasureGeneration: s.erasureGeneration, policyGeneration: s.policyGeneration });
}
function encode(value: unknown): string {
  const text = JSON.stringify(value);
  if (typeof text !== "string" || text.length > 262_144) throw new PlatformPremiumError("invalid");
  return text;
}
function decode(value: unknown): unknown {
  if (typeof value !== "string" || value.length > 262_144) throw new PlatformPremiumError("invalid");
  try { return JSON.parse(value) as unknown; } catch { throw new PlatformPremiumError("invalid"); }
}
function target(value: unknown): PlatformPremiumRoleTarget {
  const t = record(value);
  const result = { authorityKey: premiumRef(t.authorityKey as string), guildId: premiumSnowflake(t.guildId as string),
    discordUserId: premiumSnowflake(t.discordUserId as string), roleId: premiumSnowflake(t.roleId as string) };
  if (result.guildId === result.roleId) throw new PlatformPremiumError("invalid");
  return Object.freeze(result);
}
function ticket(value: unknown): PlatformPremiumTicket {
  const r = record(value);
  return premiumTicket({ scope: scope(r.scope), authorityRevision: r.authorityRevision as number,
    whopGeneration: r.whopGeneration as number, admissionRef: r.admissionRef as string, factsSha256: r.factsSha256 as string,
    observedAtUtc: r.observedAtUtc as string, validUntilUtc: r.validUntilUtc as string });
}
function intent(value: unknown): PlatformPremiumRoleIntent {
  const i = record(value); const t = target(i.target); const s = scope(i.scope); const proof = ticket(i.ticket);
  if (t.authorityKey !== s.authorityKey || t.guildId !== s.guildId) throw new PlatformPremiumError("invalid");
  const desired = choice(i.desired, ["present", "absent", "hold"] as const);
  const at = premiumUtc(i.atUtc as string); const until = nullableUtc(i.validUntilUtc);
  const revision = premiumInteger(i.authorityRevision as number);
  const managedAssignmentRef = i.managedAssignmentRef === null ? null : premiumRef(i.managedAssignmentRef as string);
  if (!samePremiumScope(proof.scope, s) || proof.authorityRevision !== revision || at < proof.observedAtUtc || at >= proof.validUntilUtc
    || (t.discordUserId !== s.discordUserId && (desired !== "absent" || managedAssignmentRef === null))
    || (until !== null && until > proof.validUntilUtc)
    || (desired === "hold" ? until !== null : until === null || until <= at)) throw new PlatformPremiumError("invalid");
  return Object.freeze({ ticket: proof, managedAssignmentRef, target: t, scope: s, authorityRevision: revision, desired, validUntilUtc: until,
    atUtc: at, reason: premiumRef(i.reason as string) });
}
function job(value: unknown): PlatformPremiumRoleJob {
  const j = record(value); const i = intent(j.intent);
  const state = choice(j.state, ["pending", "retry", "applying", "uncertain", "confirmed", "held"] as const);
  const version = premiumInteger(j.version as number);
  let lease: PlatformPremiumRoleJob["lease"] = null;
  if (j.lease !== null) {
    const l = record(j.lease);
    if (typeof l.present !== "boolean") throw new PlatformPremiumError("invalid");
    const claimed = intent(l.intent);
    if (!samePremiumRoleTarget(claimed.target, i.target) || claimed.desired === "hold"
      || l.present !== (claimed.desired === "present")) throw new PlatformPremiumError("invalid");
    lease = Object.freeze({ token: premiumRef(l.token as string), untilUtc: premiumUtc(l.untilUtc as string),
      version: premiumInteger(l.version as number, 1, version), present: l.present, intent: claimed });
  }
  if (["applying", "uncertain"].includes(state) !== (lease !== null)) throw new PlatformPremiumError("invalid");
  const actualPresent = nullableBoolean(j.actualPresent);
  if (state === "confirmed" && actualPresent === null) throw new PlatformPremiumError("invalid");
  let managedAssignment: PlatformPremiumRoleJob["managedAssignment"] = null;
  if (j.managedAssignment !== null) {
    const a = record(j.managedAssignment); const proof = ticket(a.ticket);
    if (proof.scope.authorityKey !== i.target.authorityKey || proof.scope.guildId !== i.target.guildId
      || proof.scope.discordUserId !== i.target.discordUserId) throw new PlatformPremiumError("invalid");
    managedAssignment = Object.freeze({ assignmentRef: premiumRef(a.assignmentRef as string),
      confirmedAtUtc: premiumUtc(a.confirmedAtUtc as string), ticket: proof });
  }
  let lastOutcome: PlatformPremiumRoleJob["lastOutcome"] = null;
  if (j.lastOutcome !== null) {
    const o = record(j.lastOutcome); const claimed = intent(o.intent);
    const kind = choice(o.kind, ["confirmed", "retry", "rejected", "not_written", "uncertain"] as const);
    const actual = nullableBoolean(o.actualPresent);
    if (!samePremiumRoleTarget(claimed.target, i.target) || (kind === "confirmed" ? actual === null : actual !== null)) throw new PlatformPremiumError("invalid");
    lastOutcome = Object.freeze({ token: premiumRef(o.token as string), intent: claimed, kind,
      actualPresent: actual, receivedAtUtc: premiumUtc(o.receivedAtUtc as string) });
  }
  return Object.freeze({ intent: i, managedAssignment, lastOutcome,
  version, state, actualPresent, attempts: premiumInteger(j.attempts as number, 0, 8),
  nextAttemptAtUtc: premiumUtc(j.nextAttemptAtUtc as string), lease,
  error: j.error === null ? null : choice(j.error, ["temporary", "rate_limited", "permission", "rate_limit_unqualified", "unknown_outcome", "authority_changed"] as const) });
}
function event(value: unknown): PlatformPremiumEligibilityEvent {
  const e = record(value); const s = scope(e.scope); const at = premiumUtc(e.observedAtUtc as string);
  const until = nullableUtc(e.validUntilUtc); const proof = ticket(e.ticket); const through = nullableUtc(e.paidThroughUtc);
  if (typeof e.paidEligible !== "boolean" || premiumRef(e.authorityKey as string) !== s.authorityKey
    || !samePremiumScope(proof.scope, s) || proof.authorityRevision !== e.authorityRevision
    || at < proof.observedAtUtc || at >= proof.validUntilUtc || (until !== null && until > proof.validUntilUtc)
    || (e.paidEligible ? until === null || until <= at || through === null || through <= at : until !== null || through !== null)) throw new PlatformPremiumError("invalid");
  return Object.freeze({ ticket: proof, authorityKey: s.authorityKey, authorityRevision: premiumInteger(e.authorityRevision as number),
    scope: s, paidEligible: e.paidEligible, paidThroughUtc: through, validUntilUtc: until, observedAtUtc: at });
}
function cursor(value: unknown): string | null {
  if (value !== null && (typeof value !== "string" || !value || value.length > 1024 || /[\u0000-\u001f\u007f]/u.test(value))) {
    throw new PlatformPremiumError("invalid");
  }
  return value as string | null;
}
function epoch(value: unknown): PlatformPremiumDiscoveryEpoch {
  const e = record(value); const state = choice(e.state, ["active", "traversed", "held"] as const);
  const sourceIndex = premiumInteger(e.sourceIndex as number, 0, PLATFORM_PREMIUM_DISCOVERY_SOURCES.length);
  if (state === "traversed" ? sourceIndex !== PLATFORM_PREMIUM_DISCOVERY_SOURCES.length
    : sourceIndex >= PLATFORM_PREMIUM_DISCOVERY_SOURCES.length) throw new PlatformPremiumError("invalid");
  if (!Array.isArray(e.seenCursors) || e.seenCursors.length > 1000) throw new PlatformPremiumError("invalid");
  const seen = e.seenCursors.map(item => { const v = cursor(item); if (v === null) throw new PlatformPremiumError("invalid"); return v; });
  if (new Set(seen).size !== seen.length) throw new PlatformPremiumError("invalid");
  const started = premiumUtc(e.startedAtUtc as string); const deadline = premiumUtc(e.deadlineUtc as string);
  const guildId = premiumSnowflake(e.guildId as string); const paidRoleId = premiumSnowflake(e.paidRoleId as string);
  if (deadline <= started || guildId === paidRoleId) throw new PlatformPremiumError("invalid");
  let lease: PlatformPremiumDiscoveryEpoch["lease"] = null;
  if (e.lease !== null) {
    const l = record(e.lease); lease = Object.freeze({ token: premiumRef(l.token as string), untilUtc: premiumUtc(l.untilUtc as string) });
    if (lease.untilUtc > deadline || state !== "active") throw new PlatformPremiumError("invalid");
  }
  return Object.freeze({ epochRef: premiumRef(e.epochRef as string), guildId, paidRoleId, state, sourceIndex,
    startedAtUtc: started, deadlineUtc: deadline, nextAttemptAtUtc: premiumUtc(e.nextAttemptAtUtc as string),
    cursor: cursor(e.cursor), seenCursors: Object.freeze(seen), pages: premiumInteger(e.pages as number, 0, 1000),
    attempts: premiumInteger(e.attempts as number, 0, 3000), scannedCount: premiumInteger(e.scannedCount as number, 0, 1_000_000),
    version: premiumInteger(e.version as number), lease,
    reason: e.reason === null ? null : choice(e.reason, ["budget", "source_unavailable", "source_invalid"] as const) });
}

/** Inject an already authorised DB connection. Constructors do not query, open,
 * migrate, allocate keys, read environment or enable workers. Methods are dormant
 * until explicitly enabled by a later qualified runtime. Raw SQL errors are private. */
class SqlitePremiumBase {
  protected readonly config: Configuration;
  constructor(protected readonly db: Database.Database, configuration: Configuration) {
    premiumSnowflake(configuration.guildId); premiumSnowflake(configuration.paidRoleId);
    if (configuration.guildId === configuration.paidRoleId) throw new PlatformPremiumError("invalid");
    this.config = Object.freeze({ ...configuration });
  }
  protected inTransaction<T>(operation: (guard: () => void) => T): T {
    if (this.config.enabled !== true) throw new PlatformPremiumError("unbound");
    try {
      return this.db.transaction(() => {
        let active = true;
        const guard = () => { if (!active || !this.db.inTransaction) throw new PlatformPremiumError("conflict"); };
        try {
          const result = operation(guard);
          if (result !== null && (typeof result === "object" || typeof result === "function")
            && typeof (result as { then?: unknown }).then === "function") throw new PlatformPremiumError("invalid");
          return result;
        } finally { active = false; }
      }).immediate();
    } catch (error) { throw error instanceof PlatformPremiumError ? error : new PlatformPremiumError("unavailable"); }
  }
  protected assertTarget(t: PlatformPremiumRoleTarget): void {
    if (t.guildId !== this.config.guildId || t.roleId !== this.config.paidRoleId) throw new PlatformPremiumError("invalid");
  }
  protected assertEpoch(e: PlatformPremiumDiscoveryEpoch): void {
    if (e.guildId !== this.config.guildId || e.paidRoleId !== this.config.paidRoleId) throw new PlatformPremiumError("invalid");
  }
  protected inExistingTransaction<T>(operation: () => T): T {
    if (this.config.enabled !== true) throw new PlatformPremiumError("unbound");
    if (!this.db.inTransaction) throw new PlatformPremiumError("conflict");
    try {
      const result = operation();
      if (result !== null && (typeof result === "object" || typeof result === "function")
        && typeof (result as { then?: unknown }).then === "function") throw new PlatformPremiumError("invalid");
      return result;
    } catch (error) { throw error instanceof PlatformPremiumError ? error : new PlatformPremiumError("unavailable"); }
  }
}

export class SqlitePlatformPremiumRoleStore extends SqlitePremiumBase implements PlatformPremiumRoleStore {
  /** Actual own receipts only, read inside the caller's admitted writer. Missing
   * tickets/legacy shapes fail closed; no synthetic generation or review grant.
   * Payload retention is UNQUALIFIED; this is not a cleanup/erasure adapter. */
  readAuthorityHistory(input: PlatformPremiumScope): Readonly<{
    previousPaidThroughUtc: string | null;
    assignments: readonly Readonly<{ discordUserId: string; assignmentRef: string; ticket: PlatformPremiumTicket }>[];
  }> {
    const s = scope(input);
    if (s.guildId !== this.config.guildId) throw new PlatformPremiumError("invalid");
    return this.inExistingTransaction(() => {
      const rows = this.db.prepare(`SELECT job_json FROM platform_premium_role_jobs
        WHERE guild_id=? AND role_id=? AND authority_key=? ORDER BY discord_user_id LIMIT 102`)
        .all(this.config.guildId, this.config.paidRoleId, s.authorityKey) as { job_json: string }[];
      if (rows.length > 101) throw new PlatformPremiumError("unavailable");
      const assignments = rows.flatMap(row => {
        const j = job(decode(row.job_json)); this.assertTarget(j.intent.target);
        if (j.intent.target.authorityKey !== s.authorityKey) throw new PlatformPremiumError("conflict");
        const a = j.managedAssignment;
        return a ? [Object.freeze({ discordUserId: j.intent.target.discordUserId, assignmentRef: a.assignmentRef, ticket: a.ticket })] : [];
      });
      const events = this.db.prepare(`SELECT event_json FROM platform_premium_paid_events
        WHERE guild_id=? AND paid_role_id=? AND authority_key=? AND paid_eligible=1
          AND json_extract(event_json,'$.ticket.scope.identityGeneration')=?
          AND json_extract(event_json,'$.ticket.scope.erasureGeneration')=?
          AND json_extract(event_json,'$.ticket.scope.policyGeneration')=?
        ORDER BY json_extract(event_json,'$.paidThroughUtc') DESC,observed_at_utc DESC LIMIT 1`).all(this.config.guildId, this.config.paidRoleId, s.authorityKey,
        s.identityGeneration, s.erasureGeneration, s.policyGeneration) as { event_json: string }[];
      const through = events.map(row => {
        const e = event(decode(row.event_json));
        if (e.authorityKey !== s.authorityKey || !e.paidEligible) throw new PlatformPremiumError("conflict");
        return e.paidThroughUtc!;
      }).sort().at(-1) ?? null;
      return Object.freeze({ previousPaidThroughUtc: through, assignments: Object.freeze(assignments) });
    });
  }
  transaction<T>(operation: (tx: PlatformPremiumRoleTransaction) => T): T {
    return this.inTransaction(guard => {
      const tx: PlatformPremiumRoleTransaction = Object.freeze({
        findTarget: (input: PlatformPremiumRoleTarget): PlatformPremiumRoleJob | null => {
          guard(); const t = target(input); this.assertTarget(t);
          const row = this.db.prepare(`SELECT job_json FROM platform_premium_role_jobs
            WHERE guild_id=? AND discord_user_id=? AND role_id=?`).get(t.guildId, t.discordUserId, t.roleId) as { job_json: string } | undefined;
          if (!row) return null;
          const value = job(decode(row.job_json)); this.assertTarget(value.intent.target); return value;
        },
        put: (input: PlatformPremiumRoleJob): void => {
          guard(); const j = job(input); const t = j.intent.target; this.assertTarget(t);
          const written = this.db.prepare(`INSERT INTO platform_premium_role_jobs
            (guild_id,discord_user_id,role_id,authority_key,version,state,desired,valid_until_utc,next_attempt_at_utc,
             attempts,lease_token,lease_until_utc,actual_present,job_json)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(guild_id,discord_user_id,role_id) DO UPDATE SET
            authority_key=excluded.authority_key,version=excluded.version,state=excluded.state,desired=excluded.desired,
            valid_until_utc=excluded.valid_until_utc,next_attempt_at_utc=excluded.next_attempt_at_utc,attempts=excluded.attempts,
            lease_token=excluded.lease_token,lease_until_utc=excluded.lease_until_utc,actual_present=excluded.actual_present,job_json=excluded.job_json
            WHERE excluded.version>=platform_premium_role_jobs.version`)
            .run(t.guildId, t.discordUserId, t.roleId, t.authorityKey, j.version, j.state, j.intent.desired,
              j.intent.validUntilUtc, j.nextAttemptAtUtc, j.attempts, j.lease?.token ?? null, j.lease?.untilUtc ?? null,
              j.actualPresent === null ? null : j.actualPresent ? 1 : 0, encode(j));
          if (written.changes !== 1) throw new PlatformPremiumError("conflict");
        },
        due: (now: string, maximum: number): readonly PlatformPremiumRoleJob[] => {
          guard(); const at = premiumUtc(now); premiumInteger(maximum, 1, 1000);
          const rows = this.db.prepare(`SELECT job_json FROM platform_premium_role_jobs WHERE guild_id=? AND role_id=? AND (
            (state IN ('pending','retry') AND next_attempt_at_utc<=? AND attempts<8)
            OR (state='applying' AND lease_until_utc<=?)
            OR (state='confirmed' AND desired='present' AND valid_until_utc<=?))
            ORDER BY CASE desired WHEN 'absent' THEN 0 ELSE 1 END,next_attempt_at_utc,discord_user_id LIMIT ?`)
            .all(this.config.guildId, this.config.paidRoleId, at, at, at, maximum) as { job_json: string }[];
          return Object.freeze(rows.map(row => { const value = job(decode(row.job_json)); this.assertTarget(value.intent.target); return value; }));
        },
        appendEligibility: (input: PlatformPremiumEligibilityEvent): void => {
          guard(); const e = event(input);
          if (e.scope.guildId !== this.config.guildId) throw new PlatformPremiumError("invalid");
          const key = [this.config.guildId, this.config.paidRoleId, e.authorityKey, e.authorityRevision, e.observedAtUtc];
          const previous = this.db.prepare(`SELECT event_json FROM platform_premium_paid_events
            WHERE guild_id=? AND paid_role_id=? AND authority_key=? AND authority_revision=? AND observed_at_utc=?`)
            .get(...key) as { event_json: string } | undefined;
          const text = encode(e);
          if (previous) { if (encode(event(decode(previous.event_json))) !== text) throw new PlatformPremiumError("conflict"); return; }
          this.db.prepare(`INSERT INTO platform_premium_paid_events
            (guild_id,paid_role_id,authority_key,authority_revision,observed_at_utc,paid_eligible,valid_until_utc,event_json)
            VALUES (?,?,?,?,?,?,?,?)`).run(...key, e.paidEligible ? 1 : 0, e.validUntilUtc, text);
        },
        cooldownUntilUtc: (): string | null => {
          guard(); const row = this.db.prepare(`SELECT until_utc FROM platform_premium_role_cooldowns WHERE guild_id=? AND paid_role_id=?`)
            .get(this.config.guildId, this.config.paidRoleId) as { until_utc: string } | undefined;
          return row ? premiumUtc(row.until_utc) : null;
        },
        extendCooldown: (until: string): void => {
          guard(); premiumUtc(until);
          this.db.prepare(`INSERT INTO platform_premium_role_cooldowns VALUES (?,?,?) ON CONFLICT(guild_id,paid_role_id)
            DO UPDATE SET until_utc=MAX(until_utc,excluded.until_utc)`).run(this.config.guildId, this.config.paidRoleId, until);
        },
      });
      return operation(tx);
    });
  }

  /** Local-only paid-event projection. Handler MUST recheck actual current
   * Membership/erasure fences; a stored paidEligible bit is not grant authority.
   * No async/native I/O under this transaction. Deferred events remain pending. */
  projectPaidEvents(nowUtc: string, maximum: number,
    apply: (input: Readonly<{ event: PlatformPremiumEligibilityEvent; expired: boolean }>) => "applied" | "defer"): number {
    const at = premiumUtc(nowUtc); premiumInteger(maximum, 1, 100);
    return this.inTransaction(guard => {
      const rows = this.db.prepare(`SELECT event_json,applied FROM platform_premium_paid_events
        WHERE guild_id=? AND paid_role_id=? AND (applied=0 OR (paid_eligible=1 AND valid_until_utc<=? AND expiry_applied=0))
        ORDER BY observed_at_utc,authority_revision LIMIT ?`).all(this.config.guildId, this.config.paidRoleId, at, maximum) as { event_json: string; applied: number }[];
      let count = 0;
      for (const row of rows) {
        guard(); const e = event(decode(row.event_json));
        if (e.scope.guildId !== this.config.guildId) throw new PlatformPremiumError("invalid");
        const expired = e.paidEligible && e.validUntilUtc !== null && e.validUntilUtc <= at;
        const outcome = apply(Object.freeze({ event: e, expired }));
        if (outcome !== "applied" && outcome !== "defer") throw new PlatformPremiumError("invalid");
        if (outcome === "defer") continue;
        this.db.prepare(`UPDATE platform_premium_paid_events SET applied=1,expiry_applied=?
          WHERE guild_id=? AND paid_role_id=? AND authority_key=? AND authority_revision=? AND observed_at_utc=?`)
          .run(expired ? 1 : 0, this.config.guildId, this.config.paidRoleId, e.authorityKey, e.authorityRevision, e.observedAtUtc);
        count += 1;
      }
      return count;
    });
  }
}

export class SqlitePlatformPremiumDiscoveryStore extends SqlitePremiumBase implements PlatformPremiumDiscoveryStore {
  transaction<T>(operation: (tx: PlatformPremiumDiscoveryTransaction) => T): T {
    return this.inTransaction(guard => {
      const find = (epochRef: string): PlatformPremiumDiscoveryEpoch | null => {
        guard(); premiumRef(epochRef);
        const row = this.db.prepare(`SELECT epoch_json FROM platform_premium_discovery_epochs WHERE epoch_ref=?`)
          .get(epochRef) as { epoch_json: string } | undefined;
        if (!row) return null;
        const value = epoch(decode(row.epoch_json)); this.assertEpoch(value); return value;
      };
      const tx: PlatformPremiumDiscoveryTransaction = Object.freeze({
        find,
        current: (guildId: string, paidRoleId: string): PlatformPremiumDiscoveryEpoch | null => {
          guard(); if (guildId !== this.config.guildId || paidRoleId !== this.config.paidRoleId) throw new PlatformPremiumError("invalid");
          const row = this.db.prepare(`SELECT epoch_ref FROM platform_premium_discovery_current WHERE guild_id=? AND paid_role_id=?`)
            .get(guildId, paidRoleId) as { epoch_ref: string } | undefined;
          if (!row) return null;
          const current = find(row.epoch_ref);
          if (!current) throw new PlatformPremiumError("unavailable");
          return current;
        },
        put: (input: PlatformPremiumDiscoveryEpoch): void => {
          guard(); const e = epoch(input); this.assertEpoch(e); const previous = find(e.epochRef);
          if (previous && e.version < previous.version) throw new PlatformPremiumError("conflict");
          this.db.prepare(`INSERT INTO platform_premium_discovery_epochs (epoch_ref,guild_id,paid_role_id,state,version,epoch_json)
            VALUES (?,?,?,?,?,?) ON CONFLICT(epoch_ref) DO UPDATE SET state=excluded.state,version=excluded.version,epoch_json=excluded.epoch_json`)
            .run(e.epochRef, e.guildId, e.paidRoleId, e.state, e.version, encode(e));
          // Updating an old receipt never repoints the current-epoch cursor.
          if (!previous) this.db.prepare(`INSERT INTO platform_premium_discovery_current VALUES (?,?,?)
            ON CONFLICT(guild_id,paid_role_id) DO UPDATE SET epoch_ref=excluded.epoch_ref`).run(e.guildId, e.paidRoleId, e.epochRef);
        },
        cooldownUntilUtc: (guildId: string, paidRoleId: string): string | null => {
          guard(); if (guildId !== this.config.guildId || paidRoleId !== this.config.paidRoleId) throw new PlatformPremiumError("invalid");
          const row = this.db.prepare(`SELECT until_utc FROM platform_premium_discovery_cooldowns WHERE guild_id=? AND paid_role_id=?`)
            .get(guildId, paidRoleId) as { until_utc: string } | undefined;
          return row ? premiumUtc(row.until_utc) : null;
        },
        extendCooldown: (guildId: string, paidRoleId: string, until: string): void => {
          guard(); premiumUtc(until);
          if (guildId !== this.config.guildId || paidRoleId !== this.config.paidRoleId) throw new PlatformPremiumError("invalid");
          this.db.prepare(`INSERT INTO platform_premium_discovery_cooldowns VALUES (?,?,?) ON CONFLICT(guild_id,paid_role_id)
            DO UPDATE SET until_utc=MAX(until_utc,excluded.until_utc)`).run(guildId, paidRoleId, until);
        },
        enqueueCandidate: (epochRef: string, authorityKey: string, atUtc: string): void => {
          guard(); premiumRef(authorityKey); premiumUtc(atUtc);
          if (!find(epochRef)) throw new PlatformPremiumError("invalid");
          this.db.prepare(`INSERT INTO platform_premium_discovery_candidates
            (epoch_ref,authority_key,observed_at_utc,next_attempt_at_utc) VALUES (?,?,?,?)
            ON CONFLICT(epoch_ref,authority_key) DO NOTHING`).run(epochRef, authorityKey, atUtc, atUtc);
        },
        recordUnresolvedHolder: (input: Readonly<{ epochRef: string; guildId: string; discordUserId: string; observedAtUtc: string }>): void => {
          guard(); premiumSnowflake(input.discordUserId); premiumUtc(input.observedAtUtc);
          const e = find(input.epochRef);
          if (!e || e.guildId !== input.guildId) throw new PlatformPremiumError("invalid");
          this.db.prepare(`INSERT INTO platform_premium_role_review
            (guild_id,paid_role_id,discord_user_id,first_seen_at_utc,last_seen_at_utc,last_epoch_ref) VALUES (?,?,?,?,?,?)
            ON CONFLICT(guild_id,paid_role_id,discord_user_id) DO UPDATE SET
            last_seen_at_utc=MAX(last_seen_at_utc,excluded.last_seen_at_utc),last_epoch_ref=excluded.last_epoch_ref`)
            .run(e.guildId, e.paidRoleId, input.discordUserId, input.observedAtUtc, input.observedAtUtc, e.epochRef);
          // Existing reviewed disposition/resolution is deliberately preserved.
        },
      });
      return operation(tx);
    });
  }

  /** Claims only a fresh-authority evaluation. The consumer must NOT perform an
   * external role write under this lease; that has a separate uncertainty ledger. */
  claimCandidate(nowUtc: string, token: string): PlatformPremiumCandidateClaim | null {
    const at = premiumUtc(nowUtc); premiumRef(token);
    return this.inTransaction(() => {
      this.db.prepare(`UPDATE platform_premium_discovery_candidates SET state='held',lease_token=NULL,lease_until_utc=NULL
        WHERE state='applying' AND attempts>=8 AND lease_until_utc<=?
          AND EXISTS (SELECT 1 FROM platform_premium_discovery_epochs e WHERE e.epoch_ref=platform_premium_discovery_candidates.epoch_ref
            AND e.guild_id=? AND e.paid_role_id=?)`).run(at, this.config.guildId, this.config.paidRoleId);
      const row = this.db.prepare(`SELECT c.epoch_ref,c.authority_key,c.attempts FROM platform_premium_discovery_candidates c
        JOIN platform_premium_discovery_epochs e ON e.epoch_ref=c.epoch_ref
        WHERE e.guild_id=? AND e.paid_role_id=? AND c.attempts<8 AND
          ((c.state='pending' AND c.next_attempt_at_utc<=?) OR (c.state='applying' AND c.lease_until_utc<=?))
        ORDER BY c.observed_at_utc,c.epoch_ref,c.authority_key LIMIT 1`)
        .get(this.config.guildId, this.config.paidRoleId, at, at) as { epoch_ref: string; authority_key: string; attempts: number } | undefined;
      if (!row) return null;
      const until = new Date(Date.parse(at) + 60_000).toISOString();
      const epochRef = premiumRef(row.epoch_ref); const authorityKey = premiumRef(row.authority_key);
      const attempts = premiumInteger(row.attempts, 0, 7) + 1;
      this.db.prepare(`UPDATE platform_premium_discovery_candidates SET state='applying',attempts=?,lease_token=?,lease_until_utc=?
        WHERE epoch_ref=? AND authority_key=?`).run(attempts, token, until, epochRef, authorityKey);
      return Object.freeze({ epochRef, authorityKey, token, untilUtc: until, attempts });
    });
  }
  finishCandidate(claim: PlatformPremiumCandidateClaim, nowUtc: string, outcome: "done" | "held" | "retry", retryAfterMs = 5000): boolean {
    premiumRef(claim.epochRef); premiumRef(claim.authorityKey); premiumRef(claim.token);
    premiumUtc(claim.untilUtc); premiumInteger(claim.attempts, 1, 8);
    choice(outcome, ["done", "held", "retry"] as const); premiumInteger(retryAfterMs, 1, 86_400_000);
    const at = premiumUtc(nowUtc);
    return this.inTransaction(() => {
      const state = outcome === "retry" ? claim.attempts >= 8 ? "held" : "pending" : outcome;
      const next = outcome === "retry" ? new Date(Date.parse(at) + retryAfterMs).toISOString() : at;
      return this.db.prepare(`UPDATE platform_premium_discovery_candidates SET state=?,next_attempt_at_utc=?,lease_token=NULL,lease_until_utc=NULL
        WHERE epoch_ref=? AND authority_key=? AND state='applying' AND lease_token=? AND lease_until_utc>?
          AND attempts=? AND lease_until_utc=?
          AND EXISTS (SELECT 1 FROM platform_premium_discovery_epochs e WHERE e.epoch_ref=platform_premium_discovery_candidates.epoch_ref
            AND e.guild_id=? AND e.paid_role_id=?)`)
        .run(state, next, claim.epochRef, claim.authorityKey, claim.token, at, claim.attempts, claim.untilUtc,
          this.config.guildId, this.config.paidRoleId).changes === 1;
    });
  }
}

export type PlatformPremiumCandidateClaim = Readonly<{
  epochRef: string; authorityKey: string; token: string; untilUtc: string; attempts: number;
}>;
export type PlatformPremiumExternalCleanupCapture = Readonly<{
  receiptRef: string;
  authorityKey: string;
  guildId: string;
  discordUserId: string;
  roleId: string;
  roleKind: "ordinary_paid" | "partner_channel";
  sourceRef: string;
  capturedAtUtc: string;
  fenceRevision: number;
  priorWrite: Readonly<{ token: string; untilUtc: string; present: boolean }> | null;
}>;
function cleanup(value: PlatformPremiumExternalCleanupCapture): PlatformPremiumExternalCleanupCapture {
  const roleKind = choice(value.roleKind, ["ordinary_paid", "partner_channel"] as const);
  let priorWrite: PlatformPremiumExternalCleanupCapture["priorWrite"] = null;
  if (value.priorWrite !== null) {
    const p = value.priorWrite;
    if (typeof p.present !== "boolean") throw new PlatformPremiumError("invalid");
    priorWrite = Object.freeze({ token: premiumRef(p.token), untilUtc: premiumUtc(p.untilUtc), present: p.present });
  }
  const result = { receiptRef: premiumRef(value.receiptRef), authorityKey: premiumRef(value.authorityKey),
    guildId: premiumSnowflake(value.guildId), discordUserId: premiumSnowflake(value.discordUserId),
    roleId: premiumSnowflake(value.roleId), roleKind, sourceRef: premiumRef(value.sourceRef),
    capturedAtUtc: premiumUtc(value.capturedAtUtc), fenceRevision: premiumInteger(value.fenceRevision), priorWrite };
  if (result.guildId === result.roleId) throw new PlatformPremiumError("invalid");
  return Object.freeze(result);
}

/** Minimal local capture only. No executor, inferred quiescence, role removal,
 * current-authority proof or claim of privacy compliance is implemented here.
 * The admitted participant must qualify target ownership/fencing/retention first. */
export class SqlitePlatformPremiumCleanupStore extends SqlitePremiumBase {
  private readonly forbidden: ReadonlySet<string>;
  constructor(db: Database.Database, configuration: Configuration, forbiddenRoleIds: readonly string[]) {
    super(db, configuration);
    if (!Array.isArray(forbiddenRoleIds) || forbiddenRoleIds.length > 250) throw new PlatformPremiumError("invalid");
    forbiddenRoleIds.forEach(premiumSnowflake); this.forbidden = new Set(forbiddenRoleIds);
    if (this.forbidden.has(configuration.paidRoleId)) throw new PlatformPremiumError("invalid");
  }
  capture(input: PlatformPremiumExternalCleanupCapture): "recorded" | "duplicate" {
    const c = cleanup(input);
    if (c.guildId !== this.config.guildId || this.forbidden.has(c.roleId)
      || (c.roleKind === "ordinary_paid" ? c.roleId !== this.config.paidRoleId : c.roleId === this.config.paidRoleId)) {
      throw new PlatformPremiumError("invalid");
    }
    return this.inExistingTransaction(() => {
      const old = this.db.prepare(`SELECT authority_key,role_kind,source_ref,captured_at_utc,fence_revision,
        prior_write_token,prior_write_until_utc,prior_present FROM platform_premium_external_cleanup
        WHERE receipt_ref=? AND guild_id=? AND discord_user_id=? AND role_id=?`)
        .get(c.receiptRef, c.guildId, c.discordUserId, c.roleId) as {
          authority_key: string; role_kind: string; source_ref: string; captured_at_utc: string; fence_revision: number;
          prior_write_token: string | null; prior_write_until_utc: string | null; prior_present: number | null;
        } | undefined;
      if (old) {
        if (old.authority_key !== c.authorityKey || old.role_kind !== c.roleKind || old.source_ref !== c.sourceRef
          || old.captured_at_utc !== c.capturedAtUtc || old.fence_revision !== c.fenceRevision
          || old.prior_write_token !== (c.priorWrite?.token ?? null) || old.prior_write_until_utc !== (c.priorWrite?.untilUtc ?? null)
          || old.prior_present !== (c.priorWrite === null ? null : c.priorWrite.present ? 1 : 0)) throw new PlatformPremiumError("conflict");
        return "duplicate";
      }
      this.db.prepare(`INSERT INTO platform_premium_external_cleanup
        (receipt_ref,authority_key,guild_id,discord_user_id,role_id,role_kind,source_ref,captured_at_utc,fence_revision,
         state,prior_write_token,prior_write_until_utc,prior_present) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(c.receiptRef, c.authorityKey, c.guildId, c.discordUserId, c.roleId, c.roleKind, c.sourceRef, c.capturedAtUtc,
          c.fenceRevision, c.priorWrite ? "blocked_in_flight" : "pending", c.priorWrite?.token ?? null,
          c.priorWrite?.untilUtc ?? null, c.priorWrite === null ? null : c.priorWrite.present ? 1 : 0);
      return "recorded";
    });
  }
}

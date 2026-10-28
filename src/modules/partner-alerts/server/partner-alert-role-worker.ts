import type Database from "better-sqlite3";
import { evaluatePartnerAlertChannelAccess, type PartnerAlertAccessInput } from "../contracts/partner-alert-access-policy";
import { PartnerAlertValidationError, partnerAlertAccessTicket, samePartnerAlertAccessTicket,
  type PartnerAlertAccessTicket } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertInteger, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";

export type PartnerAlertRoleSnapshot = Readonly<{
  ticket: PartnerAlertAccessTicket; authorityRevision: number; linkedDiscordUserId: string | null;
  /** Qualified identity history only. Removal still requires an actual owned role receipt. */
  previousDiscordUserIds: readonly string[]; input: PartnerAlertAccessInput;
}>;
export interface PartnerAlertRoleAuthority {
  refresh(input: Readonly<{ communityId: string; mappingId: string; userId: string }>): Promise<PartnerAlertRoleSnapshot>;
  isCurrent(ticket: PartnerAlertAccessTicket): boolean;
  /** Same real admitted IMMEDIATE writer/connection, synchronous, no native I/O. */
  inCurrentWriter?<T>(operation: () => T): T;
}
export type PartnerAlertRoleWriteOutcome =
  | Readonly<{ kind: "confirmed"; guildId: string; discordUserId: string; roleId: string; present: boolean }>
  | Readonly<{ kind: "retry"; delayMs: number; reason: "rate_limited" | "temporary" }>
  | Readonly<{ kind: "rejected"; reason: "permission_required" | "role_missing" }>
  | Readonly<{ kind: "not_written" }>
  | Readonly<{ kind: "uncertain" }>;
export interface PartnerAlertRoleTransport {
  verifyManagedRole(input: Readonly<{ mappingId: string; guildId: string; roleId: string; adding: boolean }>): Promise<boolean>;
  setRole(input: Readonly<{ guildId: string; discordUserId: string; roleId: string;
    present: boolean; operationId: string;
    /** Native adapter MUST call synchronously after its waits, immediately before PUT/DELETE. */
    stillCurrent: () => boolean }>): Promise<PartnerAlertRoleWriteOutcome>;
}
type Key = { community_id: string; mapping_id: string; user_id: string; discord_user_id: string };
type Row = Key & { desired_present: number; applied_present: number | null; authority_revision: number;
  decision_revision: number; decision_valid_until_utc: string | null; desired_ticket_json: string;
  status: string; attempts: number; next_attempt_at_utc: string; refresh_required: number; last_error_code: string | null;
  lease_token: string | null; lease_until_utc: string | null; in_flight_present: number | null;
  in_flight_revision: number | null; in_flight_intent_json: string | null; managed_assignment_ref: string | null;
  destination_guild_id: string; destination_role_id: string };
type Intent = Readonly<{ ticket: PartnerAlertAccessTicket; communityId: string; mappingId: string; userId: string;
  discordUserId: string; guildId: string; roleId: string; present: boolean; revision: number; validUntilUtc: string;
  managedAssignmentRef: string | null }>;
type Claim = Readonly<{ row: Row; token: string; intent: Intent }>;
type Outcome = PartnerAlertRoleWriteOutcome | Readonly<{ kind: "not_written" }>;
function encode(value: unknown): string {
  const text = JSON.stringify(value);
  if (typeof text !== "string" || text.length > 262144) throw new PartnerAlertValidationError("ticket");
  return text;
}
function parseTicket(text: string): PartnerAlertAccessTicket {
  if (typeof text !== "string" || text.length > 262144) throw new PartnerAlertValidationError("ticket");
  return partnerAlertAccessTicket(JSON.parse(text) as PartnerAlertAccessTicket);
}

/** Dormant explicit-call worker. Full desired/original claim/outcome payloads
 * remain privacy-UNQUALIFIED. No provider, admission, cleanup or runtime binding. */
export class PartnerAlertRoleWorker {
  constructor(private readonly db: Database.Database, private readonly authority: PartnerAlertRoleAuthority,
    private readonly transport: PartnerAlertRoleTransport, private readonly configuration: Readonly<{
      enabled: boolean; nowUtc: () => string; createId: () => string; attention: (mappingId: string, reason: string) => void;
    }>) {}
  private now(): string { return partnerAlertUtc(this.configuration.nowUtc(), "nowUtc"); }
  private notify(mappingId: string, reason: string): void {
    try { this.configuration.attention(mappingId, reason); } catch { /* Durable state is authoritative. */ }
  }
  private write<T>(operation: () => T): T {
    if (!this.authority.inCurrentWriter) throw new PartnerAlertValidationError("admissionUnbound");
    return this.authority.inCurrentWriter(() => {
      // Necessary connection check, NOT proof of admission/immediate mode.
      if (!this.db.inTransaction) throw new PartnerAlertValidationError("writerConnection");
      return this.db.transaction(operation)();
    });
  }
  private key(row: Key): readonly string[] { return [row.mapping_id, row.user_id, row.discord_user_id]; }
  private row(key: Key): Row | undefined {
    return this.db.prepare(`SELECT j.*,m.destination_guild_id,m.destination_role_id FROM partner_alert_role_jobs j
      JOIN partner_alert_mappings m ON m.community_id=j.community_id AND m.mapping_id=j.mapping_id
      WHERE j.mapping_id=? AND j.user_id=? AND j.discord_user_id=?`).get(...this.key(key)) as Row | undefined;
  }
  private current(row: Row): boolean {
    try {
      const t = parseTicket(row.desired_ticket_json); const c = t.context;
      return c.communityId === row.community_id && c.mappingId === row.mapping_id && c.userId === row.user_id
        && c.authorityRevision === row.authority_revision && c.guildId === row.destination_guild_id
        && c.roleId === row.destination_role_id && (!row.desired_present || c.linkedDiscordUserId === row.discord_user_id)
        && this.authority.isCurrent(t) === true;
    } catch { return false; }
  }
  private hold(row: Key, reason: string): void {
    this.db.prepare(`UPDATE partner_alert_role_jobs SET refresh_required=1,
      last_error_code=CASE WHEN last_error_code IN ('permission_required','role_missing') THEN last_error_code ELSE ? END,
      status=CASE WHEN status IN ('applying','uncertain') THEN status ELSE 'held' END
      WHERE mapping_id=? AND user_id=? AND discord_user_id=?`).run(reason, ...this.key(row));
  }
  async refreshUserMapping(input: Readonly<{ communityId: string; mappingId: string; userId: string }>): Promise<boolean> {
    if (this.configuration.enabled !== true || !this.authority.inCurrentWriter) return false;
    partnerAlertId(input.communityId, "communityId"); partnerAlertId(input.mappingId, "mappingId"); partnerAlertId(input.userId, "userId");
    let snapshot: PartnerAlertRoleSnapshot;
    try {
      snapshot = structuredClone(await this.authority.refresh(input));
      const t = partnerAlertAccessTicket(snapshot.ticket); const c = t.context;
      if (c.communityId !== input.communityId || c.mappingId !== input.mappingId || c.userId !== input.userId
        || c.authorityRevision !== snapshot.authorityRevision || c.linkedDiscordUserId !== snapshot.linkedDiscordUserId
        || !samePartnerAlertAccessTicket(t, snapshot.input.ticket)
        || snapshot.input.communityId !== input.communityId || snapshot.input.mappingId !== input.mappingId
        || snapshot.input.userId !== input.userId || !Array.isArray(snapshot.previousDiscordUserIds)
        || snapshot.previousDiscordUserIds.length > 100) throw new PartnerAlertValidationError("snapshot");
      snapshot.previousDiscordUserIds.forEach(id => partnerAlertSnowflake(id, "previousDiscordUserId"));
    } catch {
      try { this.write(() => this.db.prepare(`UPDATE partner_alert_role_jobs SET refresh_required=1,
        last_error_code=CASE WHEN last_error_code IN ('permission_required','role_missing') THEN last_error_code ELSE 'evidence_unavailable' END,
        status=CASE WHEN status IN ('applying','uncertain') THEN status ELSE 'held' END
        WHERE community_id=? AND mapping_id=? AND user_id=?`).run(input.communityId, input.mappingId, input.userId)); }
      catch { /* No authority is not permission to mutate a role. */ }
      this.notify(input.mappingId, "evidence_unavailable"); return false;
    }
    return this.write(() => {
      const at = this.now(); const ticket = partnerAlertAccessTicket(snapshot.ticket); const c = ticket.context;
      if (!this.authority.isCurrent(ticket)) return false;
      const mapping = this.db.prepare(`SELECT destination_guild_id,destination_role_id,ever_approved
        FROM partner_alert_mappings WHERE community_id=? AND mapping_id=?`).get(input.communityId, input.mappingId)
        as { destination_guild_id: string | null; destination_role_id: string | null; ever_approved: number } | undefined;
      if (!mapping?.ever_approved || mapping.destination_guild_id !== c.guildId || mapping.destination_role_id !== c.roleId) return false;
      const rows = this.db.prepare(`SELECT * FROM partner_alert_role_jobs
        WHERE community_id=? AND mapping_id=? AND user_id=? ORDER BY discord_user_id LIMIT 102`)
        .all(input.communityId, input.mappingId, input.userId) as Row[];
      if (rows.length > 101 || rows.some(row => row.authority_revision > c.authorityRevision)) return false;
      let decision: ReturnType<typeof evaluatePartnerAlertChannelAccess>;
      try { decision = evaluatePartnerAlertChannelAccess({ ...snapshot.input, nowUtc: at }); }
      catch { rows.forEach(row => this.hold(row, "invalid_evidence")); return false; }
      const subjects = new Set([...rows.map(r => r.discord_user_id), ...(c.linkedDiscordUserId ? [c.linkedDiscordUserId] : [])]);
      const ticketText = encode(ticket);
      for (const id of subjects) {
        const old = rows.find(r => r.discord_user_id === id); const linked = id === c.linkedDiscordUserId;
        if (linked && decision.desiredRole === "hold") { if (old) this.hold(old, "decision_hold"); continue; }
        if (!linked && (!old?.managed_assignment_ref || !snapshot.previousDiscordUserIds.includes(id))) {
          if (old) this.hold(old, "identity_history_unverified"); continue;
        }
        const desired = linked && decision.allowed && decision.desiredRole === "present" && decision.roleId === c.roleId ? 1 : 0;
        if (!desired && !old?.managed_assignment_ref) { if (old) this.hold(old, "assignment_unverified"); continue; }
        let deadline = [ticket.premium.validUntilUtc, c.validUntilUtc].sort()[0]!;
        if (desired) {
          if (!decision.validUntilUtc || snapshot.input.discord?.discordUserId !== c.linkedDiscordUserId) return false;
          deadline = [deadline, decision.validUntilUtc].sort()[0]!;
        }
        if (deadline <= at) { if (old) this.hold(old, "evidence_expired"); continue; }
        if (!old) {
          this.db.prepare(`INSERT INTO partner_alert_role_jobs
            (community_id,mapping_id,user_id,discord_user_id,desired_present,authority_revision,decision_revision,
             decision_valid_until_utc,desired_ticket_json,refresh_required,status,next_attempt_at_utc)
            VALUES(?,?,?,?,?,?,1,?,?,0,'pending',?)`)
            .run(input.communityId, input.mappingId, input.userId, id, desired, c.authorityRevision, deadline, ticketText, at);
        } else {
          let permanent = false; let changedFacts = false;
          try { permanent = ["permission_required","role_missing"].includes(old.last_error_code ?? "")
            && parseTicket(old.desired_ticket_json).context.policyGeneration === c.policyGeneration;
            const prior = parseTicket(old.desired_ticket_json);
            changedFacts = prior.context.factsSha256 !== c.factsSha256 || prior.premium.factsSha256 !== ticket.premium.factsSha256;
          } catch { permanent = true; }
          this.db.prepare(`UPDATE partner_alert_role_jobs SET desired_present=?,authority_revision=?,decision_revision=decision_revision+1,
            decision_valid_until_utc=?,desired_ticket_json=?,refresh_required=0,next_attempt_at_utc=?,attempts=CASE WHEN ?=1 THEN 0 ELSE attempts END,
            status=CASE WHEN status IN ('applying','uncertain') THEN status WHEN ?=1 THEN 'held' ELSE 'pending' END,
            last_error_code=CASE WHEN ?=1 THEN last_error_code ELSE NULL END
            WHERE mapping_id=? AND user_id=? AND discord_user_id=?`)
            .run(desired, c.authorityRevision, deadline, ticketText, at, changedFacts && !permanent ? 1 : 0,
              permanent ? 1 : 0, permanent ? 1 : 0, ...this.key(old));
        }
      }
      return true;
    });
  }
  private prepareCandidate(): Row | undefined {
    return this.write(() => {
      const at = this.now();
      this.db.prepare(`UPDATE partner_alert_role_jobs SET status='uncertain',last_error_code='outcome_unknown'
        WHERE status='applying' AND lease_until_utc<=?`).run(at);
      const expired = this.db.prepare(`SELECT * FROM partner_alert_role_jobs WHERE status NOT IN ('applying','uncertain')
        AND (decision_valid_until_utc IS NULL OR decision_valid_until_utc<=?) LIMIT 100`).all(at) as Row[];
      expired.forEach(row => this.hold(row, "evidence_expired"));
      if (this.db.prepare(`SELECT 1 FROM partner_alert_role_jobs WHERE rate_limit_until_utc>? LIMIT 1`).get(at)) return undefined;
      return this.db.prepare(`SELECT j.*,m.destination_guild_id,m.destination_role_id FROM partner_alert_role_jobs j
        JOIN partner_alert_mappings m ON m.community_id=j.community_id AND m.mapping_id=j.mapping_id
        WHERE j.status IN ('pending','failed','held') AND j.next_attempt_at_utc<=? AND (j.attempts<8 OR j.refresh_required=1)
          AND (j.refresh_required=1 OR j.last_error_code IS NULL OR j.last_error_code IN ('rate_limited','temporary'))
          AND NOT EXISTS(SELECT 1 FROM partner_alert_role_jobs busy WHERE busy.mapping_id=j.mapping_id
            AND busy.discord_user_id=j.discord_user_id AND busy.status IN ('applying','uncertain'))
        ORDER BY j.desired_present,j.next_attempt_at_utc,j.mapping_id,j.user_id LIMIT 1`).get(at) as Row | undefined;
    });
  }
  private claim(key: Key): Claim | null {
    return this.write(() => {
      const row = this.row(key); const at = this.now();
      if (!row || !["pending","failed"].includes(row.status) || row.attempts >= 8 || row.refresh_required
        || !row.decision_valid_until_utc || row.decision_valid_until_utc <= at || !this.current(row)) {
        if (row) this.hold(row, "authority_changed"); return null;
      }
      if (!row.desired_present && !row.managed_assignment_ref) { this.hold(row, "assignment_unverified"); return null; }
      if (this.db.prepare(`SELECT 1 FROM partner_alert_role_jobs WHERE mapping_id=? AND discord_user_id=?
        AND status IN ('applying','uncertain') LIMIT 1`).get(row.mapping_id, row.discord_user_id)) return null;
      if (row.desired_present && this.db.prepare(`SELECT 1 FROM partner_alert_role_jobs
        WHERE mapping_id=? AND ((user_id=? AND discord_user_id!=?) OR (discord_user_id=? AND user_id!=?))
        AND (desired_present=1 OR status!='applied' OR applied_present IS NOT 0) LIMIT 1`)
        .get(row.mapping_id, row.user_id, row.discord_user_id, row.discord_user_id, row.user_id)) return null;
      const intent: Intent = Object.freeze({ ticket: parseTicket(row.desired_ticket_json), communityId: row.community_id,
        mappingId: row.mapping_id, userId: row.user_id, discordUserId: row.discord_user_id, guildId: row.destination_guild_id,
        roleId: row.destination_role_id, present: Boolean(row.desired_present), revision: row.decision_revision,
        validUntilUtc: row.decision_valid_until_utc, managedAssignmentRef: row.managed_assignment_ref });
      const token = partnerAlertId(this.configuration.createId(), "operationId");
      this.db.prepare(`UPDATE partner_alert_role_jobs SET status='applying',attempts=attempts+1,lease_token=?,lease_until_utc=?,
        in_flight_present=desired_present,in_flight_revision=decision_revision,in_flight_intent_json=?
        WHERE mapping_id=? AND user_id=? AND discord_user_id=?`)
        .run(token, new Date(Date.parse(at)+60000).toISOString(), encode(intent), ...this.key(row));
      return Object.freeze({ row, token, intent });
    });
  }
  async runOnce(): Promise<boolean> {
    if (this.configuration.enabled !== true || !this.authority.inCurrentWriter) return false;
    const candidate = this.prepareCandidate(); if (!candidate) return false;
    if (!await this.refreshUserMapping({ communityId: candidate.community_id, mappingId: candidate.mapping_id, userId: candidate.user_id })) return false;
    const claim = this.claim(candidate); if (!claim) return false;
    const i = claim.intent; let started = false; let result: Outcome;
    try {
      const managed = await this.transport.verifyManagedRole({ mappingId: i.mappingId, guildId: i.guildId, roleId: i.roleId, adding: i.present });
      const current = this.canApply(claim);
      if (!managed) result = { kind: "rejected", reason: "permission_required" };
      else if (!current) result = { kind: "not_written" };
      else {
        started = true;
        result = await this.transport.setRole({ guildId: i.guildId, discordUserId: i.discordUserId,
          roleId: i.roleId, present: i.present, operationId: claim.token, stillCurrent: () => this.canApply(claim) });
      }
    } catch { result = started ? { kind: "uncertain" } : { kind: "retry", delayMs: 5000, reason: "temporary" }; }
    this.finish(claim, result); return true;
  }
  private canApply(claim: Claim): boolean {
    return this.write(() => {
      const latest = this.row(claim.row); const at = this.now(); const i = claim.intent;
      if (this.db.prepare(`SELECT 1 FROM partner_alert_role_jobs WHERE rate_limit_until_utc>? LIMIT 1`).get(at)) return false;
      return Boolean(latest && latest.lease_token === claim.token && latest.status === "applying" && !latest.refresh_required
        && latest.lease_until_utc && latest.lease_until_utc > at && latest.decision_revision === i.revision
        && latest.in_flight_intent_json === encode(i) && latest.desired_ticket_json === encode(i.ticket)
        && i.validUntilUtc > at && this.authority.isCurrent(i.ticket) === true);
    });
  }
  private finish(claim: Claim, received: Outcome): void {
    let attention: string | null = null;
    this.write(() => {
      const row = this.row(claim.row); const at = this.now(); const i = claim.intent;
      if (!row || row.lease_token !== claim.token || !["applying","uncertain"].includes(row.status)
        || row.in_flight_intent_json !== encode(i)) return;
      let result = received;
      if (result.kind === "confirmed" && (result.guildId !== i.guildId || result.roleId !== i.roleId
        || result.discordUserId !== i.discordUserId || result.present !== i.present)) result = { kind: "uncertain" };
      const outcome = encode({ operationId: claim.token, intent: i, result, receivedAtUtc: at });
      if (result.kind === "uncertain") {
        this.db.prepare(`UPDATE partner_alert_role_jobs SET status='uncertain',last_error_code='outcome_unknown',outcome_json=?
          WHERE mapping_id=? AND user_id=? AND discord_user_id=?`).run(outcome,...this.key(row));
        attention = "outcome_unknown"; return;
      }
      const current = !row.refresh_required && this.current(row) && row.decision_valid_until_utc !== null && row.decision_valid_until_utc > at;
      let status = current ? "pending" : "held"; let error: string | null = current ? null : "authority_changed";
      let applied = row.applied_present; let next = at; let managedRef = row.managed_assignment_ref;
      if (result.kind === "confirmed") {
        applied = result.present ? 1 : 0;
        if (result.present) managedRef = claim.token;
        if (current && row.desired_present === applied) status = "applied";
      } else if (result.kind === "retry") {
        const delay = partnerAlertInteger(result.delayMs, "retryDelayMs", 1000, 86400000);
        status = "failed"; error = result.reason; next = new Date(Date.parse(at)+delay).toISOString();
        if (result.reason === "rate_limited") this.db.prepare(`UPDATE partner_alert_role_jobs SET rate_limit_until_utc=
          CASE WHEN rate_limit_until_utc IS NULL OR rate_limit_until_utc<? THEN ? ELSE rate_limit_until_utc END
          WHERE mapping_id=? AND user_id=? AND discord_user_id=?`).run(next,next,...this.key(row));
      } else if (result.kind === "rejected") { status = "held"; error = result.reason; }
      else { status = "held"; error = "authority_changed"; }
      this.db.prepare(`UPDATE partner_alert_role_jobs SET status=?,applied_present=?,managed_assignment_ref=?,outcome_json=?,
        last_error_code=?,next_attempt_at_utc=?,refresh_required=?,lease_token=NULL,lease_until_utc=NULL,
        in_flight_present=NULL,in_flight_revision=NULL,in_flight_intent_json=NULL
        WHERE mapping_id=? AND user_id=? AND discord_user_id=?`)
        .run(status,applied,managedRef,outcome,error,next,current ? 0 : 1,...this.key(row));
    });
    if (attention) this.notify(claim.intent.mappingId, attention);
  }
}

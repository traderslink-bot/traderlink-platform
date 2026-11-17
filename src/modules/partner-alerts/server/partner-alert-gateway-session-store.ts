import type Database from "better-sqlite3";
import { partnerAlertId, partnerAlertInteger, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { validatePartnerAlertGatewayUrl, type PartnerAlertGatewaySession } from "./partner-alert-discord-gateway";

const leaseDurationMs = 45_000;
// A dedicated bot can start at most 720 fresh sessions in a rolling day through
// this receiver, with resumes handled separately. Persist across process exits.
const identifyIntervalMs = 120_000;
type SessionRow = { session_id: string | null; resume_url: string | null; resume_sequence: number | null };

export class PartnerAlertGatewaySessionStore {
  private readonly receiverKey: string;
  private readonly destinationGuildId: string;
  private readonly token: string;

  constructor(private readonly db: Database.Database, input: Readonly<{
    botUserId: string; destinationGuildId: string; leaseToken: string; nowUtc: () => string;
  }>) {
    this.receiverKey = `bot:${partnerAlertSnowflake(input.botUserId, "botUserId")}`;
    this.destinationGuildId = partnerAlertSnowflake(input.destinationGuildId, "destinationGuildId");
    this.token = partnerAlertId(input.leaseToken, "receiverLease");
    this.clock = input.nowUtc;
  }

  private readonly clock: () => string;
  private now(): string { return partnerAlertUtc(this.clock(), "nowUtc"); }

  acquire(): boolean {
    const at = this.now();
    const until = new Date(Date.parse(at) + leaseDurationMs).toISOString();
    return this.db.prepare(`INSERT INTO partner_alert_ingress_sessions
      (receiver_key,destination_guild_id,gap_state,updated_at_utc,lease_token,lease_until_utc)
      VALUES(?,?,'clear',?,?,?)
      ON CONFLICT(receiver_key) DO UPDATE SET lease_token=excluded.lease_token,lease_until_utc=excluded.lease_until_utc,
        updated_at_utc=excluded.updated_at_utc
      WHERE destination_guild_id=excluded.destination_guild_id AND (lease_token IS NULL OR lease_until_utc<=?)`)
      .run(this.receiverKey, this.destinationGuildId, at, this.token, until, at).changes === 1;
  }

  renew(): boolean {
    const at = this.now();
    const until = new Date(Date.parse(at) + leaseDurationMs).toISOString();
    return this.db.prepare(`UPDATE partner_alert_ingress_sessions SET lease_until_utc=?
      WHERE receiver_key=? AND lease_token=? AND lease_until_utc>?`).run(until, this.receiverKey, this.token, at).changes === 1;
  }

  isCurrent(): boolean {
    return Boolean(this.db.prepare(`SELECT 1 FROM partner_alert_ingress_sessions
      WHERE receiver_key=? AND lease_token=? AND lease_until_utc>?`).get(this.receiverKey, this.token, this.now()));
  }

  reserveIdentify(): boolean {
    const at = this.now();
    const until = new Date(Date.parse(at) + identifyIntervalMs).toISOString();
    return this.db.prepare(`UPDATE partner_alert_ingress_sessions SET identify_not_before_utc=?
      WHERE receiver_key=? AND lease_token=? AND lease_until_utc>?
        AND (identify_not_before_utc IS NULL OR identify_not_before_utc<=?)`)
      .run(until, this.receiverKey, this.token, at, at).changes === 1;
  }

  loadSession(): PartnerAlertGatewaySession | null {
    const row = this.db.prepare(`SELECT session_id,resume_url,resume_sequence FROM partner_alert_ingress_sessions
      WHERE receiver_key=? AND lease_token=? AND lease_until_utc>?`)
      .get(this.receiverKey, this.token, this.now()) as SessionRow | undefined;
    if (!row) throw new Error("Discord receiver lease ended.");
    if (row.session_id === null || row.resume_url === null || row.resume_sequence === null) return null;
    return { sessionId: row.session_id, resumeUrl: row.resume_url, sequence: row.resume_sequence };
  }

  saveSession(session: PartnerAlertGatewaySession): void {
    const at = this.now();
    const url = validatePartnerAlertGatewayUrl(session.resumeUrl);
    const sequence = partnerAlertInteger(session.sequence, "sequence");
    if (!/^[A-Za-z0-9_-]{1,256}$/u.test(session.sessionId)) throw new Error("Invalid Discord receiver session.");
    const saved = this.db.prepare(`UPDATE partner_alert_ingress_sessions SET session_id=?,resume_url=?,resume_sequence=?,updated_at_utc=?
      WHERE receiver_key=? AND lease_token=? AND lease_until_utc>?
        AND (session_id IS NOT ? OR resume_sequence IS NULL OR resume_sequence<=?)`)
      .run(session.sessionId, url, sequence, at, this.receiverKey, this.token, at, session.sessionId, sequence);
    if (saved.changes !== 1) throw new Error("Discord receiver session changed.");
  }

  clearSession(): void {
    const at = this.now();
    const cleared = this.db.prepare(`UPDATE partner_alert_ingress_sessions
      SET session_id=NULL,resume_url=NULL,resume_sequence=NULL,gap_state='detected',updated_at_utc=?
      WHERE receiver_key=? AND lease_token=? AND lease_until_utc>?`).run(at, this.receiverKey, this.token, at);
    if (cleared.changes !== 1) throw new Error("Discord receiver lease ended.");
  }

  markGap(): void {
    const at = this.now();
    const marked = this.db.prepare(`UPDATE partner_alert_ingress_sessions SET gap_state='detected',updated_at_utc=?
      WHERE receiver_key=? AND lease_token=? AND lease_until_utc>?`).run(at, this.receiverKey, this.token, at);
    if (marked.changes !== 1) throw new Error("Discord receiver lease ended.");
  }

  release(): void {
    this.db.prepare(`UPDATE partner_alert_ingress_sessions SET lease_token=NULL,lease_until_utc=NULL
      WHERE receiver_key=? AND lease_token=?`).run(this.receiverKey, this.token);
  }
}

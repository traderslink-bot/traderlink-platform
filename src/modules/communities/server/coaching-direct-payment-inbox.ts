import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { CoachingWhopEvent } from "./coaching-whop-event";

type Environment = "sandbox" | "live";
export type CoachingPaymentInboxClaim = Readonly<{
  environment: Environment; event: CoachingWhopEvent; token: string; attempts: number;
}>;
function time(value: string): void {
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error("Use canonical UTC event-processing times.");
}

/** Durable minimal event routing, no raw provider payload, API calls or access changes. */
export class CoachingDirectPaymentInbox {
  constructor(private readonly database: Database.Database) {}

  enqueue(environment: Environment, event: CoachingWhopEvent, atUtc: string): "recorded" | "duplicate" {
    time(atUtc);
    if (!["sandbox", "live"].includes(environment) || !/^[a-f0-9]{64}$/.test(event.payloadSha256)) throw new Error("Invalid event environment/evidence digest.");
    return this.database.transaction(() => {
      const previous = this.database.prepare(`SELECT payload_sha256 FROM traderlink_coaching_direct_payment_inbox
        WHERE environment=? AND merchant_account_id=? AND event_id=?`).get(environment, event.merchantAccountId, event.eventId) as { payload_sha256: string } | undefined;
      if (previous) {
        if (previous.payload_sha256 !== event.payloadSha256) throw new Error("Conflicting event payload for existing receipt.");
        return "duplicate" as const;
      }
      this.database.prepare(`INSERT INTO traderlink_coaching_direct_payment_inbox
        (environment,merchant_account_id,event_id,payload_sha256,routing_json,received_at_utc,available_at_utc,status)
        VALUES(?,?,?,?,?,?,?,'pending')`).run(environment, event.merchantAccountId, event.eventId,
        event.payloadSha256, JSON.stringify(event), atUtc, atUtc);
      return "recorded" as const;
    }).immediate();
  }

  claimNext(environment: Environment, atUtc: string, leaseUntilUtc: string): CoachingPaymentInboxClaim | null {
    time(atUtc); time(leaseUntilUtc);
    if (leaseUntilUtc <= atUtc) throw new Error("Event-processing lease must end in the future.");
    return this.database.transaction(() => {
      // One financial hydrator per environment avoids racing older authoritative
      // reads against later refund/dispute observations. Lease expiry is recoverable.
      if(this.database.prepare("SELECT 1 FROM traderlink_coaching_direct_payment_inbox WHERE environment=? AND status='processing' AND lease_until_utc>? LIMIT 1").get(environment,atUtc))return null;
      const row = this.database.prepare(`SELECT merchant_account_id,event_id,routing_json,attempts FROM traderlink_coaching_direct_payment_inbox
        WHERE environment=? AND ((status IN ('pending','failed') AND available_at_utc<=?) OR (status='processing' AND lease_until_utc<=?))
        ORDER BY available_at_utc,received_at_utc,event_id LIMIT 1`).get(environment, atUtc, atUtc) as { merchant_account_id: string; event_id: string; routing_json: string; attempts: number } | undefined;
      if (!row) return null;
      const token = randomUUID();
      this.database.prepare(`UPDATE traderlink_coaching_direct_payment_inbox SET status='processing',attempts=attempts+1,
        lease_token=?,lease_until_utc=?,last_error_code=NULL WHERE environment=? AND merchant_account_id=? AND event_id=?`)
        .run(token, leaseUntilUtc, environment, row.merchant_account_id, row.event_id);
      return Object.freeze({ environment, event: Object.freeze(JSON.parse(row.routing_json)), token, attempts: row.attempts + 1 });
    }).immediate();
  }

  complete(claim: CoachingPaymentInboxClaim): void {
    const changed = this.database.prepare(`UPDATE traderlink_coaching_direct_payment_inbox SET status='completed',lease_token=NULL,lease_until_utc=NULL
      WHERE environment=? AND merchant_account_id=? AND event_id=? AND status='processing' AND lease_token=?`)
      .run(claim.environment, claim.event.merchantAccountId, claim.event.eventId, claim.token).changes;
    if (changed !== 1) throw new Error("Event-processing lease was replaced; leave current worker's receipt untouched.");
  }

  assertOwned(claim:CoachingPaymentInboxClaim,atUtc:string):void{
    time(atUtc);
    if(!this.database.prepare(`SELECT 1 FROM traderlink_coaching_direct_payment_inbox WHERE environment=? AND merchant_account_id=? AND event_id=? AND status='processing' AND lease_token=? AND lease_until_utc>?`).get(claim.environment,claim.event.merchantAccountId,claim.event.eventId,claim.token,atUtc))throw new Error('Payment event lease expired or was replaced.');
  }

  retry(claim: CoachingPaymentInboxClaim, retryAtUtc: string, reason: "provider_unavailable" | "binding_unavailable" | "reconciliation_required"): void {
    time(retryAtUtc);
    if (!["provider_unavailable", "binding_unavailable", "reconciliation_required"].includes(reason)) throw new Error("Use a private-data-free event failure code.");
    const changed = this.database.prepare(`UPDATE traderlink_coaching_direct_payment_inbox SET status='failed',available_at_utc=?,
      lease_token=NULL,lease_until_utc=NULL,last_error_code=? WHERE environment=? AND merchant_account_id=? AND event_id=? AND status='processing' AND lease_token=?`)
      .run(retryAtUtc, reason, claim.environment, claim.event.merchantAccountId, claim.event.eventId, claim.token).changes;
    if (changed !== 1) throw new Error("Event-processing lease was replaced; leave current worker's receipt untouched.");
  }
}

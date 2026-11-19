import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { verifyMembershipStripeEvent } from "../../platform/server/membership/platform-membership-stripe";
import { partnerAlertRecord } from "../contracts/partner-alert-validation";
import { removeReviewedPartnerAlertRole, type PartnerAlertReviewAssignment } from "./partner-alert-manual-role-review";
import type { PartnerAlertRoleTransport } from "./partner-alert-role-worker";

export type StripeSandboxEvent = Readonly<{
  id: string; kind: string; resource: Record<string, unknown>; created: number;
}>;
type Disposition = "retain" | "review" | "remove_candidate";

function readEvent(body: string, signature: string, secret: string, now: number): StripeSandboxEvent {
  const event = verifyMembershipStripeEvent(body, signature, secret, now);
  if (event.object !== "event" || event.livemode !== false || typeof event.id !== "string"
    || !/^evt_[A-Za-z0-9]+$/u.test(event.id) || typeof event.type !== "string"
    || typeof event.created !== "number" || !Number.isSafeInteger(event.created)) throw new Error("Invalid Stripe sandbox event.");
  return { id: event.id, kind: event.type, created: event.created,
    resource: partnerAlertRecord(partnerAlertRecord(event.data, "data").object, "object") };
}

function disposition(event: StripeSandboxEvent): Disposition | null {
  switch (event.kind) {
    case "invoice.paid":
      return event.resource.object === "invoice" && event.resource.status === "paid" ? "retain" : null;
    case "customer.subscription.updated":
      return event.resource.object === "subscription" && event.resource.status === "active"
        && event.resource.cancel_at_period_end === true ? "retain" : null;
    case "customer.subscription.deleted":
      return event.resource.object === "subscription" && event.resource.status === "canceled"
        && Number.isSafeInteger(event.resource.ended_at) ? "remove_candidate" : null;
    case "charge.dispute.created":
      return event.resource.object === "dispute" && event.resource.status === "needs_response" ? "review" : null;
    case "charge.dispute.closed":
      if (event.resource.object !== "dispute") return null;
      if (event.resource.status === "lost") return "remove_candidate";
      return event.resource.status === "won" ? "retain" : null;
    default: return null;
  }
}

/** Local sandbox QA composition. The supplied resolver binds native Stripe objects
 * to disposable buyer, offer, and role fixtures. No hosted route or credentials
 * are loaded here, and receipt of an event never changes a Discord role. */
export function createPartnerAlertStripeSandboxWebhook(input: Readonly<{
  db: Database.Database;
  signingSecret: string;
  nowMs: () => number;
  resolveVerifiedAssignment: (event: StripeSandboxEvent) => PartnerAlertReviewAssignment | null;
  canRemoveCurrentAssignment: (assignment: PartnerAlertReviewAssignment) => boolean;
  transport: PartnerAlertRoleTransport;
}>) {
  const { db } = input;
  if (db.name !== ":memory:" || !input.signingSecret.startsWith("whsec_")) throw new Error("Isolated Stripe sandbox required.");
  db.exec(`CREATE TABLE partner_alert_stripe_sandbox_reviews (
    event_id TEXT PRIMARY KEY, assignment_ref TEXT NOT NULL, digest TEXT NOT NULL, occurred INTEGER NOT NULL,
    disposition TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'recorded'
  ) STRICT`);

  const current = db.prepare(`SELECT event_id, disposition, state FROM partner_alert_stripe_sandbox_reviews
    WHERE assignment_ref=? ORDER BY occurred DESC, rowid DESC LIMIT 1`);
  const assignments = new Map<string, PartnerAlertReviewAssignment>();
  return {
    async receive(request: Request): Promise<Response> {
      if (request.method !== "POST") return new Response(null, { status: 405 });
      try {
        const raw = await request.text();
        if (Buffer.byteLength(raw) > 1_000_000) return new Response(null, { status: 413 });
        const event = readEvent(raw, request.headers.get("stripe-signature") ?? "", input.signingSecret, input.nowMs());
        const digest = createHash("sha256").update(raw).digest("hex");
        const prior = db.prepare("SELECT digest FROM partner_alert_stripe_sandbox_reviews WHERE event_id=?").pluck().get(event.id);
        if (prior !== undefined) return new Response(null, { status: prior === digest ? 200 : 409 });
        const decision = disposition(event);
        const assignment = decision && input.resolveVerifiedAssignment(event);
        if (!assignment || assignment.environment !== "sandbox" || assignment.eventId !== event.id) {
          return new Response(null, { status: 204 });
        }
        db.prepare(`INSERT INTO partner_alert_stripe_sandbox_reviews(event_id,assignment_ref,digest,occurred,disposition)
          VALUES (?,?,?,?,?)`).run(event.id, assignment.assignmentRef, digest, event.created, decision);
        assignments.set(event.id, assignment);
        return new Response(null, { status: 202 });
      } catch { return new Response(null, { status: 400 }); }
    },

    /** Called only by the isolated reviewer after checking competing purchases. */
    async approveRemoval(eventId: string, operationId: string): Promise<boolean> {
      const assignment = assignments.get(eventId);
      if (!assignment) return false;
      const stillCurrent = () => {
        const row = current.get(assignment.assignmentRef) as {event_id: string; disposition: string; state: string} | undefined;
        return row?.event_id === eventId && row.disposition === "remove_candidate" && row.state === "approved"
          && input.canRemoveCurrentAssignment(assignment);
      };
      const reserved = db.transaction(() => db.prepare(`UPDATE partner_alert_stripe_sandbox_reviews SET state='approved'
        WHERE event_id=? AND state='recorded' AND disposition='remove_candidate' AND NOT EXISTS (
          SELECT 1 FROM partner_alert_stripe_sandbox_reviews WHERE state='removed' AND assignment_ref=?
        )`).run(eventId, assignment.assignmentRef).changes === 1)();
      if (!reserved) return false;
      let removed = false;
      try {
        if (stillCurrent()) removed = await removeReviewedPartnerAlertRole({ assignment, operationId, transport: input.transport, stillCurrent });
        return removed;
      } finally {
        db.prepare("UPDATE partner_alert_stripe_sandbox_reviews SET state=? WHERE event_id=?")
          .run(removed ? "removed" : "held", eventId);
      }
    },
  };
}

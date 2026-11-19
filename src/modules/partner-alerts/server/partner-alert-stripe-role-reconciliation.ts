import type Database from "better-sqlite3";
import type { PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import { evaluatePartnerAlertChannelAccess } from "../contracts/partner-alert-access-policy";
import { hasPartnerAlertStripeCheckoutClosure } from "./database/partner-alert-stripe-checkout-attempt";
import type { PartnerAlertStripeClaim } from "./database/partner-alert-stripe-invoice-writer";
import type { PartnerAlertRoleAuthority, PartnerAlertRoleTarget, PartnerAlertRoleWorker } from "./partner-alert-role-worker";
import { readPartnerAlertExistingWhopRolePage } from "./partner-alert-existing-whop-access";

export type PartnerAlertStripeRoleIntent = Readonly<{
  operationId: string;
  scope: PartnerAlertRoleTarget;
  desiredPresent: boolean;
  offerId: string;
  offerVersion: number;
}>;

export function readPartnerAlertStripeRolePage(db: Database.Database,
  environment: PartnerAlertStripeClaim["environment"], afterOperationId: string | null, expiredAtUtc?: string):
  readonly PartnerAlertStripeRoleIntent[] {
  const due = expiredAtUtc !== undefined;
  const hasClosure = due && hasPartnerAlertStripeCheckoutClosure(db);
  const endedCheckout = hasClosure ? `OR (claim.checkout_close_reason='subscription_ended'
    AND claim.checkout_closed_at_ms<=?
    AND strftime('%Y-%m-%dT%H:%M:%fZ',claim.checkout_closed_at_ms/1000.0,'unixepoch')
      >=json_extract(j.desired_ticket_json,'$.context.observedAtUtc'))` : "";
  const candidate = due ? `r.status='applied' AND r.desired_present=1
    AND EXISTS (SELECT 1 FROM partner_alert_role_jobs j WHERE j.community_id=r.community_id
      AND j.mapping_id=r.mapping_id AND j.user_id=r.buyer_user_id AND j.applied_present=1
      AND j.managed_assignment_ref IS NOT NULL AND (j.decision_valid_until_utc<=? OR EXISTS (
        SELECT 1 FROM partner_alert_stripe_checkout_claims claim
        JOIN partner_alert_offer_channels mapping ON mapping.community_id=claim.community_id
          AND mapping.offer_id=claim.offer_id AND mapping.offer_version=claim.offer_version
        WHERE claim.environment=r.environment
          AND claim.buyer_user_id=r.buyer_user_id AND mapping.community_id=r.community_id AND mapping.mapping_id=r.mapping_id
          AND (EXISTS (SELECT 1 FROM partner_alert_stripe_events ended WHERE ended.claim_id=claim.claim_id
            AND ended.environment=claim.environment AND ended.stripe_account_id=claim.stripe_account_id
            AND ended.kind='customer.subscription.deleted' AND ended.status='applied'
            AND strftime('%Y-%m-%dT%H:%M:%fZ',ended.received_at_ms/1000.0,'unixepoch')
              >=json_extract(j.desired_ticket_json,'$.context.observedAtUtc')) ${endedCheckout})
      )))
    AND r.operation_id=(SELECT newest.operation_id FROM partner_alert_stripe_role_reconciliations newest
      WHERE newest.environment=r.environment AND newest.community_id=r.community_id
        AND newest.buyer_user_id=r.buyer_user_id AND newest.mapping_id=r.mapping_id
        AND newest.status='applied' AND newest.desired_present=1
      ORDER BY newest.created_at_ms DESC,newest.operation_id DESC LIMIT 1)` : "r.status IN ('pending','held','failed')";
  const rows = db.prepare(`SELECT r.operation_id,r.community_id,r.buyer_user_id,r.mapping_id,r.desired_present,c.offer_id,c.offer_version
    FROM partner_alert_stripe_role_reconciliations r JOIN partner_alert_stripe_checkout_claims c ON c.claim_id=r.claim_id
    WHERE r.environment=? AND (${candidate})
      AND (? IS NULL OR r.operation_id>?) ORDER BY r.operation_id LIMIT 25`)
    .all(environment, ...(due ? [expiredAtUtc] : []), ...(hasClosure ? [Date.parse(expiredAtUtc!)] : []),
      afterOperationId, afterOperationId) as { operation_id: string; community_id: string; buyer_user_id: string;
      mapping_id: string; desired_present: 0 | 1; offer_id: string; offer_version: number }[];
  return rows.map(row => ({ operationId: row.operation_id, scope: { communityId: row.community_id,
    mappingId: row.mapping_id, userId: row.buyer_user_id }, desiredPresent: row.desired_present === 1,
  offerId: row.offer_id, offerVersion: row.offer_version }));
}

/** Process one request using the existing worker's owned-role and lease checks.
 * A stale remove request is settled without a Discord write if another purchase
 * still grants access. Lacking current evidence leaves the request held. */
export async function reconcilePartnerAlertStripeRole(db: Database.Database, input: Readonly<{
  intent: PartnerAlertStripeRoleIntent;
  authority: PartnerAlertRoleAuthority;
  worker: Pick<PartnerAlertRoleWorker, "refreshUserMapping" | "runOnce">;
  nowUtc: () => string;
}>): Promise<"applied" | "held"> {
  const { authority, worker, intent } = input;
  const { scope } = intent;
  if (!authority.inCurrentWriter) throw new Error("Stripe role operation requires current admission.");

  const applyStatus = (status: "applied" | "held") => {
    requirePlatformErasureWriter(db, scope.userId);
    db.prepare(`UPDATE partner_alert_stripe_role_reconciliations SET status=?
      WHERE operation_id=? AND community_id=? AND buyer_user_id=? AND mapping_id=?
      AND desired_present=? AND status IN ('pending','held','failed')`).run(
      status, intent.operationId, scope.communityId, scope.userId, scope.mappingId, Number(intent.desiredPresent),
    );
    return status;
  };
  const isPending = () => Boolean(db.prepare(`SELECT 1 FROM partner_alert_stripe_role_reconciliations
    WHERE operation_id=? AND community_id=? AND buyer_user_id=? AND mapping_id=? AND desired_present=?
    AND status IN ('pending','held','failed')`).get(
    intent.operationId, scope.communityId, scope.userId, scope.mappingId, Number(intent.desiredPresent),
  ));
  const readDecision = async () => {
    const snapshot = await authority.refresh(scope);
    return authority.inCurrentWriter!(() => {
      requirePlatformErasureWriter(db, scope.userId);
      const { context } = snapshot.ticket;
      if (!isPending() || !authority.isCurrent(snapshot.ticket) || context.userId !== scope.userId
        || context.communityId !== scope.communityId || context.mappingId !== scope.mappingId) return null;
      return { ticket: snapshot.ticket, decision: evaluatePartnerAlertChannelAccess({ ...snapshot.input, nowUtc: input.nowUtc() }) };
    });
  };
  const requested = intent.desiredPresent ? "present" : "absent";
  const current = await readDecision();
  if (!current || current.decision.desiredRole === "hold") return authority.inCurrentWriter(() => applyStatus("held"));
  if (current.decision.desiredRole !== requested) return authority.inCurrentWriter(() =>
    applyStatus(authority.isCurrent(current.ticket) ? "applied" : "held"));

  // Hydration, role hierarchy checks and Discord I/O stay outside the writer.
  if (!await worker.refreshUserMapping(scope)) return authority.inCurrentWriter(() => applyStatus("held"));
  await worker.runOnce(scope);

  return authority.inCurrentWriter(() => {
    const unresolved = db.prepare(`SELECT 1 FROM partner_alert_role_jobs
      WHERE community_id=? AND mapping_id=? AND user_id=?
      AND (status!='applied' OR desired_present!=? OR applied_present IS NOT ?) LIMIT 1`)
      .get(scope.communityId, scope.mappingId, scope.userId, Number(intent.desiredPresent), Number(intent.desiredPresent));
    const applied = db.prepare(`SELECT 1 FROM partner_alert_role_jobs
      WHERE community_id=? AND mapping_id=? AND user_id=? AND status='applied'
      AND desired_present=? AND applied_present=? AND managed_assignment_ref IS NOT NULL LIMIT 1`)
      .get(scope.communityId, scope.mappingId, scope.userId, Number(intent.desiredPresent), Number(intent.desiredPresent));
    return applyStatus(!unresolved && applied ? "applied" : "held");
  });
}

type StripeRoleBinding = Readonly<{
  authority: PartnerAlertRoleAuthority;
  worker: Pick<PartnerAlertRoleWorker, "refreshUserMapping" | "runOnce">;
}>;

/** Explicit startup binding for one provider environment. Process one bounded
 * page at a time and release each SQLite writer before Discord requests. */
export function startPartnerAlertStripeRoleReconciliation(db: Database.Database, input: Readonly<{
  environment: PartnerAlertStripeClaim["environment"];
  nowUtc: () => string;
  bind: (intent: Pick<PartnerAlertStripeRoleIntent, "scope" | "offerId" | "offerVersion">) => StripeRoleBinding | null;
  reportFailure: () => void;
  existingWhopEnvironment?: PartnerAlertEnvironment;
  checkExistingWhopRoles?: () => boolean;
}>): () => Promise<void> {
  let cursor: string | null = null;
  let expiryCursor: string | null = null;
  let whopCursor: Pick<PartnerAlertRoleTarget, "mappingId" | "userId"> | null = null;
  let active: Promise<void> | null = null;

  const runPage = async () => {
    const page = readPartnerAlertStripeRolePage(db, input.environment, cursor);
    for (const intent of page) {
      try {
        const ports = input.bind(intent);
        if (ports) await reconcilePartnerAlertStripeRole(db, { intent, ...ports, nowUtc: input.nowUtc });
      } catch { input.reportFailure(); }
    }
    cursor = page.length === 25 ? page[page.length - 1]!.operationId : null;
    const deadlines = readPartnerAlertStripeRolePage(db, input.environment, expiryCursor, input.nowUtc());
    for (const intent of deadlines) {
      try {
        const ports = input.bind(intent);
        if (ports && await ports.worker.refreshUserMapping(intent.scope)) await ports.worker.runOnce(intent.scope);
      } catch { input.reportFailure(); }
    }
    expiryCursor = deadlines.length === 25 ? deadlines[deadlines.length - 1]!.operationId : null;
    if (input.checkExistingWhopRoles?.()) {
      const assignments = readPartnerAlertExistingWhopRolePage(db, whopCursor, input.nowUtc(), input.existingWhopEnvironment);
      for (const intent of assignments) {
        try {
          const ports = input.bind(intent);
          if (!ports?.authority.inCurrentWriter) continue;
          const snapshot = await ports.authority.refresh(intent.scope);
          const canRemove = ports.authority.inCurrentWriter(() => {
            const { communityId, mappingId, userId } = snapshot.ticket.context;
            if (communityId !== intent.scope.communityId || mappingId !== intent.scope.mappingId
              || userId !== intent.scope.userId || !ports.authority.isCurrent(snapshot.ticket)) return false;
            const now = input.nowUtc();
            const decision = evaluatePartnerAlertChannelAccess({ ...snapshot.input, nowUtc: now });
            if (decision.desiredRole !== "absent") return false;
            if (decision.reason === "premium_required") return true;
            return decision.reason === "subscription_required" && snapshot.input.existingWhopAccess?.kind === "absent"
              && snapshot.input.existingWhopAccess.validUntilUtc > now;
          });
          if (canRemove && await ports.worker.refreshUserMapping(intent.scope)) await ports.worker.runOnce(intent.scope);
        } catch { input.reportFailure(); }
      }
      whopCursor = assignments.length === 10 ? assignments[assignments.length - 1]!.scope : null;
    }
  };

  const tick = () => {
    if (active) return;
    active = runPage().catch(input.reportFailure).finally(() => { active = null; });
  };
  tick();
  const timer = setInterval(tick, 30_000);
  timer.unref();
  return async () => {
    clearInterval(timer);
    await active;
  };
}

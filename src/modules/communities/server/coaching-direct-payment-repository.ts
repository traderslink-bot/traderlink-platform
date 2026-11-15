import type Database from "better-sqlite3";
import {
  snapshotCoachingDirectPurchase,
  assessCoachingPurchasePayment,
  type CoachingDirectPurchase,
  type CoachingPurchasePaymentEvidence,
} from "../contracts/coaching-direct-purchase";

export type CoachingDirectPaymentObservation = Readonly<{
  receiptId: string;
  payloadSha256: string;
  source: "provider_event" | "reconciliation";
  observedAtUtc: string;
  payment: CoachingPurchasePaymentEvidence;
}>;

/** Server-only persistence; no migration, network, secret, access or allowance side effects. */
export class CoachingDirectPaymentRepository {
  constructor(private readonly database: Database.Database) {}

  recordPurchase(input: CoachingDirectPurchase): "recorded" | "duplicate" {
    const snapshot = snapshotCoachingDirectPurchase(input);
    const encoded = JSON.stringify(snapshot);
    return this.database.transaction(() => {
      const previous = this.database.prepare("SELECT snapshot_json FROM traderlink_coaching_direct_purchases WHERE purchase_id=?")
        .get(snapshot.purchaseId) as { snapshot_json: string } | undefined;
      if (previous) {
        if (previous.snapshot_json !== encoded) throw new Error("Purchase identity already contains different accepted terms.");
        return "duplicate" as const;
      }
      this.database.prepare(`INSERT INTO traderlink_coaching_direct_purchases
        (purchase_id,environment,coach_user_id,student_user_id,merchant_account_id,agreement_id,agreement_revision,snapshot_json,created_at_utc)
        VALUES(?,?,?,?,?,?,?,?,?)`).run(snapshot.purchaseId, snapshot.environment, snapshot.coachUserId,
        snapshot.studentUserId, snapshot.merchantAccountId, snapshot.agreement.agreementId,
        snapshot.agreement.revision, encoded, snapshot.createdAtUtc);
      return "recorded" as const;
    }).immediate();
  }

  readPurchase(purchaseId: string): CoachingDirectPurchase | null {
    const row = this.database.prepare("SELECT snapshot_json FROM traderlink_coaching_direct_purchases WHERE purchase_id=?")
      .get(purchaseId) as { snapshot_json: string } | undefined;
    return row ? snapshotCoachingDirectPurchase(JSON.parse(row.snapshot_json)) : null;
  }

  recordCheckout(purchaseId: string, checkout: Readonly<{checkoutId: string; purchaseUrl: string}>, atUtc: string): "recorded" | "duplicate" {
    this.validTime(atUtc);
    return this.database.transaction(() => {
      const purchase = this.readPurchase(purchaseId);
      if (!purchase || !checkout.checkoutId.trim() || atUtc < purchase.createdAtUtc) throw new Error("Identify the purchase and checkout receipt.");
      const url = new URL(checkout.purchaseUrl);
      if (url.protocol !== "https:" || url.hostname !== (purchase.environment === "sandbox" ? "sandbox.whop.com" : "whop.com") || url.port || url.username || url.password) throw new Error("Checkout URL environment mismatch.");
      const prior = this.readCheckout(purchaseId);
      if (prior) {
        if (prior.checkoutId !== checkout.checkoutId || prior.purchaseUrl !== checkout.purchaseUrl) throw new Error("Checkout identity conflicts with the original purchase.");
        return "duplicate" as const;
      }
      this.database.prepare(`INSERT INTO traderlink_coaching_direct_checkouts
        (purchase_id,environment,merchant_account_id,checkout_id,purchase_url,recorded_at_utc) VALUES(?,?,?,?,?,?)`)
        .run(purchaseId, purchase.environment, purchase.merchantAccountId, checkout.checkoutId, checkout.purchaseUrl, atUtc);
      return "recorded" as const;
    }).immediate();
  }

  readCheckout(purchaseId: string): Readonly<{checkoutId: string; purchaseUrl: string}> | null {
    const row = this.database.prepare("SELECT checkout_id checkoutId,purchase_url purchaseUrl FROM traderlink_coaching_direct_checkouts WHERE purchase_id=?")
      .get(purchaseId) as {checkoutId: string; purchaseUrl: string} | undefined;
    return row ? Object.freeze(row) : null;
  }

  /** Only signature-verified events/current authoritative reads belong here; not browser payloads. */
  recordObservation(input: CoachingDirectPaymentObservation): "recorded" | "duplicate" {
    if (!input.receiptId.trim() || !/^[a-f0-9]{64}$/.test(input.payloadSha256) ||
      !["provider_event", "reconciliation"].includes(input.source) ||
      !Number.isFinite(Date.parse(input.observedAtUtc)) || new Date(input.observedAtUtc).toISOString() !== input.observedAtUtc) throw new Error("Invalid payment receipt.");
    return this.database.transaction(() => {
      const payment = input.payment;
      const purchase = this.readPurchase(payment.purchaseId);
      if (!purchase) throw new Error("Identify the original purchase before recording its payment.");
      const assessment = assessCoachingPurchasePayment(purchase, payment);
      if (assessment.state === "mismatch") throw new Error("Payment does not match its original purchase.");
      if (input.observedAtUtc < purchase.createdAtUtc) throw new Error("Payment observation predates the purchase.");
      const prior = this.database.prepare(`SELECT payload_sha256,source FROM traderlink_coaching_direct_payment_receipts
        WHERE environment=? AND merchant_account_id=? AND source=? AND receipt_id=?`)
        .get(payment.environment, payment.merchantAccountId, input.source, input.receiptId) as { payload_sha256: string; source: string } | undefined;
      if (prior) {
        if (prior.payload_sha256 !== input.payloadSha256 || prior.source !== input.source) throw new Error("Payment receipt identity conflicts with prior evidence.");
        const observation = this.database.prepare(`SELECT payment_id,purchase_id FROM traderlink_coaching_direct_payment_observations
          WHERE environment=? AND merchant_account_id=? AND source=? AND receipt_id=?`).get(payment.environment, payment.merchantAccountId, input.source, input.receiptId) as { payment_id: string; purchase_id: string } | undefined;
        if (!observation || observation.purchase_id !== payment.purchaseId || observation.payment_id !== payment.paymentId) throw new Error("Payment receipt normalization conflicts with prior evidence.");
        return "duplicate" as const;
      }
      const binding = this.database.prepare(`SELECT purchase_id FROM traderlink_coaching_direct_payment_bindings
        WHERE environment=? AND merchant_account_id=? AND payment_id=?`)
        .get(payment.environment, payment.merchantAccountId, payment.paymentId) as { purchase_id: string } | undefined;
      if (binding && binding.purchase_id !== payment.purchaseId) throw new Error("Payment already belongs to another purchase.");
      this.database.prepare(`INSERT INTO traderlink_coaching_direct_payment_receipts
        (environment,merchant_account_id,receipt_id,payload_sha256,source,observed_at_utc) VALUES(?,?,?,?,?,?)`)
        .run(payment.environment, payment.merchantAccountId, input.receiptId, input.payloadSha256, input.source, input.observedAtUtc);
      if (!binding) this.database.prepare(`INSERT INTO traderlink_coaching_direct_payment_bindings
        (environment,merchant_account_id,payment_id,purchase_id) VALUES(?,?,?,?)`)
        .run(payment.environment, payment.merchantAccountId, payment.paymentId, payment.purchaseId);
      this.database.prepare(`INSERT INTO traderlink_coaching_direct_payment_observations
        (environment,merchant_account_id,receipt_id,source,payment_id,purchase_id,state,evidence_json,observed_at_utc) VALUES(?,?,?,?,?,?,?,?,?)`)
        .run(payment.environment, payment.merchantAccountId, input.receiptId, input.source, payment.paymentId, payment.purchaseId,
          assessment.state, JSON.stringify(payment), input.observedAtUtc);
      return "recorded" as const;
    }).immediate();
  }

  /** Records financial funding once. It does not activate relationships or Journal grants. */
  recordFunding(purchaseId: string, paymentId: string, atUtc: string): "recorded" | "duplicate" {
    this.validTime(atUtc);
    return this.database.transaction(() => {
      const purchase = this.readPurchase(purchaseId);
      if (!purchase) throw new Error("Unknown purchase.");
      const prior = this.database.prepare("SELECT payment_id FROM traderlink_coaching_direct_purchase_funding WHERE purchase_id=?")
        .get(purchaseId) as { payment_id: string } | undefined;
      if (prior) {
        if (prior.payment_id !== paymentId) throw new Error("Purchase already funded by another payment; reconcile duplicate charges.");
        return "duplicate" as const;
      }
      const current = this.readLatestPayments(purchaseId).find(payment => payment.paymentId === paymentId);
      if (!current || current.state !== "paid" || current.observedAtUtc > atUtc) throw new Error("Identify a verified paid observation before recording funding.");
      this.database.prepare(`INSERT INTO traderlink_coaching_direct_purchase_funding
        (purchase_id,environment,merchant_account_id,payment_id,recorded_at_utc) VALUES(?,?,?,?,?)`)
        .run(purchaseId, purchase.environment, purchase.merchantAccountId, paymentId, atUtc);
      return "recorded" as const;
    }).immediate();
  }

  /** Agreed purchased occurrences; accepted item.quantity remains untouched. Caller authorizes work. */
  reserveOccurrence(input: Readonly<{purchaseId: string; planItemId: string; occurrenceIndex: number; workId: string; atUtc: string}>): "recorded" | "duplicate" {
    this.validTime(input.atUtc);
    if (!input.workId.trim() || !Number.isSafeInteger(input.occurrenceIndex) || input.occurrenceIndex < 0) throw new Error("Invalid service reservation.");
    return this.database.transaction(() => {
      const purchase = this.readPurchase(input.purchaseId);
      const allocation = purchase?.allocations.find(item => item.planItemId === input.planItemId);
      const funding = this.database.prepare("SELECT recorded_at_utc FROM traderlink_coaching_direct_purchase_funding WHERE purchase_id=?")
        .get(input.purchaseId) as { recorded_at_utc: string } | undefined;
      if (!allocation || input.occurrenceIndex >= allocation.occurrences || !funding || funding.recorded_at_utc > input.atUtc) throw new Error("Reservation must identify a funded purchased service occurrence.");
      const prior = this.database.prepare(`SELECT work_id FROM traderlink_coaching_direct_service_usage
        WHERE purchase_id=? AND plan_item_id=? AND occurrence_index=?`).get(input.purchaseId, input.planItemId, input.occurrenceIndex) as { work_id: string } | undefined;
      if (prior) {
        if (prior.work_id !== input.workId) throw new Error("Purchased occurrence already belongs to other work.");
        return "duplicate" as const;
      }
      this.database.prepare(`INSERT INTO traderlink_coaching_direct_service_usage
        (purchase_id,plan_item_id,occurrence_index,work_id,status,reserved_at_utc) VALUES(?,?,?,?,'reserved',?)`)
        .run(input.purchaseId, input.planItemId, input.occurrenceIndex, input.workId, input.atUtc);
      return "recorded" as const;
    }).immediate();
  }

  completeOccurrence(workId: string, atUtc: string): "recorded" | "duplicate" {
    this.validTime(atUtc);
    return this.database.transaction(() => {
      const prior = this.database.prepare("SELECT status,reserved_at_utc FROM traderlink_coaching_direct_service_usage WHERE work_id=?")
        .get(workId) as { status: string; reserved_at_utc: string } | undefined;
      if (!prior || prior.reserved_at_utc > atUtc) throw new Error("Identify the reserved work before completion.");
      if (prior.status === "completed") return "duplicate" as const;
      this.database.prepare("UPDATE traderlink_coaching_direct_service_usage SET status='completed',completed_at_utc=? WHERE work_id=?")
        .run(atUtc, workId);
      return "recorded" as const;
    }).immediate();
  }

  private validTime(atUtc: string): void {
    if (!Number.isFinite(Date.parse(atUtc)) || new Date(atUtc).toISOString() !== atUtc) throw new Error("Use a canonical UTC timestamp.");
  }

  /** Every attempt stays visible; failed retries cannot overwrite a separate successful payment. */
  readLatestPayments(purchaseId: string): readonly Readonly<{ paymentId: string; state: string; observedAtUtc: string }>[] {
    return this.database.prepare(`SELECT current.payment_id paymentId,current.state,current.observed_at_utc observedAtUtc
      FROM traderlink_coaching_direct_payment_observations current WHERE current.purchase_id=?
      AND NOT EXISTS (SELECT 1 FROM traderlink_coaching_direct_payment_observations newer
        WHERE newer.environment=current.environment AND newer.merchant_account_id=current.merchant_account_id
        AND newer.payment_id=current.payment_id AND (newer.observed_at_utc>current.observed_at_utc
          OR (newer.observed_at_utc=current.observed_at_utc AND newer.observation_id>current.observation_id)))
      ORDER BY current.observed_at_utc,current.observation_id`).all(purchaseId) as { paymentId: string; state: string; observedAtUtc: string }[];
  }
}

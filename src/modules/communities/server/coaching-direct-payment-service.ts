import { assessCoachingPurchasePayment, snapshotCoachingDirectPurchase, type CoachingDirectPurchase } from "../contracts/coaching-direct-purchase";
import { CoachingDirectPaymentRepository } from "./coaching-direct-payment-repository";
import { CoachingWhopDirectClient } from "./coaching-whop-direct-client";
import { normalizeCoachingWhopPayment, type CoachingWhopPaymentBinding } from "./coaching-whop-payment-normalization";
import type { CoachingWhopBillingExpectation } from "./coaching-whop-offer-verification";

/** New financial path only; existing agreement/Journal/Discord services are not mutated. */
export class CoachingDirectPaymentService {
  constructor(private readonly repository: Pick<CoachingDirectPaymentRepository,'readPurchase'|'recordPurchase'|'readCheckout'|'recordCheckout'|'recordObservation'|'recordFunding'>, private readonly whop: CoachingWhopDirectClient) {}

  /** Purchase is assembled from server-owned accepted terms, not deserialized from a public form. */
  async beginCheckout(input: Readonly<{
    purchase: CoachingDirectPurchase; actorUserId: string; returnPath: string;
    platformAccountId: string; billing: CoachingWhopBillingExpectation; atUtc: string;
  }>): Promise<Readonly<{purchaseId: string; checkoutId: string; purchaseUrl: string}>> {
    const requested = snapshotCoachingDirectPurchase(input.purchase);
    if (input.actorUserId !== requested.studentUserId) throw new Error("Checkout belongs to the student accepting this purchase.");
    const prior = this.repository.readPurchase(requested.purchaseId);
    const snapshot = prior ? snapshotCoachingDirectPurchase({ ...requested, createdAtUtc: prior.createdAtUtc }) : requested;
    this.repository.recordPurchase(snapshot);
    const existing = this.repository.readCheckout(snapshot.purchaseId);
    if (existing) return Object.freeze({ purchaseId: snapshot.purchaseId, ...existing });
    // Provider idempotency handles uncertain response/retry; original order is already durable.
    const checkout = await this.whop.createCheckout(snapshot, input.returnPath, {platformAccountId: input.platformAccountId, billing: input.billing});
    this.repository.recordCheckout(snapshot.purchaseId, checkout, input.atUtc);
    return Object.freeze({ purchaseId: snapshot.purchaseId, ...checkout });
  }

  /** Binding resolver uses persisted checkout/identity/quote/cycle facts, never untrusted metadata alone. */
  async reconcilePayment(input: Readonly<{
    purchaseId: string; paymentId: string; receiptId: string; payloadSha256: string;
    source: "provider_event" | "reconciliation"; observedAtUtc: string;
    resolveBinding: (purchase: CoachingDirectPurchase, checkout: Readonly<{checkoutId: string; purchaseUrl: string}> | null,
      nativePayment: Readonly<Record<string, unknown>>) => Promise<CoachingWhopPaymentBinding>;
  }>): Promise<Readonly<{state: string; receipt: "recorded" | "duplicate"; funding: "recorded" | "duplicate" | "not_recorded"}>> {
    const purchase = this.repository.readPurchase(input.purchaseId);
    if (!purchase) throw new Error("Identify the original purchase before payment reconciliation.");
    const nativePayment = await this.whop.retrievePayment(input.paymentId);
    const binding = await input.resolveBinding(purchase, this.repository.readCheckout(purchase.purchaseId), nativePayment);
    if (binding.paymentId !== input.paymentId) throw new Error("Authoritative payment lookup does not match its binding.");
    const normalized = normalizeCoachingWhopPayment({purchase, binding, payment: nativePayment});
    const assessment = assessCoachingPurchasePayment(purchase, normalized.evidence);
    const receipt = this.repository.recordObservation({receiptId: input.receiptId, payloadSha256: input.payloadSha256,
      source: input.source, observedAtUtc: input.observedAtUtc, payment: normalized.evidence});
    const funding = assessment.state === "paid"
      ? this.repository.recordFunding(purchase.purchaseId, input.paymentId, input.observedAtUtc) : "not_recorded";
    return Object.freeze({state: assessment.state, receipt, funding});
  }
}

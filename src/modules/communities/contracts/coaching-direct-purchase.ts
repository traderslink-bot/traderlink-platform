import type { CoachingAgreement } from "./coaching-agreements";

/** Financial facts only. This contract never grants coaching or Journal access. */
export type CoachingDirectPurchase = Readonly<{
  version: 1;
  purchaseId: string;
  environment: "sandbox" | "live";
  coachUserId: string;
  studentUserId: string;
  merchantAccountId: string;
  providerOffer: Readonly<{ productId: string; variantId: string }>;
  agreement: CoachingAgreement;
  price: Readonly<{ amountMinor: number; currency: string }>;
  commission: Readonly<{ policyVersion: string; basisPoints: number; rounding: "half_up" }>;
  allocations: readonly Readonly<{ planItemId: string; occurrences: number }>[];
  createdAtUtc: string;
  billingCycle?:Readonly<{originPurchaseId:string;membershipId:string;invoicePaymentId:string;periodStartAtUtc:string;periodEndAtUtc:string}>;
}>;

function text(value: string, label: string): void {
  if (typeof value !== "string" || !value.trim() || value !== value.trim()) throw new Error(`Invalid ${label}.`);
}
function minor(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid monetary amount.");
}
function timestamp(value: string): void {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error("Invalid UTC timestamp.");
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Exact integer rounding is explicit and versioned; provider reconciliation remains required. */
export function coachingCommissionMinor(amountMinor: number, basisPoints = 2000): number {
  minor(amountMinor);
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) throw new Error("Invalid commission rate.");
  return Number((BigInt(amountMinor) * BigInt(basisPoints) + BigInt(5000)) / BigInt(10000));
}

/** Caller supplies explicit agreed occurrences; item.quantity retains trade/day/service semantics. */
export function snapshotCoachingDirectPurchase(input: CoachingDirectPurchase): CoachingDirectPurchase {
  if (input.version !== 1 || !["sandbox", "live"].includes(input.environment)) throw new Error("Invalid purchase version or environment.");
  for (const [label, value] of Object.entries({ purchase: input.purchaseId, coach: input.coachUserId, student: input.studentUserId, merchant: input.merchantAccountId, product: input.providerOffer.productId, variant: input.providerOffer.variantId, policy: input.commission.policyVersion })) text(value, label);
  timestamp(input.createdAtUtc);
  if(input.billingCycle){
    for(const value of [input.billingCycle.originPurchaseId,input.billingCycle.membershipId,input.billingCycle.invoicePaymentId])text(value,'billing cycle identity');
    timestamp(input.billingCycle.periodStartAtUtc);timestamp(input.billingCycle.periodEndAtUtc);
    if(input.billingCycle.periodStartAtUtc>=input.billingCycle.periodEndAtUtc||input.agreement.terms.billingCadence==='one_time')throw new Error('Invalid recurring purchase period.');
  }
  const agreement = input.agreement;
  if (agreement.status !== "accepted" || agreement.acceptedAtUtc === null) throw new Error("Identify the accepted agreement for this purchase.");
  timestamp(agreement.acceptedAtUtc);
  if (agreement.acceptedAtUtc > input.createdAtUtc) throw new Error("Purchase predates agreement acceptance.");
  text(agreement.agreementId, "agreement");
  text(agreement.relationshipId, "relationship");
  if (!Number.isSafeInteger(agreement.revision) || agreement.revision < 1) throw new Error("Invalid agreement revision.");
  minor(input.price.amountMinor);
  if (!/^[A-Z]{3}$/.test(input.price.currency) || input.price.currency !== agreement.terms.currency || input.price.amountMinor !== agreement.terms.priceAmountMinor) throw new Error("Purchase price must match the accepted agreement.");
  if (input.commission.rounding !== "half_up") throw new Error("Unsupported commission rounding.");
  coachingCommissionMinor(input.price.amountMinor, input.commission.basisPoints);
  const items = new Set(agreement.terms.items.map(item => item.planItemId));
  if (items.size !== agreement.terms.items.length) throw new Error("Ambiguous accepted service identity.");
  const seen = new Set<string>();
  for (const allocation of input.allocations) {
    if (!items.has(allocation.planItemId) || seen.has(allocation.planItemId) || !Number.isSafeInteger(allocation.occurrences) || allocation.occurrences < 1) throw new Error("Invalid purchased service occurrences.");
    seen.add(allocation.planItemId);
  }
  if (items.size !== seen.size) throw new Error("Specify purchased occurrences for every accepted service.");
  return freeze(structuredClone(input));
}

/** Normalized authoritative server evidence, not raw Whop JSON or redirect parameters. */
export type CoachingPurchasePaymentEvidence = Readonly<{
  environment: CoachingDirectPurchase["environment"];
  purchaseId: string;
  paymentId: string;
  merchantAccountId: string;
  productId: string;
  variantId: string;
  studentUserId: string;
  agreementId: string;
  agreementRevision: number;
  amountMinor: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "authorized";
  refundedAmountMinor: number;
  disputeState: "none" | "open" | "won" | "lost" | "prevented";
}>;

export type CoachingPurchasePaymentAssessment = Readonly<{
  paymentId: string;
  state: "mismatch" | "unpaid" | "paid" | "partially_refunded" | "refunded" | "disputed" | "reversed";
  expectedCommissionMinor: number;
}>;

/** Reports money state only; never creates allowance, changes access or initiates a refund. */
export function assessCoachingPurchasePayment(purchase: CoachingDirectPurchase, evidence: CoachingPurchasePaymentEvidence): CoachingPurchasePaymentAssessment {
  const expectedCommissionMinor = coachingCommissionMinor(purchase.price.amountMinor, purchase.commission.basisPoints);
  const result = (state: CoachingPurchasePaymentAssessment["state"]) => Object.freeze({ paymentId: evidence.paymentId, state, expectedCommissionMinor });
  text(evidence.paymentId, "payment");
  minor(evidence.amountMinor);
  minor(evidence.refundedAmountMinor);
  if (evidence.refundedAmountMinor > evidence.amountMinor) throw new Error("Refund exceeds payment.");
  if (!["succeeded", "pending", "failed", "authorized"].includes(evidence.status) || !["none", "open", "won", "lost", "prevented"].includes(evidence.disputeState)) throw new Error("Unknown payment state requires reconciliation.");
  if (evidence.environment !== purchase.environment || evidence.purchaseId !== purchase.purchaseId || evidence.merchantAccountId !== purchase.merchantAccountId || evidence.productId !== purchase.providerOffer.productId || evidence.variantId !== purchase.providerOffer.variantId || evidence.studentUserId !== purchase.studentUserId || evidence.agreementId !== purchase.agreement.agreementId || evidence.agreementRevision !== purchase.agreement.revision || evidence.amountMinor !== purchase.price.amountMinor || evidence.currency !== purchase.price.currency) return result("mismatch");
  // A lost dispute can reverse a payment without creating a Refund resource.
  if (["lost", "prevented"].includes(evidence.disputeState)) return result("reversed");
  if (evidence.disputeState === "open") return result("disputed");
  if (evidence.status !== "succeeded") return result("unpaid");
  if (evidence.refundedAmountMinor > 0) return result(evidence.refundedAmountMinor === evidence.amountMinor ? "refunded" : "partially_refunded");
  return result("paid");
}

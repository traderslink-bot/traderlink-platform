import { coachingCommissionMinor } from "./coaching-direct-purchase";

/** Decimal string conversion with no floating-point rounding or invented precision. */
export function coachingDecimalMinor(value: string, decimals: number): number {
  if (typeof value !== "string" || !/^-?(0|[1-9]\d*)(\.\d+)?$/.test(value) || !Number.isInteger(decimals) || decimals < 0 || decimals > 8) throw new Error("Invalid exact monetary value.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  if (fraction.slice(decimals).replace(/0/g, "")) throw new Error("Amount cannot be represented in the requested currency precision.");
  const units = BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fraction.slice(0, decimals).padEnd(decimals, "0") || "0");
  const signed = negative ? -units : units;
  if (signed > BigInt(Number.MAX_SAFE_INTEGER) || signed < BigInt(Number.MIN_SAFE_INTEGER)) throw new Error("Monetary amount exceeds safe storage range.");
  return Number(signed);
}

export type CoachingCommissionEntry = Readonly<{
  entryId: string;
  paymentId: string;
  receivingAccountId: string;
  currency: string;
  amountMinor: number;
  kind: "credit" | "reversal";
}>;

export function reconcileCoachingCommission(input: Readonly<{
  paymentId: string;
  platformAccountId: string;
  currency: string;
  commissionBaseMinor: number;
  basisPoints: number;
  expectedReversedMinor: number | null;
  entries: readonly CoachingCommissionEntry[];
}>): Readonly<{ expectedCreditMinor: number; creditedMinor: number; reversedMinor: number; netMinor: number; state: "matched" | "missing_credit" | "credit_mismatch" | "reversal_pending" | "reversal_mismatch" | "reversal_unqualified" }> {
  const expectedCreditMinor = coachingCommissionMinor(input.commissionBaseMinor, input.basisPoints);
  if (!input.paymentId || !input.platformAccountId || !/^[A-Z]{3}$/.test(input.currency)) throw new Error("Identify commission payment, recipient and currency.");
  if (input.expectedReversedMinor !== null && (!Number.isSafeInteger(input.expectedReversedMinor) || input.expectedReversedMinor < 0)) throw new Error("Invalid expected commission reversal.");
  const seen = new Map<string, CoachingCommissionEntry>();
  let credit = BigInt(0), reversal = BigInt(0);
  for (const entry of input.entries) {
    if (entry.paymentId !== input.paymentId || entry.receivingAccountId !== input.platformAccountId) continue;
    if (!entry.entryId || entry.currency !== input.currency || !Number.isSafeInteger(entry.amountMinor) || !["credit", "reversal"].includes(entry.kind) || (entry.kind === "credit" && entry.amountMinor <= 0) || (entry.kind === "reversal" && entry.amountMinor >= 0)) throw new Error("Commission ledger needs exact same-currency evidence.");
    const previous = seen.get(entry.entryId);
    if (previous) {
      if (previous.amountMinor !== entry.amountMinor || previous.kind !== entry.kind) throw new Error("Conflicting commission ledger entry.");
      continue;
    }
    seen.set(entry.entryId, entry);
    if (entry.kind === "credit") credit += BigInt(entry.amountMinor); else reversal -= BigInt(entry.amountMinor);
  }
  for (const total of [credit, reversal]) if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Commission ledger total exceeds safe range.");
  const creditedMinor = Number(credit), reversedMinor = Number(reversal), netMinor = Number(credit - reversal);
  const state = creditedMinor !== expectedCreditMinor ? creditedMinor === 0 && expectedCreditMinor > 0 ? "missing_credit" : "credit_mismatch"
    : input.expectedReversedMinor === null ? "reversal_unqualified"
    : reversedMinor === input.expectedReversedMinor ? "matched"
    : reversedMinor < input.expectedReversedMinor ? "reversal_pending" : "reversal_mismatch";
  return Object.freeze({ expectedCreditMinor, creditedMinor, reversedMinor, netMinor, state });
}

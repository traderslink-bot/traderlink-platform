import type { MembershipPrice } from "./platform-membership-pricing";
import { combinedMembershipPrice } from "./membership-addons";
import { combineCoachStudentCapacity, type CoachStudentCapacity } from "./coach-student-capacity";

/** Owner-configured recurring totals only. Not a provider quote, payment command,
 * proration, expiry decision or mutation of accepted subscription terms.
 */
export function planCoachCapacityBatchSelection(input: Readonly<{
  baseCapacity: CoachStudentCapacity;
  basePrice: MembershipPrice;
  additionalStudentsPerBatch: number;
  batchPrice: MembershipPrice;
  quantity: number;
}>) {
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 0) throw new Error("Choose a valid number of capacity batches.");
  if (!Number.isSafeInteger(input.additionalStudentsPerBatch) || input.additionalStudentsPerBatch < 1) throw new Error("Configure the students included in each capacity batch.");
  for (const price of [input.basePrice, input.batchPrice]) {
    if (price.billingKind !== "recurring" || price.billingInterval !== "month" || price.billingIntervalCount !== 1) {
      throw new Error("Coach subscriptions and capacity batches use monthly recurring prices.");
    }
    for (const amount of [price.initialAmountMinor, price.renewalAmountMinor]) {
      if (amount === null || !Number.isSafeInteger(amount) || amount < 0) throw new Error("Configure the recurring capacity prices.");
    }
  }
  function scaled(amount: number | null) {
    const total = amount! * input.quantity;
    if (!Number.isSafeInteger(total)) throw new Error("This capacity price is too large.");
    return total;
  }
  const price = combinedMembershipPrice([input.basePrice, { ...input.batchPrice,
    initialAmountMinor: scaled(input.batchPrice.initialAmountMinor),
    renewalAmountMinor: scaled(input.batchPrice.renewalAmountMinor) }]);
  const capacity = combineCoachStudentCapacity(input.baseCapacity, input.quantity === 0 ? [] : [{
    additionalStudentsPerBatch: input.additionalStudentsPerBatch, quantity: input.quantity,
  }]);
  return { version: 1 as const, quantity: input.quantity, capacity, price };
}

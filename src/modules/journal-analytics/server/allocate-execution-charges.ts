import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalAnalyticsFeePolicyCandidate } from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import {
  addExactDecimals,
  compareExactDecimals,
  exactDecimalFromUnits,
  exactPowerOfTen,
  parseExactDecimal,
} from "./exact-analytics-math";

export const JOURNAL_ANALYTICS_FEE_POLICY_VERSION =
  "journal_fee_sign_policies_v1" as const;

type SupportedFeePolicy = "negative_cost_positive_credit_v1";

const feePolicyRegistry = Object.freeze(new Map<string, SupportedFeePolicy>([
  [
    JSON.stringify([
      "ibkr",
      "ibkr_activity_statement",
      "ibkr_activity_statement_v1",
    ]),
    "negative_cost_positive_credit_v1",
  ],
]));

export type ExecutionChargeAllocationInput = Readonly<{
  executionId: string;
  executionVersionId: string;
  executionQuantityDecimal: string;
  feesDecimal: string | null;
  feeCurrency: string | null;
  feeSignConvention:
    | "not_reported"
    | "broker_reported_signed"
    | "cash_effect";
  feePolicyCandidates: readonly JournalAnalyticsFeePolicyCandidate[];
  allocations: readonly Readonly<{
    allocationId: string;
    allocationSequence: number;
    quantityDecimal: string;
  }>[];
}>;

export type AllocatedExecutionCharge = Readonly<{
  allocationId: string;
  allocatedFeeUnits: string;
  feeScale: number;
  signedChargeCashEffectDecimal: string;
  chargeCostDecimal: string;
  chargeCreditDecimal: string;
}>;

export type ExecutionChargeAllocationResult =
  | Readonly<{
      state: "complete";
      policyVersion: typeof JOURNAL_ANALYTICS_FEE_POLICY_VERSION;
      resolvedPolicy: SupportedFeePolicy;
      feeCurrency: string;
      originalFeeUnits: string;
      feeScale: number;
      allocations: readonly AllocatedExecutionCharge[];
    }>
  | Readonly<{
      state: "unavailable";
      policyVersion: typeof JOURNAL_ANALYTICS_FEE_POLICY_VERSION;
      reasonCode:
        | "fee_not_reported"
        | "fee_sign_policy_unsupported"
        | "fee_sign_policy_conflict";
      allocations: readonly AllocatedExecutionCharge[];
    }>;

function unavailable(
  reasonCode: Extract<
    ExecutionChargeAllocationResult,
    { state: "unavailable" }
  >["reasonCode"],
): ExecutionChargeAllocationResult {
  return Object.freeze({
    state: "unavailable" as const,
    policyVersion: JOURNAL_ANALYTICS_FEE_POLICY_VERSION,
    reasonCode,
    allocations: Object.freeze([]),
  });
}

function resolvePolicy(
  input: ExecutionChargeAllocationInput,
): SupportedFeePolicy | ExecutionChargeAllocationResult {
  if (
    input.feesDecimal === null ||
    input.feeCurrency === null ||
    input.feeSignConvention === "not_reported"
  ) {
    return unavailable("fee_not_reported");
  }
  if (input.feeSignConvention === "cash_effect") {
    return "negative_cost_positive_credit_v1";
  }
  const brokerCandidates = input.feePolicyCandidates.filter(
    (candidate) => candidate.provenanceKind === "broker",
  );
  if (brokerCandidates.length === 0) {
    return unavailable("fee_sign_policy_unsupported");
  }
  const policies = brokerCandidates.map((candidate) => feePolicyRegistry.get(
    JSON.stringify([
      candidate.sourceSystem,
      candidate.adapterId,
      candidate.adapterVersion,
    ]),
  ) ?? null);
  if (policies.some((policy) => policy === null)) {
    return unavailable("fee_sign_policy_unsupported");
  }
  if (new Set(policies).size !== 1) {
    return unavailable("fee_sign_policy_conflict");
  }
  return policies[0] as SupportedFeePolicy;
}

export function allocateExecutionCharges(
  input: ExecutionChargeAllocationInput,
): ExecutionChargeAllocationResult {
  if (input.allocations.length === 0) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_fee_allocation_empty",
    });
  }
  const allocationIds = new Set<string>();
  for (const allocation of input.allocations) {
    if (
      allocationIds.has(allocation.allocationId) ||
      !Number.isSafeInteger(allocation.allocationSequence) ||
      allocation.allocationSequence < 1
    ) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "analytics_fee_allocation_identity",
      });
    }
    allocationIds.add(allocation.allocationId);
  }
  const allocatedQuantity = input.allocations.reduce(
    (sum, allocation) => addExactDecimals(sum, allocation.quantityDecimal),
    "0",
  );
  if (
    compareExactDecimals(allocatedQuantity, input.executionQuantityDecimal) !== 0
  ) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_fee_allocation_quantity",
    });
  }
  const policy = resolvePolicy(input);
  if (typeof policy !== "string") return policy;
  const feeParts = parseExactDecimal(input.feesDecimal!);
  const exactZero = BigInt(0);
  const exactOne = BigInt(1);
  const absoluteFeeUnits = feeParts.units < exactZero
    ? -feeParts.units
    : feeParts.units;
  const quantityParts = input.allocations.map((allocation) => ({
    allocation,
    parts: parseExactDecimal(allocation.quantityDecimal),
  }));
  if (quantityParts.some((entry) => entry.parts.units <= exactZero)) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_fee_allocation_quantity",
    });
  }
  const quantityScale = Math.max(...quantityParts.map((entry) => entry.parts.scale));
  const quantities = quantityParts.map(({ allocation, parts }) => ({
    allocation,
    units: parts.units * exactPowerOfTen(quantityScale - parts.scale),
  }));
  const totalQuantityUnits = quantities.reduce(
    (sum, entry) => sum + entry.units,
    exactZero,
  );
  if (totalQuantityUnits <= exactZero) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_fee_allocation_quantity",
    });
  }
  const shares = quantities.map(({ allocation, units }) => {
    const numerator = absoluteFeeUnits * units;
    return {
      allocation,
      allocatedUnits: numerator / totalQuantityUnits,
      remainder: numerator % totalQuantityUnits,
    };
  });
  const floorTotal = shares.reduce(
    (sum, share) => sum + share.allocatedUnits,
    exactZero,
  );
  const remaining = absoluteFeeUnits - floorTotal;
  if (remaining < exactZero || remaining >= BigInt(shares.length)) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_fee_allocation_remainder",
    });
  }
  const remainderOrder = [...shares].sort((left, right) => {
    if (left.remainder !== right.remainder) {
      return left.remainder > right.remainder ? -1 : 1;
    }
    return left.allocation.allocationSequence - right.allocation.allocationSequence ||
      left.allocation.allocationId.localeCompare(right.allocation.allocationId);
  });
  for (let index = 0; index < Number(remaining); index += 1) {
    remainderOrder[index].allocatedUnits += exactOne;
  }
  const negative = feeParts.units < exactZero;
  const allocations = Object.freeze(shares
    .sort((left, right) =>
      left.allocation.allocationSequence - right.allocation.allocationSequence ||
      left.allocation.allocationId.localeCompare(right.allocation.allocationId))
    .map((share) => {
      const signedUnits = negative ? -share.allocatedUnits : share.allocatedUnits;
      const signed = exactDecimalFromUnits(signedUnits, feeParts.scale);
      return Object.freeze({
        allocationId: share.allocation.allocationId,
        allocatedFeeUnits: signedUnits.toString(),
        feeScale: feeParts.scale,
        signedChargeCashEffectDecimal: signed,
        chargeCostDecimal: negative
          ? exactDecimalFromUnits(share.allocatedUnits, feeParts.scale)
          : "0",
        chargeCreditDecimal: negative
          ? "0"
          : exactDecimalFromUnits(share.allocatedUnits, feeParts.scale),
      });
    }));
  const conservedUnits = allocations.reduce(
    (sum, allocation) => sum + BigInt(allocation.allocatedFeeUnits),
    exactZero,
  );
  if (conservedUnits !== feeParts.units) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_fee_allocation_conservation",
    });
  }
  return Object.freeze({
    state: "complete" as const,
    policyVersion: JOURNAL_ANALYTICS_FEE_POLICY_VERSION,
    resolvedPolicy: policy,
    feeCurrency: input.feeCurrency!,
    originalFeeUnits: feeParts.units.toString(),
    feeScale: feeParts.scale,
    allocations,
  });
}

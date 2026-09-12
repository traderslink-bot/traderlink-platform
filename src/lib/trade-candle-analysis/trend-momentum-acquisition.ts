import {
  hasCompletedIndicatorCoverage,
  inspectIndicatorWarmup,
  type IndicatorHistoryInput,
  type IndicatorHistoryRange,
  type IndicatorWarmupRequirement,
} from "./trend-momentum-history";

export type IndicatorRangeReceipt = Readonly<{
  range: IndicatorHistoryRange;
  attempts: number;
  status: "complete" | "no_history" | "retryable_failure" | "permanent_failure";
  retryAt: number | null;
}>;

export type IndicatorAcquisitionDecision = Readonly<{
  action: "enough_bars" | "fetch_range" | "wait" | "history_exhausted" | "request_failed";
  range: IndicatorHistoryRange | null;
  retryAt: number | null;
  inventory: ReturnType<typeof inspectIndicatorWarmup>;
}>;

/**
 * One decision per worker pass; never performs network I/O or charges allowance.
 * Caller supplies exchange-calendar ranges and scoped, revision-matched receipts.
 * The worker must lease the shared symbol/session before acting on fetch_range.
 */
export function planIndicatorHistoryAcquisition(input: Readonly<{
  history: IndicatorHistoryInput;
  /** Earliest execution needing context, not the end of the acquired session. */
  requiredAt: number;
  requirements: readonly IndicatorWarmupRequirement[];
  candidateRanges: readonly IndicatorHistoryRange[];
  receipts: readonly IndicatorRangeReceipt[];
  maxRanges: number;
  maxAttemptsPerRange: number;
  now: number;
}>): IndicatorAcquisitionDecision {
  if (!Number.isSafeInteger(input.now) || input.now <= 0 ||
      !Number.isFinite(input.requiredAt) || input.requiredAt <= 0 || input.requiredAt > input.history.asOf ||
      !Number.isSafeInteger(input.maxRanges) || input.maxRanges < 1 || input.maxRanges > 30 ||
      !Number.isSafeInteger(input.maxAttemptsPerRange) || input.maxAttemptsPerRange < 1 ||
      input.maxAttemptsPerRange > 5 || input.requirements.length === 0) {
    throw new Error("indicator_acquisition_policy_invalid");
  }
  const inventory = inspectIndicatorWarmup({ ...input.history, asOf: Math.floor(input.requiredAt) }, input.requirements);
  const decision = (action: IndicatorAcquisitionDecision["action"],
    range: IndicatorHistoryRange | null = null, retryAt: number | null = null): IndicatorAcquisitionDecision =>
    Object.freeze({ action, range: range ? Object.freeze({ ...range }) : null, retryAt, inventory });
  const key = (range: IndicatorHistoryRange) => `${range.start}:${range.endExclusive}`;
  const validRange = (range: IndicatorHistoryRange) => Number.isSafeInteger(range.start) && range.start > 0 &&
    range.start % 60 === 0 && Number.isSafeInteger(range.endExclusive) && range.endExclusive % 60 === 0 &&
    range.endExclusive > range.start && range.endExclusive - range.start <= 86400 &&
    range.endExclusive <= input.history.asOf;
  const ranges = [...input.candidateRanges].sort((a, b) => b.endExclusive - a.endExclusive);
  const unique = new Set<string>();
  for (let index = 0; index < ranges.length; index++) {
    const range = ranges[index];
    if (!validRange(range) || unique.has(key(range)) ||
        (index > 0 && range.endExclusive > ranges[index - 1].start)) {
      throw new Error("indicator_acquisition_ranges_invalid");
    }
    unique.add(key(range));
  }
  const receipts = new Map<string, IndicatorRangeReceipt>();
  for (const receipt of input.receipts) {
    if (!validRange(receipt.range) || !unique.has(key(receipt.range)) || receipts.has(key(receipt.range)) ||
        !Number.isSafeInteger(receipt.attempts) || receipt.attempts < 1 ||
        (receipt.status === "retryable_failure" &&
          (!Number.isSafeInteger(receipt.retryAt) || receipt.retryAt! <= 0))) {
      throw new Error("indicator_acquisition_receipt_invalid");
    }
    receipts.set(key(receipt.range), receipt);
  }
  // Sufficient bar count is not a claim of converged indicators or full coverage.
  if (inventory.every((frame) => frame.missingBars === 0)) return decision("enough_bars");
  for (const range of ranges.slice(0, input.maxRanges)) {
    if (hasCompletedIndicatorCoverage(input.history.completedRanges, range.start, range.endExclusive)) continue;
    const receipt = receipts.get(key(range));
    if (receipt?.status === "complete" || receipt?.status === "no_history") {
      // Complete response (including empty/sparse) must have its coverage persisted.
      throw new Error("indicator_acquisition_receipt_coverage_missing");
    }
    if (receipt?.status === "permanent_failure" ||
        (receipt && receipt.attempts >= input.maxAttemptsPerRange)) return decision("request_failed", range);
    if (receipt?.status === "retryable_failure" && receipt.retryAt! > input.now) {
      return decision("wait", range, receipt.retryAt);
    }
    return decision("fetch_range", range);
  }
  return decision("history_exhausted");
}

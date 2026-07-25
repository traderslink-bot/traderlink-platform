import type { TradeQueryResult } from "../contracts/query-result";

// This capability is deliberately not exported from the public query barrel.
// A result obtains it only after the generic executor has opened the verified
// gateway, normalized its plan, and built the complete result graph.
const verifiedExecutions = new WeakSet<object>();

export function markVerifiedTradeQueryExecution(
  result: TradeQueryResult,
): TradeQueryResult {
  verifiedExecutions.add(result);
  return result;
}

export function isVerifiedTradeQueryExecution(
  input: unknown,
): input is TradeQueryResult {
  return typeof input === "object" && input !== null &&
    verifiedExecutions.has(input);
}

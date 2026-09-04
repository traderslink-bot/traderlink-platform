import type {
  JournalLogicalTradeMergeSelection,
  JournalLogicalTradeStyle,
} from "../../contracts/journal-logical-trade-contracts";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID");
  }
  return value as Record<string, unknown>;
}

function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "revision_invalid" });
  }
  return Number(value);
}

export function parseJournalLogicalTradeMergeSelection(
  value: unknown,
): JournalLogicalTradeMergeSelection {
  const body = record(value);
  const refs = body.candidateRefs;
  const style = body.tradeStyle;
  if (!Array.isArray(refs) || refs.length === 0 || refs.length > 50 ||
    refs.some((ref) => typeof ref !== "string" || !/^[0-9a-f]{64}$/u.test(ref)) ||
    (style !== "day" && style !== "swing")) {
    platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID");
  }
  return Object.freeze({
    expectedCurrentRevision: revision(body.expectedCurrentRevision),
    candidateRefs: Object.freeze([...new Set(refs as string[])]),
    tradeStyle: style as JournalLogicalTradeStyle,
  });
}

export function parseJournalLogicalTradeUnmergeRevision(value: unknown): number {
  return revision(record(value).expectedCurrentRevision);
}

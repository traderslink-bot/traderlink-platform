import { describe, expect, it, vi } from "vitest";

import type { JournalAnalyticsFactSet, JournalAnalyticsRoundTripFact } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalRoundTripNoteRecord, JournalTagRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  CoachAiChatFactualToolError,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatTradeDetailService } from "./coach-ai-chat-trade-detail-service";

const userId = "20000000-0000-4000-8000-000000000001";
const workspaceId = "20000000-0000-4000-8000-000000000002";
const accountId = "20000000-0000-4000-8000-000000000003";
const otherAccountId = "20000000-0000-4000-8000-000000000004";
const roundTripId = "20000000-0000-4000-8000-000000000005";

const scope: WorkspaceAccessScope = Object.freeze({
  userId,
  workspaceId,
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId, otherAccountId]),
  activeAccountId: accountId,
});

const trade = Object.freeze({
  roundTripId,
  accountId,
  displayedSymbol: "TLNK",
  assetClass: "stock",
  tradeCurrency: "USD",
  direction: "long",
  openedAtUtc: "2026-08-04T13:30:00.000Z",
  closedAtUtc: "2026-08-04T14:00:00.000Z",
  finalPositionDecimal: "0",
  projectionState: "ready_closed",
  coverageReasonCode: null,
  allocations: Object.freeze([
    Object.freeze({ allocationSequence: 2, allocationRole: "closing", executedAtUtc: "2026-08-04T14:00:00.000Z", side: "sell", allocatedQuantityDecimal: "5", priceDecimal: "11", feesDecimal: "1", feeCurrency: "USD", factCompleteness: "complete" }),
    Object.freeze({ allocationSequence: 1, allocationRole: "opening", executedAtUtc: "2026-08-04T13:30:00.000Z", side: "buy", allocatedQuantityDecimal: "5", priceDecimal: "10", feesDecimal: "1", feeCurrency: "USD", factCompleteness: "complete" }),
  ]),
}) as unknown as JournalAnalyticsRoundTripFact;

function factSet(roundTrips: readonly JournalAnalyticsRoundTripFact[]): JournalAnalyticsFactSet {
  return Object.freeze({ sourceRevisionSha256: "fact-set-revision", roundTrips }) as JournalAnalyticsFactSet;
}

function subject(options: Readonly<{ includeAnnotations?: boolean; roundTrips?: readonly JournalAnalyticsRoundTripFact[] }> = {}) {
  const facts = { getJournalAnalyticsFactSet: vi.fn(() => factSet(options.roundTrips ?? [trade])) };
  const annotations = {
    readRoundTripNotes: vi.fn((): Readonly<Record<string, JournalRoundTripNoteRecord>> => options.includeAnnotations ? {
      [roundTripId]: {
        tradeNote: "Kept risk small", technicalNote: "Waited for confirmation",
        updatedAtUtc: "2026-08-04T15:00:00.000Z",
      } as JournalRoundTripNoteRecord,
    } : {}),
    listTagsForRoundTrips: vi.fn((): Readonly<Record<string, readonly JournalTagRecord[]>> => options.includeAnnotations ? {
      [roundTripId]: [{ name: "A setup" } as JournalTagRecord, { name: "Trend" } as JournalTagRecord],
    } : {}),
  };
  return { facts, annotations, service: new CoachAiChatTradeDetailService(facts, annotations) };
}

const request = Object.freeze({
  contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  toolName: "get_closed_trade_details" as const,
  roundTripId,
});

describe("CoachAiChatTradeDetailService", () => {
  it("returns ordered canonical allocation facts and optional current note/tags without private identifiers", () => {
    const { facts, service } = subject({ includeAnnotations: true });
    const response = service.getClosedTradeDetails(scope, accountId, request);
    expect(facts.getJournalAnalyticsFactSet).toHaveBeenCalledWith(scope, expect.objectContaining({ accountIds: [accountId] }));
    expect(response.result.executions.map((execution) => execution.allocationSequence)).toEqual([1, 2]);
    expect(response.result.note?.tradeNote).toBe("Kept risk small");
    expect(response.result.tags).toEqual(["A setup", "Trend"]);
    expect(JSON.stringify(response)).not.toContain("accountId");
    expect(JSON.stringify(response)).not.toContain("executionId");
    expect(JSON.stringify(response)).not.toContain("technicalNote");
    expect(JSON.stringify(response)).not.toContain("Waited for confirmation");
  });

  it("returns null and empty metadata when a current note or tags do not exist", () => {
    const { service } = subject();
    const response = service.getClosedTradeDetails(scope, accountId, request);
    expect(response.result.note).toBeNull();
    expect(response.result.tags).toEqual([]);
  });

  it("denies cross-account and nonexistent trade IDs with the same privacy-safe error", () => {
    const { service } = subject();
    const getError = (selectedAccountId: string, targetRoundTripId: string) => {
      try {
        service.getClosedTradeDetails(scope, selectedAccountId, { ...request, roundTripId: targetRoundTripId });
      } catch (error) {
        return error as CoachAiChatFactualToolError;
      }
      throw new Error("expected an error");
    };
    const crossAccount = getError(otherAccountId, roundTripId);
    const nonexistent = getError(accountId, "20000000-0000-4000-8000-000000000099");
    expect(crossAccount.code).toBe("not_found");
    expect(crossAccount.message).toBe(nonexistent.message);
    expect(crossAccount.message).not.toContain(roundTripId);
  });
});

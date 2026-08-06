import { describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from "../contracts/coach-ai-chat-factual-tool-contracts";
import { COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES, CoachAiChatFactualToolDispatcher } from "./coach-ai-chat-factual-tool-dispatcher";

const scope: WorkspaceAccessScope = Object.freeze({
  userId: "50000000-0000-4000-8000-000000000001", workspaceId: "50000000-0000-4000-8000-000000000002",
  workspaceRole: "owner", allowedAccountIds: Object.freeze(["50000000-0000-4000-8000-000000000003"]), activeAccountId: "50000000-0000-4000-8000-000000000003",
});

function subject(serialized = "small") {
  const response = Object.freeze({ contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
    toolName: "summarize_closed_trades" as const, result: { preserved: serialized } }) as never;
  const tools = { summarizeClosedTrades: vi.fn(() => response), groupClosedTrades: vi.fn(), listClosedTrades: vi.fn() };
  const details = { getClosedTradeDetails: vi.fn() };
  return { tools, dispatcher: new CoachAiChatFactualToolDispatcher(tools as never, details as never, scope, scope.activeAccountId!, "2026-08-05T12:00:00.000Z") };
}

describe("CoachAiChatFactualToolDispatcher", () => {
  it("records each exact request/result snapshot while retaining factual states", () => {
    const { dispatcher, tools } = subject();
    const response = dispatcher.dispatch("factual-1", { contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "summarize_closed_trades", metricIds: ["net_pnl"], moneyBasis: "net" });
    expect(tools.summarizeClosedTrades).toHaveBeenCalledWith(scope, scope.activeAccountId, expect.objectContaining({ metricIds: ["net_pnl"] }), "2026-08-05T12:00:00.000Z");
    expect(dispatcher.snapshotsForPersistence()).toEqual([expect.objectContaining({ toolCallId: "factual-1", result: response })]);
  });

  it("fails rather than truncating a result that would exceed the generation-wide cap", () => {
    const { dispatcher } = subject("x".repeat(COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES));
    expect(() => dispatcher.dispatch("factual-1", { contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "summarize_closed_trades", metricIds: ["net_pnl"], moneyBasis: "net" })).toThrow("shorter period or narrower filters");
    expect(dispatcher.snapshotsForPersistence()).toEqual([]);
  });
});

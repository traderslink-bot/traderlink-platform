import { describe, expect, it } from "vitest";

import {
  COACH_AI_CHAT_PAGE_CONTEXT_AUTHORITY,
  COACH_AI_CHAT_PAGE_CONTEXT_CONTRACT_VERSION,
} from "../contracts/ai-chat-page-context-contracts";
import {
  COACH_AI_CHAT_PAGE_CONTEXT_MAX_PATH_LENGTH,
  CoachAiChatPageContextValidationError,
  parseCoachAiChatPageContext,
} from "./coach-ai-chat-page-context";

describe("AI Chat page context", () => {
  it.each([
    ["/workspace", "workspace", "/workspace"],
    ["/trade-tracker/swings", "swing_trade_tracker", "/trade-tracker/swings"],
    ["/analytics/results", "analytics_results", "/analytics/results"],
    ["/analytics/trade-analyzer/day/mfe-mae", "trade_analyzer_mfe_mae", "/analytics/trade-analyzer/day/mfe-mae"],
    ["/data-decisions", "data_decisions", "/data-decisions"],
    ["/account/trading", "account_trading", "/account/trading"],
  ])("accepts the allowlisted product route %s", (pathname, feature, canonicalPath) => {
    expect(parseCoachAiChatPageContext(pathname)).toEqual({
      contractVersion: COACH_AI_CHAT_PAGE_CONTEXT_CONTRACT_VERSION,
      authority: COACH_AI_CHAT_PAGE_CONTEXT_AUTHORITY,
      feature,
      featureLabel: expect.any(String),
      canonicalPath,
      tradingDate: null,
    });
  });

  it("keeps only a valid Daily Trade Tracker date", () => {
    expect(parseCoachAiChatPageContext("/trade-tracker/2026-08-15")).toEqual({
      contractVersion: COACH_AI_CHAT_PAGE_CONTEXT_CONTRACT_VERSION,
      authority: COACH_AI_CHAT_PAGE_CONTEXT_AUTHORITY,
      feature: "daily_trade_tracker",
      featureLabel: "Daily Trade Tracker",
      canonicalPath: "/trade-tracker/2026-08-15",
      tradingDate: "2026-08-15",
    });
    expect(parseCoachAiChatPageContext("/trade-tracker/2026-02-30")).toBeNull();
  });

  it.each([
    ["/account", "account_preferences", "/account/preferences"],
    ["/trades/ticker", "analytics_results", "/analytics/results"],
    ["/trades/roundtrips", "analytics_execution", "/analytics/execution"],
    ["/analytics/trade-analysis", "trade_analyzer_day", "/analytics/trade-analyzer/day"],
    ["/reflection-loop", "ai_reviews", "/ai-reviews"],
  ])("reduces compatibility path %s to its public destination", (pathname, feature, canonicalPath) => {
    expect(parseCoachAiChatPageContext(pathname)).toEqual(expect.objectContaining({
      feature,
      canonicalPath,
    }));
  });

  it("accepts maintained Help Center routes without retaining a guide slug", () => {
    expect(parseCoachAiChatPageContext("/help/trade-analyzer/mfe-mae")).toEqual(
      expect.objectContaining({
        feature: "help_center",
        canonicalPath: "/help/trade-analyzer",
      }),
    );
    expect(parseCoachAiChatPageContext("/help/not-a-current-collection")).toBeNull();
  });

  it("accepts a saved-review page without retaining its opaque identifier", () => {
    const reviewId = "c473675e-9085-4f12-a665-12766d8302fd";
    const result = parseCoachAiChatPageContext(`/ai-reviews/weekly/${reviewId}`);
    expect(result).toEqual(expect.objectContaining({
      feature: "ai_reviews",
      canonicalPath: "/ai-reviews",
    }));
    expect(JSON.stringify(result)).not.toContain(reviewId);
  });

  it.each([
    "/workspace/readiness",
    "/admin/journal",
    "/ai-reviews/benchmark-preview",
    "/api/platform/health",
    "/trade-tracker/swings/not-a-date",
  ])("does not expose operational, owner-only, development, API, or unknown route %s", (pathname) => {
    expect(parseCoachAiChatPageContext(pathname)).toBeNull();
  });

  it.each([
    "https://traderslink.pro/workspace",
    "/calendar?month=2026-08",
    "/calendar#day",
    "/workspace\\secret",
    "/help/%2e%2e/admin",
    "/workspace\u0000private",
    `/${"x".repeat(COACH_AI_CHAT_PAGE_CONTEXT_MAX_PATH_LENGTH)}`,
  ])("rejects malformed pathname input without retaining it: %s", (pathname) => {
    expect(() => parseCoachAiChatPageContext(pathname)).toThrow(
      CoachAiChatPageContextValidationError,
    );
  });

  it("keeps the optional hint backward compatible", () => {
    expect(parseCoachAiChatPageContext(undefined)).toBeNull();
    expect(parseCoachAiChatPageContext(null)).toBeNull();
    expect(() => parseCoachAiChatPageContext(42)).toThrow(
      CoachAiChatPageContextValidationError,
    );
  });

  it("returns an immutable conversational hint rather than factual evidence", () => {
    const result = parseCoachAiChatPageContext("/calendar/");
    expect(result?.authority).toBe("conversation_hint_only");
    expect(Object.isFrozen(result)).toBe(true);
  });
});

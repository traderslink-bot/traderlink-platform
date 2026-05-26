import { describe, expect, it } from "vitest";
import {
  classifyTradeAnalysisFailure,
  classifyTradeAnalysisValidationFailure,
} from "../failures/classify-trade-analysis-failure";
import { validateTradeAnalysisRequest } from "../request/trade-analysis-request-contract";

describe("classifyTradeAnalysisFailure", () => {
  it("classifies unsupported providers from local validation", () => {
    const validation = validateTradeAnalysisRequest({
      symbol: "ABCD",
      tradeDirection: "long",
      sessionContext: {
        sessionDate: "2026-05-01",
        sessionBucket: "market_open",
      },
      provider: {
        preferredProvider: "made_up",
      },
      executions: [
        {
          symbol: "ABCD",
          timestamp: "2026-05-01T13:35:00.000Z",
          side: "buy",
          shares: 100,
          price: 1.23,
        },
      ],
    });

    expect(classifyTradeAnalysisValidationFailure(validation)).toMatchObject({
      code: "unsupported_provider",
      source: "local_validation",
      retryable: false,
      userAction: "Use ibkr or stub as the provider.",
    });
  });

  it("classifies provider authentication failures", () => {
    expect(
      classifyTradeAnalysisFailure(
        new Error("IBKR authentication failed: not logged in"),
      ),
    ).toMatchObject({
      code: "provider_auth_failed",
      source: "provider",
      retryable: true,
    });
  });

  it("classifies missing candles separately from generic shared failures", () => {
    expect(
      classifyTradeAnalysisFailure(
        new Error("levels-system error: no candles returned for ABCD"),
      ),
    ).toMatchObject({
      code: "no_candles_found",
      source: "provider",
    });
    expect(
      classifyTradeAnalysisFailure(
        new Error("Durable candle warehouse miss for E2E123 5m; found 0/91 candles."),
      ),
    ).toMatchObject({
      code: "no_candles_found",
      source: "provider",
    });
  });

  it("classifies missing daily/4h market context separately from generic shared failures", () => {
    expect(
      classifyTradeAnalysisFailure(
        new Error(
          "Cannot build full support/resistance context for AVEX: daily and 4h candles are required. Higher-timeframe diagnostics: daily: Durable candle warehouse miss for AVEX daily; found 1/520 candles.",
        ),
      ),
    ).toMatchObject({
      code: "insufficient_market_context",
      source: "levels_system",
      retryable: false,
    });
  });

  it("classifies future-candle guard failures", () => {
    expect(
      classifyTradeAnalysisFailure(
        "Future-candle leakage guard rejected asOfTimestamp",
      ),
    ).toMatchObject({
      code: "future_candle_guard_triggered",
      source: "levels_system",
    });
  });

  it("falls back to shared engine or unknown classifications", () => {
    expect(
      classifyTradeAnalysisFailure("levels-system unexpected pivot failure"),
    ).toMatchObject({
      code: "shared_engine_failure",
    });
    expect(classifyTradeAnalysisFailure("something odd")).toMatchObject({
      code: "unknown_failure",
    });
  });
});
